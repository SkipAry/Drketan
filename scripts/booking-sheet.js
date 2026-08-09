/* ==========================================================================
   booking-sheet.js — the booking dialog as a sheet you can throw away.

   On phones the dialog stops being a box that fades in and becomes a
   surface the thumb owns: it tracks 1:1, resists past the top, can be
   grabbed mid-flight and reversed, and leaves at the speed you let go of
   it. Desktop keeps the centred dialog and never runs any of this.

   No dependency: the spring below is ~20 lines and is the only thing a
   fixed-duration CSS animation cannot do — start from wherever the sheet
   currently is, carrying whatever velocity it currently has.
   ========================================================================== */

const dialog = document.getElementById('booking');
const phone = matchMedia('(max-width: 700px)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

/* Apple parameterises springs as damping ratio + response, not mass and
   stiffness. response is how quickly it reaches the target, in seconds;
   damping 1 settles without overshoot, below 1 overshoots. */
function spring({ from, to, velocity = 0, damping = 1, response = 0.4, onUpdate, onRest }) {
  const w = (2 * Math.PI) / response;
  const k = w * w;
  const c = 2 * damping * w;
  let x = from, v = velocity, last = performance.now(), id = 0;

  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 1 / 30);   // a backgrounded tab must not explode
    last = now;
    v += (-k * (x - to) - c * v) * dt;
    x += v * dt;
    if (Math.abs(x - to) < 0.4 && Math.abs(v) < 12) {
      onUpdate(to);
      onRest && onRest();
      return;
    }
    onUpdate(x);
    id = requestAnimationFrame(frame);
  };

  id = requestAnimationFrame(frame);
  return { cancel: () => cancelAnimationFrame(id), value: () => x, velocity: () => v };
}

/* Where a flick would come to rest, as exponential decay — the scroll
   deceleration curve, not the textbook v²/2a. */
const project = (v, rate = 0.998) => (v / 1000) * rate / (1 - rate);

/* Past the top edge the sheet follows less and less, so the boundary reads
   as resistance rather than as a seized-up interface. */
const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

const live = () => phone.matches && !calm.matches;

if (dialog) setupSheet();

function setupSheet() {
  let y = 0, height = 0, anim = null, drag = null;

  const setY = (value) => {
    y = value;
    dialog.style.transform = `translate3d(0, ${value.toFixed(2)}px, 0)`;
    // the scrim lightens as the sheet leaves, so dimming tracks the gesture
    dialog.style.setProperty('--dim', String(Math.max(0, 1 - value / Math.max(height, 1))));
  };

  const stop = () => { if (anim) { anim.cancel(); anim = null; } };

  const rest = () => {
    stop();
    dialog.close();
    dialog.style.transform = '';
    dialog.style.removeProperty('--dim');
  };

  function dismiss(velocity = 0) {
    if (!live()) { dialog.close(); return; }
    stop();
    anim = spring({ from: y, to: height, velocity, damping: 1, response: 0.3, onUpdate: setY, onRest: rest });
  }

  function settle(velocity = 0) {
    stop();
    anim = spring({ from: y, to: 0, velocity, damping: 0.8, response: 0.3, onUpdate: setY, onRest: stop });
  }

  // showModal() lives in main.js; watch the attribute rather than couple to it
  new MutationObserver(() => {
    if (!dialog.open || !live()) return;
    height = dialog.offsetHeight;
    stop();
    setY(height);
    anim = spring({ from: height, to: 0, damping: 0.8, response: 0.3, onUpdate: setY, onRest: stop });
  }).observe(dialog, { attributes: true, attributeFilter: ['open'] });

  dialog.addEventListener('pointerdown', (e) => {
    if (!live() || !dialog.open) return;
    if (e.target.closest('input, select, textarea, button, a')) return;
    if (dialog.scrollTop > 0) return;                       // let the content scroll first

    const r = dialog.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) return;  // that press was the scrim

    stop();                                                 // take over mid-flight, from where it is
    try { dialog.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    dialog.style.willChange = 'transform';
    dialog.style.touchAction = 'none';
    drag = { offset: e.clientY - y, history: [{ t: performance.now(), y }] };
  });

  dialog.addEventListener('pointermove', (e) => {
    if (!drag) return;
    let next = e.clientY - drag.offset;                     // respect where they grabbed it
    if (next < 0) next = -rubberband(-next, height);
    setY(next);
    drag.history.push({ t: performance.now(), y: next });
    if (drag.history.length > 6) drag.history.shift();      // a short window, for velocity
  });

  const release = () => {
    if (!drag) return;
    dialog.style.willChange = '';
    dialog.style.touchAction = '';

    const h = drag.history;
    const a = h[0], b = h[h.length - 1];
    const dt = (b.t - a.t) / 1000;
    const velocity = dt > 0 ? (b.y - a.y) / dt : 0;         // px/s at the moment of release
    drag = null;

    // decide from where the throw is going, then hand the velocity to the spring
    if (y + project(velocity) > height * 0.4) dismiss(velocity);
    else settle(velocity);
  };

  dialog.addEventListener('pointerup', release);
  dialog.addEventListener('pointercancel', release);

  // Escape and the close button leave the same way they arrived
  dialog.addEventListener('cancel', (e) => {
    if (!live()) return;
    e.preventDefault();
    dismiss();
  });

  const closeBtn = dialog.querySelector('.booking__close');
  if (closeBtn) closeBtn.addEventListener('click', (e) => {
    if (!live()) return;
    e.preventDefault();
    dismiss();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) live() ? dismiss() : dialog.close();
  });
}
