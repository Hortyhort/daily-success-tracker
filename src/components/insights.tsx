"use client";

import type { DailyLog } from "@/db/schema";
import { TrendingUp, TrendingDown, Minus, Award, Target } from "lucide-react";

interface InsightsProps {
  logs: DailyLog[];
  streak: number;
}

export function Insights({ logs, streak }: InsightsProps) {
  const stats = calculateStats(logs);

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
        Insights
      </h3>

      <div className="space-y-4">
        {/* Weekly Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {stats.weeklyTrend === "up" ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : stats.weeklyTrend === "down" ? (
              <TrendingDown className="h-4 w-4 text-rose-500" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-sm text-slate-600 dark:text-slate-400">
              This week
            </span>
          </div>
          <span className={`text-sm font-medium ${
            stats.weeklyTrend === "up" 
              ? "text-emerald-600 dark:text-emerald-400" 
              : stats.weeklyTrend === "down"
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-600 dark:text-slate-400"
          }`}>
            {stats.thisWeekWins}/{stats.thisWeekTotal} wins
          </span>
        </div>

        {/* Best Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Best streak
            </span>
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {stats.bestStreak} days
          </span>
        </div>

        {/* Success Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              All-time rate
            </span>
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {stats.successRate}%
          </span>
        </div>

        {/* Motivational Message */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            {getMotivationalMessage(streak, stats)}
          </p>
        </div>
      </div>
    </div>
  );
}

function calculateStats(logs: DailyLog[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  let thisWeekWins = 0;
  let thisWeekTotal = 0;
  let lastWeekWins = 0;
  let lastWeekTotal = 0;

  logs.forEach((log) => {
    // Parse date string directly to avoid timezone issues
    const dateStr = typeof log.date === 'string' ? log.date.substring(0, 10) : log.date;
    const [year, month, day] = String(dateStr).split('-').map(Number);
    const logDate = new Date(year, month - 1, day);
    
    if (logDate >= startOfWeek) {
      thisWeekTotal++;
      if (log.success) thisWeekWins++;
    } else if (logDate >= lastWeekStart) {
      lastWeekTotal++;
      if (log.success) lastWeekWins++;
    }
  });

  const thisWeekRate = thisWeekTotal > 0 ? thisWeekWins / thisWeekTotal : 0;
  const lastWeekRate = lastWeekTotal > 0 ? lastWeekWins / lastWeekTotal : 0;

  let weeklyTrend: "up" | "down" | "same" = "same";
  if (thisWeekRate > lastWeekRate + 0.1) weeklyTrend = "up";
  else if (thisWeekRate < lastWeekRate - 0.1) weeklyTrend = "down";

  // Calculate best streak
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let bestStreak = 0;
  let currentStreak = 0;
  let lastDate: Date | null = null;

  sortedLogs.forEach((log) => {
    // Parse date string directly to avoid timezone issues
    const dateStr = typeof log.date === 'string' ? log.date.substring(0, 10) : log.date;
    const [year, month, day] = String(dateStr).split('-').map(Number);
    const logDate = new Date(year, month - 1, day);

    if (log.success) {
      if (lastDate) {
        const diff = (logDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      bestStreak = Math.max(bestStreak, currentStreak);
      lastDate = logDate;
    } else {
      currentStreak = 0;
      lastDate = null;
    }
  });

  const totalWins = logs.filter((l) => l.success).length;
  const successRate = logs.length > 0 ? Math.round((totalWins / logs.length) * 100) : 0;

  return {
    thisWeekWins,
    thisWeekTotal,
    lastWeekWins,
    lastWeekTotal,
    weeklyTrend,
    bestStreak,
    successRate,
  };
}

function getMotivationalMessage(streak: number, stats: ReturnType<typeof calculateStats>): string {
  if (streak >= 30) return "Incredible! A month of consistency. You're unstoppable! 🏆";
  if (streak >= 14) return "Two weeks strong! You're building real momentum. 🚀";
  if (streak >= 7) return "One week streak! Habits are forming. Keep it up! ⭐";
  if (streak >= 3) return "Three days in a row! You're on a roll. 🔥";
  if (streak === 1) return "Great start today! Every journey begins with a single step.";
  if (stats.weeklyTrend === "up") return "Your week is trending up! Keep the momentum going.";
  if (stats.successRate >= 70) return "Strong track record! You're doing great overall.";
  if (stats.thisWeekTotal === 0) return "Ready to log today? Small wins add up to big results.";
  return "Every day is a fresh opportunity. You've got this! 💪";
}
