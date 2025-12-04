"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailyLog } from "@/db/schema";

interface TrendsChartProps {
  logs: DailyLog[];
}

// Parse date string to local Date
function parseLocalDate(date: string | Date): Date {
  if (typeof date === "string") {
    const dateStr = date.substring(0, 10);
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return date;
}

export function TrendsChart({ logs }: TrendsChartProps) {
  const chartData = useMemo(() => {
    if (logs.length === 0) return [];

    // Get last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    // Create a map of dates to success values
    const logMap = new Map<string, boolean>();
    logs.forEach((log) => {
      const dateStr =
        typeof log.date === "string" ? log.date.substring(0, 10) : "";
      logMap.set(dateStr, log.success);
    });

    // Generate data for each day
    const data = [];
    let runningWins = 0;
    let totalDays = 0;

    for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const hasLog = logMap.has(dateStr);
      const isWin = logMap.get(dateStr) === true;

      if (hasLog) {
        totalDays++;
        if (isWin) runningWins++;
      }

      const winRate = totalDays > 0 ? Math.round((runningWins / totalDays) * 100) : 0;

      data.push({
        date: dateStr,
        displayDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        winRate,
        wins: runningWins,
        total: totalDays,
      });
    }

    return data;
  }, [logs]);

  if (logs.length < 3) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Trends</h2>
        <div className="h-32 flex items-center justify-center text-slate-400 text-sm">
          Log at least 3 days to see trends
        </div>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5"
      aria-labelledby="trends-heading"
    >
      <h2 id="trends-heading" className="font-semibold text-slate-900 dark:text-white mb-4">
        Win Rate Trend (30 days)
      </h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorWinRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500">{data.displayDate}</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {data.winRate}% win rate
                      </p>
                      <p className="text-xs text-slate-400">
                        {data.wins} wins / {data.total} days
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="winRate"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorWinRate)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
