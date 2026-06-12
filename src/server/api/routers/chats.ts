import { type Prisma } from "../../../generated/client";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const chatsRouter = createTRPCRouter({
  createChat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const chatInput: Prisma.ChatsCreateInput = {
        message: input.message,
        user: {
          connect: {
            id: ctx.session.user.id,
          },
        },
        room: {
          connect: {
            id: input.roomId.toUpperCase(),
          },
        },
      };

      return ctx.prisma.chats.create({
        data: chatInput,
      });
    }),

  chatsByRoomId: protectedProcedure
    .input(z.object({ roomId: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.chats.findMany({
        where: {
          roomId: input.roomId.toUpperCase(),
        },
        include: {
          user: true,
        },
      });
    }),
  chatById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.prisma.chats.findUniqueOrThrow({
        where: {
          id: input.id,
        },
        include: {
          user: true,
        },
      });
    }),
});
