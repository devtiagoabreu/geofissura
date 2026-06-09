"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Sidebar } from "./sidebar"
import { Header } from "./header"

const queryClient = new QueryClient()

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen">
          <Sidebar />
          <div className="pl-60">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </QueryClientProvider>
    </SessionProvider>
  )
}
