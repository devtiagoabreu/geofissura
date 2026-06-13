import { pgTable, serial, varchar, integer, timestamp, numeric, jsonb } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"
import { sensores } from "./sensores"

export const leituras = pgTable("leituras", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  sensorId: integer("sensor_id").notNull().references(() => sensores.id, { onDelete: "cascade" }),
  topicoMqtt: varchar("topico_mqtt", { length: 500 }),
  valor: numeric("valor", { precision: 12, scale: 4 }),
  unidade: varchar("unidade", { length: 20 }),
  metadata: jsonb("metadata").default({}),
  lidaEm: timestamp("lida_em").defaultNow(),
})

export type Leitura = typeof leituras.$inferSelect
export type NewLeitura = typeof leituras.$inferInsert
