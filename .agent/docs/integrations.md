# GeoFissura — Integrações IoT

> Integrações com MQTT, gateway e dispositivos IoT.

---

## Arquitetura de Integração

```text
ESP32 (sensores) → MQTT → EMQX/Gateway → REST API → GeoFissura (Neon)
                                ↓
                         PostgreSQL local
                         (buffer offline)
```

---

## Protocolos

| Protocolo | Uso | Direção |
|-----------|-----|---------|
| MQTT | Transporte de dados dos ESP32 | ESP32 → Broker → Gateway |
| REST (HTTPS) | Sincronização com GeoFissura | Gateway → GeoFissura API |
| WebSocket | Notificações em tempo real (futuro) | GeoFissura → Browser |

---

## MQTT

### Broker

| Configuração | Valor |
|-------------|-------|
| Broker | EMQX (ou Mosquitto) |
| Porta | 1883 (MQTT), 8883 (MQTT over TLS) |
| Autenticação | Usuário/senha obrigatória |
| Tópicos | `geofissura/{UUID}` |

### Tópicos

| Tópico | Direção | Descrição |
|--------|---------|-----------|
| `geofissura/+` | Subscribe (gateway) | Wildcard para todos os sensores |
| `geofissura/{UUID}` | Publish (ESP32) | Payload de leitura de um sensor |

### Payload MQTT

```json
{
  "valor": 0.52,
  "unidade": "mm"
}
```

### EMQX Webhook

O EMQX está configurado para enviar mensagens MQTT para o endpoint webhook do GeoFissura:

```text
POST /api/mqtt/webhook
Content-Type: application/json

{
  "topic": "geofissura/GF-000001",
  "payload": "{\"valor\": 0.52, \"unidade\": \"mm\"}",
  "timestamp": 1686739200000,
  "qos": 1,
  "clientid": "ESP32-GF-000001"
}
```

O webhook parseia o tópico no formato:
```
/{clienteSlug}/{edificacaoId}/{sensorId}
```

E insere a leitura diretamente no banco Neon.

---

## Gateway MQTT

O gateway é o intermediário entre os ESP32 e o GeoFissura:

### Responsabilidades

1. Receber mensagens MQTT dos ESP32
2. Armazenar leituras localmente (buffer offline)
3. Sincronizar leituras com o GeoFissura em lotes
4. Detectar e enviar alertas críticos imediatamente
5. Manter cache de sensores sincronizados

### Banco Local

| Tabela | Descrição |
|--------|-----------|
| `sensores` | Cache de sensores ativos (sync via `/api/sensores/sincronizar`) |
| `leituras_local` | Leituras recebidas, ainda não sincronizadas |
| `sync_queue` | Fila de sincronização com retry |

### Fluxo de Operação

```text
1. ESP32 publica em geofissura/{UUID}
2. Gateway recebe via MQTT
3. Gateway resolve UUID → sensor.id (cache local)
4. Gateway insere em leituras_local
5. Gateway verifica regras de alerta
   └── Se crítico → POST /api/alertas (imediato)
6. Sync worker (loop):
   a. Seleciona leituras não sincronizadas
   b. Agrupa em batch (100-500 registros)
   c. Envia POST /api/sync
   d. Marca como sincronizadas
   e. Em erro: incrementa tentativas, retry
```

### Variáveis de Ambiente do Gateway

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | PostgreSQL local | `postgres://user:pass@localhost:5432/geofissura_local` |
| `NEON_API_URL` | URL base do GeoFissura | `https://geofissura.vercel.app` |
| `GATEWAY_API_KEY` | Chave compartilhada | `gf_gateway_prod_xxx` |
| `MQTT_BROKER` | Host do broker | `mqtt.geofissura.com.br` |
| `MQTT_PORT` | Porta MQTT | `1883` |
| `MQTT_USER` | Usuário MQTT | `gf_gateway` |
| `MQTT_PASS` | Senha MQTT | `***` |
| `SYNC_BATCH_SIZE` | Tamanho do lote | `100` |
| `SYNC_INTERVAL_MS` | Intervalo do worker | `30000` |

---

## ESP32

### Comportamento

1. Conecta ao WiFi
2. Conecta ao Mosquitto (autenticação)
3. Lê sensores físicos em intervalo configurado
4. Publica no tópico `geofissura/{UUID}`
5. Se perder conexão, armazena localmente e reenvia

### Interface Web de Configuração

| Campo | Exemplo |
|-------|---------|
| SSID WiFi | `Construtora-Alfa` |
| Senha WiFi | `********` |
| Broker MQTT | `mqtt.geofissura.com.br` |
| Porta MQTT | `1883` |
| Usuário MQTT | `gf_gateway` |
| Senha MQTT | `********` |
| UUID do Sensor | `GF-000001` |
| Intervalo de envio | `720` (minutos) |

### Formato do UUID

```
GF-XXXXXX
│  │
│  └── Sequência numérica
└── Prefixo GeoFissura
```

Exemplo: `GF-000001`, `GF-000123`

---

## Contratos de Integração

### Contrato 1: Gateway → GeoFissura (Sync Sensores)

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

### Contrato 3: Gateway → GeoFissura (Alertas)

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

### Contrato 4: ESP32 → MQTT

```
Topic: geofissura/GF-000001

Payload:
{
  "valor": 0.52,
  "unidade": "mm"
}
```

### Contrato 5: Gateway → GeoFissura (Resolver UUID)

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

---

## Segurança das Integrações

| Camada | Mecanismo |
|--------|----------|
| MQTT | Autenticação usuário/senha no broker |
| REST API | Header `x-api-key` |
| Transporte | HTTPS (TLS) |
| Identidade | `sensor_uuid` como chave compartilhada |
| Isolamento | IDs internos nunca expostos |

---

## Evolução com Vision Platform

A arquitetura atual (Gateway MQTT → GeoFissura) será evoluída para:

```text
Câmeras/ESP32 → Vision Platform Local → Vision Platform Central → GeoFissura
```

O gateway MQTT passará a fazer parte da Vision Platform Local, que também lidará com câmeras, RTSP, processamento leve e fila offline.

Ver [vision_platform_integrada.md](./vision_platform_integrada.md) para detalhes.
