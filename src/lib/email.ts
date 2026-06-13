import nodemailer from "nodemailer"
import { db } from "@/lib/db"
import { notificacoesConfig } from "@/lib/db/schema/notificacoes-config"
import { eq } from "drizzle-orm"

export async function getTransporter(clienteId: number) {
  const config = await db
    .select()
    .from(notificacoesConfig)
    .where(eq(notificacoesConfig.clienteId, clienteId))
    .then((r) => r[0] ?? null)

  if (!config || !config.smtpUser || !config.smtpPass) {
    return null
  }

  return nodemailer.createTransport({
    host: config.smtpHost || "smtp.gmail.com",
    port: config.smtpPort || 587,
    secure: false,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  })
}

export function getFromAddress(clienteId: number, config?: { smtpFrom?: string | null; smtpUser?: string | null }) {
  if (config?.smtpFrom) return config.smtpFrom
  if (config?.smtpUser) return config.smtpUser
  return "noreply@geofissura.com.br"
}

export async function sendNotificationEmail(
  clienteId: number,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const config = await db
      .select()
      .from(notificacoesConfig)
      .where(eq(notificacoesConfig.clienteId, clienteId))
      .then((r) => r[0] ?? null)

    if (!config?.smtpUser || !config?.smtpPass) return false

    const transporter = nodemailer.createTransport({
      host: config.smtpHost || "smtp.gmail.com",
      port: config.smtpPort || 587,
      secure: false,
      auth: { user: config.smtpUser, pass: config.smtpPass },
    })

    await transporter.sendMail({
      from: getFromAddress(clienteId, config),
      to,
      subject,
      html,
    })

    return true
  } catch {
    return false
  }
}
