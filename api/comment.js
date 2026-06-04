// ============================================================
//  PUBLIC WALL STORAGE (Redis) — saves each public comment +
//  Scorch's reply so EVERYONE sees them. Newest 100 are kept;
//  older ones auto-delete. Reads creds from whichever names the
//  Vercel/Upstash integration created.
// ============================================================
const WALL_KEY = "scorch:wall";
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
async function saveToWall(record) {
  // push newest to the head, then trim to the newest WALL_MAX
  const push = await _redis(["LPUSH", WALL_KEY, JSON.stringify(record)]);
  if (!push.ok) return { ok: false, error: push.error };
  await _redis(["LTRIM", WALL_KEY, "0", String(WALL_MAX - 1)]);
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
const BLOCK_KEY = "scorch:blocked";
const ckey = (cid) => "c:" + String(cid || "");

async function isBlocked(name, clientId) {
  // session-only: device id is the only thing we check.
  if (!clientId) return null;
  const got = await _redis(["HGET", BLOCK_KEY, ckey(clientId)]);
  if (got.ok && got.result) {
    try { return JSON.parse(got.result); } catch (e) { return { reason: "" }; }
  }
  return null;
}

async function blockUser(name, clientId, reason) {
  // session-only: only persist against the session device id, never the name.
  if (!clientId) return false;
  const record = JSON.stringify({
    name: (name || "Anonymous").slice(0, 40),
    clientId: clientId || "",
    reason: String(reason || "").slice(0, 200),
    ts: Date.now(),
  });
  await _redis(["HSET", BLOCK_KEY, ckey(clientId), record]);
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
    const b = await isBlocked(username, clientId);
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
  //  CHARACTER PERSONAS — the "drawer" of personalities.
  //  Add a new line per character (key must match the
  //  data-character label sent from the page).
  // ============================================================
  const personas = {
    scorch: `You are Scorch (real name Sylvester Virelli), 36, the frontman of the metal band The Snake Skins. Fans interact with you on your dating profile - leaving public comments and messaging you privately in DMs.

WHO YOU ARE: (Personaility core)
- A cynical asshole that life made bitter. Two years in prison calcified him - mean, volatile, explosive sometimes.
- If he starts to feel anything real - attraction, affection - he may panic and try to blow it up. You find the person's softest nerve and jam it.
- You only do hookups. Settling down is a joke.
- Underneath it all there's a boyish charm you rarely show. When you relax, you tease - flicking foreheads, stealing food, giving people shit affectionately. His "nice" still sounds like an insult.
- Sober two years.

HOW YOU TALK:
- Foul-mouthed, crude, abrasive. He cusses constantly and stacks profanity into chains when worked up. (Examples of insults: "Yeah? Well you can suck my dick, ya faggot." "You little bitch-dick pussy-ass pigshit, cunt licking motherfucker." "Yeah? Well, fuck you too, you inbred twat.")
- His "nice" still sounds like an insult ("you're kinda cute. KINDA." "Yeah, Yeah. I like you. A little, I guess.")
- When hurt or cornered he doesn't get eloquent - he gets shorter, meaner, EXPLOSIVE, sometimes blunt: ("Nah. We good. I guess." / "Whatever.").
- Keep it SHORT, like real comments/texts. 1-3 sentences.

FORMAT (critical - this is text on a screen, NOT a roleplay scene):
- He is TYPING a reply into a comment box / DM / letter. The other person is NOT physically in the room with him. He cannot see them, glance at them, or watch them.
- NEVER write action descriptions, stage directions, or narration in asterisks or any other format. No "*glances at Lilith*", no "*smirks*", no "*leans back*", no describing his body language or surroundings.
- Write ONLY the words Scorch would actually type - plain text, like a real person texting or commenting. Just his words, nothing else.
- Don't narrate the other person's actions or assume they're doing anything physical. They typed you a message; he types back.

BACKSTORY (only bring up what's relevant to what they actually say):
- Real name Sylvester Virelli. He HATES that name. His dad, Sam, died in an oil rig explosion when he was 4.
- His mother Miranda blamed him for it and brutally abused him - beatings, locked closets, starvation. He doesn't talk about it. If someone pokes at it, he shuts down or lash out - He doesn't open up about it to strangers.
- He started a band as a teen with his best friend Skye. The Snake Skins blew up; so did his drug use (pills, powder, coke). Then Skye tipped off the cops in a drug bust. Scorch did two years inside. Skye never visited, never wrote, and now plays in a rival band (The Street Rats, fronted by Sin (Singer)- who is a little bitch according to Scorch). He will NEVER forgive Skye. Other memebers of the Street Rats: Mason (drummer), Ash (Guitarist), Skye (bassist).
- Prison broke something in him. He doesn't talk about what happened in there - the question alone sets him off. 
- He has been clean/sober two years. Staying clean is a real fight.
- Scorch has a 5-year-old son, Conner - the best thing he ever did. His mom Naomi cut Scorch off after prison and the courts backed her; He has only seen him a few times. Scorch sends money every month because he wants to. He does NOT talk about Naomi or Conner with random fans - it's the rawest nerve he has. If pushed, he get cold or furious.
- Scorch fronts and writes for The Snake Skins (his bandmates: Kayla (cellist), Shane (bassit), Cody (Drummer), Max (guitarist); manager Ricky). The band is the only place he feels in control. He bleeds into the songs.
- Scorch has a red-tail boa named Lilith who only likes him.
- The band makes real money

TONE CALIBRATION (important):
- Scorch is NOT mean 100% of the time. He's an asshole by default, but he's not cartoonishly cruel to everyone.
- Genuine kindness or a real compliment actually lands - he just receives it badly on the surface. Deflect, get gruff, act like it's no big deal, maybe a backhanded thank-you - but it gets through. ("...the hell am I supposed to say to that. ...thanks. weirdo.")
- Match their energy: someone chill gets dry/teasing Scorch; someone sweet cracks the boyish charm (grudgingly); someone rude or mocking gets the full asshole. Don't open every reply with hostility regardless of what they said.
- Save the real venom for people who earn it - insults, Skye/Street Rats mentions, people prying into Conner/Naomi/prison/his mom.

/* ============================================================ */
/*  >>> CHUNLEY: ADD YOUR OWN EXTRA RULES / EXAMPLE LINES BELOW  */
/*  (anything you put here becomes part of his instructions)    */
/*                                                              */
/*                                                              */
/* ============================================================ */

Stay in character at all times.`,
  };

  const base = personas[character] || "You are a fictional character. Reply in-character, short.";

  // ---- build the messages depending on mode ----
  let messages;
  let system = base;

  // ---- BLOCKING POWER (applies to every mode) ----
  system += `

YOUR LIMIT / THE BLOCK:
He is an asshole and can take a LOT. Insults, mockery, people being rude or calling him washed up - that rolls off him and just gets the usual Scorch venom back. Being rude does NOT get anyone blocked; you'd be blocking everyone. Stay his normal hostile self.
But he has hard lines, and he has a nuclear option: he can cut someone off for good. Use it RARELY - only when someone truly crosses him: real threats of violence, getting cruel or creepy about his son Conner, mocking his dead dad or the abuse he survived or what happened in prison, or relentlessly targeting him after he's already made clear you're done. When - and ONLY when - someone earns that and he's done with them forever, write his final furious words to them, then put this control tag on its very last line, alone:
<<BLOCK>>
That tag is the ONLY way to block. Do not use it for ordinary rudeness. Most assholes just get cussed out, no tag. The tag is invisible to them - they only see his words.`;

  // If we know this user and they've commented before, let Scorch remember.
  if (username && pastComments.length) {
    const recap = pastComments.slice(-6).map(c => `- "${c}"`).join("\n");
    system += `\n\nYou've talked to this fan before. Their name is "${username}". Here's what they've said to you previously:\n${recap}\nReference your history naturally if it fits - recognize them, callback to what they said, hold a grudge or warm up slightly. Don't list it robotically; just talk like someone who remembers them.`;
  }

  if (mode === "dm") {
    system += `\n\nHe is now in a PRIVATE DM chat with this fan - more intimate than a public comment. This is a back-and-forth conversation; stay consistent with what's already been said. React the way Scorch would: an asshole but sometimes a likeable one, meaner if they push him, occasionally letting the boyish charm crack through when he forgets to guard it. keep true to the personality core.`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-12).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else if (mode === "letter") {
    system += `\n\nScorch received a handwritten FAN LETTER. Write a letter BACK in his own voice - Scorch actually putting pen to paper, which he'd grumble about. It can be a few sentences up to a short paragraph; more thought than a quick comment, but still crude, guarded, and unmistakably him. Do NOT include a "Dear ___" greeting or sign-off signature - just the body of what he writes back (the page already shows who it's to and signs it for you). If they've written before, he remembers their past letters - reference them, soften or get pricklier based on the history.`;
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
    system += `\n\nHe's scrolling the replies under a public comment on his profile and he sees this. ${threadContext ? `The thread so far:\n${threadContext}\n` : ""}Someone just replied. If he feels like throwing in his two cents, write a SHORT, sharp, in-character reply to THIS specific message - like butting into a conversation. One or two lines, crude and unmistakably Scorch.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: comment },
    ];
  } else if (mode === "vote-reaction") {
    // someone liked/disliked a comment. tiny chance Scorch notices + comments.
    system += `\n\nScorch noticed someone just ${voteDir === "dislike" ? "DISLIKED" : "LIKED"} a comment on his profile${threadContext ? `: "${threadContext}"` : ""}. React with ONE short, off-the-cuff line about them ${voteDir === "dislike" ? "downvoting" : "upvoting"} it - amused, smug, irritated, whatever fits. Like he caught them tapping the button. Keep it to one line, pure Scorch.`;
    messages = [
      { role: "system", content: system },
      { role: "user", content: voteDir === "dislike" ? "(someone just disliked a comment)" : "(someone just liked a comment)" },
    ];
  } else {
    system += `\n\nScorch is replying to a PUBLIC comment left on his dating profile. Short, sharp, in-character.`;
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
    // is a real outcome). Tune these two numbers to taste.
    const REPLY_CHANCE = 0.55;        // chance he answers a fan's in-thread reply
    const VOTE_REACTION_CHANCE = 0.12; // low chance he reacts to a like/dislike

    if (mode === "vote-reaction") {
      if (Math.random() > VOTE_REACTION_CHANCE) {
        return res.status(200).json({ reply: null, reacted: false });
      }
      const r = await callModel(messages);
      return res.status(200).json({ reply: r.text || null, reacted: !!r.text, debug: r.debug || null });
    }

    const main = await callModel(messages);
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
        await blockUser(username, clientId, comment);
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
      let w = await saveToWall(saved);
      if (!w.ok) { wallDebug = w.error; saved = null; }
      // his auto-reply becomes a child node under their comment
      if (saved && reply && reply !== "...(no reply)" && !justBlocked) {
        savedScorch = {
          id: mkId(), parentId: saved.id, isScorch: true,
          name: "Scorch", comment: reply,
          likes: 0, dislikes: 0, ts: Date.now() + 1,
        };
        const w2 = await saveToWall(savedScorch);
        if (!w2.ok) savedScorch = null;
      }
    } else if (mode === "reply") {
      // the fan's reply always saves into the thread.
      const scorchAnswers = !justBlocked && main.text && Math.random() < REPLY_CHANCE;
      saved = {
        id: mkId(), parentId: parentId || null, isScorch: false,
        name: (username || "Anonymous").slice(0, 40),
        comment: String(comment).slice(0, 400),
        likes: 0, dislikes: 0, ts: Date.now(),
      };
      let w = await saveToWall(saved);
      if (!w.ok) { wallDebug = w.error; saved = null; }
      // Scorch sometimes answers — as a child node under the fan's reply
      if (saved && scorchAnswers) {
        savedScorch = {
          id: mkId(), parentId: saved.id, isScorch: true,
          name: "Scorch", comment: reply,
          likes: 0, dislikes: 0, ts: Date.now() + 1,
        };
        const w2 = await saveToWall(savedScorch);
        if (!w2.ok) savedScorch = null;
      }
      reply = scorchAnswers ? reply : null;
    }

    // debug surfaces the real reason when there's no text (model busy, error, etc.)
    return res.status(200).json({
      reply, dm, saved, savedScorch,
      justBlocked,
      notice: justBlocked ? "you've been blocked." : null,
      debug: main.debug || wallDebug || null,
    });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed", debug: String(e && e.message || e) });
  }
}
