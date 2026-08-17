# GeoFissura — API Endpoints

> Referência completa de todos os endpoints da API REST.

---

## Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth | Handler de autenticação |

---

## Sensores

### Autenticados (Web)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/sensores` | Session | Lista sensores do cliente (com joins de edificação/cliente) |
| POST | `/api/sensores` | Session | Cria sensor (aceita `uuid` no body) |
| GET | `/api/sensores/[id]` | Session | Detalhe do sensor |
| PUT | `/api/sensores/[id]` | Session | Atualiza sensor |
| DELETE | `/api/sensores/[id]` | Session | Soft delete (`ativo=N`); hard delete com `?force=true` (SUPER) |
| POST | `/api/sensores/[id]/reativar` | Session | Reativa sensor (`ativo=S`) |
| GET | `/api/sensores/[id]/leituras` | Session | Últimas 50 leituras do sensor |

### Gateway (API Key)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/sensores/sincronizar` | `x-api-key` | Retorna array de sensores ativos `[{id, uuid, tipoSensor, edificacaoId}]` |
| GET | `/api/sensores/resolver?uuid={uuid}` | `x-api-key` | Resolve UUID → `{id, uuid, nome, tipoSensor}` |

---

## Edificações

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/edificacoes` | Session | Lista edificações ativas do cliente |
| POST | `/api/edificacoes` | Session | Cria edificação |
| GET | `/api/edificacoes/[id]` | Session | Detalhe da edificação |
| PUT | `/api/edificacoes/[id]` | Session | Atualiza edificação |
| DELETE | `/api/edificacoes/[id]` | Session | Soft delete (cascata: sensores, planos, equipamentos) |
| POST | `/api/edificacoes/[id]/reativar` | Session | Reativa edificação + todos os filhos |

### Nested — Equipamentos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/edificacoes/[id]/equipamentos` | Session | Lista equipamentos |
| POST | `/api/edificacoes/[id]/equipamentos` | Session | Adiciona equipamento |
| PUT | `/api/edificacoes/[id]/equipamentos/[equipId]` | Session | Atualiza equipamento |
| DELETE | `/api/edificacoes/[id]/equipamentos/[equipId]` | Session | Remove equipamento |

### Nested — Planos de Dados

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/edificacoes/[id]/planos-dados` | Session | Lista planos |
| POST | `/api/edificacoes/[id]/planos-dados` | Session | Adiciona plano |
| PUT | `/api/edificacoes/[id]/planos-dados/[planoId]` | Session | Atualiza plano |
| DELETE | `/api/edificacoes/[id]/planos-dados/[planoId]` | Session | Remove plano |

---

## Clientes (Super Admin)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/clientes` | SUPER | Lista todos os clientes |
| POST | `/api/clientes` | SUPER | Cria cliente |
| GET | `/api/clientes/[id]` | Auth (próprio ou SUPER) | Detalhe do cliente |
| PUT | `/api/clientes/[id]` | SUPER | Atualiza cliente |
| DELETE | `/api/clientes/[id]` | SUPER | Remove cliente |

---

## Usuários

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/usuarios` | Session | Lista usuários (filtrado por cliente, exceto SUPER) |
| POST | `/api/usuarios` | Session | Cria usuário (senha hasheada com bcrypt) |
| PUT | `/api/usuarios/[id]` | Session (mesmo cliente) | Atualiza usuário |
| DELETE | `/api/usuarios/[id]` | Session (mesmo cliente) | Remove usuário |
| PUT | `/api/usuarios/[id]/password` | Session | Altera senha (requer senha atual, exceto SUPER) |

---

## Leituras

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/leituras` | Session | Últimas 50 leituras (com joins de sensor, edificação, cliente) |

---

## Documentos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/documentos?edificacaoId={id}` | Session | Lista documentos da edificação |
| POST | `/api/documentos` | Session | Adiciona documento (URL externa) |
| PUT | `/api/documentos/[id]` | Session | Atualiza documento |
| DELETE | `/api/documentos/[id]` | Session | Remove documento |

---

## Tipos (Lookup)

### Tipos de Sensor

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/tipos-sensor` | Session | Lista tipos |
| POST | `/api/tipos-sensor` | SUPER | Cria tipo |
| GET | `/api/tipos-sensor/[id]` | Session | Detalhe do tipo |
| PUT | `/api/tipos-sensor/[id]` | SUPER | Atualiza tipo |
| DELETE | `/api/tipos-sensor/[id]` | SUPER | Remove tipo |

### Tipos de Equipamento

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/tipos-equipamento` | Session | Lista tipos |
| POST | `/api/tipos-equipamento` | SUPER | Cria tipo |
| GET | `/api/tipos-equipamento/[id]` | Session | Detalhe do tipo |
| PUT | `/api/tipos-equipamento/[id]` | SUPER | Atualiza tipo |
| DELETE | `/api/tipos-equipamento/[id]` | SUPER | Remove tipo |

---

## MQTT / IoT Integration

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/mqtt/webhook` | Nenhum (raw) | EMQX webhook: recebe MQTT, parseia tópico, insere leitura |
| POST | `/api/sync` | `x-api-key` | Batch sync: array de leituras com `sensor_uuid` |
| POST | `/api/alertas` | `x-api-key` | Alertas críticos: cria notificações para admins |

### Contrato `/api/sync`

```json
// Request
{
  "leituras": [
    {
      "sensor_uuid": "GF-000001",
      "valor": 0.52,
      "unidade": "mm",
      "datahora": "2026-06-14T08:00:00",
      "topico_mqtt": "geofissura/GF-000001",
      "metadata": {}
    }
  ]
}

// Response 200
{
  "resultados": [
    { "sensor_uuid": "GF-000001", "status": "ok" }
  ],
  "inseridas": 1
}
```

### Contrato `/api/alertas`

```json
// Request
{
  "sensor_uuid": "GF-000001",
  "tipo": "fissura_critica",
  "mensagem": "Fissura ultrapassou limite de 1.5mm",
  "valor": 2.34,
  "unidade": "mm",
  "limite": 1.5,
  "datahora": "2026-06-14T08:00:00"
}

// Response 200
{
  "alerta_id": 42,
  "status": "registrado",
  "notificacoes_criadas": 3
}
```

---

## Cobrança (Super Admin)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/cobranca` | SUPER | Visão geral (todos os clientes com totais) |
| GET | `/api/cobranca/[clienteId]` | SUPER | Detalhe de um cliente |
| GET | `/api/cobranca/[clienteId]/relatorio` | SUPER | Relatório completo |
| PUT | `/api/cobranca/planos` | SUPER | Atualiza preços dos planos |
| PUT | `/api/cobranca/equipamentos` | SUPER | Atualiza preços dos equipamentos |

---

## Padrões de Resposta

### Sucesso
```json
{ "dados": [...] }
// ou
{ "mensagem": "Operação realizada com sucesso" }
```

### Erro
```json
{ "error": "Mensagem de erro" }
```

### Status Codes Comuns

| Código | Significado |
|--------|------------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Bad Request (dados inválidos) |
| 401 | Não autenticado (sem sessão ou API key) |
| 403 | Não autorizado (role insuficiente) |
| 404 | Não encontrado |
| 500 | Erro interno do servidor |
