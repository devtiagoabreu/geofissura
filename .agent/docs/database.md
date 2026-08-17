# GeoFissura — Banco de Dados

> Schema, migrations e estrutura do banco PostgreSQL (Neon).

---

## Configuração

| Configuração | Valor |
|-------------|-------|
| Driver | `postgres` (npm package) |
| ORM | Drizzle ORM |
| Dialect | PostgreSQL |
| Host | Neon (serverless, sa-east-1) |
| `prepare` | `false` (compatibilidade Neon) |
| Schema path | `./src/lib/db/schema/*` |
| Migrations path | `./src/lib/db/migrations` |

---

## Tabelas (14 tabelas)

### Tabelas Principais

| Tabela | Descrição | Chaves |
|--------|-----------|--------|
| `clientes` | Construtoras/clientes (multi-tenant) | PK `id`, UNIQUE `slug` |
| `usuarios` | Usuários por cliente | PK `id`, FK `cliente_id` |
| `edificacoes` | Edificações/obras | PK `id`, FK `cliente_id` |
| `sensores` | Sensores IoT instalados | PK `id`, FK `cliente_id`, FK `edificacao_id`, UNIQUE `uuid` |
| `leituras` | Leituras temporais dos sensores | PK `id`, FK `cliente_id`, FK `sensor_id` |
| `documentos` | Links de documentos externos | PK `id`, FK `cliente_id`, FK `edificacao_id` |
| `planos_dados` | Planos de dados por edificação | PK `id`, FK `edificacao_id` |
| `equipamentos` | Equipamentos por edificação | PK `id`, FK `edificacao_id` |

### Tabelas de Notificação

| Tabela | Descrição |
|--------|-----------|
| `notificacoes` | Notificações por usuário |
| `notificacoes_config` | Configuração SMTP por cliente |
| `notificacoes_regras` | Regras de alerta |
| `notificacoes_regra_destinatarios` | Destinatários por regra |

### Tabelas de Lookup

| Tabela | Descrição |
|--------|-----------|
| `tipos_sensor` | Catálogo de tipos de sensor |
| `tipos_equipamento` | Catálogo de tipos de equipamento |

### Tabela Legacy

| Tabela | Descrição |
|--------|-----------|
| `tenants` | Legado (renomeada para `clientes` na migration 0005) |

---

## Schema Detalhado

### `clientes`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do cliente |
| `nome` | VARCHAR(255) | NOT NULL | Nome da construtora |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | Slug para URLs |
| `config` | JSONB | | Configurações customizadas |
| `logo` | TEXT | | URL do logo |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `atualizado_em` | TIMESTAMP | | Última atualização |

### `usuarios`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do usuário |
| `cliente_id` | INTEGER | FK → clientes | Cliente dono |
| `nome` | VARCHAR(255) | NOT NULL | Nome completo |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email (login) |
| `password` | VARCHAR(255) | NOT NULL | Hash bcrypt |
| `role` | VARCHAR(20) | DEFAULT 'USER' | SUPER/ADMIN/USER/VIEWER |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |

### `edificacoes`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID da edificação |
| `cliente_id` | INTEGER | FK → clientes | Cliente dono |
| `nome` | VARCHAR(255) | NOT NULL | Nome da edificação |
| `endereco` | TEXT | | Endereço |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `atualizado_em` | TIMESTAMP | | Última atualização |

### `sensores`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do sensor |
| `cliente_id` | INTEGER | FK → clientes | Cliente dono |
| `edificacao_id` | INTEGER | FK → edificacoes (CASCADE) | Edificação |
| `tipo_sensor` | VARCHAR(50) | NOT NULL | Tipo (fissurometro, etc.) |
| `nome` | VARCHAR(255) | NOT NULL | Nome do sensor |
| `uuid` | VARCHAR(50) | UNIQUE, NOT NULL | UUID único (ex: GF-000001) |
| `modelo` | VARCHAR(100) | | Modelo do dispositivo |
| `unidade` | VARCHAR(20) | | Unidade de medida (mm, °C, etc.) |
| `fabricante` | VARCHAR(100) | | Fabricante |
| `valor_mensal` | NUMERIC(10,2) | | Custo mensal |
| `dados` | JSONB | | Dados extras flexíveis |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |
| `atualizado_em` | TIMESTAMP | | Última atualização |

### `leituras`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID da leitura |
| `cliente_id` | INTEGER | FK → clientes | Cliente dono |
| `sensor_id` | INTEGER | FK → sensores (CASCADE) | Sensor |
| `topico_mqtt` | VARCHAR(255) | | Tópico MQTT de origem |
| `valor` | NUMERIC(12,4) | NOT NULL | Valor medido |
| `unidade` | VARCHAR(20) | | Unidade de medida |
| `metadata` | JSONB | | Dados extras da leitura |
| `lida_em` | TIMESTAMP | DEFAULT NOW() | Momento da leitura |

### `documentos`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do documento |
| `cliente_id` | INTEGER | FK → clientes | Cliente dono |
| `edificacao_id` | INTEGER | FK → edificacoes (CASCADE) | Edificação |
| `url` | TEXT | NOT NULL | URL externa (Google Drive, etc.) |
| `descricao` | VARCHAR(255) | | Descrição do documento |
| `usuario_id` | INTEGER | FK → usuarios | Quem adicionou |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |

### `planos_dados`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do plano |
| `edificacao_id` | INTEGER | FK → edificacoes (CASCADE) | Edificação |
| `operadora` | VARCHAR(100) | NOT NULL | Operadora (Vivo, Claro, etc.) |
| `descricao` | VARCHAR(255) | | Descrição do plano |
| `valor_mensal` | NUMERIC(10,2) | | Valor mensal |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |

### `equipamentos`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID do equipamento |
| `edificacao_id` | INTEGER | FK → edificacoes (CASCADE) | Edificação |
| `tipo` | VARCHAR(100) | NOT NULL | Tipo do equipamento |
| `descricao` | VARCHAR(255) | | Descrição |
| `quantidade` | INTEGER | DEFAULT 1 | Quantidade |
| `valor_unitario` | NUMERIC(10,2) | | Valor unitário |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |

### `notificacoes`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID da notificação |
| `cliente_id` | INTEGER | FK → clientes | Cliente |
| `regra_id` | INTEGER | FK → notificacoes_regras | Regra que gerou |
| `usuario_id` | INTEGER | FK → usuarios | Usuário destinatário |
| `titulo` | VARCHAR(255) | NOT NULL | Título |
| `mensagem` | TEXT | NOT NULL | Mensagem |
| `prioridade` | VARCHAR(20) | DEFAULT 'normal' | low/normal/high/critical |
| `lida` | VARCHAR(1) | DEFAULT 'N' | Lida (S/N) |
| `criado_em` | TIMESTAMP | DEFAULT NOW() | Data de criação |

### `notificacoes_config`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID |
| `cliente_id` | INTEGER | FK → clientes, UNIQUE | Cliente |
| `smtp_host` | VARCHAR(255) | | Host SMTP |
| `smtp_port` | INTEGER | | Porta SMTP |
| `smtp_user` | VARCHAR(255) | | Usuário SMTP |
| `smtp_pass` | VARCHAR(255) | | Senha SMTP |
| `smtp_from` | VARCHAR(255) | | Remetente |
| `push_ativo` | VARCHAR(1) | DEFAULT 'N' | Push ativo |
| `email_ativo` | VARCHAR(1) | DEFAULT 'N' | Email ativo |

### `notificacoes_regras`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID da regra |
| `cliente_id` | INTEGER | FK → clientes | Cliente |
| `sensor_tipo` | VARCHAR(50) | | Tipo de sensor alvo |
| `condicao` | VARCHAR(50) | | Condição (maior, menor, etc.) |
| `valor_min` | NUMERIC(12,4) | | Valor mínimo |
| `valor_max` | NUMERIC(12,4) | | Valor máximo |
| `prioridade` | VARCHAR(20) | DEFAULT 'normal' | Prioridade do alerta |
| `ativo` | VARCHAR(1) | DEFAULT 'S' | Status (S/N) |

### `notificacoes_regra_destinatarios`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID |
| `regra_id` | INTEGER | FK → notificacoes_regras (CASCADE) | Regra |
| `tipo` | VARCHAR(20) | | Tipo (usuario/email) |
| `usuario_id` | INTEGER | FK → usuarios | Usuário |
| `email` | VARCHAR(255) | | Email direto |
| `email_ativo` | VARCHAR(1) | DEFAULT 'S' | Notificação por email |
| `push_ativo` | VARCHAR(1) | DEFAULT 'S' | Notificação push |

### `tipos_sensor`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID |
| `nome` | VARCHAR(100) | UNIQUE, NOT NULL | Nome do tipo |
| `descricao` | TEXT | | Descrição |

### `tipos_equipamento`

| Coluna | Tipo | Constraints | Descrição |
|--------|------|------------|-----------|
| `id` | SERIAL | PK | ID |
| `nome` | VARCHAR(100) | UNIQUE, NOT NULL | Nome do tipo |
| `descricao` | TEXT | | Descrição |

---

## Migrations (12)

| # | Arquivo | Descrição |
|---|---------|-----------|
| 0001 | `estrutura_inicial.sql` | Tabelas base: clientes, usuarios, edificacoes, sensores, leituras + índices |
| 0002 | `rename_entidades_to_sensores.sql` | Renomeia `entidades` → `sensores` |
| 0003 | `create_documentos.sql` | Tabela de documentos |
| 0004 | `create_notificacoes.sql` | Sistema de notificações (4 tabelas) |
| 0005 | `rename_tenants_to_clientes.sql` | Renomeia `tenants` → `clientes` |
| 0006 | `create_precos_sensor.sql` | Tabela `precos_sensor` (depois removida) |
| 0007 | `create_planos_equipamentos.sql` | Planos de dados e equipamentos |
| 0008 | `sensor_fields.sql` | Adiciona `modelo`, `unidade`, `fabricante`, `valor_mensal` a sensores; remove `precos_sensor` |
| 0009 | `tipos_sensor.sql` | Tabela de lookup `tipos_sensor` |
| 0010 | `tipos_equipamento.sql` | Tabela de lookup `tipos_equipamento` |
| 0011 | `add_uuid_to_sensores.sql` | Adiciona coluna `uuid` a sensores |
| 0012 | `fix_uuid_type.sql` | Altera tipo de `uuid` de UUID para VARCHAR(50) |

### Executar migrations

```bash
node scripts/migrate.js
```

O script lê todos os `.sql` da pasta `migrations` em ordem numérica e executa contra o banco.

---

## Índices Importantes

- `sensores_uuid_idx` — UNIQUE em `sensores.uuid`
- `leituras_sensor_id_idx` — FK em `leituras.sensor_id`
- `leituras_cliente_id_idx` — FK em `leituras.cliente_id`
- `sensores_cliente_id_idx` — FK em `sensores.cliente_id`
- `edificacoes_cliente_id_idx` — FK em `edificacoes.cliente_id`

---

## Relacionamentos

```text
clientes (1) ──→ (N) usuarios
clientes (1) ──→ (N) edificacoes
clientes (1) ──→ (N) sensores
clientes (1) ──→ (N) notificacoes
clientes (1) ──→ (1) notificacoes_config
clientes (1) ──→ (N) notificacoes_regras

edificacoes (1) ──→ (N) sensores
edificacoes (1) ──→ (N) documentos
edificacoes (1) ──→ (N) planos_dados
edificacoes (1) ──→ (N) equipamentos

sensores (1) ──→ (N) leituras

notificacoes_regras (1) ──→ (N) notificacoes
notificacoes_regras (1) ──→ (N) notificacoes_regra_destinatarios

usuarios (1) ──→ (N) notificacoes
usuarios (1) ──→ (N) documentos (como autor)
```

---

## Padrões de Uso

### Soft Delete
```typescript
// Desativar
await db.update(sensores).set({ ativo: "N" }).where(eq(sensores.id, id));

// Reativar
await db.update(sensores).set({ ativo: "S" }).where(eq(sensores.id, id));
```

### Multi-Tenant Query
```typescript
// Usuário normal: filtra por clienteId
const data = await db.query.sensores.findMany({
  where: eq(sensores.clienteId, session.user.clienteId),
});

// SUPER: sem filtro
const data = await db.query.sensores.findMany();
```

### Cascade Delete (Soft)
```typescript
// Desativar edificação e todos os filhos
await db.update(edificacoes).set({ ativo: "N" }).where(eq(edificacoes.id, id));
await db.update(sensores).set({ ativo: "N" }).where(eq(sensores.edificacaoId, id));
await db.update(planosDados).set({ ativo: "N" }).where(eq(planosDados.edificacaoId, id));
await db.update(equipamentos).set({ ativo: "N" }).where(eq(equipamentos.edificacaoId, id));
```
