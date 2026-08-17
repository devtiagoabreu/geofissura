# GeoFissura — Visão Geral

> Documento de referência para o repositório `geofissura`.  
> Última atualização: 17 de agosto de 2026

---

## O que é o GeoFissura

Plataforma SaaS multi-tenant para **monitoramento inteligente de edificações**. Rastreia fissuras, movimentações estruturais e condições ambientais usando sensores IoT (ESP32) e sensores de visão computacional.

O sistema提供ce cadastro de construtoras/edificações, dashboards em tempo real, alertas automáticos, relatórios PDF e integração com dispositivos IoT via MQTT e REST.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | ^14.2.0 |
| Linguagem | TypeScript (strict) | ^5.5.0 |
| UI | Tailwind CSS + shadcn/ui (Radix) | ^3.4.0 |
| Banco de dados | PostgreSQL (Neon serverless) | — |
| ORM | Drizzle ORM | ^0.33.0 |
| Autenticação | NextAuth v4 (Credentials + JWT) | ^4.24.0 |
| Gráficos | Recharts | ^2.12.0 |
| 3D | Three.js (landing page) | ^0.184.0 |
| Forms | React Hook Form + Zod | ^7.53.0 |
| Tabelas | TanStack React Table | ^8.20.0 |
| PDF | jsPDF + jsPDF-AutoTable | ^2.5.0 |
| Email | Nodemailer | ^7.0.0 |
| Upload | Vercel Blob | ^0.27.0 |
| Realtime | Socket.io | ^4.7.0 |
| State | TanStack React Query | ^5.56.0 |
| Package manager | pnpm | — |
| Deploy | Vercel | — |

---

## Estrutura de Diretórios

```
geofissura/
├── .agent/                    # Configuração e docs do agente
│   ├── architecture.md        # Arquitetura detalhada do ecossistema
│   ├── docs/                  # Documentação (esta pasta)
│   └── skills/                # Skills do agente
├── src/
│   ├── app/                   # Next.js App Router (páginas + API)
│   ├── components/            # Componentes React compartilhados
│   ├── lib/                   # Utilitários, auth, DB, schemas
│   ├── middleware.ts          # Middleware de autenticação
│   └── types/                 # Definições TypeScript
├── scripts/                   # Scripts de seed, migração, teste
├── public/                    # Assets estáticos
├── drizzle.config.ts          # Configuração do Drizzle ORM
├── next.config.mjs            # Configuração do Next.js
├── tailwind.config.ts         # Configuração do Tailwind
└── package.json               # Dependências e scripts npm
```

---

## Funcionalidades Principais

### Gestão Multi-Tenant
- Cadastro de construtoras/clientes isolados
- Usuários com roles: SUPER, ADMIN, USER, VIEWER
- Dados completamente isolados entre tenants

### Cadastros
- **Edificações** — construção, endereço, status
- **Sensores** — tipo, modelo, UUID, fabricante, valor mensal
- **Equipamentos** — tipo, quantidade, valor unitário
- **Planos de dados** — operadora, descrição, valor mensal
- **Documentos** — links externos (Google Drive, etc.)

### Monitoramento
- Dashboard com KPIs (edificações, sensores, leituras, alertas)
- Gráficos de leituras por sensor (Recharts)
- Últimas 50 leituras com filtros

### Alertas e Notificações
- Regras de notificação por tipo de sensor e condição
- Configuração SMTP por cliente
- Notificações in-app (bell icon, polling 30s)
- Destinatários por regra (email, push)

### Integração IoT
- MQTT via EMQX webhook (`/api/mqtt/webhook`)
- Batch sync via gateway (`/api/sync`)
- Resolução de sensores por UUID (`/api/sensores/resolver`)
- Alertas críticos via gateway (`/api/alertas`)

### Cobrança (Super Admin)
- Visão geral de faturamento por cliente
- Planos de dados e equipamentos com valores
- Relatórios imprimíveis

### Relatórios
- Geração de PDF com jsPDF
- Dados de leituras, sensores e edificações

---

## Modelos de Negócio

A cobrança é calculada por edificação com três componentes:

| Componente | Cálculo |
|------------|---------|
| Sensores | Valor mensal por sensor instalado |
| Planos de dados | Valor mensal por plano (Vivo, Claro, TIM, etc.) |
| Equipamentos | Quantidade × valor unitário |

---

## Segurança

- Senhas com bcrypt (10 rounds)
- Sessões JWT (sem DB sessions)
- Middleware protege todas as rotas exceto `/`, `/login`, `/register`, `/api/auth`
- Gateway endpoints usam `x-api-key` header separado
- Soft delete em todas as entidades (ativação/desativação)
- `.env` não deve ser commitado (⚠️ verificar se está no .gitignore)

---

## Status Atual

| Componente | Status |
|------------|--------|
| GeoFissura (web) | ✅ Completo (Fase 1) |
| Gateway MQTT | ⬜ Pendente (Fase 2) |
| ESP32 Firmware | ⬜ Pendente (Fase 3) |
| Vision Platform Local | ⬜ Proposta (ver vision_platform_integrada.md) |
| Vision Platform Central | ⬜ Proposta (ver vision_platform_integrada.md) |

---

## Documentação Relacionada

- [architecture.md](./architecture.md) — Arquitetura técnica detalhada
- [database.md](./database.md) — Schema e migrations do banco
- [api.md](./api.md) — Todos os endpoints da API
- [authentication.md](./authentication.md) — Sistema de autenticação
- [frontend.md](./frontend.md) — Páginas e componentes do frontend
- [integrations.md](./integrations.md) — Integrações IoT, MQTT, Gateway
- [deployment.md](./deployment.md) — Deploy, env vars e scripts
- [vision-platform-integrada.md](./vision_platform_integrada.md) — Proposta arquitetural da plataforma integrada
- [vision-platform-roadmap.md](./vision-platform-roadmap.md) — Roadmap de implementação
