import { ActivityType, type Prisma } from "../../../generated/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const roomsRouter = createTRPCRouter({
  createVideoActivity: protectedProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const videoInput: Prisma.VideoActivitiesCreateInput = {
        url: input.url,
        lastUpdatedBy: ctx.session.user.id,
        room: {
          create: {
            type: ActivityType.VIDEO,
          },
        },
      };

      return ctx.prisma.videoActivities.create({
        data: videoInput,
      });
    }),

  roomById: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.rooms.findUniqueOrThrow({
        where: {
          id: input.roomId,
        },
        include: {
          videoActivity: true,
        },
      });
    }),

  roomByIdMutation: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.rooms.findUniqueOrThrow({
        where: {
          id: input.roomId,
        },
        include: {
          videoActivity: true,
        },
      });
    }),

  updateRoomEmoji: protectedProcedure
    .input(z.object({ roomId: z.string(), emoji: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.rooms.update({
        data: {
          emoji: input.emoji,
        },
        where: {
          id: input.roomId,
        },
      });
    }),
});
