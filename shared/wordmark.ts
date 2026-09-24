import {
  DOT_SLOT_EM,
  LINE_HEIGHT_EM,
  lineKey,
  specFor,
  type Token,
} from './brand';

/**
 * Fits the masthead flush to the gutters.
 *
 * The line mixes two type specs and a graphic slot for the dot, so it is
 * measured by building the exact structure that gets rendered — a flex
 * line of per-token inline-blocks — and reading the ink extent from the
 * first token's left edge to the last token's right edge.
 *
 * Measuring a plain text run instead is off by several pixels at this
 * size: kerning does not apply across element boundaries, and trailing
 * letter-spacing falls outside the last glyph. At a 360px wordmark that
 * error is plainly visible against the gutter.
 *
 * The loader (inside <Player>) and the hero both call this in the same
 * document with the same fonts, so both get identical numbers. That is
 * what makes the hand-off seamless.
 */

const REF = 1000;

export type LineMetrics = {
  /** Ink extent in em: first token's left edge to the last one's right. */
  ink: number;
  /** Dead space after the last token, in em (trailing letter-spacing). */
  trailing: number;
};

const cache = new Map<string, LineMetrics>();

const fallbackFor = (tokens: Token[]): LineMetrics => ({
  ink: tokens.reduce((sum, t) => sum + (t.kind === 'dot' ? DOT_SLOT_EM : 0.72), 0),
  trailing: 0,
});

/** Builds one rendered token. Kept here so the probe and the real
 *  masthead cannot diverge — see <Masthead>, which renders the same. */
const buildToken = (token: Token, doc: Document): HTMLElement => {
  if (token.kind === 'dot') {
    const slot = doc.createElement('span');
    slot.className = 'wordmark__dot';
    return slot;
  }
  const spec = specFor(token.run);
  const glyph = doc.createElement('span');
  glyph.className = 'wordmark__char';
  glyph.style.cssText = [
    `font-weight:${spec.weight}`,
    `font-stretch:${spec.stretch}%`,
    `letter-spacing:${spec.tracking}em`,
  ].join(';');
  glyph.textContent = token.char;
  return glyph;
};

export const lineMetrics = (tokens: Token[]): LineMetrics => {
  const key = lineKey(tokens);
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  if (typeof document === 'undefined' || !document.body || tokens.length === 0) {
    return fallbackFor(tokens);
  }

  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;';

  const line = document.createElement('span');
  line.className = 'wordmark__line';
  line.style.cssText = [
    'position:absolute',
    'white-space:pre',
    `line-height:${LINE_HEIGHT_EM}`,
    `font-size:${REF}px`,
  ].join(';');

  for (const token of tokens) line.appendChild(buildToken(token, document));

  probe.appendChild(line);
  document.body.appendChild(probe);

  const items = line.children;
  const first = items[0].getBoundingClientRect();
  const last = items[items.length - 1].getBoundingClientRect();
  const box = line.getBoundingClientRect();

  const ink = (last.right - first.left) / REF;
  /* Whether a flex line emits letter-spacing after its final item is not
     worth reasoning about — measure the dead space and subtract exactly
     that, so a right-aligned line sits on the gutter either way. */
  const trailing = Math.max(0, (box.right - last.right) / REF);

  probe.remove();

  if (!Number.isFinite(ink) || ink <= 0) return fallbackFor(tokens);

  const metrics: LineMetrics = { ink, trailing };
  cache.set(key, metrics);
  return metrics;
};

/** Font-size, in px, that makes `tokens` exactly `availableWidth` wide. */
export const fitFontSize = (tokens: Token[], availableWidth: number): number =>
  Math.max(1, availableWidth) / lineMetrics(tokens).ink;

/** Drop cached metrics once the real webfont has arrived. */
export const resetWordmarkMetrics = () => cache.clear();

/* ---------------------------------------------------------------- */

const FACES = [
  '760 100px Archivo',
  '280 100px Archivo',
  'italic 400 100px "Instrument Serif"',
  '400 100px "JetBrains Mono"',
];

let readyPromise: Promise<void> | null = null;

/**
 * Resolves once every face the masthead depends on is usable. Anything
 * that measures or animates type waits on this, so no frame is ever
 * composed against fallback metrics.
 */
export const fontsReady = (): Promise<void> => {
  if (readyPromise) return readyPromise;

  if (typeof document === 'undefined' || !('fonts' in document)) {
    readyPromise = Promise.resolve();
    return readyPromise;
  }

  readyPromise = Promise.all(
    FACES.map((f) => document.fonts.load(f).catch(() => undefined)),
  )
    .then(() => document.fonts.ready)
    .then(() => {
      resetWordmarkMetrics();
    })
    // A font CDN hiccup must never leave the visitor on a black screen.
    .catch(() => undefined);

  return readyPromise;
};
