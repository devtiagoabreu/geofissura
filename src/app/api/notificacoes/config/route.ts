import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { notificacoesConfig } from "@/lib/db/schema/notificacoes-config"
import { getSession } from "@/lib/cliente"
import { eq } from "drizzle-orm"
import { apiError } from "@/lib/api-error"

export async function GET() {
  try {
    const { session, clienteId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    let config = await db
      .select()
      .from(notificacoesConfig)
      .where(eq(notificacoesConfig.clienteId, clienteId!))
      .then((r) => r[0] ?? null)

    if (!config) {
      const [nova] = await db
        .insert(notificacoesConfig)
        .values({ clienteId: clienteId! })
        .returning()
      config = nova
    }

    return NextResponse.json(config)
  } catch (err) {
    return apiError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { session, clienteId } = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, pushAtivo, emailAtivo } = body

    const existente = await db
      .select()
      .from(notificacoesConfig)
      .where(eq(notificacoesConfig.clienteId, clienteId!))
      .then((r) => r[0] ?? null)

    let config
    if (existente) {
      [config] = await db
        .update(notificacoesConfig)
        .set({ smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, pushAtivo, emailAtivo, updatedAt: new Date() })
        .where(eq(notificacoesConfig.clienteId, clienteId!))
        .returning()
    } else {
      [config] = await db
        .insert(notificacoesConfig)
        .values({ clienteId: clienteId!, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, pushAtivo, emailAtivo })
        .returning()
    }

    return NextResponse.json(config)
  } catch (err) {
    return apiError(err)
  }
}
