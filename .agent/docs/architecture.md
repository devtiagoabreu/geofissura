# GeoFissura — Arquitetura Técnica

> Detalhamento técnico da arquitetura do repositório `geofissura`.  
> Para a visão de ecossistema completo, ver [vision_platform_integrada.md](./vision_platform_integrada.md).

---

## Padrão Arquitetural

O GeoFissura segue o padrão **Next.js App Router** com separação em camadas:

```text
┌─────────────────────────────────────────────┐
│              Frontend (React)                │
│  Server Components + Client Components      │
│  Tailwind CSS + shadcn/ui                   │
├─────────────────────────────────────────────┤
│              API Routes (Next.js)            │
│  GET/POST/PUT/DELETE por entidade            │
│  Session auth + Gateway API Key             │
├─────────────────────────────────────────────┤
│              Lib (utilitários)               │
│  DB (Drizzle) + Auth (NextAuth) + Helpers   │
├─────────────────────────────────────────────┤
│              Database (Neon PostgreSQL)       │
│  14 tabelas, migrations manuais             │
└─────────────────────────────────────────────┘
```

---

## Organização do Código

### `src/app/` — Rotas (App Router)

```text
src/app/
├── page.tsx                          # Landing page (raiz)
├── layout.tsx                        # Root layout (html, body, font)
├── login/                            # Página de login
├── api/
│   ├── auth/[...nextauth]/           # NextAuth handler
│   ├── clientes/                     # CRUD clientes (SUPER)
│   ├── usuarios/                     # CRUD usuários
│   ├── edificacoes/                  # CRUD edificações + nested
│   │   └── [id]/
│   │       ├── equipamentos/         # CRUD equipamentos
│   │       └── planos-dados/         # CRUD planos de dados
│   ├── sensores/                     # CRUD sensores + leituras
│   │   ├── [id]/leituras/            # Últimas 50 leituras
│   │   ├── sincronizar/              # Gateway: sync catálogo
│   │   └── resolver/                 # Gateway: resolver UUID
│   ├── leituras/                     # Lista geral de leituras
│   ├── documentos/                   # CRUD documentos
│   ├── tipos-sensor/                 # CRUD tipos de sensor
│   ├── tipos-equipamento/            # CRUD tipos de equipamento
│   ├── mqtt/webhook/                 # EMQX webhook
│   ├── sync/                         # Gateway: batch leituras
│   ├── alertas/                      # Gateway: alertas críticos
│   └── cobranca/                     # Billing (SUPER)
├── (dashboard)/                      # Grupo de rotas protegidas
│   ├── dashboard/                    # Dashboard principal
│   ├── edificacoes/                  # CRUD edificações (UI)
│   ├── sensores/                     # CRUD sensores (UI)
│   ├── leituras/                     # Lista de leituras
│   ├── relatorios/                   # Geração de PDF
│   ├── notificacoes/                 # Notificações + config
│   ├── cobranca/                     # Billing (UI)
│   ├── admin/                        # Painel admin (tabs)
│   └── configuracoes/                # Configurações do usuário
```

### `src/lib/` — Utilitários

| Arquivo | Responsabilidade |
|---------|-----------------|
| `db/index.ts` | Conexão PostgreSQL (postgres driver, prepare:false) |
| `db/schema/*.ts` | 15 arquivos de schema Drizzle |
| `db/migrations/*.sql` | 12 migrations SQL manuais |
| `auth.ts` | Configuração NextAuth (Credentials + JWT) |
| `gateway-auth.ts` | Validação de API Key para gateway |
| `utils.ts` | Helpers gerais (cn, formatadores) |

### `src/components/` — Componentes

```text
src/components/
├── layout/
│   ├── dashboard-shell.tsx    # Shell: SessionProvider + QueryClient + Sidebar + Header
│   ├── sidebar.tsx            # Sidebar fixa (w-60) com nav filtrada por role
│   └── header.tsx             # Top bar: notificações, dark mode, sign out
├── landing/
│   ├── landing-page.tsx       # Landing page completa
│   └── neon-background.tsx    # WebGL/Three.js particles
├── dashboard-cards.tsx        # 4 KPI cards com modal
├── sensores-section.tsx       # CRUD inline de sensores
├── planos-dados-section.tsx   # CRUD inline de planos
├── equipamentos-section.tsx   # CRUD inline de equipamentos
├── documentos-section.tsx     # CRUD de documentos
└── ui/                        # Primitivas shadcn/ui
    ├── button.tsx
    ├── input.tsx
    ├── label.tsx
    ├── sonner.tsx
    ├── modal.tsx
    ├── delete-button.tsx
    └── reativar-button.tsx
```

---

## Padrões de Renderização

### Server Components (padrão)
- Dashboard, listagens, páginas de detail
- Queries diretas ao DB via Drizzle
- Sem `"use client"`

### Client Components
- Formulários (create/edit)
- Admin panel
- Billing
- Sensor detail (gráficos)
- Toda página que usa `useState`, `useEffect` ou interatividade

### Padrão de Componente

```typescript
// Server Component (padrão)
export default async function PageName() {
  const session = await getSession();
  const data = await db.query.tableName.findMany({...});
  return <div>...</div>;
}

// Client Component
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ClientPage() {
  const [state, setState] = useState(null);
  const { data } = useQuery({...});
  return <div>...</div>;
}
```

---

## Padrões de Estado

| Camada | Mecanismo |
|--------|----------|
| Server-side | Drizzle queries diretas em Server Components |
| Client-side | TanStack React Query (server state) |
| Form state | React useState |
| Auth state | next-auth SessionProvider |
| Theme | next-themes ThemeProvider |

---

## Padrões de API

### Estrutura padrão de rota

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await db.query.tableName.findMany({
      where: eq(table.clienteId, session.user.clienteId),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
```

### Padrão de erro

```typescript
function apiError(message: string, status: number = 500) {
  console.error(message);
  return NextResponse.json({ error: message }, { status });
}
```

---

## Multi-Tenancy

Todas as tabelas possuem `cliente_id` como foreign key. A isolamento é garantido por:

1. **JWT token** contém `clienteId` e `role`
2. **API routes** filtram por `session.user.clienteId`
3. **SUPER role** bypassa o filtro de tenant
4. **Gateway endpoints** resolvem `sensor_uuid` → `clienteId` automaticamente

```text
usuario (ADMIN/USER/VIEWER) → vê apenas dados do seu clienteId
usuario (SUPER)             → vê todos os clientes
gateway (x-api-key)         → acessa endpoints públicos (sync, alertas)
```

---

## Soft Delete

Todas as entidades usam coluna `ativo` (VARCHAR(1), valores "S"/"N"):

| Operação | Comportamento |
|----------|--------------|
| DELETE | `ativo = "N"` (soft delete) |
| DELETE com `?force=true` | DELETE real (apenas SUPER para sensores) |
| POST `/reativar` | `ativo = "S"` + reativa filhos |

**Cascata de desativação:** desativar uma edificação desativa automaticamente seus sensores, planos de dados e equipamentos.

---

## Estrutura de Pastas do Banco

```text
src/lib/db/
├── index.ts              # Conexão com PostgreSQL
├── schema/
│   ├── clientes.ts       # Tabela clientes
│   ├── usuarios.ts       # Tabela usuarios
│   ├── edificacoes.ts    # Tabela edificacoes
│   ├── sensores.ts       # Tabela sensores
│   ├── leituras.ts       # Tabela leituras
│   ├── documentos.ts     # Tabela documentos
│   ├── planos-dados.ts   # Tabela planos_dados
│   ├── equipamentos.ts   # Tabela equipamentos
│   ├── notificacoes.ts   # Tabela notificacoes
│   ├── notificacoes-config.ts
│   ├── notificacoes-regras.ts
│   ├── notificacoes-regra-destinatarios.ts
│   ├── tipos-sensor.ts   # Lookup tipos_sensor
│   ├── tipos-equipamento.ts # Lookup tipos_equipamento
│   └── tenants.ts        # Legacy (renomeado para clientes)
└── migrations/
    ├── 0001_estrutura_inicial.sql
    ├── 0002_...sql
    └── ...
```

---

## CSS Architecture

- **Tailwind CSS** com CSS custom properties para theming
- **Dark mode:** class strategy (`.dark`)
- **Brand color:** `--brand` (emerald-600: #059669 dark, #10b981 light)
- **Custom utilities:** `.glass`, `.card-hover`, `.gradient-text`
- **Font:** Inter (Google Fonts)
- **Animações:** fade-in, slide-in, scale-in (tailwindcss-animate)

---

## Conexão com o Ecossistema

O GeoFissura é um dos três módulos do ecossistema GeoFissura:

```text
ESP32 → MQTT → Gateway → REST API → GeoFissura (Next.js)
                                       ↓
                                    Neon PostgreSQL
```

Para a evolução completa com visão computacional:

```text
Câmeras/ESP32 → Vision Platform Local → Vision Platform Central → GeoFissura
```

Ver [vision_platform_integrada.md](./vision_platform_integrada.md) para detalhes.
