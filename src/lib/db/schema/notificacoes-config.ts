import { pgTable, serial, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"

export const notificacoesConfig = pgTable("notificacoes_config", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().unique().references(() => clientes.id),
  smtpHost: varchar("smtp_host", { length: 255 }).default("smtp.gmail.com"),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: varchar("smtp_user", { length: 255 }),
  smtpPass: varchar("smtp_pass", { length: 255 }),
  smtpFrom: varchar("smtp_from", { length: 255 }),
  pushAtivo: boolean("push_ativo").default(true),
  emailAtivo: boolean("email_ativo").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type NotificacoesConfig = typeof notificacoesConfig.$inferSelect
export type NewNotificacoesConfig = typeof notificacoesConfig.$inferInsert
