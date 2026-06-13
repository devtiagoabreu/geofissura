import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { usuarios } from "@/lib/db/schema/usuarios"
import { tenants } from "@/lib/db/schema/tenants"
import { getSession } from "@/lib/tenant"
import { eq, and } from "drizzle-orm"
import { apiError } from "@/lib/api-error"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const { session, tenantId, isSuper } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const conditions = isSuper ? [] : [eq(usuarios.tenantId, tenantId!)]
    const dados = await db.select({
      id: usuarios.id,
      tenantId: usuarios.tenantId,
      nome: usuarios.nome,
      email: usuarios.email,
      role: usuarios.role,
      tenantNome: tenants.nome,
      createdAt: usuarios.createdAt,
      updatedAt: usuarios.updatedAt,
    })
      .from(usuarios)
      .where(and(...conditions))
      .leftJoin(tenants, eq(usuarios.tenantId, tenants.id))

    return NextResponse.json(dados)
  } catch (err) {
    return apiError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, tenantId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const hashedPassword = bcrypt.hashSync(body.password as string, 10)

    const [novo] = await db.insert(usuarios)
      .values({
        nome: body.nome,
        email: body.email,
        password: hashedPassword,
        role: body.role ?? "USER",
        tenantId: tenantId!,
      })
      .returning()

    return NextResponse.json({
      id: novo.id,
      nome: novo.nome,
      email: novo.email,
      role: novo.role,
      createdAt: novo.createdAt,
      updatedAt: novo.updatedAt,
    }, { status: 201 })
  } catch (err) {
    return apiError(err)
  }
}
