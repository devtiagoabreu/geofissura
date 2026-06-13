import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoesRegras } from "@/lib/db/schema/notificacoes-regras"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const regra = await db
      .select()
      .from(notificacoesRegras)
      .where(eq(notificacoesRegras.id, id))
      .then((r) => r[0] ?? null)

    if (!regra) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 })
    }

    return NextResponse.json(regra)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await req.json()
    const { nome, descricao, sensorTipo, condicao, valorMin, valorMax, prioridade, ativo } = body

    const [atualizada] = await db
      .update(notificacoesRegras)
      .set({ nome, descricao, sensorTipo, condicao, valorMin, valorMax, prioridade, ativo, updatedAt: new Date() })
      .where(eq(notificacoesRegras.id, id))
      .returning()

    return NextResponse.json(atualizada)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    await db.delete(notificacoesRegras).where(eq(notificacoesRegras.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
