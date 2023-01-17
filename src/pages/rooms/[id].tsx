import PageComponent from "../../components/PageComponent";

import type { NextPage } from "next";
import { api } from "../../utils/api";
import { VideoActivity } from "../../components/room/VideoActivity";
import { useRouter } from "next/router";

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
          <div className="flex grow grid-cols-7 flex-col gap-3 px-3 pb-3 lg:grid">
            <div className="col-span-7 h-min  resize-y overflow-hidden text-ellipsis rounded-xl bg-primary/20 p-3 lg:col-span-5">
              {" "}
              {roomQuery.data && (
                <VideoActivity room={roomQuery.data}></VideoActivity>
              )}
              {!roomQuery.data && <div>Room has not been found</div>}
            </div>
            <div className="col-span-7 grow rounded-xl bg-secondary/20 p-3 lg:col-span-2">
              Chat
            </div>
          </div>
        )}
      </PageComponent>
    </div>
  );
};

export default RoomPage;
