import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const edificacoes = pgTable("edificacoes", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  endereco: text("endereco"),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Edificacao = typeof edificacoes.$inferSelect
export type NewEdificacao = typeof edificacoes.$inferInsert
