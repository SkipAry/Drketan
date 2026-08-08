/* ==========================================================================
   main.js — behaviour for the Coral Dental site.
   The only non-obvious part is layout(): sections 1 and 2 paint a *single*
   photograph across several rounded tiles, so each tile's background-position
   has to be derived from its offset inside the section. Ported from the
   Claude Design prototype.
   ========================================================================== */

// PLACEHOLDER — clinic WhatsApp number in international format, digits only.
const CLINIC_WHATSAPP = '910000000000';

const IMG = {
  hero: 'assets/img/hero-doctor.webp',
  s2: 'assets/img/team-section2.webp'
};

const natural = {};
const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Shared-photo tile masks ────────────────────────────────────────────── */

function paintMobile(el, key) {
  el.style.backgroundImage = 'url("' + IMG[key] + '")';
  el.style.backgroundSize = el.dataset.mobileSize || 'cover';
  el.style.backgroundPosition = el.dataset.mobilePos || '50% 50%';
}

/* Hero: one panel, one portrait. hero-doctor.webp carries transparent margin,
   so place it by its *opaque* edges rather than the bitmap's. */
const HERO = { scale: 1.06, opaqueRight: 0.885, right: 0.99, top: -0.03 };

function layoutHero(mobile) {
  const el = document.querySelector('[data-mask="1"]');
  const nat = natural.hero;
  if (!el || !nat) return;
  if (mobile) return paintMobile(el, 'hero');

  const r = el.getBoundingClientRect();
  const h = r.height * HERO.scale;
  const w = (nat.w / nat.h) * h;

  el.style.backgroundImage = 'url("' + IMG.hero + '")';
  el.style.backgroundSize = w + 'px ' + h + 'px';
  el.style.backgroundPosition =
    (r.width * HERO.right - w * HERO.opaqueRight) + 'px ' + (r.height * HERO.top) + 'px';
}

/* Services: four tiles share one photograph, so each tile's background has to
   be offset by its own position inside the section. */
function layoutServices(mobile) {
  const sect = document.querySelector('[data-sect="2"]');
  const nat = natural.s2;
  if (!sect) return;
  const masks = sect.querySelectorAll('[data-mask="2"]');

  if (mobile) return masks.forEach(el => paintMobile(el, 's2'));
  if (!nat) return;

  const sr = sect.getBoundingClientRect();
  const scale = Math.max(sr.height / nat.h, sr.width / nat.w) * 1.18;
  const imageWidth = nat.w * scale;
  const imageHeight = nat.h * scale;
  const overflow = Math.max(imageWidth - sr.width, 0);
  // Raise the group so every face clears the treatments row along the bottom.
  const voff = -sr.height * 0.035;

  masks.forEach(el => {
    const r = el.getBoundingClientRect();
    const off = overflow * (parseFloat(el.dataset.focal) || 0.8);
    el.style.backgroundImage = 'url("' + IMG.s2 + '")';
    el.style.backgroundSize = imageWidth + 'px ' + imageHeight + 'px';
    el.style.backgroundPosition =
      (-(r.left - sr.left + off)) + 'px ' + (-(r.top - sr.top + voff)) + 'px';
  });
}

function layout() {
  const mobile = isMobile();
  layoutHero(mobile);
  layoutServices(mobile);
}

function watchLayout() {
  Object.keys(IMG).forEach(k => {
    const im = new Image();
    im.onload = () => { natural[k] = { w: im.naturalWidth, h: im.naturalHeight }; layout(); };
    im.src = IMG[k];
  });

  const ro = new ResizeObserver(layout);
  ['1', '2'].forEach(n => {
    const s = document.querySelector('[data-sect="' + n + '"]');
    if (s) ro.observe(s);
  });
  window.addEventListener('resize', layout);
  layout();
}

/* ── Header height ──────────────────────────────────────────────────────── */

/* The header is fixed and its height changes with zoom, font fallback and
   viewport. A hardcoded --header-h let the hero slide under it, so measure
   the real element instead of guessing. */
function trackHeaderHeight() {
  const header = document.getElementById('siteHeader');
  if (!header) return;
  const apply = () =>
    document.documentElement.style.setProperty('--header-h', Math.ceil(header.offsetHeight) + 'px');
  new ResizeObserver(apply).observe(header);
  apply();
}

/* ── Hero entrance ──────────────────────────────────────────────────────── */

const startHero = () => document.body.setAttribute('data-ready', '');

/* ── Header: hide going down, reveal going up ───────────────────────────── */

function setupHeader() {
  const header = document.getElementById('siteHeader');
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('navToggle');
  let last = 0;

  const closeNav = () => {
    nav.removeAttribute('data-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    if (open) return closeNav();
    nav.setAttribute('data-open', '');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
  });

  nav.addEventListener('click', e => { if (e.target.closest('a, button')) closeNav(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  addEventListener('scroll', () => {
    const y = window.scrollY;
    header.toggleAttribute('data-scrolled', y > 8);
    const navOpen = toggle.getAttribute('aria-expanded') === 'true';
    header.toggleAttribute('data-hidden', !navOpen && y > 400 && y > last);
    last = y;
  }, { passive: true });
}

/* ── Booking: hand the details off to WhatsApp ──────────────────────────── */

function setupBooking() {
  const dialog = document.getElementById('booking');
  const form = document.getElementById('bookingForm');
  if (!dialog) return;

  document.querySelectorAll('[data-book]').forEach(btn =>
    btn.addEventListener('click', () => dialog.showModal())
  );

  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const lines = [
      'Appointment request — Coral Dental',
      'Name: ' + f.get('name'),
      'Phone: ' + f.get('phone'),
      'Treatment: ' + f.get('treatment')
    ];
    if (f.get('date')) lines.push('Preferred date: ' + f.get('date'));
    window.open('https://wa.me/' + CLINIC_WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    dialog.close();
    form.reset();
  });
}

/* ── Boot ───────────────────────────────────────────────────────────────── */

document.getElementById('year').textContent = new Date().getFullYear();
trackHeaderHeight();
startHero();
setupHeader();
setupBooking();
watchLayout();
