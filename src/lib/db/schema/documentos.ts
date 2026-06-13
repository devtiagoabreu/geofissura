import { pgTable, serial, varchar, integer, timestamp, text } from "drizzle-orm/pg-core"
import { clientes } from "./clientes"
import { edificacoes } from "./edificacoes"
import { usuarios } from "./usuarios"

export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => clientes.id),
  edificacaoId: integer("edificacao_id").notNull().references(() => edificacoes.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1000 }).notNull(),
  descricao: text("descricao").notNull(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  createdAt: timestamp("created_at").defaultNow(),
})

export type Documento = typeof documentos.$inferSelect
export type NewDocumento = typeof documentos.$inferInsert
