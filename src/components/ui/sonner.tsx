"use client"

import { Toaster as SonnerToaster } from "sonner"
import { useTheme } from "next-themes"

export function Sonner() {
  const { theme } = useTheme()

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-slate-900 group-[.toaster]:text-slate-900 group-[.toaster]:dark:text-slate-100 group-[.toaster]:border group-[.toaster]:border-slate-200 group-[.toaster]:dark:border-slate-800 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-slate-500 group-[.toast]:dark:text-slate-400",
          actionButton:
            "group-[.toast]:bg-brand group-[.toast]:text-brand-foreground",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500 group-[.toast]:dark:bg-slate-800 group-[.toast]:dark:text-slate-400",
        },
      }}
    />
  )
}
