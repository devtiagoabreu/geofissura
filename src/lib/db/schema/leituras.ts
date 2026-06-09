import { pgTable, serial, varchar, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { entidadesDaEdificacao } from "./entidades-da-edificacao"

export const leituras = pgTable("leituras", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  entidadeId: integer("entidade_id").notNull().references(() => entidadesDaEdificacao.id, { onDelete: "cascade" }),
  topicoMqtt: varchar("topico_mqtt", { length: 500 }),
  valor: numeric("valor", { precision: 12, scale: 4 }),
  unidade: varchar("unidade", { length: 20 }),
  metadata: jsonb("metadata").default({}),
  lidaEm: timestamp("lida_em").defaultNow(),
})

export type Leitura = typeof leituras.$inferSelect
export type NewLeitura = typeof leituras.$inferInsert
