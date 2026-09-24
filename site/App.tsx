import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../shared/tokens.css';
import '../shared/hero.css';
import './styles/site.css';
import './styles/services.css';

import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { LoaderStage } from './components/LoaderStage';
import { usePrefersReducedMotion } from './lib/hooks';
import { fontsReady } from '../shared/wordmark';

type Phase = 'boot' | 'loader' | 'hero';

export const App: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('boot');
  const [entered, setEntered] = useState(false);
  /* Bumped when the real typefaces land. The masthead is fitted from
     measured metrics, so a font arriving after the budget has already
     started the page must re-render the tree to force a re-measure —
     otherwise the wordmark keeps a size derived from fallback metrics
     and stops being flush. The value itself is never read; the
     re-render it causes is the point. */
  const [, setFontEpoch] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  /* Start the intro immediately.
     
     This used to wait for the typefaces before mounting the loader, and
     held an opaque veil in the meantime. The result was up to a second
     of blank black BEFORE a loader whose own first half-second is a
     small dot on black — so the intro read as "nothing happened, then
     the site appeared". Nothing in the first beats needs a font: the dot
     is a CSS circle, and the wordmark is still invisible at that point.

     A layout effect, not an effect: it runs after the hero's ref is
     attached and its box is laid out, which is what LoaderStage measures
     to size the composition — and before the browser paints, so the
     'boot' phase is never actually seen. */
  useLayoutEffect(() => {
    // Reduced motion skips the intro entirely and lands on the hero —
    // the loader is expressive, not informational.
    if (reduced) {
      setPhase('hero');
      setEntered(true);
    } else {
      setPhase('loader');
    }
  }, [reduced]);

  /* The masthead is fitted from measured font metrics. Starting before
     the faces resolve means the first frames are measured against
     fallbacks, so re-render once they land to re-fit. It happens while
     the wordmark is still invisible, so the correction is not seen. */
  useEffect(() => {
    let alive = true;
    fontsReady().then(() => {
      if (alive) setFontEpoch((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  const onHandoff = useCallback(() => setEntered(true), []);
  const onDone = useCallback(() => setPhase('hero'), []);

  return (
    <>
      {/* The hero is in the DOM and fully laid out from the first paint,
          underneath the loader. The loader's final frame is therefore
          not a picture of the hero — it is the hero. */}
      {/* Ink veil. The hero is mounted and laid out from the first paint
          so the loader can measure it, which means it would otherwise be
          VISIBLE during the font wait and then get covered by the intro.
          The veil holds the same ground colour the document already
          painted, so there is no flash and no seam either side of it. */}
      {phase !== 'hero' && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'var(--ink)',
            pointerEvents: 'none',
          }}
        />
      )}

      <main>
        <Hero entered={entered} reduced={reduced} stageRef={heroRef} />
        <Services reduced={reduced} />
      </main>

      {phase === 'loader' && (
        <LoaderStage onHandoff={onHandoff} onDone={onDone} heroRef={heroRef} />
      )}
    </>
  );
};
