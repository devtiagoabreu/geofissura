import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { planosDados } from "@/lib/db/schema/planos-dados"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function PUT(req: NextRequest) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { id, valorMensal } = body

    if (!id || valorMensal === undefined) {
      return NextResponse.json({ error: "id e valorMensal são obrigatórios" }, { status: 400 })
    }

    const [plano] = await db
      .update(planosDados)
      .set({ valorMensal: String(valorMensal), updatedAt: new Date() })
      .where(eq(planosDados.id, Number(id)))
      .returning()

    if (!plano) return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    return NextResponse.json(plano)
  } catch (err) {
    return apiError(err)
  }
}
