import React from 'react';
import {
  CHAR_PAD_EM,
  DOT_RISE_EM,
  DOT_SIZE_EM,
  DOT_SLOT_EM,
  EYEBROW,
  LINE_HEIGHT_EM,
  MASTHEAD_COMPACT,
  MASTHEAD_HEIGHT_SHARE,
  MASTHEAD_WIDE,
  WORDMARK_A,
  WORDMARK_B,
  lineKey,
  specFor,
  type Token,
} from './brand';
import { fitFontSize, lineMetrics } from './wordmark';

export type TokenAddress = {
  /** Index of the line this token sits on. */
  line: number;
  /** Index within the line. */
  i: number;
  /** Index across the whole masthead, ignoring line breaks. */
  flat: number;
  /** Signed distance from the dot, in token steps. The loader keys its
   *  stagger off this: the wordmark grows outward from the dot. */
  fromDot: number;
  token: Token;
};

type Props = {
  /** Content width between the gutters — the mark is fitted flush to it. */
  availableWidth: number;
  /** Viewport height, so a short window can cap the type size. */
  availableHeight: number;
  compact: boolean;
  /** Per-token style hook (loader choreography, hero pointer parallax). */
  tokenStyle?: (at: TokenAddress) => React.CSSProperties | undefined;
  /** Per-line style hook (the wdth axis opening during the loader). */
  lineStyle?: (line: number) => React.CSSProperties | undefined;
  eyebrowStyle?: React.CSSProperties;
  /** Rendered inside the dot's slot — the hero's live, reactive dot. */
  dotContent?: React.ReactNode;
  dotStyle?: React.CSSProperties;
};

/**
 * The masthead is the one element that exists in BOTH the Remotion
 * loader and the DOM hero, at the same coordinates. Rendering it from a
 * single component is what makes the hand-off invisible: the loader's
 * last frame and the hero's first frame are the same markup, the same
 * stylesheet and the same fitted font-size.
 */
export const Masthead: React.FC<Props> = ({
  availableWidth,
  availableHeight,
  compact,
  tokenStyle,
  lineStyle,
  eyebrowStyle,
  dotContent,
  dotStyle,
}) => {
  const lines = compact ? MASTHEAD_COMPACT : MASTHEAD_WIDE;

  // Every line is fitted flush, then the set is capped together so the
  // mark cannot crowd the claim and the CTA out of a short window.
  const raw = lines.map((tokens) => fitFontSize(tokens, availableWidth));
  const budget =
    (availableHeight * MASTHEAD_HEIGHT_SHARE) / (LINE_HEIGHT_EM * lines.length);
  const scale = Math.min(1, budget / Math.max(...raw));
  const sizes = raw.map((size) => Math.max(12, size * scale));

  const dotFlat = lines.flat().findIndex((t) => t.kind === 'dot');
  let flat = 0;

  return (
    <>
      <p className="meta" style={eyebrowStyle}>
        {EYEBROW}
      </p>

      <h1 className="wordmark" aria-label={`${WORDMARK_A} ${WORDMARK_B}`}>
        {lines.map((tokens, line) => (
          <span
            key={lineKey(tokens)}
            className="wordmark__line"
            data-line={line}
            aria-hidden="true"
            style={{
              fontSize: `${sizes[line]}px`,
              lineHeight: LINE_HEIGHT_EM,
              // Consumed by .wordmark__char, .wordmark__dot and the
              // loader's geometry — emitted from the constants the
              // fitter measured against, never duplicated in CSS.
              ['--char-pad' as string]: `${CHAR_PAD_EM}em`,
              ['--dot-slot' as string]: `${DOT_SLOT_EM}em`,
              ['--dot-size' as string]: `${DOT_SIZE_EM}em`,
              ['--dot-rise' as string]: `${DOT_RISE_EM}em`,
              ...lineStyle?.(line),
            }}
          >
            {tokens.map((token, i) => {
              const at: TokenAddress = {
                line,
                i,
                flat,
                fromDot: flat - dotFlat,
                token,
              };
              flat += 1;

              if (token.kind === 'dot') {
                return (
                  <span
                    key={`dot-${line}`}
                    className="wordmark__dot"
                    style={{ ...dotStyle, ...tokenStyle?.(at) }}
                  >
                    {dotContent ?? <span className="wordmark__disc" />}
                  </span>
                );
              }

              const spec = specFor(token.run);
              return (
                <span
                  key={`${line}-${i}`}
                  className="wordmark__char"
                  data-run={token.run}
                  style={{
                    // Straight from the spec the fitter measured against.
                    fontWeight: spec.weight,
                    fontStretch: `${spec.stretch}%`,
                    letterSpacing: `${spec.tracking}em`,
                    ...tokenStyle?.(at),
                  }}
                >
                  {token.char}
                </span>
              );
            })}
          </span>
        ))}
      </h1>
    </>
  );
};

/** Dead space after a line's last token, in em — used to keep a
 *  right-aligned line's ink edge on the gutter. */
export const trailingOf = (tokens: Token[]) => lineMetrics(tokens).trailing;
