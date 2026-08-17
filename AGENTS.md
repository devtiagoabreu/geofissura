# GeoFissura — Session State

> Última atualização: 2026-08-17

## Visão Geral do Ecossistema

Três repositórios de aplicação + documentação integrada:

| Repositório | Linguagem | Caminho | Status |
|---|---|---|---|
| `geofissura` | Next.js/TypeScript | `D:\Tiago\dev\geofissura` | ✅ Documentado |
| `vision-platform-local` | Python/FastAPI | `D:\Tiago\dev\vision-platform-local` | ✅ Scaffold MVP |
| `vision-platform-central` | Python/FastAPI | `D:\Tiago\dev\vision-platform-central` | ✅ Scaffold MVP |

## O que foi feito nesta sessão

### 1. Documentação completa do geofissura
- Criados 9 arquivos em `.agent/docs/`: overview, architecture, database, api, authentication, frontend, integrations, deployment, vision-platform-roadmap
- Documentação consolidada em `vision_platform_integrada.md` (seção 16 = MVP briefing)
- Arquivos duplicados removidos

### 2. Scaffold vision-platform-local
- **Estrutura:** `src/camera/` (rtsp_client, frame_validator, capture_worker), `src/api/` (routes), `src/config/` (settings), `src/storage/` (database)
- **API:** `/health`, `/api/v1/status`, `/api/v1/cameras`, `/api/v1/observations`, `/api/v1/observations/{id}/ack`
- **Deploy:** systemd service, docker-compose.yml, Dockerfile
- **Testes:** 3/3 passando, lint limpo
- **Commits:** `fabbbe6` no main

### 3. Scaffold vision-platform-central
- **Estrutura:** `src/collector/` (local_client, sync), `src/api/` (routes), `src/config/` (settings), `src/storage/` (database com ObservationRecord)
- **API:** `/health`, `/api/v1/status`, `/api/v1/locals`, `/api/v1/observations`
- **Deploy:** systemd service, docker-compose.yml, Dockerfile
- **Testes:** 2/2 passando, lint limpo
- **Commits:** `71c416e` no main

### 4. Documentação geofissura commitada
- **Commits:** `f74a510` no main

### 5. OpenCode Engineering Kit
- Instalado globalmente (`opencode-engineering-kit` v0.1.0)
- Executado nos 3 repos (982 arquivos cada: 300 skills, 103 agents, 4 commands, 18 context)

## Próximos passos (MVP Intelbras)

Conforme `vision_platform_integrada.md` seção 16.10:

1. ~~Confirmar modelo exato da câmera Intelbras e topologia de rede~~
2. **Testar RTSP manualmente no Orange Pi**
3. **Criar captura simples de um frame**
4. **Criar serviço persistente da Vision Platform Local** (systemd)
5. Adicionar armazenamento, hash e health check
6. Adicionar API local e cursor de observações
7. Fazer a Vision Platform Central coletar e confirmar
8. Validar reboot, perda de rede, perda da câmera e retry
9. Só então iniciar a detecção dos seis círculos e a medição da etiqueta

### Tarefas técnicas pendentes

**vision-platform-local:**
- Conectar `capture_worker.py` ao banco de dados (usar SQLAlchemy real)
- Implementar fila `delivery_queue` com retry
- Rodar migrations com Alembic
- Configurar `.env` com credenciais reais da câmera
- Testar RTSP contra a câmera Intelbras física

**vision-platform-central:**
- Implementar polling periódico do local (background task)
- Implementar endpoints de observações com query real
- Rodar migrations com Alembic
- Configurar `.env` com URL do local

**geofissura:**
- Reservar namespace `/api/v1/vision` para eventos futuros
- Não alterar fluxo principal de sensores/alertas

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

# ocekit
opencode-engineering-kit status
opencode-engineering-kit install --force  #重新 instalar em algum repo
```

## Arquitetura de referência

- Documento principal: `.agent/docs/vision_platform_integrada.md`
- Roadmap: `.agent/docs/vision-platform-roadmap.md`
- Seção 16 = MVP briefing detalhado com requisitos, API, validação, testes de aceite
