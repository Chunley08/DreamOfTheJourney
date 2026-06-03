/* ============================================================
   script.js — extracted from index.html
   Three original <script> blocks combined in document order.
   (The <script type="application/json"> data blocks were left
    inline in index.html on purpose — they are data, not code.)
   ============================================================ */

/* ---------- BLOCK 1 ---------- */
/* ---------- DRAGON CURSOR (runs FIRST so it can't be blocked by errors elsewhere) ---------- */
(function initDragonCursor() {
  function setup() {
    try {
      const dragon = document.getElementById('dragonCursor');
      if (!dragon) return; // nothing to do if the element isn't there yet

      // Touch devices: hide custom cursor, restore normal OS cursor
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (isTouch) {
        document.body.classList.add('touch-device');
        return;
      }

      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let dx = mx, dy = my;
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2;

      document.addEventListener('mousemove',  e => { mx = e.clientX; my = e.clientY; });
      document.addEventListener('mousedown',  () => dragon.classList.add('clicking'));
      document.addEventListener('mouseup',    () => dragon.classList.remove('clicking'));
      document.addEventListener('mouseleave', () => { dragon.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { dragon.style.opacity = '1'; });

      (function animateDragon() {
        dx += (mx - dx) * 0.4;
        dy += (my - dy) * 0.4;
        dragon.style.transform = `translate(${dx - startX}px, ${dy - startY}px)`;
        requestAnimationFrame(animateDragon);
      })();

      // Show the dragon cursor immediately so the page is always usable.
      // Image handling is decoupled: if the dragon.webp loads, great — the
      // user sees the dragon. If it fails (now or later), the error handler
      // swaps in a glowing pink/blue orb fallback. Either way, the custom
      // cursor is visible from the first frame.
      const dragonImg = dragon.querySelector('img');
      const enableDragon = () => document.body.classList.add('dragon-ready');
      const swapToOrb = () => {
        if (!dragonImg) return;
        dragonImg.style.background = 'radial-gradient(circle, #e85ee8, #5e7fff)';
        dragonImg.removeAttribute('src');
      };

      if (dragonImg) {
        dragonImg.addEventListener('error', swapToOrb);
        // If the image already finished its load attempt before we attached
        // listeners (e.g. broken path, missing assets folder), the error
        // event will never fire — catch that case explicitly.
        if (dragonImg.complete && dragonImg.naturalWidth === 0) {
          swapToOrb();
        }
      }
      enableDragon();
    } catch (err) {
      console.error('[dragon cursor] init failed:', err);
    }
  }

  // If the DOM is already parsed, run now. Otherwise wait for it.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();

/* =========================================================
   ============== CONFIGURATION YOU EDIT ===================
   =========================================================
   1) DISCORD WEBHOOK — for the "Request a Scene" form.
      In Discord: Server Settings → Integrations → Webhooks → New Webhook
      Copy the URL and paste it between the quotes below:
*/
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1507079618375585852/nqz7MxfFNxEnNGc4YXFzv8e6L883k1G1w3iL8V-IZGaAWEJDHQ4Lbb1GI_w4DbDy8I5P";

/* 2) CHARACTERS — add a card for each of your characters.
      `url` is where the user goes when clicking the card.
      `portrait` can be:
        - an emoji or single character (it sits inside the glowing circle),
        - or an image path like "assets/lyra.png" (becomes a profile pic).
      Set `placeholder: true` for an empty "coming soon" slot.
*/
const CHARACTERS = [
  {
    name: "Scorch",
    desc: "frontman of The Snake Skins",
    nameStyle: "fire",
    portrait: "assets/Scorch Pics/scorch-g03.jpg",
    pageId: "scorch",
    href: "scorch.html",
  },
  {
    name: "Shane",
    desc: "bassist of The Snake Skins",
    nameStyle: "chrome",
    portrait: "assets/Shane Pics/shane_bassMainPic.webp",
    pageId: "shane",
    href: "shane.html",
  },
  {
    name: "Cody",
    desc: "drummer of The Snake Skins",
    nameStyle: "bayou",
    portrait: "assets/Cody Pics/CodyMainPfp.webp",
    pageId: "cody",
    href: "cody.html",
  },
  // --- Two reserved slots: Max & Kayla (coming soon) ---
  { name: "Max",   desc: "coming soon", portrait: "✦", placeholder: true },
  { name: "Kayla", desc: "coming soon", portrait: "✦", placeholder: true },
  // --- Rory: Irish, Peaky Blinders, 1920s Birmingham ---
  {
    name: "Rory",
    desc: "Peaky Blinder · Tommy O'Malley's youngest",
    nameStyle: "peaky",
    portrait: "assets/Rory Pics/rory-portrait.jpg",
    pageId: "rory",
    href: "rory.html",
  },
  { name: "Coming Soon", desc: "click to chat", portrait: "✦", placeholder: true },

  /* ---------- EXAMPLE of a real character once you're ready ----------
  {
    name: "Lyra",
    desc: "the silver-tide knight",
    portrait: "assets/lyra.png",   // or "L" or an emoji
    url: "https://your-character-link-here.com"
  },
  -------------------------------------------------------------- */
];
/* ========================================================= */


/* ---------- BUILD CHARACTER GRID ---------- */
const HOME_PREVIEW_COUNT = 4;

function buildCharacterCard(b) {
  const card = document.createElement('div');
  card.className = 'character-card' + (b.placeholder ? ' placeholder' : '');

  const portrait = document.createElement('div');
  portrait.className = 'character-portrait';
  if (b.portrait && (/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(b.portrait) || /^data:image\//i.test(b.portrait))) {
    const img = document.createElement('img');
    img.src = b.portrait;
    img.alt = b.name;
    portrait.appendChild(img);
  } else {
    portrait.textContent = b.portrait || '?';
  }
  card.appendChild(portrait);

  const name = document.createElement('div');
  name.className = 'character-name' + (b.nameStyle ? ' ' + b.nameStyle : '');
  name.textContent = b.name;
  card.appendChild(name);

  const desc = document.createElement('div');
  desc.className = 'character-desc';
  desc.textContent = b.desc || '';
  card.appendChild(desc);

  if (b.href && !b.placeholder) {
    // Multi-page mode: each real character has their own file.
    card.addEventListener('click', () => { window.location.href = b.href; });
  } else if (b.pageId && !b.placeholder) {
    card.addEventListener('click', () => showCharacterPage(b.pageId));
  } else if (b.url && !b.placeholder) {
    card.addEventListener('click', () => window.open(b.url, '_blank'));
  }
  return card;
}

// The grid containers and the meet-characters button live in HTML that comes
// AFTER this <script> block, so we have to defer until the DOM is parsed.
// (Without this, getElementById returned null and the grid stayed empty.)
function buildAllGrids() {
  // Home grid removed — portraits live in the All Characters overlay only.
  // Keep this guarded in case the element comes back later.
  const characterGrid = document.getElementById('characterGrid');
  if (characterGrid && characterGrid.childElementCount === 0) {
    CHARACTERS.slice(0, HOME_PREVIEW_COUNT).forEach(b => {
      characterGrid.appendChild(buildCharacterCard(b));
    });
  }

  // Full grid inside the "All Characters" overlay: every character.
  const allCharactersGrid = document.getElementById('allCharactersGrid');
  if (allCharactersGrid && allCharactersGrid.childElementCount === 0) {
    CHARACTERS.forEach(b => {
      allCharactersGrid.appendChild(buildCharacterCard(b));
    });
  }

  // Clickable rainbow heading + legacy "See more" button — both open the overlay.
  ['meetCharactersLink', 'seeMoreCharacters'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.dataset.wired) {
      el.dataset.wired = '1';
      el.addEventListener('click', () => showCharacterPage('characters'));
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', buildAllGrids);
} else {
  buildAllGrids();
}

/* ---------- SEARCH FILTER ---------- */
// The search input lives inside the All Characters overlay, which appears in
// the HTML AFTER this script block — so we have to wait for the DOM to be
// parsed before wiring it up, or getElementById returns null and the field
// silently does nothing.
function wireSearchFilter() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('#characterGrid .character-card, #allCharactersGrid .character-card').forEach(card => {
      const name = card.querySelector('.character-name').textContent.toLowerCase();
      const desc = card.querySelector('.character-desc').textContent.toLowerCase();
      const match = !q || name.includes(q) || desc.includes(q);
      card.style.display = match ? '' : 'none';
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireSearchFilter);
} else {
  wireSearchFilter();
}

/* ---------- DISCORD WEBHOOK FORM ---------- */
const form = document.getElementById('requestForm');
const status = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');

if (form && status && submitBtn) form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('PASTE_')) {
    status.className = 'form-status error';
    status.textContent = '⚠ webhook not configured yet — paste your Discord webhook URL in the HTML';
    return;
  }

  const data = {
    charName: document.getElementById('charName').value.trim(),
    setting:  document.getElementById('setting').value.trim(),
    idea:     document.getElementById('idea').value.trim(),
    extra:    document.getElementById('extra').value.trim(),
    requester:document.getElementById('requester').value.trim() || 'Anonymous',
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'sending...';
  status.className = 'form-status';
  status.textContent = '';

  const payload = {
    username: 'DreamjourneyAI',
    embeds: [{
      title: '✦ New Scene Request ✦',
      color: 0x9d5cff,
      fields: [
        { name: 'Character',    value: data.charName || '—',  inline: true  },
        { name: 'Requested by', value: data.requester,        inline: true  },
        { name: 'Setting',      value: data.setting  || '—',  inline: false },
        { name: 'Idea',         value: data.idea     || '—',  inline: false },
        { name: 'Extra',        value: data.extra    || '—',  inline: false },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'DreamjourneyAI request form' }
    }]
  };

  try {
    const res = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Discord returned ' + res.status);
    status.className = 'form-status success';
    status.textContent = '✦ your dream has been sent to Chunley ✦';
    form.reset();
  } catch (err) {
    status.className = 'form-status error';
    status.textContent = 'could not send — check console & webhook URL';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send to Chunley';
  }
});


/* ---------- STARS + SHOOTING STARS CANVAS ---------- */
const starsCanvas = document.getElementById('stars-canvas');
const sctx = starsCanvas.getContext('2d');
let stars = [], shootingStars = [];

function sizeCanvas(c) {
  const dpr = window.devicePixelRatio || 1;
  c.width  = window.innerWidth  * dpr;
  c.height = window.innerHeight * dpr;
  c.style.width  = window.innerWidth  + 'px';
  c.style.height = window.innerHeight + 'px';
  c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
}

function initStars() {
  sizeCanvas(starsCanvas);
  // Density scales with screen size, but we cap it so big monitors don't
  // get hundreds of stars (each one twinkling = real per-frame cost).
  // Mobile uses a thinner density too — touch devices have less GPU budget.
  const isMobile = window.innerWidth < 720;
  const divisor = isMobile ? 7000 : 4200;
  const max     = isMobile ? 110 : 280;
  const count = Math.min(max, Math.floor((window.innerWidth * window.innerHeight) / divisor));
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.25,
      baseA: Math.random() * 0.7 + 0.25,
      twinkleSpeed: Math.random() * 0.025 + 0.005,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.18
        ? (Math.random() < 0.5 ? 'cyan' : 'magenta')
        : 'white'
    });
  }
}
initStars();
window.addEventListener('resize', () => { initStars(); sizeCanvas(ripplesCanvas); });

function drawStar(s, t) {
  const alpha = s.baseA * (0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.phase));
  let color;
  if      (s.hue === 'cyan')    color = `rgba(120, 220, 255, ${alpha})`;
  else if (s.hue === 'magenta') color = `rgba(255, 140, 240, ${alpha})`;
  else                          color = `rgba(255, 255, 255, ${alpha})`;
  sctx.beginPath();
  sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
  sctx.fillStyle = color;
  sctx.fill();
  // larger stars get a cross shimmer
  if (s.r > 1.15) {
    sctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.45})`;
    sctx.fillRect(s.x - s.r * 4, s.y - 0.35, s.r * 8, 0.7);
    sctx.fillRect(s.x - 0.35, s.y - s.r * 4, 0.7, s.r * 8);
  }
}

function spawnShootingStar() {
  const fromLeft = Math.random() < 0.5;
  const x = fromLeft ? -40 : Math.random() * window.innerWidth * 0.6;
  const y = Math.random() * window.innerHeight * 0.55;
  const angle = (Math.PI / 5) + (Math.random() - 0.5) * 0.5;
  const speed = 9 + Math.random() * 6;
  shootingStars.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 70 + Math.random() * 40,
    trail: []
  });
}

function updateShootingStars() {
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const s = shootingStars[i];
    s.trail.push({ x: s.x, y: s.y });
    if (s.trail.length > 22) s.trail.shift();
    s.x += s.vx; s.y += s.vy; s.life++;
    if (s.life > s.maxLife || s.x > window.innerWidth + 100 || s.y > window.innerHeight + 100) {
      shootingStars.splice(i, 1);
      continue;
    }
    // trail
    for (let j = 0; j < s.trail.length; j++) {
      const t = s.trail[j];
      const a = (j / s.trail.length) * 0.85 * (1 - s.life / s.maxLife);
      sctx.beginPath();
      sctx.arc(t.x, t.y, Math.max(0.4, 1.6 - (1 - j / s.trail.length) * 1.2), 0, Math.PI * 2);
      sctx.fillStyle = `rgba(190, 230, 255, ${a})`;
      sctx.fill();
    }
    // head glow
    const headA = 1 - s.life / s.maxLife;
    const grad = sctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 10);
    grad.addColorStop(0, `rgba(255, 255, 255, ${headA})`);
    grad.addColorStop(0.5, `rgba(180, 220, 255, ${headA * 0.5})`);
    grad.addColorStop(1, `rgba(150, 200, 255, 0)`);
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(s.x, s.y, 10, 0, Math.PI * 2);
    sctx.fill();
  }
}


/* ---------- FALLING STARS (gentle continuous stream) ---------- */
let fallingStars = [];
const MAX_FALLING = 45;

function spawnFallingStar() {
  if (fallingStars.length >= MAX_FALLING) return;
  // spawn from top edge or upper-right edge
  const fromTop = Math.random() < 0.7;
  const x = fromTop
    ? Math.random() * window.innerWidth * 1.1 - 50
    : window.innerWidth + 20;
  const y = fromTop
    ? -20
    : Math.random() * window.innerHeight * 0.3;

  // gentle diagonal — mostly down, slight leftward drift
  const angle = Math.PI * 0.5 + (Math.random() * 0.35 - 0.1);
  const speed = 1.6 + Math.random() * 1.8;

  // color: mostly soft white, sometimes cyan or magenta
  const roll = Math.random();
  let color;
  if      (roll < 0.15) color = [180, 230, 255];
  else if (roll < 0.25) color = [255, 180, 240];
  else                  color = [240, 240, 255];

  fallingStars.push({
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 180 + Math.random() * 140,
    size: 0.7 + Math.random() * 0.9,
    color,
    trail: []
  });
}

function updateFallingStars() {
  for (let i = fallingStars.length - 1; i >= 0; i--) {
    const f = fallingStars[i];
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > 10) f.trail.shift();
    f.x += f.vx;
    f.y += f.vy;
    f.life++;

    if (f.life > f.maxLife ||
        f.y > window.innerHeight + 30 ||
        f.x < -50 || f.x > window.innerWidth + 50) {
      fallingStars.splice(i, 1);
      continue;
    }

    // fade in for first 20 frames, fade out in last 60 frames
    const lifeFrac = f.life / f.maxLife;
    let alpha;
    if (f.life < 20)               alpha = f.life / 20;
    else if (lifeFrac > 0.7)       alpha = (1 - lifeFrac) / 0.3;
    else                           alpha = 1;
    alpha *= 0.85;

    // soft trail
    for (let j = 0; j < f.trail.length; j++) {
      const t = f.trail[j];
      const ta = (j / f.trail.length) * alpha * 0.5;
      sctx.fillStyle = `rgba(${f.color[0]}, ${f.color[1]}, ${f.color[2]}, ${ta})`;
      sctx.beginPath();
      sctx.arc(t.x, t.y, f.size * (j / f.trail.length) * 0.8, 0, Math.PI * 2);
      sctx.fill();
    }

    // soft head glow
    const grad = sctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size * 4);
    grad.addColorStop(0,   `rgba(${f.color[0]}, ${f.color[1]}, ${f.color[2]}, ${alpha})`);
    grad.addColorStop(0.5, `rgba(${f.color[0]}, ${f.color[1]}, ${f.color[2]}, ${alpha * 0.3})`);
    grad.addColorStop(1,   `rgba(${f.color[0]}, ${f.color[1]}, ${f.color[2]}, 0)`);
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(f.x, f.y, f.size * 4, 0, Math.PI * 2);
    sctx.fill();

    // bright core
    sctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    sctx.beginPath();
    sctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
    sctx.fill();
  }
}

let t = 0;
let starsRafId = null;
function starsLoop() {
  sctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (const s of stars) drawStar(s, t);
  updateFallingStars();
  updateShootingStars();
  if (t % 8 === 0 && Math.random() < 0.65) spawnFallingStar();
  if (Math.random() < 0.0035) spawnShootingStar();
  t++;
  starsRafId = requestAnimationFrame(starsLoop);
}
starsLoop();


/* ---------- WATER RIPPLES (ambient + click) ---------- */
const ripplesCanvas = document.getElementById('ripples-canvas');
const rctx = ripplesCanvas.getContext('2d');
sizeCanvas(ripplesCanvas);
let ripples = [];

function addRipple(x, y, opts = {}) {
  ripples.push({
    x, y,
    r: 0,
    maxR: opts.maxR ?? (110 + Math.random() * 60),
    a: opts.a ?? 0.7,
    speed: opts.speed ?? 0.05,
    color: opts.color ?? 'cyan',
    delay: opts.delay ?? 0,
  });
}

document.addEventListener('click', (e) => {
  // click ripples — softer than before, still visible
  addRipple(e.clientX, e.clientY, { maxR: 150, a: 0.55, speed: 0.035, color: 'cyan' });
  addRipple(e.clientX, e.clientY, { maxR: 90,  a: 0.4,  speed: 0.04,  color: 'magenta', delay: 10 });
});

/* ambient ripples that drift across the screen quietly — gentle & sparse */
setInterval(() => {
  if (document.hidden) return;
  addRipple(
    Math.random() * window.innerWidth,
    Math.random() * window.innerHeight,
    {
      maxR: 100 + Math.random() * 90,
      a: 0.10 + Math.random() * 0.10,
      speed: 0.015,
      color: Math.random() < 0.5 ? 'cyan' : 'magenta'
    }
  );
}, 2200);

function ripplesLoop() {
  rctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    if (r.delay > 0) { r.delay--; continue; }
    r.r += (r.maxR - r.r) * r.speed;
    r.a *= 0.978; // slower fade — gentler
    if (r.a < 0.012) { ripples.splice(i, 1); continue; }

    const c1 = r.color === 'magenta'
      ? `rgba(232, 140, 240, ${r.a * 0.85})`
      : `rgba(150, 220, 255, ${r.a * 0.85})`;
    const c2 = r.color === 'magenta'
      ? `rgba(255, 200, 255, ${r.a * 0.35})`
      : `rgba(200, 240, 255, ${r.a * 0.35})`;

    // primary ring — thinner, softer
    rctx.strokeStyle = c1;
    rctx.lineWidth = 1.3;
    rctx.beginPath();
    rctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    rctx.stroke();

    // inner echo ring
    rctx.strokeStyle = c2;
    rctx.lineWidth = 0.8;
    rctx.beginPath();
    rctx.arc(r.x, r.y, r.r * 0.78, 0, Math.PI * 2);
    rctx.stroke();

    // very faint outer halo for that "water tension" feel
    rctx.strokeStyle = r.color === 'magenta'
      ? `rgba(255, 220, 255, ${r.a * 0.15})`
      : `rgba(220, 245, 255, ${r.a * 0.15})`;
    rctx.lineWidth = 0.6;
    rctx.beginPath();
    rctx.arc(r.x, r.y, r.r * 1.08, 0, Math.PI * 2);
    rctx.stroke();
  }
  ripplesRafId = requestAnimationFrame(ripplesLoop);
}
let ripplesRafId = null;
ripplesLoop();

/* ---------- VISIBILITY-AWARE BACKGROUND LOOPS ---------- */
/* When the tab is hidden (user switched tabs), cancel the stars + ripples
   RAFs entirely so they're not consuming any CPU. Resume cleanly when
   the tab is visible again. */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (starsRafId)   { cancelAnimationFrame(starsRafId);   starsRafId   = null; }
    if (ripplesRafId) { cancelAnimationFrame(ripplesRafId); ripplesRafId = null; }
  } else {
    if (!starsRafId)   starsLoop();
    if (!ripplesRafId) ripplesLoop();
  }
});


/* ---------- CHARACTER PAGE OVERLAY ---------- */
/* Single IntersectionObserver for all scroll-in animations (stamps, fade-ups, tilts).
   Watches every element with .reveal-stamp, .reveal-up, or .reveal-tilt and adds
   .is-visible when they scroll into view. One-shot — unobserved after firing. */
const _revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      _revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

function _wireReveals(scope) {
  (scope || document).querySelectorAll('.reveal-stamp, .reveal-up, .reveal-tilt').forEach(el => {
    _revealObserver.observe(el);
  });
}
// Wire on initial load AND every time a character page is opened (its content
// may have just become scroll-observable).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => _wireReveals());
} else {
  _wireReveals();
}

function showCharacterPage(pageId) {
  const page = document.getElementById(pageId + 'Page');
  if (!page) return;
  page.classList.add('active');
  page.setAttribute('aria-hidden', 'false');
  page.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  // After the page is laid out, re-observe its reveal-elements so any that
  // weren't laid out earlier (content-visibility: auto) start ticking now.
  requestAnimationFrame(() => _wireReveals(page));
}
function hideCharacterPage(pageId) {
  const page = document.getElementById(pageId + 'Page');
  if (!page) return;
  page.classList.remove('active');
  page.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ---------- STANDALONE CHARACTER PAGES ----------
   On the per-character files (scorch.html, shane.html, cody.html) the <body>
   carries data-standalone="<pageId>". There the character page isn't an
   overlay sliding over a homepage — it IS the page. So we:
     1. show it immediately on load (no scroll-lock, it's the whole page), and
     2. make its ✕ / "back" controls navigate home instead of hiding to blank.
   On the homepage <body> has no data-standalone, so none of this runs and the
   original overlay behavior is untouched. */
function initStandaloneCharacterPage() {
  const pageId = document.body.getAttribute('data-standalone');
  if (!pageId) return;
  const page = document.getElementById(pageId + 'Page');
  if (page) {
    page.classList.add('active');
    page.setAttribute('aria-hidden', 'false');
    // NOTE: deliberately do NOT set body overflow hidden — this is the page
    // itself, so normal page scrolling should work.
    requestAnimationFrame(() => { try { _wireReveals(page); } catch (e) {} });
  }
  // Redirect this character's close + back controls to the homepage.
  const closeBtn = document.getElementById(pageId + 'Close');
  const backLink = document.getElementById(pageId + 'Back');
  const goHome = (e) => { if (e) e.preventDefault(); window.location.href = 'index.html'; };
  if (closeBtn) closeBtn.addEventListener('click', goHome);
  if (backLink) backLink.addEventListener('click', goHome);

  // If we arrived at e.g. scorch.html#dating (from a homepage dating card),
  // open this character's dating profile right away.
  if (window.location.hash === '#dating') {
    const datingTab = document.querySelector('[data-dating="' + pageId + '"]:not([data-dating-href])');
    if (datingTab) requestAnimationFrame(() => datingTab.click());
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStandaloneCharacterPage);
} else {
  initStandaloneCharacterPage();
}

// Scorch close handlers — defer until DOM is parsed, since the
// Scorch page markup appears AFTER this <script> block in the document.
document.addEventListener('DOMContentLoaded', () => {
  // On standalone character files these controls are wired to navigate home
  // by initStandaloneCharacterPage(); skip the overlay-hide wiring there.
  if (document.body.getAttribute('data-standalone')) return;

  const _scorchClose = document.getElementById('scorchClose');
  if (_scorchClose) _scorchClose.addEventListener('click', () => hideCharacterPage('scorch'));
  const _scorchBack = document.getElementById('scorchBack');
  if (_scorchBack) _scorchBack.addEventListener('click', (e) => {
    e.preventDefault();
    hideCharacterPage('scorch');
  });

  // Shane close handlers
  const _shaneClose = document.getElementById('shaneClose');
  if (_shaneClose) _shaneClose.addEventListener('click', () => hideCharacterPage('shane'));
  const _shaneBack = document.getElementById('shaneBack');
  if (_shaneBack) _shaneBack.addEventListener('click', (e) => {
    e.preventDefault();
    hideCharacterPage('shane');
  });

  // Cody close handlers
  const _codyClose = document.getElementById('codyClose');
  if (_codyClose) _codyClose.addEventListener('click', () => hideCharacterPage('cody'));
  const _codyBack = document.getElementById('codyBack');
  if (_codyBack) _codyBack.addEventListener('click', (e) => {
    e.preventDefault();
    hideCharacterPage('cody');
  });

  // All-characters overlay close
  const _charactersClose = document.getElementById('charactersClose');
  if (_charactersClose) _charactersClose.addEventListener('click', () => hideCharacterPage('characters'));
});

// ESC closes any open character page
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.character-page.active').forEach(p => {
    p.classList.remove('active');
    p.setAttribute('aria-hidden', 'true');
  });
  document.body.style.overflow = '';
});

/* ---------- GALLERY CAROUSEL ---------- */
function openCarousel(images, startIndex) {
  startIndex = startIndex || 0;
  document.querySelectorAll('.carousel').forEach(function(c){ c.remove(); });
  var idx = startIndex;
  var cr = document.createElement('div');
  cr.className = 'carousel';
  cr.innerHTML =
    '<button class="carousel-close" type="button" aria-label="Close">\u2715</button>' +
    '<div class="carousel-stage">' +
      '<button class="carousel-nav prev" type="button" aria-label="Previous">\u2039</button>' +
      '<img alt="" />' +
      '<button class="carousel-nav next" type="button" aria-label="Next">\u203A</button>' +
    '</div>' +
    '<div class="carousel-caption"></div>' +
    '<div class="carousel-dots"></div>';
  var imgEl = cr.querySelector('.carousel-stage img');
  var capEl = cr.querySelector('.carousel-caption');
  var dotsEl = cr.querySelector('.carousel-dots');
  images.forEach(function(_, i){
    var d = document.createElement('button');
    d.className = 'carousel-dot';
    d.type = 'button';
    d.setAttribute('aria-label', 'Image ' + (i+1));
    d.addEventListener('click', function(e){ e.stopPropagation(); show(i); });
    dotsEl.appendChild(d);
  });
  function show(i){
    idx = (i + images.length) % images.length;
    var item = images[idx];
    imgEl.src = item.src;
    imgEl.alt = item.alt || '';
    capEl.textContent = item.alt || '';
    imgEl.style.animation = 'none';
    void imgEl.offsetWidth;
    imgEl.style.animation = '';
    dotsEl.querySelectorAll('.carousel-dot').forEach(function(d, i2){
      d.classList.toggle('active', i2 === idx);
    });
  }
  cr.querySelector('.carousel-close').addEventListener('click', close);
  cr.querySelector('.carousel-nav.prev').addEventListener('click', function(e){ e.stopPropagation(); show(idx - 1); });
  cr.querySelector('.carousel-nav.next').addEventListener('click', function(e){ e.stopPropagation(); show(idx + 1); });
  cr.addEventListener('click', function(e){ if (e.target === cr) close(); });
  function onKey(e){
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  }
  function close(){
    document.removeEventListener('keydown', onKey);
    cr.remove();
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', onKey);
  document.body.style.overflow = 'hidden';
  document.body.appendChild(cr);
  show(idx);
}

document.addEventListener('DOMContentLoaded', function(){
  var entry = document.getElementById('scorchGalleryEntry');
  var dataEl = document.getElementById('scorchGalleryData');
  if (entry && dataEl) {
    var images = JSON.parse(dataEl.textContent);
    entry.addEventListener('click', function(){ openCarousel(images, 0); });
  }

  var shaneEntry = document.getElementById('shaneGalleryEntry');
  var shaneDataEl = document.getElementById('shaneGalleryData');
  if (shaneEntry && shaneDataEl) {
    var shaneImages = JSON.parse(shaneDataEl.textContent);
    shaneEntry.addEventListener('click', function(){ openCarousel(shaneImages, 0); });
  }

  var codyEntry = document.getElementById('codyGalleryEntry');
  var codyDataEl = document.getElementById('codyGalleryData');
  if (codyEntry && codyDataEl) {
    var codyImages = JSON.parse(codyDataEl.textContent);
    codyEntry.addEventListener('click', function(){ openCarousel(codyImages, 0); });
  }
});

/* ============================================================
   SNAKE SKINS PLAYER — audio + Web Audio visualizer + setlist
   ============================================================ */
(function() {
  function initSnakeSkinsPlayer() {
    var root = document.getElementById('snakeSkinsPlayer');
    if (!root) return;
    var dataEl = document.getElementById('snakeSkinsTracksData');
    if (!dataEl) return;
    var tracks;
    try { tracks = JSON.parse(dataEl.textContent); } catch(e) { return; }
    if (!tracks || !tracks.length) return;

    var audio      = document.getElementById('npAudio');
    var consoleEl  = document.getElementById('npConsole');
    var titleEl    = document.getElementById('npTitle');
    var subEl      = document.getElementById('npSub');
    var vizEl      = document.getElementById('npViz');
    var progressEl = document.getElementById('npProgress');
    var fillEl     = document.getElementById('npFill');
    var headEl     = document.getElementById('npHead');
    var currentEl  = document.getElementById('npTimeCurrent');
    var totalEl    = document.getElementById('npTimeTotal');
    var playBtn    = document.getElementById('npPlay');
    var playIcon   = document.getElementById('npPlayIcon');
    var prevBtn    = document.getElementById('npPrev');
    var nextBtn    = document.getElementById('npNext');
    var listEl     = document.getElementById('npTrackList');

    // Build the visualizer bars
    var BAR_COUNT = 48;
    var bars = [];
    for (var i = 0; i < BAR_COUNT; i++) {
      var b = document.createElement('div');
      b.className = 'np-viz-bar';
      vizEl.appendChild(b);
      bars.push(b);
    }

    // Build the setlist UI
    listEl.innerHTML = '';
    tracks.forEach(function(t, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'np-track';
      btn.dataset.index = i;
      var num = (i + 1) < 10 ? '0' + (i + 1) : '' + (i + 1);
      btn.innerHTML =
        '<span class="np-track-num">' + num + '</span>' +
        '<span class="np-track-name">' + t.title + '</span>' +
        '<span class="np-track-len">—:—</span>';
      btn.addEventListener('click', function() { playIndex(i); });
      listEl.appendChild(btn);
    });
    var trackEls = listEl.querySelectorAll('.np-track');

    var currentIndex = -1;
    var audioCtx, analyser, sourceNode, freqData;
    var rafId = null;

    var PLAY_SVG  = '<path d="M8 5v14l11-7z"/>';
    var PAUSE_SVG = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

    function fmt(sec) {
      if (!isFinite(sec) || sec < 0) return '0:00';
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' + s : s);
    }

    // Build Web Audio graph on first interaction (browser autoplay rule)
    function setupAudioGraph() {
      if (audioCtx) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.78;
        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        audioCtx = null; analyser = null;
      }
    }

    // Idle pulse when nothing's playing, real frequency data when it is
    function startVizLoop() {
      if (rafId) return;
      var idleBeat = 0;
      function tick() {
        if (analyser && !audio.paused) {
          analyser.getByteFrequencyData(freqData);
          for (var i = 0; i < BAR_COUNT; i++) {
            var srcIdx = Math.floor(i * freqData.length / BAR_COUNT);
            var v = freqData[srcIdx] / 255;
            bars[i].style.height = Math.max(6, v * 100) + '%';
          }
        } else {
          idleBeat += 0.04;
          for (var j = 0; j < BAR_COUNT; j++) {
            var n = Math.sin(idleBeat + j * 0.35) * 0.5 + 0.5;
            bars[j].style.height = (8 + n * 14) + '%';
          }
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }
    function stopVizLoop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      // settle bars to a uniform low baseline so they don't freeze mid-spike
      for (var _i = 0; _i < bars.length; _i++) bars[_i].style.height = '10%';
    }

    function updateActive() {
      trackEls.forEach(function(el, i) {
        el.classList.toggle('is-active', i === currentIndex);
        var numEl = el.querySelector('.np-track-num');
        if (numEl) {
          var num = (i + 1) < 10 ? '0' + (i + 1) : '' + (i + 1);
          numEl.textContent = (i === currentIndex) ? '▶' : num;
        }
      });
    }

    function loadIndex(i) {
      if (i < 0) i = tracks.length - 1;
      if (i >= tracks.length) i = 0;
      currentIndex = i;
      var t = tracks[i];
      audio.src = t.src;
      titleEl.textContent = t.title;
      subEl.textContent = 'The Snake Skins  •  Bite Back Tour';
      currentEl.textContent = '0:00';
      totalEl.textContent = '0:00';
      fillEl.style.width = '0%';
      headEl.style.left = '0%';
      updateActive();
    }

    function playIndex(i) {
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (i !== currentIndex) loadIndex(i);
      var p = audio.play();
      if (p && p.catch) p.catch(function(){ /* missing file or blocked — handled by error event */ });
    }

    playBtn.addEventListener('click', function() {
      if (currentIndex < 0) { playIndex(0); return; }
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function(){});
      } else {
        audio.pause();
      }
    });
    prevBtn.addEventListener('click', function() {
      var nextIdx = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
      playIndex(nextIdx);
    });
    nextBtn.addEventListener('click', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });

    audio.addEventListener('play', function() {
      consoleEl.classList.add('is-playing');
      playIcon.innerHTML = PAUSE_SVG;
      startVizLoop();
    });
    audio.addEventListener('pause', function() {
      consoleEl.classList.remove('is-playing');
      playIcon.innerHTML = PLAY_SVG;
      stopVizLoop();
    });
    audio.addEventListener('ended', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });
    audio.addEventListener('loadedmetadata', function() {
      totalEl.textContent = fmt(audio.duration);
      if (currentIndex >= 0 && trackEls[currentIndex]) {
        var lenEl = trackEls[currentIndex].querySelector('.np-track-len');
        if (lenEl) lenEl.textContent = fmt(audio.duration);
      }
    });
    audio.addEventListener('timeupdate', function() {
      var pct = (audio.currentTime / (audio.duration || 1)) * 100;
      fillEl.style.width = pct + '%';
      headEl.style.left = pct + '%';
      currentEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('error', function() {
      if (currentIndex >= 0 && tracks[currentIndex]) {
        titleEl.textContent = tracks[currentIndex].title;
      }
      subEl.textContent = 'file not found — drop MP3 into /assets/';
    });

    // Click-to-seek on progress bar
    function seekFromEvent(e) {
      if (!isFinite(audio.duration)) return;
      var rect = progressEl.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left;
      var pct = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = pct * audio.duration;
    }
    progressEl.addEventListener('click', seekFromEvent);
    progressEl.addEventListener('keydown', function(e) {
      if (!isFinite(audio.duration)) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnakeSkinsPlayer);
  } else {
    initSnakeSkinsPlayer();
  }
})();

/* ============================================================
   SHANE PLAYER — parallel to Snake Skins player, sh* IDs so the
   two players don't collide on getElementById lookups.
   ============================================================ */
(function() {
  function initShanePlayer() {
    var root = document.getElementById('shanePlayer');
    if (!root) return;
    var dataEl = document.getElementById('shaneTracksData');
    if (!dataEl) return;
    var tracks;
    try { tracks = JSON.parse(dataEl.textContent); } catch(e) { return; }
    if (!tracks || !tracks.length) return;

    var audio      = document.getElementById('shAudio');
    var consoleEl  = document.getElementById('shConsole');
    var titleEl    = document.getElementById('shTitle');
    var subEl      = document.getElementById('shSub');
    var vizEl      = document.getElementById('shViz');
    var progressEl = document.getElementById('shProgress');
    var fillEl     = document.getElementById('shFill');
    var headEl     = document.getElementById('shHead');
    var currentEl  = document.getElementById('shTimeCurrent');
    var totalEl    = document.getElementById('shTimeTotal');
    var playBtn    = document.getElementById('shPlay');
    var playIcon   = document.getElementById('shPlayIcon');
    var prevBtn    = document.getElementById('shPrev');
    var nextBtn    = document.getElementById('shNext');
    var listEl     = document.getElementById('shTrackList');

    // Fewer, fatter bars for Shane — bass-heavy vibe
    var BAR_COUNT = 32;
    var bars = [];
    for (var i = 0; i < BAR_COUNT; i++) {
      var b = document.createElement('div');
      b.className = 'np-viz-bar';
      vizEl.appendChild(b);
      bars.push(b);
    }

    listEl.innerHTML = '';
    tracks.forEach(function(t, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'np-track';
      btn.dataset.index = i;
      var num = (i + 1) < 10 ? '0' + (i + 1) : '' + (i + 1);
      btn.innerHTML =
        '<span class="np-track-num">' + num + '</span>' +
        '<span class="np-track-name">' + t.title + '</span>' +
        '<span class="np-track-len">—:—</span>';
      btn.addEventListener('click', function() { playIndex(i); });
      listEl.appendChild(btn);
    });
    var trackEls = listEl.querySelectorAll('.np-track');

    var currentIndex = -1;
    var audioCtx, analyser, sourceNode, freqData;
    var rafId = null;

    var PLAY_SVG  = '<path d="M8 5v14l11-7z"/>';
    var PAUSE_SVG = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

    function fmt(sec) {
      if (!isFinite(sec) || sec < 0) return '0:00';
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' + s : s);
    }

    function setupAudioGraph() {
      if (audioCtx) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        // Smaller FFT + heavier smoothing = slower, bass-thump vibe
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.86;
        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        audioCtx = null; analyser = null;
      }
    }

    function startVizLoop() {
      if (rafId) return;
      var idleBeat = 0;
      function tick() {
        if (analyser && !audio.paused) {
          analyser.getByteFrequencyData(freqData);
          // Emphasize the LOW end of the spectrum for a bass-feel viz
          for (var i = 0; i < BAR_COUNT; i++) {
            // Map bars to the bottom 60% of the frequency range
            var srcIdx = Math.floor((i / BAR_COUNT) * freqData.length * 0.6);
            var v = freqData[srcIdx] / 255;
            bars[i].style.height = Math.max(8, v * 100) + '%';
          }
        } else {
          // Slower idle wave than Scorch's — like a heartbeat
          idleBeat += 0.025;
          for (var j = 0; j < BAR_COUNT; j++) {
            var n = Math.sin(idleBeat + j * 0.28) * 0.5 + 0.5;
            bars[j].style.height = (10 + n * 12) + '%';
          }
        }
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }
    function stopVizLoop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      // settle bars to a uniform low baseline so they don't freeze mid-spike
      for (var _i = 0; _i < bars.length; _i++) bars[_i].style.height = '10%';
    }

    function updateActive() {
      trackEls.forEach(function(el, i) {
        el.classList.toggle('is-active', i === currentIndex);
        var numEl = el.querySelector('.np-track-num');
        if (numEl) {
          var num = (i + 1) < 10 ? '0' + (i + 1) : '' + (i + 1);
          numEl.textContent = (i === currentIndex) ? '▶' : num;
        }
      });
    }

    function loadIndex(i) {
      if (i < 0) i = tracks.length - 1;
      if (i >= tracks.length) i = 0;
      currentIndex = i;
      var t = tracks[i];
      audio.src = t.src;
      titleEl.textContent = t.title;
      subEl.textContent = 'Shane Halbrook  •  Bass & Low End';
      currentEl.textContent = '0:00';
      totalEl.textContent = '0:00';
      fillEl.style.width = '0%';
      headEl.style.left = '0%';
      updateActive();
    }

    function playIndex(i) {
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (i !== currentIndex) loadIndex(i);
      var p = audio.play();
      if (p && p.catch) p.catch(function(){});
    }

    playBtn.addEventListener('click', function() {
      if (currentIndex < 0) { playIndex(0); return; }
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function(){});
      } else {
        audio.pause();
      }
    });
    prevBtn.addEventListener('click', function() {
      var nextIdx = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
      playIndex(nextIdx);
    });
    nextBtn.addEventListener('click', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });

    audio.addEventListener('play', function() {
      consoleEl.classList.add('is-playing');
      playIcon.innerHTML = PAUSE_SVG;
      startVizLoop();
    });
    audio.addEventListener('pause', function() {
      consoleEl.classList.remove('is-playing');
      playIcon.innerHTML = PLAY_SVG;
      stopVizLoop();
    });
    audio.addEventListener('ended', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });
    audio.addEventListener('loadedmetadata', function() {
      totalEl.textContent = fmt(audio.duration);
      if (currentIndex >= 0 && trackEls[currentIndex]) {
        var lenEl = trackEls[currentIndex].querySelector('.np-track-len');
        if (lenEl) lenEl.textContent = fmt(audio.duration);
      }
    });
    audio.addEventListener('timeupdate', function() {
      var pct = (audio.currentTime / (audio.duration || 1)) * 100;
      fillEl.style.width = pct + '%';
      headEl.style.left = pct + '%';
      currentEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('error', function() {
      if (currentIndex >= 0 && tracks[currentIndex]) {
        titleEl.textContent = tracks[currentIndex].title;
      }
      subEl.textContent = 'file not found — drop MP3 into /assets/';
    });

    function seekFromEvent(e) {
      if (!isFinite(audio.duration)) return;
      var rect = progressEl.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left;
      var pct = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = pct * audio.duration;
    }
    progressEl.addEventListener('click', seekFromEvent);
    progressEl.addEventListener('keydown', function(e) {
      if (!isFinite(audio.duration)) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShanePlayer);
  } else {
    initShanePlayer();
  }
})();

/* ============================================================
   CODY PLAYER — parallel to the other two, cd* IDs. Visualizer
   weighted toward mids/highs (cymbals, snare) for a drummer feel,
   and the idle wave runs at a marching-tempo pulse.
   ============================================================ */
(function() {
  function initCodyPlayer() {
    var root = document.getElementById('codyPlayer');
    if (!root) return;
    var dataEl = document.getElementById('codyTracksData');
    if (!dataEl) return;
    var tracks;
    try { tracks = JSON.parse(dataEl.textContent); } catch(e) { return; }
    if (!tracks || !tracks.length) return;

    var audio      = document.getElementById('cdAudio');
    var consoleEl  = document.getElementById('cdConsole');
    var titleEl    = document.getElementById('cdTitle');
    var subEl      = document.getElementById('cdSub');
    var needleEl   = document.getElementById('cdNeedle');
    var progressEl = document.getElementById('cdProgress');
    var fillEl     = document.getElementById('cdFill');
    var headEl     = document.getElementById('cdHead');
    var currentEl  = document.getElementById('cdTimeCurrent');
    var totalEl    = document.getElementById('cdTimeTotal');
    var playBtn    = document.getElementById('cdPlay');
    var playIcon   = document.getElementById('cdPlayIcon');
    var prevBtn    = document.getElementById('cdPrev');
    var nextBtn    = document.getElementById('cdNext');
    var listEl     = document.getElementById('cdTrackList');

    // VU meter needle sweeps from -70deg (silence) to +70deg (peak)
    var VU_MIN = -70, VU_MAX = 70;

    listEl.innerHTML = '';
    tracks.forEach(function(t, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rp-track';
      btn.dataset.index = i;
      btn.innerHTML =
        '<span class="rp-track-vinyl"></span>' +
        '<span class="rp-track-name">' + t.title + '</span>' +
        '<span class="rp-track-len">—:—</span>';
      btn.addEventListener('click', function() { playIndex(i); });
      listEl.appendChild(btn);
    });
    var trackEls = listEl.querySelectorAll('.rp-track');

    var currentIndex = -1;
    var audioCtx, analyser, sourceNode, freqData;
    var rafId = null;

    var PLAY_SVG  = '<path d="M8 5v14l11-7z"/>';
    var PAUSE_SVG = '<path d="M6 5h4v14H6zm8 0h4v14h-4z"/>';

    function fmt(sec) {
      if (!isFinite(sec) || sec < 0) return '0:00';
      var m = Math.floor(sec / 60);
      var s = Math.floor(sec % 60);
      return m + ':' + (s < 10 ? '0' + s : s);
    }

    function setupAudioGraph() {
      if (audioCtx) return;
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
        analyser = audioCtx.createAnalyser();
        // Higher FFT + lighter smoothing = punchier, snappier viz response
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.74;
        sourceNode = audioCtx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) {
        audioCtx = null; analyser = null;
      }
    }

    function startVizLoop() {
      if (rafId) return;
      var idleBeat = 0;
      var smoothed = VU_MIN;
      function tick() {
        var target;
        if (analyser && !audio.paused) {
          analyser.getByteFrequencyData(freqData);
          // Average the spectrum into a single VU level
          var sum = 0;
          for (var i = 0; i < freqData.length; i++) { sum += freqData[i]; }
          var avg = sum / freqData.length / 255; // 0..1
          // Bias the needle toward the upper range so it reads lively
          target = VU_MIN + Math.min(1, avg * 1.6) * (VU_MAX - VU_MIN);
        } else {
          // Idle: needle hovers near the low end with a gentle sway
          idleBeat += 0.04;
          var n = (Math.sin(idleBeat) * 0.5 + 0.5) * 0.12;
          target = VU_MIN + n * (VU_MAX - VU_MIN);
        }
        // ease toward target so the needle has analog inertia
        smoothed += (target - smoothed) * 0.25;
        if (needleEl) needleEl.style.transform = 'rotate(' + smoothed.toFixed(1) + 'deg)';
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
    }
    function stopVizLoop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      // settle needle back to the resting position
      if (needleEl) needleEl.style.transform = 'rotate(-70deg)';
    }

    function updateActive() {
      trackEls.forEach(function(el, i) {
        el.classList.toggle('is-active', i === currentIndex);
      });
    }

    function loadIndex(i) {
      if (i < 0) i = tracks.length - 1;
      if (i >= tracks.length) i = 0;
      currentIndex = i;
      var t = tracks[i];
      audio.src = t.src;
      titleEl.textContent = t.title;
      subEl.textContent = 'Cody Thibodeaux  •  Bayou Beats';
      currentEl.textContent = '0:00';
      totalEl.textContent = '0:00';
      fillEl.style.width = '0%';
      headEl.style.left = '0%';
      updateActive();
    }

    function playIndex(i) {
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (i !== currentIndex) loadIndex(i);
      var p = audio.play();
      if (p && p.catch) p.catch(function(){});
    }

    playBtn.addEventListener('click', function() {
      if (currentIndex < 0) { playIndex(0); return; }
      setupAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function(){});
      } else {
        audio.pause();
      }
    });
    prevBtn.addEventListener('click', function() {
      var nextIdx = currentIndex <= 0 ? tracks.length - 1 : currentIndex - 1;
      playIndex(nextIdx);
    });
    nextBtn.addEventListener('click', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });

    audio.addEventListener('play', function() {
      consoleEl.classList.add('is-playing');
      playIcon.innerHTML = PAUSE_SVG;
      startVizLoop();
    });
    audio.addEventListener('pause', function() {
      consoleEl.classList.remove('is-playing');
      playIcon.innerHTML = PLAY_SVG;
      stopVizLoop();
    });
    audio.addEventListener('ended', function() {
      var nextIdx = currentIndex + 1 >= tracks.length ? 0 : currentIndex + 1;
      playIndex(nextIdx);
    });
    audio.addEventListener('loadedmetadata', function() {
      totalEl.textContent = fmt(audio.duration);
      if (currentIndex >= 0 && trackEls[currentIndex]) {
        var lenEl = trackEls[currentIndex].querySelector('.rp-track-len');
        if (lenEl) lenEl.textContent = fmt(audio.duration);
      }
    });
    audio.addEventListener('timeupdate', function() {
      var pct = (audio.currentTime / (audio.duration || 1)) * 100;
      fillEl.style.width = pct + '%';
      headEl.style.left = pct + '%';
      currentEl.textContent = fmt(audio.currentTime);
    });
    audio.addEventListener('error', function() {
      if (currentIndex >= 0 && tracks[currentIndex]) {
        titleEl.textContent = tracks[currentIndex].title;
      }
      subEl.textContent = 'file not found — drop MP3 into /assets/';
    });

    function seekFromEvent(e) {
      if (!isFinite(audio.duration)) return;
      var rect = progressEl.getBoundingClientRect();
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var x = clientX - rect.left;
      var pct = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = pct * audio.duration;
    }
    progressEl.addEventListener('click', seekFromEvent);
    progressEl.addEventListener('keydown', function(e) {
      if (!isFinite(audio.duration)) return;
      if (e.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + 5); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { audio.currentTime = Math.max(0, audio.currentTime - 5); e.preventDefault(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodyPlayer);
  } else {
    initCodyPlayer();
  }
})();



/* ---------- BLOCK 2 ---------- */
/* ---------- DATING PROFILES ---------- */
/* Mirrors the character-page overlay pattern: clicking any element with
   data-dating="<id>" opens the matching #<id>DatingPage. Close via X,
   Escape, or backdrop. */
(function initDatingProfiles() {
  function open(id) {
    const page = document.getElementById(id + 'DatingPage');
    if (!page) return;
    page.classList.add('active');
    page.setAttribute('aria-hidden', 'false');
    page.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    startFx(page);
    settle(page);
  }
  function close(id) {
    const page = document.getElementById(id + 'DatingPage');
    closePage(page);
  }
  // Close by element reference — robust regardless of the page's id naming.
  // (The browse overlay is #datingBrowsePage, which does NOT end in
  // "DatingPage", so the old string-rebuild approach silently failed on it,
  // which is why its X button did nothing.)
  function closePage(page) {
    if (!page) return;
    page.classList.remove('settled');
    page.classList.remove('active');
    page.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    stopFx(page);
  }

  // After the slide-up transition ends, clear the transform (via .settled)
  // so position:fixed children (the animated background) pin to the viewport.
  function settle(page) {
    const onEnd = (e) => {
      if (e.target !== page || e.propertyName !== 'transform') return;
      page.removeEventListener('transitionend', onEnd);
      if (page.classList.contains('active')) page.classList.add('settled');
    };
    page.addEventListener('transitionend', onEnd);
    // Fallback in case transitionend doesn't fire.
    setTimeout(() => {
      if (page.classList.contains('active')) page.classList.add('settled');
    }, 650);
  }

  /* ---------- AMBIENT BACKGROUND FX ----------
     Injects a decorative .dating-fx layer (drifting color blobs + rising
     sparkles) into each overlay the first time it opens, themed by the
     profile's --dp-accent colors. Sparks + pointer parallax only run while
     a page is actually active, so closed pages cost nothing. Honors
     prefers-reduced-motion. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPARK_CHARS = ['✦', '♡', '★', '✺', '✷'];

  function ensureFx(page) {
    let fx = page.querySelector(':scope > .dating-fx');
    if (fx) { setupReveals(page); return fx; }
    fx = document.createElement('div');
    fx.className = 'dating-fx';
    fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = '<div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div>';
    // insert as the first child so it stays behind the content
    page.insertBefore(fx, page.firstChild);
    setupReveals(page);
    return fx;
  }

  /* Scroll-reveal: cards rise + fade as they enter the viewport. Tags the
     main content blocks with .dating-reveal once, then observes them.
     Built fail-safe: if anything goes wrong, content stays/ends up visible. */
  function setupReveals(page) {
    if (page._revealsDone) return;
    page._revealsDone = true;
    const wrap = page.querySelector('.dating-wrap, .dating-browse-wrap');
    if (!wrap) return;
    const sel = '.dating-tagline, .dating-card, .dating-prompt, .dating-photo, .dating-cta, .dating-preview-card';
    const items = Array.from(wrap.querySelectorAll(sel));
    if (!items.length) return;

    // No animation path: just make sure everything is visible.
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('dating-reveal'));
      return; // .dating-reveal alone (un-armed) is fully visible
    }

    items.forEach((el, i) => {
      el.classList.add('dating-reveal', 'reveal-armed');
      el.style.transitionDelay = Math.min(i * 40, 240) + 'ms';
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { root: page, rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    // Observe on the next frame, after the page is visible and laid out, so
    // the observer reliably reports the initially-visible cards.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      items.forEach(el => io.observe(el));
    }));

    // SAFETY NET: no matter what, reveal everything after a short delay so a
    // misfiring observer can never leave the profile blank.
    page._revealSafety = setTimeout(() => {
      items.forEach(el => el.classList.add('in-view'));
    }, 1200);
  }

  function startFx(page) {
    const fx = ensureFx(page);
    if (reduceMotion) return;
    // Spawn a modest, capped set of sparks once (CSS animates them on a loop).
    if (!fx.dataset.sparked) {
      const count = 14; // capped for performance
      for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'spark';
        s.textContent = SPARK_CHARS[i % SPARK_CHARS.length];
        s.style.left = Math.random() * 100 + '%';
        s.style.fontSize = (12 + Math.random() * 16) + 'px';
        s.style.setProperty('--spark-drift', (Math.random() * 80 - 40) + 'px');
        const dur = 9 + Math.random() * 9;
        s.style.animationDuration = dur + 's';
        s.style.animationDelay = (-Math.random() * dur) + 's';
        fx.appendChild(s);
      }
      fx.dataset.sparked = '1';
    }
    attachParallax(page, fx);
  }

  function stopFx(page) {
    detachParallax(page);
  }

  // Pointer/tilt parallax — nudges the whole FX layer a few px. rAF-throttled.
  function attachParallax(page, fx) {
    if (reduceMotion || page._fxParallax) return;
    let raf = 0, tx = 0, ty = 0;
    const onMove = (e) => {
      const pt = e.touches ? e.touches[0] : e;
      const cx = (pt.clientX / window.innerWidth) - 0.5;
      const cy = (pt.clientY / window.innerHeight) - 0.5;
      tx = cx * 24; ty = cy * 24;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      fx.style.setProperty('--px', tx.toFixed(1));
      fx.style.setProperty('--py', ty.toFixed(1));
    };
    page.addEventListener('pointermove', onMove, { passive: true });
    page._fxParallax = { onMove, raf: () => raf };
  }
  function detachParallax(page) {
    const p = page._fxParallax;
    if (!p) return;
    page.removeEventListener('pointermove', p.onMove);
    page._fxParallax = null;
  }

  // Open from any [data-dating]. If the element also has [data-dating-href],
  // it navigates to that file instead of opening the overlay in place — this
  // is how the homepage's dating cards jump to the character's own page, while
  // the on-page "Dating Profile ♡" tab (no href) still opens the overlay here.
  document.querySelectorAll('[data-dating]').forEach(el => {
    if (el.disabled) return;
    const href = el.getAttribute('data-dating-href');
    if (href) {
      el.addEventListener('click', () => { window.location.href = href; });
    } else {
      el.addEventListener('click', () => open(el.dataset.dating));
    }
  });

  // The "Browse All Profiles →" button on the homepage
  const browseBtn = document.getElementById('openDatingBrowse');
  if (browseBtn) browseBtn.addEventListener('click', () => {
    const page = document.getElementById('datingBrowsePage');
    if (!page) return;
    page.classList.add('active');
    page.setAttribute('aria-hidden', 'false');
    page.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    startFx(page);
    settle(page);
    // Focus the search input so users can start typing immediately
    requestAnimationFrame(() => document.getElementById('datingSearchInput')?.focus());
  });

  // ===== SEARCH FILTER =====
  // Filters by name OR any of the space-separated tags on data-tags.
  // Matches as substring (so typing "tox" finds "toxic"). Case-insensitive.
  const searchInput = document.getElementById('datingSearchInput');
  const searchClear = document.getElementById('datingSearchClear');
  const searchWrap  = searchInput?.parentElement;
  const browseGrid  = document.getElementById('datingBrowseGrid');
  const noResults   = document.getElementById('datingNoResults');

  function applyFilter() {
    if (!searchInput || !browseGrid) return;
    const q = searchInput.value.toLowerCase().trim();
    searchWrap?.classList.toggle('has-value', q.length > 0);
    let visible = 0;
    browseGrid.querySelectorAll('.dating-preview-card').forEach(card => {
      if (!q) {
        card.classList.remove('search-hidden');
        visible++;
        return;
      }
      const name = (card.dataset.name || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();
      const matches = name.includes(q) || tags.includes(q);
      card.classList.toggle('search-hidden', !matches);
      if (matches) visible++;
    });
    noResults?.classList.toggle('is-visible', visible === 0);
  }

  searchInput?.addEventListener('input', applyFilter);
  searchClear?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    applyFilter();
    searchInput.focus();
  });

  // Close buttons — one per profile. Close the closest .dating-page by
  // reference so it works for every overlay (profiles AND the browse page).
  document.querySelectorAll('.dating-close').forEach(btn => {
    btn.addEventListener('click', () => {
      closePage(btn.closest('.dating-page'));
    });
  });

  // Backdrop click (clicking the page chrome outside the content) closes too.
  document.querySelectorAll('.dating-page').forEach(page => {
    page.addEventListener('click', (e) => {
      if (e.target === page) closePage(page);
    });
  });

  // Escape closes the active one
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closePage(document.querySelector('.dating-page.active'));
  });
})();


/* ---------- BLOCK 3 ---------- */
/* ---------- SCENE REQUEST MODAL ---------- */
/* Wires every .scene-tab to open the shared modal, pre-filled with that
   character's name. Submits to the same Discord webhook as the homepage
   form. Closes on X / backdrop / Escape. */
(function initSceneModal() {
  const modal     = document.getElementById('sceneModal');
  const closeBtn  = document.getElementById('sceneModalClose');
  const charLabel = document.getElementById('sceneModalChar');
  const form      = document.getElementById('sceneRequestForm');
  const submitBtn = document.getElementById('sceneSubmit');
  const status    = document.getElementById('sceneStatus');
  if (!modal || !form) return;
  let currentChar = '';

  document.querySelectorAll('.scene-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentChar = tab.dataset.character || '';
      charLabel.textContent = currentChar || '—';
      openModal();
    });
  });

  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => document.getElementById('sceneIdea')?.focus());
  }
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    status.className = 'scene-status';
    status.textContent = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (typeof DISCORD_WEBHOOK_URL === 'undefined' || !DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL.includes('PASTE_')) {
      status.className = 'scene-status error';
      status.textContent = '⚠ webhook not configured';
      return;
    }
    const data = {
      charName:  currentChar,
      setting:   document.getElementById('sceneSetting').value.trim(),
      idea:      document.getElementById('sceneIdea').value.trim(),
      extra:     document.getElementById('sceneExtra').value.trim(),
      requester: document.getElementById('sceneRequester').value.trim() || 'Anonymous',
    };
    submitBtn.disabled = true;
    submitBtn.textContent = 'sending...';
    status.className = 'scene-status';
    status.textContent = '';

    const payload = {
      username: 'DreamjourneyAI',
      embeds: [{
        title: '✦ Scene Request — ' + (data.charName || 'Character') + ' ✦',
        color: 0xff5a1f,
        fields: [
          { name: 'Character',    value: data.charName || '—',  inline: true  },
          { name: 'Requested by', value: data.requester,        inline: true  },
          { name: 'Setting',      value: data.setting  || '—',  inline: false },
          { name: 'Idea',         value: data.idea     || '—',  inline: false },
          { name: 'Extra',        value: data.extra    || '—',  inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'From ' + (data.charName || 'character') + ' page tab' }
      }]
    };

    try {
      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Discord returned ' + res.status);
      status.className = 'scene-status success';
      status.textContent = '✦ your scene has been sent to Chunley ✦';
      form.reset();
      setTimeout(closeModal, 1600);
    } catch (err) {
      status.className = 'scene-status error';
      status.textContent = 'could not send — try again';
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send to Chunley';
    }
  });
})();


/* ============================================================
   RORY — IRISH ATMOSPHERE (rising embers + drifting shamrocks)
   Injects a small, capped set of particles into #roAtmos.
   Only runs on Rory's page (element exists) and respects
   prefers-reduced-motion. Pure CSS animation after injection.
   ============================================================ */
(function initRoryAtmosphere() {
  function build() {
    var atmos = document.getElementById('roAtmos');
    if (!atmos || atmos._built) return;
    atmos._built = true;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var frag = document.createDocumentFragment();
    var EMBERS = 14, CLOVERS = 6;

    for (var i = 0; i < EMBERS; i++) {
      var e = document.createElement('span');
      e.className = 'ro-ember';
      var dur = 7 + Math.random() * 8;
      var sz = 2 + Math.random() * 2.5;
      e.style.left = (Math.random() * 100) + '%';
      e.style.width = sz + 'px';
      e.style.height = sz + 'px';
      e.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
      e.style.animationDuration = dur + 's';
      e.style.animationDelay = (-Math.random() * dur) + 's';
      frag.appendChild(e);
    }
    for (var j = 0; j < CLOVERS; j++) {
      var c = document.createElement('span');
      c.className = 'ro-clover';
      c.textContent = '\u2618'; /* ☘ shamrock */
      var cd = 16 + Math.random() * 12;
      c.style.left = (Math.random() * 100) + '%';
      c.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
      c.style.setProperty('--sz', (11 + Math.random() * 10) + 'px');
      c.style.animationDuration = cd + 's';
      c.style.animationDelay = (-Math.random() * cd) + 's';
      frag.appendChild(c);
    }
    atmos.appendChild(frag);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();


/* ============================================================
   RORY — FIND THE LADY  (three-card monte mini-game)
   Watch the Queen, follow the shuffle, pick her out. Rory
   cheats sometimes (a quick palm) — unless you arm "Watch His
   Hands". Difficulty + cheat odds scale with your win streak.
   Self-contained; only initialises if #roryCardGame exists.
   ============================================================ */
(function initRoryFindTheLady() {
  function build() {
    var game = document.getElementById('roryCardGame');
    if (!game || game._init) return;
    game._init = true;

    var table   = document.getElementById('roTable');
    var dealer  = document.getElementById('roDealerLine');
    var slateW  = document.getElementById('roWon');
    var slateL  = document.getElementById('roLost');
    var dealBtn = document.getElementById('roDealBtn');
    var watchBtn= document.getElementById('roWatchBtn');
    var hint    = document.getElementById('roHint');
    var cards   = Array.prototype.slice.call(table.querySelectorAll('.ro-pcard'));
    if (cards.length !== 3) return;

    var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = REDUCE ? 0.16 : 1;  // time scale

    // round + session state
    var phase = 'idle';         // idle | watching | shuffling | pick | result
    var gap = 116;
    var armed = false;
    var won = 0, lost = 0, winStreak = 0, lossStreak = 0;
    var cheatedThisRound = false;

    // card identities (set each round). Tie-in to his neck tattoo:
    // the Lady (Queen ♥) + the Three (3♣) + the Ace (A♠).
    var FACES = {
      lady:  { cls: 'lady',  corner: 'Q<br>\u2665', pip: '\u2665', label: 'The Lady' },
      three: { cls: 'three', corner: '3<br>\u2663', pip: '\u2663', label: 'The Three' },
      ace:   { cls: 'ace',   corner: 'A<br>\u2660', pip: '\u2660', label: 'The Ace' }
    };

    /* ---------- banter ---------- */
    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
    var LINES = {
      watch:        "Here's the Lady — Queen o' Hearts. Watch her now\u2026",
      shuffle:      "Round an' round she goes\u2026",
      shuffleArmed: "Eyes on me hands, then. Round we go \u2014 quick now.",
      pickPrompt:   "Right. Where's she hidin'? Take yer pick.",
      win: [
        "Ah, would ye look at that. Sharp eyes on ye. Don't get used to it.",
        "Fair play \u2014 ye found her. I'll allow it the once.",
        "Clean win, that. Me Da'd be appalled.",
        "Ye picked her true. Beginner's luck, surely."
      ],
      winStreak: [
        "On the bounce again? Are ye countin' cards in me own game, ye cheeky article?",
        "Ye're robbin' me blind, so ye are. Respect it. Hate it. Both.",
        "Right, that's enough o' that. Yer luck's gettin' personal."
      ],
      winArmed: [
        "Played it dead straight an' ye STILL beat me. Mortifyin', that.",
        "No tricks that round, an' ye found her. Don't tell Finn."
      ],
      loseHonest: [
        "Wrong one, love. She was never there. Hard luck.",
        "Ohh, so close. Well \u2014 no, not really. But it's polite to say.",
        "That's the Ace. The Lady's gone walkin' wit'out ye.",
        "Nope. Three o' clubs. Try keepin' up next time, aye?"
      ],
      loseStreak: [
        "Down a fair few now, aren't ye. Buy us a drink an' I'll go easy. I won't, but buy it anyway.",
        "Keep this up an' ye'll owe me yer coat. I've always fancied a new coat."
      ],
      loseCheat: [
        "Ah\u2026 would ye look at that. Must've slipped. Hands o' their own, these.",
        "Caught me, did ye? Took ye long enough. She was up me sleeve the whole time.",
        "Did I move her? I'd never. \u2026I absolutely did. Again?",
        "Sleight o' hand, love. It's not lyin' if ye're smilin' while ye do it."
      ],
      loseArmed: [
        "Watched me hands the whole time an' STILL picked wrong? That's just sad, love.",
        "No cheatin' that round, an' ye lost fair. Worse, somehow."
      ]
    };
    function say(text, isTell) {
      dealer.innerHTML = text;
      dealer.classList.toggle('tell', !!isTell);
    }

    /* ---------- geometry ---------- */
    function measure() {
      var r = cards[0].getBoundingClientRect();
      var w = r.width || 104;
      gap = w + Math.max(10, w * 0.12);
    }
    function setX(card) {
      card.style.setProperty('--x', ((card._lane - 1) * gap) + 'px');
    }
    window.addEventListener('resize', function () {
      if (phase === 'idle' || phase === 'pick' || phase === 'result') {
        measure(); cards.forEach(setX);
      }
    });

    /* ---------- face rendering ---------- */
    function renderFace(card, id) {
      card._id = id;
      var f = FACES[id];
      var front = card.querySelector('.ro-pcard-front');
      front.className = 'ro-pcard-face ro-pcard-front ' + f.cls;
      front.innerHTML =
        '<div class="pc-corner">' + f.corner + '</div>' +
        '<div class="pc-pip">' + f.pip + '</div>' +
        '<div class="pc-label">' + f.label + '</div>' +
        '<div class="pc-corner br">' + f.corner + '</div>';
    }
    function faceUp(card, up) { card.classList.toggle('faceup', !!up); }

    /* ---------- helpers ---------- */
    function wait(ms) { return new Promise(function (res) { setTimeout(res, ms * T); }); }
    function lock(state) {
      dealBtn.disabled = state;
      watchBtn.disabled = state;
    }
    function clearMarks() {
      cards.forEach(function (c) {
        c.classList.remove('win-glow', 'lose-dim', 'caught-slide', 'lift');
        faceUp(c, false);
      });
    }

    /* swap the cards currently in lane a and lane b */
    function swapLanes(a, b, quiet) {
      var ca = cards.find(function (c) { return c._lane === a; });
      var cb = cards.find(function (c) { return c._lane === b; });
      if (!ca || !cb) return;
      ca._lane = b; cb._lane = a;
      if (!quiet) { ca.classList.add('lift'); cb.classList.add('lift'); }
      setX(ca); setX(cb);
      setTimeout(function () { ca.classList.remove('lift'); cb.classList.remove('lift'); }, 480 * T);
    }
    function ladyCard() { return cards.find(function (c) { return c._id === 'lady'; }); }

    /* ---------- the round ---------- */
    async function deal() {
      if (phase !== 'idle' && phase !== 'result') return;
      phase = 'watching';
      cheatedThisRound = false;
      game.classList.remove('is-idle', 'is-pick');
      lock(true);
      clearMarks();
      measure();

      // reset lanes 0,1,2 and assign fresh identities
      var ids = ['lady', 'three', 'ace'];
      for (var k = ids.length - 1; k > 0; k--) { var m = (Math.random() * (k + 1)) | 0; var t = ids[k]; ids[k] = ids[m]; ids[m] = t; }
      cards.forEach(function (c, i) { c._lane = i; setX(c); renderFace(c, ids[i]); });

      await wait(120);
      say(LINES.watch);
      cards.forEach(function (c) { faceUp(c, true); });
      await wait(1300);
      cards.forEach(function (c) { faceUp(c, false); });
      await wait(420);

      // shuffle
      phase = 'shuffling';
      say(armed ? LINES.shuffleArmed : LINES.shuffle);
      var swaps = 4 + Math.min(winStreak, 5) + (armed ? 2 : 0);   // armed = more swaps, but honest
      var step = Math.max(REDUCE ? 60 : 230, 470 - winStreak * 22 - (armed ? 70 : 0));
      var lanes = [0, 1, 2];
      for (var s = 0; s < swaps; s++) {
        var a = lanes[(Math.random() * 3) | 0];
        var b; do { b = lanes[(Math.random() * 3) | 0]; } while (b === a);
        swapLanes(a, b, false);
        await wait(step);
      }

      // the palm — Rory cheats unless you're watching his hands
      var cheatChance = Math.min(0.25 + winStreak * 0.14, 0.72);
      if (!armed && Math.random() < cheatChance) {
        var ld = ladyCard();
        var here = ld._lane;
        var there; do { there = (Math.random() * 3) | 0; } while (there === here);
        swapLanes(here, there, true);   // quiet, quick, low-key palm
        cheatedThisRound = true;
        await wait(Math.max(REDUCE ? 50 : 180, 260));
      }

      // your move
      phase = 'pick';
      game.classList.add('is-pick');
      say(LINES.pickPrompt);
      lock(false);
      dealBtn.textContent = 'Deal Again';
    }

    async function choose(card) {
      if (phase !== 'pick') return;
      phase = 'result';
      game.classList.remove('is-pick');
      lock(true);

      var win = card._id === 'lady';
      faceUp(card, true);
      await wait(520);

      var ld = ladyCard();
      if (!win) {
        // reveal the Lady too, dim the wrong pick
        faceUp(ld, true);
        card.classList.add('lose-dim');
        cards.forEach(function (c) { if (c !== card && c !== ld) c.classList.add('lose-dim'); });
      } else {
        card.classList.add('win-glow');
      }

      if (win) {
        won++; winStreak++; lossStreak = 0;
        slateW.textContent = won;
        if (armed)               say(pick(LINES.winArmed));
        else if (winStreak >= 3) say(pick(LINES.winStreak));
        else                     say(pick(LINES.win));
      } else {
        lost++; lossStreak++; winStreak = 0;
        slateL.textContent = lost;
        if (cheatedThisRound) {
          // show the con: the Lady does a guilty extra slide
          await wait(380);
          ld.classList.add('caught-slide');
          var dest; do { dest = (Math.random() * 3) | 0; } while (dest === ld._lane);
          ld._lane = dest; setX(ld);
          say(pick(LINES.loseCheat), true);
        } else if (armed) {
          say(pick(LINES.loseArmed));
        } else if (lossStreak >= 3) {
          say(pick(LINES.loseStreak));
        } else {
          say(pick(LINES.loseHonest));
        }
      }

      phase = 'idle';
      lock(false);
    }

    /* ---------- wiring ---------- */
    cards.forEach(function (card) {
      card.addEventListener('click', function () { choose(card); });
    });
    dealBtn.addEventListener('click', function () { deal(); });
    watchBtn.addEventListener('click', function () {
      if (phase === 'watching' || phase === 'shuffling') return;
      armed = !armed;
      watchBtn.classList.toggle('armed', armed);
      watchBtn.setAttribute('aria-pressed', armed ? 'true' : 'false');
      watchBtn.textContent = armed ? "Eyes On Him \u2713" : 'Watch His Hands';
      hint.innerHTML = armed
        ? "// he'll play it straight this round \u2014 but watch the shuffle, it's quicker when he's cross."
        : "// arm \"Watch His Hands\" an' he'll play it straight \u2014 but he'll shuffle faster to spite ye.";
    });

    // initial lane layout
    measure();
    cards.forEach(function (c, i) { c._lane = i; setX(c); renderFace(c, ['lady', 'three', 'ace'][i]); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();



/* ============================================================
   SCORCH — RAT HUNT (reaction mini-game)
   Stomp the Street Rats (Sin / Mason / Ash, and Skye for DOUBLE
   points) before they scatter; do NOT hit the Snakes (his band:
   Shane / Kayla / Cody / Max / Ricky). Misses & wrong hits drain
   Patience; survive the whole hunt to win. Difficulty ramps.
   Only initialises if #scorchRat exists; timers cleaned on stop.
   ============================================================ */
(function initScorchRatHunt() {
  function build() {
    var root = document.getElementById('scorchRat');
    if (!root || root._init) return;
    root._init = true;

    var pit      = document.getElementById('scRatPit');
    var overlay  = document.getElementById('scRatOverlay');
    var callout  = document.getElementById('scRatCallout');
    var rules    = document.getElementById('scRatRules');
    var startBtn = document.getElementById('scRatStart');
    var patFill  = document.getElementById('scRatPatience');
    var setFill  = document.getElementById('scRatSet');
    var scoreEl  = document.getElementById('scRatScore');
    var comboEl  = document.getElementById('scRatCombo');
    var lineEl   = document.getElementById('scRatLine');
    if (!pit || !startBtn) return;

    var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var DURATION = 45000;
    var MAX_ON   = 5;
    var RATS   = ['Sin', 'Mason', 'Ash'];
    var SNAKES = ['Shane', 'Kayla', 'Cody', 'Max', 'Ricky'];

    var LINES = {
      ratKill: ["Got one.", "Stay down.", "Vermin. Next.", "That's for nothin'."],
      combo:   ["Now we're talkin'.", "Keep 'em comin'.", "Pile 'em up.", "Don't slow down."],
      skye:    ["SKYE. Double. That one's personal.", "Two years, Skye \u2014 worth every point.", "There he is. Hit him twice as hard."],
      snake:   ["{n}'s with ME \u2014 watch it!", "That's my BAND, dipshit!", "Don't touch the Snakes!", "{n}? That's a bandmate, asshole."],
      miss:    ["It got away\u2014!", "Quit lettin' 'em scatter.", "Faster, damn it."],
      low:     ["They're swarmin'\u2026", "Losin' the alley\u2026"],
      win:     ["Alley's clean. Good.", "That's pest control. Don't quit your day job.", "Rats handled. For now."],
      lose:    ["They overran us. Pathetic.", "Rats win. Love that for me.", "You let the alley go. Out."]
    };
    function pick(a) { return a[(Math.random() * a.length) | 0]; }
    function say(txt, kind) { lineEl.textContent = txt; lineEl.className = 'sc-rat-line' + (kind ? ' ' + kind : ''); }

    var running = false;
    var score = 0, combo = 0, maxCombo = 0, pat = 100, elapsed = 0;
    var spawnTimer = null, tickTimer = null;
    var live = new Set();
    var lowWarned = false;

    function mult() { return Math.min(1 + Math.floor(combo / 5), 5); }
    function progress() { return elapsed / DURATION; }

    function updateHUD() {
      scoreEl.textContent = score;
      comboEl.textContent = 'x' + mult();
      patFill.style.width = Math.max(0, pat) + '%';
      patFill.className = 'sc-rat-bar-fill' + (pat < 25 ? ' crit' : pat < 50 ? ' warn' : '');
      setFill.style.width = Math.min(100, progress() * 100) + '%';
    }
    function bumpCombo() { comboEl.classList.add('bump'); setTimeout(function () { comboEl.classList.remove('bump'); }, 130); }
    function flashBad() {
      if (REDUCE) return;
      pit.classList.remove('shake', 'flash-bad'); void pit.offsetWidth;
      pit.classList.add('shake', 'flash-bad');
      setTimeout(function () { pit.classList.remove('shake', 'flash-bad'); }, 400);
    }
    function popup(el, txt, kind) {
      var p = document.createElement('span');
      p.className = 'sc-rat-pop ' + (kind || 'good');
      p.textContent = txt;
      p.style.left = el.style.left; p.style.top = el.style.top;
      pit.appendChild(p);
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, REDUCE ? 0 : 700);
    }

    function curInterval() { return Math.max(420, 1000 - progress() * 540); }
    function curLifetime() { return Math.max(760, 1500 - progress() * 700); }

    function spawn() {
      if (!running) return;
      if (live.size < MAX_ON) {
        var isSnake = Math.random() < 0.20;
        var isSkye  = !isSnake && Math.random() < 0.18;
        var name = isSnake ? pick(SNAKES) : (isSkye ? 'Skye' : pick(RATS));
        var el = document.createElement('div');
        el.className = 'sc-rat-target' + (isSnake ? ' snake' : isSkye ? ' skye' : '');
        el.innerHTML = (isSnake ? '\uD83D\uDC0D' : '\uD83D\uDC00') +
          '<span class="sc-rat-tag">' + name + '</span>' +
          (isSkye ? '<span class="sc-rat-x2">\u00D72</span>' : '');
        el._snake = isSnake; el._skye = isSkye; el._name = name; el._done = false;
        el.style.left = (10 + Math.random() * 80) + '%';
        el.style.top  = (18 + Math.random() * 70) + '%';
        var life = curLifetime();
        el.style.setProperty('--life', life + 'ms');
        el.addEventListener('click', function () { tap(el); });
        el._expTimer = setTimeout(function () { expire(el); }, life);
        pit.appendChild(el);
        live.add(el);
      }
      spawnTimer = setTimeout(spawn, curInterval());
    }

    function removeTarget(el) { clearTimeout(el._expTimer); live.delete(el); if (el.parentNode) el.parentNode.removeChild(el); }
    function squish(el) { el.classList.add('hit'); setTimeout(function () { removeTarget(el); }, REDUCE ? 0 : 230); }

    function tap(el) {
      if (!running || el._done) return;
      el._done = true; clearTimeout(el._expTimer);
      if (el._snake) {
        pat -= 20; combo = 0;
        say(pick(LINES.snake).replace('{n}', el._name), 'bad');
        flashBad(); popup(el, '\u2212' + 20, 'bad');
        removeTarget(el);
      } else {
        combo++; maxCombo = Math.max(maxCombo, combo);
        var pts = (el._skye ? 20 : 10) * mult();
        score += pts; pat = Math.min(100, pat + 1);
        popup(el, '+' + pts, el._skye ? 'big' : 'good');
        if (el._skye) say(pick(LINES.skye), 'big');
        else if (combo % 5 === 0) say(pick(LINES.combo), 'good');
        else say(pick(LINES.ratKill));
        bumpCombo(); squish(el);
      }
      updateHUD(); checkLow();
    }
    function expire(el) {
      if (el._done) return; el._done = true;
      if (el._snake) { score += 5; }            // correctly spared a bandmate
      else { pat -= 8; combo = 0; say(pick(LINES.miss), 'bad'); }
      removeTarget(el); updateHUD(); checkLow();
      if (pat <= 0) end('lose');
    }
    function checkLow() {
      if (pat <= 0) { end('lose'); return; }
      if (pat < 25 && !lowWarned) { lowWarned = true; say(pick(LINES.low), 'bad'); }
      if (pat >= 25) lowWarned = false;
    }
    function tick() {
      if (!running) return;
      elapsed += 100; updateHUD();
      if (pat <= 0) { end('lose'); return; }
      if (elapsed >= DURATION) { end('win'); return; }
    }
    function clearAll() {
      clearTimeout(spawnTimer); spawnTimer = null;
      clearInterval(tickTimer); tickTimer = null;
      live.forEach(function (el) { clearTimeout(el._expTimer); if (el.parentNode) el.parentNode.removeChild(el); });
      live.clear();
      Array.prototype.slice.call(pit.querySelectorAll('.sc-rat-pop')).forEach(function (p) { if (p.parentNode) p.parentNode.removeChild(p); });
    }
    function start() {
      clearAll();
      running = true;
      score = 0; combo = 0; maxCombo = 0; pat = 100; elapsed = 0; lowWarned = false;
      overlay.classList.add('hidden');
      say("Stomp the rats. Spare the Snakes. Go.");
      updateHUD(); spawn();
      tickTimer = setInterval(tick, 100);
    }
    function end(result) {
      running = false; clearAll();
      var won = result === 'win';
      callout.textContent = won ? 'Alley Cleared.' : 'They Overran You.';
      rules.innerHTML = '<span class="sc-rat-finalscore">Final Score <b>' + score + '</b>Best combo x' + Math.min(1 + Math.floor(maxCombo / 5), 5) + '</span>';
      startBtn.textContent = 'Hunt Again';
      overlay.classList.remove('hidden');
      say(pick(won ? LINES.win : LINES.lose), won ? 'good' : 'bad');
    }

    startBtn.addEventListener('click', start);
    updateHUD();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();


/* ============================================================
   SHANE — DON'T GET CAUGHT  (tour-bus stealth, side-scroller)
   ------------------------------------------------------------
   Break in through the FRONT WINDOW of the band's tour bus, sneak
   back through the lounge (amps, cases, kitchenette) and the bunk
   hallway to SHANE'S BUNK, where his journal is kept. Shane PATROLS
   the aisle. Stay out of his sightline / behind gear. Reach the
   journal -> the entry unlocks and opens SAFELY; read it, hit X to
   close -> advance to the next LEVEL (camera longer/harder, and
   the deeper you go the better your odds at rare/buried/legendary
   pages). Pick a girl or boy "you" first; Shane always looks like
   Shane (brown ponytail). Cartoon/anime drawn style, scrolling
   camera. Controls: big hold buttons + arrows/A,D/crouch keys.
   Only initialises if #shBreakin exists.
   ============================================================ */
(function initShaneBreakin() {
  function build() {
    var root = document.getElementById('shBreakin');
    if (!root || root._init) return;
    root._init = true;

    var canvas   = document.getElementById('shCanvas');
    var gaze     = document.getElementById('shGaze');
    var gazeTxt  = document.getElementById('shGazeText');
    var suspFill = document.getElementById('shSuspFill');
    var countEl  = document.getElementById('shCount');
    var floorEl  = document.getElementById('shFloor');
    var readPanel= document.getElementById('shReadPanel');
    var tagEl    = document.getElementById('shTag');
    var entryEl  = document.getElementById('shEntry');
    var dateEl   = document.getElementById('shDate');
    var readClose= document.getElementById('shReadClose');
    var readCont = document.getElementById('shReadContinue');
    var overlay  = document.getElementById('shOverlay');
    var callout  = document.getElementById('shCallout');
    var subEl    = document.getElementById('shGameSub');
    var startBtn = document.getElementById('shStart');
    var charSel  = document.getElementById('shCharSel');
    var lineEl   = document.getElementById('shLine');
    var btnLeft  = document.getElementById('shBtnLeft');
    var btnRight = document.getElementById('shBtnRight');
    var btnCrouch= document.getElementById('shBtnCrouch');
    if (!canvas || !startBtn) return;
    var ctx = canvas.getContext('2d');

    var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pick(a) { return a[(Math.random() * a.length) | 0]; }
    function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    /* chosen player character: 'girl' | 'boy' */
    var heroType = 'girl';

    var DATES = [
      "\u2014 late", "\u2014 couldn't sleep", "\u2014 3 a.m. again", "\u2014 tour bus, somewhere",
      "\u2014 rained all day", "\u2014 day off. didn't leave.", "\u2014 after soundcheck",
      "\u2014 she left a note", "\u2014 no idea what day it is", "\u2014 written in the dark",
      "\u2014 gas station parking lot", "\u2014 motel off the interstate", "\u2014 back of the venue",
      "\u2014 4 a.m., everyone asleep", "\u2014 the long drive north", "\u2014 nobody around",
      "\u2014 hands not steady today", "\u2014 didn't date this one on purpose"
    ];

    var COMMON = [
      { tag: 'Annoyed', t: "Scorch used my amp again. Left it on 11. We've discussed this. We'll discuss it louder." },
      { tag: 'Annoyed', t: "Cody apologized for breathing. Again. Kid's gonna apologize at his own funeral." },
      { tag: 'Annoyed', t: "Somebody keeps retuning my E. I know who. I'm watching." },
      { tag: 'Annoyed', t: "Ricky booked another 6 a.m. lobby call. Ricky has never met me." },
      { tag: 'Annoyed', t: "Max changed the set mid-song. We do not improvise the SETLIST, Max." },
      { tag: 'Annoyed', t: "Found glitter in my bass case. Kayla. It's in everything now. It's in my soul." },
      { tag: 'Annoyed', t: "Scorch asked to 'borrow' my picks. There were twelve. There are now zero." },
      { tag: 'Annoyed', t: "Whole green room out of coffee and three people LOOKED AT ME. I am not the coffee guy. I became the coffee guy." },
      { tag: 'Annoyed', t: "The opener's bassist asked me for 'tips.' I told him to tune up. He thought I was joking." },
      { tag: '3 A.M.',   t: "Coffee's cold. Third cup. Don't remember the first two." },
      { tag: '3 A.M.',   t: "Rain on the glass sounds like brushes on a snare. Couldn't sleep. Wrote that instead." },
      { tag: '3 A.M.',   t: "Two a.m. The bass is unplugged and I'm still hearing it." },
      { tag: '3 A.M.',   t: "Hotel ceiling. Counted the cracks. Lost count. Started over." },
      { tag: '3 A.M.',   t: "Can hear Cody snoring through the wall. Weirdly, it helps. Means he's still here." },
      { tag: '3 A.M.',   t: "Insomnia again. Old friend. We don't talk, we just sit there." },
      { tag: 'Mundane',  t: "Ate cereal over the sink for dinner. Living the dream, clearly." },
      { tag: 'Mundane',  t: "New strings today. Smell like a fresh start. They're not. But they smell like one." },
      { tag: 'Mundane',  t: "Did laundry in a gas station sink. Don't ask. It worked. Mostly." },
      { tag: 'Mundane',  t: "Replaced the input jack myself. Took an hour. Could've been five minutes. Worth it." },
      { tag: 'Mundane',  t: "Fixed the rattle in the van door. Nobody noticed. That's the job." },
      { tag: 'Bike',     t: "Knucklehead idling rough again. Pulled the plugs. They're fine. SHE'S just dramatic." },
      { tag: 'Bike',     t: "Rode two hours just to ride back. Didn't go anywhere. Went everywhere. You get it or you don't." },
      { tag: 'Bike',     t: "Cleaned the chrome till I could see my own dumb face in it. Therapy, basically." },
      { tag: '\u266A Lyric', t: "low note holds the room together\nnobody claps for the floor" },
      { tag: '\u266A Lyric', t: "midnight hums in the key of leaving\nand I never learned the words" },
      { tag: '\u266A Lyric', t: "the quiet ones keep the time\nso the loud ones can fall apart" },
      { tag: '\u266A Lyric', t: "I carry the low end like a debt\nplay it slow, never paid it off yet" },
      { tag: '\u266A Lyric', t: "four strings and a closed door\nthat's the whole song, there ain't more" }
    ];

    var UNCOMMON = [
      { tag: 'About You', t: "She laughed at the dumb one. The joke I don't tell anyone. Filed that away." },
      { tag: 'About You', t: "Caught myself saving the window seat. For nobody. For her. Same thing now, apparently." },
      { tag: 'About You', t: "She hums our song wrong on purpose. I stopped correcting her. That's the tell, isn't it." },
      { tag: 'About You', t: "Memorized how she takes her coffee before I memorized her last name. Backwards, as usual." },
      { tag: 'About You', t: "She fell asleep on the drive. Took the long way so she'd sleep longer. Told no one." },
      { tag: 'About You', t: "Wrote a bassline thinking about her walk. Nobody'll ever know that's what it is. She might." },
      { tag: 'About You', t: "She borrowed my jacket and didn't give it back. I'm not asking for it back. Obviously." },
      { tag: 'About You', t: "She remembered the name of my mom's favorite flower. I only said it once. Once." },
      { tag: 'Embarrassing', t: "Practiced what I'd say to her in the mirror. Forgot all of it. Said 'sup.' SUP." },
      { tag: 'Embarrassing', t: "Reread her one text fourteen times to 'make sure I understood it.' I understood it the first time." },
      { tag: 'Embarrassing', t: "Almost signed a setlist 'love, Shane.' To the whole crowd. Caught it. Barely." },
      { tag: 'Embarrassing', t: "Saved her as 'Do Not Text First' so I'd stop texting first. Texted first." },
      { tag: 'Embarrassing', t: "Stood outside the green room rehearsing 'casual.' There is no casual. There is only me, sweating." },
      { tag: 'Embarrassing', t: "Drew a little heart in the margin, scribbled it out so hard it tore the page. It's still under there. Like everything." },
      { tag: 'Embarrassing', t: "Learned the song she likes. 'In case it comes up.' Practiced it 40 times. It will never 'come up.' I will make it come up." },
      { tag: 'The Band', t: "Cody had a bad night. Sat with him on the curb till the shaking stopped. Didn't say much. Didn't have to." },
      { tag: 'The Band', t: "Scorch is louder than his demons most days. Some days he isn't. Those days I stay close. He doesn't know I clock it." },
      { tag: 'The Band', t: "Max thinks nobody sees how scared he is of all of this ending. I see it. I'd never say it. That's why he trusts me." },
      { tag: 'The Band', t: "Kayla left a sticky note on my case: 'you're not as scary as you think.' Kept it. Won't tell her I kept it." },
      { tag: 'Saw Scorch', t: "Watched Scorch practice his 'effortless' brooding stare in the bus mirror for ten minutes. The frontman mystique is a full-time job, apparently. Said nothing." },
      { tag: 'Saw Scorch', t: "Scorch walked into the glass door at the venue. Hard. Then turned and glared at the door like IT started something. I was the only one who saw. He'll never know." },
      { tag: 'Saw Scorch', t: "Caught Scorch crying to a dog food commercial. The one with the old dog. He blamed 'allergies.' We were in the desert. There was no pollen. There was a dog." },
      { tag: 'Saw Scorch', t: "Scorch tucked his shirt into his underwear, walked half the meet-and-greet line like that. Forty fans. Nobody told him. I could have. I chose peace." },
      { tag: 'Saw Scorch', t: "He rehearses what he'll say if he ever meets his idols. Out loud. In the shower. I know the whole speech now. It has a part where he 'plays it cool.' It does not play it cool." },
      { tag: 'Saw Scorch', t: "Scorch tried to flirt with the merch girl, leaned on the table all smooth, table folded, he went down with it. Got up. Said 'anyway.' Left. I have never respected the word 'anyway' more." },
      { tag: 'Saw Scorch', t: "Found Scorch asleep clutching a stuffed dragon Kayla won him at a fair. He'd kill to keep that secret. So I'll keep it. For leverage. And, fine, a little because it's sweet." },
      { tag: 'Saw Scorch', t: "Scorch practiced signing autographs with a new 'signature flourish.' Forty attempts. It looks like a seismograph during an earthquake. He thinks it's iconic." },
      { tag: 'Saw Scorch', t: "He spent a whole soundcheck convinced his in-ear was broken. It was off. He hadn't turned it on. I watched him 'troubleshoot' for twenty minutes. Said nothing. This is my life now." },
      { tag: 'Saw Scorch', t: "Scorch screamed like a kettle at a spider the size of a freckle, then spent the rest of the night insisting he 'relocated it humanely.' He threw a boot. The boot is still out there." },
      { tag: 'Saw Scorch', t: "Watched Scorch eat what he thought was a protein bar. It was a dog treat. Cody's dog's. He said it was 'kind of nutty.' I let him finish. Some lessons you earn." },
      { tag: 'Saw Scorch', t: "Scorch hyped himself up in the mirror before the show — 'you're a god, you're a legend' — then knocked his own water bottle into the monitor. God tripped over the cable. I saw the whole arc." },
      { tag: 'Saw Cody', t: "Cody apologized to a vending machine. It ate his dollar. He said 'no, that's okay, my fault.' It was not his fault. The machine has no feelings. Cody gave it the benefit of the doubt anyway." },
      { tag: 'Saw Cody', t: "Watched Cody practice saying 'no' in the mirror so he could turn down an extra shift. He got through it twice. Then someone asked him for real and he said 'yeah, sure, happy to.' Filed it under things I'll fix for him quietly." },
      { tag: 'Saw Cody', t: "Cody waved back at someone waving past him to another person. Then committed to it. Full conversation with a stranger out of pure politeness. He learned that guy's kids' names. Said nothing to me. I said nothing to him." },
      { tag: 'Saw Cody', t: "Found Cody narrating drum fills under his breath in the grocery store — 'and the ghost note, and the\u2014' — boom-tssing down the cereal aisle. He didn't know I was behind him. Best thing I saw all week." },
      { tag: 'Saw Cody', t: "Cody set six alarms to make a lobby call, woke up before all of them, lay there terrified he'd somehow still be late, then turned each one off as it rang so it 'wouldn't bother anyone.' He was the first one down. He apologized for being early." },
      { tag: 'Saw Cody', t: "He cried at the end of a movie and tried to play it off as a yawn. A two-minute yawn. With tears. I handed him a napkin and looked back at the screen. We have never discussed it. We never will." },
      { tag: 'Saw Max', t: "Max told a girl at the bar he was 'basically the lead guitarist of a touring band,' then got so nervous he knocked back what he thought was his beer. It was the candle. He drank candle. He said it was 'smoky.' I let him have that." },
      { tag: 'Saw Max', t: "Watched Max try to look busy tuning when the cute photographer walked by. He wasn't plugged in. He soulfully adjusted pegs on a silent guitar for ninety seconds. The dedication to the bit was almost admirable." },
      { tag: 'Saw Max', t: "Max has a 'cool guy' lean he does against the amp. The amp had wheels today. He's fine. The amp's fine. His pride is in the river bend with everyone else's." },
      { tag: 'Saw Max', t: "Caught Max rehearsing a story to make it sound like he stayed calm during the thing where he absolutely did not stay calm. I was there for the original. The rehearsed version is better. I'll let the rehearsed version win." },
      { tag: 'Saw Max', t: "Max practiced his stage banter in the bathroom — 'how we feelin' tonight' — twelve different inflections. Went with the first one. They were all the same one. I clocked every take through the wall." },
      { tag: 'Saw Max', t: "Max bragged for an hour about never getting starstruck, then froze solid when a guy from a band he likes said 'good set.' Just stood there. I had to answer for him. Said 'he says thanks.' Max has not forgiven me for witnessing it." },
      { tag: 'Saw Kayla', t: "Kayla argued with a parking meter for a full minute, lost, and walked away muttering. The meter was correct. She knows the meter was correct. That's what makes her mad." },
      { tag: 'Saw Kayla', t: "Watched Kayla confidently lead the whole band the wrong way through an airport. Nobody questioned her because she walks like she knows. She did not know. We saw the same pretzel stand three times. I said nothing. The walk earned it." },
      { tag: 'Saw Kayla', t: "Kayla 'casually' left her cello music open to a piece she'd been secretly perfecting for weeks, just hoping someone'd ask. I asked. She acted surprised. She'd been waiting four days. I let her have the surprise." },
      { tag: 'Saw Kayla', t: "Caught Kayla hyping up a nervous Cody before a show with the exact pep talk she gives herself in the mirror. Word for word. She doesn't know I've heard the mirror version. Two for the price of one, that secret." },
      { tag: 'Saw Kayla', t: "Kayla tripped on a perfectly flat stage, turned it into a little spin, and bowed. Crowd thought it was choreography. It was not choreography. The save was better than anything choreographed. I respect the save." },
      { tag: 'Saw Kayla', t: "She talks to the merch plushies when she thinks the booth's empty. Gives them little voices. The dragon has a backstory now. It's a good backstory. I'm not telling her the booth wasn't empty." },
      { tag: 'Saw Ricky', t: "Ricky gave a forty-minute speech about 'tightening the budget' wearing sunglasses he expensed to the band. Indoors. At night. I did the math on the sunglasses during the speech. The sunglasses lost the argument." },
      { tag: 'Saw Ricky', t: "Watched Ricky take a 'very important call' the whole sidewalk could tell was the dial tone. He said 'mmhm, absolutely, let's circle back' to nobody. Hung up looking powerful. I have the timestamp." },
      { tag: 'Saw Ricky', t: "Ricky booked us a 6 a.m. lobby call, then overslept it himself by two hours. Came down, saw us all waiting, said 'good, you're learning discipline.' The audacity is almost a renewable resource." },
      { tag: 'Saw Ricky', t: "Caught Ricky practicing his signature in case he ever has to autograph something 'as the guy who discovered us.' He did not discover us. He answered an email. I watched him sign 'Ricky \u2014 the visionary' eleven times." },
      { tag: 'Saw Ricky', t: "Ricky tried to look like he understood the contract he was nodding along to. Held it upside down for the first page. Realized it. Casually rotated it like that was a technique. I rotated my coffee to match. He didn't get the joke. Perfect." },
      { tag: 'Saw Ricky', t: "Ricky told a promoter he 'handles all the band's complex logistics personally,' then asked me which city we were in. I told him. He said 'exactly' to the promoter. We are, against all odds, still touring." },
      { tag: 'Mom', t: "Heard a woman laugh in a diner exactly like Mom used to. Sat in the parking lot a while after. Just sat." },
      { tag: 'Mom', t: "Made her soup recipe from memory. Got it wrong. Ate it anyway. Wrong tastes better than nothing." },
      { tag: 'Mom', t: "She used to say 'play it like you mean it, or don't play.' Still the only review that ever mattered." }
    ];

    var RARE = [
      { tag: 'Confession', t: "I keep the seat warm and the bridge tuned and a list of her bad days so I can be quiet on the right ones. Most honest thing in this book." },
      { tag: 'Confession', t: "If she asked me to set the bass down for good, I'd think about it. That should scare me more than it does." },
      { tag: 'Confession', t: "Told the band the new song's 'about nothing.' It's about her. They know. Nobody's dumb enough to say so." },
      { tag: 'Confession', t: "I have a whole life planned out that I'll never say out loud, because saying it makes it a thing that can be taken." },
      { tag: 'Secret', t: "There's a song I'll never play live. Hers. Titled with a date she doesn't remember and I can't forget." },
      { tag: 'Secret', t: "Went back to the home a second time. Told no one. Walter called me by my mother's name. Let him." },
      { tag: 'Secret', t: "I still pay for Walter's room. Not for him. For her. She'd have wanted it. That's the only reason left, and it's enough." },
      { tag: 'About You', t: "Caught myself arranging a whole future in the key of her. Didn't write it down. Wrote THIS down, which is worse." },
      { tag: 'Embarrassing', t: "Bought two coffees out of habit. She wasn't there. Drank both. Deadpan the whole time. Pathetic, technically." },
      { tag: 'Embarrassing', t: "Wrote her name in the dust on the amp, then played a two-hour set terrified someone'd see it. Wiped it off after. Missed it immediately." },
      { tag: 'Weird', t: "Recurring dream: only the low E is left and it's enough. Woke up calm. Hate that." },
      { tag: 'Weird', t: "Dreamed I told her everything. Woke up so relieved it took me a second to remember I never would." },
      { tag: 'The Road Name', t: "Somebody from the old days said my road name in a bar last week. Whole room didn't notice. I noticed. Left before my drink came." }
    ];

    /* BURIED — the dark gang / bodies tier. Mix of specific and ominous.
       Heavy. Gated. Rare. These are the ones he'd never let you see. */
    var BURIED = [
      { tag: '\u26A0 Buried', t: "The first one wasn't an accident and I knew it wasn't, even while I was telling myself it was. He had a name. I made myself forget it. It didn't take." },
      { tag: '\u26A0 Buried', t: "There's a man under the new pour at a rest stop off the old county highway. They expanded the lot in '09. He's part of the foundation now. People park on him." },
      { tag: '\u26A0 Buried', t: "Three of them are in the river bend past the dam, where the current digs deep and gives nothing back. We weighed them right. The water keeps its mouth shut better than men do." },
      { tag: '\u26A0 Buried', t: "Counted once, in a motel, just to know. Stopped at the number I stopped at because past that it stops being a number and starts being a thing you carry." },
      { tag: '\u26A0 Buried', t: "The club had a rule: you don't bury your own where they can be found, and you don't bury a debt where it can be paid. I was good at both. That's not a thing you put on a resume." },
      { tag: '\u26A0 Buried', t: "There's a tree line behind a property nobody owns anymore. Two are there. I could walk to the spot in the dark. I have. I didn't bring a shovel. Just wanted to see if I still could." },
      { tag: '\u26A0 Buried', t: "I keep the road name buried for the same reason I keep them buried — say it out loud and it walks back into the room with you." },
      { tag: '\u26A0 Buried', t: "A guy begged. They mostly don't, in the movies, but they do. I let him finish the sentence. I don't know why. It didn't change anything. It changed me." },
      { tag: '\u26A0 Buried', t: "Mom never knew. That's the only mercy in the whole thing. She died thinking I'd run off to be young and dumb. I let her keep that. Cheapest gift I ever gave anyone." },
      { tag: '\u26A0 Buried', t: "The desert one was supposed to be a warning, not a body. I miscalculated the heat and the distance and the kind of man he was. He's still out there, technically. Under the technically." },
      { tag: '\u26A0 Buried', t: "People think the worst part is doing it. It isn't. The worst part is how normal breakfast tastes the next morning. How the coffee's still good. How you're still you." },
      { tag: '\u26A0 Buried', t: "I don't believe in ghosts. I believe in maps. I have a whole one in my head and I'd burn it if burning it worked." }
    ];

    var LEGENDARY = { tag: '\u2606 ? ? ?', t: "I am in love with Eurielle.", date: "\u2014 this page was stuck to the next one" };

    /* templated combos for variety on the common/uncommon tiers */
    function tplAnnoyed() {
      return { tag: 'Annoyed', t: pick(["Scorch", "Cody", "Max", "Kayla", "Ricky", "Somebody"]) + " " +
        pick(["used my amp", "moved my pick", "retuned my E", "left the door open", "ate the last of the cereal", "parked the van crooked", "touched the setlist", "borrowed my jacket", "hummed off-key for an hour", "used my towel", "rearranged my pedalboard"]) +
        " again. " + pick(["We'll discuss it.", "Noted.", "I'm watching.", "It won't happen twice.", "Said nothing. Wrote this.", "Counting to ten. On string two now.", "There will be a reckoning. Quiet one."]) };
    }
    function tplLyric() {
      return { tag: '\u266A Lyric', t: pick(["low note holds the line", "she walks in on the downbeat", "four strings, one truth", "the bass don't ask for credit", "midnight hums in E", "the quiet ones keep time", "I tune to the sound of leaving"]) +
        "\n" + pick(["nobody claps for the floor", "and the whole room exhales", "the rest is just decoration", "somebody's gotta carry the weight", "she never even noticed", "and so do I", "and call it a melody"]) };
    }
    function tplYou() {
      return { tag: 'About You', t: pick(["She took the window seat", "She remembered how I take my coffee", "She laughed at the dumb joke", "She fell asleep mid-sentence", "She didn't ask about the past", "She left a note on the case", "She stole my jacket again", "She said my name like it wasn't a warning"]) +
        ". " + pick(["Filed that away.", "Didn't say anything. Meant to.", "Wrote it here instead.", "That's a problem for later.", "Coward's confession, this page.", "\u2026Yeah. That one's trouble.", "God help me."]) };
    }
    function tplEmbarrass() {
      return { tag: 'Embarrassing', t: pick(["Rehearsed a wave so it'd look accidental", "Liked a two-year-old post then panicked", "Wore the shirt she once called 'fine'", "Walked past her door twice 'for the cardio'", "Laughed too hard at her joke and snorted", "Started a text, deleted it, retyped it word for word, deleted it", "Saved a voicemail just to hear how she says 'hey'"]) +
        ". " + pick(["Smooth. Real smooth.", "Deadpan exterior. Dumpster interior.", "Nobody saw. I saw.", "This stays in the book.", "Mortifying. Noted. Doing it again tomorrow.", "I am a grown man."]) };
    }

    var recent = [];
    function fresh(t) { return recent.indexOf(t) === -1; }
    function remember(t) { recent.push(t); if (recent.length > 9) recent.shift(); }

    /* ---------- entry generator: deeper LEVEL => better rare odds ---------- */
    function genEntry() {
      var L = level;                         // 1,2,3...
      // LEGENDARY — the white whale; unlocks deeper, climbs slightly with level
      var legChance = clamp(0.010 + L * 0.004, 0.010, 0.060);
      if (L >= 3 && !eurielleThisGame && Math.random() < legChance) {
        eurielleThisGame = true;
        return { tag: LEGENDARY.tag, text: LEGENDARY.t, date: LEGENDARY.date, rarity: 'legendary' };
      }
      // BURIED — dark tier; odds and cap both grow with level
      var burChance = clamp(0.05 + L * 0.02, 0.05, 0.22);
      var burCap = 1 + Math.floor(L / 2);
      if (L >= 2 && buriedThisGame < burCap && Math.random() < burChance) {
        buriedThisGame++;
        var b, g = 0;
        do { b = pick(BURIED); g++; } while (!fresh(b.t) && g < 20);
        remember(b.t);
        return { tag: b.tag, text: b.t, date: pick(DATES), rarity: 'buried' };
      }
      // common/uncommon/rare split shifts toward rare as level climbs
      var rareCut = clamp(0.13 + L * 0.03, 0.13, 0.42);
      var uncCut  = rareCut + clamp(0.30 + L * 0.01, 0.30, 0.42);
      var r = Math.random(), tier, pool, useTpl = false;
      if (r < rareCut) { tier = 'rare'; pool = RARE; }
      else if (r < uncCut) { tier = 'uncommon'; pool = UNCOMMON; useTpl = Math.random() < 0.4; }
      else { tier = 'common'; pool = COMMON; useTpl = Math.random() < 0.5; }

      var e, guard = 0;
      do {
        if (useTpl && tier === 'common')        e = pick([tplAnnoyed, tplLyric])();
        else if (useTpl && tier === 'uncommon') e = pick([tplYou, tplEmbarrass])();
        else                                    e = pick(pool);
        guard++;
      } while (!fresh(e.t) && guard < 18);
      remember(e.t);
      return { tag: e.tag, text: e.t, date: pick(DATES), rarity: tier };
    }

    /* ---------- banter ---------- */
    var LINES = {
      got:   ["Got that one.", "\u2026Noted.", "Still here."],
      over:  ["He closes the book without a word. Worse than yelling.", "'\u2026Find what you were lookin' for?'", "Caught. He won't bring it up. He won't forget it either.", "He just looks at you. That's the whole punishment."],
      spot:  ["He heard the floor. FREEZE.", "He's looking your way. Don't move.", "Did he just\u2014 get down.", "Cover. NOW."],
      away:  ["He's down the aisle.", "He's rummaging in a case.", "He's staring out a window.", "His back's to you. Move.", "He's miles away.", "He's tuning, not looking."],
      turn:  ["\u2026he stops.", "\u2026he's turning.", "\u2026he tilts his head."],
      look:  ["He's scanning the bus. GET DOWN.", "Eyes sweeping. Cover NOW.", "He's looking. Don't be seen."],
      reachDesk: ["Shane's bunk. The journal's right there.", "You made it to the bunk.", "There it is. His journal."]
    };
    function say(t, k) { lineEl.textContent = t; lineEl.className = 'sh-bi-line' + (k ? ' ' + k : ''); }

    /* ===========================================================
       STATE
       =========================================================== */
    var playing = false, rafId = null, lastT = 0, started = false;
    var phase = 'sneak';            // 'sneak' | 'reading'
    var gazeState = 'away', gazeTimer = 0;
    var suspicion = 0, count = 0, best = 0, level = 1;
    var lastEntry = '', currentRarity = 'common';
    var foundEurielleEver = false, eurielleThisGame = false, buriedThisGame = 0, buriedFindsRun = 0, rareFinds = 0;
    var keys = { left: false, right: false, crouch: false };
    var animT = 0, cam = 0;

    /* ===========================================================
       VIEWPORT + TOUR-BUS WORLD
       Canvas is 360x180 (view). World is wider and scrolls (camera).
       Side view: floor near the bottom; gear sits on it; bunks at back.
       =========================================================== */
    var VW = 360, VH = 180;
    var FLOOR_Y = 150;
    var worldW = 900;               // recomputed per level
    var WINDOW = { x: 24, w: 30 };  // entry window (front, left)
    var DESK = { x: 0, w: 44 };     // Shane's bunk w/ journal (back, right) — set per level
    // furniture (cover) + decor (visual only). DECOR is drawn, not collidable.
    var FURN = [];
    var DECOR = [];
    function buildLevel() {
      // bus gets a touch longer & busier each level
      worldW = 880 + (level - 1) * 130;
      DESK.x = worldW - 78; DESK.w = 48;
      WINDOW.x = 22; WINDOW.w = 32;
      // ---- cover gear along the aisle (alternating tall/low) ----
      FURN = [];
      var gearDefs = [
        { rx: 0.15, w: 42, h: 48, tall: true,  kind: 'cab' },        // big speaker cab (cover)
        { rx: 0.27, w: 30, h: 24, tall: false, kind: 'gigcase' },    // road case (crouch cover)
        { rx: 0.46, w: 70, h: 44, tall: true,  kind: 'drums' },      // DRUM KIT (cover, mid-bus)
        { rx: 0.60, w: 26, h: 42, tall: true,  kind: 'guitar' },     // guitar on stand (cover)
        { rx: 0.71, w: 34, h: 22, tall: false, kind: 'kitchen' },    // kitchenette (crouch cover)
        { rx: 0.82, w: 30, h: 24, tall: false, kind: 'gigcase' }     // case near the back (crouch cover)
      ];
      for (var i = 0; i < gearDefs.length; i++) {
        var g = gearDefs[i];
        FURN.push({ x: Math.round(worldW * g.rx), w: g.w, h: g.h, tall: g.tall, kind: g.kind });
      }
      // ---- decor: visual flavor, not collidable ----
      DECOR = [
        { rx: 0.085, kind: 'lilith' },     // Lilith's glowing snake tank (front lounge)
        { rx: 0.155, kind: 'couch' },      // lounge couch (Kayla lounges here)
        { rx: 0.235, kind: 'poster', v: 0 },
        { rx: 0.355, kind: 'lamp' },
        { rx: 0.515, kind: 'poster', v: 1 },
        { rx: 0.66,  kind: 'lamp' },
        { rx: 0.78,  kind: 'poster', v: 2 },
        { rx: 0.90,  kind: 'lamp' }
      ];
      for (var j = 0; j < DECOR.length; j++) DECOR[j].x = Math.round(worldW * DECOR[j].rx);

      // ---- BAND: random subset present this level (scenery only) ----
      buildBand();
    }

    // station x for each member, tied to features in the bus
    function bandStations() {
      var couch = null, drums = null, guitar = null, lilithX = Math.round(worldW * 0.085);
      for (var i = 0; i < DECOR.length; i++) if (DECOR[i].kind === 'couch') couch = DECOR[i].x;
      for (var k = 0; k < FURN.length; k++) { if (FURN[k].kind === 'drums') drums = FURN[k].x + FURN[k].w / 2; if (FURN[k].kind === 'guitar') guitar = FURN[k].x + FURN[k].w / 2; }
      return {
        cody:   { x: (drums || worldW * 0.46) , kind: 'cody' },
        max:    { x: (guitar || worldW * 0.60) - 22, kind: 'max' },
        kayla:  { x: (couch || worldW * 0.155), kind: 'kayla' },
        scorch: { x: worldW * 0.30, home: worldW * 0.30, lilith: lilithX, kind: 'scorch' },
        ricky:  { x: worldW * 0.68, home: worldW * 0.68, kind: 'ricky' }
      };
    }
    var BAND = [];
    function buildBand() {
      var st = bandStations();
      var roster = ['cody', 'max', 'kayla', 'scorch', 'ricky'];
      BAND = [];
      for (var i = 0; i < roster.length; i++) {
        // each member independently ~55% to be present -> random 0..all
        if (Math.random() < 0.55) {
          var m = st[roster[i]];
          m.t0 = Math.random() * 6.28;          // animation phase offset
          m.state = 'idle'; m.timer = rand(2000, 5000); m.feedT = 0; m.dir = -1;
          BAND.push(m);
        }
      }
    }

    // player
    var P = { x: 0, w: 12, hStand: 24, hCrouch: 14, speed: 70, crouching: false, dir: 1, moving: false };
    // patrolling Shane
    var shane = { x: 0, dir: -1, speed: 26, faceDir: -1, walkPhase: 0, pauseT: 0, target: 0 };

    function playerHeight() { return P.crouching ? P.hCrouch : P.hStand; }
    function rangesOverlap(a0, a1, b0, b1) { return a0 < b1 && a1 > b0; }
    function coverAtPlayer() {
      var x0 = P.x - P.w / 2, x1 = P.x + P.w / 2;
      for (var i = 0; i < FURN.length; i++) { var f = FURN[i]; if (rangesOverlap(x0, x1, f.x, f.x + f.w)) return f; }
      return null;
    }
    function playerHidden() {
      var f = coverAtPlayer();
      if (!f) return false;
      return f.tall ? true : P.crouching;
    }
    // sightline: player on the side Shane faces, within his look range, and not behind tall gear between them
    function inSightline() {
      var dx = P.x - shane.x;
      if (shane.faceDir < 0 && dx > 0) return false;
      if (shane.faceDir > 0 && dx < 0) return false;
      if (Math.abs(dx) > 230) return false;
      // tall gear standing between his eye and the player blocks the view
      var lo = Math.min(shane.x, P.x), hi = Math.max(shane.x, P.x);
      for (var i = 0; i < FURN.length; i++) {
        var f = FURN[i]; if (!f.tall) continue;
        var fc = f.x + f.w / 2;
        if (fc > lo + 6 && fc < hi - 6) return false;
      }
      return true;
    }

    /* ---------- difficulty scales with level ---------- */
    function difficulty() {
      var L = level;
      return {
        lookChance: clamp(0.46 + L * 0.04, 0.46, 0.82),
        suspGain:   clamp(58 + L * 6, 58, 100),
        suspLeak:   clamp(20 - L * 1.4, 9, 20),
        awayMin:    clamp(1500 - L * 90, 700, 1500),
        awayMax:    clamp(2500 - L * 130, 1100, 2500),
        lookMin:    clamp(900 + L * 50, 900, 1700),
        lookMax:    clamp(1500 + L * 80, 1500, 2400),
        shaneSpeed: clamp(24 + L * 3, 24, 48)
      };
    }

    function setGaze(state) {
      var d = difficulty();
      gazeState = state;
      gaze.className = 'sh-bi-gaze ' + state;
      gazeTxt.textContent = state === 'away' ? pick(LINES.away) : state === 'turning' ? pick(LINES.turn) : pick(LINES.look);
      if (state === 'away')          gazeTimer = rand(d.awayMin, d.awayMax);
      else if (state === 'turning')  gazeTimer = REDUCE ? 600 : clamp(540 - level * 14, 300, 540);
      else                           gazeTimer = rand(d.lookMin, d.lookMax);
      if (state === 'turning' || state === 'looking') shane.faceDir = (P.x <= shane.x) ? -1 : 1;
    }

    /* ---------- reading phase: unlock, read SAFELY, X to continue ---------- */
    function enterReading() {
      phase = 'reading';
      readPanel.hidden = false;
      loadEntry();
      // fully reveal — reading is safe; no timing
      entryEl.style.filter = 'none'; entryEl.style.opacity = '1';
      say(pick(LINES.reachDesk), 'good');
    }
    function nextLevel() {
      phase = 'sneak';
      readPanel.hidden = true;
      level++; floorEl.textContent = level;
      buildLevel();
      resetPositions();
      say("Next stop. Deeper in. The good stuff's further back.", 'good');
    }
    function loadEntry() {
      var e = genEntry();
      currentRarity = e.rarity || 'common';
      tagEl.textContent = e.tag;
      entryEl.textContent = e.text;
      dateEl.textContent = e.date;
      lastEntry = e.text.replace('\n', ' / ');
      readPanel.classList.remove('rare', 'legend', 'buried');
      if (currentRarity === 'rare') readPanel.classList.add('rare');
      else if (currentRarity === 'buried') readPanel.classList.add('buried');
      else if (currentRarity === 'legendary') readPanel.classList.add('legend');
      count++; countEl.textContent = count;
      if (currentRarity === 'legendary') foundEurielleEver = true;
      else if (currentRarity === 'buried') buriedFindsRun++;
      else if (currentRarity === 'rare') rareFinds++;
    }

    function resetPositions() {
      P.x = WINDOW.x + WINDOW.w / 2 + 6; P.crouching = false; P.dir = 1; P.moving = false;
      shane.x = worldW * 0.55; shane.dir = -1; shane.faceDir = -1; shane.pauseT = 0; shane.target = worldW * 0.3;
      keys.left = keys.right = keys.crouch = false;
      cam = 0;
      setGaze('away');
    }

    /* ---------- patrol: Shane walks the aisle, pausing now and then ---------- */
    function updateShane(dt) {
      var d = difficulty();
      shane.speed = d.shaneSpeed;
      if (shane.pauseT > 0) { shane.pauseT -= dt * 1000; shane.walkPhase = 0; return; }
      // walk toward target
      var dir = shane.target > shane.x ? 1 : -1;
      shane.x += dir * shane.speed * dt;
      shane.dir = dir;
      if (gazeState === 'away') shane.faceDir = dir;   // looks where he walks unless actively scanning
      shane.walkPhase += dt * 8;
      // reached target? pick a new one along the aisle, sometimes pause
      if (Math.abs(shane.x - shane.target) < 4) {
        if (Math.random() < 0.5) shane.pauseT = rand(500, 1400);
        shane.target = rand(worldW * 0.22, worldW * 0.82);
      }
      // keep him in bus bounds
      shane.x = clamp(shane.x, 60, worldW - 90);
    }

    /* ---------- sneak update ---------- */
    function updateSneak(dt) {
      var d = difficulty();
      P.crouching = !!keys.crouch;
      var vx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      P.moving = !!vx;
      if (vx) {
        P.dir = vx > 0 ? 1 : -1;
        var sp = P.speed * (P.crouching ? 0.55 : 1);
        P.x = clamp(P.x + vx * sp * dt, P.w / 2 + 2, worldW - P.w / 2 - 2);
      }

      updateShane(dt);

      // gaze cycle
      gazeTimer -= dt * 1000;
      if (gazeTimer <= 0) {
        if (gazeState === 'away') setGaze('turning');
        else if (gazeState === 'turning') setGaze(Math.random() < d.lookChance ? 'looking' : 'away');
        else setGaze('away');
      }

      var seen = (gazeState === 'looking') && inSightline() && !playerHidden();
      if (seen) {
        suspicion = clamp(suspicion + d.suspGain * dt, 0, 100);
        if (suspicion < 45 && Math.random() < 0.05) say(pick(LINES.spot), 'bad');
        if (suspicion >= 100) { over(); return; }
      } else {
        suspicion = clamp(suspicion - d.suspLeak * dt, 0, 100);
      }
      suspFill.style.width = suspicion + '%';

      // reached the bunk/journal?
      if (rangesOverlap(P.x - P.w / 2, P.x + P.w / 2, DESK.x, DESK.x + DESK.w)) { enterReading(); return; }

      // camera follows player (clamped to world)
      var targetCam = clamp(P.x - VW / 2, 0, worldW - VW);
      cam += (targetCam - cam) * Math.min(1, dt * 8);
    }

    /* ---------- band ambient behavior (scenery only) ---------- */
    function updateBand(dt) {
      for (var i = 0; i < BAND.length; i++) {
        var m = BAND[i];
        if (m.kind === 'scorch') {
          m.timer -= dt * 1000;
          if (m.state === 'idle') {
            m.dir = (m.lilith < m.x) ? -1 : 1;
            if (m.timer <= 0) { m.state = 'toLilith'; }
          } else if (m.state === 'toLilith') {
            m.x += (m.lilith - m.x) * Math.min(1, dt * 1.6);
            m.dir = (m.lilith < m.x) ? -1 : 1;
            if (Math.abs(m.x - m.lilith) < 14) { m.state = 'feeding'; m.feedT = 1500; }
          } else if (m.state === 'feeding') {
            m.feedT -= dt * 1000; m.dir = -1;
            if (m.feedT <= 0) { m.state = 'back'; }
          } else if (m.state === 'back') {
            m.x += (m.home - m.x) * Math.min(1, dt * 1.6);
            m.dir = (m.home < m.x) ? -1 : 1;
            if (Math.abs(m.x - m.home) < 6) { m.state = 'idle'; m.timer = rand(4000, 9000); }
          }
        } else if (m.kind === 'ricky') {
          m.timer -= dt * 1000;
          if (m.timer <= 0) { m.pace = -(m.pace || 1); m.timer = rand(1200, 2600); }
          m.x = clamp(m.x + (m.pace || 1) * 8 * dt, m.home - 18, m.home + 18);
          m.dir = (m.pace || 1) > 0 ? 1 : -1;
        }
        // cody/max/kayla stay put (animated in place)
      }
    }

    /* ===========================================================
       RENDER — warm cozy night, anime tour bus. Curved ceiling,
       real bus windows w/ scrolling night scenery, overhead bunk
       berths, amber lamps, Snake Skins posters, full drum kit,
       guitar stands, Lilith's glowing (animated) snake tank, and
       cel-shaded little characters.
       =========================================================== */
    function rr(x, y, w, h, r, col) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else { ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    function circle(x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); }
    function softGlow(x, y, r, col) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    }

    var CEIL = 30;                      // ceiling height (curved trim below this)

    function draw() {
      ctx.clearRect(0, 0, VW, VH);
      // warm night interior wash
      var g = ctx.createLinearGradient(0, 0, 0, VH);
      g.addColorStop(0, '#241a22'); g.addColorStop(0.4, '#1b2230'); g.addColorStop(1, '#0e1622');
      ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

      ctx.save();
      ctx.translate(-Math.round(cam), 0);

      drawBusShell();
      drawWindows();
      drawBunkBerths();          // overhead sleeping berths along the top
      for (var d = 0; d < DECOR.length; d++) drawDecor(DECOR[d]);
      drawFloor();

      // entry window marker (front)
      drawEntryWindow();

      // sightline glow under sprites
      if (gazeState !== 'away') {
        var ex = shane.x, ey = FLOOR_Y - 34;
        var beam = gazeState === 'looking' ? 'rgba(255,120,90,0.18)' : 'rgba(255,196,120,0.13)';
        var endX = shane.faceDir < 0 ? shane.x - 230 : shane.x + 230;
        ctx.fillStyle = beam;
        ctx.beginPath(); ctx.moveTo(ex, ey - 4); ctx.lineTo(endX, FLOOR_Y - 48); ctx.lineTo(endX, FLOOR_Y); ctx.lineTo(ex, FLOOR_Y); ctx.closePath(); ctx.fill();
      }

      for (var i = 0; i < FURN.length; i++) drawGear(FURN[i]);
      drawBunk();                // Shane's bunk + journal (goal)
      drawBand();                // random bandmates (scenery)
      drawShane();
      drawYou();

      ctx.restore();

      // subtle warm vignette on top (screen space)
      var vg = ctx.createRadialGradient(VW/2, VH/2, VH*0.4, VW/2, VH/2, VH*0.95);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,12,0.45)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
    }

    function drawBusShell() {
      // curved ceiling band
      ctx.fillStyle = '#2a2030'; ctx.fillRect(0, 0, worldW, CEIL);
      ctx.beginPath(); ctx.moveTo(0, CEIL);
      for (var cx = 0; cx <= worldW; cx += 20) ctx.lineTo(cx, CEIL + Math.sin(cx * 0.02) * 0 + 0);
      // warm ceiling highlight strip
      ctx.fillStyle = 'rgba(231,170,90,0.18)'; ctx.fillRect(0, CEIL - 4, worldW, 2);
      // ribbed ceiling supports
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      for (var rx = 24; rx < worldW; rx += 60) { ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, CEIL); ctx.stroke(); }
      // wall paneling below windows (warm wood-ish)
      var wg = ctx.createLinearGradient(0, CEIL, 0, FLOOR_Y);
      wg.addColorStop(0, '#2b2230'); wg.addColorStop(1, '#1d2330');
      ctx.fillStyle = wg; ctx.fillRect(0, CEIL, worldW, FLOOR_Y - CEIL);
    }

    function drawWindows() {
      // big bus side windows with scrolling night scenery
      var top = CEIL + 8, h = 46, gap = 118, w = 84;
      for (var wx = 40; wx < worldW - 60; wx += gap) {
        // frame
        rr(wx - 3, top - 3, w + 6, h + 6, 5, '#15101a');
        // night sky gradient
        var sg = ctx.createLinearGradient(0, top, 0, top + h);
        sg.addColorStop(0, '#1b2c44'); sg.addColorStop(0.6, '#24304a'); sg.addColorStop(1, '#3a2740');
        ctx.save();
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(wx, top, w, h, 3); else ctx.rect(wx, top, w, h); ctx.clip();
        ctx.fillStyle = sg; ctx.fillRect(wx, top, w, h);
        // moon
        circle(wx + w - 16, top + 12, 5, 'rgba(245,235,200,0.9)');
        // distant rolling hills, parallax with camera
        var off = (cam * 0.25 + wx) % (w + 40);
        ctx.fillStyle = 'rgba(40,30,55,0.8)';
        ctx.beginPath(); ctx.moveTo(wx - 20, top + h);
        for (var hx = -20; hx <= w + 20; hx += 8) ctx.lineTo(wx + hx, top + h - 8 - Math.sin((hx + off) * 0.12) * 5);
        ctx.lineTo(wx + w + 20, top + h); ctx.closePath(); ctx.fill();
        // streaking road/utility lights (animated)
        for (var s = 0; s < 4; s++) {
          var lx = wx + ((animT * 70 + s * 34) % (w + 30)) - 12;
          ctx.fillStyle = 'rgba(255,210,140,' + (0.5 - s * 0.08) + ')';
          ctx.fillRect(lx, top + 10 + s * 7, 12, 1.5);
        }
        ctx.restore();
        // glass sheen + mullion
        ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(wx, top, w, 6);
        ctx.strokeStyle = 'rgba(120,150,180,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(wx + 0.5, top + 0.5, w - 1, h - 1);
        ctx.beginPath(); ctx.moveTo(wx + w/2, top); ctx.lineTo(wx + w/2, top + h); ctx.stroke();
        // little curtain tied at the top
        ctx.fillStyle = 'rgba(150,40,60,0.55)'; rr(wx - 2, top - 2, 8, 12, 2, 'rgba(150,40,60,0.55)');
        rr(wx + w - 6, top - 2, 8, 12, 2, 'rgba(150,40,60,0.55)');
      }
    }

    function drawBunkBerths() {
      // overhead sleeping berths along the upper wall (closed curtains, band's bunks)
      var top = CEIL + 2, h = 18;
      var cols = ['rgba(95,176,212,0.5)','rgba(232,94,232,0.5)','rgba(231,200,121,0.5)','rgba(127,176,95,0.5)'];
      var k = 0;
      for (var bx = 60; bx < worldW - 90; bx += 150) {
        // we draw berths only where there isn't a window row conflict — offset them
        rr(bx, top, 120, h, 3, 'rgba(20,16,24,0.0)');
      }
    }

    function drawFloor() {
      var fg = ctx.createLinearGradient(0, FLOOR_Y, 0, VH);
      fg.addColorStop(0, '#241c20'); fg.addColorStop(1, '#140f16');
      ctx.fillStyle = fg; ctx.fillRect(0, FLOOR_Y, worldW, VH - FLOOR_Y);
      // warm aisle runner rug down the middle of the floor
      ctx.fillStyle = 'rgba(150,50,60,0.35)'; ctx.fillRect(0, FLOOR_Y + 6, worldW, 10);
      ctx.fillStyle = 'rgba(231,200,121,0.25)'; ctx.fillRect(0, FLOOR_Y + 6, worldW, 1); ctx.fillRect(0, FLOOR_Y + 15, worldW, 1);
      // floor seam highlight
      ctx.fillStyle = 'rgba(255,200,140,0.18)'; ctx.fillRect(0, FLOOR_Y, worldW, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (var fx = 0; fx < worldW; fx += 26) ctx.fillRect(fx, FLOOR_Y + 18, 1, VH - FLOOR_Y - 18);
    }

    function drawEntryWindow() {
      var wy = FLOOR_Y - 52, x = WINDOW.x, w = WINDOW.w;
      rr(x - 3, wy - 3, w + 6, 58, 5, '#15101a');
      var sg = ctx.createLinearGradient(0, wy, 0, wy + 52);
      sg.addColorStop(0, '#22344c'); sg.addColorStop(1, '#3a2740');
      ctx.fillStyle = sg; ctx.fillRect(x, wy, w, 52);
      // open sash + green "IN" glow
      softGlow(x + w/2, wy + 26, 26, 'rgba(95,227,154,0.25)');
      ctx.strokeStyle = '#5fe39a'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, wy + 0.5, w - 1, 51);
      ctx.fillStyle = 'rgba(95,227,154,0.9)'; ctx.fillRect(x, wy + 14, w, 2);   // pried-open sash line
      ctx.fillStyle = '#5fe39a'; ctx.font = 'bold 8px Oswald, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CLIMB IN', x + w/2, wy - 6);
    }

    /* ---- decor: Lilith tank (animated), posters, lamps ---- */
    function drawDecor(o) {
      var x = o.x;
      if (o.kind === 'lamp') {
        // wall sconce, warm amber pool of light
        var ly = CEIL + 18;
        softGlow(x, ly + 10, 34, 'rgba(255,178,90,0.22)');
        rr(x - 3, ly, 6, 8, 2, '#3a2a1a');
        circle(x, ly + 2, 4, 'rgba(255,206,130,0.95)');
      } else if (o.kind === 'poster') {
        drawPoster(x, o.v || 0);
      } else if (o.kind === 'lilith') {
        drawLilith(x);
      } else if (o.kind === 'couch') {
        drawCouch(x);
      }
    }

    function drawCouch(x) {
      var cw = 56, ch = 18, cy = FLOOR_Y - ch;
      // worn leather tour-bus couch
      rr(x - cw/2, cy, cw, ch, 4, '#3a2630');
      rr(x - cw/2, cy - 8, cw, 11, 5, '#4a3340');      // backrest
      rr(x - cw/2, cy, 7, ch, 3, '#52384a');           // arm L
      rr(x + cw/2 - 7, cy, 7, ch, 3, '#52384a');       // arm R
      // seat cushions seam
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, cy + 2); ctx.lineTo(x, cy + ch - 2); ctx.stroke();
      // a small throw pillow
      rr(x - cw/2 + 9, cy - 4, 12, 9, 3, 'rgba(150,50,70,0.8)');
    }

    function drawPoster(x, v) {
      var py = CEIL + 8, w = 40, h = 54;
      // poster paper
      var bg = v === 0 ? '#1a1020' : v === 1 ? '#201018' : '#101a20';
      rr(x - w/2, py, w, h, 2, bg);
      ctx.strokeStyle = 'rgba(231,200,121,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x - w/2 + 0.5, py + 0.5, w - 1, h - 1);
      // tape corners
      ctx.fillStyle = 'rgba(220,220,210,0.25)';
      ctx.fillRect(x - w/2 - 2, py - 2, 8, 5); ctx.fillRect(x + w/2 - 6, py - 2, 8, 5);
      // snake motif (a coiled S) + band name
      ctx.strokeStyle = v === 2 ? '#5fdcff' : '#e85ee8'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 8, py + 16);
      ctx.bezierCurveTo(x + 10, py + 12, x - 10, py + 26, x + 8, py + 26);
      ctx.bezierCurveTo(x - 8, py + 30, x + 10, py + 38, x - 4, py + 40);
      ctx.stroke();
      circle(x - 8, py + 16, 1.5, v === 2 ? '#5fdcff' : '#e85ee8'); // snake head
      // "SNAKE SKINS" text
      ctx.fillStyle = '#e7c879'; ctx.font = 'bold 6px Oswald, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('THE', x, py + h - 14);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px "Cinzel Decorative", serif';
      ctx.fillText('SNAKE', x, py + h - 7);
      ctx.fillText('SKINS', x, py + h - 1);
    }

    function drawLilith(x) {
      // a glass terrarium on a stand in the front lounge — warm glow, white boa moving inside
      var tw = 46, th = 30, ty = FLOOR_Y - th - 18;   // tank sits on a low stand
      // stand
      rr(x - tw/2 + 4, FLOOR_Y - 18, tw - 8, 18, 2, '#2a2018');
      // warm heat-lamp glow from the tank
      softGlow(x, ty + th/2, 40, 'rgba(255,170,80,0.22)');
      // glass tank
      var tg = ctx.createLinearGradient(0, ty, 0, ty + th);
      tg.addColorStop(0, 'rgba(60,90,80,0.55)'); tg.addColorStop(1, 'rgba(30,50,45,0.65)');
      rr(x - tw/2, ty, tw, th, 3, '#0e1a18');
      ctx.fillStyle = tg; ctx.fillRect(x - tw/2 + 2, ty + 2, tw - 4, th - 4);
      // substrate + a little branch
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(x - tw/2 + 2, ty + th - 8, tw - 4, 6);
      ctx.strokeStyle = '#5a4530'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 14, ty + th - 6); ctx.lineTo(x + 10, ty + 10); ctx.stroke();
      // LILITH — white boa, slow sine-wave body, animated; occasionally lifts head
      var t = animT;
      var headLift = Math.sin(t * 0.6) * 3;
      ctx.lineCap = 'round';
      // body shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 6;
      ctx.beginPath();
      for (var i = 0; i <= 20; i++) {
        var px = x - 16 + i * 1.7;
        var py = ty + th - 7 + Math.sin(i * 0.7 + t * 1.2) * 3;
        if (i === 0) ctx.moveTo(px, py + 1); else ctx.lineTo(px, py + 1);
      }
      ctx.stroke();
      // white body with a soft cream shade
      var grd = ctx.createLinearGradient(x - 16, 0, x + 18, 0);
      grd.addColorStop(0, '#f6f2ea'); grd.addColorStop(1, '#e6ddd0');
      ctx.strokeStyle = grd; ctx.lineWidth = 5;
      ctx.beginPath();
      for (var j = 0; j <= 20; j++) {
        var qx = x - 16 + j * 1.7;
        var qy = ty + th - 8 + Math.sin(j * 0.7 + t * 1.2) * 3;
        if (j === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy);
      }
      ctx.stroke();
      // faint scale flecks
      ctx.fillStyle = 'rgba(210,190,170,0.5)';
      for (var k = 2; k < 19; k += 3) { var sx = x - 16 + k * 1.7, sy = ty + th - 8 + Math.sin(k * 0.7 + t * 1.2) * 3; ctx.fillRect(sx, sy - 1, 1, 1); }
      // head (lifts now and then) + tiny tongue flick
      var hx = x + 18, hy = ty + th - 8 - 4 - Math.max(0, headLift);
      circle(hx, hy, 3, '#f6f2ea');
      circle(hx + 1, hy - 1, 0.7, '#b04a4a');   // ruby eye (white boa)
      if (((t * 2) | 0) % 4 === 0) { ctx.strokeStyle = '#d0405a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx + 2, hy); ctx.lineTo(hx + 5, hy); ctx.stroke(); }
      // glass sheen + frame
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x - tw/2 + 3, ty + 3, tw - 6, 5);
      ctx.strokeStyle = 'rgba(150,200,200,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x - tw/2 + 0.5, ty + 0.5, tw - 1, th - 1);
      // name plate
      ctx.fillStyle = '#e7c879'; ctx.font = 'bold 7px Oswald, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('LILITH', x, FLOOR_Y - 2);
    }

    function drawGear(f) {
      var y = FLOOR_Y - f.h, active = (coverAtPlayer() === f) && playerHidden();
      var edge = active ? '#5fe39a' : 'rgba(255,196,120,0.4)';
      var hl = active ? '#274a3a' : null;
      if (f.kind === 'cab') {
        rr(f.x, y, f.w, f.h, 3, hl || '#241c24');
        ctx.fillStyle = '#120e14'; ctx.fillRect(f.x + 4, y + 5, f.w - 8, f.h - 10);
        ctx.strokeStyle = edge; ctx.lineWidth = 1;
        for (var ax = f.x + 8; ax < f.x + f.w - 5; ax += 6) for (var ay = y + 9; ay < y + f.h - 6; ay += 6) circle(ax, ay, 1.4, 'rgba(255,196,120,0.25)');
        rr(f.x + 5, y + 2, f.w - 10, 4, 1, '#3a2c1c');           // top handle bar
        circle(f.x + f.w - 8, y + 8, 2, '#7fe39a');               // power LED
      } else if (f.kind === 'drums') {
        drawDrumKit(f, active);
      } else if (f.kind === 'guitar') {
        // guitar on an A-stand
        ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(f.x + 4, FLOOR_Y); ctx.lineTo(f.x + f.w/2, y + 6); ctx.lineTo(f.x + f.w - 4, FLOOR_Y); ctx.stroke();
        // body
        var bodyCol = active ? '#274a3a' : '#7a2f3a';
        circle(f.x + f.w/2, y + f.h - 12, 9, bodyCol);
        circle(f.x + f.w/2, y + f.h - 18, 6, bodyCol);
        rr(f.x + f.w/2 - 1.5, y, 3, f.h - 16, 1, '#2a1c14');     // neck
        circle(f.x + f.w/2, y + f.h - 12, 2.5, '#1a1014');       // sound hole
        ctx.strokeStyle = edge; ctx.lineWidth = 1;
      } else if (f.kind === 'kitchen') {
        rr(f.x, y, f.w, f.h, 2, hl || '#2a2230');
        ctx.fillStyle = '#3a4250'; ctx.fillRect(f.x, y, f.w, 4);  // counter top
        ctx.fillStyle = '#120e14'; ctx.fillRect(f.x + 5, y + 8, 9, f.h - 12);  // mini fridge
        circle(f.x + f.w - 9, y + 11, 2, '#7fe39a');             // kettle light
        rr(f.x + f.w - 14, y - 5, 8, 6, 1, '#caa24a');           // a mug on the counter
      } else {                                                    // gigcase (road case)
        rr(f.x, y, f.w, f.h, 2, hl || '#1c1820');
        ctx.strokeStyle = 'rgba(231,200,121,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(f.x + 2.5, y + 2.5, f.w - 5, f.h - 5);
        // corner brackets + latch
        ctx.fillStyle = '#3a2c1c';
        ctx.fillRect(f.x + 1, y + 1, 5, 5); ctx.fillRect(f.x + f.w - 6, y + 1, 5, 5);
        ctx.fillRect(f.x + 1, y + f.h - 6, 5, 5); ctx.fillRect(f.x + f.w - 6, y + f.h - 6, 5, 5);
        ctx.fillStyle = '#caa24a'; ctx.fillRect(f.x + f.w/2 - 3, y + f.h/2 - 2, 6, 4);
        // stencil
        ctx.fillStyle = 'rgba(231,200,121,0.6)'; ctx.font = 'bold 5px Oswald, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('SNAKE SKINS', f.x + f.w/2, y + f.h - 4);
      }
      if (active) { ctx.fillStyle = '#5fe39a'; ctx.font = 'bold 7px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('hidden', f.x + f.w/2, y - 4); }
    }

    function drawDrumKit(f, active) {
      var cx = f.x + f.w/2, baseY = FLOOR_Y;
      var shellCol = active ? '#274a3a' : '#6a1f2a';   // deep red kit
      var rim = active ? '#5fe39a' : '#e7c879';
      // kick drum (front center)
      circle(cx, baseY - 16, 16, shellCol);
      circle(cx, baseY - 16, 16, 'rgba(0,0,0,0)'); ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, baseY - 16, 16, 0, 6.2832); ctx.stroke();
      circle(cx, baseY - 16, 6, 'rgba(255,200,140,0.18)');      // ported head glow
      // snare (left, on a stand)
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 24, baseY); ctx.lineTo(cx - 20, baseY - 16); ctx.stroke();
      rr(cx - 28, baseY - 22, 16, 8, 3, '#d8d2c0'); ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.strokeRect(cx - 28.5, baseY - 22.5, 16, 8);
      // two rack toms on top of the kick
      rr(cx - 10, baseY - 40, 12, 9, 3, shellCol); ctx.strokeStyle = rim; ctx.strokeRect(cx - 10.5, baseY - 40.5, 12, 9);
      rr(cx + 3, baseY - 40, 12, 9, 3, shellCol); ctx.strokeStyle = rim; ctx.strokeRect(cx + 2.5, baseY - 40.5, 12, 9);
      // cymbals on stands (right + left), with a soft shimmer
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + 22, baseY); ctx.lineTo(cx + 22, baseY - 34); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 22, baseY - 8); ctx.lineTo(cx - 22, baseY - 30); ctx.stroke();
      ctx.fillStyle = 'rgba(231,200,121,0.9)';
      ctx.save(); ctx.translate(cx + 22, baseY - 35); ctx.scale(1, 0.32); circle(0, 0, 9, '#e7c879'); ctx.restore();
      ctx.save(); ctx.translate(cx - 22, baseY - 31); ctx.scale(1, 0.32); circle(0, 0, 7, '#caa24a'); ctx.restore();
      // a tiny snake-skins logo on the kick head
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = 'bold 5px Oswald, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('SS', cx, baseY - 14);
      if (active) { ctx.fillStyle = '#5fe39a'; ctx.font = 'bold 7px Oswald, sans-serif'; ctx.fillText('hidden', cx, baseY - 50); }
    }

    function drawBunk() {
      var x = DESK.x, w = DESK.w, h = 74, y = FLOOR_Y - h;
      // alcove with warm interior light
      softGlow(x + w/2, y + h/2, 46, 'rgba(255,180,90,0.18)');
      rr(x - 5, y, w + 10, h, 5, '#241a22');
      var ig = ctx.createLinearGradient(0, y, 0, y + h);
      ig.addColorStop(0, '#2a2030'); ig.addColorStop(1, '#15101a');
      ctx.fillStyle = ig; ctx.fillRect(x, y + 4, w, h - 8);
      // curtain rail + half-open curtain
      ctx.fillStyle = '#3a2030'; ctx.fillRect(x, y + 2, w, 3);
      ctx.fillStyle = 'rgba(120,30,45,0.7)'; rr(x, y + 5, 12, h - 10, 2, 'rgba(120,30,45,0.7)');
      // pillow + folded blanket
      rr(x + 5, y + h - 24, w - 10, 20, 4, '#34404f');
      rr(x + 6, y + 9, 18, 11, 3, '#52607a');
      // a string of warm fairy lights
      ctx.fillStyle = 'rgba(255,200,120,0.9)';
      for (var fl = x + 6; fl < x + w - 4; fl += 8) circle(fl, y + 6, 1.2, 'rgba(255,200,120,0.9)');
      // the journal — glowing book
      var bx = x + w/2 - 9, by = y + 20;
      softGlow(bx + 8, by + 5, 16, 'rgba(231,200,121,0.35)');
      rr(bx, by, 18, 12, 2, '#efe9da');
      ctx.fillStyle = '#b44a4a'; ctx.fillRect(bx + 8, by, 2, 12);
      ctx.strokeStyle = '#8a6d1f'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, 17, 11);
      if (((animT * 2) | 0) % 2 === 0) { ctx.fillStyle = '#fff2c0'; ctx.fillRect(bx + 4, by - 4, 2, 2); ctx.fillRect(bx + 13, by - 2, 1, 1); }
      ctx.fillStyle = 'rgba(231,200,121,0.95)'; ctx.font = 'bold 7px Oswald, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText("SHANE'S BUNK", x + w/2, y - 5);
    }

    /* ---- cel-shaded little people ---- */
    function limb(x, y, w, h, r, col, shade) { rr(x, y, w, h, r, col); ctx.globalAlpha = 0.25; rr(x, y, w * 0.45, h, r, shade); ctx.globalAlpha = 1; }

    function drawShane() {
      var x = shane.x, baseY = FLOOR_Y;
      var walk = (shane.pauseT <= 0) ? Math.sin(shane.walkPhase) : 0;
      var d = shane.faceDir;
      // soft contact shadow
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, baseY + 1, 10, 3, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
      // legs
      limb(x - 5, baseY - 15, 4, 15 + walk * 1.5, 2, '#23232c', '#000');
      limb(x + 1, baseY - 15, 4, 15 - walk * 1.5, 2, '#23232c', '#000');
      // torso (dark band tee) + cel shade
      rr(x - 7, baseY - 31, 14, 19, 4, '#3c3c46');
      ctx.globalAlpha = 0.25; rr(x - 7, baseY - 31, 6, 19, 4, '#000'); ctx.globalAlpha = 1;
      rr(x - 7, baseY - 31, 14, 3, 3, '#50505c');
      // a faint snake logo on his shirt
      ctx.strokeStyle = 'rgba(231,200,121,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, baseY - 26); ctx.quadraticCurveTo(x + 3, baseY - 23, x - 2, baseY - 20); ctx.stroke();
      // arm
      limb(x + (d > 0 ? 4 : -7), baseY - 29, 3, 13, 2, '#d8b48c', '#000');
      // head + warm rim light
      circle(x, baseY - 37, 7, '#e7c6a2');
      ctx.globalAlpha = 0.3; circle(x - 2, baseY - 38, 5, '#fff'); ctx.globalAlpha = 1;
      // brown hair + ponytail
      ctx.fillStyle = '#5a3a22';
      ctx.beginPath(); ctx.arc(x, baseY - 39, 8, Math.PI, 0); ctx.fill();
      rr(x - 8, baseY - 41, 16, 5, 2, '#5a3a22');
      var pdx = d > 0 ? -1 : 1;
      rr(x + pdx * 7, baseY - 39, 5, 15, 3, '#4a2f1b');
      circle(x + pdx * 9, baseY - 24, 2.6, '#4a2f1b');
      // tie band on the ponytail
      ctx.fillStyle = '#2a1c14'; ctx.fillRect(x + pdx * 6, baseY - 38, 3, 2);
      // face
      ctx.fillStyle = '#0e0e12';
      var ex = d < 0 ? x - 3 : x + 1;
      if (gazeState === 'away') ctx.fillRect(x - 2, baseY - 35, 4, 1);
      else ctx.fillRect(ex, baseY - 37, 2, 2);
      // bass slung on back
      ctx.save(); ctx.translate(x, baseY - 23); ctx.rotate(d > 0 ? 0.5 : -0.5);
      rr(-2, -11, 4, 22, 2, '#caa24a'); rr(-4, 9, 9, 7, 3, '#b8902f'); ctx.restore();
      if (gazeState === 'looking') { ctx.fillStyle = '#ff6a52'; ctx.font = 'bold 10px Oswald'; ctx.textAlign='center'; ctx.fillText('!', x, baseY - 50); }
    }

    function drawYou() {
      var x = P.x, crouch = P.crouching, hidden = playerHidden(), d = P.dir, baseY = FLOOR_Y;
      var bob = (P.moving && !crouch) ? Math.sin(animT) * 1.2 : 0;
      var skin = '#f3d4b4';
      var shirt = heroType === 'girl' ? '#e85ee8' : '#5fb0d4';
      var shirtHi = heroType === 'girl' ? '#f6b0f6' : '#a8d4ec';
      var hair = heroType === 'girl' ? '#5a3320' : '#2a2a30';
      var pants = '#26384c';
      var walk = P.moving ? Math.sin(animT) * 2 : 0;
      // contact shadow
      ctx.globalAlpha = hidden ? 0.18 : 0.3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, baseY + 1, 8, 2.5, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalAlpha = hidden ? 0.55 : 1;
      var legH = crouch ? 6 : 9;
      limb(x - 4, baseY - legH, 3, legH + (P.moving ? walk : 0), 2, pants, '#000');
      limb(x + 1, baseY - legH, 3, legH - (P.moving ? walk : 0), 2, pants, '#000');
      var torsoTop = baseY - legH - (crouch ? 8 : 12);
      rr(x - 5, torsoTop, 10, (crouch ? 8 : 12), 3, shirt);
      ctx.globalAlpha = (hidden ? 0.55 : 1) * 0.3; rr(x - 5, torsoTop, 4, (crouch ? 8 : 12), 3, '#000'); ctx.globalAlpha = hidden ? 0.55 : 1;
      rr(x - 5, torsoTop, 10, 3, 2, shirtHi);
      limb(x + (d > 0 ? 3 : -6), torsoTop + 1, 3, crouch ? 6 : 9, 2, skin, '#000');
      var hy = torsoTop - 7 + bob;
      circle(x, hy, 6, skin);
      ctx.globalAlpha = (hidden ? 0.55 : 1) * 0.3; circle(x - 2, hy - 1, 4, '#fff'); ctx.globalAlpha = hidden ? 0.55 : 1;
      ctx.fillStyle = hair;
      ctx.beginPath(); ctx.arc(x, hy - 1, 7, Math.PI, 0); ctx.fill();
      if (heroType === 'girl') { var hd = d > 0 ? -1 : 1; rr(x + hd * 5, hy - 2, 4, 15, 2, hair); rr(x - 7, hy - 3, 14, 4, 2, hair); }
      else { rr(x - 6, hy - 4, 12, 4, 2, hair); }
      // big anime eyes
      ctx.fillStyle = '#1a1a22';
      ctx.fillRect(x + (d > 0 ? 1 : -3), hy, 2, 2);
      ctx.fillRect(x + (d > 0 ? -3 : 1), hy, 1, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x + (d > 0 ? 1 : -3), hy, 1, 1);
      ctx.globalAlpha = 1;
      if (hidden) { ctx.fillStyle = '#5fe39a'; ctx.font = 'bold 7px Oswald'; ctx.textAlign='center'; ctx.fillText('hid', x, hy - 9); }
    }

    /* ===========================================================
       BANDMATES — recognizable little anime characters (scenery)
       =========================================================== */
    function npcBase(x, baseY, opts) {
      // shared body: legs, torso, head w/ eyes & hair. opts has colors + flags.
      ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.ellipse(x, baseY + 1, 9, 2.6, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1;
      var d = opts.dir || 1;
      // legs
      if (opts.prosthetic) {
        // left normal, right prosthetic (metal pylon + foot)
        rr(x - 5, baseY - 14, 4, 14, 2, opts.pants);
        ctx.strokeStyle = '#9aa6b2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 3, baseY - 14); ctx.lineTo(x + 3, baseY - 2); ctx.stroke();
        circle(x + 3, baseY - 14, 2, '#7a8694');           // knee joint
        rr(x + 1, baseY - 3, 6, 3, 1, '#6a7682');          // foot
      } else {
        var sw = opts.walk ? Math.sin(animT * 1.6 + (opts.t0||0)) * 1.5 : 0;
        rr(x - 5, baseY - 14, 4, 14 + sw, 2, opts.pants);
        rr(x + 1, baseY - 14, 4, 14 - sw, 2, opts.pants);
      }
      // torso (shirt) + cel shade
      rr(x - 7, baseY - 30, 14, 18, 4, opts.shirt);
      ctx.globalAlpha = 0.22; rr(x - 7, baseY - 30, 6, 18, 4, '#000'); ctx.globalAlpha = 1;
      rr(x - 7, baseY - 30, 14, 3, 3, opts.shirtHi || opts.shirt);
      if (opts.shirtText) { ctx.fillStyle = opts.shirtTextCol || '#fff'; ctx.font = 'bold 6px Oswald, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(opts.shirtText, x, baseY - 19); }
      // head
      circle(x, baseY - 37, 7, opts.skin);
      ctx.globalAlpha = 0.28; circle(x - 2, baseY - 38, 5, '#fff'); ctx.globalAlpha = 1;
      // hair styles
      ctx.fillStyle = opts.hair;
      if (opts.hairStyle === 'spiky') {
        ctx.beginPath();
        for (var sx = -8; sx <= 8; sx += 3.2) { ctx.moveTo(x + sx, baseY - 40); ctx.lineTo(x + sx + 1.6, baseY - 48); ctx.lineTo(x + sx + 3.2, baseY - 40); }
        ctx.fill();
        ctx.beginPath(); ctx.arc(x, baseY - 39, 8, Math.PI, 0); ctx.fill();
      } else if (opts.hairStyle === 'long') {
        ctx.beginPath(); ctx.arc(x, baseY - 39, 8, Math.PI, 0); ctx.fill();
        rr(x - 8, baseY - 41, 16, 6, 3, opts.hair);
        rr(x - 9, baseY - 40, 5, 22, 3, opts.hair);        // long left
        rr(x + 4, baseY - 40, 5, 22, 3, opts.hair);        // long right
      } else if (opts.hairStyle === 'shoulder') {
        ctx.beginPath(); ctx.arc(x, baseY - 39, 8, Math.PI, 0); ctx.fill();
        rr(x - 9, baseY - 40, 4, 14, 2, opts.hair);
        rr(x + 5, baseY - 40, 4, 14, 2, opts.hair);
      } else if (opts.hairStyle === 'bald') {
        ctx.beginPath(); ctx.arc(x, baseY - 40, 7, Math.PI, 0); ctx.fill();   // thin top
      } else { // short
        ctx.beginPath(); ctx.arc(x, baseY - 39, 8, Math.PI, 0); ctx.fill();
        rr(x - 8, baseY - 41, 16, 5, 2, opts.hair);
      }
      // colored eyes
      var ex = d < 0 ? x - 3 : x + 1;
      circle(ex + 0.5, baseY - 37, 1.6, opts.eye);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(ex, baseY - 38, 1, 1);
    }

    function drawBand() {
      for (var i = 0; i < BAND.length; i++) {
        var m = BAND[i], x = m.x, baseY = FLOOR_Y;
        if (m.kind === 'cody') {
          // seated at the drums, arms drumming — black hair, gold eyes, BET shirt, prosthetic leg
          var hit = Math.sin(animT * 3 + m.t0) ;
          npcBase(x, baseY, { dir: -1, pants: '#23232c', shirt: '#1c1c22', shirtHi:'#2a2a32', skin:'#e8c6a2', hair:'#15151a', hairStyle:'short', eye:'#e7c24a', shirtText:'BET', shirtTextCol:'#e7c24a', prosthetic:true });
          // drumsticks tapping
          ctx.strokeStyle = '#caa24a'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x - 5, baseY - 24); ctx.lineTo(x - 12, baseY - 20 + hit * 3); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x + 5, baseY - 24); ctx.lineTo(x + 12, baseY - 20 - hit * 3); ctx.stroke();
          nameTag(x, baseY - 50, 'CODY');
        } else if (m.kind === 'max') {
          // playing guitar next to Cody — white shirt, shoulder blonde, blue eyes
          npcBase(x, baseY, { dir: 1, walk:false, pants:'#2a3344', shirt:'#eef0f4', shirtHi:'#ffffff', skin:'#f0d2b0', hair:'#d9b96a', hairStyle:'shoulder', eye:'#3a7ad0', t0:m.t0 });
          // slung guitar he's strumming
          ctx.save(); ctx.translate(x + 4, baseY - 20); ctx.rotate(-0.25);
          rr(-2, -2, 18, 4, 2, '#7a2f3a'); circle(15, 0, 6, '#7a2f3a'); circle(15, 0, 2, '#2a1014');
          var strum = Math.sin(animT * 4 + m.t0) * 2;
          ctx.strokeStyle='#e8c6a2'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(13, -6); ctx.lineTo(13, 4 + strum); ctx.stroke();
          ctx.restore();
          nameTag(x, baseY - 50, 'MAX');
        } else if (m.kind === 'kayla') {
          // lounging on the couch, on her phone — long black hair, blue eyes, goth
          var cy = baseY - 16;
          ctx.globalAlpha = 0.28; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x, baseY, 18, 3, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha=1;
          // reclined body
          rr(x - 16, cy - 2, 30, 8, 4, '#1a1620');           // torso (black dress)
          rr(x - 20, cy + 2, 12, 6, 3, '#23232c');           // legs over the arm
          rr(x + 10, cy - 6, 9, 9, 4, '#e8c6a2');            // head resting up
          ctx.fillStyle = '#0e0e14'; ctx.beginPath(); ctx.arc(x + 14, cy - 6, 7, Math.PI*1.1, 0.2); ctx.fill();  // long black hair
          rr(x + 17, cy - 6, 4, 14, 2, '#0e0e14');
          circle(x + 16, cy - 6, 1.4, '#3a7ad0');            // blue eye
          // glowing phone
          softGlow(x + 4, cy - 8, 8, 'rgba(150,200,255,0.4)');
          rr(x + 2, cy - 10, 5, 7, 1, '#101820'); rr(x + 2.6, cy - 9.4, 3.8, 5.6, 1, 'rgba(150,200,255,0.8)');
          // fishnet/boots accent
          ctx.strokeStyle='rgba(180,40,80,0.5)'; ctx.lineWidth=1; ctx.strokeRect(x-16, cy-2, 30, 8);
          nameTag(x, baseY - 34, 'KAYLA');
        } else if (m.kind === 'scorch') {
          // spiky black hair, red shirt + red eyes; walks to Lilith to feed a rat
          var feeding = m.state === 'feeding';
          npcBase(x, baseY, { dir: m.dir, walk: (m.state==='toLilith'||m.state==='back'), pants:'#241a1a', shirt:'#a8222a', shirtHi:'#c83a3a', skin:'#e8c6a2', hair:'#101015', hairStyle:'spiky', eye:'#ff3a3a', t0:m.t0 });
          // holds a little rat by the tail (until fed)
          if (m.state === 'toLilith' || m.state === 'idle') {
            var rx = x + (m.dir<0?-9:9), ry = baseY - 18;
            ctx.fillStyle = '#8a8f98'; rr(rx-3, ry, 6, 4, 2, '#8a8f98'); circle(rx + (m.dir<0?-3:3), ry+2, 2, '#8a8f98');
            ctx.strokeStyle='#8a8f98'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(rx+(m.dir<0?3:-3), ry+2); ctx.lineTo(rx+(m.dir<0?7:-7), ry); ctx.stroke();
          }
          if (feeding) { ctx.fillStyle='rgba(255,200,120,0.9)'; ctx.font='bold 7px Oswald'; ctx.textAlign='center'; ctx.fillText('\u2022 here you go \u2022', x, baseY - 50); }
          nameTag(x, baseY - 50, 'SCORCH');
        } else if (m.kind === 'ricky') {
          // slightly heavy manager, smoking, yelling on phone
          npcBase(x, baseY, { dir: m.dir, walk:true, pants:'#2a2a30', shirt:'#3a4250', shirtHi:'#4a5260', skin:'#e6c2a0', hair:'#5a4a3a', hairStyle:'bald', eye:'#3a2a1a', t0:m.t0, belly:true });
          // round belly overlay
          circle(x, baseY - 18, 7, '#3a4250');
          // phone to ear + shouting marks
          rr(x + (m.dir<0?-9:7), baseY - 34, 3, 6, 1, '#101820');
          ctx.fillStyle = 'rgba(255,120,90,0.9)'; ctx.font='bold 8px Oswald'; ctx.textAlign='center';
          if (((animT)|0)%2===0) ctx.fillText('!?', x + (m.dir<0?-14:14), baseY - 40);
          // cigarette + smoke
          var cx2 = x + (m.dir<0? -8: 8);
          ctx.strokeStyle='#e8e8e0'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx2, baseY-33); ctx.lineTo(cx2+(m.dir<0?-3:3), baseY-33); ctx.stroke();
          circle(cx2+(m.dir<0?-3:3), baseY-33, 0.8, '#ff7a3a');
          ctx.globalAlpha=0.4; for (var s=0;s<3;s++){ circle(cx2+(m.dir<0?-4:4), baseY-36-s*4 - (animT*4%6), 1+s*0.5, 'rgba(200,200,200,0.5)'); } ctx.globalAlpha=1;
          nameTag(x, baseY - 50, 'RICKY');
        }
      }
    }
    function nameTag(x, y, label) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.font = 'bold 7px Oswald, sans-serif'; ctx.textAlign = 'center';
      var w = ctx.measureText(label).width + 6;
      rr(x - w/2, y - 8, w, 10, 3, 'rgba(10,8,14,0.5)');
      ctx.fillStyle = 'rgba(231,200,121,0.95)'; ctx.fillText(label, x, y);
    }


    /* ===========================================================
       LOOP
       =========================================================== */
    function frame(t) {
      if (!playing) return;
      var dt = (t - lastT) / 1000; lastT = t;
      if (dt > 0.05) dt = 0.05;
      animT += dt * 2.2;              // steady clock for ambient animation (Lilith, band, sparkles)
      updateBand(dt);
      if (phase === 'sneak') updateSneak(dt);
      // reading phase: safe, nothing to update (camera holds)
      try { draw(); } catch (e) {}
      rafId = window.requestAnimationFrame(frame);
    }
    function startLoop() { lastT = (window.performance && performance.now) ? performance.now() : Date.now(); rafId = window.requestAnimationFrame(frame); }
    function pauseLoop() { if (rafId) { window.cancelAnimationFrame(rafId); rafId = null; } }

    function start() {
      playing = true; started = true; phase = 'sneak';
      suspicion = 0; count = 0; level = 1;
      buriedThisGame = 0; buriedFindsRun = 0; rareFinds = 0; eurielleThisGame = false;
      countEl.textContent = '0'; floorEl.textContent = '1'; suspFill.style.width = '0%';
      readPanel.hidden = true;
      overlay.classList.add('hidden');
      buildLevel(); resetPositions();
      say(pick(["Window's open. Climb in quiet.", "You're on the bus. Don't blow it.", "Front window. In you go."]));
      try { draw(); } catch (e) {}
      startLoop();
    }
    function over() {
      playing = false; pauseLoop();
      if (count > best) best = count;
      callout.textContent = 'Caught.';
      subEl.innerHTML = '<span class="sh-bi-final">Pages read <b>' + count + '</b>' +
        '<span class="best">Best run: ' + best + '  \u00B7  level reached: ' + level +
          (rareFinds ? '  \u00B7  rare: ' + rareFinds : '') +
          (buriedFindsRun ? '  \u00B7  buried: ' + buriedFindsRun : '') + '</span>' +
        (foundEurielleEver ? '<span class="last gold">\u2606 You found the one he\u2019ll never say out loud.</span>' : '') +
        (buriedFindsRun ? '<span class="last blood">\u26A0 You read what he buried. He doesn\u2019t know. Yet.</span>' : '') +
        (lastEntry ? '<span class="last">last thing you saw: \u201C' + lastEntry + '\u201D</span>' : '') + '</span>';
      startBtn.textContent = 'Break In Again';
      readPanel.hidden = true;
      overlay.classList.remove('hidden');
      say(pick(LINES.over), 'bad');
      try { draw(); } catch (e) {}
    }

    /* ===========================================================
       CONTROLS
       =========================================================== */
    var KEYMAP = { ArrowLeft:'left', ArrowRight:'right', ArrowDown:'crouch', a:'left', d:'right', s:'crouch', A:'left', D:'right', S:'crouch' };
    document.addEventListener('keydown', function (e) {
      if (!playing) return;
      if (phase === 'reading') { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeReading(); } return; }
      var k = KEYMAP[e.key];
      if (k) { e.preventDefault(); keys[k] = true; }
    });
    document.addEventListener('keyup', function (e) {
      var k = KEYMAP[e.key];
      if (k) keys[k] = false;
    });

    function holdBtn(el, dir) {
      if (!el) return;
      var on = function (e) { if (e && e.cancelable) e.preventDefault(); el.classList.add('held'); keys[dir] = true; };
      var off = function () { el.classList.remove('held'); keys[dir] = false; };
      el.addEventListener('pointerdown', on);
      ['pointerup','pointercancel','pointerleave'].forEach(function (ev) { el.addEventListener(ev, off); });
    }
    holdBtn(btnLeft, 'left'); holdBtn(btnRight, 'right'); holdBtn(btnCrouch, 'crouch');

    function closeReading(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (phase !== 'reading') return;
      nextLevel();
    }
    function bindClose(el) {
      if (!el) return;
      el.addEventListener('click', closeReading);
      el.addEventListener('pointerup', closeReading);
    }
    bindClose(readClose);
    bindClose(readCont);

    // character select
    if (charSel) {
      charSel.querySelectorAll('[data-hero]').forEach(function (b) {
        b.addEventListener('click', function () {
          heroType = b.getAttribute('data-hero');
          charSel.querySelectorAll('[data-hero]').forEach(function (o) { o.classList.remove('sel'); });
          b.classList.add('sel');
        });
      });
    }

    startBtn.addEventListener('click', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { keys.left = keys.right = keys.crouch = false; pauseLoop(); }
      else if (playing && !rafId) startLoop();
    });

    // first paint (room behind the intro overlay)
    buildLevel(); resetPositions(); try { draw(); } catch (e) {}
  }

  function boot() {
    build();
    var r0 = document.getElementById('shBreakin');
    if (!r0 || !r0._init) {
      var tries = 0;
      var iv = setInterval(function () {
        build();
        var r = document.getElementById('shBreakin');
        if ((r && r._init) || ++tries > 20) clearInterval(iv);
      }, 150);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', boot);
})();
