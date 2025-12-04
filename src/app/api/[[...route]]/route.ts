import { appRouter } from "@/server";
import { handle } from "hono/vercel";

export const GET = handle(appRouter);
export const POST = handle(appRouter);
