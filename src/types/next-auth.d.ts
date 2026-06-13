import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      clienteId: number
    }
  }

  interface User {
    clienteId: number
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    clienteId: number
    role: string
  }
}
