export type Role = "ADMIN" | "USER" | "VIEWER"

export interface NavItem {
  titulo: string
  href: string
  icon: string
  roles: Role[]
  children?: NavItem[]
}
