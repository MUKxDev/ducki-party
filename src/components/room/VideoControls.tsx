import type { VideoActivities } from "@prisma/client";
import type { FC, MutableRefObject } from "react";
import React from "react";
import PipOpen from "../../../public/icons/pip=open.svg";
import PipClose from "../../../public/icons/pip=close.svg";
import Play from "../../../public/icons/play-pause=play.svg";
import Pause from "../../../public/icons/play-pause=pause.svg";
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
}

export const VideoControls: FC<Props> = ({
  videoActivity,
  duration,
  onVideoActivitiesChange,
  playerRef,
  onPip,
  isPip,
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

  /**
   * play() is an async function that calls the playPauseMutation mutation, which is a GraphQL mutation
   * that updates the videoActivity state, which is a state that is used to update the video player.
   */
  async function play() {
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
    <div className="flex items-center justify-center">
      <progress className="progress mx-auto w-56"></progress>
    </div>
  ) : (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <div
          className=""
          onClick={() => (videoActivity.isPlaying ? void pause() : void play())}
        >
          {videoActivity.isPlaying ? (
            <Pause className="cursor-pointer fill-base-content" />
          ) : (
            <Play className="cursor-pointer fill-base-content " />
          )}
        </div>

        {/* desktop slider */}
        <div className={"hidden grow p-3 md:block"}>
          <Range
            min={0.0}
            max={Math.ceil(duration)}
            onChange={(values) => {
              onVideoActivitiesChange(
                Object.assign(Object.create(videoActivity), {
                  seek: values[0],
                }) as VideoActivities
              );
              // setSeek(values[0]);
              playerRef.current?.seekTo(values[0] ?? videoActivity.seek);
            }}
            onFinalChange={() => void syncSeek()}
            values={[videoActivity.seek]}
            renderThumb={({ props }) => (
              <div
                {...props}
                className={`aspect-square  w-5 rounded-full ${
                  darkMode ? "bg-base-content" : "bg-[#4f86a0]"
                }`}
              />
            )}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                className={`h-3 w-full cursor-pointer rounded-full border border-neutral`}
                style={{
                  background: getTrackBackground({
                    values: [videoActivity.seek],
                    colors: darkMode
                      ? ["#87827f", "#c2bdba"]
                      : ["#70ACC7", "#E7E2DF"],
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

        {/* seek/duration */}
        <p
          className={"mx-4 select-none text-base-content"}
        >{`${formateSecondsToMinutes(
          videoActivity.seek
        )} / ${formateSecondsToMinutes(Math.ceil(duration))}`}</p>

        <div className="" onClick={() => onPip()}>
          {isPip ? (
            <PipClose className="cursor-pointer fill-base-content" />
          ) : (
            <PipOpen className="cursor-pointer fill-base-content" />
          )}
        </div>
      </div>
      {/* Mobile Slider */}
      <div className={"p-3 md:hidden"}>
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
            // setSeek(values[0]);
            playerRef.current?.seekTo(values[0] ?? videoActivity.seek);
          }}
          onFinalChange={() => void syncSeek()}
          values={[videoActivity.seek]}
          renderThumb={({ props }) => (
            <div
              {...props}
              className={`aspect-square  w-5 rounded-full ${
                darkMode ? "bg-base-content" : "bg-[#4f86a0]"
              }`}
            />
          )}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              className={`h-3 w-full rounded-full border border-neutral `}
              style={{
                background: getTrackBackground({
                  values: [videoActivity.seek],
                  colors: darkMode
                    ? ["#87827f", "#c2bdba"]
                    : ["#70ACC7", "#E7E2DF"],
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
