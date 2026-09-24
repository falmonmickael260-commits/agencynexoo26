import React, { useEffect, useState } from 'react';

/**
 * Self-serve diagnostics, behind `?diag=1`.
 *
 * Exists because the intro could not be reproduced as broken from here:
 * every measurement taken in this environment showed it mounting and
 * animating, while it did not show up on the real browser. This reports
 * what the VISITOR's browser actually did, so the next step is based on
 * their machine rather than on guesses about it.
 */

type Props = { phase: string; reduced: boolean };

type Row = { label: string; value: string; bad?: boolean };

export const Diagnostics: React.FC<Props> = ({ phase, reduced }) => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let alive = true;
    const marks: Record<string, number> = {};
    const t = () => Math.round(performance.now());

    const tick = () => {
      if (!alive) return;
      const overlay = [...document.querySelectorAll('div')].find(
        (d) => d.style.zIndex === '100',
      );
      if (overlay && !marks.loaderMount) marks.loaderMount = t();
      if (!overlay && marks.loaderMount && !marks.loaderGone) marks.loaderGone = t();

      const stage = overlay?.querySelector('.stage');
      const slot = stage?.querySelector<HTMLElement>('.wordmark__dot');
      if (slot && !marks.dotVisible) {
        if ((parseFloat(getComputedStyle(slot).scale) || 0) > 0.5) marks.dotVisible = t();
      }

      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((p) => p.name === 'first-contentful-paint');

      setRows([
        { label: 'Réduire les animations', value: reduced ? 'ACTIVÉ' : 'désactivé', bad: reduced },
        { label: 'Phase', value: phase },
        { label: 'Loader monté', value: marks.loaderMount ? `${marks.loaderMount} ms` : '—', bad: !marks.loaderMount && !reduced },
        { label: 'Point visible', value: marks.dotVisible ? `${marks.dotVisible} ms` : '—' },
        { label: 'Loader terminé', value: marks.loaderGone ? `${marks.loaderGone} ms` : '—' },
        { label: 'Première peinture', value: fcp ? `${Math.round(fcp.startTime)} ms` : '—' },
        { label: 'Polices', value: document.fonts.status },
        { label: 'Archivo', value: document.fonts.check('760 100px Archivo') ? 'ok' : 'ABSENT', bad: !document.fonts.check('760 100px Archivo') },
        { label: 'Écran', value: `${window.innerWidth}×${window.innerHeight}` },
      ]);
    };

    tick();
    const id = window.setInterval(tick, 250);
    window.setTimeout(() => window.clearInterval(id), 9000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [phase, reduced]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 999,
        padding: '12px 14px',
        maxWidth: 300,
        background: 'rgba(0,0,0,0.88)',
        border: '1px solid #3A3A3C',
        borderRadius: 4,
        font: '11px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace',
        color: '#F2F0EC',
        pointerEvents: 'none',
      }}
    >
      <div style={{ color: '#E8362B', marginBottom: 6, letterSpacing: '0.12em' }}>
        NEXOO — DIAGNOSTIC
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ opacity: 0.6 }}>{r.label}</span>
          <span style={{ color: r.bad ? '#E8362B' : '#F2F0EC' }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
};
