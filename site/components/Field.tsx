import React, { useEffect, useRef } from 'react';
import { motionState, onMotion, type MotionState } from '../lib/motion';

/**
 * FIELD — the hero's principal visual.
 *
 * A lattice of hairline segments, each one oriented by a slow ambient
 * wave. Near the pointer they swing tangentially, so the cursor drags a
 * shallow eddy through the lattice and warms it toward the accent. The
 * displacement is small on purpose: the intent is that a visitor
 * half-notices the page reacting rather than watches an effect.
 *
 * Everything is drawn with 2D canvas — no WebGL, no dependency. Work is
 * bounded by bucketing segments into a handful of Path2Ds, so a frame is
 * a fixed ~8 stroke() calls no matter how large the viewport is.
 */

type Props = {
  reduced: boolean;
  /** 0…1 — the field arrives after the loader has handed over. */
  intensity: number;
  paused?: boolean;
};

const BUCKETS = 6;
const RADIUS = 330;      // px of pointer influence
const MOBILE_STEP = 62;
const DESKTOP_STEP = 46;

const PAPER = [242, 240, 236] as const;
const ACCENT = [226, 114, 74] as const;

export const Field: React.FC<Props> = ({ reduced, intensity, paused }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Read through refs so prop changes never restart the draw loop.
  const intensityRef = useRef(intensity);
  const pausedRef = useRef(paused);
  intensityRef.current = intensity;
  pausedRef.current = paused;
  /** Lets a prop change repaint without waiting for the next frame. */
  const repaintRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let step = DESKTOP_STEP;
    let cols = 0;
    let rows = 0;
    let originX = 0;
    let originY = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      step = w <= 760 ? MOBILE_STEP : DESKTOP_STEP;
      cols = Math.ceil(w / step) + 1;
      rows = Math.ceil(h / step) + 1;
      // Centre the lattice so it never looks pinned to a corner.
      originX = (w - (cols - 1) * step) / 2;
      originY = (h - (rows - 1) * step) / 2;
    };

    /* Ambient orientation. Two axis-aligned waves alone leave every
       neighbour at almost the same angle, which reads as diagonal rain
       rather than a lattice; the third term runs on (x + y) and breaks
       that row-and-column parallelism into curl-like structure. ~16s. */
    const ambient = (x: number, y: number, t: number) =>
      Math.sin(x * 0.0062 + t * 0.17) * 0.85 +
      Math.cos(y * 0.0078 - t * 0.13) * 0.65 +
      Math.sin((x + y) * 0.0039 + t * 0.09) * 0.5;

    const paths: Path2D[] = [];
    /* The lattice carries the empty upper third of the hero, then
       recedes as it approaches the masthead so it never competes with
       the type. Applied as a per-band multiplier so the whole field is
       still drawn in a fixed number of stroke() calls. */
    const BANDS = 5;
    const bandWeight = (band: number) => 1.25 - 0.9 * (band / (BANDS - 1));

    const draw = (s: MotionState) => {
      if (pausedRef.current || w === 0) return;

      const amount = intensityRef.current;
      if (amount <= 0.001) {
        ctx.clearRect(0, 0, w, h);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < BUCKETS * BANDS; i++) paths[i] = new Path2D();

      const t = reduced ? 0 : s.t;
      const reach = s.engaged;
      const px = s.x;
      const py = s.y;
      const narrow = w <= 760;
      // Shorter marks on a phone: at this scale, long segments stop
      // reading as a lattice and start reading as scratches.
      const half = step * (narrow ? 0.22 : 0.3);
      // A phone has no cursor to justify the texture, so the resting
      // field is only just perceptible there; touch brings it up.
      const ground = narrow ? 0.03 : 0.075;

      for (let r = 0; r < rows; r++) {
        const y = originY + r * step;
        for (let c = 0; c < cols; c++) {
          const x = originX + c * step;

          const a = ambient(x, y, t);
          let vx = Math.cos(a);
          let vy = Math.sin(a);
          let heat = 0;

          if (reach > 0.01) {
            const dx = x - px;
            const dy = y - py;
            const d2 = dx * dx + dy * dy;
            if (d2 < RADIUS * RADIUS) {
              const d = Math.sqrt(d2) || 1;
              // Quadratic falloff, so the eddy has a soft edge.
              const f = (1 - d / RADIUS) ** 2 * reach;
              // Tangential: perpendicular to the pointer vector.
              const tx = -dy / d;
              const ty = dx / d;
              vx += (tx - vx) * f;
              vy += (ty - vy) * f;
              heat = f;
            }
          }

          const inv = 1 / (Math.hypot(vx, vy) || 1);
          const len = half * (1 + heat * 0.85);
          const ex = vx * inv * len;
          const ey = vy * inv * len;

          const bucket = Math.min(BUCKETS - 1, Math.round(heat * (BUCKETS - 1)));
          // The lattice is centred and overhangs the canvas, so y can be
          // negative — clamp both ends or the band index goes out of range.
          const band = Math.max(0, Math.min(BANDS - 1, Math.floor((y / h) * BANDS)));
          const path = paths[band * BUCKETS + bucket];
          path.moveTo(x - ex, y - ey);
          path.lineTo(x + ex, y + ey);
        }
      }

      ctx.lineCap = 'round';
      ctx.lineWidth = 1;

      for (let band = 0; band < BANDS; band++) {
        const weight = bandWeight(band);
        for (let i = 0; i < BUCKETS; i++) {
          const path = paths[band * BUCKETS + i];
          const heat = i / (BUCKETS - 1);
          // Pointer heat is NOT dimmed by the band weight — the eddy
          // should read wherever the cursor happens to be.
          const alpha = (ground * weight + heat * 0.36) * amount;
          if (alpha < 0.004) continue;
          const col = [
            PAPER[0] + (ACCENT[0] - PAPER[0]) * heat,
            PAPER[1] + (ACCENT[1] - PAPER[1]) * heat,
            PAPER[2] + (ACCENT[2] - PAPER[2]) * heat,
          ];
          ctx.strokeStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${alpha})`;
          ctx.stroke(path);
        }
      }
    };

    resize();

    /* The draw loop is driven by rAF, which does not run in a hidden or
       backgrounded tab. Expose a direct repaint so a prop change — the
       field arriving after the loader hands over — still lands even if
       no frame is scheduled. */
    repaintRef.current = () => draw(motionState);

    let unsubscribe: (() => void) | undefined;
    const onResize = () => {
      resize();
      if (reduced) draw({ x: 0, y: 0, nx: 0, ny: 0, engaged: 0, t: 0, scroll: 0 });
    };
    window.addEventListener('resize', onResize);

    if (reduced) {
      // One static frame: the composition still reads, nothing moves.
      draw({ x: 0, y: 0, nx: 0, ny: 0, engaged: 0, t: 0, scroll: 0 });
    } else {
      unsubscribe = onMotion(draw);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      repaintRef.current = null;
      unsubscribe?.();
    };
  }, [reduced]);

  useEffect(() => {
    repaintRef.current?.();
  }, [intensity, paused]);

  return <canvas ref={canvasRef} className="stage__field" aria-hidden="true" />;
};
