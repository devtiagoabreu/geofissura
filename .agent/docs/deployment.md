# GeoFissura — Deploy e Operação

> Variáveis de ambiente, scripts, deploy e operação do GeoFissura.

---

## Deploy

| Ambiente | Plataforma | URL |
|----------|-----------|-----|
| Produção | Vercel | geofissura.vercel.app |
| Banco | Neon PostgreSQL | sa-east-1 (serverless) |

### Pré-requisitos

- Node.js 18+
- pnpm
- Conta Vercel
- Conta Neon (PostgreSQL serverless)
- Conta Vercel Blob (upload de imagens)

### Deploy

```bash
# Instalar dependências
pnpm install

# Executar migrations
node scripts/migrate.js

# Build
pnpm build

# Deploy automático via Git push na branch main
```

---

## Variáveis de Ambiente

### GeoFissura (Vercel)

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | Conexão Neon PostgreSQL | ✅ |
| `NEXTAUTH_SECRET` | Chave para assinatura JWT | ✅ |
| `NEXTAUTH_URL` | URL base da aplicação | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob | ✅ |
| `SMTP_HOST` | Servidor SMTP (ex: smtp.sendgrid.net) | Opcional |
| `SMTP_PORT` | Porta SMTP (ex: 587) | Opcional |
| `SMTP_USER` | Usuário SMTP (ex: apikey) | Opcional |
| `SMTP_PASS` | Senha SMTP | Opcional |
| `SMTP_FROM` | Remetente de email | Opcional |
| `MQTT_WEBHOOK_SECRET` | Segredo para webhook MQTT | Opcional |
| `GATEWAY_API_KEY` | Chave compartilhada com o Gateway | ✅ (para IoT) |

### Exemplo de `.env.example`

```env
DATABASE_URL=postgres://user:password@ep-xxxx.neon.tech/neondb?sslmode=require
NEXTAUTH_SECRET=sua_chave_secreta_aqui
NEXTAUTH_URL=http://localhost:3000
BLOB_READ_WRITE_TOKEN=xxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=sua_senha_smtp
SMTP_FROM=noreply@geofissuras.com
MQTT_WEBHOOK_SECRET=seu_segredo_webhook
GATEWAY_API_KEY=gf_gateway_prod_xxxxxxxxxxxxxx
```

---

## Scripts

### Scripts Principais (`scripts/`)

| Script | Comando | Descrição |
|--------|---------|-----------|
| `migrate.js` | `node scripts/migrate.js` | Executa todas as migrations SQL em ordem |
| `seed.js` | `node scripts/seed.js` | Cria dados iniciais (1 cliente, 1 admin, 1 edificação) |
| `add-test-user.js` | `node scripts/add-test-user.js` | Adiciona usuário de teste (user@geofissura.com.br / 123456) |
| `add-user.js` | `node scripts/add-user.js` | Script genérico de criação de usuário |
| `seed-clientes.js` | `node scripts/seed-clientes.js` | Cria clientes adicionais |
| `seed-leituras.js` | `node scripts/seed-leituras.js` | Cria leituras de exemplo |
| `seed-planos-equipamentos.js` | `node scripts/seed-planos-equipamentos.js` | Cria planos e equipamentos de exemplo |
| `seed-sample-data.js` | `node scripts/seed-sample-data.js` | Cria dados de exemplo |
| `test-db.js` | `node scripts/test-db.js` | Testa conexão com o banco |
| `test-login.js` | `node scripts/test-login.js` | Testa fluxo de login |
| `check-user.js` | `node scripts/check-user.js` | Verifica registros de usuários |
| `check-estado.js` | `node scripts/check-estado.js` | Verifica estado da aplicação |
| `screenshot.js` | `node scripts/screenshot.js` | Captura screenshots (Playwright) |

### Scripts Temporários (`scripts/tmp/`)

Scripts de debug e one-off:

| Script | Descrição |
|--------|-----------|
| `add-leituras.js` | Adiciona leituras manualmente |
| `check-clientes-edificacoes.js` | Verifica relação clientes-edificações |
| `check-dados-sensor.js` | Verifica dados de um sensor |
| `check-planos-equipamentos.js` | Verifica planos e equipamentos |
| `check-sensores.js` | Verifica sensores |
| `debug-top50.js` | Debug das 50 leituras mais recentes |
| `query-edificios.js` | Query de edifícios |
| `reseed-leituras.js` | Reseed de leituras |
| `run-migration-0008.js` | Executa migration específica |

---

## Comandos npm

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento (localhost:3000) |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia servidor de produção |
| `pnpm lint` | ESLint (next/core-web-vitals) |

---

## Estrutura de Produção

```text
Vercel (Edge/Serverless)
├── Next.js App Router
│   ├── Server Components (DB queries)
│   ├── Client Components (React)
│   └── API Routes (REST)
├── Vercel Blob (uploads)
└── Neon PostgreSQL (serverless)
```

### Considerações Vercel

- Serverless functions com timeout padrão de 10s
- Edge functions para middleware
- Build output em `.next/`
- Imagens remotas: permitido `*.blob.vercel-storage.com`

---

## Monitoramento

### Logs

- Erros logados via `console.error` nas API routes
- Sem sistema de logging estruturado (futuro: Sentry, Datadog)

### Métricas

- Dashboard com KPIs em tempo real
- Polling de notificações a cada 30 segundos
- Não há métricas de performance ou APM (futuro)

### Health Checks

| Endpoint | Uso |
|----------|-----|
| `/api/auth/session` | Verifica se auth está funcionando |
| `/api/sensores` | Verifica conectividade com DB |

---

## Backup

| Tipo | Mecanismo | Frequência |
|------|----------|-----------|
| Banco Neon | Backup automático Neon | Contínuo |
| Código | Git (GitHub) | Contínuo |
| Vercel | Deploy automático | A cada push |

---

## Segurança em Produção

| Verificação | Status |
|-------------|--------|
| `.env` no `.gitignore` | ⚠️ Verificar |
| Senhas com bcrypt | ✅ |
| JWT com secret | ✅ |
| Middleware auth | ✅ |
| API key para gateway | ✅ |
| HTTPS (Vercel) | ✅ |
| CORS | Configurado pelo Next.js |

---

## CI/CD

### Pipeline Atual

| Etapa | Ferramenta |
|-------|-----------|
| Repository | GitHub |
| Deploy | Vercel (auto-deploy na branch main) |
| Lint | ESLint (next/core-web-vitals) |
| TypeScript | Verificação automática no build |
| Tests | Playwright (devDependency, sem testes escritos) |

### Pipeline Recomendado

| Etapa | Ferramenta |
|-------|-----------|
| Lint | `pnpm lint` |
| Type check | `tsc --noEmit` |
| Tests | Playwright (implementar) |
| Migrations | `node scripts/migrate.js` |
| Build | `pnpm build` |
| Deploy | Vercel (automático) |
