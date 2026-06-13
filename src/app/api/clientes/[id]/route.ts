import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const cliente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, id))
      .then((r) => r[0] ?? null)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const body = await req.json()
    const { nome, slug, ativo } = body

    const [atualizado] = await db
      .update(clientes)
      .set({ nome, slug, ativo, updatedAt: new Date() })
      .where(eq(clientes.id, id))
      .returning()

    return NextResponse.json(atualizado)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    await db.delete(clientes).where(eq(clientes.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
