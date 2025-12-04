"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import type { DailyLog } from "@/db/schema";

interface DailyPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate?: string; // YYYY-MM-DD format, undefined = today
  existingLog?: DailyLog;
}

// Get today's date as YYYY-MM-DD
function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

// Format date for display
function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "today";
  if (dateStr === getTodayString()) return "today";
  
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function DailyPrompt({
  open,
  onOpenChange,
  targetDate,
  existingLog,
}: DailyPromptProps) {
  const queryClient = useQueryClient();
  const [optimisticSuccess, setOptimisticSuccess] = useState<boolean | null>(
    null
  );

  const isToday = !targetDate || targetDate === getTodayString();
  const hasLogged = !!existingLog;
  const existingSuccess = existingLog?.success;

  const logMutation = useMutation({
    mutationFn: async (success: boolean) => {
      const response = await client.logs.logDay.$post({ success, date: targetDate });
      const data = await response.json();
      return { success, data };
    },
    onMutate: async (success) => {
      setOptimisticSuccess(success);
    },
    onSuccess: ({ success }) => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["todayStatus"] });
      
      // Show toast
      const dateLabel = formatDisplayDate(targetDate);
      if (success) {
        toast.success(`Win logged for ${dateLabel}! 🎉`, {
          description: "Keep up the great work!",
        });
        // Trigger confetti only for today
        if (isToday) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10b981", "#34d399", "#6ee7b7"],
          });
        }
      } else {
        toast(`Day logged for ${dateLabel}`, {
          description: "Every day is a new opportunity.",
        });
      }
      
      setTimeout(() => onOpenChange(false), 600);
    },
    onSettled: () => {
      setOptimisticSuccess(null);
    },
  });

  const displaySuccess =
    optimisticSuccess !== null ? optimisticSuccess : existingSuccess;
  
  const displayDate = formatDisplayDate(targetDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
            {hasLogged ? `Update ${displayDate}` : `How was ${displayDate}?`}
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            {hasLogged
              ? "Change your response"
              : "Reflect on this day"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-6 py-6">
          <button
            className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
              displaySuccess === true
                ? "bg-emerald-500 scale-105 shadow-lg shadow-emerald-500/25"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            }`}
            onClick={() => logMutation.mutate(true)}
            disabled={logMutation.isPending}
          >
            {logMutation.isPending && optimisticSuccess === true ? (
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            ) : (
              <ThumbsUp
                className={`h-10 w-10 transition-colors ${
                  displaySuccess === true 
                    ? "text-white" 
                    : "text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700"
                }`}
              />
            )}
            <span className={`text-sm font-medium ${
              displaySuccess === true 
                ? "text-white" 
                : "text-slate-600 dark:text-slate-300"
            }`}>
              Win
            </span>
          </button>
          <button
            className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
              displaySuccess === false
                ? "bg-rose-500 scale-105 shadow-lg shadow-rose-500/25"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            }`}
            onClick={() => logMutation.mutate(false)}
            disabled={logMutation.isPending}
          >
            {logMutation.isPending && optimisticSuccess === false ? (
              <Loader2 className="h-10 w-10 animate-spin text-white" />
            ) : (
              <ThumbsDown
                className={`h-10 w-10 transition-colors ${
                  displaySuccess === false 
                    ? "text-white" 
                    : "text-rose-600 dark:text-rose-400 group-hover:text-rose-700"
                }`}
              />
            )}
            <span className={`text-sm font-medium ${
              displaySuccess === false 
                ? "text-white" 
                : "text-slate-600 dark:text-slate-300"
            }`}>
              Loss
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
