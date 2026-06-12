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
  {
    name: "Kayla",
    desc: "cellist of The Snake Skins",
    nameStyle: "gothic",
    portrait: "assets/Kayla Pics/KaylaPfp.webp",
    pageId: "kayla",
    href: "kayla.html",
  },
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
