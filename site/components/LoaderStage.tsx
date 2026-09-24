import React, { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { NexooLoader } from '../../src/nexoo/NexooLoader';
import { HANDOFF_FRAME, LOADER_FPS, LOADER_FRAMES } from '../../src/nexoo/timeline';
import { viewportSize } from '../lib/hooks';

type Props = {
  /** Fires the moment the loader's last frame equals the hero beneath it. */
  onHandoff: () => void;
  /** Fires once the overlay has been removed from the page. */
  onDone: () => void;
  /** The hero's own box. The composition adopts it exactly. */
  heroRef: React.RefObject<HTMLDivElement | null>;
};

const FADE_MS = 160;

/* Hoisted: a fresh object literal on every render is a new inputProps
   identity for the Player, which can reset playback mid-intro. */
const LOADER_PROPS = { waitForFonts: false } as const;

/**
 * Mounts the Remotion composition over the already-laid-out hero.
 *
 * compositionWidth/Height are pinned to the viewport, so the Player's
 * internal scale is exactly 1 and one composition pixel is one CSS
 * pixel. That, plus the fact that the loader and the hero render the
 * same <Masthead> against the same stylesheet, is what makes the
 * hand-off invisible: at HANDOFF_FRAME the two layers are the same
 * image, so the overlay can simply stop existing.
 *
 * The size is frozen at mount — a resize during the 2.6s would otherwise
 * remount the composition and restart the animation.
 */
export const LoaderStage: React.FC<Props> = ({ onHandoff, onDone, heroRef }) => {
  const playerRef = useRef<PlayerRef>(null);
  const [leaving, setLeaving] = useState(false);
  const handedOver = useRef(false);

  /* Measured from the hero itself, not from the window. `100svh` and
     documentElement.clientHeight disagree on mobile browsers whose
     toolbars collapse, and a composition even a few pixels off would
     scale the Player and make the hand-off visible. Frozen at mount so
     a mid-intro resize cannot restart the animation. */
  const [size] = useState(() => {
    const rect = heroRef.current?.getBoundingClientRect();
    const v = viewportSize();
    return {
      width: Math.max(1, Math.round(rect?.width ?? v.width)),
      height: Math.max(1, Math.round(rect?.height ?? v.height)),
    };
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    /* Review hook: `?loaderFrame=N` holds the intro on one frame so the
       choreography — and the hand-off in particular — can be inspected
       against the hero underneath it. Dev-only and stripped from builds:
       a held overlay never hands off, so in production the parameter
       would strand a visitor on a blank screen. */
    if (import.meta.env?.DEV) {
      const held = new URLSearchParams(window.location.search).get('loaderFrame');
      if (held !== null) {
        player.pause();
        player.seekTo(Number(held) || 0);
        return;
      }
    }

    /* `autoPlay` on the Player is the reliable starter; this call is a
       second attempt for the case where the ref was ready first. */
    player.play();

    const finish = () => {
      if (handedOver.current) return;
      handedOver.current = true;
      onHandoff();
      setLeaving(true);
      window.setTimeout(onDone, FADE_MS);
    };

    let started = false;
    const onFrame = (e: { detail: { frame: number } }) => {
      if (e.detail.frame > 0) started = true;
      if (e.detail.frame >= HANDOFF_FRAME) finish();
    };

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('ended', finish);

    /* Watchdog.

       Calling play() once from an effect is not enough: on a slow device
       the Player is not ready yet when the effect runs, the call is a
       no-op, and the composition sits on frame 0 — which is black. The
       visitor then waits out the bail timeout and the site appears with
       no intro at all. That is exactly what was reported, and it never
       reproduced on a fast machine. Retry until frames actually move. */
    const retries = [250, 700, 1400].map((delay) =>
      window.setTimeout(() => {
        if (!started) player.play();
      }, delay),
    );

    /* Two different give-ups: if the intro never started, cut to the
       hero quickly rather than holding a black screen for its full
       length; if it did start, allow the whole thing plus some slack. */
    const bail = window.setTimeout(() => {
      if (!started) finish();
    }, 2600);

    const safety = window.setTimeout(
      finish,
      (LOADER_FRAMES / LOADER_FPS) * 1000 + 2500,
    );

    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('ended', finish);
      retries.forEach(window.clearTimeout);
      window.clearTimeout(bail);
      window.clearTimeout(safety);
    };
  }, [onHandoff, onDone]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--ink)',
        opacity: leaving ? 0 : 1,
        // Not a composition animation: this fades the overlay itself,
        // outside Remotion's frame clock, so a CSS transition is right.
        // eslint-disable-next-line @remotion/non-pure-animation
        transition: `opacity ${FADE_MS}ms linear`,
        pointerEvents: 'none',
      }}
    >
      <Player
        ref={playerRef}
        component={NexooLoader}
        durationInFrames={LOADER_FRAMES}
        fps={LOADER_FPS}
        compositionWidth={size.width}
        compositionHeight={size.height}
        // The site drives the typefaces; a second gate inside the
        // composition only held the intro at opacity 0 behind black.
        inputProps={LOADER_PROPS}
        style={{ width: size.width, height: size.height }}
        // The dependable way to start: doing it by hand from an effect
        // silently fails whenever the Player is not ready yet.
        autoPlay
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        loop={false}
        acknowledgeRemotionLicense
      />
    </div>
  );
};
