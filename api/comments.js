// ============================================================
//  /api/comments  —  the PUBLIC COMMENT WALL store
//  GET    -> returns the shared wall (newest first), up to 100
//  POST   -> admin actions only:
//              { action:"delete", id:"<id>", key:"<ADMIN_KEY>" }
//              { action:"clear",  key:"<ADMIN_KEY>" }
//
//  Storage: a Redis LIST at key "scorch:wall".
//    - newest comment is at the head (LPUSH)
//    - capped at the newest 100 (LTRIM) so old ones auto-delete
//
//  Reads Redis creds from EITHER naming the Vercel/Upstash
//  integration might have created:
//    KV_REST_API_URL / KV_REST_API_TOKEN     (Vercel marketplace)
//    UPSTASH_REDIS_REST_URL / ..._TOKEN       (Upstash direct)
//
//  Admin password comes from env var ADMIN_KEY (set it in Vercel).
// ============================================================

const WALL_KEY = "scorch:wall";
const BLOCK_KEY = "scorch:blocked";
const MAX = 100; // keep newest 100

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

// run a single Redis command, e.g. redis(["LRANGE", key, "0", "99"])
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // -------- READ THE WALL (public) --------
  if (req.method === "GET") {
    const out = await redis(["LRANGE", WALL_KEY, "0", String(MAX - 1)]);
    if (!out.ok) {
      return res.status(200).json({ comments: [], debug: out.error || "redis read failed" });
    }
    const comments = (out.result || [])
      .map((s) => { try { return JSON.parse(s); } catch (e) { return null; } })
      .filter(Boolean);
    return res.status(200).json({ comments });
  }

  // -------- ADMIN ACTIONS --------
  if (req.method === "POST") {
    const { action, id, key } = req.body || {};
    const ADMIN = process.env.ADMIN_KEY || "";

    if (!ADMIN) return res.status(500).json({ error: "ADMIN_KEY not set on the server" });
    if (key !== ADMIN) return res.status(403).json({ error: "wrong admin key" });

    if (action === "clear") {
      const out = await redis(["DEL", WALL_KEY]);
      return res.status(200).json({ ok: out.ok, cleared: true, debug: out.error || null });
    }

    // ---- list everyone Scorch has blocked ----
    if (action === "listblocked") {
      const out = await redis(["HGETALL", BLOCK_KEY]);
      if (!out.ok) return res.status(200).json({ blocked: [], debug: out.error });
      // HGETALL returns a flat [field, value, field, value, ...]
      const flat = out.result || [];
      const seen = new Set();
      const blocked = [];
      for (let i = 0; i < flat.length; i += 2) {
        const field = flat[i];
        let rec; try { rec = JSON.parse(flat[i + 1]); } catch (e) { continue; }
        const dedupe = (rec.name || "") + "|" + (rec.ts || "");
        if (seen.has(dedupe)) continue;       // skip the n:/c: duplicate
        seen.add(dedupe);
        blocked.push({ field, name: rec.name, reason: rec.reason, ts: rec.ts, clientId: rec.clientId });
      }
      blocked.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return res.status(200).json({ blocked });
    }

    // ---- unblock someone (removes BOTH their name-key and device-key) ----
    if (action === "unblock") {
      const field = (req.body || {}).field;
      if (!field) return res.status(400).json({ error: "no field" });
      const got = await redis(["HGET", BLOCK_KEY, field]);
      let rec = null; try { rec = JSON.parse(got.result); } catch (e) {}
      const dels = [field];
      if (rec) {
        if (rec.name && rec.name.toLowerCase() !== "anonymous") dels.push("n:" + rec.name.toLowerCase().trim());
        if (rec.clientId) dels.push("c:" + rec.clientId);
      }
      for (const f of [...new Set(dels)]) await redis(["HDEL", BLOCK_KEY, f]);
      return res.status(200).json({ ok: true, unblocked: rec ? rec.name : field });
    }

    if (action === "delete") {
      if (!id) return res.status(400).json({ error: "no id" });
      // find the exact stored string whose parsed id matches, then LREM it
      const list = await redis(["LRANGE", WALL_KEY, "0", String(MAX - 1)]);
      if (!list.ok) return res.status(200).json({ ok: false, debug: list.error });
      const raw = (list.result || []).find((s) => {
        try { return JSON.parse(s).id === id; } catch (e) { return false; }
      });
      if (!raw) return res.status(200).json({ ok: true, note: "already gone" });
      const out = await redis(["LREM", WALL_KEY, "1", raw]);
      return res.status(200).json({ ok: out.ok, removed: out.result, debug: out.error || null });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  return res.status(405).json({ error: "GET or POST only" });
}
