/**
 * NEXOO loader — choreography.
 *
 * 156 frames @ 60fps = 2.6s, of which the last ~0.3s is a settled hold
 * the DOM hero takes over from. Every number below is a frame.
 *
 * The concept: the dot comes first. A single red point arrives on empty
 * black, compresses, and fires a hairline axis out to both gutters —
 * then the wordmark unfolds ALONG that axis, each glyph staggered by its
 * distance from the dot, so NEXOO travels left and AGENCY travels right
 * out of the same origin. Underneath, Archivo's wdth axis opens from
 * 62% to 100%, so the mark physically widens into place rather than
 * fading or scaling.
 *
 * Nothing moves to a position it will not still occupy in the hero.
 */

export const LOADER_FPS = 60;
export const LOADER_FRAMES = 156;

/** Frame at which the DOM hero is already pixel-identical underneath. */
export const HANDOFF_FRAME = 138;

export const BEATS = {
  /** The point arrives — fast and confident. It is the first thing on
   *  screen, so it cannot afford half a second of being a faint speck. */
  dotIn: [0, 16] as const,
  /** It compresses, then releases — the impulse that fires the axis. */
  dotCharge: [16, 26] as const,
  /** Its resting pulse, which the hero then carries on. */
  dotSettle: [96, 138] as const,

  /** Hairline axis shoots out of the dot to both gutters, then recedes. */
  axis: [20, 52] as const,
  axisOut: [70, 96] as const,

  /** The mark unfolds outward. Per-glyph offset = |distance from dot|. */
  unfold: [26, 82] as const,
  unfoldStagger: 2.6,
  /** How far, in em, the furthest glyph starts from its final place. */
  unfoldReach: 0.46,

  /** Hairlines settle into the positions they hold in the hero. */
  ruleTop: [58, 94] as const,
  ruleMid: [66, 102] as const,

  /** Corner rails + eyebrow arrive last, quietly. */
  meta: [76, 102] as const,
  eyebrow: [84, 110] as const,

  /** The only element that says "loading". It lives where the CTA lands. */
  counter: [16, 110] as const,
  counterOut: [112, 128] as const,
} as const;

/** wdth axis (Archivo ships 62…125). Condensed → normal. */
export const STRETCH_FROM = 62;
export const STRETCH_TO = 100;

/** Tracking travels with the width axis so the opening reads as one move. */
export const TRACK_DELTA = -0.055;

/**
 * Peak blur on an entering glyph, in px. Was 9, which kept the wordmark
 * illegible well past the point where it should have been readable — on
 * a dark ground a blurred, half-transparent glyph is indistinguishable
 * from nothing, and the whole intro read as a black screen.
 */
export const GLYPH_BLUR = 5;

/**
 * Period of the dot's resting pulse, in frames. Deliberately equal to
 * (HANDOFF_FRAME - dotSettle[0]) so the pulse completes a whole number
 * of cycles exactly at the hand-off and the dot is at scale 1 when the
 * hero takes it over. Left arbitrary, the loader handed the dot over
 * mid-breath and it popped by ~3.5% — on the one element the eye is on.
 */
export const DOT_PULSE_FRAMES = HANDOFF_FRAME - BEATS.dotSettle[0];
