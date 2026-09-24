import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../shared/tokens.css';
import '../shared/hero.css';
import './styles/site.css';
import './styles/services.css';

import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { LoaderStage } from './components/LoaderStage';
import { usePrefersReducedMotion } from './lib/hooks';
import { fontsReady } from '../shared/wordmark';

type Phase = 'fonts' | 'loader' | 'hero';

/** A font CDN must never hold the page hostage. */
const FONT_BUDGET_MS = 1600;

export const App: React.FC = () => {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('fonts');
  const [entered, setEntered] = useState(false);
  /* Bumped when the real typefaces land. The masthead is fitted from
     measured metrics, so a font arriving after the budget has already
     started the page must re-render the tree to force a re-measure —
     otherwise the wordmark keeps a size derived from fallback metrics
     and stops being flush. The value itself is never read; the
     re-render it causes is the point. */
  const [, setFontEpoch] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const go = () => {
      if (!alive) return;
      alive = false;
      // Reduced motion skips the intro entirely and lands on the hero —
      // the loader is expressive, not informational.
      if (reduced) {
        setPhase('hero');
        setEntered(true);
      } else {
        setPhase('loader');
      }
    };

    fontsReady().then(() => {
      setFontEpoch((n) => n + 1);
      go();
    });

    const budget = window.setTimeout(go, FONT_BUDGET_MS);
    return () => {
      window.clearTimeout(budget);
    };
  }, [reduced]);

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
