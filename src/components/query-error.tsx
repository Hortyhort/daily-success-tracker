"use client";

import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorProps {
  error: Error;
  onRetry: () => void;
  title?: string;
  compact?: boolean;
}

export function QueryError({ error, onRetry, title = "Failed to load", compact = false }: QueryErrorProps) {
  const isNetworkError = error.message.includes("fetch") || error.message.includes("network");
  const Icon = isNetworkError ? WifiOff : AlertCircle;

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 dark:text-red-300">{title}</span>
        </div>
        <Button
          onClick={onRetry}
          variant="ghost"
          size="sm"
          className="h-7 text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-6 min-h-[150px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-red-800 dark:text-red-200">{title}</h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400 max-w-[250px]">
          {isNetworkError
            ? "Check your internet connection and try again"
            : "Something went wrong. Please try again."}
        </p>
      </div>
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
