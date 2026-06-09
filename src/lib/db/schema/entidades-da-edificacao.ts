import { pgTable, serial, varchar, integer, timestamp, text, jsonb } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { edificacoes } from "./edificacoes"

export const entidadesDaEdificacao = pgTable("entidades_da_edificacao", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  tipoEntidade: varchar("tipo_entidade", { length: 50 }).notNull(),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  dados: jsonb("dados").notNull().default({}),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type EntidadeDaEdificacao = typeof entidadesDaEdificacao.$inferSelect
export type NewEntidadeDaEdificacao = typeof entidadesDaEdificacao.$inferInsert
