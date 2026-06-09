import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.query.usuarios.findFirst({
          where: eq(usuarios.email, credentials.email as string),
        })

        if (!user || !bcrypt.compareSync(credentials.password as string, user.password)) {
          return null
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.nome,
          role: user.role ?? "USER",
          tenantId: user.tenantId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.tenantId = token.tenantId as number
      session.user.role = token.role as string
      return session
    },
  },
}

export function auth() {
  return getServerSession(authOptions)
}
