"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  // Register service worker for PWA
  useServiceWorker();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster 
          position="bottom-center" 
          toastOptions={{
            style: {
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
      </QueryClientProvider>
    </ClerkProvider>
  );
}
