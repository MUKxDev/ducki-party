import type { VideoActivities } from "../../generated/client";
import type { FC, MutableRefObject } from "react";
import React from "react";
import { Play, Pause, Tv, Volume2, VolumeX, Maximize2, Minimize2 } from "lucide-react";
import { api } from "../../utils/api";
import type ReactPlayer from "react-player";
import { getTrackBackground, Range } from "react-range";
import { useAppContext } from "../../context/AppContext";
import { defaultDuration } from "../../utils/constants";
import { useWebSocket } from "../../context/WebSocketContext";

interface Props {
  videoActivity: VideoActivities;
  duration: number;
  playerRef: MutableRefObject<ReactPlayer | null>;
  onVideoActivitiesChange: (newVideoActivities: VideoActivities) => void;
  onPip: () => void;
  isPip: boolean;
  muted: boolean;
  onMuteToggle: () => void;
  fullscreen: boolean;
  onFullscreenToggle: () => void;
}

export const VideoControls: FC<Props> = ({
  videoActivity,
  duration,
  onVideoActivitiesChange,
  playerRef,
  onPip,
  isPip,
  muted,
  onMuteToggle,
  fullscreen,
  onFullscreenToggle,
}) => {
  /* -------------------------------------------------------------------------- */
  /*                                  CONTEXTS                                  */
  /* -------------------------------------------------------------------------- */
  const { darkMode } = useAppContext();
  const { sendBroadcast } = useWebSocket();

  /* -------------------------------------------------------------------------- */
  /*                                  MUTATIONS                                 */
  /* -------------------------------------------------------------------------- */
  const playPauseMutation = api.video.playPause.useMutation();
  const syncSeekMutation = api.video.syncSeek.useMutation();

  /* -------------------------------------------------------------------------- */
  /*                                  FUNCTIONS                                 */
  /* -------------------------------------------------------------------------- */

  const handleFullscreenClick = () => {
    const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobileDevice) {
      const videoEl = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
      if (videoEl) {
        if (videoEl.requestFullscreen) {
          videoEl.requestFullscreen().catch((err) => console.error("Native fullscreen failed:", err));
        } else if ((videoEl as any).webkitRequestFullscreen) {
          (videoEl as any).webkitRequestFullscreen();
        } else if ((videoEl as any).webkitEnterFullscreen) {
          (videoEl as any).webkitEnterFullscreen();
        }
      }
    } else {
      onFullscreenToggle();
    }
  };

  /**
   * play() is an async function that calls the playPauseMutation mutation, which is a GraphQL mutation
   * that updates the videoActivity state, which is a state that is used to update the video player.
   */
  async function play() {
    onVideoActivitiesChange({ ...videoActivity, isPlaying: true });
    await playPauseMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
        isPlaying: true,
      })
      .then((newVideoActivity) => {
        onVideoActivitiesChange(newVideoActivity);
        sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });
      });
  }

  /**
   * pause() is an async function that calls the playPauseMutation mutation, which is a GraphQL mutation
   * that updates the videoActivity state, which is a state that is used to update the video player.
   */
  async function pause() {
    onVideoActivitiesChange({ ...videoActivity, isPlaying: false });
    await playPauseMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
        isPlaying: false,
      })
      .then((newVideoActivity) => {
        onVideoActivitiesChange(newVideoActivity);
        sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });
      });
  }

  /**
   * When the user seeks, update the seek time in the database and update the video activity in the
   * state.
   */
  async function syncSeek() {
    await syncSeekMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
      })
      .then((newVideoActivity) => {
        onVideoActivitiesChange(newVideoActivity);
        sendBroadcast("VIDEO_STATE_UPDATED", { videoActivity: newVideoActivity });

        if (newVideoActivity.isPlaying) {
          const internalPlayer = playerRef.current?.getInternalPlayer() as HTMLVideoElement | null;
          if (internalPlayer && typeof internalPlayer.play === "function") {
            internalPlayer.play().catch((err) => {
              console.warn("Failed to force play after seek:", err);
            });
          }
        }
      });
  }

  /**
   * It takes a number of seconds and returns a string of minutes and seconds.
   * @param {number} time - number - The time in seconds to be formatted.
   * @returns A string with the format of minutes:seconds.
   */
  function formateSecondsToMinutes(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;

    const timeFormat = new Intl.NumberFormat("en-US", {
      minimumIntegerDigits: 2,
      maximumFractionDigits: 0,
      useGrouping: false,
    });

    return `${timeFormat.format(minutes)}:${timeFormat.format(seconds)}`;
  }

  return duration === defaultDuration ? (
    <div className="flex items-center justify-center py-4">
      <span className="loading loading-dots loading-md text-primary"></span>
    </div>
  ) : (
    <div className="flex flex-col gap-1 md:gap-2">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        {/* Play/Pause Button */}
        <div
          className="cursor-pointer p-1 hover:bg-slate-700/10 dark:hover:bg-slate-300/10 rounded-full active:scale-90 transition select-none flex items-center justify-center h-8 w-8 md:h-10 md:w-10"
          onClick={() => (videoActivity.isPlaying ? void pause() : void play())}
        >
          {videoActivity.isPlaying ? (
            <Pause className="h-4 w-4 md:h-5 md:w-5 fill-current text-slate-200" />
          ) : (
            <Play className="h-4 w-4 md:h-5 md:w-5 fill-current text-primary" />
          )}
        </div>

        {/* Desktop Slider */}
        <div className="hidden grow px-2 py-3 md:block">
          <Range
            min={0.0}
            max={Math.ceil(duration)}
            onChange={(values) => {
              onVideoActivitiesChange(
                Object.assign(Object.create(videoActivity), {
                  seek: values[0],
                }) as VideoActivities
              );
              playerRef.current?.seekTo(values[0] ?? videoActivity.seek);
            }}
            onFinalChange={() => void syncSeek()}
            values={[videoActivity.seek]}
            renderThumb={({ props }) => (
              <div
                {...props}
                className="aspect-square w-4 rounded-full bg-primary shadow-lg border border-slate-950/20 cursor-grab active:cursor-grabbing hover:scale-125 transition outline-none"
              />
            )}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className="h-2 w-full cursor-pointer rounded-full border border-slate-700/10 shadow-inner"
                style={{
                  background: getTrackBackground({
                    values: [videoActivity.seek],
                    colors: darkMode
                      ? ["#fbbf24", "#374151"]
                      : ["#d97706", "#e5e7eb"],
                    min: 0.0,
                    max: Math.ceil(duration),
                  }),
                }}
              >
                {children}
              </div>
            )}
          ></Range>
        </div>

        {/* Seek/Duration Time */}
        <p className="font-mono text-xs md:text-sm tracking-tight select-none opacity-80 shrink-0">
          {`${formateSecondsToMinutes(videoActivity.seek)} / ${formateSecondsToMinutes(Math.ceil(duration))}`}
        </p>

        {/* Mute and PiP Buttons */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            type="button"
            className="cursor-pointer p-1 hover:bg-slate-700/10 dark:hover:bg-slate-300/10 rounded-full active:scale-90 transition select-none flex items-center justify-center h-8 w-8 md:h-10 md:w-10"
            onClick={() => onMuteToggle()}
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <VolumeX className="h-4 w-4 md:h-5 md:w-5 text-error" />
            ) : (
              <Volume2 className="h-4 w-4 md:h-5 md:w-5 text-success" />
            )}
          </button>

          <button
            type="button"
            className="cursor-pointer p-1 hover:bg-slate-700/10 dark:hover:bg-slate-300/10 rounded-full active:scale-90 transition select-none flex items-center justify-center h-8 w-8 md:h-10 md:w-10"
            onClick={() => onPip()}
            title={isPip ? "Exit PiP" : "Enter PiP"}
          >
            <Tv className={`h-4 w-4 md:h-5 md:w-5 ${isPip ? "text-primary fill-primary/10" : ""}`} />
          </button>

          <button
            type="button"
            className="cursor-pointer p-1 hover:bg-slate-700/10 dark:hover:bg-slate-300/10 rounded-full active:scale-90 transition select-none flex items-center justify-center h-8 w-8 md:h-10 md:w-10"
            onClick={handleFullscreenClick}
            title="Toggle Fullscreen"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <Maximize2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slider */}
      <div className="px-1 py-1.5 md:hidden">
        <Range
          min={0.0}
          max={Math.ceil(duration)}
          step={1}
          onChange={(values) => {
            onVideoActivitiesChange(
              Object.assign(Object.create(videoActivity), {
                seek: values[0],
              }) as VideoActivities
            );
            playerRef.current?.seekTo(values[0] ?? videoActivity.seek);
          }}
          onFinalChange={() => void syncSeek()}
          values={[videoActivity.seek]}
          renderThumb={({ props }) => (
            <div
              {...props}
              className="aspect-square w-4 rounded-full bg-primary shadow-lg border border-slate-950/20 cursor-grab active:cursor-grabbing outline-none"
            />
          )}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className="h-1.5 w-full cursor-pointer rounded-full border border-slate-700/10 shadow-inner"
              style={{
                background: getTrackBackground({
                  values: [videoActivity.seek],
                  colors: darkMode
                    ? ["#fbbf24", "#374151"]
                    : ["#d97706", "#e5e7eb"],
                  min: 0.0,
                  max: Math.ceil(duration),
                }),
              }}
            >
              {children}
            </div>
          )}
        ></Range>
      </div>
    </div>
  );
};
