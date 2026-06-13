import PageComponent from "../../components/PageComponent";

import type { NextPage } from "next";
import { api } from "../../utils/api";
import { VideoActivity } from "../../components/room/VideoActivity";
import { useRouter } from "next/router";
import type { Rooms, VideoActivities } from "../../generated/client";
import { Chat } from "../../components/room/Chat";
import { useAppContext } from "../../context/AppContext";

export type RoomWithVideoActivity = Rooms & {
  videoActivity: VideoActivities;
};

const RoomPage: NextPage = () => {
  const { query } = useRouter();
  const { id } = query;
  const roomIdNormalized = typeof id === "string" ? id.toUpperCase() : undefined;

  const { fullscreen } = useAppContext();

  const roomQuery = api.rooms.roomById.useQuery(
    { roomId: roomIdNormalized as string },
    { enabled: !!roomIdNormalized }
  );

  return (
    <div>
      <PageComponent
        title={`Ducki Party`}
        room={
          roomQuery.data &&
            roomQuery.data.videoActivity !== null &&
            roomQuery.data.type === "VIDEO"
            ? (roomQuery.data as RoomWithVideoActivity)
            : undefined
        }
      >
        {roomQuery.isInitialLoading ? (
          <div className="flex h-[50vh] w-full items-center justify-center">
            <span className="loading loading-ring loading-lg text-primary scale-150"></span>
          </div>
        ) : roomQuery.data ? (
          <div
            className={`flex flex-col gap-4 p-0 lg:grid lg:grid-cols-7 h-auto lg:h-[calc(100vh-7rem)] transition-all ${fullscreen ? "!p-0 !h-screen !w-screen fixed inset-0 z-30 bg-black overflow-hidden" : ""
              }`}
          >
            {/* Video Player Container */}
            <div
              className={`col-span-7 lg:col-span-5 flex flex-col h-fit lg:h-full overflow-hidden transition-all duration-300 border ${fullscreen
                  ? "bg-black p-0 rounded-none border-none shadow-none"
                  : "bg-base-200 border-base-300 rounded-2xl p-3 md:p-4 shadow-xl"
                }`}
            >
              {roomQuery.data.videoActivity !== null &&
                roomQuery.data.type === "VIDEO" && (
                  <VideoActivity
                    room={roomQuery.data as RoomWithVideoActivity}
                  ></VideoActivity>
                )}
            </div>

            {/* Chat Container */}
            <div
              className={`col-span-7 lg:col-span-2 flex flex-col transition-all duration-300 border ${fullscreen
                  ? "bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-slate-800 rounded-none p-4 h-full flex-1 min-h-0 overflow-hidden"
                  : "bg-base-200 border-base-300 rounded-2xl shadow-xl p-4 h-[400px] lg:h-full overflow-hidden"
                }`}
            >
              <Chat room={roomQuery.data} />
            </div>
          </div>
        ) : (
          <div className="flex h-56 w-full items-center justify-center font-bold text-lg text-error">
            ⚠️ Room has not been found or was closed.
          </div>
        )}
      </PageComponent>
    </div>
  );
};

export default RoomPage;
