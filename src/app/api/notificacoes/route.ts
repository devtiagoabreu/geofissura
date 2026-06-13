import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { getSession } from "@/lib/cliente"
import { eq, and, desc } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = isSuper ? [] : [eq(notificacoes.clienteId, clienteId!)]
    const dados = await db
      .select()
      .from(notificacoes)
      .where(and(...conditions))
      .orderBy(desc(notificacoes.createdAt))
      .limit(50)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}
