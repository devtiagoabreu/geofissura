import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { planosDados } from "@/lib/db/schema/planos-dados"
import { equipamentos } from "@/lib/db/schema/equipamentos"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(edificacoes.id, Number(params.id))]
    if (!isSuper) conditions.push(eq(edificacoes.clienteId, clienteId!))
    await db.update(edificacoes)
      .set({ ativo: "S" })
      .where(and(...conditions))

    await db.update(sensores)
      .set({ ativo: "S" })
      .where(and(eq(sensores.edificacaoId, Number(params.id))))

    await db.update(planosDados)
      .set({ ativo: "S" })
      .where(and(eq(planosDados.edificacaoId, Number(params.id))))

    await db.update(equipamentos)
      .set({ ativo: "S" })
      .where(and(eq(equipamentos.edificacaoId, Number(params.id))))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
