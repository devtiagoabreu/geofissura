import { pgTable, serial, varchar, timestamp, jsonb } from "drizzle-orm/pg-core"

export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  config: jsonb("config").default({}),
  logo: varchar("logo", { length: 500 }),
  ativo: varchar("ativo", { length: 1 }).default("S"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Cliente = typeof clientes.$inferSelect
export type NewCliente = typeof clientes.$inferInsert
