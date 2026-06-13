import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sensores } from "@/lib/db/schema/sensores"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { clientes } from "@/lib/db/schema/clientes"
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
    if (!isSuper) conditions.push(eq(sensores.clienteId, clienteId!))
    const dados = await db.select({
      id: sensores.id,
      clienteId: sensores.clienteId,
      edificacaoId: sensores.edificacaoId,
      tipoSensor: sensores.tipoSensor,
      nome: sensores.nome,
      descricao: sensores.descricao,
      dados: sensores.dados,
      ativo: sensores.ativo,
      createdAt: sensores.createdAt,
      updatedAt: sensores.updatedAt,
      edificacaoNome: edificacoes.nome,
      clienteNome: clientes.nome,
    })
      .from(sensores)
      .leftJoin(edificacoes, eq(sensores.edificacaoId, edificacoes.id))
      .leftJoin(clientes, eq(sensores.clienteId, clientes.id))
      .where(and(...conditions))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const targetClienteId = isSuper && body.clienteId ? Number(body.clienteId) : clienteId!
    const { clienteId: _, ...rest } = body
    const [novo] = await db.insert(sensores)
      .values({ ...rest, clienteId: targetClienteId })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
