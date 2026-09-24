import { useEffect, useLayoutEffect, useState } from 'react';
import { MOBILE_MAX } from '../../shared/brand';
import { setReducedMotion } from './motion';

/**
 * Layout viewport size — deliberately `documentElement.clientWidth`, not
 * `innerWidth`: on a classic scrollbar the two differ by ~15px, and the
 * loader overlay is laid out against the former. Measuring the wrong one
 * makes the Player scale by 0.988 and the hand-off visibly jumps.
 */
export const viewportSize = () => ({
  width: document.documentElement.clientWidth || window.innerWidth,
  height: document.documentElement.clientHeight || window.innerHeight,
});

/** Viewport size, debounced to animation frames. */
export const useViewport = () => {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined' ? { width: 1440, height: 900 } : viewportSize(),
  );

  useLayoutEffect(() => {
    // The FIRST measurement is synchronous and un-debounced on purpose.
    // The initial useState runs before this module's CSS has applied, so
    // it can miss `scrollbar-gutter` and read a viewport 15px too wide —
    // and deferring the correction to rAF means a page opened in a
    // background tab keeps the wrong width until it is first painted.
    // The gutters would then sit a pixel off the loader's.
    setSize(viewportSize());

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSize(viewportSize()));
    };

    // A scrollbar appearing changes clientWidth WITHOUT firing `resize`.
    const ro = new ResizeObserver(onResize);
    ro.observe(document.documentElement);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return { ...size, isMobile: size.width <= MOBILE_MAX };
};

const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * Dev-only QA override: `?motion=reduce` forces the reduced path so it
 * can be exercised without changing an OS setting. It cannot switch the
 * CSS media query, so the JS side is what this verifies.
 */
const forcedReduce = () =>
  Boolean(import.meta.env?.DEV) &&
  new URLSearchParams(window.location.search).get('motion') === 'reduce';

/**
 * prefers-reduced-motion, kept live. Also gates the shared rAF loop, so
 * honouring the setting removes the work rather than hiding it.
 */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return forcedReduce() || window.matchMedia(REDUCE).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(REDUCE);
    const onChange = () => {
      const value = forcedReduce() || mq.matches;
      setReduced(value);
      setReducedMotion(value);
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

/** True once the element has been on screen at least once. */
export const useIsVisible = (ref: React.RefObject<Element | null>) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '10%' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
};
