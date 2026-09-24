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

    player.play();

    const finish = () => {
      if (handedOver.current) return;
      handedOver.current = true;
      onHandoff();
      setLeaving(true);
      window.setTimeout(onDone, FADE_MS);
    };

    const onFrame = (e: { detail: { frame: number } }) => {
      if (e.detail.frame >= HANDOFF_FRAME) finish();
    };

    player.addEventListener('frameupdate', onFrame);
    player.addEventListener('ended', finish);

    // Belt and braces: if the Player never reports a frame (autoplay
    // blocked, tab throttled), the visitor still reaches the hero.
    const bail = window.setTimeout(finish, (LOADER_FRAMES / LOADER_FPS) * 1000 + 1200);

    return () => {
      player.removeEventListener('frameupdate', onFrame);
      player.removeEventListener('ended', finish);
      window.clearTimeout(bail);
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
        // The site has already awaited the typefaces; a second gate here
        // only holds the intro at opacity 0 behind a black screen.
        inputProps={{ waitForFonts: false }}
        style={{ width: size.width, height: size.height }}
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
