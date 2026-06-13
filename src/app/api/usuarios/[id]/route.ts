import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const updConditions = [eq(usuarios.id, Number(params.id))]
    if (!isSuper) updConditions.push(eq(usuarios.clienteId, clienteId!))

    const updateData: Record<string, unknown> = {}
    if (body.nome) updateData.nome = body.nome
    if (body.email) updateData.email = body.email
    if (body.role) updateData.role = body.role

    const [atualizado] = await db.update(usuarios)
      .set(updateData)
      .where(and(...updConditions))
      .returning()

    return NextResponse.json({
      id: atualizado.id,
      nome: atualizado.nome,
      email: atualizado.email,
      role: atualizado.role,
      createdAt: atualizado.createdAt,
      updatedAt: atualizado.updatedAt,
    })
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const delConditions = [eq(usuarios.id, Number(params.id))]
    if (!isSuper) delConditions.push(eq(usuarios.clienteId, clienteId!))

    await db.delete(usuarios).where(and(...delConditions))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
