import React from 'react';
import {
  CLAIM_AFTER,
  CLAIM_BEFORE,
  CLAIM_EM,
  CTA_LABEL,
  META_MARK,
  META_PLACE,
  META_RIGHT,
  MOBILE_MAX,
  padFor,
} from './brand';
import { Masthead, type TokenAddress } from './Masthead';

/**
 * The hero frame, rendered identically by the Remotion loader and by the
 * live site.
 *
 * This exists for one reason: the loader's final frame has to BE the
 * hero, not resemble it. Anything affecting layout — the gutters, the
 * hairlines, the masthead, and critically the height of the footer — is
 * produced by the same code in both, or the mark lands dozens of pixels
 * off and the hand-off shows.
 *
 * The loader therefore renders the real footer too, as an inert ghost at
 * opacity 0, reserving the exact height the claim and CTA will occupy.
 */

export type FrameStyles = {
  top?: React.CSSProperties;
  ruleTop?: React.CSSProperties;
  ruleMid?: React.CSSProperties;
  eyebrow?: React.CSSProperties;
  tokenStyle?: (at: TokenAddress) => React.CSSProperties | undefined;
  lineStyle?: (line: number) => React.CSSProperties | undefined;
  dotStyle?: React.CSSProperties;
  dotContent?: React.ReactNode;
};

type Props = {
  width: number;
  height: number;
  /** 'live' wires up links and entrance classes; 'ghost' is the loader. */
  mode: 'live' | 'ghost';
  entered?: boolean;
  styles?: FrameStyles;
  ctaRef?: React.Ref<HTMLAnchorElement>;
  children?: React.ReactNode;
};

const Arrow = () => (
  <svg className="cta__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M3.5 12.5 12.5 3.5M6 3.5h6.5V10"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="square"
    />
  </svg>
);

export const HeroFrame: React.FC<Props> = ({
  width,
  height,
  mode,
  entered = false,
  styles,
  ctaRef,
  children,
}) => {
  const ghost = mode === 'ghost';
  const pad = padFor(width);
  const available = width - pad * 2;
  /* The single owner of the compact/wide decision. Published as a data
     attribute rather than left to a CSS media query, so the stylesheet
     and the layout maths cannot disagree across the scrollbar band —
     and so the loader switches at the same point the hero does. */
  const compact = width <= MOBILE_MAX;
  const enter = ghost ? '' : 'enter';

  const ctaInner = (
    <>
      <span className="cta__label">{CTA_LABEL}</span>
      <span className="cta__ring" aria-hidden="true">
        <Arrow />
      </span>
    </>
  );

  return (
    <div className="frame" data-compact={compact} data-entered={ghost ? undefined : entered}>
      <header className="frame__top" style={styles?.top}>
        <span className="meta meta--bright">{META_MARK}</span>
        <span className="meta meta--group">
          {META_RIGHT.map((label) => (
            <span className="meta" key={label}>
              {label}
            </span>
          ))}
        </span>
      </header>

      <hr className="rule rule--top" style={styles?.ruleTop} />

      <div className="frame__body">
        <Masthead
          availableWidth={available}
          availableHeight={height}
          compact={compact}
          eyebrowStyle={styles?.eyebrow}
          tokenStyle={styles?.tokenStyle}
          lineStyle={styles?.lineStyle}
          dotStyle={styles?.dotStyle}
          dotContent={styles?.dotContent}
        />
      </div>

      <hr className="rule rule--mid" style={styles?.ruleMid} />

      {/* In ghost mode this row is invisible but fully laid out — it is
          what keeps the masthead at the same height in both layers. */}
      <footer
        className="frame__bottom"
        style={ghost ? { opacity: 0 } : undefined}
        aria-hidden={ghost || undefined}
      >
        <p className={`claim ${enter}`} style={{ ['--d' as string]: '80ms' }}>
          {CLAIM_BEFORE}
          <em>{CLAIM_EM}</em>
          {CLAIM_AFTER}
        </p>

        {!compact && (
          <p className={`meta ${enter}`} style={{ ['--d' as string]: '400ms' }}>
            {META_PLACE}
          </p>
        )}

        {ghost ? (
          <span className="cta">{ctaInner}</span>
        ) : (
          <a
            className={`cta ${enter}`}
            style={{ ['--d' as string]: '240ms' }}
            ref={ctaRef}
            href="#services"
          >
            {ctaInner}
          </a>
        )}
      </footer>

      {compact && (
        <p
          className={`meta ${enter}`}
          style={{
            ['--d' as string]: '420ms',
            paddingTop: 18,
            opacity: ghost ? 0 : undefined,
          }}
          aria-hidden={ghost || undefined}
        >
          {META_PLACE}
        </p>
      )}

      {children}
    </div>
  );
};
