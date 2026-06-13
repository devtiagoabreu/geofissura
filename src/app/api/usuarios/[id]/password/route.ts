import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { getSession } from "@/lib/cliente"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, clienteId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const targetId = Number(params.id)
    const body = await req.json()
    const newPassword = body.newPassword as string

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    const conditions = [eq(usuarios.id, targetId)]
    if (!isSuper) {
      conditions.push(eq(usuarios.clienteId, clienteId!))

      const usuarioAtual = await db.query.usuarios.findFirst({
        where: eq(usuarios.id, Number(session.user.id)),
      })

      if (!usuarioAtual) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
      }

      const currentPassword = body.currentPassword as string
      if (!currentPassword) {
        return NextResponse.json({ error: "Senha atual é obrigatória" }, { status: 400 })
      }
      if (!bcrypt.compareSync(currentPassword, usuarioAtual.password)) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 403 })
      }
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10)

    await db.update(usuarios)
      .set({ password: hashedPassword })
      .where(and(...conditions))

    return NextResponse.json({ ok: true })
  } catch (err) {
    return apiError(err)
  }
}
