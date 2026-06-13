import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { documentos } from "@/lib/db/schema/documentos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const edificacaoId = req.nextUrl.searchParams.get("edificacaoId")
    if (!edificacaoId) {
      return NextResponse.json({ error: "edificacaoId é obrigatório" }, { status: 400 })
    }

    const conditions = [eq(documentos.edificacaoId, Number(edificacaoId))]
    if (!isSuper) conditions.push(eq(documentos.clienteId, clienteId!))

    const dados = await db.select({
      id: documentos.id,
      url: documentos.url,
      descricao: documentos.descricao,
      usuarioId: documentos.usuarioId,
      usuarioNome: usuarios.nome,
      createdAt: documentos.createdAt,
    })
      .from(documentos)
      .leftJoin(usuarios, eq(documentos.usuarioId, usuarios.id))
      .where(and(...conditions))
      .orderBy(documentos.createdAt)

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, clienteId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const [novo] = await db.insert(documentos)
      .values({
        clienteId: clienteId!,
        edificacaoId: Number(body.edificacaoId),
        url: body.url,
        descricao: body.descricao,
        usuarioId: Number(session.user.id),
      })
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
      .where(eq(documentos.id, novo.id))

    return NextResponse.json(comUsuario, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
