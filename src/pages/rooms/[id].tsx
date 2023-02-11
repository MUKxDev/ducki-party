import PageComponent from "../../components/PageComponent";

import type { NextPage } from "next";
import { api } from "../../utils/api";
import { VideoActivity } from "../../components/room/VideoActivity";
import { useRouter } from "next/router";
import type { Rooms, VideoActivities } from "@prisma/client";
import { Chat } from "../../components/room/Chat";
import { useAppContext } from "../../context/AppContext";

export type RoomWithVideoActivity = Rooms & {
  videoActivity: VideoActivities;
};

const RoomPage: NextPage = () => {
  const { query } = useRouter();
  const { id } = query;

  const { fullscreen } = useAppContext();

  const roomQuery = api.rooms.roomById.useQuery({
    roomId: id as string,
  });

  return (
    <div>
      <PageComponent
        title="Room"
        room={
          roomQuery.data &&
          roomQuery.data.videoActivity !== null &&
          roomQuery.data.type === "VIDEO"
            ? (roomQuery.data as RoomWithVideoActivity)
            : undefined
        }
      >
        {roomQuery.isInitialLoading ? (
          <progress className="progress mx-auto w-56"></progress>
        ) : (
          <div className="flex max-h-full grow grid-cols-7 flex-col gap-3 px-3 pb-3 lg:grid">
            <div
              className={`col-span-7 h-full  resize-y  overflow-hidden text-ellipsis rounded-xl bg-base-300 p-3 md:h-full lg:col-span-5 ${
                fullscreen
                  ? "absolute top-0 bottom-0 left-0 right-0 col-span-7"
                  : ""
              }`}
            >
              {roomQuery.data &&
                roomQuery.data.videoActivity !== null &&
                roomQuery.data.type === "VIDEO" && (
                  <VideoActivity
                    room={roomQuery.data as RoomWithVideoActivity}
                  ></VideoActivity>
                )}
              {!roomQuery.data && <div>Room has not been found</div>}
            </div>

            {roomQuery.data && (
              <div
                className={`col-span-7 min-h-[30%] grow rounded-xl bg-base-300 p-3 lg:col-span-2 ${
                  fullscreen
                    ? "absolute bottom-20 right-0 z-10 h-60 bg-transparent"
                    : ""
                }`}
              >
                <Chat room={roomQuery.data} />
              </div>
            )}
          </div>
        )}
      </PageComponent>
    </div>
  );
};

export default RoomPage;
