import type { Rooms, VideoActivities } from "@prisma/client";
import React, { type FC } from "react";

interface Props {
  room: Rooms & {
    videoActivity: VideoActivities | null;
  };
}

export const VideoActivity: FC<Props> = ({ room }) => {
  return (
    <div className="flex aspect-video h-full w-[-webkit-fill-available] grow flex-col gap-3 bg-red-800">
      <div className="  !aspect-video h-fit max-w-fit overflow-clip rounded-lg bg-blue-500">
        {JSON.stringify(room)}
      </div>
      <div className="max-w-full rounded-lg bg-green-400 p-4">controls</div>
    </div>
  );
};
