import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leituras } from "@/lib/db/schema/leituras"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = []
    if (!isSuper) conditions.push(eq(leituras.clienteId, clienteId!))
    const dados = await db.select()
      .from(leituras)
      .where(and(...conditions))
      .limit(50)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}
