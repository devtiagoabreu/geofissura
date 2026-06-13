import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { getSession } from "@/lib/cliente"
import { desc } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const dados = await db
      .select()
      .from(clientes)
      .orderBy(desc(clientes.createdAt))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { nome, slug } = body

    if (!nome || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 })
    }

    const [novo] = await db
      .insert(clientes)
      .values({ nome, slug })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
