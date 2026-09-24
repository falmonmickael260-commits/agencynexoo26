import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  SERVICES,
  SERVICES_EYEBROW,
  SERVICES_TITLE,
  padFor,
  type Service,
} from '../../shared/brand';
import { ServiceArt } from './services/ServiceArt';
import { onMotion, type MotionState } from '../lib/motion';
import { useViewport } from '../lib/hooks';

/**
 * SERVICES — five editorial spreads.
 *
 * Not a list: each service is a composition. An oversized outlined
 * numeral sits behind the piece, the artwork overlaps it, and the
 * direction alternates down the page so the rhythm never settles into a
 * grid. Three depth planes — numeral, artwork, text — move at different
 * rates on scroll, and the artwork's own internal layers lean toward the
 * pointer, so each piece reads as an object on a surface.
 *
 * Compact drops to a single column and swaps pointer parallax for
 * scroll-triggered reveals: there is no cursor to lean toward.
 */

type Props = { reduced: boolean };

const Spread: React.FC<{
  service: Service;
  index: number;
  reduced: boolean;
  compact: boolean;
}> = ({ service, index, reduced, compact }) => {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(reduced);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  /* Scroll parallax + pointer lean, written straight to custom
     properties once a frame. --sy is the spread's own progress through
     the viewport, so each one is on its own clock rather than the
     page's. */
  useEffect(() => {
    if (reduced) return;

    const apply = (s: MotionState) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight || 1;
      if (r.bottom < -200 || r.top > vh + 200) return;

      // -1 entering from below, 0 centred, +1 leaving above.
      const progress = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty('--sy', progress.toFixed(4));

      if (compact) return;
      // Pointer lean, measured from the spread's own centre.
      const mx = (s.x - (r.left + r.width / 2)) / (r.width / 2);
      const my = (s.y - (r.top + r.height / 2)) / (r.height / 2);
      const reach = s.engaged;
      el.style.setProperty('--mx', (Math.max(-1, Math.min(1, mx)) * reach).toFixed(4));
      el.style.setProperty('--my', (Math.max(-1, Math.min(1, my)) * reach).toFixed(4));
    };

    return onMotion(apply);
  }, [reduced, compact]);

  return (
    <article
      className="svc"
      id={service.id}
      ref={ref}
      data-in={inView}
      data-flip={index % 2 === 1}
      style={{ ['--i' as string]: index }}
    >
      {/* The numeral is decorative: the real index is in the heading. */}
      <span className="svc__num" aria-hidden="true">
        {service.index}
      </span>

      <div className="svc__art">
        <ServiceArt id={service.id} />
      </div>

      <div className="svc__body">
        <h3 className="svc__title">
          <span className="svc__ord meta">{service.index}</span>
          <span className="svc__name">{service.title}</span>
        </h3>
        <span className="svc__rule" aria-hidden="true" />
        <p className="svc__note">{service.note}</p>
      </div>
    </article>
  );
};

export const Services: React.FC<Props> = ({ reduced }) => {
  const { width, isMobile } = useViewport();
  const [animate, setAnimate] = useState(false);

  // Layout effect: arming after paint shows every spread for one frame
  // before hiding it again.
  useLayoutEffect(() => {
    if (!reduced && typeof IntersectionObserver !== 'undefined') setAnimate(true);
  }, [reduced]);

  return (
    <section
      className="services"
      id="services"
      aria-labelledby="services-title"
      data-animate={animate}
      data-compact={isMobile}
      /* Same gutter source as the hero. Left to the CSS clamp, this
         section resolves --pad against the viewport width while the hero
         resolves it against clientWidth, and the rules running down the
         page stop lining up. */
      style={{ ['--pad' as string]: `${padFor(width)}px` }}
    >
      <header className="services__head">
        <p className="meta">{SERVICES_EYEBROW}</p>
        <h2 className="services__title" id="services-title">
          {SERVICES_TITLE}
          <span className="services__dot" aria-hidden="true" />
        </h2>
      </header>

      {SERVICES.map((service, i) => (
        <Spread
          key={service.id}
          service={service}
          index={i}
          reduced={reduced}
          compact={isMobile}
        />
      ))}
    </section>
  );
};
