"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  FileText,
  Bell,
  Settings,
  Key,
} from "lucide-react"
import { useSession } from "next-auth/react"

const NAV_ITENS = [
  {
    titulo: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER", "ADMIN", "USER", "VIEWER"],
  },
  {
    titulo: "Edificações",
    href: "/edificacoes",
    icon: Building2,
    roles: ["SUPER", "ADMIN", "USER", "VIEWER"],
  },
  {
    titulo: "Sensores",
    href: "/sensores",
    icon: Users,
    roles: ["SUPER", "ADMIN", "USER", "VIEWER"],
  },
  {
    titulo: "Leituras",
    href: "/leituras",
    icon: Activity,
    roles: ["SUPER", "ADMIN", "USER", "VIEWER"],
  },
  {
    titulo: "Relatórios",
    href: "/relatorios",
    icon: FileText,
    roles: ["SUPER", "ADMIN", "USER"],
  },
  {
    titulo: "Notificações",
    href: "/notificacoes",
    icon: Bell,
    roles: ["SUPER", "ADMIN", "USER"],
  },
  {
    titulo: "Administração",
    href: "/admin",
    icon: Settings,
    roles: ["SUPER", "ADMIN"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? "VIEWER"

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Building2 className="h-5 w-5 text-[var(--brand)]" />
          GeoFissura
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITENS.filter((item) => item.roles.includes(role as any)).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)]",
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "bg-[var(--bg-secondary)] text-[var(--brand)]"
                : "text-[var(--text-secondary)]",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.titulo}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--border)] p-4 space-y-2">
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-secondary)]",
            pathname === "/configuracoes" ? "bg-[var(--bg-secondary)] text-[var(--brand)]" : "text-[var(--text-secondary)]",
          )}
        >
          <Key className="h-4 w-4" />
          Configurações
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <div className="h-8 w-8 rounded-full bg-[var(--brand)] flex items-center justify-center text-white font-medium text-xs">
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="font-medium truncate">{session?.user?.name ?? "Usuário"}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
