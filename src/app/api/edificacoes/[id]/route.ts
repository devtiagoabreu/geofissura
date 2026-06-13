import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { sensores } from "@/lib/db/schema/sensores"
import { planosDados } from "@/lib/db/schema/planos-dados"
import { equipamentos } from "@/lib/db/schema/equipamentos"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(edificacoes.id, Number(params.id))]
    if (!isSuper) conditions.push(eq(edificacoes.clienteId, clienteId!))
    const dado = await db.query.edificacoes.findFirst({
      where: and(...conditions),
    })

    if (!dado) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    }

    return NextResponse.json(dado)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const updConditions = [eq(edificacoes.id, Number(params.id))]
    if (!isSuper) updConditions.push(eq(edificacoes.clienteId, clienteId!))
    const [atualizado] = await db.update(edificacoes)
      .set(body)
      .where(and(...updConditions))
      .returning()

    return NextResponse.json(atualizado)
  } catch (err) {
    return apiError(err)
  }
}

async function cascadeAtivo(id: number, ativo: string, clienteId: number | null, isSuper: boolean) {
  const conditions = [eq(sensores.edificacaoId, id)]
  if (!isSuper) conditions.push(eq(sensores.clienteId, clienteId!))
  await db.update(sensores).set({ ativo }).where(and(...conditions))

  const pConditions = [eq(planosDados.edificacaoId, id)]
  await db.update(planosDados).set({ ativo }).where(and(...pConditions))

  const eConditions = [eq(equipamentos.edificacaoId, id)]
  await db.update(equipamentos).set({ ativo }).where(and(...eConditions))
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const delConditions = [eq(edificacoes.id, Number(params.id))]
    if (!isSuper) delConditions.push(eq(edificacoes.clienteId, clienteId!))
    await db.update(edificacoes)
      .set({ ativo: "N" })
      .where(and(...delConditions))

    await cascadeAtivo(Number(params.id), "N", clienteId!, isSuper)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
