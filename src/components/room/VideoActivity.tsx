import type { Rooms, VideoActivities } from "@prisma/client";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useSession } from "next-auth/react";
import type { MutableRefObject } from "react";
import React, { useEffect, useRef, useState, type FC } from "react";
import ReactPlayer from "react-player";
import { useAppContext } from "../../context/AppContext";
import { supabase } from "../../context/supabase";
import { api } from "../../utils/api";
import { defaultDuration } from "../../utils/constants";
import { isObjectEmpty } from "../../utils/helpers";
import { VideoControls } from "./VideoControls";

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

  /* -------------------------------------------------------------------------- */
  /*                                   STATES                                   */
  /* -------------------------------------------------------------------------- */
  const [videoActivity, setVideoActivity] = useState<VideoActivities>(
    room.videoActivity
  );
  const playerRef: MutableRefObject<ReactPlayer | null> = useRef(null);
  const [isPip, setIsPip] = useState(false);
  const [duration, setDuration] = useState(defaultDuration);

  /* -------------------------------------------------------------------------- */
  /*                                  MUTATIONS                                 */
  /* -------------------------------------------------------------------------- */
  const playPauseMutation = api.video.playPause.useMutation();

  /* -------------------------------------------------------------------------- */
  /*                                 USEEFFECTS                                 */
  /* -------------------------------------------------------------------------- */
  /* Subscribing to a channel that is listening for changes to the videoActivity. */
  useEffect(() => {
    const subscription = supabase
      .channel("public:VideoActivities")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "VideoActivities",
          filter: `id=eq.${room.videoActivity?.id ?? ""}`,
        },
        (payload: RealtimePostgresChangesPayload<VideoActivities>) => {
          if (!isObjectEmpty(payload.new)) {
            const newVideoActivity = payload.new as VideoActivities;
            if (
              newVideoActivity.lastUpdatedBy !== session?.user?.id ||
              newVideoActivity.url !== videoActivity.url
            ) {
              console.log(`Updated by: ${newVideoActivity.lastUpdatedBy}`);
              setVideoActivity(newVideoActivity);
              playerRef.current?.seekTo(newVideoActivity.seek);
            }
          }
        }
      )
      .subscribe();

    return () => {
      void subscription.unsubscribe();
    };
  }, [room, session?.user?.id, videoActivity.url]);

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
    await playPauseMutation
      .mutateAsync({
        id: videoActivity.id,
        seek: playerRef.current?.getCurrentTime() ?? 0,
        isPlaying: true,
      })
      .then((newVideoActivity) => setVideoActivity(newVideoActivity));
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
      .then((newVideoActivity) => setVideoActivity(newVideoActivity));
  }

  return (
    <div className="relative flex aspect-video h-full w-[-webkit-fill-available] grow flex-col gap-3">
      <div
        onClick={() => (videoActivity.isPlaying ? void pause() : void play())}
        className={`!aspect-video h-fit min-h-[10rem] max-w-fit grow overflow-clip rounded-lg bg-base-200 hover:cursor-pointer ${
          duration === defaultDuration ? "animate-pulse" : ""
        } ${fullscreen ? "mx-auto w-screen bg-base-100" : ""}`}
      >
        <ReactPlayer
          ref={playerRef}
          width={"100%"}
          height={"100%"}
          playsinline
          controls={false}
          url={videoActivity.url ?? undefined}
          playing={videoActivity.isPlaying}
          onReady={syncData}
          onDuration={setDuration}
          onPlay={() => {
            isPip && play();
          }}
          onPause={() => {
            isPip && pause();
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
          onVideoActivitiesChange={(newVideoActivity) =>
            setVideoActivity(newVideoActivity)
          }
        />
      </div>
    </div>
  );
};
