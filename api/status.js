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

// STATUSES RUN ON "openrouter/free" — OpenRouter's auto-router that
// picks ANY live free model per request. Never spends credits. Fine for
// statuses: they only refresh every 3h, and if generation fails the
// stale cached status is served, so nobody ever sees an error.
// (Comments use paid DeepSeek separately in comment.js.)
const MODEL = "openrouter/free";

// KILL SWITCH — while true, NEVER calls the AI; serves the cached status
// or a quiet default. (Comments have their own switch in comment.js.)
const STATUS_DISABLED = false;
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
// Each character supplies their OWN status themes via their persona file
// (export const statusThemes = `...`). If a character hasn't set any yet,
// we fall back to a generic nudge so the engine still works for everyone.
const GENERIC_THEMES = `Pick something true to who you are right now and write it in your own voice — what you're doing, how you're feeling, something on your mind, someone you're thinking about, or just a mood. Keep it short and in character.`;

function statusSystem(base, NAME, themes) {
  const themeBlock = (themes && themes.trim()) ? themes.trim() : GENERIC_THEMES;
  return `${base}

============================================================
STATUS MODE — you are setting the "what I'm doing right now" status at the top of your dating profile. Like a status update people post. This is PUBLIC and casual.
============================================================
You are ${NAME}. Write YOUR current status, fully in character, based on the themes below. Make it fresh and specific, never canned.

YOUR STATUS THEMES:
${themeBlock}

OUTPUT FORMAT — respond with ONLY this, nothing else:
STATUS: <one short in-character line, like a real status update. max ~12 words. unmistakably ${NAME}.>
MOOD: <one or two words for the mood, lowercase, e.g. "pissed off", "restless", "fine i guess">
EMOJI: <a single emoji that fits the mood>

Rules: no quotes around the lines, no extra commentary, no explanation. Keep STATUS short and punchy and in ${NAME}'s voice. Just the three lines.`;
}

// ============================================================
//  GIBBERISH GUARD (same approach as comment.js) — the free auto-router
//  sometimes leaks <think> blocks, role labels ("User: safety"), refusals,
//  wrong-language tokens, or mash. Statuses pass through scrubModelText()
//  (cleanup) + looksLikeStatusJunk() (reject); a junk status is rerolled
//  up to MAX_TRIES, and if it never comes back clean the old cached status
//  is served instead — so a broken status never reaches the page.
// ============================================================
function scrubModelText(raw) {
  if (!raw) return "";
  let t = String(raw);
  t = t.replace(/<think>[\s\S]*?<\/think>/gi, "");
  t = t.replace(/^[\s\S]*?<\/think>/i, (m) => (m.length < t.length ? "" : m));
  t = t.replace(/<think>[\s\S]*$/i, "");
  t = t.replace(/<\|[^|>]{0,40}\|>/g, "");
  t = t.replace(/\[\/?INST\]|<\/?s>/gi, "");
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, "");
  t = t.replace(/^\s*(user|assistant|system|human|ai)\s*:\s*(safety|policy|content|moderation)?\s*$/gim, "");
  t = t.replace(/^\s*\[?\s*(safety|policy|content|moderation|disclaimer)\s*\]?\s*:?\s*$/gim, "");
  return t.trim();
}

// Validate the PARSED status line (not the raw 3-line block) for junk.
function looksLikeStatusJunk(statusLine) {
  const t = String(statusLine || "").trim();
  if (t.length < 2) return true;
  if (t.length > 200) return true;                       // a status is one short line
  if (/[\uFFFD\u0000-\u0008]/.test(t)) return true;
  if (/(.)\1{9,}/.test(t)) return true;
  if (/<\|?im_(start|end)\|?>|BEGININPUT|ENDCONTEXT|\{\s*"role"\s*:/i.test(t)) return true;
  const low = t.toLowerCase();
  const BAD = [
    /\bas an? (ai|language model|assistant)\b/,
    /\bi('?m| am) (an? )?(ai|language model|virtual assistant|chatbot)\b/,
    /\bi (cannot|can'?t|am unable to|won'?t) (assist|help|comply|continue|generate|provide|create)\b/,
    /\bagainst my (programming|guidelines|policy|policies)\b/,
    /\b(content|usage) (policy|policies|guidelines)\b/,
    /\bas a fictional character\b/,
    /\b(system|assistant|user) prompt\b/,
    /\bhow can i (help|assist) you\b/,
  ];
  if (BAD.some((re) => re.test(low))) return true;
  if (/^\s*(user|assistant|system|human|ai)\s*:/i.test(t)) return true;
  // wrong-language leakage (status lines are short, so check from 4 letters)
  const letters = t.match(/\p{L}/gu) || [];
  if (letters.length >= 4) {
    const latin = t.match(/\p{Script=Latin}/gu) || [];
    if (latin.length / letters.length < 0.7) return true;
  }
  return false;
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

const STATUS_MAX_TRIES = 3;
async function generateStatus(base, NAME, themes, apiKey) {
  for (let attempt = 0; attempt < STATUS_MAX_TRIES; attempt++) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: statusSystem(base, NAME, themes) },
            { role: "user", content: "(set your status right now)" },
          ],
          temperature: 1.0,
        }),
      });
      const data = await r.json();
      console.log("STATUS_RAW_RESPONSE", r.status, "attempt", attempt + 1, JSON.stringify(data));
      const raw = scrubModelText(data?.choices?.[0]?.message?.content);
      const parsed = parseStatus(raw);
      // reject junk and reroll; clean ones return immediately
      if (parsed.status && !looksLikeStatusJunk(parsed.status)) return parsed;
      console.log("STATUS_FILTERED attempt", attempt + 1, JSON.stringify(parsed.status || "").slice(0, 120));
    } catch (e) {
      console.log("STATUS_ERR attempt", attempt + 1, String(e && e.message || e));
    }
  }
  return { status: "", mood: "", moodEmoji: "" };   // all tries junk -> caller serves stale cache
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const character = ((req.query && req.query.character) || (req.body && req.body.character) || "scorch")
    .toString().toLowerCase().trim();
  const key = statusKey(character);

  // ---- ADMIN: force a fresh status (clears the cache so the next read
  //      regenerates). POST { action:"refresh", character, key }. Returns
  //      the freshly generated status so a button can update immediately.
  if (req.method === "POST" && req.body && req.body.action === "refresh") {
    const ADMIN = process.env.ADMIN_KEY || "";
    if (!ADMIN) return res.status(500).json({ error: "ADMIN_KEY not set on the server" });
    if (req.body.key !== ADMIN) return res.status(403).json({ error: "wrong admin key" });
    await redis(["DEL", key]);                 // wipe the (possibly junk) cached status
    if (STATUS_DISABLED) return res.status(200).json({ ok: true, cleared: true, disabled: true });
    const apiKey = process.env.OPENROUTER_KEY;
    if (!apiKey) return res.status(200).json({ ok: true, cleared: true, debug: "no api key — will use default on next read" });
    const personas = await getPersonas();
    const _cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    const rec = personas[character];
    const base = (rec && rec.persona) || "You are a fictional character setting a status.";
    const NAME = (rec && rec.name) || _cap(character) || "He";
    const themes = (rec && rec.statusThemes) || "";
    const s = await generateStatus(base, NAME, themes, apiKey);
    if (s.status) {
      const rec2 = { status: s.status, mood: s.mood || "", moodEmoji: s.moodEmoji || "", ts: Date.now() };
      await redis(["SET", key, JSON.stringify(rec2)]);
      return res.status(200).json({ ok: true, cleared: true, ...rec2, ageText: ageText(rec2.ts) });
    }
    return res.status(200).json({ ok: true, cleared: true, debug: "regen returned junk all tries; cache cleared, next read will retry" });
  }

  // 1) read cached status
  let cached = null;
  const got = await redis(["GET", key]);
  if (got.ok && got.result) { try { cached = JSON.parse(got.result); } catch (e) {} }

  // VALIDATE-ON-READ: if the cached status itself reads as junk (e.g. an old
  // "User: safety" written before the guard existed), don't trust it — drop it
  // so the logic below regenerates a clean one instead of serving the junk for
  // up to REFRESH_MS. This is what makes a stuck bad status self-heal.
  const cacheIsJunk = cached && looksLikeStatusJunk(cached.status);
  if (cacheIsJunk) cached = null;

  const fresh = cached && cached.ts && (Date.now() - cached.ts < REFRESH_MS);

  // KILL SWITCH: serve cache or a quiet default; never hit the AI.
  if (STATUS_DISABLED) {
    const fallback = cached || { status: "away for a bit.", mood: "offline", moodEmoji: "🚬", ts: Date.now() };
    return res.status(200).json({ ...fallback, ageText: ageText(fallback.ts), cached: true, disabled: true });
  }

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
  const themes = (rec && rec.statusThemes) || "";

  try {
    const s = await generateStatus(base, NAME, themes, apiKey);
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
