# GeoFissura — Autenticação e Autorização

> Sistema de auth do GeoFissura: NextAuth, JWT, roles e gateway.

---

## Stack de Autenticação

| Componente | Tecnologia |
|------------|-----------|
| Provider | Credentials (email + password) |
| Sessão | JWT (sem DB sessions) |
| Senhas | bcryptjs (10 rounds) |
| Biblioteca | NextAuth v4 |
| Middleware | `next-auth/middleware` (withAuth) |

---

## Fluxo de Login

```text
1. Usuário envia email + senha
2. NextAuth busca usuário por email no DB
3. bcryptjs compara senha com hash armazenado
4. Se válida → gera JWT com dados do usuário
5. JWT retorna ao client (cookie httpOnly)
6. Todas as rotas protegidas validam o JWT via middleware
```

---

## Conteúdo do JWT

O token JWT é estendido com campos customizados:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `token.sub` | string | ID do usuário |
| `token.email` | string | Email do usuário |
| `token.name` | string | Nome do usuário |
| `token.clienteId` | number | ID do cliente (multi-tenant) |
| `token.role` | string | Role do usuário |

---

## Sessão Estendida

A sessão NextAuth é augmentada via `next-auth.d.ts`:

```typescript
interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;      // "SUPER" | "ADMIN" | "USER" | "VIEWER"
    clienteId: number;  // ID do cliente dono
  };
}
```

---

## Roles

| Role | Descrição | Permissões |
|------|-----------|-----------|
| **SUPER** | Super-admin da plataforma | Acesso total: todos os clientes, billing, CRUD de clientes, hard delete |
| **ADMIN** | Admin do cliente | Gerencia usuários e configurações do seu cliente |
| **USER** | Usuário comum | CRUD de edificações, sensores, visualização de dados |
| **VIEWER** | Somente leitura | Apenas visualização de dados |

### Matriz de Permissões

| Recurso | SUPER | ADMIN | USER | VIEWER |
|---------|-------|-------|------|--------|
| Ver todos os clientes | ✅ | ❌ | ❌ | ❌ |
| CRUD clientes | ✅ | ❌ | ❌ | ❌ |
| Gerenciar billing | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários do cliente | ✅ | ✅ | ❌ | ❌ |
| CRUD edificações | ✅ | ✅ | ✅ | ❌ (leitura) |
| CRUD sensores | ✅ | ✅ | ✅ | ❌ (leitura) |
| Ver leituras | ✅ | ✅ | ✅ | ✅ |
| Gerenciar notificações | ✅ | ✅ | ❌ | ❌ |
| Hard delete sensores | ✅ | ❌ | ❌ | ❌ |
| Gerenciar tipos (sensor/equipamento) | ✅ | ❌ | ❌ | ❌ |

---

## Middleware (Proteção de Rotas)

```typescript
// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * Exclui:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * Inclui todas as outras rotas
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Rotas Públicas (sem auth)

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/login` | Página de login |
| `/register` | Página de registro |
| `/api/auth/*` | Endpoints NextAuth |

Todas as outras rotas exigem JWT válido.

---

## Autenticação do Gateway

O gateway usa um mecanismo separado de autenticação via API Key:

### Configuração

| Variável | Descrição |
|----------|-----------|
| `GATEWAY_API_KEY` | Chave compartilhada entre gateway e GeoFissura |

### Headers

```
x-api-key: gf_gateway_prod_xxxxxxxxx
```

### Implementação (`src/lib/gateway-auth.ts`)

```typescript
// Valida API key do gateway
function validateGatewayAuth(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  return apiKey === process.env.GATEWAY_API_KEY;
}
```

### Endpoints Protegidos por API Key

| Endpoint | Uso |
|----------|-----|
| `GET /api/sensores/sincronizar` | Sync do catálogo de sensores |
| `GET /api/sensores/resolver` | Resolução de UUID |
| `POST /api/sync` | Batch de leituras |
| `POST /api/alertas` | Alertas críticos |

### Fluxo de Resolução

```text
1. Gateway envia x-api-key
2. middleware valida a chave
3. Gateway chama /api/sync com sensor_uuid
4. API resolve sensor_uuid → sensor.id + clienteId
5. Leitura é inserida com cliente_id correto
6. IDs internos do gateway NUNCA são expostos
```

---

## Segurança

### Senhas

- Hash com **bcryptjs** (10 rounds)
- Nunca armazenadas em texto plano
- Validação no login via `bcrypt.compare()`

### JWT

- Assinado com `NEXTAUTH_SECRET`
- Cookie httpOnly (não acessível via JavaScript)
- Expiração controlada pelo NextAuth

### Headers de Segurança

| Header | Valor |
|--------|-------|
| `x-api-key` | Chave do gateway |
| `Content-Type` | `application/json` |

### Multi-Tenant Isolation

```text
Cada request:
  1. Extrai clienteId do JWT
  2. Filtra queries por clienteId
  3. SUPER bypassa o filtro
  4. Gateway resolve sensor_uuid → clienteId automaticamente
```

### Boas Práticas

- `.env` não deve ser commitado (verificar .gitignore)
- Senhas nunca em logs
- API keys não em repositório
- IDs internos nunca expostos ao gateway
- `NEXTAUTH_SECRET` deve ser uma string aleatória longa
