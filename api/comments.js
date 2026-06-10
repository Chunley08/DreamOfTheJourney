// ============================================================
//  /api/comments  —  the PUBLIC COMMENT WALL store
//  GET    -> returns the shared wall (newest first), up to 200.
//            Each item: { id, parentId, name, comment, reply,
//                         likes, dislikes, ts }
//  POST (public):
//     { action:"vote", id, dir:"like"|"dislike"|"none", prev }
//        -> toggles a vote count and returns {likes,dislikes}
//  POST (admin, needs key):
//     { action:"delete", id, key }   -> deletes a comment + all its replies
//     { action:"clear", key }
//     { action:"listblocked", key } / { action:"unblock", field, key }
//
//  Storage: a Redis LIST at key "scorch:wall" (newest at head,
//  capped at MAX). Threading is by parentId; the front end nests.
//  Replies + Scorch's in-thread answers are written by /api/comment.
// ============================================================

// Each character has their OWN wall + block list ("drawer"). Scorch keeps
// the original keys so his existing comments are preserved; everyone else
// gets "wall:<character>" / "blocked:<character>". The character is passed
// in via ?character= on GET, or in the JSON body on POST actions.
function wallKeyFor(character) {
  const c = String(character || "scorch").toLowerCase().trim();
  return c === "scorch" ? "scorch:wall" : "wall:" + c;
}
function blockKeyFor(character) {
  const c = String(character || "scorch").toLowerCase().trim();
  return c === "scorch" ? "scorch:blocked" : "blocked:" + c;
}
const MAX = 200; // keep newest 200 (threads use up more slots)

// normalize an old/new stored record so threading + votes always exist
function normalize(c) {
  if (!c || typeof c !== "object") return null;
  return {
    id: c.id,
    parentId: c.parentId || null,
    isScorch: !!c.isScorch,
    name: c.name || "Anonymous",
    comment: c.comment || "",
    reply: c.reply || null,   // legacy field (old embedded replies) — front end backfills
    likes: c.likes || 0,
    dislikes: c.dislikes || 0,
    scorchVote: c.scorchVote || null,   // "like" | "dislike" if Scorch voted on it
    ts: c.ts || 0,
  };
}

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
    const character = (req.query && req.query.character) || "scorch";
    const wallKey = wallKeyFor(character);
    const out = await redis(["LRANGE", wallKey, "0", String(MAX - 1)]);
    if (!out.ok) {
      return res.status(200).json({ comments: [], debug: out.error || "redis read failed" });
    }
    const comments = (out.result || [])
      .map((s) => { try { return normalize(JSON.parse(s)); } catch (e) { return null; } })
      .filter(Boolean);
    return res.status(200).json({ comments });
  }

  // -------- POST --------
  if (req.method === "POST") {
    const body = req.body || {};
    const { action } = body;
    // which character's wall/blocklist this action targets
    const character = body.character || "scorch";
    const wallKey = wallKeyFor(character);
    const blockKey = blockKeyFor(character);

    // ===== PUBLIC: toggle a like/dislike on a comment =====
    // dir = the vote the user now wants ("like"|"dislike"|"none")
    // prev = what they had before ("like"|"dislike"|"none") so we adjust counts
    if (action === "vote") {
      const id = body.id;
      const dir = body.dir;                 // desired state: like | dislike | none
      const voter = String(body.clientId || "").slice(0, 80);
      if (!id) return res.status(400).json({ error: "no id" });
      if (!voter) return res.status(400).json({ error: "no voter" });
      if (!["like", "dislike", "none"].includes(dir)) return res.status(400).json({ error: "bad dir" });

      // per-comment hash of who voted what: VOTES_KEY:<id> -> { clientId: "like"|"dislike" }
      const vkey = "scorch:votes:" + id;

      // record (or clear) THIS person's vote — idempotent, so re-tapping can't double-count
      if (dir === "none") {
        await redis(["HDEL", vkey, voter]);
      } else {
        await redis(["HSET", vkey, voter, dir]);
      }

      // recount from the source of truth (everyone's stored votes)
      const all = await redis(["HVALS", vkey]);
      let likes = 0, dislikes = 0;
      (all.result || []).forEach(v => { if (v === "like") likes++; else if (v === "dislike") dislikes++; });

      // mirror the totals onto the comment record so GET stays correct
      // FIX: the character's own vote (scorchVote) lives ONLY on the record,
      // not in the voter hash — so the recount must ADD it back, or a user
      // vote overwrites/erases the character's vote (1 + 1 stayed 1).
      let finalLikes = likes, finalDislikes = dislikes;
      const list = await redis(["LRANGE", wallKey, "0", String(MAX - 1)]);
      if (list.ok) {
        const arr = list.result || [];
        for (let i = 0; i < arr.length; i++) {
          try {
            const o = JSON.parse(arr[i]);
            if (o.id === id) {
              finalLikes = likes + (o.scorchVote === "like" ? 1 : 0);
              finalDislikes = dislikes + (o.scorchVote === "dislike" ? 1 : 0);
              o.likes = finalLikes; o.dislikes = finalDislikes;
              await redis(["LSET", wallKey, String(i), JSON.stringify(o)]);
              break;
            }
          } catch (e) {}
        }
      }

      return res.status(200).json({ ok: true, likes: finalLikes, dislikes: finalDislikes, you: dir });
    }

    // ===== ADMIN ACTIONS (need the key) =====
    const { id, key } = body;
    const ADMIN = process.env.ADMIN_KEY || "";

    if (!ADMIN) return res.status(500).json({ error: "ADMIN_KEY not set on the server" });
    if (key !== ADMIN) return res.status(403).json({ error: "wrong admin key" });

    if (action === "clear") {
      const out = await redis(["DEL", wallKey]);
      return res.status(200).json({ ok: out.ok, cleared: true, debug: out.error || null });
    }

    // ---- list everyone Scorch has blocked ----
    if (action === "listblocked") {
      const out = await redis(["HGETALL", blockKey]);
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
      const got = await redis(["HGET", blockKey, field]);
      let rec = null; try { rec = JSON.parse(got.result); } catch (e) {}
      const dels = [field];
      if (rec) {
        if (rec.name && rec.name.toLowerCase() !== "anonymous") dels.push("n:" + rec.name.toLowerCase().trim());
        if (rec.clientId) dels.push("c:" + rec.clientId);
      }
      for (const f of [...new Set(dels)]) await redis(["HDEL", blockKey, f]);
      return res.status(200).json({ ok: true, unblocked: rec ? rec.name : field });
    }

    if (action === "delete") {
      if (!id) return res.status(400).json({ error: "no id" });
      const list = await redis(["LRANGE", wallKey, "0", String(MAX - 1)]);
      if (!list.ok) return res.status(200).json({ ok: false, debug: list.error });
      const arr = list.result || [];

      // parse everything so we can walk the thread tree
      const parsed = arr.map((s) => { try { return { raw: s, obj: JSON.parse(s) }; } catch (e) { return null; } }).filter(Boolean);

      // collect the target id + every descendant (replies, replies-of-replies, ...)
      const toKill = new Set([id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const p of parsed) {
          if (p.obj.parentId && toKill.has(p.obj.parentId) && !toKill.has(p.obj.id)) {
            toKill.add(p.obj.id); grew = true;
          }
        }
      }

      let removed = 0;
      for (const p of parsed) {
        if (toKill.has(p.obj.id)) {
          const out = await redis(["LREM", wallKey, "1", p.raw]);
          if (out.ok) removed += (out.result || 0);
          await redis(["DEL", "scorch:votes:" + p.obj.id]);   // clear its vote tally too
        }
      }
      return res.status(200).json({ ok: true, removed, killed: [...toKill].length });
    }

    return res.status(400).json({ error: "unknown action" });
  }

  return res.status(405).json({ error: "GET or POST only" });
}
