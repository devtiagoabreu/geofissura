import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tenantId: number
    }
  }

  interface User {
    tenantId: number
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId: number
    role: string
  }
}
