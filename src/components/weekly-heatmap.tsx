"use client";

import type { DailyLog } from "@/db/schema";

interface WeeklyHeatmapProps {
  logs: DailyLog[];
}

export function WeeklyHeatmap({ logs }: WeeklyHeatmapProps) {
  const last7Days = getLast7Days();
  
  // Create a map of date -> success status
  const logMap = new Map<string, boolean>();
  logs.forEach((log) => {
    const dateStr = formatDate(log.date);
    logMap.set(dateStr, log.success);
  });

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
        Last 7 Days
      </h3>
      <div className="flex gap-1.5">
        {last7Days.map((day) => {
          const dateStr = formatDate(day.date);
          const hasLog = logMap.has(dateStr);
          const isSuccess = logMap.get(dateStr);
          const isToday = day.isToday;

          return (
            <div key={dateStr} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full aspect-square rounded-lg transition-all ${
                  !hasLog
                    ? isToday
                      ? "bg-slate-200 dark:bg-slate-700 ring-2 ring-slate-400 dark:ring-slate-500"
                      : "bg-slate-100 dark:bg-slate-800"
                    : isSuccess
                    ? "bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />
              <span className={`text-[10px] ${
                isToday 
                  ? "font-semibold text-slate-900 dark:text-white" 
                  : "text-slate-400 dark:text-slate-500"
              }`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getLast7Days() {
  const days = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    days.push({
      date,
      label: dayLabels[date.getDay()],
      isToday: i === 0,
    });
  }

  return days;
}

function formatDate(date: string | Date): string {
  if (typeof date === "string") {
    // If it's a string like "2025-12-04", return it directly (avoid timezone issues)
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // If it has time component, extract just the date part
    return date.split("T")[0];
  }
  // For Date objects, use local date
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
