// ============================================================
//  /api/journal  —  SHANE'S JOURNAL GAME backend
//
//  The frontend journal game calls this. Two actions:
//    { action:"write",  character:"shane" }
//        -> returns { date, tag, text }  (a fresh private journal entry)
//    { action:"caught", character:"shane", deep:true|false }
//        -> returns { line }  (his reaction to catching you reading it)
//
//  It reuses the SAME persona file as the comment wall (shane.js),
//  so Shane stays one character with one personality. The only
//  difference is the MODE wrapper below: here he's writing privately
//  for himself, not replying to a fan.
//
//  >>> IMPORTANT: the persona import path must match where your
//      persona files actually live. Your comment.js imports from
//      the SAME place — copy that exact path into PERSONA_IMPORT
//      below if you ever move things. (Right now: same folder.)
// ============================================================

// ---- load personas the same lazy/safe way comment.js does ----
let _personasCache = null;
let _personaLoadErr = null;
async function getPersonas() {
  if (_personasCache) return _personasCache;
  try {
    // NOTE: match this to comment.js. If comment.js uses "./personas/index.js",
    // change this to that. If it uses "./index.js", keep this.
    const mod = await import("./index.js");
    _personasCache = (mod && mod.personas) ? mod.personas : {};
    if (!Object.keys(_personasCache).length) {
      _personaLoadErr = "index.js loaded but exported no personas";
    }
  } catch (e) {
    _personaLoadErr = "persona load failed: " + String((e && e.message) || e);
    _personasCache = {};
  }
  return _personasCache;
}

// ============================================================
//  MODEL — same free model as the comments. One line to change.
// ============================================================
const MODEL = "z-ai/glm-4.5-air:free";

// ---- make a realistic-looking entry date, e.g. "March 14, 3:02 AM" ----
function makeEntryDate() {
  const months = ["January","February","March","April","May","June","July",
                  "August","September","October","November","December"];
  const m = months[Math.floor(Math.random() * 12)];
  const d = 1 + Math.floor(Math.random() * 28);
  // journals skew late-night for Shane; bias toward small hours but allow any
  let hour, ampm, mins = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  if (Math.random() < 0.6) { hour = 1 + Math.floor(Math.random() * 4); ampm = "AM"; }       // 1–4 AM
  else { hour = 1 + Math.floor(Math.random() * 12); ampm = Math.random() < 0.5 ? "AM" : "PM"; }
  return `${m} ${d}, ${hour}:${mins} ${ampm}`;
}

// ---- the JOURNAL-MODE instruction wrapper (added on top of his persona) ----
// Rotates which examples it sees so it can't lock onto one and overuse it.
const EXAMPLE_BANK = [
  `[Journal Entry: She gets on my fucking nerves, but I like having her around. She makes me feel something more than this apathy. She's almost like playing music.]`,
  `[Journal Entry: Bridge maybe?
E|--------------------|
A|--5--5--3--5--------|
D|--------------5--3--|
G|--------------------|
slow. let it sit. don't rush the pull-off.]`,
  `[Journal Entry: Bridge idea —
"and I keep the quiet like a loaded gun /
swallow every word I should've said and done /
you wouldn't know me if I let you in /
so I won't, so I won't, so I fuckin won't again"
needs work. too clean. rough it up.]`,
  `[Journal Entry: didn't sleep. again. the quiet gets loud after a while.]`,
  `[Journal Entry: cody asked if I was good. said yeah. mostly meant it.]`,
  `[Journal Entry: I hate people. all of em. some days I'd burn the whole thing down and not feel a thing. then morning comes and I don't. so. whatever.]`,
];

function pickExamples(n) {
  const pool = EXAMPLE_BANK.slice();
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out.join("\n\n");
}

function journalSystem(base, NAME) {
  // show only 2–3 rotating examples, and tell it HARD not to reuse them
  const examples = pickExamples(2 + Math.floor(Math.random() * 2));
  return `${base}

============================================================
JOURNAL MODE — you are NOT replying to anyone right now.
============================================================
${NAME} is alone, writing in his private journal. No one is meant to read this. He is not performing, not answering a fan, not talking to anyone. This is the unfiltered inside of his head, put on paper when he thinks no one's looking.

WHAT TO WRITE:
- ONE short journal entry in ${NAME}'s voice. Raw, unguarded, real.
- It can be: a stray thought, something about his day, the band, his bike, someone on his mind, a fragment of lyrics, or a few lines of bass tab — whatever HE would actually scrawl down. Vary it. Don't write the same kind every time.
- Keep it SHORT. A few lines. Like a real person's private journal, not an essay.
- Lowercase, clipped, deadpan is fine. Cussing is fine. Let it be honest.
- His anger can get ugly and misanthropic here — this is where the stuff he'd never say out loud comes out. Let it be dark and real (self-loathing, "I hate everyone," wanting to burn it all down). But never praise or endorse real-world atrocities, real killers, or genocide — keep the darkness on HIM and his own world, not on glorifying real horrors.

THE EXAMPLES BELOW ARE TONE/RANGE REFERENCE ONLY:
- They show the VOICE and the RANGE (plain thought / bass tab / lyrics / raw anger).
- DO NOT reuse their content, their situations, their wording, or their phrasing.
- Write something COMPLETELY NEW every single time. Never copy an example.
${examples}

OUTPUT FORMAT (critical):
- Output ONLY the entry text itself. No "[Journal Entry: ...]" wrapper, no quotes around it, no preamble, no explanation, no sign-off unless it's part of the entry.
- If you write bass tab, use plain text lines like the example.
- Just the raw entry, as if read straight off the page.`;
}

function caughtSystem(base, NAME, deep) {
  return `${base}

============================================================
JOURNAL MODE — SOMEONE JUST CAUGHT YOU.
============================================================
${NAME} just looked up and caught someone reading his PRIVATE journal. ${deep
  ? "They were deep in it — digging through the rawest pages. He's genuinely pissed."
  : "They just cracked it open. He's annoyed, deadpan, not full rage yet."}

Write ONLY what ${NAME} says out loud in this moment — one short, sharp, in-character line. ${deep
  ? "Cold and serious. He doesn't yell; he goes flat and dangerous."
  : "Dry, deadpan, maybe a little 'lol busted.'"} No stage directions, no quotes, no narration. Just the words he says.`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body || {};
  const action = body.action || "write";
  const character = String(body.character || "shane").toLowerCase().trim();
  const deep = !!body.deep;

  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) return res.status(200).json({ error: "OPENROUTER_KEY not set", debug: "no api key" });

  // ---- resolve persona (same shape-handling as comment.js) ----
  const personas = await getPersonas();
  const _cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const _rec = personas[character];
  let base, NAME;
  if (_rec && typeof _rec === "object") {
    base = _rec.persona || "You are a fictional character writing a private journal.";
    NAME = _rec.name || _cap(character) || "He";
  } else if (typeof _rec === "string") {
    base = _rec; NAME = _cap(character);
  } else {
    base = "You are a fictional character writing a private journal.";
    NAME = _cap(character) || "He";
  }

  async function callModel(system, user) {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 1.0,  // a little extra variety so entries don't repeat
      }),
    });
    const data = await r.json();
    console.log("JOURNAL_RAW_RESPONSE", r.status, JSON.stringify(data));
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) return { text };
    const apiErr = data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      JSON.stringify(data?.error || data);
    return { text: null, debug: `status ${r.status}: ${apiErr}` };
  }

  try {
    if (action === "caught") {
      const r = await callModel(caughtSystem(base, NAME, deep), "(they just got caught reading your journal — what do you say?)");
      return res.status(200).json({
        line: r.text || (deep ? "put it down. now." : "...the hell are you doing."),
        debug: r.debug || _personaLoadErr || null,
      });
    }

    // default: write an entry
    const r = await callModel(journalSystem(base, NAME), "(write a new private journal entry — something completely new)");
    let text = r.text || null;
    if (text) {
      // strip any stray [Journal Entry: ...] wrapper or surrounding quotes the model might add
      text = text.replace(/^\s*\[?\s*journal entry\s*:?\s*/i, "").replace(/\]\s*$/, "").trim();
      text = text.replace(/^["'""]+|["'""]+$/g, "").trim();
    }
    return res.status(200).json({
      date: makeEntryDate(),
      text: text || "didn't have much to say tonight.",
      debug: r.debug || _personaLoadErr || null,
    });
  } catch (e) {
    return res.status(200).json({ error: "journal failed", debug: String((e && e.message) || e) });
  }
}
