# GeoFissura — Frontend

> Páginas, componentes e UI do GeoFissura.

---

## Stack de UI

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Tailwind CSS | ^3.4.0 | Estilização utility-first |
| shadcn/ui (Radix) | — | Primitivas UI (Button, Input, Label) |
| Lucide React | ^0.441.0 | Ícones |
| Recharts | ^2.12.0 | Gráficos |
| Three.js | ^0.184.0 | Partículas WebGL (landing) |
| Sonner | ^1.5.0 | Toast notifications |
| next-themes | ^0.3.0 | Dark mode |
| TanStack React Table | ^8.20.0 | Tabelas |
| jsPDF | ^2.5.0 | Geração de PDF |

---

## Estrutura de Rotas

```text
/                                       → Landing page (redirect se logado)
/login                                  → Login
/dashboard                              → Dashboard (KPIs + gráfico + leituras)
/edificacoes                            → Lista de edificações
/edificacoes/novo                       → Criar edificação
/edificacoes/[id]                       → Detalhe da edificação
/edificacoes/[id]/editar                → Editar edificação
/sensores                               → Lista de sensores
/sensores/novo                          → Criar sensor
/sensores/[id]                          → Detalhe do sensor (gráfico + leituras)
/sensores/[id]/editar                   → Editar sensor
/leituras                               → Últimas 50 leituras
/relatorios                             → Geração de PDF
/notificacoes                           → Lista de notificações
/notificacoes/config                    → Configuração SMTP
/notificacoes/regras                    → Lista de regras
/notificacoes/regras/novo               → Criar regra
/notificacoes/regras/[id]               → Editar regra + destinatários
/cobranca                               → Visão geral de billing
/cobranca/[clienteId]                   → Billing por cliente
/cobranca/[clienteId]/relatorio         → Relatório imprimível
/admin                                  → Painel admin (tabs)
/configuracoes                          → Alterar senha
```

---

## Componentes de Layout

### DashboardShell (`src/components/layout/dashboard-shell.tsx`)

Wrapper de todas as páginas do dashboard:

```text
SessionProvider (next-auth)
  └── QueryClientProvider (TanStack)
       └── div.flex
            ├── Sidebar (fixa, w-60)
            └── main (conteúdo da página)
                 └── Header (top bar)
```

### Sidebar (`src/components/layout/sidebar.tsx`)

- Largura fixa: `w-60` (240px)
- Navegação filtrada por role do usuário
- Avatar + nome do usuário na parte inferior
- Itens de nav com ícones Lucide

### Header (`src/components/layout/header.tsx`)

- Campainha de notificações (badge com contagem via React Query, polling 30s)
- Toggle dark mode
- Botão sign out

---

## Páginas Principais

### Landing Page (`src/app/page.tsx`)

| Seção | Descrição |
|-------|-----------|
| Hero | Título, subtítulo, CTA |
| Stats | Números de impacto |
| Features Grid | Funcionalidades |
| How it Works | Passos de uso |
| CTA | Chamada para ação |
| Footer | Links e copyright |

Background: `NeonBackground` com Three.js (280 partículas, conexões nearest-neighbor, mouse parallax, additive blending).

### Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)

| Elemento | Descrição |
|----------|-----------|
| KPI Cards | 4 cards clicáveis (Edificações, Sensores, Leituras, Alertas) com modal |
| Gráfico | Recharts com leituras por período |
| Tabela | Últimas 50 leituras |

### Edificações

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/edificacoes` | Server | Lista de edificações |
| `/edificacoes/novo` | Client | Formulário de criação |
| `/edificacoes/[id]` | Server | Detalhe com seções: Sensores, Planos, Equipamentos, Documentos |
| `/edificacoes/[id]/editar` | Client | Formulário de edição |

### Sensores

| Roma | Tipo | Descrição |
|------|------|-----------|
| `/sensores` | Server | Lista de sensores |
| `/sensores/novo` | Client | Formulário de criação |
| `/sensores/[id]` | Client | Cards de metadata, gráfico de leituras, lista de leituras |
| `/sensores/[id]/editar` | Client | Formulário de edição |

### Notificações

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/notificacoes` | Mixed | Lista com mark-as-read |
| `/notificacoes/config` | Client | Configuração SMTP |
| `/notificacoes/regras` | Server | Lista de regras |
| `/notificacoes/regras/novo` | Client | Criar regra |
| `/notificacoes/regras/[id]` | Client | Editar regra + destinatários |

### Cobrança

| Rota | Tipo | Descrição |
|------|------|-----------|
| `/cobranca` | Client | Visão geral (todos os clientes) |
| `/cobranca/[clienteId]` | Client | Editor de preços |
| `/cobranca/[clienteId]/relatorio` | Client | Relatório imprimível |

### Admin (`/admin`)

Painel com tabs:

| Tab | Descrição |
|-----|-----------|
| Clientes | CRUD de clientes |
| Usuários | Lista de todos os usuários |
| Tipos de Sensor | CRUD de tipos |
| Tipos de Equipamento | CRUD de tipos |

---

## Componentes de Domínio

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| DashboardCards | `dashboard-cards.tsx` | 4 KPI cards com modal detalhado |
| SensoresSection | `sensores-section.tsx` | CRUD inline na detail da edificação |
| PlanosDadosSection | `planos-dados-section.tsx` | CRUD inline de planos |
| EquipamentosSection | `equipamentos-section.tsx` | CRUD inline de equipamentos |
| DocumentosSection | `documentos-section.tsx` | CRUD de links externos |

---

## Componentes UI (shadcn/ui)

| Componente | Descrição |
|-----------|-----------|
| Button | Variants: default, destructive, outline, secondary, ghost, link |
| Input | Input padrão |
| Label | Label acessível |
| Sonner | Toast provider |
| Modal | Modal customizado (não Radix Dialog) |
| DeleteButton | Delete com confirmação + loading |
| ReativarButton | Reativação com loading |

---

## Tema

### Dark Mode

- Estratégia: `class` (Tailwind)
- Toggle via `next-themes` no Header
- CSS custom properties para variáveis de tema

### Brand Colors

```css
:root {
  --brand: #10b981; /* emerald-500 (light) */
}

.dark {
  --brand: #059669; /* emerald-600 (dark) */
}
```

### Custom Utilities

| Classe | Descrição |
|--------|-----------|
| `.glass` | Efeito glassmorphism |
| `.card-hover` | Hover elevação em cards |
| `.gradient-text` | Texto com gradiente |
| `fade-in` | Animação de entrada |
| `slide-in` | Animação de slide |
| `scale-in` | Animação de scale |

### Fonte

Inter (Google Fonts), carregada via `next/font/google`.

---

## State Management

| Camada | Mecanismo |
|--------|----------|
| Server data | Drizzle queries em Server Components |
| Server state (client) | TanStack React Query |
| Form state | React useState |
| Auth | next-auth SessionProvider |
| Theme | next-themes ThemeProvider |

---

## Padrões de Componente

### Server Component (padrão)
```typescript
export default async function PageName() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await db.query.table.findMany({
    where: eq(table.clienteId, session.user.clienteId),
  });

  return (
    <div>
      <h1>Título</h1>
      {/* renderiza data */}
    </div>
  );
}
```

### Client Component
```typescript
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function ClientPage() {
  const [state, setState] = useState(null);
  const { data, isLoading } = useQuery({
    queryKey: ["key"],
    queryFn: () => fetch("/api/endpoint").then(r => r.json()),
  });

  return (
    <div>
      {/* renderiza data com interatividade */}
    </div>
  );
}
```
