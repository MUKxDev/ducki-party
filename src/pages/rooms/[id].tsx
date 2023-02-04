import PageComponent from "../../components/PageComponent";

import type { NextPage } from "next";
import { api } from "../../utils/api";
import { VideoActivity } from "../../components/room/VideoActivity";
import { useRouter } from "next/router";
import type { Rooms, VideoActivities } from "@prisma/client";
import { Chat } from "../../components/room/Chat";

type RoomWithVideoActivity = Rooms & {
  videoActivity: VideoActivities;
};

const RoomPage: NextPage = () => {
  const { query } = useRouter();
  const { id } = query;

  const roomQuery = api.rooms.roomById.useQuery({
    roomId: id as string,
  });

  return (
    <div>
      <PageComponent title="Room">
        {roomQuery.isInitialLoading ? (
          <progress className="progress mx-auto w-56"></progress>
        ) : (
          <div className="flex max-h-full grow grid-cols-7 flex-col gap-3 px-3 pb-3 lg:grid">
            <div className="col-span-7 h-full resize-y  overflow-hidden text-ellipsis rounded-xl bg-base-300 p-3 md:h-full lg:col-span-5">
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
              <div className="col-span-7 min-h-[30%]  grow rounded-xl bg-base-300 p-3 lg:col-span-2">
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
