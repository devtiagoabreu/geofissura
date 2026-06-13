import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("USER"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Usuario = typeof usuarios.$inferSelect
export type NewUsuario = typeof usuarios.$inferInsert
