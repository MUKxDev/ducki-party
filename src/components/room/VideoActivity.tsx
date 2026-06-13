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
import { toast } from "react-hot-toast";

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
  const { fullscreen, updateFullscreen } = useAppContext();
  const { sendBroadcast, subscribe: subscribeWS } = useWebSocket();

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [videoActivity, setVideoActivity] = useState<VideoActivities>(
    room.videoActivity
  );
  const playerRef: MutableRefObject<ReactPlayer | null> = useRef(null);
  const hasInitialSeekedRef = useRef(false);
  const lastUrlRef = useRef<string | null>(room.videoActivity.url);

  if (lastUrlRef.current !== videoActivity.url) {
    lastUrlRef.current = videoActivity.url;
    hasInitialSeekedRef.current = false;
  }

  const [isPip, setIsPip] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);
  const [muted, setMuted] = useState(true);

  const [emoji, setEmoji] = useState<string | null>(null);
  const [showEmojis, setShowEmojis] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (fullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (fullscreen) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [fullscreen]);

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
    if (!hasInitialSeekedRef.current) {
      playerRef.current?.seekTo(videoActivity.seek);
      hasInitialSeekedRef.current = true;
    }
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

  function copyRoomCode() {
    if (typeof window !== "undefined") {
      const inviteUrl = `${window.location.origin}/rooms/${room.id}`;
      navigator.clipboard
        .writeText(inviteUrl)
        .then(() => {
          setCopied(true);
          toast.success("Invite link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast.error("Failed to copy link");
        });
    }
  }

  return (
    <div 
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="relative flex flex-1 min-h-0 w-full flex-col gap-3"
    >
      {!fullscreen && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-base-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-float">🎬</span>
            <div className="max-w-[200px] sm:max-w-[300px] md:max-w-[450px]">
              <h2 className="font-black text-base md:text-lg tracking-tight truncate">
                Watch Party Lobby
              </h2>
              <p className="text-xs opacity-60 truncate">
                {videoActivity.url || "No video URL loaded"}
              </p>
            </div>
          </div>

          <div
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 cursor-pointer active:scale-95 transition-all select-none font-bold text-xs shadow-sm hover:bg-primary/20"
            title="Click to copy invite link"
          >
            <span>🔑 ROOM:</span>
            <span className="font-mono text-sm tracking-wider bg-slate-900/60 text-slate-100 px-2 py-0.5 rounded border border-slate-700/50">
              {room.id}
            </span>
            <span className="opacity-75">{copied ? "✓ Copied!" : "📋 Copy Invite Link"}</span>
          </div>
        </div>
      )}

      <div
        onClick={() => (videoActivity.isPlaying ? void pause() : void play())}
        className={`relative w-full aspect-video lg:aspect-auto lg:flex-1 min-h-0 overflow-clip rounded-xl bg-black hover:cursor-pointer ${
          duration === defaultDuration ? "animate-pulse" : ""
        } ${fullscreen ? "w-full h-full lg:flex-1 rounded-none border-none shadow-none" : ""}`}
      >
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
        <div className="absolute top-0 bottom-0 left-0 right-0 z-10 select-none pointer-events-none">
          <FallingEmojis
            repeat={-1}
            speed={3}
            emojis={[emoji ?? ""]}
            disable={!showEmojis}
            shake
            density={20}
          ></FallingEmojis>
        </div>
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
      </div>
      <div 
        onMouseEnter={() => {
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          setShowControls(true);
        }}
        onMouseLeave={resetControlsTimeout}
        className={`max-w-full rounded-xl bg-base-200 p-3 md:p-4 border border-base-300 shadow-inner transition-all duration-500 ${
          fullscreen ? "absolute bottom-6 left-6 right-6 z-40 shadow-2xl bg-slate-900/80 border-slate-700/50 backdrop-blur-md" : ""
        } ${fullscreen && !showControls ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"}`}
      >
        <VideoControls
          videoActivity={videoActivity}
          duration={duration}
          playerRef={playerRef}
          onPip={() => void pip()}
          isPip={isPip}
          muted={muted}
          onMuteToggle={() => setMuted(!muted)}
          fullscreen={!!fullscreen}
          onFullscreenToggle={() => updateFullscreen(!fullscreen)}
          onVideoActivitiesChange={(newVideoActivity) =>
            setVideoActivity(newVideoActivity)
          }
        />
      </div>
    </div>
  );
};
