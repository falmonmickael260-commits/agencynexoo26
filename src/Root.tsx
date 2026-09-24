import { Composition, Folder } from "remotion";
import { NexooLoader } from "./nexoo/NexooLoader";
import { LOADER_FPS, LOADER_FRAMES } from "./nexoo/timeline";

/**
 * The loader is a real Remotion composition. The site mounts this same
 * component through @remotion/player at compositionWidth = the hero's
 * measured width, so these registrations are for previewing the
 * choreography in Studio and for rendering the intro as a film.
 */
export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="Nexoo">
      <Composition
        id="NexooLoader-Desktop"
        component={NexooLoader}
        durationInFrames={LOADER_FRAMES}
        fps={LOADER_FPS}
        width={1920}
        height={1080}
        defaultProps={{ waitForFonts: true }}
      />
      <Composition
        id="NexooLoader-Mobile"
        component={NexooLoader}
        durationInFrames={LOADER_FRAMES}
        fps={LOADER_FPS}
        width={390}
        height={844}
        defaultProps={{ waitForFonts: true }}
      />
    </Folder>
  );
};
