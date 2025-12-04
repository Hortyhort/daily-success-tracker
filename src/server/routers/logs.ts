import { j, publicProcedure } from "../jstack";
import { db } from "@/db";
import { dailyLogs, users } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { rateLimitByUser, rateLimitMutation } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { HTTPException } from "hono/http-exception";

// Helper to get or create user from Clerk (handles race conditions)
async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) {
    logger.warn("Unauthorized access attempt");
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  // Try to insert, ignore if already exists (handles race condition)
  await db
    .insert(users)
    .values({
      clerkId: userId,
      email: "pending@email.com",
    })
    .onConflictDoNothing({ target: users.clerkId });

  // Now fetch the user (guaranteed to exist)
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    throw new Error("Failed to create user");
  }

  return { user, clerkId: userId };
}

// Validate date string and ensure it's not in the future
function validateAndParseDate(dateStr?: string): string {
  const today = getTodayDateString();
  
  if (!dateStr) return today;
  
  // Validate format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new HTTPException(400, { message: "Invalid date format. Use YYYY-MM-DD" });
  }
  
  // Check if date is in the future
  if (dateStr > today) {
    throw new HTTPException(400, { message: "Cannot log future dates" });
  }
  
  // Check if date is too far in the past (1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const minDate = `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, "0")}-${String(oneYearAgo.getDate()).padStart(2, "0")}`;
  
  if (dateStr < minDate) {
    throw new HTTPException(400, { message: "Cannot log dates more than 1 year in the past" });
  }
  
  return dateStr;
}

// Get today's date in YYYY-MM-DD format (local time)
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to format date to string
function formatLogDate(log: typeof dailyLogs.$inferSelect) {
  return {
    ...log,
    date: typeof log.date === 'string' ? log.date : log.date,
  };
}

export const logsRouter = j.router({
  // Get all logs for the authenticated user
  getLogs: publicProcedure.get(async ({ c }) => {
    const { user, clerkId } = await getOrCreateUser();
    
    // Rate limit
    const rateLimit = rateLimitByUser(clerkId);
    if (!rateLimit.success) {
      logger.warn("Rate limit exceeded", { userId: clerkId });
      throw new HTTPException(429, { message: "Too many requests" });
    }
    
    const logs = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, user.id), isNull(dailyLogs.deletedAt)))
      .orderBy(desc(dailyLogs.date));

    logger.debug("Fetched logs", { userId: user.id, count: logs.length });
    return c.json({ logs: logs.map(formatLogDate) });
  }),

  // Get today's log status
  getTodayStatus: publicProcedure.get(async ({ c }) => {
    const { user, clerkId } = await getOrCreateUser();
    const today = getTodayDateString();
    
    // Rate limit
    const rateLimit = rateLimitByUser(clerkId);
    if (!rateLimit.success) {
      throw new HTTPException(429, { message: "Too many requests" });
    }

    const log = await db.query.dailyLogs.findFirst({
      where: and(
        eq(dailyLogs.userId, user.id), 
        eq(dailyLogs.date, today),
        isNull(dailyLogs.deletedAt)
      ),
    });

    return c.json({
      hasLoggedToday: !!log,
      todayLog: log ? formatLogDate(log) : null,
    });
  }),

  // Log a day's success status (create or update)
  logDay: publicProcedure
    .input(z.object({ 
      success: z.boolean(), 
      date: z.string().optional(),
      notes: z.string().max(500).optional(),
    }))
    .post(async ({ c, input }) => {
      const { user, clerkId } = await getOrCreateUser();
      
      // Rate limit mutations more strictly
      const rateLimit = rateLimitMutation(clerkId);
      if (!rateLimit.success) {
        logger.warn("Mutation rate limit exceeded", { userId: clerkId });
        throw new HTTPException(429, { message: "Too many requests" });
      }
      
      // Validate and parse date
      const targetDate = validateAndParseDate(input.date);

      // Check if log exists for this date (including soft-deleted)
      const existingLog = await db.query.dailyLogs.findFirst({
        where: and(eq(dailyLogs.userId, user.id), eq(dailyLogs.date, targetDate)),
      });

      if (existingLog) {
        // Update existing log (restore if soft-deleted)
        const [updatedLog] = await db
          .update(dailyLogs)
          .set({ 
            success: input.success,
            notes: input.notes,
            updatedAt: new Date(),
            deletedAt: null, // Restore if was deleted
          })
          .where(eq(dailyLogs.id, existingLog.id))
          .returning();
        
        logger.info("Log updated", { userId: user.id, date: targetDate, success: input.success });
        return c.json({ log: formatLogDate(updatedLog), action: "updated" as const });
      } else {
        // Create new log
        const [newLog] = await db
          .insert(dailyLogs)
          .values({
            userId: user.id,
            date: targetDate,
            success: input.success,
            notes: input.notes,
          })
          .returning();
        
        logger.info("Log created", { userId: user.id, date: targetDate, success: input.success });
        return c.json({ log: formatLogDate(newLog), action: "created" as const });
      }
    }),

  // Soft delete a log (undo-able)
  deleteLog: publicProcedure
    .input(z.object({ id: z.number() }))
    .post(async ({ c, input }) => {
      const { user, clerkId } = await getOrCreateUser();
      
      const rateLimit = rateLimitMutation(clerkId);
      if (!rateLimit.success) {
        throw new HTTPException(429, { message: "Too many requests" });
      }

      // Verify ownership
      const log = await db.query.dailyLogs.findFirst({
        where: and(eq(dailyLogs.id, input.id), eq(dailyLogs.userId, user.id)),
      });

      if (!log) {
        throw new HTTPException(404, { message: "Log not found" });
      }

      // Soft delete
      const [deletedLog] = await db
        .update(dailyLogs)
        .set({ deletedAt: new Date() })
        .where(eq(dailyLogs.id, input.id))
        .returning();

      logger.info("Log deleted", { userId: user.id, logId: input.id });
      return c.json({ log: formatLogDate(deletedLog), action: "deleted" as const });
    }),

  // Undo delete (restore)
  restoreLog: publicProcedure
    .input(z.object({ id: z.number() }))
    .post(async ({ c, input }) => {
      const { user, clerkId } = await getOrCreateUser();
      
      const rateLimit = rateLimitMutation(clerkId);
      if (!rateLimit.success) {
        throw new HTTPException(429, { message: "Too many requests" });
      }

      // Verify ownership
      const log = await db.query.dailyLogs.findFirst({
        where: and(eq(dailyLogs.id, input.id), eq(dailyLogs.userId, user.id)),
      });

      if (!log) {
        throw new HTTPException(404, { message: "Log not found" });
      }

      // Restore
      const [restoredLog] = await db
        .update(dailyLogs)
        .set({ deletedAt: null })
        .where(eq(dailyLogs.id, input.id))
        .returning();

      logger.info("Log restored", { userId: user.id, logId: input.id });
      return c.json({ log: formatLogDate(restoredLog), action: "restored" as const });
    }),

  // Export all logs as JSON
  exportLogs: publicProcedure.get(async ({ c }) => {
    const { user, clerkId } = await getOrCreateUser();
    
    const rateLimit = rateLimitByUser(clerkId);
    if (!rateLimit.success) {
      throw new HTTPException(429, { message: "Too many requests" });
    }

    const logs = await db
      .select({
        date: dailyLogs.date,
        success: dailyLogs.success,
        notes: dailyLogs.notes,
        createdAt: dailyLogs.createdAt,
      })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, user.id), isNull(dailyLogs.deletedAt)))
      .orderBy(desc(dailyLogs.date));

    logger.info("Logs exported", { userId: user.id, count: logs.length });
    
    return c.json({
      exportedAt: new Date().toISOString(),
      totalLogs: logs.length,
      logs,
    });
  }),
});
