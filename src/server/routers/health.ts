import { j, publicProcedure } from "../jstack";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const healthRouter = j.router({
  // Basic health check
  check: publicProcedure.get(async ({ c }) => {
    const start = Date.now();
    
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      const dbLatency = Date.now() - start;
      
      return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: { status: "healthy", latency: dbLatency },
        },
      });
    } catch (error) {
      return c.json(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          checks: {
            database: { status: "unhealthy", error: "Connection failed" },
          },
        },
        503
      );
    }
  }),
});
