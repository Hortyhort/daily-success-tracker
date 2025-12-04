"use client";

import { Calendar } from "@/components/ui/calendar";
import type { DailyLog } from "@/db/schema";
import { Flame } from "lucide-react";

interface SuccessCalendarProps {
  logs: DailyLog[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function SuccessCalendar({
  logs,
  selectedDate,
  onSelectDate,
}: SuccessCalendarProps) {
  // Convert DB dates to YYYY-MM-DD strings for comparison
  const successDates = new Set(
    logs.filter((log) => log.success).map((log) => formatDateFromDB(log.date))
  );
  const failureDates = new Set(
    logs.filter((log) => !log.success).map((log) => formatDateFromDB(log.date))
  );

  const streak = calculateStreak(logs);

  return (
    <section 
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"
      aria-labelledby="calendar-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 id="calendar-heading" className="font-semibold text-slate-900 dark:text-white">Calendar</h2>
        {streak > 0 && (
          <div 
            className="flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-full"
            role="status"
            aria-label={`Current streak: ${streak} day${streak > 1 ? 's' : ''}`}
          >
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{streak} day streak</span>
          </div>
        )}
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        className="w-full"
        modifiers={{
          success: (date) => successDates.has(formatDate(date)),
          failure: (date) => failureDates.has(formatDate(date)),
        }}
        modifiersStyles={{
          success: {
            backgroundColor: "rgb(16, 185, 129)",
            color: "white",
            fontWeight: "500",
            borderRadius: "8px",
          },
          failure: {
            backgroundColor: "rgb(244, 63, 94)",
            color: "white",
            fontWeight: "500",
            borderRadius: "8px",
          },
        }}
        disabled={(date) => date > new Date()}
      />

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800" role="note" aria-label="Calendar legend">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 rounded bg-emerald-500" aria-hidden="true"></div>
          <span>Win</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="w-3 h-3 rounded bg-rose-500" aria-hidden="true"></div>
          <span>Loss</span>
        </div>
      </div>
    </section>
  );
}

// Helper to format calendar date to YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Helper to format DB date (could be string or Date) to YYYY-MM-DD
function formatDateFromDB(date: string | Date): string {
  if (typeof date === "string") {
    // Already a string like "2025-12-04" or "2025-12-04T00:00:00.000Z"
    // Extract just the YYYY-MM-DD part to avoid timezone issues
    return date.substring(0, 10);
  }
  return formatDate(date);
}

// Parse date string to local Date (avoids timezone issues)
function parseLocalDate(date: string | Date): Date {
  if (typeof date === 'string') {
    const dateStr = date.substring(0, 10);
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return date;
}

// Calculate current success streak
function calculateStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;

  const sortedLogs = [...logs].sort(
    (a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const log of sortedLogs) {
    const logDate = parseLocalDate(log.date);

    const daysDiff = Math.floor(
      (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === streak && log.success) {
      streak++;
    } else if (daysDiff > streak || !log.success) {
      break;
    }
  }

  return streak;
}
