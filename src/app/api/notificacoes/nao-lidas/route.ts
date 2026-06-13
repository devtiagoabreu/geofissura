import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { getSession } from "@/lib/cliente"
import { eq, and, sql } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificacoes)
      .where(and(eq(notificacoes.clienteId, clienteId!), eq(notificacoes.lida, false)))

    return NextResponse.json({ naoLidas: result.count })
  } catch (err) {
    return apiError(err)
  }
}
