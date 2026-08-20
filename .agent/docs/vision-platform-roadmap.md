# GeoFissura — Roadmap da Vision Platform Integrada

> Roadmap de implementação baseado na proposta arquitetural do `vision_platform_integrada.md`.

---

## Visão

Evoluir o ecossistema GeoFissura de um SaaS de sensores IoT para uma **plataforma distribuída de visão computacional** com processamento em camadas:

| Nível | Função | Localização |
|-------|--------|------------|
| **Vision Platform Local** | Captura de câmeras/sensores, buffer offline, processamento leve | Orange Pi 3 LTS |
| **Vision Platform Central** | Processamento pesado, correlação, modelos de IA | Servidor central |
| **GeoFissura** | SaaS: cadastro, multi-tenant, dashboards, alertas, relatórios | Vercel + Neon |

---

## Fluxo de Dados

```text
Câmeras/ESP32
    ↓
Vision Platform Local
    ↓ lote periódico
Vision Platform Central
    ↓ API
GeoFissura
    ↓
Dashboard, histórico e alertas
```

---

## Fases de Implementação

### Fase 1 — ✅ Consolidar a Base Atual

**Status:** Completa

- [x] GeoFissura com auth, multi-tenant, CRUD
- [x] Sensores com UUID
- [x] Endpoints gateway (`/api/sync`, `/api/alertas`, `/api/sensores/sincronizar`)
- [x] Dashboard, gráficos, leituras
- [x] Notificações (SMTP, bell polling)
- [x] Cobrança e relatórios
- [x] Arquitetura documentada

### Fase 2 — 🟡 Gateway → Vision Platform Local

**Status:** Estrutura scaffolding criada. MVP de captura RTSP em andamento.

**Objetivo:** Transformar o gateway MQTT na Vision Platform Local.

| Tarefa | Descrição |
|--------|-----------|
| `mqtt-ingest` | Assinatura `geofissura/+`, recepção de leituras ESP32 |
| `local-store` | PostgreSQL local para metadados, leituras, eventos e fila |
| `outbox` | API que entrega itens pendentes à Vision Platform Central |
| `health-api` | Health check, status de disco, câmera, MQTT, banco e fila |
| `camera-ingest` | Abertura de RTSP, captura de frames, reconexão |
| `edge-preprocessor` | Redimensionamento, amostragem, compressão, filtros |
| `local_uuid` | Identidade única da instalação |

**Banco Local (ampliação):**

| Tabela | Conteúdo |
|--------|---------|
| `local_devices` | Câmeras, ESP32, fontes RTSP, status |
| `local_sensors` | Cache dos sensores do GeoFissura |
| `camera_streams` | URL, perfil, resolução, FPS, estado |
| `observations` | Observações brutas ou pré-processadas |
| `vision_events` | Eventos detectados, severidade, modelo |
| `evidence_objects` | Caminho, hash, tamanho, MIME type |
| `outbox` | Itens aguardando entrega à central |
| `delivery_attempts` | Tentativas, status, erro, próximo retry |
| `config_snapshots` | Versão da configuração local |
| `health_samples` | CPU, RAM, disco, temperatura, câmera |

### Fase 3 — 🟡 Criar a Vision Platform Central

**Status:** Estrutura scaffolding criada. Collector básico implementado.

**Objetivo:** Núcleo técnico de processamento e orquestração.

| Componente | Responsabilidade |
|-----------|-----------------|
| `central-api` | API para locais, administração técnica e GeoFissura |
| `poller` | Consulta periódica dos locais, limites por unidade |
| `scheduler` | Agenda coletas, reprocessamentos, manutenção |
| `ingest-worker` | Valida, deduplica e persiste lotes recebidos |
| `evidence-store` | Armazena evidências e produz links controlados |
| `central-db` | Catálogo, eventos, jobs, estado e auditoria |
| `observability` | Logs, métricas, filas, latência e falhas |

**Fluxo de Polling:**

```text
Para cada local ativo:
    verificar coleta em andamento
    consultar /health ou /api/v1/status
    obter lote por cursor
    validar assinatura e schema
    registrar itens com idempotência
    confirmar após persistência central
    enfileirar para processamento
    avançar cursor somente após confirmação
```

### Fase 4 — ⬜ Adicionar Processamento Central de Visão

**Objetivo:** Executar modelos de IA e gerar eventos de visão.

| Componente | Responsabilidade |
|-----------|-----------------|
| `vision-worker` | Executa modelos de visão computacional |
| `correlation-worker` | Agrupa eventos, rastreia entidades, elimina duplicidades |
| `model-registry` | Versiona modelos, pesos, parâmetros |
| `geo-sync-worker` | Converte eventos em contratos do GeoFissura |

**Primeiro módulo sugerido:** Detecção de presença, contagem ou validação de EPI.

**Categorias de Dados:**

| Categoria | Tratamento |
|-----------|-----------|
| Telemetria | Persistida e agregada → enviada ao GeoFissura como leitura |
| Evento | Processado por regras e modelos → pode gerar alerta |
| Evidência | Armazenada com hash e política de retenção → vinculada ao evento |

### Fase 5 — ⬜ Evoluir os Contratos do GeoFissura

**Objetivo:** Endpoints próprios para eventos de visão e evidências.

**Novo endpoint proposto:**

```
POST /api/vision/events
x-api-key: <credencial-do-servico>

{
  "event_id": "central-01-local-03-000000812",
  "source_uuid": "CAM-LOCAL-03-001",
  "cliente_id": 12,
  "edificacao_id": 3,
  "module": "epi",
  "event_type": "ppe_missing",
  "severity": "high",
  "observed_at": "2026-08-17T20:00:00Z",
  "model": "ppe-yolo",
  "model_version": "2026.08.1",
  "confidence": 0.94,
  "metadata": {
    "person_count": 1,
    "missing_items": ["oculos"]
  },
  "evidence_url": "https://..."
}
```

**Manter:** `/api/sync` para leituras IoT.

### Fase 6 — ⬜ Operação Multi-Local

**Objetivo:** Provisionar e gerenciar múltiplas unidades.

| Tarefa | Descrição |
|--------|-----------|
| Provisionamento | Instalar Vision Platform Local em nova Orange Pi |
| Identidade | Gerar `local_uuid` único |
| Conectividade | Testar conexão com a central |
| Backup | Validar política de backup local |
| Registro | Registrar local na Vision Platform Central |
| Teste | Executar teste ponta a ponta |

---

## Estrutura de Repositórios

| Repositório | Responsabilidade | Tech |
|-------------|-----------------|------|
| `geofissura` | SaaS, usuários, clientes, dashboards, alertas | Next.js, TypeScript, Drizzle |
| `vision-platform-local` | Captura câmeras, MQTT, buffer offline, fila | **Python**, PostgreSQL local |
| `vision-platform-central` | Coleta, processamento, correlação, modelos IA | **Python**, workers, PostgreSQL |
| `vision-platform-contracts` | Contratos entre Local, Central e GeoFissura | OpenAPI, JSON Schema |
| `vision-platform-infra` | Docker Compose, deploy, observabilidade | Docker, Ansible |
| `vision-platform-docs` | Documentação geral e diagramas | Markdown |
| `config-server-geofissura-orange-pi-3-lts` | SO, provisionamento, firewall, backup | Shell, Armbian/Debian |

### Direção da Dependência

```text
Vision Platform Local → Vision Platform Central → GeoFissura
```

O GeoFissura **nunca** importa código da Central ou Local. Comunicação por API autenticada.

---

## Identidades

| Identidade | Dono | Exemplo |
|-----------|------|---------|
| `clienteId` | GeoFissura | `12` |
| `edificacaoId` | GeoFissura | `3` |
| `sensor_uuid` | Dispositivo/GeoFissura | `GF-000001` |
| `local_uuid` | Vision Platform Local | `LOCAL-001` |
| `camera_uuid` | Vision Platform Local | `CAM-LOCAL-001-01` |
| `event_id` | Vision Platform Central | UUID ou sequência |
| `evidence_id` | Vision Platform Central | ID do objeto |

**Regra:** Nunca usar ID autoincremental do banco local como chave de integração.

---

## Segurança

| Controle | Recomendação |
|----------|-------------|
| Identidade | `local_uuid` único por instalação |
| Autenticação | API key por local (MVP); mTLS ou tokens rotativos (evolução) |
| Integridade | Assinatura ou HMAC por lote |
| Replay | `batch_id`, nonce ou timestamp com janela |
| Rede | VPN ou conexão de saída; evitar exposição direta |
| Segredos | `.env` fora do Git; nunca em logs |
| Auditoria | Registrar alterações de config, modelo e regra |
| Evidências | URLs temporárias, controle de acesso e hash |

---

## Critérios de Aceite do MVP

| Critério | Resultado esperado |
|----------|-------------------|
| Perda de internet no local | Captura e armazenamento local continuam |
| Perda da central | Local acumula itens pendentes sem descartar |
| Reprocessamento | Não duplica leituras ou eventos |
| Câmera indisponível | Estado e erro aparecem no diagnóstico |
| Central atrasada | Filas mostram idade e quantidade pendente |
| GeoFissura indisponível | Central mantém fila e tenta novamente |
| Alerta crítico | Rota imediata ou SLA definido |
| Restauração | Backup permite recuperar banco e configuração |
| Segurança | Credenciais não ficam em repositório nem em logs |

---

## Decisão Recomendada

Adotar arquitetura **Local → Central → GeoFissura**, mantendo o GeoFissura como produto SaaS e sistema de negócio. O primeiro desenvolvimento deve validar a cadeia completa com **um sensor e uma câmera**: capturar localmente, armazenar, coletar periodicamente, processar centralmente, enviar ao GeoFissura e exibir no dashboard.

> **Resumo:** o Orange Pi é o agente local; a Vision Platform Central é o cérebro computacional; o GeoFissura é o sistema de gestão, relacionamento, alertas e histórico do produto.

---

## Referências

- [vision_platform_integrada.md](./vision_platform_integrada.md) — Proposta arquitetural completa
- [vision-platform-processing-architecture.md](./vision-platform-processing-architecture.md) — Arquitetura de processamento de visão computacional (fissuras, EPI, placas, tecidos, contagem, rastreamento)
- [architecture.md](./architecture.md) — Arquitetura técnica do GeoFissura
- [integrations.md](./integrations.md) — Integrações IoT atuais
