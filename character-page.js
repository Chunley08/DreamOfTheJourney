(function () {
  // ============================================================
  //  SHARED CHARACTER PAGE ENGINE
  //  Every character page loads THIS one file. The only thing that
  //  changes per character is window.CHARACTER_CONFIG, set inline
  //  in each HTML page BEFORE this script is included.
  //  Fix a bug here once -> every character is fixed.
  // ============================================================
  const CFG = (window.CHARACTER_CONFIG || {});
  const CHAR = (CFG.CHAR || "scorch").toLowerCase().trim();   // lookup id sent to the API
  const AUTHOR = CFG.AUTHOR || (CHAR.charAt(0).toUpperCase() + CHAR.slice(1)); // display name
  const PRONOUN = CFG.PRONOUN || "they";                      // "he" / "she" / "they" for status text
  const FUNCTION_URL = CFG.FUNCTION_URL || "https://dream-of-the-journey.vercel.app/api/comment";
  // storage keys are namespaced by character so each one has its own session memory
  const K = {
    cid:    CHAR + "CID",
    mem:    CHAR + "Memory_v1",
    votes:  CHAR + "Votes",
    name:   CHAR + "Name",
  };
  // internal side flag for a chat/letter bubble authored BY the character
  // (kept literal for back-compat with stored sessions; not shown to users)
  const SIDE = "scorch";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // ---- PUBLIC WALL ----
  // /api/comment  -> generates + saves Scorch's reply
  // /api/comments -> reads the shared wall (and admin-deletes)
  const WALL_URL = FUNCTION_URL.replace(/\/comment$/, "/comments");
  // open the page as  ...scorch.html?admin=YOURKEY  to get delete buttons.
  const ADMIN_KEY = new URLSearchParams(location.search).get("admin") || "";

  // ---- BLOCK STATE ----
  // a per-SESSION id: lives in sessionStorage, so it's wiped when the tab
  // closes. that makes "getting blocked" a fun, temporary thing — a fresh
  // tab gets a brand-new id the server has never blocked, so the block is gone.
  function getCID(){
    try {
      let c = sessionStorage.getItem(K.cid);
      if (!c) { c = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(K.cid, c); }
      return c;
    } catch (e) { return ""; }
  }
  const CID = getCID();
  let IS_BLOCKED = false;

  // flip the whole page into "you've been blocked" mode
  function setBlocked(){
    if (IS_BLOCKED) return;
    IS_BLOCKED = true;
    const cs = document.getElementById("scSend");
    if (cs) { cs.disabled = true; cs.textContent = "Blocked ✗"; }
    const st = document.getElementById("scStatus");
    if (st) st.innerHTML = '<span class="sc-blocked-note">🚫 ' + AUTHOR + ' blocked you. Your messages won\'t send.</span>';
    const fs = document.getElementById("fmSend");
    if (fs) { fs.disabled = true; fs.textContent = "Returned ✗"; }
    const fst = document.getElementById("fmStatus");
    if (fst) fst.textContent = "🚫 returned to sender — " + PRONOUN + "'s blocked you.";
    const ds = document.getElementById("scChatSend");
    if (ds) ds.disabled = true;
    const di = document.getElementById("scChatInput");
    if (di) { di.disabled = true; di.placeholder = AUTHOR + " blocked you."; }
  }

  // ---- per-session memory (sessionStorage) ----
  // remembers each username's comments + DM thread + letters during THIS visit.
  // sessionStorage wipes automatically when the tab is closed, so a fresh visit
  // starts Scorch over with no memory. Refreshes within the same tab are kept.
  const MEM_KEY = K.mem;
  function loadMem(){ try { return JSON.parse(sessionStorage.getItem(MEM_KEY)) || {}; } catch(e){ return {}; } }
  function saveMem(m){ try { sessionStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch(e){} }
  let memory = loadMem();
  function userKey(name){ return (name || "Anonymous").toLowerCase().trim(); }
  function getUser(name){
    const k = userKey(name);
    if (!memory[k]) memory[k] = { name: name || "Anonymous", comments: [], dm: [] };
    return memory[k];
  }

  const sendBtn = document.getElementById("scSend");
  const nameEl  = document.getElementById("scName");
  const textEl  = document.getElementById("scComment");
  const statusEl= document.getElementById("scStatus");
  const thread  = document.getElementById("scThread");

  // ===== PUBLIC WALL: load + render (shared across all visitors) =====
  let lastSig = "";

  // per-session memory of how THIS device voted (so toggles work + survive redraws)
  const VOTE_KEY = K.votes;
  function loadVotes(){ try { return JSON.parse(sessionStorage.getItem(VOTE_KEY) || "{}"); } catch(e){ return {}; } }
  function saveVotes(v){ try { sessionStorage.setItem(VOTE_KEY, JSON.stringify(v)); } catch(e){} }
  let myVotes = loadVotes();   // { commentId: "like" | "dislike" }

  // per-session display name: lives in sessionStorage, so the chosen name
  // sticks around for this tab (surviving redraws after a reply) but is
  // wiped automatically the moment the tab is closed.
  const NAME_KEY = K.name;
  function loadName(){ try { return sessionStorage.getItem(NAME_KEY) || ""; } catch(e){ return ""; } }
  function saveName(n){ try { sessionStorage.setItem(NAME_KEY, (n||"").trim()); } catch(e){} }

  // avatar color from a name (stable hash -> hue)
  function avatarColor(name){
    let h = 0; const s = (name || "?");
    for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) % 360;
    return "linear-gradient(135deg,hsl(" + h + ",55%,52%),hsl(" + ((h+40)%360) + ",55%,42%))";
  }
  function initials(name){
    const n = (name || "?").trim();
    if (!n) return "?";
    const parts = n.split(/\s+/);
    return ((parts[0][0]||"") + (parts[1] ? parts[1][0] : "")).toUpperCase() || "?";
  }
  function timeAgo(ts){
    if (!ts) return "";
    const s = Math.floor((Date.now()-ts)/1000);
    if (s < 60) return "just now";
    const m = Math.floor(s/60); if (m < 60) return m+"m";
    const h = Math.floor(m/60); if (h < 24) return h+"h";
    const d = Math.floor(h/24); if (d < 7) return d+"d";
    return new Date(ts).toLocaleDateString();
  }
  const HEART = '<svg class="sc-heart" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path class="sc-heart-fill" d="M12 21s-7.5-4.9-10-9.3C.6 9 1.5 5.5 4.6 4.6 6.8 4 9 5 12 8c3-3 5.2-4 7.4-3.4 3.1.9 4 4.4 2.6 7.1C19.5 16.1 12 21 12 21z"/></svg>';
  const HEART_BROKEN = '<svg class="sc-heart" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path class="sc-heart-fill" d="M12 21s-7.5-4.9-10-9.3C.6 9 1.5 5.5 4.6 4.6 6.8 4 9 5 12 8c3-3 5.2-4 7.4-3.4 3.1.9 4 4.4 2.6 7.1C19.5 16.1 12 21 12 21z M12 8l-2 3 3 2-2 3"/></svg>';

  function voteRow(it){
    const mine = myVotes[it.id] || "none";
    return (
      '<div class="sc-actions">' +
        '<span class="sc-vote sc-like' + (mine==="like"?" on":"") + '" data-vote="like" data-id="' + esc(it.id) + '" title="like">' +
          HEART + '<span class="sc-vote-n">' + (it.likes||0) + '</span></span>' +
        '<span class="sc-vote sc-dislike' + (mine==="dislike"?" on":"") + '" data-vote="dislike" data-id="' + esc(it.id) + '" title="dislike">' +
          HEART_BROKEN + '<span class="sc-vote-n">' + (it.dislikes||0) + '</span></span>' +
        '<button type="button" class="sc-reply-btn" data-replybtn="' + esc(it.id) + '">Reply</button>' +
      '</div>' +
      '<div class="sc-reply-box" data-replybox="' + esc(it.id) + '">' +
        '<input type="text" class="sc-rb-name" maxlength="24" placeholder="your name (or anonymous)">' +
        '<textarea class="sc-rb-text" maxlength="280" placeholder="reply..."></textarea>' +
        '<div class="sc-reply-box-row">' +
          '<button type="button" class="sc-reply-post" data-postreply="' + esc(it.id) + '">Reply</button>' +
          '<button type="button" class="sc-reply-cancel" data-cancelreply="' + esc(it.id) + '">cancel</button>' +
          '<span class="sc-mini-status"></span>' +
        '</div>' +
      '</div>'
    );
  }

  function buildComment(it){
    const block = document.createElement("div");
    const isScorch = !!it.isScorch || (it.name === AUTHOR) || (it.name === "Scorch"); // "Scorch" kept for legacy stored rows
    block.className = "sc-comment" + (isScorch ? " is-scorch" : "");
    block.dataset.id = it.id || "";
    const av = '<div class="sc-avatar" style="background:' + (isScorch ? "" : avatarColor(it.name)) + '">' + esc(initials(it.name)) + '</div>';
    const badge = isScorch ? ' <span class="sc-badge">\u2713 ' + AUTHOR + '</span>' : '';
    const when = it.ts ? '<span class="sc-c-time">' + esc(timeAgo(it.ts)) + '</span>' : '';
    const replyingTo = it.__replyingTo
      ? '<div class="sc-reply-to">\u21B3 replying to <b>' + esc(it.__replyingTo) + '</b></div>'
      : '';
    let html =
      '<div class="sc-c-head">' + av +
        '<div class="sc-c-namewrap">' +
          '<span class="sc-comment-author">' + esc(isScorch ? AUTHOR : (it.name || "Anonymous")) + badge + '</span>' +
          when +
        '</div>' +
      '</div>' +
      replyingTo +
      '<div class="sc-comment-text">' + esc(it.comment || "") + '</div>';
    html += voteRow(it);
    // Scorch's own like/dislike badge (if he voted on this comment)
    if (it.scorchVote === "like" || it.scorchVote === "dislike") {
      var liked = it.scorchVote === "like";
      html += '<div class="sc-scorch-verdict ' + (liked ? 'liked' : 'disliked') + '">' +
                '<span class="sc-sv-icon">' + (liked ? '\u2665' : '\uD83D\uDC94') + '</span>' +
                '<span class="sc-sv-text">' + esc(AUTHOR) + (liked ? ' Liked This' : ' Disliked This') + '</span>' +
              '</div>';
    }
    if (ADMIN_KEY && it.id) {
      html += '<button type="button" class="sc-del" data-id="' + esc(it.id) + '">\uD83D\uDDD1 delete</button>';
    }
    block.innerHTML = html;
    return block;
  }

  // turn old embedded {reply} into a synthetic Scorch child node so legacy
  // comments still render threaded under the new model.
  function backfillLegacy(items){
    const out = [];
    items.forEach(it => {
      out.push(it);
      if (it.reply) {
        out.push({ id: it.id + "_r", parentId: it.id, isScorch: true, name: AUTHOR,
                   comment: it.reply, likes: 0, dislikes: 0, ts: (it.ts||0)+1 });
      }
    });
    return out;
  }

  // render a flat list, threading expressed by clamped indent (not nested DOM)
  let pendingItems = null;   // stash a redraw we deferred because the user was typing
  let commentIndex = { byId: {} };  // id -> record, for building reply context from data (not DOM)
  function userIsTyping(){
    // an open reply composer, OR focus inside the thread/composer = don't yank the DOM
    if (thread.querySelector(".sc-reply-box.open")) return true;
    const a = document.activeElement;
    if (a && (a.matches(".sc-rb-name, .sc-rb-text, .sc-name-input, .sc-comment-input") || thread.contains(a))) return true;
    return false;
  }
  function renderWall(rawItems){
    // never blow away the thread while someone's mid-reply — defer it
    if (userIsTyping()) { pendingItems = rawItems; return; }
    const items = backfillLegacy(rawItems);
    const sig = items.map(i => i.id + ":" + (i.likes||0) + ":" + (i.dislikes||0)).join(",")
                + (ADMIN_KEY ? "|a" : "") + "|" + JSON.stringify(myVotes);
    if (sig === lastSig) return;          // unchanged -> don't redraw (no flicker)
    lastSig = sig;

    const byParent = {};
    const byId = {};
    items.forEach(it => {
      byId[it.id] = it;
      const p = it.parentId || "__root";
      (byParent[p] = byParent[p] || []).push(it);
    });
    commentIndex.byId = byId;   // so the reply handler can climb the tree via data

    // walk the tree depth-first so replies still appear directly under
    // their parent — but EMIT EVERY COMMENT AS A FLAT SIBLING of the thread.
    // Depth is just a number we hand to CSS as --d (clamped there), so it
    // can never compound into a collapsed card no matter how deep the chain.
    thread.innerHTML = "";
    const emit = (parentKey, depth) => {
      (byParent[parentKey] || []).forEach(it => {
        const parent = it.parentId ? byId[it.parentId] : null;
        if (parent) it.__replyingTo = parent.isScorch ? AUTHOR : (parent.name || "Anonymous");
        const node = buildComment(it);
        node.dataset.depth = String(depth);
        node.style.setProperty("--d", String(depth));
        thread.appendChild(node);
        emit(it.id, depth + 1);   // no depth limit needed — flat DOM, clamped indent
      });
    };
    emit("__root", 0);
  }
  async function loadWall(){
    try {
      const res = await fetch(WALL_URL + "?character=" + encodeURIComponent(CHAR), { method:"GET" });
      const data = await res.json();
      if (Array.isArray(data.comments)) renderWall(data.comments);
    } catch (e) { /* keep whatever's on screen */ }
  }

  // ===== SCORCH "BROWSING" — occasionally he votes on an existing comment =====
  // Every so often while you're on the page, pick a real (non-Scorch) comment
  // he hasn't voted on yet and have him cast a like/dislike. Low-key, ambient.
  function scorchBrowseTick(){
    try {
      var nodes = Array.prototype.slice.call(thread.querySelectorAll(".sc-comment"));
      // candidates: not his own, no verdict badge yet, has an id + text
      var cands = nodes.filter(function(n){
        return !n.classList.contains("is-scorch") &&
               !n.querySelector(".sc-scorch-verdict") &&
               n.dataset.id &&
               (n.querySelector(".sc-comment-text")||{}).textContent;
      });
      if (!cands.length) return;
      var pick = cands[Math.floor(Math.random()*cands.length)];
      var id = pick.dataset.id;
      var text = pick.querySelector(".sc-comment-text").textContent;
      fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ character: CHAR, mode:"scorch-browse", targetId: id, comment: text, clientId: CID }) })
        .then(function(r){ return r.json(); })
        .then(function(d){
          if (d && (d.voted === "like" || d.voted === "dislike") && !d.already){
            animateVerdict(pick, d.voted, d.likes, d.dislikes);
          }
        }).catch(function(){});
    } catch(e){}
  }
  // drop the badge onto a comment with a little animation (live, while browsing)
  function animateVerdict(block, vote, likes, dislikes){
    if (!block || block.querySelector(".sc-scorch-verdict")) return;
    var liked = vote === "like";
    var v = document.createElement("div");
    v.className = "sc-scorch-verdict " + (liked?"liked":"disliked") + " pop";
    v.innerHTML = '<span class="sc-sv-icon">' + (liked?'\u2665':'\uD83D\uDC94') + '</span>' +
                  '<span class="sc-sv-text">' + esc(AUTHOR) + (liked?' Liked This':' Disliked This') + '</span>';
    var actions = block.querySelector(".sc-actions");
    if (actions) actions.parentNode.insertBefore(v, actions.nextSibling); else block.appendChild(v);
    // bump the visible count too
    try {
      var sel = liked ? ".sc-like .sc-vote-n" : ".sc-dislike .sc-vote-n";
      var nEl = block.querySelector(sel);
      if (nEl && typeof likes==="number") nEl.textContent = liked ? likes : dislikes;
    } catch(e){}
  }
  // run the browse tick on a gentle random cadence (every ~25–55s)
  function scheduleBrowse(){
    var wait = 25000 + Math.random()*30000;
    setTimeout(function(){ if(Math.random() < 0.6) scorchBrowseTick(); scheduleBrowse(); }, wait);
  }
  scheduleBrowse();

  // ===== VOTES + THREADED REPLIES (delegated on the thread) =====
  thread.addEventListener("click", async (e) => {
    // ---- like / dislike ----
    const vote = e.target.closest(".sc-vote");
    if (vote) {
      const id = vote.dataset.id;
      const want = vote.dataset.vote;            // "like" | "dislike"
      const prev = myVotes[id] || "none";
      const dir = (prev === want) ? "none" : want;   // tapping the same one removes it

      // the two vote pills for THIS comment (siblings of the clicked one)
      const actions = vote.closest(".sc-actions");
      const likeEl = actions ? actions.querySelector(".sc-like") : null;
      const dislikeEl = actions ? actions.querySelector(".sc-dislike") : null;
      const likeN = likeEl ? likeEl.querySelector(".sc-vote-n") : null;
      const dislikeN = dislikeEl ? dislikeEl.querySelector(".sc-vote-n") : null;
      const readN = (el) => { const n = parseInt(el && el.textContent, 10); return isNaN(n) ? 0 : n; };

      // ===== OPTIMISTIC: update the numbers + highlight RIGHT NOW =====
      let likes = readN(likeN), dislikes = readN(dislikeN);
      if (prev === "like") likes = Math.max(0, likes - 1);
      if (prev === "dislike") dislikes = Math.max(0, dislikes - 1);
      if (dir === "like") likes += 1;
      if (dir === "dislike") dislikes += 1;
      if (likeN) likeN.textContent = likes;
      if (dislikeN) dislikeN.textContent = dislikes;
      if (likeEl) likeEl.classList.toggle("on", dir === "like");
      if (dislikeEl) dislikeEl.classList.toggle("on", dir === "dislike");

      // remember my vote (per session) so it survives redraws
      const next = { ...myVotes };
      if (dir === "none") delete next[id]; else next[id] = dir;
      myVotes = next; saveVotes(myVotes);
      vote.classList.add("pop"); setTimeout(()=>vote.classList.remove("pop"), 420);
      lastSig = "";  // let the next poll redraw cleanly

      // ===== tell the server; reconcile if it returns authoritative counts =====
      try {
        const res = await fetch(WALL_URL, { method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ character: CHAR, action:"vote", id, dir, prev, clientId: CID }) });
        const data = await res.json();
        if (data && typeof data.likes === "number") {
          if (likeN) likeN.textContent = data.likes;
          if (dislikeN) dislikeN.textContent = data.dislikes;
        }
      } catch (err) { /* keep optimistic numbers; next poll reconciles */ }

      // ---- small chance Scorch notices your vote ----
      if (dir !== "none" && !IS_BLOCKED) {
        const block = vote.closest(".sc-comment");
        const ctxText = block ? (block.querySelector(".sc-comment-text")?.textContent || "") : "";
        fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ character: CHAR, comment: ctxText, mode:"vote-reaction", voteDir: dir, threadContext: ctxText, username:"", clientId: CID }) })
          .then(r => r.json()).then(d => { if (d && d.reply) showVoteReaction(block, d.reply); }).catch(()=>{});
      }
      return;
    }

    // ---- open the reply box ----
    const rbtn = e.target.closest(".sc-reply-btn");
    if (rbtn) {
      const id = rbtn.dataset.replybtn;
      const boxes = thread.querySelectorAll(".sc-reply-box.open");
      boxes.forEach(b => { if (b.dataset.replybox !== id) b.classList.remove("open"); });
      const box = thread.querySelector('.sc-reply-box[data-replybox="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
      if (box) {
        box.classList.toggle("open");
        if (box.classList.contains("open")) {
          const ni = box.querySelector(".sc-rb-name");
          if (ni && !ni.value) ni.value = loadName();
          const t = box.querySelector(".sc-rb-text"); if (t) t.focus();
        }
      }
      return;
    }
    // ---- cancel ----
    const cancel = e.target.closest(".sc-reply-cancel");
    if (cancel) {
      const box = cancel.closest(".sc-reply-box"); if (box) box.classList.remove("open");
      flushPending();
      return;
    }
    // ---- post a threaded reply ----
    const post = e.target.closest(".sc-reply-post");
    if (post) {
      if (IS_BLOCKED) return;
      const id = post.dataset.postreply;
      const box = post.closest(".sc-reply-box");
      const nameI = box.querySelector(".sc-rb-name");
      const textI = box.querySelector(".sc-rb-text");
      const mini = box.querySelector(".sc-mini-status");
      const text = textI.value.trim();
      const name = (nameI.value.trim() || "Anonymous");
      if (!text) { mini.textContent = "type something first."; return; }
      if (nameI.value.trim()) saveName(nameI.value);

      // build the FULL thread context by climbing the parentId chain in the
      // DATA model (the DOM is flat now, so there are no ancestor nodes to walk).
      const authorOf = (rec) => rec.isScorch ? AUTHOR : (rec.name || "someone");
      const chain = [];
      const start = commentIndex.byId[id] || null;
      let parentAuthor = "someone", parentText = "";
      if (start) { parentAuthor = authorOf(start); parentText = start.comment || ""; }
      let cur = start, guard = 0;
      while (cur && guard++ < 60) {
        chain.unshift("  " + authorOf(cur) + ': "' + (cur.comment || "") + '"');
        cur = cur.parentId ? commentIndex.byId[cur.parentId] : null;
      }
      // spell it out so even a weak model gets who's agreeing with whom
      const ctx =
        "The conversation so far (oldest to newest):\n" + chain.join("\n") +
        "\n\n" + (name || "Someone") + ' is now replying to ' + parentAuthor +
        "'s comment" + (parentText ? ' ("' + parentText + '")' : "") + ".";

      post.disabled = true; mini.textContent = "posting...";
      // remember this person's reply in the same per-session memory as their comments
      const ru = getUser(name);
      const replyPast = ru.comments.slice();
      try {
        const res = await fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ character: CHAR, comment: text, mode:"reply", parentId: id, threadContext: ctx, username: name, pastComments: replyPast, clientId: CID }) });
        const data = await res.json();
        if (data.blocked) { mini.innerHTML = '<span class="sc-blocked-note">🚫 ' + esc(data.notice || "you've been blocked.") + '</span>'; setBlocked(); return; }
        // save their reply into memory so he recalls it later this session
        ru.comments.push(text); ru.comments = ru.comments.slice(-12); saveMem(memory);
        textI.value = ""; box.classList.remove("open"); mini.textContent = "";
        if (data.justBlocked) { setTimeout(setBlocked, 600); }
        // refresh to show the new threaded reply AND Scorch's answer if he gave one.
        // Always refresh (not just on data.saved) — and do it twice, because his
        // answer node can save a moment after the fan's reply, so a single early
        // refresh sometimes misses it. This was the "he barely replies" bug.
        lastSig = "";
        setTimeout(loadWall, 400);   // show the fan's reply fast
        setTimeout(function(){ lastSig = ""; loadWall(); }, 1600);  // catch Scorch's answer
      } catch (err) { mini.textContent = "couldn't post — try again."; }
      finally { post.disabled = false; }
      return;
    }
  });

  // re-run a redraw we deferred while the user was typing
  function flushPending(){
    if (pendingItems && !userIsTyping()) { const it = pendingItems; pendingItems = null; lastSig = ""; renderWall(it); }
  }

  // surface Scorch's reaction to a vote as a transient line under the comment
  function showVoteReaction(block, text){
    if (!block) return;
    let n = block.querySelector(".sc-vote-reaction");
    if (!n) {
      n = document.createElement("div");
      n.className = "sc-reply sc-vote-reaction";
      n.innerHTML = '<div class="sc-reply-author">' + AUTHOR + ' <span>\u2713</span></div><div class="sc-reply-text"></div>';
      const actions = block.querySelector(".sc-actions");
      if (actions) actions.parentNode.insertBefore(n, actions);
      else block.appendChild(n);
    }
    n.querySelector(".sc-reply-text").textContent = text;
  }
  if (ADMIN_KEY) {
    thread.addEventListener("click", async (e) => {
      const btn = e.target.closest(".sc-del");
      if (!btn) return;
      if (!confirm("Delete this comment for everyone?")) return;
      btn.disabled = true; btn.textContent = "deleting...";
      try {
        await fetch(WALL_URL, {
          method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ character: CHAR, action:"delete", id: btn.dataset.id, key: ADMIN_KEY }),
        });
        lastSig = ""; await loadWall();
      } catch (err) { btn.disabled = false; btn.textContent = "\uD83D\uDDD1 delete"; }
    });

    // ----- admin panel: who Scorch has blocked -----
    const panel = document.createElement("div");
    panel.className = "sc-admin-panel";
    panel.innerHTML =
      '<div class="sc-admin-head">\uD83D\uDEE1 Admin \u00b7 Blocked list ' +
        '<button type="button" class="sc-admin-btn" id="scAdminRefresh">refresh</button>' +
        '<button type="button" class="sc-admin-btn sc-admin-danger" id="scAdminClear">clear ALL comments</button>' +
      '</div><div class="sc-admin-body" id="scAdminBody">loading...</div>';
    const commentsCard = document.getElementById(CFG.COMMENTS_CARD_ID || "scorchComments");
    if (commentsCard) commentsCard.insertBefore(panel, commentsCard.querySelector(".sc-comment-form"));

    const adminBody = panel.querySelector("#scAdminBody");
    async function loadBlocked(){
      adminBody.textContent = "loading...";
      try {
        const res = await fetch(WALL_URL, { method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ character: CHAR, action:"listblocked", key: ADMIN_KEY }) });
        const data = await res.json();
        const list = data.blocked || [];
        if (!list.length) { adminBody.innerHTML = '<div class="sc-admin-empty">nobody\u2019s blocked. ' + esc(CFG.ADMIN_EMPTY_BLOCKED || (PRONOUN + "\u2019s being\u2026 tolerant.")) + '</div>'; return; }
        adminBody.innerHTML = "";
        list.forEach(b => {
          const row = document.createElement("div");
          row.className = "sc-admin-row";
          const when = b.ts ? new Date(b.ts).toLocaleString() : "";
          row.innerHTML =
            '<div class="sc-admin-info"><b>' + esc(b.name || "Anonymous") + '</b>' +
            '<span class="sc-admin-reason">' + esc((b.reason || "").slice(0,120)) + '</span>' +
            '<span class="sc-admin-when">' + esc(when) + '</span></div>';
          const ub = document.createElement("button");
          ub.type = "button"; ub.className = "sc-admin-btn"; ub.textContent = "unblock";
          ub.addEventListener("click", async () => {
            ub.disabled = true; ub.textContent = "...";
            try {
              await fetch(WALL_URL, { method:"POST", headers:{ "Content-Type":"application/json" },
                body: JSON.stringify({ character: CHAR, action:"unblock", field: b.field, key: ADMIN_KEY }) });
              loadBlocked();
            } catch (e) { ub.disabled = false; ub.textContent = "unblock"; }
          });
          row.appendChild(ub);
          adminBody.appendChild(row);
        });
      } catch (e) { adminBody.textContent = "couldn't load blocked list."; }
    }
    panel.querySelector("#scAdminRefresh").addEventListener("click", loadBlocked);
    panel.querySelector("#scAdminClear").addEventListener("click", async () => {
      if (!confirm("Wipe the ENTIRE public comment wall? This can't be undone.")) return;
      try {
        await fetch(WALL_URL, { method:"POST", headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ character: CHAR, action:"clear", key: ADMIN_KEY }) });
        lastSig = ""; loadWall();
      } catch (e) {}
    });
    loadBlocked();
  }

  // restore the name the user chose earlier this session, and keep it saved
  // as they type so it survives the redraw that happens after sending.
  if (nameEl) {
    const saved = loadName();
    if (saved && !nameEl.value) nameEl.value = saved;
    nameEl.addEventListener("input", () => saveName(nameEl.value));
  }

  // load now + refresh every 15s so other people's comments appear live
  loadWall();
  setInterval(loadWall, 15000);


  if (sendBtn) sendBtn.addEventListener("click", async () => {
    if (IS_BLOCKED) { statusEl.innerHTML = '<span class="sc-blocked-note">🚫 message could not be sent — you\'ve been blocked.</span>'; return; }
    const comment = textEl.value.trim();
    const name = (nameEl.value.trim() || "Anonymous");
    if (!comment) { statusEl.textContent = "type something first."; return; }
    if (nameEl.value.trim()) saveName(nameEl.value);

    const user = getUser(name);
    const pastComments = user.comments.slice();  // what he's seen from them before

    // optimistic preview (flat model): the comment + a "typing" Scorch reply,
    // both as siblings, the reply indented one level via --d
    const block = buildComment({ id:"_pending", name, comment, likes:0, dislikes:0, ts:Date.now() });
    block.dataset.depth = "0"; block.style.setProperty("--d", "0");
    const sc = buildComment({ id:"_pending_r", name:AUTHOR, isScorch:true, comment:"typing\u2026", likes:0, dislikes:0, ts:Date.now(), __replyingTo: name });
    sc.dataset.depth = "1"; sc.style.setProperty("--d", "1");
    sc.querySelector(".sc-comment-text").classList.add("sc-typing");
    thread.prepend(sc); thread.prepend(block);   // block on top, Scorch reply right below it
    const replyEl = sc.querySelector(".sc-comment-text");

    textEl.value = ""; sendBtn.disabled = true; statusEl.textContent = "sending...";
    try {
      const res = await fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ character: CHAR, comment, mode:"comment", username: name, pastComments, clientId: CID }) });
      const data = await res.json();

      if (data.blocked) {
        block.remove();
        statusEl.innerHTML = '<span class="sc-blocked-note">🚫 ' + esc(data.notice || "message could not be sent — you've been blocked.") + '</span>';
        setBlocked();
        return;
      }

      replyEl.classList.remove("sc-typing");
      if (data.reply && data.reply !== "...(no reply)") {
        replyEl.textContent = data.reply;
      } else {
        // he didn't answer (or model busy) — drop the empty Scorch preview
        sc.remove();
        if (data.debug) statusEl.textContent = "⚠ " + data.debug;
      }
      statusEl.textContent = statusEl.textContent || "";

      user.comments.push(comment);
      user.comments = user.comments.slice(-12);
      saveMem(memory);

      // reconcile with the canonical saved version (gets real ids, votes, admin delete)
      if (data.saved) { lastSig = ""; setTimeout(loadWall, 400); }

      if (data.justBlocked) {
        const tag = document.createElement("div");
        tag.className = "sc-blocked-note sc-blocked-stamp";
        tag.textContent = "🚫 " + AUTHOR + " blocked you.";
        block.appendChild(tag);
        setTimeout(setBlocked, 600);
      }

      if (data.dm) {
        currentDmUser = name;
        primeDMFor(name);
        receiveDM(data.dm);
      }
    } catch (e) {
      replyEl.classList.remove("sc-typing");
      replyEl.textContent = (CFG.UNREACHABLE || "(couldn't reach " + PRONOUN + " - try again)");
      statusEl.textContent = "connection failed.";
    } finally { sendBtn.disabled = false; }
  });

  // ===== DM CHAT =====
  const fab = document.getElementById("scDmFab");
  const chat = document.getElementById("scChat");
  const chatClose = document.getElementById("scChatClose");
  const chatBody = document.getElementById("scChatBody");
  const chatInput = document.getElementById("scChatInput");
  const chatSend = document.getElementById("scChatSend");
  const notif = document.getElementById("scDmNotif");
  const splash = document.getElementById("scDmSplash");

  function playSplash(){
    if (!splash) return;
    splash.classList.remove("show");
    void splash.offsetWidth;   // restart the animation if it's mid-play
    splash.classList.add("show");
    splash.setAttribute("aria-hidden","false");
    setTimeout(() => { splash.classList.remove("show"); splash.setAttribute("aria-hidden","true"); }, 2900);
  }

  // who the current DM thread belongs to (defaults to whatever name is typed, else Anonymous)
  let currentDmUser = "Anonymous";
  let dmHistory = [];

  // load a username's saved DM thread into the window
  function primeDMFor(name){
    currentDmUser = name || (nameEl && nameEl.value.trim()) || "Anonymous";
    const user = getUser(currentDmUser);
    dmHistory = user.dm.slice();
    chatBody.innerHTML = "";
    if (dmHistory.length === 0) {
      // no auto-message; just a faint hint until someone speaks
      const hint = document.createElement("div");
      hint.className = "sc-chat-msg sc-from-scorch sc-typing";
      hint.textContent = "(no messages yet. say something — or don't.)";
      chatBody.appendChild(hint);
    } else {
      dmHistory.forEach(m => addMsg(m.text, m.from, false));
    }
  }

  function showNotif(){ fab.classList.add("has-notif"); notif.style.display="flex"; }
  function clearNotif(){ fab.classList.remove("has-notif"); notif.style.display="none"; }

  function openChat(){
    // open onto the current typed name's thread
    primeDMFor((nameEl && nameEl.value.trim()) || currentDmUser);
    chat.classList.add("open"); chat.setAttribute("aria-hidden","false");
    fab.style.display="none"; clearNotif(); chatInput.focus();
  }
  function closeChat(){ chat.classList.remove("open"); chat.setAttribute("aria-hidden","true"); fab.style.display=""; }
  if (fab) fab.addEventListener("click", openChat);
  if (chatClose) chatClose.addEventListener("click", closeChat);

  function addMsg(text, from, persist){
    // clear the faint hint if present
    const hint = chatBody.querySelector(".sc-from-scorch.sc-typing");
    if (hint && hint.textContent.startsWith("(no messages")) hint.remove();
    const m = document.createElement("div");
    m.className = "sc-chat-msg " + (from === "user" ? "sc-from-user" : "sc-from-scorch");
    m.textContent = text;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
    if (persist !== false) {
      const user = getUser(currentDmUser);
      user.dm.push({ from, text });
      user.dm = user.dm.slice(-30);
      dmHistory = user.dm.slice();
      saveMem(memory);
    }
    return m;
  }

  // an unprompted DM arriving from a comment trigger
  function receiveDM(text){
    primeDMFor(currentDmUser);
    addMsg(text, SIDE);           // saved to that user's thread
    if (!chat.classList.contains("open")) { showNotif(); playSplash(); }  // ping + splash if closed
  }

  async function sendDM(){
    if (IS_BLOCKED) { addMsg("🚫 message could not be sent — " + AUTHOR + " blocked you.", SIDE, false); return; }
    const text = chatInput.value.trim();
    if (!text) return;
    addMsg(text, "user");
    // also fold this into the shared per-session memory so his comment/reply
    // replies can recall what they said in DMs (one connected memory of them).
    try { const du = getUser(currentDmUser); du.comments.push(text); du.comments = du.comments.slice(-12); saveMem(memory); } catch(e){}
    chatInput.value = ""; chatSend.disabled = true;
    const typing = addMsg("typing...", SIDE, false);
    typing.classList.add("sc-typing");
    try {
      const res = await fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ character: CHAR, comment: text, mode:"dm", history: dmHistory, username: currentDmUser, pastComments: getUser(currentDmUser).comments, clientId: CID }) });
      const data = await res.json();
      typing.remove();
      if (data.blocked) {
        addMsg("🚫 " + (data.notice || "message could not be sent — you've been blocked."), SIDE, false);
        setBlocked();
        return;
      }
      if (data.reply) {
        addMsg(data.reply, SIDE);
      } else if (data.error) {
        addMsg((CFG.DM_BUSY || "(busy. the AI's overloaded — give it a sec and try again.)"), SIDE, false);
      } else {
        addMsg("...", SIDE);
      }
      if (data.justBlocked) {
        const n = addMsg("🚫 " + AUTHOR + " blocked you.", SIDE, false);
        n.classList.add("sc-blocked-note");
        setTimeout(setBlocked, 600);
      }
    } catch (e) {
      typing.remove();
      addMsg((CFG.DM_OFFLINE || ("(" + PRONOUN + "'s not answering.)")), SIDE, false);
    } finally { if (!IS_BLOCKED) { chatSend.disabled = false; chatInput.focus(); } }
  }
  if (chatSend) chatSend.addEventListener("click", sendDM);
  if (chatInput) chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendDM(); });

  // ===== FANMAIL (letters, with per-username memory) =====
  // This whole feature is OPTIONAL per character. If the page has no fanmail
  // section (no #fmReplies), we skip the entire block so pages without letters
  // (e.g. Shane) don't error. Wrapped in a function we only call when present.
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function initFanmail() {
  const fmName = document.getElementById("fmName");
  const fmBody = document.getElementById("fmBody");
  const fmSend = document.getElementById("fmSend");
  const fmStatus = document.getElementById("fmStatus");
  const fmReplies = document.getElementById("fmReplies");
  const fmSheet = document.getElementById("fmSheet");
  const fmTape1 = document.getElementById("fmTape1");
  const fmTape2 = document.getElementById("fmTape2");
  if (!fmReplies) return;   // no fanmail section on this character's page — skip it

  // render any saved letters for the name currently signed
  function renderLetters(name){
    const user = getUser(name || (fmName && fmName.value.trim()) || "Anonymous");
    fmReplies.innerHTML = "";
    (user.letters || []).forEach(entry => {
      if (entry.from === SIDE) addLetterReply(entry.text, user.name, false);
    });
  }

  // build a reply flyer node (torn paper + tape). animate=false for restored history.
  function makeReplyFlyer(toName){
    const f = document.createElement("div");
    f.className = "fanmail-reply";
    f.innerHTML =
      '<span class="fm-grain" aria-hidden="true"></span>' +
      '<span class="fm-reply-tape" style="top:-12px;left:30px;transform:rotate(-16deg)" aria-hidden="true"></span>' +
      '<span class="fm-reply-tape" style="top:-10px;right:40px;transform:rotate(12deg)" aria-hidden="true"></span>' +
      '<div class="fanmail-reply-to">RE: ' + esc(toName || "whoever") + ' —</div>' +
      '<div class="fanmail-reply-text"></div>' +
      '<div class="fanmail-reply-sign">— ' + AUTHOR.toUpperCase() + '</div>';
    return f;
  }

  function addLetterReply(text, toName, persist){
    const f = makeReplyFlyer(toName);
    f.querySelector(".fanmail-reply-text").textContent = text;
    fmReplies.prepend(f);
    if (persist !== false) {
      const user = getUser(toName);
      user.letters = user.letters || [];
      user.letters.push({ from:SIDE, text });
      user.letters = user.letters.slice(-20);
      saveMem(memory);
    }
    return f;
  }

  // marker handwriting — scrawls on, pausing at punctuation
  function typeMarker(el, text){
    return new Promise(resolve => {
      if (reduceMotion) { el.textContent = text; resolve(); return; }
      el.textContent = ""; el.classList.add("fm-caret");
      let i = 0;
      const step = () => {
        if (i >= text.length) { el.classList.remove("fm-caret"); return resolve(); }
        el.textContent += text[i++];
        let d = 20 + Math.random() * 30;
        if (".!?,".indexOf(text[i-1]) >= 0) d += 130 + Math.random()*120;
        setTimeout(step, d);
      };
      step();
    });
  }

  // SEND — rip the setlist off the wall
  function playSend(){
    return new Promise(resolve => {
      if (reduceMotion || !fmSheet) {
        if (fmSheet) { fmSheet.style.transition = "opacity .25s"; fmSheet.style.opacity = ".3"; }
        return resolve();
      }
      if (fmTape1) fmTape1.classList.add("fly");
      if (fmTape2) fmTape2.classList.add("fly");
      fmSheet.classList.add("yank");
      setTimeout(resolve, 900);
    });
  }

  // reset the writing setlist back onto the wall after a send
  function resetSheet(){
    if (!fmSheet) return;
    fmSheet.classList.remove("yank");
    fmSheet.style.opacity = "";
    if (fmTape1) fmTape1.classList.remove("fly");
    if (fmTape2) fmTape2.classList.remove("fly");
  }

  // RECEIVE — his reply slaps onto the wall, then scrawls on in marker
  async function playReceive(toName, text){
    try {
      if (reduceMotion) { return addLetterReply(text, toName, false); }
      const f = makeReplyFlyer(toName);
      fmReplies.prepend(f);
      await wait(60);
      f.classList.add("slap");
      await wait(560);
      await typeMarker(f.querySelector(".fanmail-reply-text"), text);
      return f;
    } catch (e) {
      return addLetterReply(text, toName, false);   // never lose the reply
    }
  }

  if (fmSend) fmSend.addEventListener("click", async () => {
    if (IS_BLOCKED) { fmStatus.innerHTML = '<span class="sc-blocked-note">🚫 returned to sender — ' + esc(PRONOUN) + '\'s blocked you.</span>'; return; }
    const body = fmBody.value.trim();
    const name = (fmName.value.trim() || "Anonymous");
    if (!body) { fmStatus.textContent = "scrawl something first."; return; }

    const user = getUser(name);
    user.letters = user.letters || [];
    user.letters.push({ from:"user", text: body });
    user.letters = user.letters.slice(-20);
    saveMem(memory);

    fmSend.disabled = true; fmStatus.textContent = "ripping it off the wall...";

    // fire the request and the send animation at the same time
    const netP = fetch(FUNCTION_URL, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ character: CHAR, comment: body, mode:"letter", history: user.letters, username: name, pastComments: user.comments, clientId: CID }) })
      .then(r => r.json()).catch(() => ({ error: "net" }));

    await playSend();
    fmBody.value = "";          // clear the page once it's gone
    resetSheet();               // tape it back to the wall, blank
    fmStatus.textContent = "waiting on the mailman...";
    const data = await netP;

    // blocked before he ever read it
    if (data.blocked) {
      fmStatus.innerHTML = '<span class="sc-blocked-note">🚫 ' + esc(data.notice || "returned to sender — you've been blocked.") + '</span>';
      setBlocked();
      return;
    }

    let replyText, real = false;
    if (data.reply) { replyText = data.reply; real = true; }
    else if (data.error) replyText = "(the mail's backed up — free AI's busy. send it again in a sec.)";
    else replyText = (CFG.LETTER_NO_REPLY || ("...(" + PRONOUN + " read it. didn't write back.)"));

    await playReceive(name, replyText);

    // persist his reply so it shows on a later visit (only real replies)
    if (real) {
      user.letters.push({ from:SIDE, text: replyText });
      user.letters = user.letters.slice(-20);
      saveMem(memory);
    }

    if (data.justBlocked) {
      fmStatus.innerHTML = '<span class="sc-blocked-note">🚫 ...and then ' + esc(PRONOUN) + ' blocked you.</span>';
      setTimeout(setBlocked, 600);
    } else {
      fmStatus.textContent = "";
      fmSend.disabled = false;
    }
  });

  // when you change the signed name, show that person's letter history
  if (fmName) fmName.addEventListener("change", () => renderLetters(fmName.value.trim()));
  renderLetters();
  }  // end initFanmail
  initFanmail();   // runs only if a fanmail section is present (guarded inside)

  // (A character only slides into DMs as a reaction to a comment they like or
  // really hate — handled server-side per comment. No out-of-nowhere timer DMs.)
})();
