import type { Prisma } from "@prisma/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const videoActivityRouter = createTRPCRouter({
  playPause: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isPlaying: z.boolean(),
        seek: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const videoInput: Prisma.VideoActivitiesUpdateInput = {
        isPlaying: input.isPlaying,
        seek: input.seek,
        lastUpdatedBy: ctx.session.user.id,
      };

      return ctx.prisma.videoActivities.update({
        data: videoInput,
        where: {
          id: input.id,
        },
      });
    }),
  syncSeek: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        seek: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const videoInput: Prisma.VideoActivitiesUpdateInput = {
        seek: input.seek,
        lastUpdatedBy: ctx.session.user.id,
      };

      return ctx.prisma.videoActivities.update({
        data: videoInput,
        where: {
          id: input.id,
        },
      });
    }),
  updateUrl: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const videoInput: Prisma.VideoActivitiesUpdateInput = {
        url: input.url,
        seek: 0,
        isPlaying: false,
        lastUpdatedBy: ctx.session.user.id,
      };

      return ctx.prisma.videoActivities.update({
        data: videoInput,
        where: {
          id: input.id,
        },
      });
    }),
});
