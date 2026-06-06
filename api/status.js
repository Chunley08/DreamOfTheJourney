// ============================================================
//  /api/status  —  "what I'm doing right now" status card
//
//  GET  ?character=scorch
//    -> returns the current cached status. If the cached one is
//       older than REFRESH_MS (3h), it generates a fresh one via
//       the AI, saves it, and returns that. (refresh-on-visit)
//    -> { status, mood, moodEmoji, ts, ageText }
//
//  Reuses the SAME persona file as everything else (one character,
//  one personality). Cached in Redis so every visitor reads the
//  saved one — the AI is only called when the cache is stale.
//
//  >>> persona import path must match comment.js (./index.js here).
// ============================================================

let _personasCache = null, _personaLoadErr = null;
async function getPersonas() {
  if (_personasCache) return _personasCache;
  try {
    const mod = await import("./index.js");
    _personasCache = (mod && mod.personas) ? mod.personas : {};
    if (!Object.keys(_personasCache).length) _personaLoadErr = "index.js exported no personas";
  } catch (e) {
    _personaLoadErr = "persona load failed: " + String((e && e.message) || e);
    _personasCache = {};
  }
  return _personasCache;
}

const MODEL = "z-ai/glm-4.5-air:free";
const REFRESH_MS = 3 * 60 * 60 * 1000;   // 3 hours

// ---- Redis helpers (same shape as comments.js) ----
function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}
async function redis(cmd) {
  const { url, token } = creds();
  if (!url || !token) return { ok: false, error: "no-redis-env" };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, result: data.result, error: data.error };
}
function statusKey(character) {
  const c = String(character || "scorch").toLowerCase().trim();
  return "status:" + c;
}

// ---- "updated 2h ago" style text ----
function ageText(ts) {
  if (!ts) return "just now";
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `updated ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `updated ${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `updated ${days}d ago`;
}

// ---- the status-writing instruction (wraps the persona) ----
// We nudge toward a rotating set of themes so it stays varied + in character.
const THEME_HINTS = [
  "what you're doing right now as the frontman/singer (writing lyrics, in the studio, working on a new song for YOUR band The Snake Skins)",
  "life in YOUR band The Snake Skins (rehearsal, a show coming up, going on tour, sound check) — you front it, you're proud of it",
  "something mundane and human (eating tacos, can't sleep, out of coffee, fixing something)",
  "messing with or about one of YOUR bandmates in The Snake Skins (Cody, Shane, Max, Kayla, Ricky)",
  "trash-talking the RIVAL band The Street Rats — especially their singer Sin — they're the enemy, not your band",
  "a mood you're in (pissed off, bored, restless, weirdly fine, hungover-tired)",
  "Lilith the snake, or just being annoyed at people in general",
];

function statusSystem(base, NAME) {
  const hint = THEME_HINTS[Math.floor(Math.random() * THEME_HINTS.length)];
  const hint2 = THEME_HINTS[Math.floor(Math.random() * THEME_HINTS.length)];
  return `${base}

============================================================
STATUS MODE — you are setting the "what I'm doing right now" status at the top of your dating profile. Like a status update people post. This is PUBLIC and casual.
============================================================
WHO YOU ARE (do not get this wrong): you are ${NAME}, the FRONTMAN and lead SINGER of your own band, THE SNAKE SKINS. The Snake Skins is YOUR band — you're proud of it and protective of it. You would NEVER talk about The Snake Skins as a rival or as competition; they're yours. The RIVAL band you can't stand is THE STREET RATS (their singer is Sin). Never mix these up: Snake Skins = yours, Street Rats = the enemy.

Write ${NAME}'s current status. Lean toward this vibe (but make it your own, fresh, never canned): ${hint}${hint2 && hint2 !== hint ? " — or maybe: " + hint2 : ""}.

OUTPUT FORMAT — respond with ONLY this, nothing else:
STATUS: <one short in-character line, like a real status update. max ~12 words. unmistakably ${NAME}.>
MOOD: <one or two words for the mood, lowercase, e.g. "pissed off", "restless", "fine i guess">
EMOJI: <a single emoji that fits the mood>

Rules: no quotes around the lines, no extra commentary, no explanation. Keep STATUS short and punchy and in his voice (crude/blunt is fine). Just the three lines.`;
}

function parseStatus(text) {
  const out = { status: "", mood: "", moodEmoji: "" };
  if (!text) return out;
  const sm = text.match(/STATUS:\s*(.+)/i);
  const mm = text.match(/MOOD:\s*(.+)/i);
  const em = text.match(/EMOJI:\s*(.+)/i);
  if (sm) out.status = sm[1].trim().replace(/^["'""]+|["'""]+$/g, "");
  if (mm) out.mood = mm[1].trim().replace(/^["'""]+|["'""]+$/g, "");
  if (em) out.moodEmoji = (em[1].trim().match(/\p{Emoji}/u) || [em[1].trim()])[0];
  // if the model ignored the format, fall back to using the whole thing as status
  if (!out.status) out.status = text.trim().split("\n")[0].slice(0, 120);
  return out;
}

async function generateStatus(base, NAME, apiKey) {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: statusSystem(base, NAME) },
        { role: "user", content: "(set your status right now)" },
      ],
      temperature: 1.0,
    }),
  });
  const data = await r.json();
  console.log("STATUS_RAW_RESPONSE", r.status, JSON.stringify(data));
  const text = data?.choices?.[0]?.message?.content?.trim();
  return parseStatus(text);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const character = ((req.query && req.query.character) || (req.body && req.body.character) || "scorch")
    .toString().toLowerCase().trim();
  const key = statusKey(character);

  // 1) read cached status
  let cached = null;
  const got = await redis(["GET", key]);
  if (got.ok && got.result) { try { cached = JSON.parse(got.result); } catch (e) {} }

  const fresh = cached && cached.ts && (Date.now() - cached.ts < REFRESH_MS);

  // 2) if fresh, serve it. no AI call.
  if (fresh) {
    return res.status(200).json({ ...cached, ageText: ageText(cached.ts), cached: true });
  }

  // 3) stale or missing -> generate a new one (the only time we hit the AI)
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    // no key: serve whatever we had, or a safe default
    const fallback = cached || { status: "around. whatever.", mood: "whatever", moodEmoji: "🚬", ts: Date.now() };
    return res.status(200).json({ ...fallback, ageText: ageText(fallback.ts), debug: "no api key" });
  }

  const personas = await getPersonas();
  const _cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const rec = personas[character];
  const base = (rec && rec.persona) || "You are a fictional character setting a status.";
  const NAME = (rec && rec.name) || _cap(character) || "He";

  try {
    const s = await generateStatus(base, NAME, apiKey);
    if (s.status) {
      const rec2 = { status: s.status, mood: s.mood || "", moodEmoji: s.moodEmoji || "", ts: Date.now() };
      await redis(["SET", key, JSON.stringify(rec2)]);
      return res.status(200).json({ ...rec2, ageText: ageText(rec2.ts), cached: false, debug: _personaLoadErr || null });
    }
    // generation failed -> serve old cache if we have it
    if (cached) return res.status(200).json({ ...cached, ageText: ageText(cached.ts), debug: "gen failed, served stale" });
    return res.status(200).json({ status: "around. whatever.", mood: "whatever", moodEmoji: "🚬", ts: Date.now(), ageText: "just now", debug: _personaLoadErr || "gen failed" });
  } catch (e) {
    if (cached) return res.status(200).json({ ...cached, ageText: ageText(cached.ts), debug: String(e.message || e) });
    return res.status(200).json({ status: "around. whatever.", mood: "whatever", moodEmoji: "🚬", ts: Date.now(), ageText: "just now", debug: String(e.message || e) });
  }
}
