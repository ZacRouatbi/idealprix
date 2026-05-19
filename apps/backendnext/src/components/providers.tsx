"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "@/lib/query-client"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/lib/context/auth-context"
import AppLayout from "@/components/app-layout"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}