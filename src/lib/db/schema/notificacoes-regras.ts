import { pgTable, serial, varchar, integer, numeric, boolean, timestamp, text } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"

export const notificacoesRegras = pgTable("notificacoes_regras", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  descricao: text("descricao"),
  sensorTipo: varchar("sensor_tipo", { length: 50 }),
  condicao: varchar("condicao", { length: 20 }).notNull().default(">"),
  valorMin: numeric("valor_min", { precision: 12, scale: 4 }),
  valorMax: numeric("valor_max", { precision: 12, scale: 4 }),
  prioridade: varchar("prioridade", { length: 20 }).default("media"),
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type NotificacaoRegra = typeof notificacoesRegras.$inferSelect
export type NewNotificacaoRegra = typeof notificacoesRegras.$inferInsert
