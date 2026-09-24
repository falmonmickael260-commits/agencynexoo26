import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Easing,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

import '../../shared/fonts.css';
import '../../shared/tokens.css';
import '../../shared/hero.css';

import { HeroFrame, type FrameStyles } from '../../shared/HeroFrame';
import type { TokenAddress } from '../../shared/Masthead';
import { padFor, specFor } from '../../shared/brand';
import { fontsReady } from '../../shared/wordmark';
import {
  BEATS,
  DOT_PULSE_FRAMES,
  GLYPH_BLUR,
  LOADER_FRAMES,
  STRETCH_FROM,
  STRETCH_TO,
  TRACK_DELTA,
} from './timeline';

/** expo.out — the one expressive curve of the identity. */
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.bezier(0.76, 0, 0.24, 1);
/** Mechanical in, soft landing: a rule being drawn, not a bounce. */
const DRAW = Easing.bezier(0.65, 0, 0.32, 1);

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** Holds the first frame until every face — and its wdth axis — is live. */
const useFonts = (): boolean => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const handle = delayRender('Loading NEXOO typefaces');
    let alive = true;
    fontsReady()
      .then(() => {
        if (alive) setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
};

export const NexooLoader: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const ready = useFonts();

  /* ---- The dot ------------------------------------------------ */

  const dotIn = interpolate(frame, [...BEATS.dotIn], [0, 1], {
    ...clamp,
    easing: OUT,
  });

  // Compress and release. The recoil is what "fires" the axis, so the
  // two beats are deliberately adjacent rather than overlapping.
  const charge = interpolate(
    frame,
    [BEATS.dotCharge[0], (BEATS.dotCharge[0] + BEATS.dotCharge[1]) / 2, BEATS.dotCharge[1]],
    [0, 1, 0],
    { ...clamp, easing: IN_OUT },
  );

  // Resting pulse — the same slow breath the hero's dot carries on with.
  const pulse =
    frame < BEATS.dotSettle[0]
      ? 0
      : Math.sin(((frame - BEATS.dotSettle[0]) / DOT_PULSE_FRAMES) * Math.PI * 2) *
        interpolate(frame, [...BEATS.dotSettle], [0, 1], clamp);

  const dotScale = dotIn * (1 - charge * 0.26) * (1 + pulse * 0.035);

  /* ---- The axis ----------------------------------------------- */

  const axisScale = interpolate(frame, [...BEATS.axis], [0, 1], {
    ...clamp,
    easing: OUT,
  });
  const axisOpacity = interpolate(
    frame,
    [BEATS.axis[0], BEATS.axis[0] + 4, ...BEATS.axisOut],
    [0, 1, 1, 0],
    clamp,
  );

  /* ---- The unfold --------------------------------------------- */

  /** 0 → 1 for one glyph, delayed by its distance from the dot. */
  const unfoldOf = (fromDot: number) => {
    const delay = Math.abs(fromDot) * BEATS.unfoldStagger;
    const [a, b] = BEATS.unfold;
    return interpolate(frame, [a + delay, b + delay], [0, 1], { ...clamp, easing: OUT });
  };

  const styles: FrameStyles = {
    top: {
      opacity: interpolate(frame, [...BEATS.meta], [0, 1], { ...clamp, easing: OUT }),
    },

    eyebrow: {
      opacity: interpolate(frame, [...BEATS.eyebrow], [0, 1], { ...clamp, easing: OUT }),
    },

    ruleTop: {
      transformOrigin: 'left center',
      scale: `${interpolate(frame, [...BEATS.ruleTop], [0, 1], { ...clamp, easing: DRAW })} 1`,
    },

    // Drawn from the right, against the top rule — the two hairlines
    // close the frame from opposite ends.
    ruleMid: {
      transformOrigin: 'right center',
      scale: `${interpolate(frame, [...BEATS.ruleMid], [0, 1], { ...clamp, easing: DRAW })} 1`,
    },

    /* The width axis opens as the mark unfolds, so the letters widen at
       the same rate they travel outward and it reads as one move. */
    lineStyle: () => {
      const p = unfoldOf(0);
      return {
        fontStretch: `${interpolate(p, [0, 1], [STRETCH_FROM, STRETCH_TO])}%`,
      };
    },

    /* Each glyph starts gathered toward the dot and slides out to its
       final place, blurring off as it lands. The stagger is keyed to
       distance from the dot, so the mark grows from the point outward
       in both directions at once. */
    tokenStyle: (at: TokenAddress) => {
      if (at.token.kind === 'dot') {
        return {
          scale: `${dotScale}`,
          opacity: dotIn,
        };
      }

      const p = unfoldOf(at.fromDot);
      const spec = specFor(at.token.run);
      // Negative = left of the dot, so the sign carries the direction.
      const reach = -at.fromDot * BEATS.unfoldReach;
      const blur = (1 - p) * GLYPH_BLUR;

      return {
        opacity: p,
        translate: `${(reach * (1 - p)).toFixed(4)}em 0`,
        letterSpacing: `${(spec.tracking + TRACK_DELTA * (1 - p)).toFixed(4)}em`,
        // Skip the filter entirely once it stops being visible — a live
        // filter on every glyph is the most expensive thing in the frame.
        filter: blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : undefined,
      };
    },

    /* The dot's slot carries the axis: a hairline anchored to the dot's
       centre that scales out to both gutters, then recedes as the
       letters land on it. */
    dotContent: (
      <>
        <span
          className="wordmark__axis"
          style={{ scale: `${axisScale} 1`, opacity: axisOpacity }}
        />
        <span className="wordmark__disc" />
      </>
    ),
  };

  const counterValue = Math.round(
    interpolate(frame, [...BEATS.counter], [0, 100], { ...clamp, easing: IN_OUT }),
  );

  const pad = padFor(width);

  return (
    <AbsoluteFill style={{ backgroundColor: 'var(--ink)' }}>
      <div
        className="stage"
        style={{
          // svh would resolve against the browser window rather than the
          // composition box — pin both to the real composition size.
          ['--pad' as string]: `${pad}px`,
          width,
          height,
          minHeight: height,
          opacity: ready ? 1 : 0,
        }}
      >
        <HeroFrame mode="ghost" width={width} height={height} styles={styles}>
          <span
            className="meta"
            style={{
              position: 'absolute',
              right: pad,
              bottom: pad,
              opacity: interpolate(
                frame,
                [BEATS.counter[0], BEATS.counter[0] + 10, ...BEATS.counterOut],
                [0, 1, 1, 0],
                clamp,
              ),
            }}
          >
            {String(counterValue).padStart(3, '0')}
            <span className="meta--accent"> — 100</span>
          </span>
        </HeroFrame>
      </div>
    </AbsoluteFill>
  );
};

export const NEXOO_LOADER_DURATION = LOADER_FRAMES;
