import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tenants } from "@/lib/db/schema/tenants"
import { getSession } from "@/lib/tenant"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { session, isSuper } = await getSession()
    if (!session || !isSuper) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const id = parseInt(params.id)
    const tenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .then((r) => r[0] ?? null)

    if (!tenant) {
      return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 })
    }

    return NextResponse.json(tenant)
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
      .update(tenants)
      .set({ nome, slug, ativo, updatedAt: new Date() })
      .where(eq(tenants.id, id))
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
    await db.delete(tenants).where(eq(tenants.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
