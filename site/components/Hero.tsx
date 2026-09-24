import React, { useEffect, useRef } from 'react';
import { HeroFrame, type FrameStyles } from '../../shared/HeroFrame';
import type { TokenAddress } from '../../shared/Masthead';
import { padFor } from '../../shared/brand';
import { motionState, onMotion, type MotionState } from '../lib/motion';
import { useViewport } from '../lib/hooks';
import { Field } from './Field';

type Props = {
  /** Flipped the moment the loader hands over. */
  entered: boolean;
  reduced: boolean;
  stageRef?: React.RefObject<HTMLDivElement | null>;
};

/**
 * Per-token depth. `fromDot` is the signed distance from the red dot, so
 * the glyphs to its left lean one way and those to its right lean the
 * other: the mark widens and narrows around the dot with the pointer.
 * It is the loader's unfold gesture, continued by other means once the
 * video is gone.
 */
const HERO_STYLES: FrameStyles = {
  tokenStyle: (at: TokenAddress) =>
    at.token.kind === 'dot'
      ? undefined
      : ({
          ['--dx']: (at.fromDot * 1.9).toFixed(2),
          ['--dy']: (0.9 + Math.abs(at.fromDot) * 0.28).toFixed(2),
        } as React.CSSProperties),
};

/** How close the pointer has to get before the dot notices it. */
const DOT_REACH = 280;
/** Seconds over which the dot's resting breath fades in after hand-off. */
const BREATH_RAMP = 1.4;
const CTA_REACH = 170;

export const Hero: React.FC<Props> = ({ entered, reduced, stageRef: external }) => {
  const { width, height } = useViewport();
  const ownRef = useRef<HTMLDivElement>(null);
  const stageRef = external ?? ownRef;
  const glowRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  /* When the hero took over, on the motion loop's own clock. The dot's
     breath is phased from this instant and faded in over BREATH_RAMP, so
     it is at exactly scale 1 the moment the loader hands it across —
     otherwise the two sides meet at unrelated phases and the dot pops. */
  const enteredAt = useRef<number | null>(null);

  useEffect(() => {
    if (entered && enteredAt.current === null) enteredAt.current = motionState.t;
  }, [entered]);

  useEffect(() => {
    if (reduced) return;

    const apply = (s: MotionState) => {
      const stage = stageRef.current;
      if (!stage) return;

      // One property write per frame drives the whole subtree.
      stage.style.setProperty('--pnx', s.nx.toFixed(4));
      stage.style.setProperty('--pny', s.ny.toFixed(4));
      stage.style.setProperty('--sc', s.scroll.toFixed(4));

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
        glowRef.current.style.opacity = String(s.engaged * 0.9);
      }

      // The mark breathes on the wdth axis, 98.8%…101.2%. About a pixel
      // and a half at the outer letters — meant to be felt, not seen.
      const line = stage.querySelector<HTMLElement>('.wordmark__line');
      if (line) line.style.fontStretch = `${(100 + s.nx * 1.2 * s.engaged).toFixed(2)}%`;

      /* The dot. It never stops moving: a slow breath at rest, then it
         leans toward the cursor and opens up as the cursor approaches.
         `translate` on .wordmark__disc holds its optical rise, so the
         live part goes through `transform`, which composes after it. */
      const disc = stage.querySelector<HTMLElement>('.wordmark__disc');
      if (disc) {
        const r = disc.getBoundingClientRect();
        const dx = s.x - (r.left + r.width / 2);
        const dy = s.y - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const near = dist < DOT_REACH ? (1 - dist / DOT_REACH) ** 1.5 * s.engaged : 0;
        const age = s.t - (enteredAt.current ?? s.t);
        const ramp = Math.min(1, Math.max(0, age / BREATH_RAMP));
        const breath =
          (Math.sin(age * 0.85) * 0.028 + Math.sin(age * 1.9) * 0.012) * ramp;
        const scale = 1 + breath + near * 0.22;
        disc.style.transform =
          `translate3d(${(dx * near * 0.1).toFixed(2)}px, ${(dy * near * 0.1).toFixed(2)}px, 0)` +
          ` scale(${scale.toFixed(4)})`;
      }

      // Magnetic CTA: it leans toward the cursor inside a small radius,
      // then lets go. It tells you the control is live before you reach it.
      const cta = ctaRef.current;
      if (cta) {
        const r = cta.getBoundingClientRect();
        const dx = s.x - (r.left + r.width / 2);
        const dy = s.y - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        const f = dist < CTA_REACH ? (1 - dist / CTA_REACH) ** 1.6 : 0;
        cta.style.translate = `${(dx * f * 0.24).toFixed(2)}px ${(dy * f * 0.24).toFixed(2)}px`;
      }
    };

    return onMotion(apply);
  }, [reduced, stageRef]);

  return (
    <section
      className="stage"
      ref={stageRef}
      style={{ ['--pad' as string]: `${padFor(width)}px` }}
    >
      <Field reduced={reduced} intensity={entered ? 1 : 0} />
      <div className="stage__glow" ref={glowRef} aria-hidden="true" />
      <div className="stage__grain" aria-hidden="true" />

      <HeroFrame
        mode="live"
        width={width}
        height={height}
        entered={entered}
        styles={HERO_STYLES}
        ctaRef={ctaRef}
      />
    </section>
  );
};
