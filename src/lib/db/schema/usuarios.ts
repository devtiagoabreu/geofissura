import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
  nome: varchar("nome", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("USER"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Usuario = typeof usuarios.$inferSelect
export type NewUsuario = typeof usuarios.$inferInsert
