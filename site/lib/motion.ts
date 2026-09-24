/**
 * One rAF loop for the whole page.
 *
 * Pointer and scroll are read into a shared, critically-damped state and
 * published to subscribers once per frame. Subscribers write directly to
 * element styles — React never re-renders on pointer or scroll, which is
 * what keeps the hero at 60fps while the canvas field is also drawing.
 */

export type MotionState = {
  /** Damped pointer, in CSS px, relative to the viewport. */
  x: number;
  y: number;
  /** Damped pointer normalised to -1…1 from the viewport centre. */
  nx: number;
  ny: number;
  /** 0 = pointer has never moved (or coarse pointer): hold everything still. */
  engaged: number;
  /** Seconds since start — drives the field's ambient undulation. */
  t: number;
  /** Hero scroll progress, 0…1 over one viewport height. */
  scroll: number;
};

type Subscriber = (s: MotionState) => void;

const state: MotionState = { x: 0, y: 0, nx: 0, ny: 0, engaged: 0, t: 0, scroll: 0 };
const target = { x: 0, y: 0, engaged: 0 };

const subs = new Set<Subscriber>();
let raf = 0;
let started = 0;
let reduced = false;

/** Frame-rate independent damping: the same feel at 60Hz and 120Hz. */
const damp = (current: number, to: number, lambda: number, dt: number) =>
  current + (to - current) * (1 - Math.exp(-lambda * dt));

const onPointerMove = (e: PointerEvent) => {
  target.x = e.clientX;
  target.y = e.clientY;
  // A finger only engages the field while it is actually down; letting a
  // stale touch point keep glowing after the finger lifts reads as a
  // stuck cursor. A mouse engages simply by moving.
  if (e.pointerType !== 'touch') target.engaged = 1;
};

const onPointerDown = (e: PointerEvent) => {
  if (e.pointerType !== 'touch') return;
  target.x = e.clientX;
  target.y = e.clientY;
  target.engaged = 1;
};

const onPointerRelease = () => {
  target.engaged = 0;
};

const readScroll = () => {
  const h = window.innerHeight || 1;
  state.scroll = Math.min(1, Math.max(0, window.scrollY / h));
};

let last = 0;

const tick = (now: number) => {
  raf = requestAnimationFrame(tick);
  if (!started) started = now;
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  state.t = (now - started) / 1000;

  if (document.hidden) return;

  // Heavy damping is the whole point: the visitor should suspect the
  // page is moving with them rather than see it chase the cursor.
  state.x = damp(state.x, target.x, 3.2, dt);
  state.y = damp(state.y, target.y, 3.2, dt);
  state.engaged = damp(state.engaged, target.engaged, 2.4, dt);

  const w = document.documentElement.clientWidth || window.innerWidth || 1;
  const h = document.documentElement.clientHeight || window.innerHeight || 1;
  state.nx = (state.x / w) * 2 - 1;
  state.ny = (state.y / h) * 2 - 1;

  readScroll();

  for (const s of subs) s(state);
};

const start = () => {
  if (raf || reduced) return;
  const w = document.documentElement.clientWidth || window.innerWidth || 1;
  const h = document.documentElement.clientHeight || window.innerHeight || 1;
  state.x = target.x = w / 2;
  state.y = target.y = h / 2;
  readScroll();
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
  window.addEventListener('pointerup', onPointerRelease, { passive: true });
  window.addEventListener('pointercancel', onPointerRelease, { passive: true });
  document.addEventListener('pointerleave', onPointerRelease, { passive: true });
  raf = requestAnimationFrame(tick);
};

const stop = () => {
  if (!raf) return;
  cancelAnimationFrame(raf);
  raf = 0;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('pointerup', onPointerRelease);
  window.removeEventListener('pointercancel', onPointerRelease);
  document.removeEventListener('pointerleave', onPointerRelease);
};

/** Subscribe to the shared loop. Returns an unsubscribe function. */
export const onMotion = (fn: Subscriber): (() => void) => {
  subs.add(fn);
  if (subs.size === 1) start();
  // Give the new subscriber a state to paint immediately.
  fn(state);
  return () => {
    subs.delete(fn);
    if (subs.size === 0) stop();
  };
};

/**
 * Dev-only handle. Lets the pointer state be driven and inspected without
 * a real cursor — useful when verifying the hero's interactions in a
 * headless or non-painting context, where rAF is throttled and the
 * damped state would otherwise never advance. Stripped from builds.
 */
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__nexooMotion = {
    state,
    target,
    /** Jump the damped state straight to a pointer position. */
    set(x: number, y: number) {
      target.x = state.x = x;
      target.y = state.y = y;
      target.engaged = state.engaged = 1;
      const w = document.documentElement.clientWidth || 1;
      const h = document.documentElement.clientHeight || 1;
      state.nx = (x / w) * 2 - 1;
      state.ny = (y / h) * 2 - 1;
      readScroll();
      for (const fn of subs) fn(state);
    },
  };
}

/** Under prefers-reduced-motion the loop never runs at all. */
export const setReducedMotion = (value: boolean) => {
  reduced = value;
  if (value) stop();
  else if (subs.size > 0) start();
};

export const motionState = state;
