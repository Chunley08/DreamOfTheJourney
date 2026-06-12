// ============================================================
//  PUBLIC WALL STORAGE (Redis) — saves each public comment +
//  Scorch's reply so EVERYONE sees them. Newest 200 are kept;
//  older ones auto-delete. Reads creds from whichever names the
//  Vercel/Upstash integration created.
// ============================================================
// Personas are loaded LAZILY via dynamic import inside the handler. A static
// top-level import crashes this entire function at load time if anything in the
// personas/ graph fails to resolve (wrong path, case mismatch, module-type
// mismatch) — which silently takes EVERY character offline at once. Dynamic
// import lets us catch that, fall back to a generic persona, and report the
// real reason in `debug` instead of returning blanket 500s.
let _personasCache = null;
let _personaLoadErr = null;
async function getPersonas() {
  if (_personasCache) return _personasCache;
  try {
    const mod = await import("./index.js");
    _personasCache = (mod && mod.personas) ? mod.personas : {};
    if (!Object.keys(_personasCache).length) {
      _personaLoadErr = "personas/index.js loaded but exported no personas";
    }
  } catch (e) {
    _personaLoadErr = "persona load failed: " + String((e && e.message) || e);
    _personasCache = {};
  }
  return _personasCache;
}

// Each character gets their OWN comment wall (their own "drawer").
// Scorch stays on the original "scorch:wall" key so his existing comments
// are preserved; every other character gets "wall:<character>".
function wallKeyFor(character) {
  const c = String(character || "scorch").toLowerCase().trim();
  return c === "scorch" ? "scorch:wall" : "wall:" + c;
}
const WALL_MAX = 200; // FIX: was 100 — comments.js reads up to 200, so the trim was silently clipping the wall to half that
function _redisCreds() {
  return {
    url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}
async function _redis(cmd) {
  const { url, token } = _redisCreds();
  if (!url || !token) return { ok: false, error: "no-redis-env" };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, result: data.result, error: data.error };
}
async function saveToWall(record, character) {
  // push newest to the head, then trim to the newest WALL_MAX
  const key = wallKeyFor(character);
  const push = await _redis(["LPUSH", key, JSON.stringify(record)]);
  if (!push.ok) return { ok: false, error: push.error };
  await _redis(["LTRIM", key, "0", String(WALL_MAX - 1)]);
  return { ok: true };
}

// ============================================================
//  BLOCKING — Scorch's hard limit. Session-only: a block is tied
//  ONLY to the visitor's per-session device id (clientId), which
//  the front end stores in sessionStorage and wipes when the tab
//  closes. So getting blocked is a fun, temporary thing — open a
//  fresh tab and you're a clean slate. We intentionally do NOT
//  block by name (that would survive across sessions).
// ============================================================
// Blocking is also per-character: getting blocked by Shane doesn't block
// you from Scorch. Scorch keeps the original key; others get "blocked:<char>".
function blockKeyFor(character) {
  const c = String(character || "scorch").toLowerCase().trim();
  return c === "scorch" ? "scorch:blocked" : "blocked:" + c;
}
const ckey = (cid) => "c:" + String(cid || "");

async function isBlocked(name, clientId, character) {
  // session-only: device id is the only thing we check.
  if (!clientId) return null;
  const got = await _redis(["HGET", blockKeyFor(character), ckey(clientId)]);
  if (got.ok && got.result) {
    try { return JSON.parse(got.result); } catch (e) { return { reason: "" }; }
  }
  return null;
}

async function blockUser(name, clientId, reason, character) {
  // session-only: only persist against the session device id, never the name.
  if (!clientId) return false;
  const record = JSON.stringify({
    name: (name || "Anonymous").slice(0, 40),
    clientId: clientId || "",
    reason: String(reason || "").slice(0, 200),
    ts: Date.now(),
  });
  await _redis(["HSET", blockKeyFor(character), ckey(clientId), record]);
  return true;
}

// ============================================================
//  PERMANENT MEMORY  ("remembers you forever", per character)
//
//  We DON'T hoard every message. We keep a small, bounded record:
//    { summary, recent[], count, lastSeen, name }
//  - recent[]  = last RECENT_KEEP messages, word-for-word (in-the-moment)
//  - summary   = one short paragraph: who this person is to the character.
//                Rewritten by the AI every SUMMARIZE_EVERY messages so it
//                NEVER grows — keeps the AI from being overwhelmed.
//  - lastSeen  = bumped every visit; the key auto-expires after MEMORY_TTL
//                of total silence (one-time ghosts get cleaned up, but
//                anyone who keeps visiting is remembered ~forever).
//
//  Recognized by NAME first (follows them across devices), else by the
//  per-device clientId (so anonymous returners are still known).
//  Per character: scorch's memory of you is separate from shane's.
// ============================================================
const RECENT_KEEP = 10;        // raw messages kept word-for-word
const SUMMARIZE_EVERY = 12;    // re-summarize after this many interactions
const MEMORY_TTL = 60 * 60 * 24 * 183; // ~6 months, in seconds

function memKeyFor(character, name, clientId) {
  const c = String(character || "scorch").toLowerCase().trim();
  const nm = String(name || "").toLowerCase().trim();
  const who = (nm && !/^anon(ymous)?$/.test(nm)) ? "n:" + nm : "d:" + String(clientId || "nobody");
  return "mem:" + c + ":" + who;
}

async function readMemory(character, name, clientId) {
  if (!name && !clientId) return null;
  const got = await _redis(["GET", memKeyFor(character, name, clientId)]);
  if (got.ok && got.result) {
    try { return JSON.parse(got.result); } catch (e) { return null; }
  }
  return null;
}

// Save/refresh memory after an interaction. Appends to recent[], bumps the
// count, refreshes the 6-month clock. Every SUMMARIZE_EVERY interactions it
// folds everything into a fresh short summary. Summary failures are non-fatal.
// ============================================================
//  GIBBERISH GUARD — free models occasionally return junk: leaked
//  <think> reasoning blocks, wrong-language tokens, repetition
//  loops, keyboard mash. Everything the model says passes through
//  scrubModelText() (cleanup) and looksLikeGibberish() (reject).
//  Rejected text is treated like "model busy": retried once, then
//  dropped — it never reaches the wall, DMs, or memory/summaries.
// ============================================================
function scrubModelText(raw) {
  if (!raw) return "";
  let t = String(raw);
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "");        // closed reasoning blocks
  t = t.replace(/^[\s\S]*?<\/think>/i, (m) => (m.length < t.length ? "" : m)); // unclosed leading block
  t = t.replace(/<think>[\s\S]*$/i, "");                   // unclosed trailing block
  t = t.replace(/<\|[^|>]{0,40}\|>/g, "");                 // <|im_end|> style special tokens
  t = t.replace(/\[\/?INST\]|<\/?s>/gi, "");             // llama-style markers
  t = t.replace(/^```[a-z]*\s*|\s*```$/gi, "");            // wrapping code fences
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, ""); // control + replacement chars
  t = t.trim();
  // strip a leading speaker label like "Kayla:" / "Scorch:"
  t = t.replace(/^[A-Z][a-zA-Z]{1,15}:\s+/, "");
  return t.trim();
}

function looksLikeGibberish(text) {
  const t = String(text || "").trim();
  if (t.length < 2) return true;
  if (t.length > 1200) return true;                          // replies are 1-3 sentences; this is a runaway
  if (/[\uFFFD\u0000-\u0008]/.test(t)) return true;       // junk bytes survived
  if (/(.)\1{9,}/.test(t)) return true;                     // same char 10+ in a row
  if (/(.{6,}?)\1{4,}/s.test(t.slice(0, 1500))) return true; // a chunk repeated 5+ times (loop)
  if (/\{\s*"role"\s*:|BEGININPUT|ENDCONTEXT|<\|im_start\|>/i.test(t)) return true; // leaked prompt/JSON
  // script check: too many non-Latin letters = wrong-language leakage
  const letters = t.match(/\p{L}/gu) || [];
  if (letters.length >= 8) {
    const latin = t.match(/\p{Script=Latin}/gu) || [];
    if (latin.length / letters.length < 0.7) return true;
  }
  // keyboard-mash check: long letter runs with almost no vowels
  if (letters.length >= 40) {
    const vowels = t.match(/[aeiouyAEIOUY]/g) || [];
    if (vowels.length / letters.length < 0.18) return true;
  }
  // token-soup check: absurd average word length (URLs don't count)
  const words = t.split(/\s+/).filter((w) => w && !/^https?:/.test(w));
  if (words.length >= 4) {
    const avg = words.reduce((n, w) => n + w.length, 0) / words.length;
    if (avg > 14) return true;
  }
  if (words.some((w) => w.length > 30)) return true;
  return false;
}

async function writeMemory(character, name, clientId, userMsg, charReply, base, NAME, summarize) {
  if (!name && !clientId) return;
  const key = memKeyFor(character, name, clientId);
  let mem = await readMemory(character, name, clientId);
  if (!mem) mem = { summary: "", recent: [], count: 0, name: name || "Anonymous", lastSeen: 0 };

  // GIBBERISH GUARD: nothing unreadable gets into the memory the
  // summarizer later folds into the permanent note.
  if (userMsg) {
    const u = scrubModelText(userMsg);
    mem.recent.push("them: " + (looksLikeGibberish(u) ? "(typed something unreadable)" : u.slice(0, 240)));
  }
  if (charReply) {
    const c = scrubModelText(charReply);
    if (!looksLikeGibberish(c)) mem.recent.push(NAME + ": " + c.slice(0, 240));
  }
  mem.count = (mem.count || 0) + 1;
  mem.name = name || mem.name || "Anonymous";
  mem.lastSeen = Date.now();

  // fold recent history into the rolling summary on schedule
  if (summarize && mem.count % SUMMARIZE_EVERY === 0 && mem.recent.length) {
    try {
      const convo = mem.recent.join("\n");
      const sumRes = await summarize(
        `${base}\n\nYou are quietly updating your private mental note about a specific person you talk to, so you remember them next time. Your CURRENT note (may be blank):\n"${mem.summary || "(nothing yet)"}"\n\nRecent conversation with them:\n${convo}\n\nWrite an UPDATED short note (2-4 sentences MAX) capturing who this person is TO YOU, ${NAME}: their name if known, their vibe, how you feel about them, anything notable, whether you've clashed or clicked. Tight, in your own head-voice. Output ONLY the note.`
      );
      // GIBBERISH GUARD: a junk summary would poison the note forever —
      // reject it, keep the old summary AND the full recent[] so the next
      // scheduled pass retries with nothing lost.
      const cleanSum = scrubModelText(sumRes);
      if (cleanSum && !looksLikeGibberish(cleanSum)) {
        mem.summary = cleanSum.slice(0, 800);
        mem.recent = mem.recent.slice(-4); // keep a short tail; summary holds the rest
      }
    } catch (e) { /* summary failed (rate limit etc) — skip, retry next time */ }
  }

  if (mem.recent.length > RECENT_KEEP) mem.recent = mem.recent.slice(-RECENT_KEEP);
  await _redis(["SET", key, JSON.stringify(mem), "EX", String(MEMORY_TTL)]);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // mode: "comment" (public wall) or "dm" (private chat)
  // history: prior messages (for dm chat continuity)
  // pastComments: this username's earlier comments (for "remembering" them)
  // username: who is commenting
  const { character, comment, mode = "comment", history = [], pastComments = [], username = "", clientId = "",
          memId = "", parentId = null, threadContext = "", voteDir = "" } = req.body || {};
  // memory uses the PERSISTENT device id (survives tab close); fall back to the
  // session clientId if the page didn't send one. Blocking still uses clientId.
  const memDevice = memId || clientId;
  if (!comment && mode !== "vote-reaction") return res.status(400).json({ error: "No comment" });

  // ---- BLOCK GATE: if Scorch has blocked this person, refuse before doing anything ----
  {
    const b = await isBlocked(username, clientId, character);
    if (b) {
      return res.status(200).json({
        blocked: true,
        reply: null,
        reason: b.reason || "",
        notice: "message could not be sent — you've been blocked.",
      });
    }
  }

  const apiKey = process.env.OPENROUTER_KEY;

  // ============================================================
  //  MODEL — change this one line to switch models.
  //  Must be the exact slug from the model's OpenRouter page,
  //  including :free on the end if it's a free model.
  // ============================================================
  const MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";
  // FALLBACK CHAIN — strictly FREE, in order: best Scorch-voice first,
  // most-reliable last. Tried top to bottom when a model is down/busy.
  //  2. qwen3-next-80b   — solid generalist (the old primary)
  //  3. nemotron-3-super — big capacity; if replies start leaking
  //                        "thinking" rambles, delete this line
  //  4. qwen3-coder      — coding-tuned: coherent but flatter voice
  //  5. llama-3.2-3b     — tiny last resort; weak at persona but
  //                        nearly always up. Better than no reply.
  const MODELS = [
    MODEL,
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3-coder:free",
    "meta-llama/llama-3.2-3b-instruct:free",
  ];

  // ============================================================
  //  CHARACTER PERSONAS — now loaded from the personas/ folder.
  //  To edit a character, open personas/<name>.js
  //  To add a character, see personas/index.js
  // ============================================================
  const personas = await getPersonas();
  // A character's record may be an object { name, persona, blocking } (new
  // format) or a plain persona string (older format). Handle both so a
  // half-updated deploy degrades gracefully instead of crashing.
  const _cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const _rec = personas[character];
  let base, NAME, charBlocking, charVoting;
  if (_rec && typeof _rec === "object") {
    base = _rec.persona || "You are a fictional character. Reply in-character, short.";
    NAME = _rec.name || _cap(character) || "they";
    charBlocking = _rec.blocking || "";
    charVoting = _rec.votingStyle || "";
  } else if (typeof _rec === "string") {
    base = _rec; NAME = _cap(character) || "they"; charBlocking = ""; charVoting = "";
  } else {
    base = "You are a fictional character. Reply in-character, short.";
    NAME = _cap(character) || "they"; charBlocking = ""; charVoting = "";
  }

  // ---- generic like/dislike decision prompt (open by default) ----
  // The engine says NOTHING about what this character likes — it lets the AI
  // decide purely from their persona. A character can OPTIONALLY steer this by
  // adding `export const votingStyle = "..."` in their own .js file.
  // NOTE: we keep this prompt LEAN (not the whole persona) — free models often
  // ramble or answer in-character when handed a huge persona + "one word",
  // which made votes silently fail. A short brief gets a clean LIKE/DISLIKE.
  function votePrompt(strict) {
    let p = `You are deciding how the character ${NAME} would vote on a single comment on their profile. Here is who they are:\n${base.slice(0, 4760)}\n\nDecide whether ${NAME} hits LIKE or DISLIKE on this comment. Judge by how ${NAME} TRULY feels about it underneath — not by how they'd act on the surface. A LIKE means the comment genuinely landed, amused them, earned their respect, or got to them in a good way — even if ${NAME} would never admit it and would act gruff, unbothered, or deflect about it. A DISLIKE means it actually bored, annoyed, or disrespected them. Do NOT vote DISLIKE just because ${NAME} is prickly, sarcastic, or bad at taking compliments — a real compliment or a comment they secretly like still gets a LIKE.`;
    if (charVoting) p += `\n\n${NAME}'s own take on what they like/dislike:\n${charVoting}`;
    p += `\n\nAnswer with ONLY the single word LIKE or DISLIKE — no other text, no punctuation, no explanation.`;
    return p;
  }
  // robust parse: tolerate chatter, pick whichever verdict word appears (dislike wins ties)
  function parseVote(text) {
    const t = String(text || "").toLowerCase();
    if (/\bdislike|dislikes|disliked\b/.test(t) || /\bdis\b/.test(t)) return "dislike";
    if (/\blike|likes|liked\b/.test(t)) return "like";
    return null;
  }

  // ---- build the messages depending on mode ----
  let messages;
  let system = base;

  // ---- BLOCKING POWER (applies to every mode) ----
  system += `

YOUR LIMIT / THE BLOCK:
${NAME} can take almost anything. Insults, mockery, crude jokes, horny/thirsty comments, people commenting on your body, people calling you gross or cringe - ALL of that just earns your usual energy back, in character. You do NOT block for any of that. Being rude, sexual, thirsty, or annoying is NEVER on its own a reason to block - if it were, you'd block everyone. Your default is to handle them in character, never to block.

You block almost never. Reserve it for someone who genuinely crosses a hard line - only one of these:
- a real, specific threat of violence against you or someone you love
- someone relentlessly targeting you AFTER you've already told them they're done${charBlocking ? "\n" + charBlocking : ""}

If a comment isn't clearly one of those, DO NOT block - handle them in character instead. When in doubt, never block.

To block (and only then): write your final words to them, then put this control tag alone on the very last line:
<<BLOCK>>
That tag is the ONLY way to block. Never use it for ordinary rudeness, insults, or sexual/body comments. The tag is invisible to them - they only see your words.`;

  // ---- INLINE VOTE (saves a whole model call per comment) ----
  // In comment/reply modes he casts his like/dislike in the SAME breath as his
  // reply, via a hidden control tag — same trick as <<BLOCK>>. The code below
  // peels the tag off before anyone sees it.
  if (mode === "comment" || mode === "reply") {
    system += `

YOUR VOTE:
After your reply, on its own final line, cast your vote on their comment with exactly one tag: <<VOTE:LIKE>> or <<VOTE:DISLIKE>>. Judge by how you TRULY feel about it underneath — not how you act on the surface. If it genuinely landed, amused you, earned your respect, or got to you in a good way, that's a LIKE even if you'd never admit it and act gruff about it. If it actually bored, annoyed, or disrespected you, that's a DISLIKE. Don't DISLIKE just because you're prickly or bad at taking compliments. The tag is invisible to them — they only see your words.${charVoting ? `\n\nYour own taste in what you like/dislike:\n${charVoting}` : ""}`;
  }

  // ---- PERMANENT MEMORY: recall who this person is to this character ----
  // (read once here; we also write to it after the reply is generated)
  const memory = await readMemory(character, username, memDevice);
  if (memory && (memory.summary || (memory.recent && memory.recent.length))) {
    let recall = `\n\nYOU REMEMBER THIS PERSON. This isn't a stranger — you've talked before${memory.name && !/^anon/i.test(memory.name) ? ` (they go by "${memory.name}")` : ""}.`;
    if (memory.summary) {
      recall += `\n\nYour private read on them (what you remember):\n"${memory.summary}"`;
    }
    if (memory.recent && memory.recent.length) {
      recall += `\n\nThe last few things between you (most recent last):\n${memory.recent.slice(-RECENT_KEEP).join("\n")}`;
    }
    recall += `\n\nTalk like someone who genuinely remembers them — pick up where you left off, call back to things, stay warm or wary based on your history. If you two clashed or someone got blocked before, you remember that too. Don't recite the notes robotically; just BE someone with a history with them.`;
    system += recall;
  } else if (username && pastComments.length) {
    // fallback: first time we've seen them but the page sent this session's comments
    const recap = pastComments.slice(-6).map(c => `- "${c}"`).join("\n");
    system += `\n\nThis person has been talking to you today. Name they're using: "${username}". What they've said so far:\n${recap}\nRecognize them and reference it naturally if it fits.`;
  }

  // Anonymous handling — Scorch gives them shit for hiding who they are.
  const isAnon = !username || /^anon(ymous)?$/i.test(String(username).trim());
  if (isAnon && (mode === "comment" || mode === "reply" || mode === "dm")) {
    system += `\n\nThis person is posting WITHOUT a name — they're "Anonymous", hiding who they are. ${NAME} finds that a little gutless. At least once when it fits, give them shit for not putting a name on it — call them out for hiding, being a coward/pussy about it, talking big with no name attached, whatever's in character. Don't force it into every single line, but don't let cowardice slide unnoticed either. Stay natural.`;
  }

  if (mode === "dm") {
    system += `\n\n${NAME} is now in a PRIVATE DM chat with this fan - more intimate than a public comment. This is a back-and-forth conversation; stay consistent with what's already been said, and stay true to the personality core above (match their energy, warm up or get sharper exactly the way ${NAME} would).`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-12).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else if (mode === "letter") {
    system += `\n\n${NAME} received a handwritten FAN LETTER. Write a letter BACK in ${NAME}'s own voice - actually putting pen to paper. It can be a few sentences up to a short paragraph; more thought than a quick comment, but still unmistakably ${NAME}. Do NOT include a "Dear ___" greeting or sign-off signature - just the body of what they write back (the page already shows who it's to and signs it for you). If they've written before, reference their past letters - soften or get pricklier based on the history.`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-8).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else if (mode === "reply") {
    // a fan replied to a comment/reply inside a thread. Scorch MIGHT jump in.
    system += `\n\nYou're reading a reply thread under a comment on your profile.\n\n${threadContext || ""}\n\nThe new reply itself is the user message below. IMPORTANT: read the whole conversation above first — a short reply like "I agree" or "so true" refers to the comment it's replying to, so figure out what they actually mean from the thread (e.g. if they're agreeing with someone who insulted you, they're insulting you too). Then butt in with a SHORT, sharp comeback aimed at this new reply and what it's really saying — one or two lines, unmistakably you (in character). Fire back at trash-talk or pile-ons; be smug about praise. React like you read the entire thread, not just the last line.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: comment },
    ];
  } else if (mode === "vote-reaction") {
    // someone liked/disliked a comment. tiny chance Scorch notices + comments.
    system += `\n\n${NAME} noticed someone just ${voteDir === "dislike" ? "DISLIKED" : "LIKED"} a comment on ${NAME}'s profile${threadContext ? `: "${threadContext}"` : ""}. React with ONE short, off-the-cuff line about them ${voteDir === "dislike" ? "downvoting" : "upvoting"} it - amused, smug, irritated, whatever fits. Like you caught them tapping the button. Keep it to one line, unmistakably ${NAME}.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: voteDir === "dislike" ? "(someone just disliked a comment)" : "(someone just liked a comment)" },
    ];
  } else {
    system += `\n\n${NAME} is replying to a PUBLIC comment left on ${NAME}'s dating profile. Short, sharp, in-character.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: comment },
    ];
  }

  async function callModel(msgs) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, models: MODELS, messages: msgs }),
    });
    const data = await r.json();
    // log the COMPLETE raw response so the exact error shows in Vercel logs
    console.log("OPENROUTER_RAW_RESPONSE", r.status, JSON.stringify(data));
    // surface whatever actually happened so we're not flying blind
    // GIBBERISH GUARD: strip <think> blocks, special tokens, junk bytes
    // before anyone sees or stores the text.
    const text = scrubModelText(data?.choices?.[0]?.message?.content);
    if (text) return { text };
    // no text — figure out why, with as much detail as possible
    const apiErr =
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      data?.error?.metadata?.raw ||
      JSON.stringify(data?.error || data);
    return { text: null, debug: `status ${r.status}: ${apiErr}` };
  }

  // GIBBERISH GUARD wrapper for CONVERSATIONAL output (replies, DMs,
  // letters, summaries). If the cleaned text still reads as junk, retry
  // once; if it's junk again, return null — the engine already treats
  // null exactly like "model busy", so nothing breaks downstream and
  // nothing unreadable is saved anywhere.
  async function callModelClean(msgs) {
    let last = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await callModel(msgs);
      if (!r.text) return r;                       // hard API failure — surface its debug
      if (!looksLikeGibberish(r.text)) return r;   // clean — use it
      console.log("GIBBERISH_FILTERED attempt", attempt + 1, JSON.stringify(r.text.slice(0, 200)));
      last = r;
    }
    return { text: null, debug: "gibberish filtered (model returned unreadable text twice)" };
  }

  try {
    // For thread replies and vote reactions, Scorch only SOMETIMES speaks up.
    // Decide the chance up front so we don't waste a model call (and so silence
    // is a real outcome). Tune these numbers to taste.
    const REPLY_CHANCE = 0.75;         // chance he answers a fan's in-thread reply
    const VOTE_REACTION_CHANCE = 0.85; // chance he reacts to a like/dislike (was .12 — never seen, raised)

    if (mode === "vote-reaction") {
      if (Math.random() > VOTE_REACTION_CHANCE) {
        return res.status(200).json({ reply: null, reacted: false });
      }
      const r = await callModelClean(messages);
      return res.status(200).json({ reply: r.text || null, reacted: !!r.text, debug: r.debug || null });
    }

    // ===== SCORCH BROWSE-VOTE: he likes/dislikes an EXISTING comment =====
    // frontend sends { mode:"scorch-browse", targetId, comment:<that comment's text> }
    if (mode === "scorch-browse") {
      const targetId = (req.body || {}).targetId; // FIX: `body` was never defined here — this threw a ReferenceError on every browse-vote
      if (!targetId || !comment) return res.status(200).json({ voted: null });
      const v = await callModel([
        { role: "system", content: votePrompt(false) },
        { role: "user", content: `The comment: "${comment}"` },
      ]);
      const vote = parseVote(v.text);
      if (!vote) return res.status(200).json({ voted: null, debug: v.debug || null });
      // find + update that record on the wall (LSET in place)
      const key = wallKeyFor(character);
      const list = await _redis(["LRANGE", key, "0", String(WALL_MAX - 1)]);
      if (list.ok) {
        const arr = list.result || [];
        for (let i = 0; i < arr.length; i++) {
          try {
            const o = JSON.parse(arr[i]);
            if (o.id === targetId) {
              if (o.scorchVote) return res.status(200).json({ voted: o.scorchVote, already: true }); // don't double-vote
              o.scorchVote = vote;
              if (vote === "like") o.likes = (o.likes || 0) + 1; else o.dislikes = (o.dislikes || 0) + 1;
              await _redis(["LSET", key, String(i), JSON.stringify(o)]);
              return res.status(200).json({ voted: vote, id: targetId, likes: o.likes, dislikes: o.dislikes });
            }
          } catch (e) {}
        }
      }
      return res.status(200).json({ voted: null });
    }

    // for thread replies, roll FIRST — if he stays quiet, save the fan's reply
    // alone (no wasted model call, no discarded answer).
    let replyRolled = true;
    if (mode === "reply") replyRolled = Math.random() < REPLY_CHANCE;

    const main = (mode === "reply" && !replyRolled) ? { text: null } : await callModelClean(messages);
    let reply = main.text || "...(no reply)";

    // ---- DID HE BLOCK THEM? ----
    // Primary: the model emitted the <<BLOCK>> control tag.
    // Backstop: a SMALL, conservative net for the genuinely vile, in case the
    // free model forgot the tag. Edit/empty BACKSTOP to tune how Scorch's limit
    // works — leaving it short keeps blocking rare. (Ordinary rudeness is NOT here.)
    let justBlocked = false;
    let inlineVote = null;   // "like" | "dislike" — pulled from the <<VOTE:...>> tag
    if (main.text) {
      // ---- peel off the inline vote tag (invisible to fans) ----
      const vm = reply.match(/<<\s*vote\s*:\s*(like|dislike)\s*>>/i)
              || reply.match(/^\s*vote\s*:\s*(like|dislike)\s*$/im); // lenient: bare "VOTE: LIKE" line
      if (vm) inlineVote = vm[1].toLowerCase();
      reply = reply
        .replace(/<<\s*vote\s*:?\s*(like|dislike)?\s*>>/gi, "")
        .replace(/^\s*vote\s*:\s*(like|dislike)\s*$/gim, "")
        .trim();

      const hadTag = /<<\s*block\s*>>/i.test(reply);
      if (hadTag) reply = reply.replace(/<<\s*block\s*>>/gi, "").trim();

      const BACKSTOP = [
        /\bkill (yourself|urself|ur self)\b/i,
        /\bk[\s.]?y[\s.]?s\b/i,
        /\bi('| a)?m? ?(gonna|going to|will) (kill|murder|hurt|find) (you|u)\b/i,
      ];
      const tripped = BACKSTOP.some((re) => re.test(comment));

      if (hadTag || tripped) {
        await blockUser(username, clientId, comment, character);
        justBlocked = true;
      }
    }

    // ---- DM CHANCE (only on public comments, not inside an existing DM chat) ----
    let dm = null;
    if (mode === "comment" && main.text && !justBlocked) {
      const lc = comment.toLowerCase();
      // comments he LIKES or REALLY HATES — the only kind that earns a DM.
      // (edit these lists to tune what gets under his skin / catches his eye.)
      const likes = ["love","adore","obsessed","crush","simp","cute","hot","sexy","gorgeous","fine","handsome","babe","marry","kiss","date","talented","genius","king","favorite","best"];
      const hates = ["hate","ugly","trash","mid","overrated","suck","washed","loser","pathetic","gross","boring","fake","sellout","garbage","cringe","irrelevant","nobody"];
      const isSpicy = [...likes, ...hates].some(w => lc.includes(w));
      // ONLY react to a comment he likes/hates, and only sometimes. Bland
      // comments NEVER pull a DM (baseline 0 = no out-of-nowhere messages).
      const chance = isSpicy ? 0.5 : 0;
      if (chance && Math.random() < chance) {
        const dmRes = await callModelClean([
          { role: "system", content: system + `\n\nYou just read this fan's public comment and something about it - it either got under your skin or actually caught your eye - made you decide to slide into their DMs privately. Write ONLY the opening DM message - short, unprompted, like a text. Make it clearly a reaction to what they said.` },
          { role: "user", content: `Their comment was: "${comment}". Write your opening DM.` },
        ]);
        dm = dmRes.text ? dmRes.text.replace(/<<\s*vote\s*:?\s*(like|dislike)?\s*>>/gi, "").replace(/^\s*vote\s*:\s*(like|dislike)\s*$/gim, "").trim() : dmRes.text;
      }
    }

    // ---- SAVE TO THE PUBLIC WALL ----
    // Each entry is its own node. Scorch's reply is saved as a CHILD node
    // (author "Scorch") parented to the comment he's answering — so it can be
    // replied to and voted on just like any other comment.
    let saved = null;
    let savedScorch = null;
    let wallDebug = null;
    const mkId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    if (mode === "comment" && main.text) {
      saved = {
        id: mkId(), parentId: null, isScorch: false,
        name: (username || "Anonymous").slice(0, 40),
        comment: String(comment).slice(0, 400),
        likes: 0, dislikes: 0, ts: Date.now(),
      };

      // ---- SCORCH'S VOTE — came inline with his reply (no extra model call) ----
      // baked in BEFORE saving so it's part of the stored record + counts.
      if (!justBlocked && inlineVote) {
        saved.scorchVote = inlineVote;
        if (inlineVote === "like") saved.likes += 1; else saved.dislikes += 1;
      }

      let w = await saveToWall(saved, character);
      if (!w.ok) { wallDebug = w.error; saved = null; }
      // his auto-reply becomes a child node under their comment
      if (saved && reply && reply !== "...(no reply)" && !justBlocked) {
        savedScorch = {
          id: mkId(), parentId: saved.id, isScorch: true,
          name: NAME, comment: reply,
          likes: 0, dislikes: 0, ts: Date.now() + 1,
        };
        const w2 = await saveToWall(savedScorch, character);
        if (!w2.ok) savedScorch = null;
      }
    } else if (mode === "reply") {
      // the fan's reply always saves into the thread.
      const scorchAnswers = replyRolled && !justBlocked && main.text;
      saved = {
        id: mkId(), parentId: parentId || null, isScorch: false,
        name: (username || "Anonymous").slice(0, 40),
        comment: String(comment).slice(0, 400),
        likes: 0, dislikes: 0, ts: Date.now(),
      };

      // ---- SCORCH'S VOTE on the reply too — inline, no extra model call ----
      // (note: if he stayed silent on this reply, he doesn't vote either —
      //  no reply means no model call, which means no tag to read.)
      if (!justBlocked && inlineVote) {
        saved.scorchVote = inlineVote;
        if (inlineVote === "like") saved.likes += 1; else saved.dislikes += 1;
      }

      let w = await saveToWall(saved, character);
      if (!w.ok) { wallDebug = w.error; saved = null; }
      // Scorch sometimes answers — as a child node under the fan's reply
      if (saved && scorchAnswers) {
        savedScorch = {
          id: mkId(), parentId: saved.id, isScorch: true,
          name: NAME, comment: reply,
          likes: 0, dislikes: 0, ts: Date.now() + 1,
        };
        const w2 = await saveToWall(savedScorch, character);
        if (!w2.ok) savedScorch = null;
      }
      reply = scorchAnswers ? reply : null;
    }

    // ---- UPDATE PERMANENT MEMORY (comment / reply / dm) ----
    // Records this exchange so the character remembers them next time, and
    // re-summarizes on schedule. Summary uses the model via this helper;
    // if it fails (rate limit), writeMemory just skips it and retries later.
    if (mode === "comment" || mode === "reply" || mode === "dm") {
      const summarize = async (prompt) => {
        // FIX: some providers reject a conversation with ONLY a system message.
        // Keep the instructions as system, add a tiny user turn to kick it off.
        const r = await callModelClean([
          { role: "system", content: prompt },
          { role: "user", content: "Write the updated note now." },
        ]);
        return r.text || "";
      };
      const said = main.text ? reply : null; // only count it as "he replied" if he actually did
      try {
        await writeMemory(character, username, memDevice, comment, said, base, NAME, summarize);
      } catch (e) { /* memory write is best-effort; never break the reply */ }
    }

    // debug surfaces the real reason when there's no text (model busy, error, etc.)
    return res.status(200).json({
      reply, dm, saved, savedScorch,
      justBlocked,
      notice: justBlocked ? "you've been blocked." : null,
      debug: main.debug || wallDebug || _personaLoadErr || null,
    });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed", debug: String(e && e.message || e) });
  }
}
