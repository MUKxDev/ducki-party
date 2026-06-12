import { ActivityType, type Prisma } from "../../../generated/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

function generateRoomCode(length = 5): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const roomsRouter = createTRPCRouter({
  createVideoActivity: protectedProcedure
    .input(
      z.object({
        url: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let roomId = generateRoomCode();
      let attempts = 0;
      // Enforce unique room codes
      while (attempts < 10) {
        const exists = await ctx.prisma.rooms.findUnique({
          where: { id: roomId },
        });
        if (!exists) break;
        roomId = generateRoomCode();
        attempts++;
      }

      const videoInput: Prisma.VideoActivitiesCreateInput = {
        url: input.url,
        lastUpdatedBy: ctx.session.user.id,
        room: {
          create: {
            id: roomId,
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
          id: input.roomId.toUpperCase(),
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
          id: input.roomId.toUpperCase(),
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
          id: input.roomId.toUpperCase(),
        },
      });
    }),
});
