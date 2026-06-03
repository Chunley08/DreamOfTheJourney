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
   SHANE — DON'T WAKE HIM  (rummage through his bunk)
   ------------------------------------------------------------
   Shane is asleep in his tour-bus bunk (Zzz). You rummage hiding
   spots to find pages of his journal. HOLD a spot to rummage it —
   a dial fills, but the noise raises his STIR meter. Let go the
   instant he stirs; if the meter maxes, he wakes and you're caught.
   Fill a spot's dial to reveal an entry (page-turn animation;
   rare/buried/legendary get a sticker reveal). Some spots are
   empty decoys. Find the level's quota of pages to move on. Each
   level he stirs faster & wakes easier, more decoys appear, and
   rarer pages get likelier. Clean flat-vector, cozy night.
   Only initialises if #shBunk exists.
   ============================================================ */
(function initShaneRummage() {
  function build() {
    var root = document.getElementById('shBunk');
    if (!root || root._init) return;
    root._init = true;

    var canvas   = document.getElementById('shCanvas');
    var stirFill = document.getElementById('shStirFill');
    var zzzEl    = document.getElementById('shZzz');
    var quotaEl  = document.getElementById('shQuota');
    var levelEl  = document.getElementById('shLevel');
    var readPanel= document.getElementById('shReadPanel');
    var tagEl    = document.getElementById('shTag');
    var entryEl  = document.getElementById('shEntry');
    var dateEl   = document.getElementById('shDate');
    var stickerEl= document.getElementById('shSticker');
    var readClose= document.getElementById('shReadClose');
    var readCont = document.getElementById('shReadContinue');
    var overlay  = document.getElementById('shOverlay');
    var callout  = document.getElementById('shCallout');
    var subEl    = document.getElementById('shGameSub');
    var startBtn = document.getElementById('shStart');
    var lineEl   = document.getElementById('shLine');
    if (!canvas || !startBtn) return;
    var ctx = canvas.getContext('2d');

    var REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function pick(a) { return a[(Math.random() * a.length) | 0]; }
    function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

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

    /* ---------- entry generator: deeper level => better rare odds ---------- */
    function genEntry() {
      var L = level;
      var legChance = clamp(0.010 + L * 0.004, 0.010, 0.060);
      if (L >= 3 && !eurielleThisGame && Math.random() < legChance) {
        eurielleThisGame = true;
        return { tag: LEGENDARY.tag, text: LEGENDARY.t, date: LEGENDARY.date, rarity: 'legendary' };
      }
      var burChance = clamp(0.05 + L * 0.02, 0.05, 0.22);
      var burCap = 1 + Math.floor(L / 2);
      if (L >= 2 && buriedThisGame < burCap && Math.random() < burChance) {
        buriedThisGame++;
        var b, g = 0;
        do { b = pick(BURIED); g++; } while (!fresh(b.t) && g < 20);
        remember(b.t);
        return { tag: b.tag, text: b.t, date: pick(DATES), rarity: 'buried' };
      }
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

    var LINES = {
      stir:  ["He stirs\u2014 let go!", "Mmf\u2026 he's moving. Stop.", "He shifts. Freeze.", "\u2026he rolls over. Hold still."],
      found: ["Got a page.", "\u2026Found one.", "Tucked away in there.", "There's one."],
      empty: ["Nothing in there.", "Just socks. Gross.", "Empty.", "Picks and dust.", "A guitar string. Not it."],
      wake:  ["His eyes open. Caught.", "'\u2026The hell are you doin'?'", "He's awake. You're done.", "Busted. He sits up slow."],
      win:   ["You slip out with what you found.", "Pages pocketed. Gone before he turns.", "Out clean."],
      idle:  ["He's out cold. Pick a spot.", "Zzz\u2026 go carefully.", "Quiet. Rummage when you dare."]
    };
    function say(t, k) { lineEl.textContent = t; lineEl.className = 'sh-rg-line' + (k ? ' ' + k : ''); }

    /* ===========================================================
       STATE
       =========================================================== */
    var playing = false, rafId = null, lastT = 0;
    var phase = 'rummage';          // 'rummage' | 'reading'
    var level = 1, found = 0, quota = 3, totalFound = 0, best = 0;
    var stir = 0;                   // 0..100 — he wakes at 100
    var lastEntry = '', currentRarity = 'common';
    var foundEurielleEver = false, eurielleThisGame = false, buriedThisGame = 0, buriedFindsRun = 0, rareFinds = 0;
    var animT = 0, sleepPhase = 0, pageAnim = 0;
    // the spot currently being held/rummaged
    var holding = null, holdProgress = 0, activePointer = null;
    // breathing/stir scheduling
    var stirTimer = 0, stirring = false;

    var VW = 360, VH = 230;
    // hiding spots: each {x,y,r,label, looted:false, decoy:bool}
    var SPOTS = [];
    function difficulty() {
      var L = level;
      return {
        quota:      Math.min(3 + Math.floor((L - 1) * 0.7), 7),   // pages needed
        fillRate:   clamp(70 - L * 3, 42, 70),                    // dial fill / sec (≈1.4s at L1)
        stirRate:   clamp(20 + L * 3, 20, 52),                    // stir gain / sec while rummaging
        stirLeak:   clamp(38 - L * 1.5, 20, 38),                  // stir recovery / sec when idle
        stirEvery:  clamp(3400 - L * 150, 1600, 3400),            // gap between stirs (longer = calmer)
        decoys:     Math.min(1 + Math.floor(L / 2), 4)            // empty spots
      };
    }

    // candidate spot positions around the bunk (flat-vector room)
    var SPOT_DEFS = [
      { x: 70,  y: 150, r: 24, label: 'pillow' },
      { x: 150, y: 168, r: 24, label: 'blanket' },
      { x: 250, y: 120, r: 22, label: 'shelf' },
      { x: 305, y: 150, r: 22, label: 'amp' },
      { x: 38,  y: 196, r: 20, label: 'boots' },
      { x: 200, y: 196, r: 20, label: 'crate' },
      { x: 320, y: 200, r: 20, label: 'bag' },
      { x: 120, y: 110, r: 20, label: 'jacket' }
    ];

    function setupLevel() {
      var d = difficulty();
      quota = d.quota; found = 0;
      quotaEl.textContent = '0 / ' + quota;
      levelEl.textContent = level;
      stir = 0; stirFill.style.width = '0%';
      holding = null; holdProgress = 0;
      // choose spots: quota real + d.decoys decoys, from the defs
      var pool = SPOT_DEFS.slice();
      // shuffle
      for (var i = pool.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
      var realCount = Math.min(quota + 1, pool.length);     // a couple extra real spots so it's not forced
      var nReal = Math.min(pool.length, quota + 2);
      var nDecoy = Math.min(d.decoys, pool.length - nReal);
      SPOTS = [];
      for (var k = 0; k < pool.length; k++) {
        var s = pool[k];
        SPOTS.push({ x: s.x, y: s.y, r: s.r, label: s.label, looted: false, decoy: (k >= nReal && k < nReal + nDecoy) });
      }
      scheduleStir();
    }

    function scheduleStir() { stirTimer = rand(difficulty().stirEvery * 0.6, difficulty().stirEvery * 1.4); stirring = false; }

    /* ===========================================================
       UPDATE
       =========================================================== */
    function update(dt) {
      var d = difficulty();
      sleepPhase += dt * 1.4;
      // Shane's random stirring (independent of player) — a wave of risk
      stirTimer -= dt * 1000;
      if (stirTimer <= 0) { stirring = !stirring; stirTimer = stirring ? rand(700, 1500) : rand(d.stirEvery * 0.6, d.stirEvery * 1.4); }

      if (phase === 'rummage') {
        var rummaging = !!holding && !holding.looted;
        if (rummaging) {
          holdProgress += d.fillRate * dt;
          stir = clamp(stir + d.stirRate * dt, 0, 100);
          if (holdProgress >= 100) revealSpot(holding);
        } else {
          stir = clamp(stir - d.stirLeak * dt, 0, 100);
        }
        // while he's actively stirring, holding is extra risky (double stir)
        if (rummaging && stirring) { stir = clamp(stir + d.stirRate * 0.9 * dt, 0, 100); if (Math.random() < 0.04) say(pick(LINES.stir), 'warn'); }
        stirFill.style.width = stir + '%';
        if (stir >= 100) { over(); return; }
      }
      if (pageAnim > 0) pageAnim = Math.max(0, pageAnim - dt * 2.2);
      animT += dt * 2.0;
    }

    function revealSpot(spot) {
      spot.looted = true;
      holding = null; holdProgress = 0;
      if (spot.decoy) {
        say(pick(LINES.empty));
        // small relief: decoys cost nothing extra
        return;
      }
      // real spot -> entry + page turn into reading
      var e = genEntry();
      currentRarity = e.rarity || 'common';
      tagEl.textContent = e.tag;
      entryEl.textContent = e.text;
      dateEl.textContent = e.date;
      lastEntry = e.text.replace('\n', ' / ');
      readPanel.classList.remove('rare','buried','legend');
      stickerEl.className = 'sh-rg-sticker';
      stickerEl.hidden = true;
      if (currentRarity === 'rare') { readPanel.classList.add('rare'); stickerEl.hidden = false; stickerEl.classList.add('rare'); stickerEl.textContent = 'RARE FIND'; rareFinds++; }
      else if (currentRarity === 'buried') { readPanel.classList.add('buried'); stickerEl.hidden = false; stickerEl.classList.add('buried'); stickerEl.textContent = '\u26A0 BURIED'; buriedFindsRun++; }
      else if (currentRarity === 'legendary') { readPanel.classList.add('legend'); stickerEl.hidden = false; stickerEl.classList.add('legend'); stickerEl.textContent = '\u2606 ? ? ?'; foundEurielleEver = true; }
      phase = 'reading';
      pageAnim = 1;                 // triggers page-turn css
      readPanel.hidden = false;
      readPanel.classList.remove('turning'); void readPanel.offsetWidth; readPanel.classList.add('turning');
      say(pick(LINES.found), 'good');
    }

    function closeReading() {
      if (phase !== 'reading') return;
      readPanel.hidden = true;
      phase = 'rummage';
      found++; totalFound++;
      quotaEl.textContent = found + ' / ' + quota;
      if (found >= quota) { winLevel(); return; }
      say(pick(["Keep going.", "One more, carefully.", "Don't get greedy. Or do."]));
    }

    function winLevel() {
      level++;
      say(pick(LINES.win), 'good');
      // brief beat, then next level
      setupLevel();
    }

    function start() {
      playing = true; phase = 'rummage';
      level = 1; totalFound = 0; stir = 0;
      buriedThisGame = 0; buriedFindsRun = 0; rareFinds = 0; eurielleThisGame = false;
      readPanel.hidden = true;
      overlay.classList.add('hidden');
      setupLevel();
      say(pick(LINES.idle));
      startLoop();
    }
    function over() {
      playing = false; pauseLoop();
      if (totalFound > best) best = totalFound;
      holding = null;
      callout.textContent = 'He Woke Up.';
      subEl.innerHTML = '<span class="sh-rg-final">Pages found <b>' + totalFound + '</b>' +
        '<span class="best">Best: ' + best + '  \u00B7  reached level ' + level +
          (rareFinds ? '  \u00B7  rare: ' + rareFinds : '') +
          (buriedFindsRun ? '  \u00B7  buried: ' + buriedFindsRun : '') + '</span>' +
        (foundEurielleEver ? '<span class="last gold">\u2606 You found the one he\u2019ll never say out loud.</span>' : '') +
        (buriedFindsRun ? '<span class="last blood">\u26A0 You read what he buried.</span>' : '') +
        (lastEntry ? '<span class="last">last thing you saw: \u201C' + lastEntry + '\u201D</span>' : '') + '</span>';
      startBtn.textContent = 'Try Again';
      readPanel.hidden = true;
      overlay.classList.remove('hidden');
      say(pick(LINES.wake), 'bad');
    }

    /* ===========================================================
       RENDER — clean flat-vector, cozy warm night
       =========================================================== */
    function rr(x, y, w, h, r, col) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else { ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); }
      ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    }
    function circle(x, y, r, col) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); }
    function softGlow(x, y, r, col) { var g = ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }

    // flat palette
    var C = {
      wall1:'#2c2336', wall2:'#241d2e', floor:'#3a2e3e', floorHi:'#4a3a4e',
      bunk:'#3b2f48', bunkIn:'#241c30', blanket:'#9a4a64', blanketHi:'#b85f7c',
      pillow:'#e8dccb', amp:'#1f1a24', wood:'#5a4636', gold:'#e7c24a', cream:'#f3ecdb',
      skin:'#f0cfae', hair:'#5a3a22', tee:'#3c3c46',
      tank:'#2a4a44', glass:'rgba(150,210,200,0.3)', snake:'#f4efe6',
      spot:'rgba(231,200,121,0.0)', spotEdge:'rgba(231,200,121,0.7)', spotGlow:'rgba(231,200,121,0.25)',
      poster1:'#e85ee8', poster2:'#5fdcff'
    };

    function draw() {
      // warm wall wash
      var g = ctx.createLinearGradient(0,0,0,VH);
      g.addColorStop(0, C.wall1); g.addColorStop(1, C.wall2);
      ctx.fillStyle = g; ctx.fillRect(0,0,VW,VH);
      // soft amber ambient from a ceiling lamp
      softGlow(VW*0.5, 16, 150, 'rgba(255,180,90,0.10)');

      // posters on the back wall
      drawPoster(118, 28, 0);
      drawPoster(232, 26, 1);
      // string lights across the top
      drawFairyLights();

      // floor
      rr(0, VH-46, VW, 46, 0, C.floor);
      ctx.fillStyle = C.floorHi; ctx.fillRect(0, VH-46, VW, 2);

      // the bunk (cozy bed nook) on the left-center
      drawBunkBed();
      // amp + shelf on the right
      drawAmp(292, VH-46);
      // Lilith's tank, front-right low
      drawTank(316, VH-40);

      // sleeping Shane in the bunk
      drawSleepingShane();

      // hiding spots (skip ones overlapping nothing) with hold dials
      for (var i = 0; i < SPOTS.length; i++) drawSpot(SPOTS[i]);

      // gentle vignette
      var vg = ctx.createRadialGradient(VW/2, VH/2, VH*0.45, VW/2, VH/2, VH);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(8,4,10,0.4)');
      ctx.fillStyle = vg; ctx.fillRect(0,0,VW,VH);
    }

    function drawFairyLights() {
      ctx.strokeStyle = 'rgba(120,90,60,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 10);
      for (var x=0;x<=VW;x+=30) ctx.quadraticCurveTo(x+15, 18, x+30, 10);
      ctx.stroke();
      var cols = ['#ffd27a','#ff9ec4','#9ed8ff','#c4ff9e'];
      for (var i=0;i<VW;i+=30) { var f = 0.6 + 0.4*Math.sin(animT*2 + i); ctx.globalAlpha = f; circle(i+15, 16, 2.2, cols[(i/30|0)%4]); ctx.globalAlpha = 1; }
    }

    function drawPoster(x, y, v) {
      var w = 64, h = 84;
      rr(x - w/2, y, w, h, 4, v===0 ? '#1a1020' : '#101a22');
      ctx.strokeStyle = 'rgba(231,200,121,0.4)'; ctx.lineWidth = 1; ctx.strokeRect(x-w/2+0.5, y+0.5, w-1, h-1);
      // coiled snake motif
      ctx.strokeStyle = v===0 ? C.poster1 : C.poster2; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x-12, y+22);
      ctx.bezierCurveTo(x+16, y+16, x-16, y+40, x+12, y+40);
      ctx.bezierCurveTo(x-12, y+46, x+16, y+60, x-6, y+64);
      ctx.stroke();
      circle(x-12, y+22, 2.2, v===0 ? C.poster1 : C.poster2);
      ctx.fillStyle = C.gold; ctx.font = 'bold 8px Oswald, sans-serif'; ctx.textAlign='center';
      ctx.fillText('THE', x, y+h-22);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px "Cinzel Decorative", serif';
      ctx.fillText('SNAKE', x, y+h-12); ctx.fillText('SKINS', x, y+h-2);
    }

    function drawBunkBed() {
      var bx = 30, by = VH-92, bw = 200, bh = 70;
      // frame
      rr(bx-6, by-8, bw+12, bh+16, 8, C.bunk);
      rr(bx, by, bw, bh, 6, C.bunkIn);
      // warm interior glow
      softGlow(bx+bw*0.5, by+bh*0.5, 80, 'rgba(255,170,90,0.10)');
      // mattress + blanket
      rr(bx+4, by+bh-30, bw-8, 30, 6, C.blanket);
      rr(bx+4, by+bh-30, bw-8, 5, 4, C.blanketHi);
      // pillow
      rr(bx+10, by+10, 52, 26, 8, C.pillow);
      ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(bx+34, by+12, 2, 22);
    }

    function drawSleepingShane() {
      var hx = 96, hy = VH-72;          // head on the pillow
      // body lump under blanket (rises/falls breathing)
      var breath = Math.sin(sleepPhase) * 1.4;
      ctx.fillStyle = C.blanket;
      ctx.beginPath();
      ctx.moveTo(hx+10, VH-34);
      ctx.quadraticCurveTo(150, VH-58 - breath, 210, VH-36);
      ctx.lineTo(210, VH-22); ctx.lineTo(hx+10, VH-22); ctx.closePath(); ctx.fill();
      // head
      circle(hx, hy, 11, C.skin);
      // hair + ponytail (brown), facing up asleep
      ctx.fillStyle = C.hair;
      ctx.beginPath(); ctx.arc(hx, hy-3, 12, Math.PI*1.05, Math.PI*2.05); ctx.fill();
      rr(hx-13, hy-6, 9, 18, 4, C.hair);            // ponytail draping on pillow
      // closed eye (peaceful line) + tiny mouth
      ctx.strokeStyle='#3a2a22'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(hx+3, hy, 3, 0.1, Math.PI-0.1); ctx.stroke();
      // blush
      ctx.globalAlpha=0.5; circle(hx+7, hy+3, 2.4, '#e89a9a'); ctx.globalAlpha=1;
      // Zzz floating, bobbing — turns to '!' colors if stirring
      var stirry = stirring || stir > 55;
      ctx.fillStyle = stirry ? '#ff8a6a' : 'rgba(180,200,230,0.9)';
      ctx.font = 'bold 11px Oswald, sans-serif'; ctx.textAlign='left';
      var zb = Math.sin(animT*2)*2;
      ctx.fillText('z',  hx+14, hy-10+zb);
      ctx.fillText('Z',  hx+20, hy-18+zb*0.7);
      ctx.fillText('Z',  hx+28, hy-28+zb*0.5);
      if (stirry) { zzzEl.textContent = 'He\u2019s stirring\u2026'; zzzEl.className = 'sh-rg-zzz stir'; }
      else { zzzEl.textContent = 'Fast asleep'; zzzEl.className = 'sh-rg-zzz'; }
    }

    function drawAmp(x, baseY) {
      rr(x-22, baseY-54, 44, 54, 5, C.amp);
      rr(x-16, baseY-48, 32, 22, 3, '#120e16');
      ctx.fillStyle='rgba(255,196,120,0.25)';
      for (var ax=x-12;ax<x+12;ax+=5) for (var ay=baseY-44;ay<baseY-28;ay+=5) circle(ax,ay,1.2,'rgba(255,196,120,0.22)');
      circle(x+14, baseY-50, 2, '#7fe39a');                 // power led
      rr(x-12, baseY-58, 24, 5, 2, C.wood);                 // a shelf board on top
      // a coffee mug on the shelf
      rr(x-6, baseY-66, 7, 8, 2, C.gold);
    }

    function drawTank(x, baseY) {
      var tw=54, th=34, ty=baseY-th;
      rr(x-tw/2+3, baseY, tw-6, 14, 2, C.wood);            // stand
      softGlow(x, ty+th/2, 40, 'rgba(255,170,80,0.20)');
      rr(x-tw/2, ty, tw, th, 4, '#10201c');
      ctx.fillStyle = C.tank; ctx.fillRect(x-tw/2+2, ty+2, tw-4, th-4);
      ctx.fillStyle='#3a2c1c'; ctx.fillRect(x-tw/2+2, ty+th-8, tw-4, 6);
      // Lilith — white boa, animated sine body, head lifts + tongue flick
      var t = animT;
      ctx.lineCap='round';
      ctx.strokeStyle = C.snake; ctx.lineWidth = 5;
      ctx.beginPath();
      for (var i=0;i<=22;i++){ var px=x-18+i*1.7, py=ty+th-9+Math.sin(i*0.7+t*1.2)*3; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py); }
      ctx.stroke();
      var hx2=x+19, hy2=ty+th-9-4-Math.max(0,Math.sin(t*0.6)*3);
      circle(hx2,hy2,3,C.snake); circle(hx2+1,hy2-1,0.8,'#b04a4a');
      if (((t*2)|0)%4===0){ ctx.strokeStyle='#d0405a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(hx2+2,hy2); ctx.lineTo(hx2+5,hy2); ctx.stroke(); }
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(x-tw/2+3, ty+3, tw-6, 5);
      ctx.strokeStyle='rgba(150,200,200,0.4)'; ctx.lineWidth=1; ctx.strokeRect(x-tw/2+0.5, ty+0.5, tw-1, th-1);
      ctx.fillStyle=C.gold; ctx.font='bold 8px Oswald, sans-serif'; ctx.textAlign='center'; ctx.fillText('LILITH', x, baseY+12);
    }

    function drawSpot(s) {
      if (s.looted) {
        // looted marker (faded check)
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = s.decoy ? 'rgba(150,150,160,0.6)' : '#5fe39a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r*0.5, 0, 6.2832); ctx.stroke();
        ctx.globalAlpha = 1; return;
      }
      var held = (holding === s);
      // glowing tappable ring
      var pulse = 0.5 + 0.5*Math.sin(animT*3 + s.x);
      softGlow(s.x, s.y, s.r+8, 'rgba(231,200,121,' + (held?0.34:0.14 + pulse*0.06) + ')');
      ctx.strokeStyle = held ? '#fff2c0' : C.spotEdge; ctx.lineWidth = held ? 3 : 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.2832); ctx.stroke();
      // magnifier-ish glyph
      ctx.fillStyle = C.gold; ctx.font = 'bold 10px Oswald, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('?', s.x, s.y);
      ctx.textBaseline='alphabetic';
      // hold dial
      if (held) {
        ctx.strokeStyle = '#5fe39a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r+5, -Math.PI/2, -Math.PI/2 + (holdProgress/100)*6.2832); ctx.stroke();
      }
    }

    /* ===========================================================
       LOOP + INPUT
       =========================================================== */
    function frame(t) {
      if (!playing) return;
      var dt = (t - lastT)/1000; lastT = t;
      if (dt > 0.05) dt = 0.05;
      update(dt);
      try { draw(); } catch(e){}
      rafId = window.requestAnimationFrame(frame);
    }
    function startLoop(){ lastT = (window.performance&&performance.now)?performance.now():Date.now(); rafId = window.requestAnimationFrame(frame); }
    function pauseLoop(){ if (rafId){ window.cancelAnimationFrame(rafId); rafId=null; } }

    // map a pointer event to canvas logical coords
    function evToXY(e) {
      var rect = canvas.getBoundingClientRect();
      var cx = (e.clientX - rect.left) * (VW / rect.width);
      var cy = (e.clientY - rect.top) * (VH / rect.height);
      return { x: cx, y: cy };
    }
    function spotAt(x, y) {
      for (var i = 0; i < SPOTS.length; i++) {
        var s = SPOTS[i]; if (s.looted) continue;
        var dx = x - s.x, dy = y - s.y;
        if (dx*dx + dy*dy <= (s.r+6)*(s.r+6)) return s;
      }
      return null;
    }
    canvas.addEventListener('pointerdown', function (e) {
      if (!playing || phase !== 'rummage') return;
      var p = evToXY(e); var s = spotAt(p.x, p.y);
      if (s) { e.preventDefault(); holding = s; holdProgress = 0; activePointer = e.pointerId; if (canvas.setPointerCapture) try { canvas.setPointerCapture(e.pointerId); } catch(_){} }
    });
    function release() { if (holding && holdProgress < 100) { holding = null; holdProgress = 0; } }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('pointerleave', release);
    window.addEventListener('pointerup', release);

    function bindClose(el){ if(!el) return; el.addEventListener('click', function(e){ if(e&&e.preventDefault)e.preventDefault(); closeReading(); }); el.addEventListener('pointerup', function(e){ if(e&&e.preventDefault)e.preventDefault(); closeReading(); }); }
    bindClose(readClose); bindClose(readCont);

    startBtn.addEventListener('click', start);
    document.addEventListener('visibilitychange', function(){ if(document.hidden){ holding=null; pauseLoop(); } else if(playing && !rafId) startLoop(); });

    // first paint behind the intro
    setupLevel(); try { draw(); } catch(e){}
  }

  function boot(){
    build();
    var r0 = document.getElementById('shBunk');
    if (!r0 || !r0._init){ var n=0; var iv=setInterval(function(){ build(); var r=document.getElementById('shBunk'); if((r&&r._init)||++n>20) clearInterval(iv); }, 150); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('load', boot);
})();
