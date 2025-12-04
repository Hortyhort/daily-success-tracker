import { createClient } from "jstack";
import type { AppRouter } from "@/server";

// Create type-safe client
export const client = createClient<AppRouter>({
  baseUrl: typeof window !== "undefined" ? `${window.location.origin}/api` : "/api",
});
