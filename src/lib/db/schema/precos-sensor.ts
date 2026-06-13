import { pgTable, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core"
import { sensores } from "./sensores"

export const precosSensor = pgTable("precos_sensor", {
  id: serial("id").primaryKey(),
  sensorId: integer("sensor_id").notNull().unique().references(() => sensores.id, { onDelete: "cascade" }),
  valorMensal: numeric("valor_mensal", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type PrecoSensor = typeof precosSensor.$inferSelect
export type NewPrecoSensor = typeof precosSensor.$inferInsert
