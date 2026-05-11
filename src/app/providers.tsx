"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { useState } from "react";
import { HapticsProvider } from "@/components/haptics-provider";
import { NavbarStyleProvider } from "@/components/navbar-style-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <HapticsProvider>
          <NavbarStyleProvider>{children}</NavbarStyleProvider>
        </HapticsProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
