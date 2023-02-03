import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { roomsRouter } from "./routers/rooms";
import { videoActivityRouter } from "./routers/videoActivity";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  rooms: roomsRouter,
  video: videoActivityRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
