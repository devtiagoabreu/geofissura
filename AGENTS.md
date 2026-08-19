# GeoFissura — Session State

> Última atualização: 2026-08-18

## Câmera de teste

| Campo | Valor |
|---|---|
| Modelo | Intelbras VIPC-1230-B-G2 |
| Serial | DYO0011617671 |
| MAC | 54-ba-d9-d3-ed-26 |
| Hostname DNS | geofissuracam01 |
| Nome no sistema | GeoFissura_CAM_000001 |
| Porta HTTP | 80 |
| Porta RTSP | 554 |
| Porta ONVIF | 8080 |
| Formato de vídeo | NTSC |
| Stream Principal | `subtype=0` (resolução máxima, ex: 1920×1080) |
| Stream Extra | `subtype=1` (resolução reduzida) |
| Usuário padrão | admin |
| Senha padrão | {Alohomor4} |
| RTSP URL | `rtsp://admin:{Alohomor4}@geofissuracam01:554/cam/realmonitor?channel=1&subtype=0` |

**Regra:** Sempre usar **Stream Principal (`subtype=0`)** para captura de imagens.

**Naming convention:** `GeoFissura_CAM_XXXXXX` — o número sequencial é o identificador da câmera no GeoFissura.

## Visão Geral do Ecossistema

Três repositórios de aplicação + documentação integrada:

| Repositório | Linguagem | Caminho | Status |
|---|---|---|---|
| `geofissura` | Next.js/TypeScript | `D:\Tiago\dev\geofissura` | ✅ Documentado |
| `vision-platform-local` | Python/FastAPI | `D:\Tiago\dev\vision-platform-local` | ✅ MVP funcional |
| `vision-platform-central` | Python/FastAPI | `D:\Tiago\dev\vision-platform-central` | ✅ MVP funcional |

## O que foi feito (sessões anteriores + esta)

### 1. Documentação completa do geofissura
- Criados 9 arquivos em `.agent/docs/`: overview, architecture, database, api, authentication, frontend, integrations, deployment, vision-platform-roadmap
- Documentação consolidada em `vision_platform_integrada.md` (seção 16 = MVP briefing)
- Commits: `f74a510`

### 2. OpenCode Engineering Kit
- Instalado globalmente e nos 3 repos
- 150 skills, 103 agents, 4 commands, 18 context

### 3. vision-platform-local — MVP funcional
- **ORM:** `Observation` + `DeliveryLog` com ForeignKey (`src/storage/models.py`)
- **Capture Worker:** captura frame → valida qualidade → salva imagem → salva no DB (`src/camera/capture_worker.py`)
- **Delivery Queue:** entrega via httpx com 5 retries, exponential backoff [5s, 15s, 60s, 300s, 900s] (`src/storage/delivery_queue.py`)
- **ONVIF Discovery:** WS-Discovery (UDP 239.255.255.250:3702) para encontrar câmera na rede, fallback DNS (`src/camera/discovery.py`)
- **Naming convention:** `GeoFissura_CAM_XXXXXX` — identificador único da câmera
- **Stream types:** Main (`subtype=0`) para captura, Sub (`subtype=1`) para preview
- **API completa:**
  - `GET /health` — status com queue_pending
  - `GET /api/v1/status` — uptime, CPU, memória
  - `GET /api/v1/cameras` — lista de câmeras
  - `GET /api/v1/observations` — cursor pagination, filtro por status
  - `POST /api/v1/observations/{id}/ack` — confirma entrega
  - `POST /api/v1/delivery/flush` — processa fila manualmente
- **Background task:** delivery loop no lifespan da FastAPI
- **Alembic:** migration `001_initial.py` com tabelas `observations` + `delivery_logs`
- **Config:** `.env.example` com todas as variáveis
- **Commits:** `fabbbe6`, `1a90fdf`, `55e5026`, `ba80a10`

### 4. vision-platform-central — MVP funcional
- **ORM:** `ObservationRecord` + `LocalRecord` (`src/storage/database.py`)
- **Collector:** `sync.py` coleta do local com dedup e ack
- **Local Client:** HTTP client para o local (`src/collector/local_client.py`)
- **API completa:**
  - `GET /health` — queue_pending, locals_count
  - `GET /api/v1/status` — central_id, versão
  - `GET /api/v1/locals` — lista de locais
  - `POST /api/v1/locals` — registra/atualiza local
  - `POST /api/v1/observations` — recebe observação do local
  - `GET /api/v1/observations` — filtro por status e local_id
  - `GET /api/v1/cameras` — lista de câmeras distintas com contagem
  - `POST /api/v1/collector/poll` — trigger manual de coleta
- **Background task:** polling loop no lifespan da FastAPI
- **Alembic:** migration `001_initial.py` com tabelas `image_observations` + `locals`
- **Commits:** `71c416e`, `e79ba09`, `df1f070`

### 5. Suite de testes completa (162 testes)

**vision-platform-local — 105 testes:**

| Arquivo | Testes | Módulo |
|---------|--------|--------|
| `test_frame_validator.py` | 10 | scoring, dimensões, brightness, frozen frame, boundary |
| `test_rtsp_client.py` | 8 | connect, capture, release, redact URL |
| `test_delivery_queue.py` | 10 | pending queries, deliver, retry, max-fail, logs |
| `test_capture_worker.py` | 8 | connect, capture, save to DB, status, ROI |
| `test_health.py` | 16 | health, status, cameras, pagination, ack, flush |
| `test_discovery.py` | 16 | WS-Discovery, hostname prefix, MAC, DNS fallback, stream URLs |
| `test_auth.py` | 3 | password hash/verify, wrong password, different hashes |
| `test_dashboard_auth.py` | 10 | login page, valid/wrong/nonexistent credentials, redirect, logout, auth-protected pages |
| `test_devices.py` | 12 | device CRUD, page render, upsert, task types, auth |
| `test_e2e.py` | 12 | full delivery flow, retry, failure, idempotent, batch, ack, health, flush |

**vision-platform-central — 57 testes:**

| Arquivo | Testes | Módulo |
|---------|--------|--------|
| `test_local_client.py` | 7 | health, list observations, ack (mocked) |
| `test_sync.py` | 7 | collect, duplicates, ack failure, missing IDs |
| `test_health.py` | 22 | health counts, locals CRUD, observations filters, receive, poll |
| `test_auth.py` | 3 | password hash/verify, wrong password, different hashes |
| `test_dashboard_auth.py` | 10 | login page, valid/wrong/nonexistent credentials, redirect, logout, auth-protected pages |
| `test_e2e.py` | 8 | receive + query, duplicate idempotent, poll, locals CRUD, filters |

### 6. Web Dashboards com login (commits `2ddd7a2` local, `141a178` central)
- **Auth module** (`src/auth/`): password.py (bcrypt), dependencies.py (JWT), router.py (login/logout)
- **User ORM model**: criado em ambos repos (admin/admin padrão)
- **Templates Jinja2 + HTMX + Tailwind CSS**: login, base, dashboard, cameras, observations, etc.
- **Dashboard routes** (`src/api/dashboard_routes.py`): todas rotas `/dashboard/*` protegidas por JWT
- **JWT via HTTP-only cookie**, httponly, samesite=lax, 24h expiry
- **Dependências**: jinja2, python-multipart, passlib[bcrypt], pyjwt

## Próximos passos (MVP Intelbras)

### Fase 1 — Deploy no hardware (próximo)
1. ~~Confirmar modelo exato da câmera Intelbras e topologia de rede~~
2. **Clonar repos no Orange Pi e configurar .env**
3. **Rodar Alembic migrations**
4. **Testar RTSP manualmente no Orange Pi**
5. **Criar serviço persistente** (systemd)
6. **Validar: captura → save → delivery → central receive**

### Fase 2 — Resiliência
7. Validar reboot automático
8. Validar perda de rede → reconexão
9. Validar perda da câmera → retry
10. Testar delivery_queue sob carga

### Fase 3 — Visão computacional (futuro)
11. Detecção dos 6 círculos na imagem
12. Medição da etiqueta (crop + OCR/processamento)

## Tarefas técnicas pendentes

### vision-platform-local
- ~~Conectar `capture_worker.py` ao banco de dados~~ ✅
- ~~Implementar fila `delivery_queue` com retry~~ ✅
- ~~Rodar migrations com Alembic~~ ✅
- **Configurar `.env` com credenciais reais da câmera** ← Orange Pi
- **Testar RTSP contra a câmera Intelbras física** ← Orange Pi
- **Configurar systemd service** ← Orange Pi

### vision-platform-central
- ~~Implementar polling periódico do local~~ ✅
- ~~Implementar endpoints de observações com query real~~ ✅
- ~~Rodar migrations com Alembic~~ ✅
- **Configurar `.env` com URL do local** ← servidor central
- **Configurar systemd service** ← servidor central

### geofissura
- **Reservar namespace `/api/v1/vision`** para eventos futuros
- **Não alterar fluxo principal** de sensores/alertas

## Checklist de deploy (Orange Pi)

### vision-platform-local
```bash
# 1. Clonar
cd /opt
git clone git@github.com:devtiagoabreu/vision-platform-local.git
cd vision-platform-local

# 2. Dependências
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# 3. Configurar
cp .env.example .env
# Editar .env com:
#   LOCAL_ID=LOCAL-001
#   CAMERA_RTSP_URL=rtsp://admin:senha@192.168.x.x:554/stream1
#   CENTRAL_API_BASE_URL=http://IP_CENTRAL:8081
#   CENTRAL_API_TOKEN=token-definido

# 4. Banco de dados
alembic upgrade head

# 5. Testar
pytest
uvicorn src.main:app --host 0.0.0.0 --port 8080

# 6. Serviço (production)
sudo cp deploy/vision-local.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vision-local
```

### vision-platform-central
```bash
# 1. Clonar
cd /opt
git clone git@github.com:devtiagoabreu/vision-platform-central.git
cd vision-platform-central

# 2. Dependências
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"

# 3. Configurar
cp .env.example .env
# Editar .env com:
#   CENTRAL_ID=CENTRAL-001
#   LOCAL_API_BASE_URL=http://IP_ORANGE_PI:8080
#   LOCAL_API_TOKEN=token-definido

# 4. Banco de dados
alembic upgrade head

# 5. Testar
pytest
uvicorn src.main:app --host 0.0.0.0 --port 8081

# 6. Serviço (production)
sudo cp deploy/central.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vision-central
```

## Arquitetura de referência

- Documento principal: `.agent/docs/vision_platform_integrada.md`
- Roadmap: `.agent/docs/vision-platform-roadmap.md`
- Seção 16 = MVP briefing detalhado com requisitos, API, validação, testes de aceite

## Comandos úteis

```bash
# geofissura
cd D:\Tiago\dev\geofissura
npm run dev

# vision-platform-local
cd D:\Tiago\dev\vision-platform-local
pip install -e ".[dev]"
ruff check src/ tests/
pytest
uvicorn src.main:app --reload --port 8080

# vision-platform-central
cd D:\Tiago\dev\vision-platform-central
pip install -e ".[dev]"
ruff check src/ tests/
pytest
uvicorn src.main:app --reload --port 8081
```
