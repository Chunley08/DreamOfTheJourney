// ============================================================
//  PUBLIC WALL STORAGE (Redis) — saves each public comment +
//  Scorch's reply so EVERYONE sees them. Newest 100 are kept;
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
    const mod = await import("./personas/index.js");
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
const WALL_MAX = 100;
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
          parentId = null, threadContext = "", voteDir = "" } = req.body || {};
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
  const MODEL = "z-ai/glm-4.5-air:free";

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
  let base, NAME, charBlocking;
  if (_rec && typeof _rec === "object") {
    base = _rec.persona || "You are a fictional character. Reply in-character, short.";
    NAME = _rec.name || _cap(character) || "they";
    charBlocking = _rec.blocking || "";
  } else if (typeof _rec === "string") {
    base = _rec; NAME = _cap(character) || "they"; charBlocking = "";
  } else {
    base = "You are a fictional character. Reply in-character, short.";
    NAME = _cap(character) || "they"; charBlocking = "";
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

  // If we know this user and they've commented before, let Scorch remember.
  if (username && pastComments.length) {
    const recap = pastComments.slice(-6).map(c => `- "${c}"`).join("\n");
    system += `\n\nYou've talked to this fan before. Their name is "${username}". Here's what they've said to you previously:\n${recap}\nReference your history naturally if it fits - recognize them, callback to what they said, hold a grudge or warm up slightly. Don't list it robotically; just talk like someone who remembers them.`;
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
      body: JSON.stringify({ model: MODEL, messages: msgs }),
    });
    const data = await r.json();
    // log the COMPLETE raw response so the exact error shows in Vercel logs
    console.log("OPENROUTER_RAW_RESPONSE", r.status, JSON.stringify(data));
    // surface whatever actually happened so we're not flying blind
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) return { text };
    // no text — figure out why, with as much detail as possible
    const apiErr =
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      data?.error?.metadata?.raw ||
      JSON.stringify(data?.error || data);
    return { text: null, debug: `status ${r.status}: ${apiErr}` };
  }

  try {
    // For thread replies and vote reactions, Scorch only SOMETIMES speaks up.
    // Decide the chance up front so we don't waste a model call (and so silence
    // is a real outcome). Tune these numbers to taste.
    const REPLY_CHANCE = 0.7;          // chance he answers a fan's in-thread reply
    const VOTE_REACTION_CHANCE = 0.12; // low chance he reacts to a like/dislike

    if (mode === "vote-reaction") {
      if (Math.random() > VOTE_REACTION_CHANCE) {
        return res.status(200).json({ reply: null, reacted: false });
      }
      const r = await callModel(messages);
      return res.status(200).json({ reply: r.text || null, reacted: !!r.text, debug: r.debug || null });
    }

    // for thread replies, roll FIRST — if he stays quiet, save the fan's reply
    // alone (no wasted model call, no discarded answer).
    let replyRolled = true;
    if (mode === "reply") replyRolled = Math.random() < REPLY_CHANCE;

    const main = (mode === "reply" && !replyRolled) ? { text: null } : await callModel(messages);
    let reply = main.text || "...(no reply)";

    // ---- DID HE BLOCK THEM? ----
    // Primary: the model emitted the <<BLOCK>> control tag.
    // Backstop: a SMALL, conservative net for the genuinely vile, in case the
    // free model forgot the tag. Edit/empty BACKSTOP to tune how Scorch's limit
    // works — leaving it short keeps blocking rare. (Ordinary rudeness is NOT here.)
    let justBlocked = false;
    if (main.text) {
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
        const dmRes = await callModel([
          { role: "system", content: system + `\n\nYou just read this fan's public comment and something about it - it either got under your skin or actually caught your eye - made you decide to slide into their DMs privately. Write ONLY the opening DM message - short, unprompted, like a text. Make it clearly a reaction to what they said.` },
          { role: "user", content: `Their comment was: "${comment}". Write your opening DM.` },
        ]);
        dm = dmRes.text;
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
