# GeoFissura — Arquitetura do Sistema

> Documento de referência para o ecossistema GeoFissura.
> Contém arquitetura, contratos, variáveis de ambiente e roadmap de implementação.
> Abrange 4 módulos independentes em 3 repositórios distintos.

## Repositórios

| # | Repositório | Caminho Local | Tecnologia |
|---|---|---|---|
| 1 | `geofissura` (web) | `D:\Tiago\dev\geofissura` | Next.js 14, Vercel, Neon |
| 2 | `geofissura-gateway` (pendente) | `D:\Tiago\dev\geofissura-gateway` | Node.js, Mosquitto, PostgreSQL local |
| 3 | `geofissura-esp32` (pendente) | — | Arduino framework / ESP-IDF |

---

## Visão Geral

Plataforma SaaS multi-tenant para monitoramento de edificações utilizando sensores IoT baseados em ESP32. Comunicação entre módulos via contratos REST (HTTPS) e MQTT.

```
                    +---------------------------+
                    |   geofissura (Next.js)    |
                    |       Vercel              |
                    +-----------+---------------+
                                |
                       REST API (HTTPS)
                                |
                    +-----------+---------------+
                    |    Neon PostgreSQL        |
                    |   (Banco Central Cloud)   |
                    +-----------+---------------+
                                ^
                                |
                    +-----------+---------------+
                    |  geofissura-gateway (Node)|
                    |  Docker Compose           |
                    +-----------+---------------+
                                ^
                                |
                         MQTT (Internet)
                                |
         +----------+----------+----------+-----+
         |          |          |          |      |
       ESP32      ESP32      ESP32     ESP32   ESP32
```

---

## Módulo 1 — `geofissura` (Web)

| Atributo | Detalhe |
|---|---|
| **Nome** | `geofissura` |
| **Função** | Frontend + API para gestão do sistema |
| **Stack** | Next.js 14, TypeScript, Tailwind, Drizzle ORM, NextAuth v4, shadcn/ui |
| **Hospedagem** | Vercel |
| **Banco** | Neon PostgreSQL (sa-east-1) |

### Responsabilidades

- Autenticação e autorização (NextAuth, roles SUPER/ADMIN/USER/VIEWER)
- Cadastro de construtoras, edificações, sensores, usuários
- Dashboards, gráficos, relatórios
- Notificações e alarmes (dashboard, email, WhatsApp, push)
- Gerenciamento de planos de dados e equipamentos
- Cobrança e relatórios financeiros
- **Nunca** se conecta ao MQTT ou ao Gateway

### Endpoints da API — Públicos (Gateway)

Consumidos pelo Gateway MQTT. Exigem **API Key** via header `x-api-key`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sensores/resolver?uuid={uuid}` | Retorna `{id, uuid, nome, tipoSensor}` |
| `GET` | `/api/sensores/sincronizar` | Retorna `[{id, uuid, tipoSensor, edificacaoId}]` sensores ativos |
| `POST` | `/api/sync` | Batch de leituras `{leituras: [{sensor_uuid, valor, unidade, datahora}]}` |
| `POST` | `/api/alertas` | Eventos críticos `{sensor_uuid, tipo, mensagem, valor, limite}` |

### Endpoints da API — Autenticados (Web)

Exigem sessão NextAuth.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sensores` | Lista sensores do cliente |
| `POST` | `/api/sensores` | Cria novo sensor (aceita `uuid` no body) |
| `GET` | `/api/sensores/[id]` | Detalhe do sensor (inclui uuid no card grid) |
| `PUT` | `/api/sensores/[id]` | Atualiza sensor (inclui uuid) |
| `DELETE` | `/api/sensores/[id]` | Soft delete (`ativo=N`) ou hard (`?force=true`, SUPER) |
| `POST` | `/api/sensores/[id]/reativar` | Reativa sensor (ativo=S) |
| `GET` | `/api/sensores/[id]/leituras` | Últimas 50 leituras |
| ... | CRUDs | edificacoes, clientes, usuarios, tipos-sensor, tipos-equipamento |

---

## Módulo 2 — `geofissura-gateway` (Gateway MQTT Centralizado)

| Atributo | Detalhe |
|---|---|
| **Nome** | `geofissura-gateway` |
| **Função** | Ponte entre ESP32 e GeoFissura — recebe MQTT, armazena local, sincroniza com Neon |
| **Stack** | Node.js, Mosquitto, PostgreSQL local |
| **Infra** | Docker Compose (Mosquitto + Gateway + PostgreSQL) |
| **Caminho local** | `D:\Tiago\dev\geofissura-gateway` |
| **Status** | ⬜ Pendente |

### Arquitetura Interna (proposta)

```
gateway/
├── docker-compose.yml      # Mosquitto + Gateway + PostgreSQL
├── mosquitto/
│   └── mosquitto.conf      # Config do broker
├── postgres/
│   └── init.sql            # Schema do banco local
└── app/
    ├── package.json
    ├── .env.example
    ├── src/
    │   ├── index.js         # Entry point (orquestrador)
    │   ├── config.js        # Config centralizada (env vars)
    │   ├── mqtt.js          # Conexão Mosquitto, subscribe geofissura/+
    │   ├── postgres.js      # Pool de conexão PostgreSQL local
    │   ├── sync.js          # Worker de sincronização com Neon
    │   ├── alerts.js        # Detecção de eventos críticos
    │   └── api.js           # Endpoints locais (diagnóstico, health)
    └── tests/
```

### Fluxo de Operação

```
ESP32 → MQTT → Mosquitto → Gateway (mqtt.js)
                                │
                                ▼
                          postgres.js
                     INSERT leituras_local
                     INSERT sync_queue (PENDENTE)
                                │
                                ▼
                          sync.js (Worker)
                     SELECT sync_queue WHERE PENDENTE
                     Agrupa em batch (100-500 registros)
                     POST /api/sync → Neon
                     OK → UPDATE sync_queue (SINCRONIZADO)
                     ERRO → incrementa tentativas
                                │
                          alerts.js
                     Se leitura crítica:
                     POST /api/alertas → Neon (imediato)
```

### Banco de Dados Local

#### `sensores`
Cache sincronizado do Neon via `GET /api/sensores/sincronizar` (UPSERT).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER | PK, igual ao Neon |
| `uuid` | VARCHAR(50) | UNIQUE, identificador do ESP32 (ex: GF-000001) |
| `tipo` | VARCHAR(50) | Tipo do sensor |
| `construtora_id` | INTEGER | FK |
| `edificacao_id` | INTEGER | FK |
| `ativo` | BOOLEAN | Se o sensor está ativo |

#### `leituras_local`
Leituras recebidas via MQTT, ainda não sincronizadas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL | PK local |
| `sensor_uuid` | VARCHAR(50) | UUID do sensor (não o ID interno) |
| `valor` | NUMERIC | Valor da leitura |
| `unidade` | VARCHAR(20) | Unidade de medida |
| `datahora` | TIMESTAMP | Momento da leitura |
| `sincronizado` | BOOLEAN | `false` até confirmação do Neon |

#### `sync_queue`
Fila de sincronização com retry.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | SERIAL | PK |
| `leitura_id` | INTEGER | FK → leituras_local.id |
| `status` | VARCHAR(20) | `PENDENTE`, `ENVIANDO`, `ERRO`, `SINCRONIZADO` |
| `tentativas` | INTEGER | Número de tentativas |
| `ultima_tentativa` | TIMESTAMP | Última tentativa |

### Worker de Sincronização

- Loop contínuo (configurável via `SYNC_INTERVAL_MS`)
- Seleciona lotes de `leituras_local` com `sincronizado=false`
- Agrupa em batches (configurável via `SYNC_BATCH_SIZE`: 100, 200, 500)
- Envia `POST /api/sync` para o GeoFissura
- Marca `sincronizado=true` após confirmação
- Erro: incrementa `tentativas`, reenvia depois

### Eventos Críticos

- Durante a recepção MQTT, `alerts.js` verifica regras (ex: fissura > 1.5mm)
- Se crítica → `POST /api/alertas` imediatamente (não espera sync)
- Regras configuráveis via arquivo ou env vars

---

## Módulo 3 — `geofissura-esp32` (Firmware)

| Atributo | Detalhe |
|---|---|
| **Nome** | `geofissura-esp32` |
| **Função** | Leitura de sensores físicos e publicação MQTT |
| **Stack** | Arduino framework / ESP-IDF |
| **Status** | ⬜ Pendente |

### Interface Web de Configuração

Campos acessíveis via browser no ESP32:

| Campo | Exemplo |
|---|---|
| SSID WiFi | `Construtora-Alfa` |
| Senha WiFi | `********` |
| Broker MQTT | `mqtt.geofissura.com.br` |
| Porta MQTT | `1883` |
| Usuário MQTT | `gf_gateway` |
| Senha MQTT | `********` |
| UUID do Sensor | `GF-000001` |
| Intervalo de envio | `720` (minutos) |

### Comportamento

- Conecta ao WiFi
- Conecta ao Mosquitto
- Publica no tópico `geofissura/{UUID}` no intervalo configurado
- Payload: `{"valor": 0.52, "unidade": "mm"}`
- Opera independentemente: se perder conexão, armazena localmente e reenvia quando reconectar
- Cada tipo de sensor tem frequência própria (fissurômetro: 12h, barômetro: 30min, etc.)

---

## Módulo 4 — Mosquitto Broker

| Atributo | Detalhe |
|---|---|
| **Função** | Transporte MQTT (sem regras, sem histórico) |
| **Stack** | Eclipse Mosquitto |
| **Infra** | Container Docker no mesmo host do Gateway |

### Tópicos

| Tópico | Direção | Descrição |
|---|---|---|
| `geofissura/+` | ESP32 → Gateway | Wildcard de subscribe |
| `geofissura/{UUID}` | ESP32 → Broker | Payload de leitura |

### Configuração

Autenticação obrigatória (usuário/senha) para publish e subscribe.

---

## Contratos entre os Módulos

### Contrato 1: Gateway → GeoFissura (Sincronizar Sensores)

```
GET /api/sensores/sincronizar
Headers: x-api-key: {GATEWAY_API_KEY}

Response 200:
[
  {
    "id": 15,
    "uuid": "GF-000001",
    "tipoSensor": "fissurometro",
    "edificacaoId": 3
  }
]
```

Gateway chama periodicamente, faz UPSERT no banco local.

---

### Contrato 2: Gateway → GeoFissura (Sync Leituras)

```
POST /api/sync
Headers:
  x-api-key: {GATEWAY_API_KEY}
  Content-Type: application/json

Body:
{
  "leituras": [
    {
      "sensor_uuid": "GF-000001",
      "valor": 0.52,
      "unidade": "mm",
      "datahora": "2026-06-14T08:00:00"
    }
  ]
}

Response 200:
{
  "resultados": [
    { "sensor_uuid": "GF-000001", "status": "ok" }
  ],
  "inseridas": 1
}
```

- `sensor_uuid` é a única chave compartilhada entre sistemas
- IDs locais do Gateway nunca vazam
- Campos opcionais: `topico_mqtt`, `metadata`

---

### Contrato 3: Gateway → GeoFissura (Alertas Críticos)

```
POST /api/alertas
Headers:
  x-api-key: {GATEWAY_API_KEY}
  Content-Type: application/json

Body:
{
  "sensor_uuid": "GF-000001",
  "tipo": "fissura_critica",
  "mensagem": "Fissura ultrapassou limite de 1.5mm",
  "valor": 2.34,
  "unidade": "mm",
  "limite": 1.5,
  "datahora": "2026-06-14T08:00:00"
}

Response 200:
{
  "alerta_id": 42,
  "status": "registrado",
  "notificacoes_criadas": 3
}
```

Gateway envia **imediatamente** ao detectar evento crítico, sem esperar sync periódico. O GeoFissura resolve `sensor_uuid` → `clienteId` → cria notificações para admins do cliente.

---

### Contrato 4: ESP32 → Mosquitto (MQTT)

```
Topic: geofissura/GF-000001

Payload:
{
  "valor": 0.52,
  "unidade": "mm"
}
```

---

### Contrato 5: GeoFissura → Gateway (Resolver UUID)

```
GET /api/sensores/resolver?uuid=GF-000001
Headers: x-api-key: {GATEWAY_API_KEY}

Response 200:
{
  "id": 15,
  "uuid": "GF-000001",
  "nome": "Fissurômetro Torre A",
  "tipoSensor": "fissurometro"
}
```

Endpoint auxiliar para consultar sensor específico.

---

## Segurança

### API Key (Gateway ↔ GeoFissura)

Header `x-api-key` exigido em todos os endpoints públicos. Configurado via `GATEWAY_API_KEY`.

Sem chave válida: `401 Unauthorized`.

### Autenticação MQTT

Mosquitto exige usuário/senha para publish/subscribe.

### Sessões Web

NextAuth com credenciais (bcrypt), JWT, roles SUPER/ADMIN/USER/VIEWER.

---

## Variáveis de Ambiente

### GeoFissura (Vercel)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Chave JWT |
| `NEXTAUTH_URL` | URL da aplicação |
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Porta SMTP |
| `SMTP_USER` | Usuário SMTP |
| `SMTP_PASS` | Senha SMTP |
| `SMTP_FROM` | Remetente de email |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob |
| `MQTT_WEBHOOK_SECRET` | Segredo para webhook MQTT |
| `GATEWAY_API_KEY` | Chave compartilhada com o Gateway |

### Gateway (Docker)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL local |
| `NEON_API_URL` | URL base do GeoFissura |
| `GATEWAY_API_KEY` | Chave compartilhada |
| `MQTT_BROKER` | Host do Mosquitto |
| `MQTT_PORT` | Porta do Mosquitto (1883) |
| `MQTT_USER` | Usuário MQTT |
| `MQTT_PASS` | Senha MQTT |
| `SYNC_BATCH_SIZE` | Tamanho do lote (100-500) |
| `SYNC_INTERVAL_MS` | Intervalo do worker (ms) |

---

## Roadmap de Implementação

### Fase 1 — ✅ `geofissura` (completa)

- [x] Scaffold + auth + multi-tenant CRUD
- [x] UUID field em sensores (`varchar(50).unique()`)
- [x] `GET /api/sensores/resolver?uuid=`
- [x] `GET /api/sensores/sincronizar`
- [x] `POST /api/sync` (batch leituras)
- [x] `POST /api/alertas` (eventos críticos)
- [x] API Key validation (`x-api-key` em resolver, sincronizar, sync, alertas)
- [x] Soft delete + reativar sensores
- [x] Dashboard (leituras, filtro por edificação, gráficos)
- [x] Notificações (SMTP, bell 30s polling)
- [x] Tipos de Sensor e Equipamento (CRUD, admin tab)
- [x] Cobrança (planos de dados, equipamentos, relatório)
- [x] Migration 0001-0012 executadas no Neon
- [x] Arquitetura documentada (este arquivo)

### Fase 2 — ⬜ `geofissura-gateway`

- [ ] Docker Compose (Mosquitto + Gateway + PostgreSQL)
- [ ] `mqtt.js` — subscribe `geofissura/+`, parse payload
- [ ] `postgres.js` — pool, schema local, UPSERT, INSERT
- [ ] `sync.js` — worker loop, batch, POST /api/sync, retry
- [ ] `alerts.js` — detecção de eventos críticos, POST /api/alertas
- [ ] `api.js` — endpoints locais (health check, logs, status)
- [ ] `config.js` — env vars centralizado
- [ ] Testes

### Fase 3 — ⬜ `geofissura-esp32`

- [ ] Projeto base (WiFi + MQTT)
- [ ] Interface Web de configuração
- [ ] Leitura de sensores
- [ ] Publicação periódica `geofissura/{UUID}`
- [ ] Armazenamento local em caso de falha de rede
