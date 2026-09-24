/**
 * NEXOO AGENCY — single source of truth for anything the loader, the
 * hero and the services section must agree on. If a value lives here,
 * no other file is allowed to keep its own copy.
 */

export const WORDMARK_A = 'NEXOO';
export const WORDMARK_B = 'AGENCY';

export const CITY = 'Valence';
export const REGION = 'Drôme';

export const EYEBROW = `(01) — Studio créatif · ${CITY}, ${REGION}`;
export const CLAIM_BEFORE = 'Le digital, mis en ';
export const CLAIM_EM = 'mouvement';
export const CLAIM_AFTER = '.';

export const CTA_LABEL = 'Découvrir le studio';

export const META_MARK = 'Nexoo®';
export const META_RIGHT = ['Index', 'Showreel 2026'];
export const META_PLACE = `${CITY} — ${REGION} — France`;

/** Compact/wide breakpoint, owned by HeroFrame (see shared/hero.css). */
export const MOBILE_MAX = 760;

/**
 * JS mirror of `--pad` in shared/tokens.css: clamp(20px, 3.6vw, 64px).
 * The hero and the loader both push this back into the custom property
 * inline, so the CSS clamp and this function cannot drift apart.
 */
export const padFor = (viewportWidth: number): number =>
  Math.round(Math.max(20, Math.min(64, viewportWidth * 0.036)));

/* ---------------------------------------------------------------- */
/*  Masthead                                                         */
/* ---------------------------------------------------------------- */

/** Typographic spec of a run of glyphs. */
export type Spec = {
  weight: number;
  /** wdth axis, in percent — Archivo ships 62…125. */
  stretch: number;
  /** letter-spacing, in em */
  tracking: number;
};

/* NEXOO and AGENCY share one size and one line; the weight contrast is
   what creates the hierarchy, so the wordmark reads as a single mark
   rather than two stacked words. */
export const SPEC_A: Spec = { weight: 760, stretch: 100, tracking: -0.03 };
export const SPEC_B: Spec = { weight: 280, stretch: 100, tracking: 0.005 };

/** The dot's slot in the line, and the disc drawn inside it — in em. */
export const DOT_SLOT_EM = 0.9;
export const DOT_SIZE_EM = 0.36;
/**
 * Optical centring. The dot's slot centres on the flex line's cross
 * axis, which is not where the caps are: measured against Archivo's cap
 * height at 760 weight, the disc landed 0.199em high. Everything here is
 * em-proportional, so this correction holds at every size.
 */
export const DOT_RISE_EM = 0.101;

export type Token =
  | { kind: 'char'; char: string; run: 'a' | 'b' }
  | { kind: 'dot' };

const chars = (text: string, run: 'a' | 'b'): Token[] =>
  [...text].map((char) => ({ kind: 'char', char, run }) as Token);

export const specFor = (run: 'a' | 'b'): Spec => (run === 'a' ? SPEC_A : SPEC_B);

/**
 * Wide: one flush line, NEXOO ● AGENCY.
 * Compact: NEXOO, then ● AGENCY beneath it — on a phone the single line
 * would shrink the mark to body-text size, so the dot leads the second
 * line instead and both lines stay flush to the gutters.
 */
export const MASTHEAD_WIDE: Token[][] = [
  [...chars(WORDMARK_A, 'a'), { kind: 'dot' }, ...chars(WORDMARK_B, 'b')],
];

export const MASTHEAD_COMPACT: Token[][] = [
  chars(WORDMARK_A, 'a'),
  [{ kind: 'dot' }, ...chars(WORDMARK_B, 'b')],
];

/** Stable key for caching a line's measured metrics. */
export const lineKey = (tokens: Token[]): string =>
  tokens.map((t) => (t.kind === 'dot' ? '●' : `${t.run}:${t.char}`)).join('|');

/* Glyph-box geometry. The masthead line-height is tighter than the em,
   so each glyph box is padded out (and pulled back with a negative
   margin) to give the loader's wipe something to clip against without
   shaving a cap or a bowl. The loader's animation is positioned against
   this same box, so the value is emitted as a custom property by
   <Masthead> rather than written into the stylesheet — one source. */
export const LINE_HEIGHT_EM = 0.82;
export const CHAR_PAD_EM = 0.14;
export const CHAR_BOX_EM = LINE_HEIGHT_EM + CHAR_PAD_EM * 2;

/** Share of viewport height the masthead may occupy before it is capped. */
export const MASTHEAD_HEIGHT_SHARE = 0.44;

/* ---------------------------------------------------------------- */
/*  Services                                                         */
/* ---------------------------------------------------------------- */

export type ServiceId = 'flyer' | 'carte' | 'web' | 'identite' | 'textile';

export type Service = {
  id: ServiceId;
  index: string;
  title: string;
  /** One line. Not a marketing paragraph. */
  note: string;
};

export const SERVICES: Service[] = [
  { id: 'flyer', index: '01', title: 'Flyer', note: 'Affiches, dépliants, éditions courtes' },
  { id: 'carte', index: '02', title: 'Carte de visite', note: 'Papiers, finitions, gravure' },
  { id: 'web', index: '03', title: 'Site internet', note: 'Conception, interface, développement' },
  { id: 'identite', index: '04', title: 'Identité visuelle', note: 'Marque, système, déclinaisons' },
  { id: 'textile', index: '05', title: 'Support textile', note: 'Sérigraphie, broderie, série' },
];

export const SERVICES_EYEBROW = '(02) — Services';
export const SERVICES_TITLE = 'Ce que nous faisons';
