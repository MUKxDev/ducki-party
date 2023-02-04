import { createTRPCRouter } from "./trpc";
import { roomsRouter } from "./routers/rooms";
import { videoActivityRouter } from "./routers/videoActivity";
import { chatsRouter } from "./routers/chats";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  rooms: roomsRouter,
  video: videoActivityRouter,
  chats: chatsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
