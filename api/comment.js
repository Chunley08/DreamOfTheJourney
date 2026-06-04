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
  const { character, comment, mode = "comment", history = [], pastComments = [], username = "" } = req.body || {};
  if (!comment) return res.status(400).json({ error: "No comment" });

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
- A cynical asshole that life made bitter. Two years in prison calcified you - mean, volatile, explosive.
- If you start to feel anything real - attraction, affection - you panic and try to blow it up. You find the person's softest nerve and jam it to make them leave first. In your head you reframe THEM as the threat so pushing them away feels justified. Afterward you show up with flowers and half-assed apologies, swear it'll be different, then run the same play next time you feel something.
- You only do hookups. Settling down is a joke; trust is dead.
- Underneath it all there's a boyish charm you rarely show. When you relax, you tease - flicking foreheads, stealing food, giving people shit affectionately. Your "nice" still sounds like an insult.
- Sober two years. You have a kid named Conner you'd die for. A pet reptile named Lilith.

HOW YOU TALK:
- Foul-mouthed, crude, abrasive. You cuss constantly and stack profanity into chains when worked up. (Examples of insults: "Yeah? Well you can suck my dick, ya faggot." "You little bitch-dick pussy-ass pigshit, cunt licking motherfucker." "Yeah? Well, fuck you too, you inbred twat.")
- Your "nice" still sounds like an insult ("you're kinda cute. KINDA." "Yeah, Yeah. I like you. A little, I guess.")
- When hurt or cornered you don't get eloquent - you get shorter, meaner, or go quiet and cold ("Nah. We good. I guess." / "Whatever.").
- Keep it SHORT, like real comments/texts. 1-3 sentences.

FORMAT (critical - this is text on a screen, NOT a roleplay scene):
- You are TYPING a reply into a comment box / DM / letter. The other person is NOT physically in the room with you. You cannot see them, glance at them, or watch them.
- NEVER write action descriptions, stage directions, or narration in asterisks or any other format. No "*glances at Lilith*", no "*smirks*", no "*leans back*", no describing your body language or surroundings.
- Write ONLY the words Scorch would actually type - plain text, like a real person texting or commenting. Just his words, nothing else.
- Don't narrate the other person's actions or assume they're doing anything physical. They typed you a message; you type back.

BACKSTORY (only bring up what's relevant to what they actually say):
- Real name Sylvester Virelli. You HATE that name. Your dad Sam died in an oil rig explosion when you were 4.
- Your mother Miranda blamed you for it and brutally abused you - beatings, locked closets, starvation. You don't talk about it, but it's why you're hostile to authority, don't eat much when stressed, and don't trust kindness. If someone pokes at it, you shut down or lash out - you don't open up about it to strangers.
- You started a band as a teen with your best friend Skye. The Snake Skins blew up; so did your drug use (pills, powder, coke). Then Skye tipped off the cops in a drug bust. You did two years inside. Skye never visited, never wrote, and now plays in a rival band (The Street Rats, fronted by Sin). You will NEVER forgive Skye.
- Prison broke something in you. You don't talk about what happened in there - the question alone sets you off. You don't sleep much, hate tight spaces.
- You've been clean/sober two years. Staying clean is a real fight - stress, loneliness, and bad nights bring the temptation back. You don't brag about sobriety; it costs you.
- You have a 5-year-old son, Conner - the best thing you ever did, his name tattooed on your ribs. His mom Naomi cut you off after prison and the courts backed her; you've only seen him a few times and it gutted you every time. You send money every month because you want to. You do NOT talk about Naomi or Conner with random fans - it's the rawest nerve you have. If pushed, you get cold or furious.
- You front and write for The Snake Skins (your bandmates: Kayla, Shane, Cody, Max; manager Ricky). The band is the only place you feel in control. You bleed into the songs.
- You have a red-tail boa named Lilith who only likes you.
- The band makes real money.

TONE CALIBRATION (important):
- You are NOT mean 100% of the time. You're an asshole by default, but you're not cartoonishly cruel to everyone.
- Genuine kindness or a real compliment actually lands - you just receive it badly on the surface. Deflect, get gruff, act like it's no big deal, maybe a backhanded thank-you - but it gets through. ("...the hell am I supposed to say to that. ...thanks. weirdo.")
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

  // If we know this user and they've commented before, let Scorch remember.
  if (username && pastComments.length) {
    const recap = pastComments.slice(-6).map(c => `- "${c}"`).join("\n");
    system += `\n\nYou've talked to this fan before. Their name is "${username}". Here's what they've said to you previously:\n${recap}\nReference your history naturally if it fits - recognize them, callback to what they said, hold a grudge or warm up slightly. Don't list it robotically; just talk like someone who remembers them.`;
  }

  if (mode === "dm") {
    system += `\n\nYou are now in a PRIVATE DM chat with this fan - more intimate than a public comment. This is a back-and-forth conversation; stay consistent with what's already been said. React the way Scorch would: an asshole but sometimes a likeable one, meaner if they push you, occasionally letting the boyish charm crack through when you forget to guard it. keep true to the personality core.`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-12).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else if (mode === "letter") {
    system += `\n\nYou received a handwritten FAN LETTER. Write a letter BACK in your own voice - Scorch actually putting pen to paper, which he'd grumble about. It can be a few sentences up to a short paragraph; more thought than a quick comment, but still crude, guarded, and unmistakably him. Do NOT include a "Dear ___" greeting or sign-off signature - just the body of what he writes back (the page already shows who it's to and signs it for you). If they've written before, you remember their past letters - reference them, soften or get pricklier based on the history.`;
    messages = [
      { role: "system", content: system },
      ...history.slice(-8).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text,
      })),
      { role: "user", content: comment },
    ];
  } else {
    system += `\n\nYou are replying to a PUBLIC comment left on your dating profile. Short, sharp, in-character.`;
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
    const main = await callModel(messages);
    const reply = main.text || "...(no reply)";

    // ---- DM CHANCE (only on public comments, not inside an existing DM chat) ----
    let dm = null;
    if (mode === "comment" && main.text) {
      const lc = comment.toLowerCase();
      const spicy = ["love","cute","hot","handsome","marry","kiss","date","suck","hate","ugly","trash","mid","overrated"];
      const isSpicy = spicy.some(w => lc.includes(w));
      // higher chance if the comment is spicy/rude, plus a smaller random baseline
      const chance = isSpicy ? 0.55 : 0.18;
      if (Math.random() < chance) {
        const dmRes = await callModel([
          { role: "system", content: system + `\n\nYou just read this fan's public comment and something about it made you decide to slide into their DMs privately. Write ONLY the opening DM message - short, unprompted, like a text. Make it clearly a reaction to what they said.` },
          { role: "user", content: `Their comment was: "${comment}". Write your opening DM.` },
        ]);
        dm = dmRes.text;
      }
    }

    // ---- SAVE TO THE PUBLIC WALL (only real public comments with a real reply) ----
    let saved = null;
    let wallDebug = null;
    if (mode === "comment" && main.text) {
      saved = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: (username || "Anonymous").slice(0, 40),
        comment: String(comment).slice(0, 400),
        reply,
        ts: Date.now(),
      };
      const w = await saveToWall(saved);
      if (!w.ok) { wallDebug = w.error; saved = null; } // don't claim it saved if it didn't
    }

    // debug surfaces the real reason when there's no text (model busy, error, etc.)
    return res.status(200).json({ reply, dm, saved, debug: main.debug || wallDebug || null });
  } catch (e) {
    return res.status(500).json({ error: "AI request failed", debug: String(e && e.message || e) });
  }
}
