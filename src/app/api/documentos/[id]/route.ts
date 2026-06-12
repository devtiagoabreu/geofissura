import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documentos } from "@/lib/db/schema/documentos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { getSession } from "@/lib/tenant"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const updConditions = [eq(documentos.id, Number(params.id))]
    if (!isSuper) updConditions.push(eq(documentos.tenantId, tenantId!))

    const [atualizado] = await db.update(documentos)
      .set({ url: body.url, descricao: body.descricao })
      .where(and(...updConditions))
      .returning()

    const [comUsuario] = await db.select({
      id: documentos.id,
      url: documentos.url,
      descricao: documentos.descricao,
      usuarioId: documentos.usuarioId,
      usuarioNome: usuarios.nome,
      createdAt: documentos.createdAt,
    })
      .from(documentos)
      .leftJoin(usuarios, eq(documentos.usuarioId, usuarios.id))
      .where(eq(documentos.id, atualizado.id))

    return NextResponse.json(comUsuario)
  } catch (err) {
    return apiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const delConditions = [eq(documentos.id, Number(params.id))]
    if (!isSuper) delConditions.push(eq(documentos.tenantId, tenantId!))

    await db.delete(documentos).where(and(...delConditions))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
