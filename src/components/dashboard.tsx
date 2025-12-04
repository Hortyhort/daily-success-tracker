"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/client";
import { UserButton } from "@clerk/nextjs";
import { SuccessCalendar } from "./success-calendar";
import { DailyPrompt } from "./daily-prompt";
import { ThemeToggle } from "./theme-toggle";
import { WeeklyHeatmap } from "./weekly-heatmap";
import { Insights } from "./insights";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Download } from "lucide-react";
import { DashboardSkeleton } from "./skeletons";
import { QueryError } from "./query-error";
import { ErrorBoundary } from "./error-boundary";
import { OfflineIndicator } from "./offline-indicator";
import { Onboarding, useOnboarding } from "./onboarding";
import { TrendsChart } from "./trends-chart";
import { toast } from "sonner";
import type { DailyLog } from "@/db/schema";

// Format date to YYYY-MM-DD
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function Dashboard() {
  const [promptOpen, setPromptOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [logDate, setLogDate] = useState<string | undefined>(undefined);
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const [isExporting, setIsExporting] = useState(false);

  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const response = await client.logs.getLogs.$get();
      const data = await response.json();
      return data;
    },
    retry: 2,
    staleTime: 30000,
  });

  const todayQuery = useQuery({
    queryKey: ["todayStatus"],
    queryFn: async () => {
      const response = await client.logs.getTodayStatus.$get();
      const data = await response.json();
      return data;
    },
    retry: 2,
    staleTime: 30000,
  });

  const isLoading = logsQuery.isLoading || todayQuery.isLoading;
  const hasError = logsQuery.isError || todayQuery.isError;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (hasError) {
    const error = logsQuery.error || todayQuery.error;
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <QueryError
          error={error as Error}
          onRetry={() => {
            logsQuery.refetch();
            todayQuery.refetch();
          }}
          title="Failed to load your data"
        />
      </div>
    );
  }

  const logs: DailyLog[] = (logsQuery.data as { logs: DailyLog[] } | undefined)?.logs ?? [];
  const todayData = todayQuery.data as { hasLoggedToday: boolean; todayLog: DailyLog | null } | undefined;
  const hasLoggedToday = todayData?.hasLoggedToday ?? false;
  const todaySuccess = todayData?.todayLog?.success;
  
  // Calculate current streak
  const streak = calculateStreak(logs);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Success Tracker
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-xl mx-auto space-y-6">
          
          {/* Welcome / CTA Banner */}
          {!hasLoggedToday ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30 p-6">
              <div className="relative">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Ready to reflect?
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400 text-sm">
                  Take a moment to log how your day went.
                </p>
                <Button
                  onClick={() => setPromptOpen(true)}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                  size="sm"
                >
                  Log Today
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/30 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                <span className="text-lg">{todaySuccess ? "✓" : "–"}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Today logged as {todaySuccess ? "successful" : "not successful"}
                </p>
                <button 
                  onClick={() => setPromptOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Change response
                </button>
              </div>
            </div>
          )}

          {/* Weekly Heatmap */}
          <WeeklyHeatmap logs={logs} />

          {/* Calendar */}
          <SuccessCalendar
            logs={logs}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              if (date && date <= new Date()) {
                setSelectedDate(date);
                setLogDate(formatDateString(date));
                setPromptOpen(true);
              }
            }}
          />

          {/* Trends Chart */}
          <TrendsChart logs={logs} />

          {/* Insights */}
          <Insights logs={logs} streak={streak} />

          {/* Export Button */}
          {logs.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const response = await client.logs.exportLogs.$get();
                    const data = await response.json();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `success-tracker-export-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Data exported successfully!");
                  } catch {
                    toast.error("Failed to export data");
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="text-slate-500"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Data"}
              </Button>
            </div>
          )}

          {/* Empty State */}
          {logs.length === 0 && (
            <div className="text-center py-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Start tracking to see your progress here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <Button
        onClick={() => setPromptOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-emerald-500/25 bg-emerald-600 hover:bg-emerald-700 transition-transform hover:scale-105 active:scale-95"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <DailyPrompt
        open={promptOpen}
        onOpenChange={(open) => {
          setPromptOpen(open);
          if (!open) {
            setLogDate(undefined);
            setSelectedDate(undefined);
          }
        }}
        targetDate={logDate}
        existingLog={logDate ? logs.find(l => {
          const logDateStr = typeof l.date === 'string' ? l.date.substring(0, 10) : formatDateString(l.date);
          return logDateStr === logDate;
        }) : undefined}
      />

      {/* Onboarding */}
      <Onboarding open={showOnboarding} onComplete={completeOnboarding} />

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
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
