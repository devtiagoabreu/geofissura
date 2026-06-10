![GeoFissura](public/landing-screenshot.png)

# GeoFissura

**Monitoramento inteligente de edificações.**

Plataforma SaaS para monitoramento de fissuras, trincas e movimentações estruturais com sensores IoT, alertas em tempo real e relatórios automáticos.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Linguagem** | TypeScript (strict) |
| **Estilo** | Tailwind CSS + shadcn/ui |
| **Banco** | PostgreSQL (Neon) |
| **ORM** | Drizzle ORM |
| **Auth** | NextAuth v4 (Credentials + JWT) |
| **3D** | Three.js |
| **Deploy** | Vercel |

## Funcionalidades

- [x] **Landing page** — hero com animação Three.js, features, como funciona, CTA
- [x] **Autenticação** — login com email/senha, sessão JWT com tenantId + role
- [x] **Multi-tenancy** — isolamento total de dados por tenant
- [x] **CRUD Edificações** — listar, criar, detalhe (editar/deletar em breve)
- [x] **CRUD Entidades** — listar, criar, detalhe (modelo extensível via JSONB)
- [x] **Leituras** — listagem com dados dos sensores IoT
- [x] **Relatórios** — geração de PDF
- [x] **Webhook MQTT** — recebe dados dos dispositivos via EMQX
- [ ] **Dashboard com gráficos** — Recharts
- [ ] **CRUD completo** — editar/deletar edificações e entidades
- [ ] **Administração** — gerenciamento de usuários do tenant
- [ ] **Upload de laudos** — Vercel Blob
- [ ] **Notificações** — email/SMS para alertas

## Modelo de Negócio

Dispositivos IoT instalados **in loco** nas edificações do cliente. Pagamento mensal por dispositivo + plano de dados na nuvem.

## Começando

```bash
# clonar
git clone https://github.com/devtiagoabreu/geofissura.git
cd geofissura

# instalar
pnpm install

# configurar variáveis de ambiente
cp .env.example .env
# preencha DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# rodar migrations
node scripts/migrate.js

# povoar banco
node scripts/seed.js

# iniciar dev
pnpm dev
```

## Credenciais de Teste

| Papel | Email | Senha |
|-------|-------|-------|
| Super Admin | devtiagoabreu@gmail.com | Estoicismo&70x7 |
| Admin | admin@geofissuras.com | admin123 |

## Estrutura

```
src/
├── app/
│   ├── (auth)/login/        # Página de login
│   ├── (dashboard)/         # Painel protegido
│   │   ├── dashboard/       # Home do painel
│   │   ├── edificacoes/     # CRUD edificações
│   │   ├── entidades/       # CRUD entidades
│   │   ├── leituras/        # Listagem de leituras
│   │   ├── relatorios/      # Geração de relatórios
│   │   └── admin/           # Administração
│   ├── api/
│   │   ├── auth/            # NextAuth
│   │   ├── edificacoes/     # API CRUD
│   │   ├── entidades/       # API CRUD
│   │   ├── leituras/        # API leituras
│   │   └── mqtt/webhook/    # Webhook EMQX
│   └── page.tsx             # Landing page
├── components/
│   ├── landing/             # Componentes da landing
│   ├── layout/              # Sidebar, Header, Shell
│   └── ui/                  # shadcn/ui primitives
└── lib/
    ├── db/
    │   ├── schema/          # Drizzle ORM schemas
    │   └── migrations/      # SQL migrations
    └── auth.ts              # NextAuth config
```

## Licença

MIT
