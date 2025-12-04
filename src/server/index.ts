import { j } from "./jstack";
import { logsRouter } from "./routers/logs";
import { healthRouter } from "./routers/health";

// Create the base API router (no basePath since Next.js route is already /api)
const api = j
  .router()
  .onError(j.defaults.errorHandler);

// Merge all routers
export const appRouter = j.mergeRouters(api, {
  logs: logsRouter,
  health: healthRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
