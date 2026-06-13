import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { edificacoes } from "@/lib/db/schema/edificacoes"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = [eq(edificacoes.ativo, "S")]
    if (!isSuper) conditions.push(eq(edificacoes.clienteId, clienteId!))
    const dados = await db.select().from(edificacoes).where(and(...conditions))

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
    const [novo] = await db.insert(edificacoes)
      .values({ ...rest, clienteId: targetClienteId })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
