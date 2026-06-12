import type { Rooms, VideoActivities } from "../../generated/client";
import { delay } from "lodash";
import { useSession } from "next-auth/react";
import type { MutableRefObject } from "react";
import React, { useEffect, useRef, useState, type FC } from "react";
import ReactPlayer from "react-player";
import { useAppContext } from "../../context/AppContext";
import { api } from "../../utils/api";
import { defaultDuration } from "../../utils/constants";
import FallingEmojis from "../DuckiEmojis";
import { VideoControls } from "./VideoControls";
import { useWebSocket } from "../../context/WebSocketContext";

interface Props {
  room: Rooms & {
    videoActivity: VideoActivities;
  };
}

export const VideoActivity: FC<Props> = ({ room }) => {
  /* -------------------------------------------------------------------------- */
  /*                                   CONTEXT                                  */
  /* -------------------------------------------------------------------------- */
  const { data: session } = useSession();
  const { fullscreen } = useAppContext();
  const { sendBroadcast, subscribe: subscribeWS } = useWebSocket();

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [videoActivity, setVideoActivity] = useState<VideoActivities>(
    room.videoActivity
  );
  const playerRef: MutableRefObject<ReactPlayer | null> = useRef(null);
  const [isPip, setIsPip] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [muted, setMuted] = useState(true);

  const [emoji, setEmoji] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState<boolean>(false);

  /* -------------------------------------------------------------------------- */
  /*                                  MUTATIONS                                 */
  /* -------------------------------------------------------------------------- */
  const playPauseMutation = api.video.playPause.useMutation();

  /* -------------------------------------------------------------------------- */
  /*                                 USEEFFECTS                                 */
  /* -------------------------------------------------------------------------- */
  /* Subscribing to changes via WebSocket. */
  useEffect(() => {
    const unsubscribe = subscribeWS("VIDEO_STATE_UPDATED", (payload: unknown) => {
      const statePayload = payload as { videoActivity: VideoActivities };
      const newVideoActivity = statePayload?.videoActivity;
      if (newVideoActivity) {
        if (
          newVideoActivity.lastUpdatedBy !== session?.user?.id ||
          newVideoActivity.url !== videoActivity.url
        ) {
          console.log(`Updated by: ${newVideoActivity.lastUpdatedBy}`);
          setVideoActivity(newVideoActivity);
          playerRef.current?.seekTo(newVideoActivity.seek);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeWS, session?.user?.id, videoActivity.url]);

  useEffect(() => {
    const unsubscribe = subscribeWS("EMOJI_UPDATED", (payload: unknown) => {
      const emojiPayload = payload as { emoji: string };
      const emojiStr = emojiPayload?.emoji;
      if (emojiStr) {
        setTheEmoji(emojiStr);
        console.log("newRoom => emoji: ", emojiStr);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeWS]);

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * If the playerRef.current is not null, then seek to the videoActivity.seek.
   */
  function syncData() {
    playerRef.current?.seekTo(videoActivity.seek);
  }

  /**
   * If the video element is in picture in picture mode, exit picture in picture mode, otherwise enter
   * picture in picture mode.
   */
  async function pip() {
    const v: HTMLVideoElement | null = document.querySelector("Video");
    if (v) {
      if (Boolean(document.pictureInPictureElement)) {
        await document.exitPictureInPicture();
        setIsPip(false);
      } else {
        await v.requestPictureInPicture();
        setIsPip(true);
      }
    }
  }

  /**
   * play() is an async function that calls the playPauseMutation mutation, which is a GraphQL mutation
   * that updates the videoActivity state, which is a state that is used to update the video player.
   */
  async function play() {
    setVideoActivity((prev) => ({ ...prev, isPlaying: true }));
    await playPauseMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
        isPlaying: true,
      })
      .then((newVideoActivity) => {
        setVideoActivity(newVideoActivity);
        sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });
      });
  }

  /**
   * pause() is an async function that calls the playPauseMutation mutation, which is a GraphQL mutation
   * that updates the videoActivity state, which is a state that is used to update the video player.
   */
  async function pause() {
    setVideoActivity((prev) => ({ ...prev, isPlaying: false }));
    await playPauseMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
        isPlaying: false,
      })
      .then((newVideoActivity) => {
        setVideoActivity(newVideoActivity);
        sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });
      });
  }

  function setTheEmoji(emoji: string) {
    setEmoji(emoji);

    setShowEmojis(true);
    delay(() => {
      setShowEmojis(false);
    }, 3000);
  }

  return (
    <div className="relative flex aspect-video h-full w-[-webkit-fill-available] grow flex-col gap-3">
      <div
        onClick={() => (videoActivity.isPlaying ? void pause() : void play())}
        className={`relative !aspect-video h-fit min-h-[10rem] max-w-fit grow overflow-clip rounded-lg bg-base-200 hover:cursor-pointer ${
          duration === defaultDuration ? "animate-pulse" : ""
        } ${fullscreen ? "mx-auto w-screen bg-black" : ""}`}
      >
        {muted && videoActivity.isPlaying && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setMuted(false);
            }}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/80 transition active:scale-95 select-none"
          >
            <span>🔇 Tap to Unmute</span>
          </div>
        )}
        <div className="absolute top-0 bottom-0 left-0 right-0 z-10 select-none">
          <FallingEmojis
            repeat={-1}
            speed={3}
            emojis={[emoji ?? ""]}
            disable={!showEmojis}
            shake
            density={20}
          ></FallingEmojis>
        </div>
        <ReactPlayer
          ref={playerRef}
          width={"100%"}
          height={"100%"}
          playsinline
          controls={false}
          url={videoActivity.url ?? undefined}
          playing={videoActivity.isPlaying}
          muted={muted}
          onReady={syncData}
          onDuration={setDuration}
          onPlay={() => {
            isPip && void play();
          }}
          onPause={() => {
            isPip && void pause();
          }}
          onDisablePIP={() => {
            setIsPip(false);
          }}
          onEnablePIP={() => {
            setIsPip(true);
          }}
          onProgress={(state) => {
            setVideoActivity(
              Object.assign(Object.create(videoActivity), {
                seek: state.playedSeconds,
              }) as VideoActivities
            );
          }}
        />
      </div>
      <div
        className={`max-w-full rounded-lg bg-base-200 p-4 ${
          fullscreen
            ? "absolute bottom-3 left-3 right-3 z-20 opacity-0 duration-200 hover:opacity-90"
            : ""
        }`}
      >
        <VideoControls
          videoActivity={videoActivity}
          duration={duration}
          playerRef={playerRef}
          onPip={() => void pip()}
          isPip={isPip}
          muted={muted}
          onMuteToggle={() => setMuted(!muted)}
          onVideoActivitiesChange={(newVideoActivity) =>
            setVideoActivity(newVideoActivity)
          }
        />
      </div>
    </div>
  );
};
