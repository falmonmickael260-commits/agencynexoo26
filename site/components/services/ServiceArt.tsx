import React from 'react';
import type { ServiceId } from '../../../shared/brand';

/**
 * Service artwork — real pieces, drawn here.
 *
 * The first version of this was five thin-line diagrams and it read as
 * documentation, not as design work. These are built as objects instead:
 * printed pieces sit on actual paper stock (the cream substrate against
 * the ink ground is what makes them read as print), screen work sits in
 * a dark frame, and everything is layered with an offset edge rather
 * than a blur filter — cheaper, and it matches the graphic language.
 *
 * Each piece is split into depth layers via data-layer, which the
 * section's pointer parallax drives. No per-shape JavaScript.
 */

const INK = '#0A0A0B';
const PAPER = 'var(--paper)';
const FAINT = 'var(--faint)';
const RED = 'var(--accent)';
/** Paper stock, a touch warmer and duller than the UI's paper. */
const STOCK = '#E8E4DC';
const STOCK_EDGE = '#C9C4BA';

const MONO = 'var(--font-mono)';
const DISPLAY = 'var(--font-display)';

type LayerProps = { depth: number; children: React.ReactNode; transform?: string };

/** One parallax plane. `depth` is its travel, in px per unit of pointer. */
const Layer: React.FC<LayerProps> = ({ depth, children, transform }) => (
  <g data-layer style={{ ['--depth' as string]: depth }} transform={transform}>
    {children}
  </g>
);

/* ---------------------------------------------------------------- */
/*  01 — Flyer                                                       */
/* ---------------------------------------------------------------- */

const Flyer = () => (
  <>
    {/* The rest of the run, stacked and cropped */}
    <Layer depth={3} transform="rotate(-11 280 350)">
      <rect x={96} y={150} width={300} height={424} fill={STOCK_EDGE} />
      <rect x={96} y={150} width={300} height={424} fill={INK} opacity={0.42} />
    </Layer>

    <Layer depth={6} transform="rotate(-6 280 350)">
      <rect x={120} y={132} width={300} height={424} fill={STOCK_EDGE} />
      <rect x={120} y={132} width={300} height={424} fill={INK} opacity={0.2} />
    </Layer>

    {/* The face of the piece */}
    <Layer depth={11} transform="rotate(-2.2 280 350)">
      <rect x={146} y={116} width={300} height={424} fill={STOCK} />

      <text x={172} y={152} fill={INK} fontFamily={MONO} fontSize={12} letterSpacing={2.2}>
        VALENCE · DRÔME
      </text>
      <line x1={172} y1={166} x2={420} y2={166} stroke={INK} strokeOpacity={0.25} />

      {/* The date, set as the poster's whole subject */}
      <text
        x={166}
        y={352}
        fill={INK}
        fontFamily={DISPLAY}
        fontSize={200}
        fontWeight={780}
        letterSpacing={-12}
      >
        26
      </text>

      <circle cx={392} cy={232} r={38} fill={RED} />

      <text
        x={172}
        y={402}
        fill={INK}
        fontFamily={DISPLAY}
        fontSize={34}
        fontWeight={300}
        letterSpacing={-0.8}
      >
        Octobre
      </text>

      <g stroke={INK} strokeOpacity={0.22}>
        <line x1={172} y1={436} x2={420} y2={436} />
        <line x1={172} y1={450} x2={368} y2={450} />
        <line x1={172} y1={464} x2={396} y2={464} />
      </g>

      <text x={172} y={514} fill={INK} fontFamily={MONO} fontSize={11} letterSpacing={2}>
        NEXOO
      </text>
      <circle cx={232} cy={510} r={5} fill={RED} />
    </Layer>
  </>
);

/* ---------------------------------------------------------------- */
/*  02 — Carte de visite                                             */
/* ---------------------------------------------------------------- */

const Carte = () => (
  <>
    {/* Reverse, in the second colour of the system */}
    <Layer depth={4} transform="rotate(-13 280 350)">
      <rect x={110} y={236} width={372} height={224} rx={4} fill={RED} />
      <circle cx={296} cy={348} r={38} fill={STOCK} />
    </Layer>

    {/* Face, with the edge-paint visible on the stock */}
    <Layer depth={10} transform="rotate(5 280 350)">
      <rect x={84} y={252} width={372} height={230} rx={4} fill={STOCK_EDGE} />
      <rect x={84} y={252} width={372} height={224} rx={4} fill={STOCK} />

      <circle cx={122} cy={296} r={13} fill={RED} />
      <text
        x={146}
        y={303}
        fill={INK}
        fontFamily={DISPLAY}
        fontSize={27}
        fontWeight={760}
        letterSpacing={-1}
      >
        NEXOO
      </text>

      <line x1={122} y1={332} x2={418} y2={332} stroke={INK} strokeOpacity={0.2} />

      <text x={122} y={382} fill={INK} fontFamily={DISPLAY} fontSize={19} fontWeight={300}>
        Studio créatif
      </text>
      <text
        x={122}
        y={412}
        fill={INK}
        opacity={0.55}
        fontFamily={MONO}
        fontSize={11}
        letterSpacing={1.8}
      >
        VALENCE — DRÔME
      </text>
      <text
        x={122}
        y={436}
        fill={INK}
        opacity={0.55}
        fontFamily={MONO}
        fontSize={11}
        letterSpacing={1.8}
      >
        NEXOO.FR
      </text>
    </Layer>
  </>
);

/* ---------------------------------------------------------------- */
/*  03 — Site internet                                               */
/* ---------------------------------------------------------------- */

const Web = () => (
  <>
    <defs>
      {/* The screen clips its own contents. Sized by eye, the quoted
          masthead ran past the window edge — font metrics are not
          something to guess at inside a drawing. */}
      <clipPath id="nx-web-screen">
        <rect x={64} y={164} width={432} height={278} />
      </clipPath>
      <clipPath id="nx-web-phone">
        <rect x={336} y={358} width={140} height={248} rx={16} />
      </clipPath>
    </defs>

    {/* Desktop frame, showing this very page */}
    <Layer depth={5}>
      <rect x={64} y={132} width={432} height={310} rx={5} fill="#141416" stroke={FAINT} />
      <line x1={64} y1={164} x2={496} y2={164} stroke={FAINT} />
      <circle cx={82} cy={148} r={3.4} fill={PAPER} opacity={0.3} />
      <circle cx={94} cy={148} r={3.4} fill={PAPER} opacity={0.3} />
      <circle cx={106} cy={148} r={3.4} fill={PAPER} opacity={0.3} />

      <g clipPath="url(#nx-web-screen)">
        <text
          x={90}
          y={196}
          fill={PAPER}
          opacity={0.4}
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={1.6}
        >
          NEXOO®
        </text>
        <line x1={90} y1={206} x2={470} y2={206} stroke={FAINT} />

        {/* The masthead, quoted at small scale and set flush to the
            window's own gutters, exactly as the real hero is. */}
        <text
          x={90}
          y={306}
          fill={PAPER}
          fontFamily={DISPLAY}
          fontSize={41}
          fontWeight={760}
          letterSpacing={-1.2}
        >
          NEXOO
        </text>
        <circle cx={254} cy={292} r={8.5} fill={RED} />
        <text
          x={274}
          y={306}
          fill={PAPER}
          fontFamily={DISPLAY}
          fontSize={41}
          fontWeight={280}
        >
          AGENCY
        </text>

        <line x1={90} y1={342} x2={470} y2={342} stroke={FAINT} />
        <rect x={90} y={362} width={104} height={7} fill={PAPER} opacity={0.3} />
        <rect x={90} y={378} width={72} height={7} fill={PAPER} opacity={0.15} />
        <rect x={396} y={360} width={74} height={26} rx={13} fill="none" stroke={FAINT} />
      </g>
    </Layer>

    {/* Handset, overlapping the frame */}
    <Layer depth={14} transform="rotate(-4 400 480)">
      <rect x={336} y={358} width={140} height={248} rx={16} fill="#17171A" stroke={FAINT} />
      <g clipPath="url(#nx-web-phone)">
        <rect x={386} y={370} width={40} height={5} rx={2.5} fill={PAPER} opacity={0.25} />
        {/* Stacked, the way the real masthead sets on a phone */}
        <text
          x={352}
          y={470}
          fill={PAPER}
          fontFamily={DISPLAY}
          fontSize={22}
          fontWeight={760}
          letterSpacing={-0.7}
        >
          NEXOO
        </text>
        <circle cx={360} cy={491} r={6} fill={RED} />
        <text
          x={374}
          y={499}
          fill={PAPER}
          fontFamily={DISPLAY}
          fontSize={22}
          fontWeight={280}
        >
          AGENCY
        </text>
        <line x1={352} y1={524} x2={460} y2={524} stroke={FAINT} />
        <rect x={352} y={542} width={64} height={5} fill={PAPER} opacity={0.25} />
        <rect x={352} y={554} width={44} height={5} fill={PAPER} opacity={0.12} />
      </g>
    </Layer>
  </>
);

/* ---------------------------------------------------------------- */
/*  04 — Identité visuelle                                           */
/* ---------------------------------------------------------------- */

const Identite = () => (
  <>
    {/* Specimen board */}
    <Layer depth={4} transform="rotate(-2 280 350)">
      <rect x={72} y={120} width={416} height={460} fill={STOCK} />

      <text x={104} y={158} fill={INK} opacity={0.5} fontFamily={MONO} fontSize={10} letterSpacing={2}>
        SYSTÈME — 01 / MARQUE
      </text>
      <line x1={104} y1={172} x2={456} y2={172} stroke={INK} strokeOpacity={0.2} />

      {/* The mark, under construction */}
      <g stroke={INK} strokeOpacity={0.18} strokeDasharray="3 5">
        <line x1={104} y1={268} x2={456} y2={268} />
        <line x1={196} y1={196} x2={196} y2={340} />
      </g>
      <circle cx={196} cy={268} r={62} fill="none" stroke={INK} strokeOpacity={0.22} />
      <circle cx={196} cy={268} r={40} fill="none" stroke={INK} strokeOpacity={0.35} />
      <circle cx={196} cy={268} r={22} fill={RED} />

      {/* Type specimen */}
      <text x={300} y={300} fill={INK} fontFamily={DISPLAY} fontSize={116} fontWeight={760} letterSpacing={-5}>
        Aa
      </text>
      <text x={302} y={326} fill={INK} opacity={0.5} fontFamily={MONO} fontSize={10} letterSpacing={2}>
        ARCHIVO 760
      </text>

      <line x1={104} y1={372} x2={456} y2={372} stroke={INK} strokeOpacity={0.2} />

      {/* Palette */}
      <rect x={104} y={398} width={76} height={76} fill={INK} />
      <rect x={192} y={398} width={76} height={76} fill={RED} />
      <rect x={280} y={398} width={76} height={76} fill={STOCK} stroke={INK} strokeOpacity={0.25} />
      <text x={104} y={496} fill={INK} opacity={0.5} fontFamily={MONO} fontSize={9} letterSpacing={1.6}>
        ENCRE / SIGNAL / PAPIER
      </text>

      {/* The mark, ranged down to its smallest usable size */}
      <circle cx={392} cy={432} r={18} fill={INK} />
      <circle cx={428} cy={432} r={11} fill={INK} opacity={0.6} />
      <circle cx={452} cy={432} r={6} fill={INK} opacity={0.35} />
    </Layer>
  </>
);

/* ---------------------------------------------------------------- */
/*  05 — Support textile                                             */
/* ---------------------------------------------------------------- */

const TEE = 'M188 168 L128 196 L104 268 L156 288 L156 520 Q280 546 404 520 L404 288 L456 268 L432 196 L372 168 Q280 214 188 168 Z';

const Textile = () => (
  <>
    {/* Folded second piece, behind */}
    <Layer depth={3} transform="rotate(8 420 520)">
      <rect x={352} y={452} width={168} height={132} rx={3} fill={STOCK_EDGE} />
      <rect x={352} y={452} width={168} height={120} rx={3} fill={STOCK} />
      <line x1={352} y1={506} x2={520} y2={506} stroke={INK} strokeOpacity={0.14} />
      <circle cx={436} cy={484} r={9} fill={RED} />
    </Layer>

    {/* The printed piece */}
    <Layer depth={9}>
      <path d={TEE} fill={STOCK} />
      {/* Fabric fall, as flat shading rather than a gradient */}
      <path d="M156 288 L156 520 Q212 534 268 532 L268 290 Z" fill={INK} opacity={0.05} />
      <path d="M404 288 L404 520 Q352 534 300 532 L300 290 Z" fill={INK} opacity={0.03} />
      <path d="M188 168 Q280 214 372 168" fill="none" stroke={INK} strokeOpacity={0.22} />
      <path d={TEE} fill="none" stroke={INK} strokeOpacity={0.18} strokeLinejoin="round" />

      {/* The print */}
      <text
        x={198}
        y={362}
        fill={INK}
        fontFamily={DISPLAY}
        fontSize={44}
        fontWeight={760}
        letterSpacing={-2}
      >
        NEXOO
      </text>
      <circle cx={280} cy={396} r={13} fill={RED} />
      <text
        x={188}
        y={438}
        fill={INK}
        opacity={0.6}
        fontFamily={MONO}
        fontSize={11}
        letterSpacing={3}
      >
        VALENCE · DRÔME
      </text>

      {/* Hem stitching */}
      <path
        d="M162 500 Q280 524 398 500"
        fill="none"
        stroke={INK}
        strokeOpacity={0.16}
        strokeDasharray="5 5"
      />
    </Layer>

    {/* Hang tag */}
    <Layer depth={16} transform="rotate(-12 150 470)">
      <line x1={150} y1={404} x2={150} y2={438} stroke={FAINT} />
      <rect x={110} y={438} width={84} height={112} rx={3} fill={INK} stroke={FAINT} />
      <circle cx={152} cy={452} r={4} fill="none" stroke={FAINT} />
      <circle cx={152} cy={486} r={11} fill={RED} />
      <rect x={126} y={510} width={52} height={4} fill={PAPER} opacity={0.4} />
      <rect x={126} y={520} width={36} height={4} fill={PAPER} opacity={0.2} />
    </Layer>
  </>
);

/**
 * Each piece gets its own tightly-bounded viewBox. Sharing one 560x700
 * frame left every composition padded with dead space, so the artwork
 * rendered small inside its column no matter how wide the column was.
 * The differing aspect ratios are wanted: a flyer is not a business
 * card, and the spreads read better when each piece keeps its format.
 */
const ART: Record<ServiceId, { Art: React.FC; viewBox: string }> = {
  flyer: { Art: Flyer, viewBox: '62 96 418 508' },
  carte: { Art: Carte, viewBox: '72 218 424 300' },
  web: { Art: Web, viewBox: '52 122 456 500' },
  identite: { Art: Identite, viewBox: '62 110 436 482' },
  textile: { Art: Textile, viewBox: '96 152 438 448' },
};

export const ServiceArt: React.FC<{ id: ServiceId }> = ({ id }) => {
  const { Art, viewBox } = ART[id];
  return (
    <svg
      className="art"
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <Art />
    </svg>
  );
};
