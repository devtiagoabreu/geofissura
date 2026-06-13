import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { equipamentos } from "@/lib/db/schema/equipamentos"
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
    const { id, valorUnitario } = body

    if (!id || valorUnitario === undefined) {
      return NextResponse.json({ error: "id e valorUnitario são obrigatórios" }, { status: 400 })
    }

    const [eqp] = await db
      .update(equipamentos)
      .set({ valorUnitario: String(valorUnitario), updatedAt: new Date() })
      .where(eq(equipamentos.id, Number(id)))
      .returning()

    if (!eqp) return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    return NextResponse.json(eqp)
  } catch (err) {
    return apiError(err)
  }
}
