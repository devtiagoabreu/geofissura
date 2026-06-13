import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as clientes from "./schema/clientes"
import * as usuarios from "./schema/usuarios"
import * as edificacoes from "./schema/edificacoes"
import * as sensores from "./schema/sensores"
import * as leituras from "./schema/leituras"
import * as documentos from "./schema/documentos"
import * as notificacoesConfig from "./schema/notificacoes-config"
import * as notificacoesRegras from "./schema/notificacoes-regras"
import * as notificacoesRegraDestinatarios from "./schema/notificacoes-regra-destinatarios"
import * as notificacoes from "./schema/notificacoes"

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error("DATABASE_URL não configurada")
}

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, {
  schema: { ...clientes, ...usuarios, ...edificacoes, ...sensores, ...leituras, ...documentos, ...notificacoesConfig, ...notificacoesRegras, ...notificacoesRegraDestinatarios, ...notificacoes },
})
