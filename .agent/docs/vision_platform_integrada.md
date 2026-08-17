# Vision Platform Integrada — Arquitetura Local, Central e GeoFissura

> Documento técnico para orientar a evolução do ecossistema GeoFissura para uma plataforma distribuída de visão computacional, com processamento em camadas e sincronização periódica.

**Status:** proposta arquitetural baseada nos repositórios existentes  
**Autor:** Manus AI  
**Data:** 17 de agosto de 2026  
**Repositórios analisados:** [config-server-geofissura-orange-pi-3-lts][1] e [geofissura][2]

---

## 1. Objetivo

O objetivo desta arquitetura é organizar o sistema em três níveis complementares:

| Nível | Função principal | Localização típica |
|---|---|---|
| **Vision Platform Local** | Conectar-se às câmeras e sensores do local, executar o processamento preliminar, armazenar dados temporariamente e continuar operando mesmo sem internet | Orange Pi 3 LTS ou servidor local equivalente |
| **Vision Platform Central** | Reunir dados de várias unidades locais, executar modelos de maior custo computacional, correlacionar eventos e disponibilizar uma camada única de integração | Servidor central com mais CPU, RAM, GPU e armazenamento |
| **GeoFissura** | Manter cadastro, multi-tenancy, permissões, dashboards, histórico, relatórios, notificações e regras de negócio | SaaS Next.js, PostgreSQL Neon e Vercel |

A plataforma não deve tratar o Orange Pi como um servidor de IA pesada. O Orange Pi deve ser entendido como uma **borda operacional**, responsável por adquirir dados, reduzir o volume de informação, aplicar regras locais simples e manter uma fila confiável. O processamento que exige modelos maiores, múltiplas câmeras ou análise histórica deve ser deslocado para a Vision Platform Central.

> **Princípio central:** o local deve continuar funcionando durante a indisponibilidade da rede; a central deve concentrar a inteligência computacional; o GeoFissura deve permanecer como sistema de gestão e operação do negócio.

## 2. Estado atual identificado

### 2.1 Repositório da central local

O repositório `config-server-geofissura-orange-pi-3-lts` já representa um padrão de provisionamento para centrais baseadas em Orange Pi 3 LTS. A central de referência utiliza Armbian sobre Debian 13, arquitetura ARM64, CPU Allwinner H6 Cortex-A53 de quatro núcleos e 2 GB de RAM. O sistema possui PostgreSQL local, SSH, firewall, rede Wi-Fi, serviços de backup e estrutura de desenvolvimento em `/home/geofissura/dev`.[1]

O banco PostgreSQL está separado no eMMC, enquanto o sistema e a pasta de desenvolvimento ficam no microSD. O repositório também define provisionamento automatizado, variáveis locais, backup do banco e da pasta `dev/`, replicação para Google Drive via `rclone` e retenção local de sete dias.[1]

Esses elementos são uma base adequada para a **Vision Platform Local**, mas ainda precisam ser complementados por serviços de captura de câmera, ingestão, processamento leve, armazenamento de evidências, fila de sincronização e API local.

### 2.2 Repositório GeoFissura

O repositório `geofissura` implementa o SaaS atual com Next.js 14, TypeScript, Tailwind, Drizzle ORM, NextAuth, PostgreSQL Neon e deploy previsto na Vercel. Ele já possui autenticação, isolamento por cliente, edificações, sensores, leituras, relatórios, notificações, equipamentos, planos de dados e endpoints específicos para gateways.[2]

O GeoFissura já contempla quatro contratos importantes para a integração de dispositivos: resolver um sensor pelo UUID, sincronizar o catálogo de sensores ativos, inserir leituras em lote e registrar alertas críticos. Os endpoints públicos exigem o header `x-api-key`, e a rota de sincronização relaciona cada `sensor_uuid` ao sensor e ao cliente corretos no banco central.[2]

### 2.3 Arquitetura já documentada

A arquitetura existente do GeoFissura prevê um gateway Node.js com Mosquitto e PostgreSQL local, recebendo mensagens MQTT dos ESP32, armazenando leituras em uma fila local e enviando lotes ao Neon. Esse conceito será mantido, mas será generalizado: o gateway local deixará de ser apenas um gateway MQTT e passará a ser a **Vision Platform Local**, capaz de lidar com sensores, câmeras e outros dispositivos.[2]

---

## 3. Arquitetura proposta

```text
┌────────────────────────────────────────────────────────────────────┐
│                         GEO FISSURA                                │
│ Next.js + API + Auth + Multi-tenant + Dashboards + Alertas         │
│ PostgreSQL Neon + Vercel                                           │
└───────────────────────────────▲────────────────────────────────────┘
                                │ HTTPS / API segura
                                │ sincronização de eventos e leituras
┌───────────────────────────────┴────────────────────────────────────┐
│                    VISION PLATFORM CENTRAL                         │
│ Orquestração | Catálogo | Fila | Correlação | IA pesada | API       │
│ Banco central de eventos | Armazenamento de evidências | Workers   │
│ CPU/RAM/GPU maiores                                               │
└───────────────────────────────▲────────────────────────────────────┘
                                │ HTTPS pull periódico ou push seguro
                                │ lotes, evidências e telemetria
              ┌─────────────────┼─────────────────┐
              │                 │                 │
┌─────────────┴────────────┐ ┌──┴─────────────────┐ ┌──────────────┴─────────────┐
│ VISION PLATFORM LOCAL A  │ │ VISION PLATFORM B  │ │ VISION PLATFORM LOCAL N    │
│ Orange Pi / servidor     │ │ Orange Pi / edge   │ │ Orange Pi / edge            │
│ Câmeras + sensores       │ │ Câmeras + sensores  │ │ Câmeras + sensores          │
│ MQTT / RTSP / ONVIF      │ │ Buffer + fila       │ │ Processamento preliminar    │
│ IA leve + regras locais  │ │ API local           │ │ API local + sincronização   │
└─────────────▲────────────┘ └────────────▲────────┘ └────────────▲────────────────┘
              │                           │                     │
        ESP32 / câmeras              ESP32 / câmeras       ESP32 / câmeras
```

### 3.1 Fluxo preferencial de dados

O fluxo preferencial será iniciado pela Vision Platform Central, que consulta as unidades locais em intervalos configuráveis. Essa escolha reduz a necessidade de abrir portas de entrada nas redes dos clientes e torna a operação compatível com locais atrás de NAT ou firewall.

```text
1. Câmera ou sensor produz dados
2. Vision Platform Local recebe e registra o dado
3. Local aplica pré-processamento e regras rápidas
4. Local grava evento, leitura ou evidência na fila local
5. Central consulta a API local em intervalo configurável
6. Local entrega um lote e marca os itens como reservados
7. Central processa, correlaciona e persiste o resultado
8. Central envia ao GeoFissura apenas dados de negócio
9. GeoFissura atualiza histórico, dashboard e notificações
10. Central confirma a entrega para o local
```

Para alertas de alta severidade, a arquitetura pode usar um canal de exceção: o local envia imediatamente um evento assinado para a central, sem esperar o próximo ciclo periódico. O polling periódico continua sendo o mecanismo de consistência e recuperação; o canal imediato é apenas uma otimização de latência.

### 3.2 Por que a central consulta os locais

A coleta periódica pela central oferece quatro vantagens. Primeiro, os locais não precisam ser expostos diretamente à internet. Segundo, o tempo de coleta pode ser ajustado conforme o volume de cada unidade. Terceiro, a central controla o backpressure, evitando que um local lento sobrecarregue o sistema. Quarto, a central consegue reprocessar lotes e coordenar a execução de modelos mais pesados.

A frequência não deve ser fixa para todos os dados. Leituras de sensores podem ser coletadas em lotes de minutos ou horas; eventos críticos devem ser encaminhados imediatamente; imagens brutas devem ser transferidas apenas quando necessárias; vídeos contínuos não devem ser enviados para o GeoFissura.

---

## 4. Responsabilidades por camada

| Capacidade | Vision Platform Local | Vision Platform Central | GeoFissura |
|---|---|---|---|
| Conexão RTSP/ONVIF | Sim | Não, salvo casos especiais | Não |
| Recepção MQTT dos ESP32 | Sim | Opcional | Não diretamente |
| Buffer offline | Sim | Sim | Banco central como histórico |
| Inferência leve | Sim | Opcional | Não |
| Inferência pesada | Não como regra | Sim | Não |
| Treinamento e versionamento de modelos | Não | Sim | Administração e configuração |
| Registro operacional de dispositivos | Cache local | Catálogo técnico agregado | Cadastro comercial e multi-tenant |
| Regras de negócio | Regras locais de segurança e continuidade | Correlação e classificação técnica | Regras de cliente, alertas e notificações |
| Dashboard | Diagnóstico local | Observabilidade técnica | Dashboard do cliente |
| Armazenamento de evidências | Cache e retenção curta | Armazenamento principal de eventos | Links, histórico e acesso autorizado |
| Sincronização | Expõe API local | Coordena coleta e entrega | Recebe dados de negócio |
| Usuários e permissões | Identidade da instalação | Identidade de serviço | Usuários, roles e tenants |

A separação evita que regras comerciais e permissões do GeoFissura sejam duplicadas em cada Orange Pi. O local precisa saber **como operar**; a central precisa saber **como processar e integrar**; o GeoFissura precisa saber **a quem pertence o dado e que ação de negócio deve ocorrer**.

---

## 5. Vision Platform Local

### 5.1 Componentes sugeridos

A Vision Platform Local deve ser implementada como um conjunto de serviços pequenos e independentes, preferencialmente em Docker quando o hardware e a distribuição permitirem. Quando o consumo de memória for uma restrição importante, os serviços podem ser executados diretamente como processos Node.js ou Python supervisionados por `systemd`.

| Componente | Responsabilidade |
|---|---|
| `device-manager` | Cadastro e descoberta de câmeras, sensores e fontes de dados |
| `camera-ingest` | Abertura de RTSP, captura de frames e controle de reconexão |
| `mqtt-ingest` | Assinatura de `geofissura/+` e recepção de leituras dos ESP32 |
| `edge-preprocessor` | Redimensionamento, amostragem, compressão e filtros simples |
| `edge-rules` | Regras locais de baixo custo, como limites imediatos e saúde da câmera |
| `local-store` | PostgreSQL local para metadados, leituras, eventos e fila |
| `outbox` | API que entrega itens pendentes à Vision Platform Central |
| `sync-agent` | Cliente opcional para puxar configuração e confirmar lotes |
| `health-api` | Health check, status de disco, câmera, MQTT, banco e fila |
| `retention-worker` | Limpeza de imagens e dados antigos conforme política local |

### 5.2 Operação no Orange Pi

O Orange Pi 3 LTS possui 2 GB de RAM e CPU ARM Cortex-A53. Portanto, sua função deve priorizar aquisição, disponibilidade e redução de dados. Modelos leves podem ser usados quando forem comprovadamente compatíveis com o hardware, mas a arquitetura não deve depender da execução contínua de YOLO grande, TensorRT pesado ou múltiplas análises simultâneas nessa placa.

A política recomendada é manter no local apenas o necessário para a continuidade operacional. Frames podem ser amostrados, reduzidos e descartados após a geração de um evento. Evidências devem ser comprimidas em JPEG ou outro formato adequado. Vídeo contínuo deve permanecer na rede local ou em armazenamento específico, não sendo enviado automaticamente para a central.

### 5.3 Banco local

A estrutura existente de `sensores`, `leituras_local` e `sync_queue` deve ser ampliada para comportar dispositivos de visão.

| Tabela ou agregado | Conteúdo |
|---|---|
| `local_devices` | Câmeras, ESP32, fontes RTSP, dispositivos e status |
| `local_sensors` | Cache dos sensores conhecidos pelo GeoFissura |
| `camera_streams` | URL lógica, perfil, resolução, FPS, estado e última conexão |
| `observations` | Observações brutas ou pré-processadas produzidas localmente |
| `vision_events` | Eventos detectados, severidade, modelo e timestamp |
| `evidence_objects` | Caminho, hash, tamanho, MIME type e retenção de imagens |
| `outbox` | Itens aguardando entrega à central |
| `delivery_attempts` | Tentativas, status, erro e próximo retry |
| `config_snapshots` | Versão da configuração aplicada localmente |
| `health_samples` | Métricas de CPU, RAM, disco, temperatura, câmera e conectividade |

Todo evento deve possuir um identificador idempotente, por exemplo `local_id + sequence` ou um UUID gerado no local. O `sensor_uuid` continua sendo a chave funcional dos sensores do GeoFissura; para visão, recomenda-se uma chave complementar como `camera_uuid` e `source_uuid`.

### 5.4 API local

A API local deve ser acessível apenas na rede privada ou por um túnel seguro. Rotas mínimas:

| Método | Rota | Finalidade |
|---|---|---|
| `GET` | `/health` | Saúde do processo e dependências |
| `GET` | `/api/v1/status` | Estado detalhado da central local |
| `GET` | `/api/v1/devices` | Lista de câmeras e sensores |
| `GET` | `/api/v1/outbox?cursor=...` | Lê lote pendente para a central |
| `POST` | `/api/v1/outbox/reserve` | Reserva itens para processamento central |
| `POST` | `/api/v1/outbox/ack` | Confirma processamento e permite descarte |
| `POST` | `/api/v1/config/apply` | Aplica configuração assinada |
| `GET` | `/api/v1/evidence/{id}` | Entrega evidência autorizada |
| `POST` | `/api/v1/events/urgent` | Canal excepcional para evento crítico |

A API não deve devolver todos os arquivos sem paginação. O lote deve ser limitado por quantidade e tamanho, usando cursor ou sequência monotônica. A central deve confirmar cada lote; se a conexão cair, o local deve manter o item pendente ou retornar ao estado disponível após um timeout de reserva.

---

## 6. Vision Platform Central

### 6.1 Objetivo

A Vision Platform Central será o núcleo técnico de processamento. Ela deve receber dados de várias Vision Platforms Locais, manter um catálogo unificado, distribuir configurações, executar modelos de maior custo, correlacionar eventos e entregar ao GeoFissura somente os registros necessários para o negócio.

A central não substitui o GeoFissura. Ela funciona como uma camada especializada de visão computacional e integração. O GeoFissura continua sendo a fonte de verdade para clientes, edificações, sensores comerciais, usuários, permissões, planos, notificações e relatórios.

### 6.2 Componentes sugeridos

| Componente | Responsabilidade |
|---|---|
| `central-api` | API para locais, administração técnica e GeoFissura |
| `poller` | Consulta periódica dos locais, com limites por unidade |
| `scheduler` | Agenda coletas, reprocessamentos e tarefas de manutenção |
| `ingest-worker` | Valida, deduplica e persiste lotes recebidos |
| `vision-worker` | Executa modelos de visão computacional e gera eventos |
| `correlation-worker` | Agrupa eventos, rastreia entidades e elimina duplicidades |
| `geo-sync-worker` | Converte eventos aprovados em contratos do GeoFissura |
| `evidence-store` | Armazena evidências e produz links controlados |
| `model-registry` | Versiona modelos, pesos, parâmetros e compatibilidade |
| `central-db` | Catálogo, eventos, jobs, estado e auditoria |
| `observability` | Logs, métricas, filas, latência e falhas |

A central pode começar como um único serviço modular e ser dividida em workers quando o volume crescer. O importante é separar conceitualmente a coleta, o processamento e a integração para permitir retentativas independentes.

### 6.3 Polling e sincronização

O `poller` deve manter uma agenda por local. Cada unidade terá um intervalo de coleta, tamanho máximo de lote, limite de bytes, janela de evidências e política de retry.

```text
Para cada local ativo:
    verificar se existe coleta em andamento
    consultar /health ou /api/v1/status
    obter lote por cursor
    validar assinatura e schema
    registrar itens recebidos com idempotência
    confirmar somente após persistência central
    enfileirar imagens e eventos para processamento
    avançar cursor somente após confirmação
```

O polling deve usar backoff exponencial em falhas, mas sem perder a prioridade de locais com eventos críticos. Uma unidade offline não deve bloquear as demais. A central deve registrar `last_seen_at`, `last_success_at`, `last_error_at`, quantidade pendente e idade do item mais antigo.

### 6.4 Processamento de visão

Os dados devem ser separados em três categorias:

| Categoria | Tratamento |
|---|---|
| **Telemetria** | Persistida e agregada; normalmente enviada ao GeoFissura como leitura |
| **Evento** | Processado por regras e modelos; pode gerar alerta ou histórico |
| **Evidência** | Armazenada com hash, metadados e política de retenção; vinculada ao evento |

O evento precisa registrar `model_id`, `model_version`, `confidence`, `observed_at`, `source_uuid`, `local_id`, `central_id`, classe detectada, localização opcional e evidência associada. Isso permite reprocessar um evento quando o modelo evoluir sem perder o contexto original.

---

## 7. Integração com o GeoFissura

### 7.1 Compatibilidade com os contratos atuais

A integração inicial deve preservar os endpoints já existentes no GeoFissura:

| Endpoint atual | Uso na arquitetura integrada |
|---|---|
| `GET /api/sensores/sincronizar` | A central ou um adaptador local obtém o catálogo de sensores ativos |
| `GET /api/sensores/resolver?uuid=...` | Validação auxiliar de identidade do sensor |
| `POST /api/sync` | Envio de leituras IoT ou métricas de visão que tenham modelo de leitura |
| `POST /api/alertas` | Envio imediato de eventos críticos convertidos em alertas de negócio |

O GeoFissura atualmente valida `x-api-key` e, no endpoint de sincronização, resolve os sensores ativos pelo UUID antes de inserir as leituras.[2] Portanto, a central deve enviar `sensor_uuid` estável e não depender de IDs internos locais.

### 7.2 Fluxo recomendado para sensores

Há duas possibilidades. Na primeira, a Vision Platform Central envia diretamente ao GeoFissura. Na segunda, a central local continua enviando diretamente ao GeoFissura, enquanto a Vision Platform Central recebe apenas dados de visão. Para evitar dois caminhos concorrentes e simplificar observabilidade, recomenda-se a primeira opção: **Local → Central → GeoFissura**.

O gateway MQTT e a fila local continuam existindo, mas o destino final do lote passa a ser a central. A central faz a validação, deduplicação e consolidação antes de chamar `/api/sync`.

### 7.3 Extensão para eventos de visão

Para o primeiro MVP, eventos de visão podem ser enviados como alertas usando `POST /api/alertas`, quando houver uma condição de negócio clara. Para histórico rico, recomenda-se criar uma API específica no GeoFissura, sem sobrecarregar o contrato de leituras:

```http
POST /api/vision/events
x-api-key: <credencial-do-servico>
Content-Type: application/json
```

```json
{
  "event_id": "central-01-local-03-000000812",
  "source_uuid": "CAM-LOCAL-03-001",
  "sensor_uuid": null,
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

A extensão deve ser adicionada somente quando o caso de uso estiver validado. O MVP pode reutilizar `/api/alertas`, mas a documentação de domínio deve diferenciar `leitura`, `evento de visão`, `alerta` e `evidência`.

### 7.4 Mapeamento de identidades

| Identidade | Dono | Exemplo |
|---|---|---|
| `clienteId` | GeoFissura | `12` |
| `edificacaoId` | GeoFissura | `3` |
| `sensor_uuid` | Dispositivo/GeoFissura | `GF-000001` |
| `local_uuid` | Vision Platform Local | `LOCAL-001` |
| `camera_uuid` | Vision Platform Local | `CAM-LOCAL-001-01` |
| `event_id` | Vision Platform Central | UUID ou sequência global |
| `evidence_id` | Vision Platform Central | Identificador do objeto armazenado |

Nunca se deve usar o ID autoincremental do banco local como chave de integração. A chave precisa sobreviver a restauração de backup, reinstalação e migração de banco.

---

## 8. Rede, segurança e operação

A comunicação da central para os locais deve preferir VPN, WireGuard, túnel privado ou conexão iniciada pelo local para um endpoint central. A abertura direta de portas públicas em cada Orange Pi deve ser evitada. O repositório local já contempla WireGuard, nftables, SSH e parâmetros de portas; a nova aplicação deve seguir esse padrão e manter serviços de diagnóstico restritos à LAN ou à VPN.[1]

Toda comunicação entre central e local deve usar TLS quando atravessar rede não confiável. Além disso, cada local deve possuir uma credencial própria, com escopo limitado e possibilidade de revogação. A mesma chave não deve ser compartilhada por todas as centrais.

| Controle | Recomendação |
|---|---|
| Identidade | `local_uuid` único por instalação |
| Autenticação | API key por local no MVP; mTLS ou tokens rotativos na evolução |
| Integridade | Assinatura ou HMAC por lote |
| Replay | `batch_id`, nonce ou timestamp com janela de validade |
| Autorização | A central só consulta o local associado à sua credencial |
| Segredos | `.env` fora do Git; nunca registrar senha ou token em log |
| Rede | VPN ou conexão de saída; evitar exposição direta |
| Auditoria | Registrar quem alterou configuração, modelo ou regra |
| Evidências | URLs temporárias, controle de acesso e hash |

O `GATEWAY_API_KEY` existente deve permanecer compatível com o GeoFissura, mas a arquitetura central deve separar as credenciais: `CENTRAL_TO_GEOFISSURA_KEY`, `CENTRAL_TO_LOCAL_KEY` e, futuramente, chaves por cliente ou por instalação.

---

## 9. Disponibilidade, filas e idempotência

A operação deve ser orientada a eventos e filas, não a chamadas síncronas longas. Cada etapa precisa poder falhar e ser repetida sem duplicar dados.

| Estado | Descrição |
|---|---|
| `PENDING` | Item aguardando coleta ou processamento |
| `RESERVED` | Item reservado por um worker com prazo de expiração |
| `PROCESSING` | Item em processamento de modelo |
| `READY_TO_SYNC` | Resultado pronto para o GeoFissura |
| `SYNCING` | Envio ao GeoFissura em andamento |
| `SYNCED` | Confirmado pelo destino |
| `FAILED_RETRYABLE` | Falha temporária, com nova tentativa prevista |
| `FAILED_FINAL` | Falha permanente, aguardando intervenção |

A central deve usar uma chave idempotente no envio ao GeoFissura. Como o endpoint atual `/api/sync` insere leituras sem um `event_id` explícito, a extensão recomendada é adicionar uma chave de origem ou uma tabela de deduplicação no GeoFissura antes de operar com múltiplos reprocessamentos. Sem isso, uma falha após a inserção e antes da confirmação pode gerar leituras duplicadas.

---

## 10. Observabilidade e manutenção

A Vision Platform Local deve expor, no mínimo, CPU, memória, espaço em disco, temperatura quando disponível, estado do PostgreSQL, estado do MQTT, número de câmeras conectadas, último frame, tamanho da fila e idade do evento mais antigo. A central deve acompanhar esses mesmos indicadores por local, além de tempo de polling, taxa de sucesso, latência de inferência, tamanho das filas e erros de integração com o GeoFissura.

O dashboard operacional da central pode existir separado do dashboard comercial do GeoFissura. O primeiro é destinado à equipe técnica; o segundo é destinado ao cliente e aos usuários da plataforma.

A central Orange Pi já possui backup diário às 02:00, retenção local de sete dias e cópia para Google Drive usando `rclone`.[1] Essa política deve ser ampliada para incluir a configuração da Vision Platform Local, o banco local, o catálogo de dispositivos, a fila e os metadados de eventos. Imagens temporárias não devem ser incluídas indiscriminadamente no backup; devem seguir uma política própria de retenção e tamanho.

---

## 11. Implantação por fases

### Fase 1 — Consolidar a base atual

Manter o GeoFissura como está, preservando cadastro, sensores, leituras, alertas, autenticação e multi-tenancy. Criar o projeto da Vision Platform Local a partir do padrão Orange Pi existente, sem alterar ainda o funcionamento do GeoFissura.

### Fase 2 — Transformar o gateway local em Vision Platform Local

Implementar `mqtt-ingest`, `local-store`, `outbox`, `health-api` e o cadastro de `local_uuid`. Primeiro integrar apenas os sensores ESP32 e a fila local já prevista na arquitetura do GeoFissura. Depois adicionar a captura de uma câmera e o armazenamento de uma evidência simples.

### Fase 3 — Criar a Vision Platform Central

Implementar a API central, o catálogo de locais, o `poller`, a reserva de lotes, a persistência idempotente e o painel técnico. Nesta etapa, a central pode apenas coletar e encaminhar dados ao GeoFissura, sem executar modelos pesados.

### Fase 4 — Adicionar processamento central de visão

Adicionar workers de inferência, registro de modelos, evidências, eventos e reprocessamento. O primeiro módulo deve ser pequeno e mensurável, como detecção de presença, contagem ou validação de EPI em uma câmera.

### Fase 5 — Evoluir os contratos do GeoFissura

Adicionar endpoints próprios para eventos de visão e evidências, mantendo `/api/sync` para leituras IoT. Associar eventos a cliente, edificação, câmera, módulo, severidade e evidência. Criar deduplicação e auditoria no banco central.

### Fase 6 — Operação multi-local

Provisionar novas unidades com o repositório da central, gerar identidade única, testar conectividade, validar backup, registrar o local na Vision Platform Central e executar um teste completo de ponta a ponta.

---

## 12. Critérios de aceite do MVP

O MVP será considerado tecnicamente válido quando uma unidade local puder continuar recebendo sensores e câmeras sem internet, armazenar os dados localmente, recuperar a conexão, ser consultada pela Vision Platform Central, entregar lotes sem duplicidade e produzir no GeoFissura o histórico correto associado ao cliente e à edificação.

Também deve ser possível desligar temporariamente a central, manter a fila no local, religar a central e processar os dados pendentes. Um evento crítico precisa possuir caminho de entrega mais rápido que o ciclo periódico, e a equipe deve conseguir diagnosticar local, câmera, fila, central e integração por health checks e logs.

| Critério | Resultado esperado |
|---|---|
| Perda de internet no local | Captura e armazenamento local continuam funcionando |
| Perda da central | O local acumula itens pendentes sem descartá-los |
| Reprocessamento | Não duplica leituras ou eventos |
| Câmera indisponível | Estado e erro aparecem no diagnóstico |
| Central atrasada | As filas mostram idade e quantidade pendente |
| GeoFissura indisponível | A central mantém fila de integração e tenta novamente |
| Alerta crítico | Possui rota imediata ou SLA definido |
| Restauração | Backup permite recuperar banco e configuração local |
| Segurança | Credenciais não ficam no repositório nem em logs |

---

## 13. Decisões recomendadas

A recomendação é adotar uma arquitetura **Local → Central → GeoFissura**, mantendo o GeoFissura como produto SaaS e sistema de negócio. A Vision Platform Local deve ser construída sobre o padrão de instalação da Orange Pi, mas com foco em aquisição, buffer, pré-processamento e disponibilidade. A Vision Platform Central deve concentrar o processamento de maior custo, a coordenação de múltiplas unidades, a observabilidade e a preparação dos dados para o GeoFissura.

O primeiro desenvolvimento não deve tentar criar todos os módulos de visão. O caminho de menor risco é validar a cadeia completa com um sensor e uma câmera: capturar localmente, armazenar, coletar periodicamente, processar centralmente, enviar ao GeoFissura e exibir o resultado no dashboard. Depois disso, os módulos de EPI, fissuras, qualidade, pessoas, veículos ou estoque poderão compartilhar a mesma infraestrutura.

> **Resumo executivo:** o Orange Pi é o agente local; a Vision Platform Central é o cérebro computacional; o GeoFissura é o sistema de gestão, relacionamento, alertas e histórico do produto.

---

## 14. Estratégia de desenvolvimento em repositórios separados

O GeoFissura deve permanecer em seu próprio repositório como produto SaaS e sistema de negócio. As plataformas de visão devem ser desenvolvidas separadamente, conectadas por APIs e contratos versionados. Essa separação evita transformar o GeoFissura em um monólito que também precise conhecer Orange Pi, RTSP, MQTT, OpenCV e modelos de IA.

### 14.1 Repositórios recomendados

| Repositório | Responsabilidade | Tecnologia sugerida |
|---|---|---|
| `geofissura` | SaaS, usuários, clientes, edificações, sensores, dashboards, alertas, relatórios e regras de negócio | Next.js, TypeScript, Drizzle e PostgreSQL/Neon |
| `vision-platform-local` | Execução na unidade local: câmeras, RTSP, MQTT, buffer offline, pré-processamento e fila | **Python**, PostgreSQL local, Docker ou systemd |
| `vision-platform-central` | Coleta periódica dos locais, processamento pesado, correlação, modelos de IA, evidências e integração com o GeoFissura | **Python**, workers, PostgreSQL e Redis/RabbitMQ opcional |
| `vision-platform-contracts` | Contratos entre Local, Central e GeoFissura | OpenAPI, JSON Schema, exemplos e changelog |
| `vision-platform-infra` | Docker Compose, deploy, observabilidade e scripts de infraestrutura | Docker, Ansible ou Terraform conforme a necessidade |
| `vision-platform-docs` | Documentação geral, diagramas, decisões arquiteturais e manuais | Markdown |
| `config-server-geofissura-orange-pi-3-lts` | Sistema operacional, provisionamento, firewall, PostgreSQL, backup e serviços-base da central local | Shell, Armbian/Debian e serviços do sistema |

A dependência entre os produtos deve seguir uma única direção:

```text
Vision Platform Local → Vision Platform Central → GeoFissura
```

O GeoFissura não deve importar código interno da Vision Platform Central ou Local. A comunicação deve ocorrer por API autenticada. Da mesma forma, a Central não deve acessar diretamente o banco do GeoFissura; deve utilizar seus endpoints oficiais.

### 14.2 Responsabilidade de cada repositório

O GeoFissura continua sendo a fonte de verdade para clientes, usuários, permissões, edificações, sensores comerciais, notificações e relatórios. A Vision Platform Central é a fonte de verdade para processamento de visão, modelos, eventos técnicos e evidências. A Vision Platform Local é a fonte temporária de verdade para os dados capturados enquanto eles ainda não foram sincronizados.

O repositório `config-server-geofissura-orange-pi-3-lts` deve permanecer separado do código da aplicação local. Ele configura a máquina; a `vision-platform-local` é a aplicação instalada sobre essa base. Assim, uma atualização do sistema operacional não precisa alterar o agente de visão, e uma atualização do agente não precisa reinstalar toda a central.

### 14.3 Organização do repositório `vision-platform-local`

```text
vision-platform-local/
├── apps/
│   └── edge-agent/
├── services/
│   ├── camera-ingest/
│   ├── mqtt-ingest/
│   ├── local-api/
│   └── sync-agent/
├── packages/
│   ├── domain/
│   └── contracts-client/
├── database/
│   ├── migrations/
│   └── schema.sql
├── deploy/
│   ├── docker-compose.yml
│   └── systemd/
├── scripts/
├── .env.example
└── README.md
```

Esse repositório deve conter a captura RTSP, a integração ONVIF quando aplicável, a recepção MQTT, o armazenamento local, o pré-processamento, a fila offline, a API local, os health checks e o agente que permite à Central coletar os lotes.

### 14.4 Organização do repositório `vision-platform-central`

```text
vision-platform-central/
├── apps/
│   ├── central-api/
│   └── central-worker/
├── services/
│   ├── local-poller/
│   ├── ingest-worker/
│   ├── vision-worker/
│   ├── correlation-worker/
│   └── geofissura-sync-worker/
├── packages/
│   ├── domain/
│   ├── contracts/
│   └── geofissura-client/
├── models/
│   ├── registry/
│   └── manifests/
├── database/
│   ├── migrations/
│   └── schema.sql
├── deploy/
│   ├── docker-compose.yml
│   └── production/
├── tests/
├── .env.example
└── README.md
```

A Central deve trabalhar com abstrações como `Local`, `Source`, `Observation`, `Event` e `Evidence`, sem conhecer detalhes específicos do hardware de cada unidade local.

### 14.5 Repositório de contratos

O repositório `vision-platform-contracts` deve ser o ponto comum de integração:

```text
vision-platform-contracts/
├── openapi/
│   ├── local-central.yaml
│   └── central-geofissura.yaml
├── schemas/
│   ├── observation.schema.json
│   ├── vision-event.schema.json
│   ├── evidence.schema.json
│   └── health.schema.json
├── examples/
├── changelog.md
├── compatibility.md
└── README.md
```

Ele deve conter schemas JSON, contratos OpenAPI, exemplos reais de payload, respostas de erro, códigos de status, regras de compatibilidade e histórico de versões. Não deve conter regras de negócio, credenciais ou implementação dos serviços.

### 14.6 Monorepo ou multirepo?

Para o ecossistema GeoFissura, a recomendação é utilizar **multirepo com contratos versionados**.

| Estratégia | Vantagens | Desvantagens | Avaliação |
|---|---|---|---|
| Um único monorepo | Alterações coordenadas e refatoração inicial mais simples | Mistura hardware, SaaS e IA; aumenta o acoplamento e dificulta deploy independente | Não recomendado para produção |
| Três repositórios sem contratos compartilhados | Independência entre equipes | Os contratos podem divergir e gerar integrações frágeis | Evitar |
| Multirepo com contratos versionados | Deploy independente, separação clara e integração controlada | Exige disciplina de versionamento | **Recomendado** |
| Repositório único para Local e Central | Permite compartilhar alguns componentes | Hardware local e servidor central possuem necessidades muito diferentes | Usar somente se a equipe e o ciclo de deploy forem os mesmos |

### 14.7 Versionamento e compatibilidade

Cada repositório deve possuir seu próprio ciclo de versão:

```text
geofissura              v0.8.0
vision-platform-local   v0.3.0
vision-platform-central v0.4.0
contracts               v1.2.0
```

As dependências de contrato devem ser declaradas explicitamente. Uma alteração incompatível deve criar uma nova versão de API, como `/api/v1` e `/api/v2`, mantendo a versão anterior durante o período de migração.

A sequência correta para uma alteração de integração é:

1. Alterar o contrato no repositório `vision-platform-contracts`.
2. Criar exemplos de payload e respostas de erro.
3. Atualizar a Vision Platform Central para consumir o novo contrato.
4. Atualizar o GeoFissura para aceitar o contrato sem quebrar a versão anterior.
5. Atualizar a Vision Platform Local se a alteração afetar a captura ou a entrega.
6. Executar testes de contrato entre os serviços.
7. Publicar os componentes compatíveis.
8. Atualizar a versão mínima suportada em cada README.

### 14.8 CI/CD independente

Cada repositório deve possuir seu próprio pipeline de integração e entrega contínuas.

| Repositório | Testes obrigatórios | Publicação |
|---|---|---|
| GeoFissura | Lint, TypeScript, migrations, testes de API e contratos | Vercel |
| Vision Platform Local | Ingestão, fila offline, MQTT, câmera simulada e compatibilidade ARM64 | Imagem Docker ou pacote para Orange Pi |
| Vision Platform Central | API, workers, idempotência, polling e processamento | Servidor central |
| Contracts | OpenAPI, JSON Schema e verificação de compatibilidade | Tag, pacote ou artefato versionado |
| Configuração local | Shellcheck, validação de `.env` e instalação em ambiente de teste | Instalação controlada nas centrais |

### 14.9 O que compartilhar e o que não compartilhar

Podem ser compartilhados schemas JSON, contratos OpenAPI, nomes de eventos, tipos gerados, clientes HTTP gerados, documentação de integração, exemplos de payload e ferramentas de teste de contrato.

Não devem ser compartilhados diretamente o banco do GeoFissura, modelos de IA dentro do GeoFissura, drivers de câmera dentro da Central, credenciais reais, migrations de bancos diferentes, arquivos `.env` ou regras internas de autenticação do SaaS.

### 14.10 Ordem prática de implementação

Como o GeoFissura já está em andamento, a evolução deve ocorrer sem uma grande refatoração inicial:

| Ordem | Repositório | Primeiro objetivo |
|---|---|---|
| 1 | `vision-platform-contracts` | Documentar `Observation`, `VisionEvent`, `Evidence`, `Health` e `Batch` |
| 2 | `vision-platform-local` | Reaproveitar a fila local do gateway e entregar dados por API |
| 3 | `vision-platform-central` | Consultar locais periodicamente, persistir e encaminhar dados |
| 4 | `geofissura` | Manter `/api/sync` e `/api/alertas`; depois adicionar `/api/vision/events` |
| 5 | `config-server-geofissura-orange-pi-3-lts` | Instalar e supervisionar a aplicação local sem misturar seu código-fonte |

A primeira versão funcional deve validar somente este fluxo:

```text
ESP32 ou câmera
    ↓
Vision Platform Local
    ↓ lote periódico
Vision Platform Central
    ↓ API
GeoFissura
    ↓
Dashboard, histórico e alertas
```

## 15. Módulo de visão computacional para a etiqueta de fissura

### 15.1 Interpretação da etiqueta apresentada

A etiqueta apresentada deve ser tratada como um **alvo físico de medição**, e não apenas como uma imagem de identificação. Ela possui uma região central que será seccionada exatamente sobre a fissura, duas retas diagonais que se cruzam em um ponto de referência e seis marcadores circulares organizados em dois grupos de três.

A imagem mostra, de forma esquemática, os seguintes elementos:

| Elemento | Interpretação operacional |
|---|---|
| Faixa central azul | Região que representa a fissura e o local onde o selo será seccionado |
| Corte central | Descontinuidade que permite que os dois lados do selo acompanhem movimentos diferentes da estrutura |
| Três círculos à esquerda | Marcadores fiduciais do lado esquerdo da fissura |
| Três círculos à direita | Marcadores fiduciais do lado direito da fissura |
| Anel verde | Área externa do marcador, usada para localizar o centro e validar a detecção |
| Núcleo vermelho | Centro de referência do marcador, preferencialmente usado como ponto medido |
| Duas retas diagonais | Referências geométricas para orientação, eixos, rotação e localização do ponto de encontro |
| Ponto de encontro das retas | Origem geométrica ou ponto de referência para interpolar o deslocamento no centro da fissura |
| Círculo externo | Região visual de inspeção e contexto do selo; não deve ser usado como escala sem calibração |
| Campos de data, ocorrência, selo e instalação | Metadados visuais e administrativos, úteis para OCR e validação, mas não para a medição geométrica |

Os seis círculos devem receber uma identificação fixa. A convenção recomendada é `L1`, `L2`, `L3` para a coluna esquerda, de cima para baixo, e `R1`, `R2`, `R3` para a coluna direita, também de cima para baixo.

```text
                 lado esquerdo       fissura       lado direito
                     L1                              R1
                     L2              O               R2
                     L3                              R3

O = ponto de encontro das retas ou origem geométrica estimada
```

A etiqueta representa um **sistema de pontos de controle**. A câmera deverá acompanhar a alteração relativa entre os pontos da esquerda e os pontos da direita ao longo do tempo.

### 15.2 Limitação essencial: deslocamento não é tração

A câmera consegue medir deslocamento, abertura, fechamento, cisalhamento, rotação e evolução temporal da geometria. Ela não mede diretamente força ou tração apenas observando a etiqueta.

Para transformar deslocamento em força, tensão ou tração, é necessário possuir um modelo mecânico calibrado, com pelo menos a rigidez ou a relação experimental entre deslocamento e força do selo, do substrato e da região monitorada. Sem essa calibração, o sistema deve registrar o resultado como **deslocamento relativo** ou **proxy de abertura**, nunca como força absoluta.

> **Regra de engenharia:** a visão computacional mede a cinemática da etiqueta. A inferência de tração exige uma segunda camada de calibração estrutural ou um sensor físico complementar, como célula de carga, extensômetro ou modelo validado em laboratório.

### 15.3 Dados necessários para calibração

A imagem fornecida é um desenho da etiqueta e não informa a escala física real, a distância entre centros, o diâmetro dos círculos, a espessura do corte ou a distância câmera-alvo. Portanto, não é possível calcular milímetros de forma confiável apenas a partir dessa imagem.

Para cada modelo de selo, deve existir um arquivo de calibração imutável contendo:

| Parâmetro | Descrição |
|---|---|
| `label_model_id` | Identificador do modelo físico da etiqueta |
| `physical_width_mm` | Largura física conhecida do selo |
| `physical_height_mm` | Altura física conhecida do selo |
| `marker_diameter_mm` | Diâmetro nominal do anel ou núcleo |
| `marker_centers_mm` | Coordenadas nominais dos seis centros no sistema da etiqueta |
| `nominal_pairs` | Pares correspondentes `L1-R1`, `L2-R2`, `L3-R3` |
| `crack_axis` | Direção nominal da fissura no sistema da etiqueta |
| `origin_mm` | Coordenada nominal do ponto de encontro das retas |
| `scale_tolerance` | Tolerância permitida para a escala detectada |
| `cut_geometry` | Forma e largura esperada do corte central |
| `revision` | Revisão física do modelo da etiqueta |

A escala deve ser obtida por uma dimensão física conhecida. As alternativas são usar a distância nominal entre marcadores, a largura/altura da etiqueta, um marcador de escala adicional ou uma calibração de câmera com alvo conhecido. A distância entre círculos só pode ser usada como escala se ela tiver sido medida e registrada no modelo físico.

### 15.4 Sistema de coordenadas

A medição deve ocorrer em um sistema de coordenadas local da etiqueta, e não diretamente nos pixels da câmera.

Defina:

- `u`: eixo normal à fissura, positivo no sentido do lado esquerdo para o lado direito;
- `v`: eixo tangencial à fissura, positivo de baixo para cima ou conforme a orientação cadastrada;
- `O`: ponto de encontro das retas, usado como origem;
- `n`: vetor unitário normal à fissura;
- `t`: vetor unitário tangencial à fissura;
- `pLi` e `pRi`: centros dos marcadores correspondentes no instante da medição;
- `pLi0` e `pRi0`: centros dos mesmos marcadores na instalação de referência.

Antes de medir, a imagem deve ser corrigida por calibração de lente e retificada por transformação de perspectiva. A calibração de câmera e a transformação projetiva são operações padrão em visão computacional e devem ser aplicadas antes da conversão de pixels para coordenadas físicas.

### 15.5 Detecção dos seis círculos

A detecção deve usar uma estratégia em camadas, pois a etiqueta poderá sofrer iluminação variável, poeira, reflexo, desbotamento, inclinação e oclusão parcial.

1. Localizar a região provável do selo por cor, contorno, modelo visual ou posição cadastrada.
2. Corrigir distorção radial e tangencial da câmera.
3. Retificar a perspectiva da etiqueta para uma vista frontal.
4. Segmentar o anel verde e o núcleo vermelho em HSV ou espaço de cor equivalente.
5. Detectar contornos circulares e estimar centro, raio e circularidade.
6. Usar detecção de círculos como segunda hipótese quando a segmentação por cor falhar. O método `HoughCircles` é uma alternativa documentada para localizar círculos em imagens, mas seus parâmetros devem ser calibrados para a resolução e distância reais.
7. Agrupar os candidatos em duas colunas e três linhas.
8. Associar os candidatos aos IDs `L1` a `L3` e `R1` a `R3`.
9. Rejeitar a imagem se a geometria encontrada for incompatível com o modelo cadastrado.

O centro preferencial do marcador deve ser calculado por ajuste geométrico do anel e do núcleo, e não pelo centro da caixa delimitadora. O sistema deve guardar também o raio estimado, a circularidade, a confiança, a área segmentada e a distância entre o centro verde e o centro vermelho.

```json
{
  "marker_id": "L2",
  "center_px": {"x": 412.8, "y": 356.2},
  "center_label_mm": {"u": -18.42, "v": 3.08},
  "radius_px": 14.7,
  "green_score": 0.96,
  "red_score": 0.94,
  "circularity": 0.91,
  "confidence": 0.95
}
```

### 15.6 Validação da geometria dos seis marcadores

A presença dos seis círculos não é suficiente. Eles precisam estar coerentes entre si. A plataforma deve validar:

| Validação | O que verifica |
|---|---|
| Quantidade | Existem seis marcadores detectados |
| Identidade | Cada marcador está associado ao ID correto |
| Ordenação | As colunas e linhas estão na ordem esperada |
| Distância | Distâncias entre marcadores estão dentro da tolerância |
| Colinearidade | Cada coluna mantém a geometria nominal esperada |
| Simetria | Relação entre os lados não está excessivamente deformada |
| Raio | O tamanho aparente dos círculos é consistente |
| Cor | Verde e vermelho possuem confiança suficiente |
| Perspectiva | A transformação não exige extrapolação excessiva |
| Estabilidade | O resultado não oscila de forma incompatível entre frames |

Os seis marcadores formam uma configuração redundante. Se um marcador estiver parcialmente coberto, a plataforma pode estimar sua posição, mas não deve produzir uma medição de alta confiabilidade sem pelo menos quatro pontos válidos e sem registrar a degradação da qualidade.

### 15.7 Retificação e transformação da etiqueta

A câmera observará a etiqueta em perspectiva. A Vision Platform Local deve estimar uma transformação projetiva `H` para converter os pontos observados no plano da etiqueta para uma vista retificada.

```text
ponto_pixel → correção de lente → homografia H → ponto no plano da etiqueta → escala física
```

A homografia deve ser calculada usando os centros detectados e suas coordenadas nominais, ou usando pontos de referência externos da etiqueta quando definidos no modelo. Após a retificação, os seis centros devem ser comparados com suas posições nominais. Um erro de reprojeção elevado indica que a imagem não está adequada para medição.

A plataforma deve armazenar:

- matriz de calibração da câmera;
- coeficientes de distorção;
- matriz de homografia;
- erro médio e máximo de reprojeção;
- resolução usada na calibração;
- distância focal estimada;
- data e versão da calibração;
- posição e orientação esperadas da câmera.

### 15.8 Medição de abertura ou separação

Para cada par correspondente, calcule o vetor relativo:

```text
d_i = pRi - pLi
```

onde `i` pertence a `{1, 2, 3}`. O deslocamento relativo em relação à instalação é:

```text
Δd_i = (pRi - pLi) - (pRi0 - pLi0)
```

A abertura normal à fissura é:

```text
opening_i = Δd_i · n
```

O deslocamento tangencial ou cisalhamento relativo é:

```text
shear_i = Δd_i · t
```

O sistema deverá produzir a abertura de cada par, a média, a mediana, o desvio entre os três pares e a abertura estimada no ponto de encontro `O`.

```json
{
  "pairs": [
    {"pair_id": "L1-R1", "opening_mm": 0.82, "shear_mm": 0.04},
    {"pair_id": "L2-R2", "opening_mm": 0.89, "shear_mm": 0.02},
    {"pair_id": "L3-R3", "opening_mm": 0.85, "shear_mm": -0.01}
  ],
  "opening_mean_mm": 0.853,
  "opening_median_mm": 0.85,
  "opening_std_mm": 0.035,
  "shear_mean_mm": 0.017,
  "quality": "good"
}
```

A abertura positiva deve significar separação, e a abertura negativa deve significar fechamento, desde que essa convenção seja mantida em todo o sistema. A orientação do vetor normal deve ser cadastrada no modelo da etiqueta e não inferida de forma diferente a cada frame.

### 15.9 Medição de deslocamento, rotação e distorção

Os três pares permitem medir mais do que uma abertura média. Eles permitem observar se a fissura abre de modo uniforme ou se há rotação e cisalhamento.

Para os deslocamentos `opening_1`, `opening_2` e `opening_3`, calcule uma regressão ao longo do eixo `v`:

```text
opening(v) = a + b·v
```

O termo `a` representa a abertura estimada na origem ou no ponto de referência. O coeficiente `b` representa a variação da abertura ao longo da altura do selo. Um valor elevado de `b` indica abertura não uniforme, rotação local ou deformação diferencial.

Indicadores recomendados:

| Indicador | Cálculo ou interpretação |
|---|---|
| Abertura no topo | `opening_1` |
| Abertura no centro | `opening_2` ou interpolação no `O` |
| Abertura na base | `opening_3` |
| Abertura média | Média robusta dos três pares |
| Gradiente vertical | Inclinação da regressão `opening(v)` |
| Cisalhamento médio | Média de `shear_i` |
| Assimetria | Diferença entre abertura máxima e mínima |
| Rotação relativa | Mudança angular das retas ou da configuração dos marcadores |
| Alongamento | Variação de distâncias internas de cada grupo de três pontos |
| Compressão | Redução das distâncias relativas em relação à referência |
| Erro de rigidez aparente | Diferença entre o deslocamento observado e o modelo calibrado |

O ponto de encontro das retas deve ser detectado por interseção de duas linhas ajustadas aos segmentos diagonais. Se as retas estiverem parcialmente ocultas ou não forem impressas no selo final, o sistema deve usar a origem geométrica cadastrada e estimá-la por homografia.

### 15.10 Tração, tensão e separação

O sistema deve separar claramente três níveis de resultado:

| Nível | Resultado | Pode ser obtido apenas com a câmera? |
|---|---|---|
| Cinemático | Deslocamento, abertura, fechamento, cisalhamento, rotação e velocidade | Sim, com calibração adequada |
| Deformacional | Alongamento, gradiente e deformação relativa do conjunto | Sim, com referência geométrica e hipótese de plano |
| Mecânico | Força, tração, tensão e risco estrutural | Não diretamente; exige modelo, material, geometria e calibração |

Uma conversão experimental poderá ser configurada futuramente:

```text
força_estimada = f(abertura_mm, temperatura, material, geometria, condição_de_contorno)
```

Essa função deve ser identificada por ensaios controlados e armazenada como uma versão de modelo. A Vision Platform Central poderá aplicar essa função, mas o GeoFissura deverá exibir o resultado como **estimativa modelada**, com versão, incerteza e aviso de que não se trata de uma medição direta de força.

### 15.11 Série temporal

Cada observação deve ser comparada com a instalação de referência e com a observação anterior. A Central deverá calcular:

- abertura absoluta e variação desde a instalação;
- variação desde a última leitura;
- velocidade de abertura em mm/dia ou mm/h;
- aceleração da abertura quando houver frequência suficiente;
- tendência por regressão robusta;
- comportamento cíclico ou sazonal;
- correlação com temperatura, umidade, chuva ou outras leituras disponíveis;
- períodos sem observação e qualidade da série;
- mudança permanente depois de um ciclo de expansão e retração.

A plataforma não deve gerar alerta somente por uma imagem isolada. O alerta deve considerar qualidade, repetição, magnitude, velocidade, persistência e contexto.

### 15.12 Responsabilidades da Vision Platform Local

A Local deve executar operações próximas da câmera e com baixa latência:

| Operação | Local |
|---|---|
| Captura de frame | Executa |
| Verificação de foco, exposição e iluminação | Executa |
| Correção inicial de lente | Executa com parâmetros cadastrados |
| Detecção dos seis círculos | Executa |
| Identificação da etiqueta | Executa |
| Estimativa de homografia | Executa ou usa matriz pré-calibrada |
| Medição preliminar em pixels e milímetros | Executa quando houver calibração local |
| Cálculo de qualidade | Executa |
| Compressão e armazenamento de evidência | Executa |
| Fila offline | Executa |
| Decisão final de risco estrutural | Não deve executar |
| Reprocessamento com modelo pesado | Não como regra |

A Local deve enviar para a Central a imagem original ou recortada, os centros detectados, a homografia, os indicadores preliminares, a qualidade, o timestamp, a temperatura da câmera e a versão dos algoritmos usados.

### 15.13 Responsabilidades da Vision Platform Central

A Central deve concentrar as operações que exigem consistência temporal, maior processamento e visão do conjunto:

| Operação | Central |
|---|---|
| Reprocessar imagens com maior resolução | Executa |
| Resolver ambiguidades entre círculos | Executa |
| Comparar com a instalação de referência | Executa |
| Calcular abertura, shear e rotação consolidados | Executa |
| Ajustar séries temporais | Executa |
| Correlacionar com sensores ambientais | Executa |
| Aplicar modelo de força ou tração calibrado | Executa, quando existir |
| Versionar modelos e calibrações | Executa |
| Detectar tendência e persistência | Executa |
| Emitir evento técnico | Executa |
| Converter evento em alerta de negócio | Encaminha ao GeoFissura |
| Manter histórico completo | Executa |
| Exibir o resultado ao cliente | GeoFissura |

### 15.14 Contrato de observação da etiqueta

A mensagem entre Local e Central deve conter dados suficientes para reprocessamento, mas não deve obrigar a Central a confiar cegamente no resultado local.

```json
{
  "observation_id": "obs_01J...",
  "local_id": "LOCAL-001",
  "camera_id": "CAM-001",
  "seal_id": "SELO-000123",
  "label_model_id": "geofissura-seal-v1",
  "captured_at": "2026-08-17T20:00:00Z",
  "image": {
    "uri": "local://evidence/2026/08/17/obs_01J.jpg",
    "sha256": "...",
    "width": 1920,
    "height": 1080
  },
  "markers": [
    {"id": "L1", "x_px": 402.1, "y_px": 231.8, "confidence": 0.98},
    {"id": "L2", "x_px": 399.4, "y_px": 354.2, "confidence": 0.96},
    {"id": "L3", "x_px": 401.8, "y_px": 478.5, "confidence": 0.97},
    {"id": "R1", "x_px": 611.9, "y_px": 232.6, "confidence": 0.97},
    {"id": "R2", "x_px": 615.2, "y_px": 355.0, "confidence": 0.95},
    {"id": "R3", "x_px": 613.7, "y_px": 479.1, "confidence": 0.96}
  ],
  "geometry": {
    "intersection_x_px": 508.5,
    "intersection_y_px": 355.1,
    "homography_version": "h-2026-08-01-01",
    "reprojection_error_px": 0.74
  },
  "preliminary_measurement": {
    "opening_mean_mm": 0.85,
    "shear_mean_mm": 0.02,
    "quality": "good"
  },
  "algorithm": {
    "detector": "seal-marker-detector",
    "version": "0.1.0"
  }
}
```

### 15.15 Qualidade e rejeição da medição

A plataforma deve preferir declarar `measurement_invalid` a produzir um número aparentemente preciso em uma imagem ruim. Uma observação deve ser rejeitada ou marcada como baixa confiança quando houver desfoque, reflexo intenso, saturação, sujeira, oclusão dos círculos, perda do corte central, perspectiva excessiva, erro de reprojeção alto, variação impossível entre frames ou ausência de escala válida.

Estados recomendados:

```text
VALID_HIGH_CONFIDENCE
VALID_LOW_CONFIDENCE
PARTIAL_MARKERS
CALIBRATION_REQUIRED
IMAGE_UNUSABLE
SEAL_NOT_FOUND
POSSIBLE_TAMPERING
```

O GeoFissura não deve criar um alerta estrutural automaticamente para estados `VALID_LOW_CONFIDENCE`, `PARTIAL_MARKERS` ou `POSSIBLE_TAMPERING` sem uma regra explícita. Esses estados devem aparecer como alertas de inspeção ou qualidade da medição.

### 15.16 Instalação e imagem de referência

No momento da instalação, a equipe deve registrar uma sequência de imagens, não apenas uma foto. A sequência deve conter diferentes exposições e, se possível, uma imagem frontal e imagens ligeiramente deslocadas para validar a calibração.

A instalação precisa registrar:

| Dado | Finalidade |
|---|---|
| `seal_id` | Identificação do selo físico |
| `occurrence_id` | Vínculo com a ocorrência no GeoFissura |
| `installation_at` | Início da série temporal |
| `label_model_id` | Geometria e escala física |
| `camera_id` | Origem das imagens |
| `reference_image_uri` | Imagem-base |
| `reference_markers` | Centros dos seis marcadores na instalação |
| `reference_homography` | Transformação inicial |
| `crack_axis` | Orientação do eixo normal |
| `operator` | Responsável pela instalação |
| `installation_quality` | Qualidade inicial |

Sem uma imagem de referência e uma escala física, o sistema poderá detectar alteração visual, mas não deverá declarar abertura em milímetros.

### 15.17 Critérios de aceite do módulo de fissuras

O módulo será considerado pronto para piloto quando conseguir detectar os seis marcadores em imagens controladas, identificar corretamente os pares, retificar a etiqueta, reproduzir a mesma medição em capturas repetidas e diferenciar deslocamento normal de cisalhamento.

| Critério | Resultado esperado |
|---|---|
| Detecção | Seis marcadores corretamente identificados em condições normais |
| Escala | Conversão para milímetros baseada em calibração física registrada |
| Perspectiva | Erro de reprojeção dentro do limite definido por modelo |
| Repetibilidade | Medições repetidas sem movimento estrutural permanecem dentro da incerteza |
| Abertura | Abertura positiva e fechamento negativo conforme convenção |
| Cisalhamento | Deslocamento tangencial separado do deslocamento normal |
| Robustez | Falhas de iluminação ou oclusão geram baixa confiança, não números falsos |
| Offline | A Local armazena a observação sem conectividade |
| Reprocessamento | A Central consegue recalcular com novo algoritmo |
| Histórico | O GeoFissura exibe a evolução temporal e os alertas derivados |

> **Conclusão técnica:** a etiqueta pode funcionar como um extensômetro visual de baixo custo para medir a cinemática relativa da fissura. Os seis círculos permitem redundância, verificação geométrica e estimativa de movimento diferencial; as retas e o ponto de encontro fornecem referência de orientação e origem. A arquitetura deve preservar a imagem, os pontos detectados, a calibração e a incerteza para que cada número possa ser auditado e reprocessado.

## 16. Primeiro marco de implementação: câmera Intelbras IP no Orange Pi

### 16.1 Objetivo imediato

Implementar o primeiro marco operacional da Vision Platform: fazer uma central local baseada em Orange Pi 3 LTS trabalhar com uma câmera de segurança Intelbras IP Full HD, capturando imagens de forma estável, registrando evidências e disponibilizando uma API local para a futura Vision Platform Central.

Neste marco, **não implementar ainda a medição final da fissura, tração ou abertura em milímetros**. O objetivo é validar a cadeia física e de software:

```text
Câmera Intelbras IP Full HD
        ↓ RTSP na rede local
Orange Pi 3 LTS
        ↓ captura, validação e armazenamento
Vision Platform Local
        ↓ API local versionada
Vision Platform Central — integração posterior
        ↓
GeoFissura — integração posterior
```

### 16.2 Contexto arquitetural

O trabalho deve respeitar três repositórios de aplicação e um repositório de infraestrutura:

| Repositório | Papel neste MVP |
|---|---|
| `config-server-geofissura-orange-pi-3-lts` | Configurar o Armbian/Debian, usuário, rede, firewall, PostgreSQL, backup e serviços-base do Orange Pi |
| `vision-platform-local` | Implementar conexão RTSP, captura de frames, validação da imagem, armazenamento local, health check e API |
| `vision-platform-central` | Preparar contratos e cliente futuro para coletar observações da unidade local; não precisa executar processamento pesado neste primeiro marco |
| `geofissura` | Não alterar o fluxo principal agora; apenas documentar o futuro contrato de integração |

Não misturar código de aplicação dentro do repositório de configuração do sistema. O repositório `config-server-geofissura-orange-pi-3-lts` instala e supervisiona a aplicação; o código da Vision Platform Local permanece em seu próprio repositório.

### 16.3 Câmera Intelbras

As câmeras iniciais serão câmeras de segurança **Intelbras IP com resolução Full HD**. A implementação deve ser orientada ao protocolo, e não a um único modelo, porque porta RTSP, caminho do stream, suporte ONVIF, codec, perfil e nomenclatura podem variar entre modelos.

O modelo exato da câmera deve ser configurável por ambiente ou pelo cadastro da câmera. Não fixar uma URL RTSP sem permitir alteração. O formato inicial mais comum a testar é semelhante a:

```text
rtsp://USUARIO:SENHA@IP:PORTA/cam/realmonitor?channel=1&subtype=0
```

O valor real da porta e do caminho deve ser confirmado no manual do modelo instalado e testado na rede local. O sistema deve aceitar pelo menos:

- URL RTSP completa configurável;
- host ou IP da câmera;
- porta RTSP;
- usuário;
- senha armazenada somente em segredo local;
- canal;
- perfil principal ou secundário;
- transporte TCP ou UDP;
- timeout de conexão;
- intervalo de reconexão;
- intervalo de captura;
- resolução esperada;
- FPS esperado.

O stream principal Full HD deve ser usado para a imagem destinada à medição da etiqueta quando houver capacidade suficiente. O stream secundário pode ser usado para monitoramento de disponibilidade ou pré-visualização, sem substituir a imagem de medição.

### 16.4 Requisitos do `vision-platform-local`

#### 16.4.1 Configuração

Criar `.env.example` sem credenciais reais:

```env
LOCAL_ID=LOCAL-001
LOCAL_NAME=Central Orange Pi 001
TIMEZONE=America/Sao_Paulo

CAMERA_ID=CAM-001
CAMERA_NAME=Camera fissura 001
CAMERA_RTSP_URL=rtsp://user:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
CAMERA_RTSP_TRANSPORT=tcp
CAMERA_CONNECT_TIMEOUT_MS=10000
CAMERA_RECONNECT_INTERVAL_MS=5000
CAMERA_CAPTURE_INTERVAL_MS=60000
CAMERA_CAPTURE_WIDTH=1920
CAMERA_CAPTURE_HEIGHT=1080
CAMERA_CAPTURE_JPEG_QUALITY=90

LOCAL_DATA_DIR=/var/lib/vision-platform-local
LOCAL_EVIDENCE_DIR=/var/lib/vision-platform-local/evidence
LOCAL_DB_URL=postgresql://...
LOCAL_API_HOST=0.0.0.0
LOCAL_API_PORT=8080
LOCAL_API_TOKEN=change-me
```

A senha da câmera não pode aparecer em logs, respostas HTTP, nomes de arquivos, mensagens de erro ou commits.

#### 16.4.2 Captura

Implementar um serviço de captura com as seguintes características:

- abrir o RTSP usando transporte configurável;
- reconectar automaticamente quando o stream cair;
- não travar o processo principal quando a câmera estiver indisponível;
- registrar o último frame válido;
- salvar timestamp UTC e timestamp local;
- salvar resolução real, FPS observado e codec quando disponível;
- gerar uma imagem JPEG somente nos intervalos configurados;
- permitir captura manual por endpoint de diagnóstico;
- limitar o uso de CPU e memória no Orange Pi;
- evitar manter vídeo contínuo em memória;
- fechar corretamente a conexão durante shutdown;
- registrar métricas de conexão, captura e falha.

A implementação deve funcionar com uma câmera simulada ou arquivo de vídeo durante os testes, sem exigir a câmera física no CI.

#### 16.4.3 Estrutura local mínima

```text
vision-platform-local/
├── src/
│   ├── camera/
│   │   ├── rtsp_client.py
│   │   ├── capture_worker.py
│   │   └── frame_validator.py
│   ├── api/
│   │   ├── health
│   │   ├── cameras
│   │   └── observations
│   ├── storage/
│   ├── config/
│   └── main
├── database/
│   └── migrations/
├── deploy/
│   ├── docker-compose.yml
│   └── systemd/
├── tests/
├── .env.example
└── README.md
```

A tecnologia deve ser Python, considerando o uso futuro de OpenCV e o funcionamento no ARM64 do Orange Pi. Documentar a instalação das dependências ARM64.

#### 16.4.4 Banco local

Criar uma persistência mínima para:

| Entidade | Campos principais |
|---|---|
| `local_devices` | `id`, `local_id`, `device_type`, `name`, `status`, `created_at` |
| `camera_streams` | `camera_id`, `rtsp_config_ref`, `resolution`, `fps`, `last_connected_at`, `last_error` |
| `image_observations` | `observation_id`, `camera_id`, `captured_at`, `file_path`, `sha256`, `width`, `height`, `status` |
| `delivery_queue` | `observation_id`, `status`, `attempts`, `next_attempt_at`, `last_error` |
| `health_samples` | `captured_at`, `cpu`, `memory`, `disk`, `temperature`, `camera_status` |

Usar `observation_id` idempotente. O mesmo frame não pode ser inserido duas vezes como observação diferente quando houver retry.

#### 16.4.5 API local

Implementar pelo menos:

```http
GET /health
GET /api/v1/status
GET /api/v1/cameras
GET /api/v1/cameras/{camera_id}/snapshot
GET /api/v1/observations?cursor=...
POST /api/v1/observations/{observation_id}/ack
```

Resposta mínima de `/health`:

```json
{
  "status": "ok",
  "local_id": "LOCAL-001",
  "service": "vision-platform-local",
  "camera": {
    "camera_id": "CAM-001",
    "status": "connected",
    "last_frame_at": "2026-08-17T22:00:00Z"
  },
  "storage": {
    "free_bytes": 123456789,
    "queue_pending": 4
  },
  "version": "0.1.0"
}
```

O endpoint de snapshot deve ser restrito à rede local ou exigir token. Nunca retornar a senha ou a URL RTSP completa.

#### 16.4.6 Validação visual inicial

Neste primeiro marco, a validação visual não precisa medir a fissura. Ela deve confirmar:

- imagem não está preta;
- imagem não está congelada;
- imagem possui resolução mínima;
- brilho médio não está abaixo do limite;
- imagem não está saturada;
- foco ou nitidez está acima de um limite inicial;
- a região cadastrada da etiqueta aparece no enquadramento;
- o frame possui timestamp e hash.

Criar um `image_quality_score` de 0 a 1 e registrar os componentes do score. Não descartar automaticamente imagens ruins; marcar o estado para que a Central possa auditar.

#### 16.4.7 Região de interesse da etiqueta

A primeira configuração pode usar uma região de interesse retangular cadastrada manualmente:

```json
{
  "camera_id": "CAM-001",
  "roi": {
    "x": 420,
    "y": 180,
    "width": 780,
    "height": 620
  },
  "expected_label_model": "geofissura-seal-v1"
}
```

A detecção automática dos seis círculos, a homografia e os cálculos de abertura entram no marco seguinte. Contudo, a captura deve salvar tanto a imagem completa quanto o recorte da ROI para que o módulo de visão seja desenvolvido sem alterar o pipeline de aquisição.

### 16.5 Requisitos do `vision-platform-central` neste primeiro marco

A Central deve preparar somente a integração necessária para receber observações, sem tentar executar IA pesada ainda.

Implementar:

- schema compartilhado para `ImageObservation`;
- cliente para consultar `/api/v1/observations`;
- persistência de metadados recebidos;
- verificação de hash;
- confirmação idempotente com `/ack`;
- status do local;
- registro de falhas de comunicação;
- teste de contrato com a API Local.

Exemplo de observação:

```json
{
  "observation_id": "obs_LOCAL-001_CAM-001_20260817T220000Z",
  "local_id": "LOCAL-001",
  "camera_id": "CAM-001",
  "captured_at": "2026-08-17T22:00:00Z",
  "image_uri": "local://evidence/2026/08/17/obs.jpg",
  "sha256": "...",
  "width": 1920,
  "height": 1080,
  "roi": {"x": 420, "y": 180, "width": 780, "height": 620},
  "quality": {
    "score": 0.93,
    "brightness": 0.61,
    "sharpness": 0.88,
    "frozen_frame": false
  },
  "algorithm_version": "capture-0.1.0"
}
```

### 16.6 Requisitos do `geofissura` neste primeiro marco

Não alterar o fluxo de sensores e alertas que já está em andamento. Apenas:

- documentar a futura origem `vision-platform-central`;
- reservar o namespace `/api/v1/vision` para eventos futuros;
- se necessário, criar um tipo de integração ou tabela futura sem bloquear o MVP local;
- não colocar código RTSP, OpenCV ou processamento de frames no GeoFissura.

### 16.7 Requisitos do repositório de configuração do Orange Pi

Adicionar ao repositório `config-server-geofissura-orange-pi-3-lts` somente o necessário para instalar e operar a aplicação:

- diretório padrão da aplicação;
- usuário e permissões;
- arquivo `.env` fora do Git;
- unidade `systemd` ou serviço Docker;
- criação do diretório de evidências;
- rotação de logs;
- health check;
- regra de firewall para a API local;
- inclusão da configuração no backup;
- documentação de atualização e rollback.

A aplicação deve iniciar automaticamente após reboot e reiniciar após falha, mas não deve entrar em loop agressivo quando a câmera estiver desligada.

### 16.8 Testes de aceite do primeiro marco

O marco será aprovado quando:

1. O Orange Pi conseguir acessar a câmera pela rede local.
2. A câmera puder ser cadastrada sem recompilar o software.
3. O serviço conectar ao RTSP e reconectar após interrupção.
4. O sistema capturar uma imagem Full HD válida no intervalo configurado.
5. O sistema gerar uma imagem completa e uma imagem da ROI.
6. O hash e o timestamp forem persistidos.
7. O `/health` informar corretamente o estado da câmera.
8. A API local entregar observações com cursor.
9. A Central conseguir coletar e confirmar uma observação.
10. Um retry não criar duplicidade.
11. Nenhuma senha aparecer nos logs, respostas ou repositórios.
12. O serviço funcionar no Orange Pi ARM64 com consumo documentado de CPU, RAM e armazenamento.
13. Uma câmera indisponível gerar estado de erro compreensível, sem derrubar a aplicação.
14. O GeoFissura permanecer funcionando sem alterações regressivas.

### 16.9 O que não implementar ainda

Não implementar no primeiro marco:

- medição final da fissura em milímetros;
- inferência de tração, força ou tensão;
- detecção completa dos seis círculos;
- cálculo de abertura e cisalhamento;
- treinamento de modelo de IA;
- streaming contínuo para a nuvem;
- armazenamento indefinido de vídeo;
- alteração estrutural ampla no GeoFissura;
- dependência de marca diferente da Intelbras antes da captura Intelbras funcionar.

### 16.10 Ordem recomendada de execução

```text
1. Confirmar modelo exato da câmera Intelbras e topologia de rede.
2. Testar RTSP manualmente no Orange Pi.
3. Criar captura simples de um frame.
4. Criar serviço persistente da Vision Platform Local.
5. Adicionar armazenamento, hash e health check.
6. Adicionar API local e cursor de observações.
7. Fazer a Vision Platform Central coletar e confirmar.
8. Validar reboot, perda de rede, perda da câmera e retry.
9. Só então iniciar a detecção dos seis círculos e a medição da etiqueta.
```

### 16.11 Instrução final

> Trabalhe nos três repositórios de aplicação de forma coordenada, mas mantenha as responsabilidades separadas. O primeiro objetivo não é desenvolver toda a Vision Platform: é provar que uma câmera Intelbras IP Full HD funciona de maneira confiável com um Orange Pi 3 LTS. Comece pela captura RTSP, armazenamento local, health check, API e teste de entrega. Não invente parâmetros específicos da câmera: torne-os configuráveis e registre o modelo exato que foi validado. Não coloque RTSP ou OpenCV no GeoFissura. Não declare medição de tração antes de existir calibração mecânica. Entregue primeiro um caminho operacional observável, reiniciável, testável e capaz de funcionar offline.

### Referências técnicas adicionais

[7]: https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html "OpenCV — Camera Calibration"

[8]: https://docs.opencv.org/4.x/da/d54/group__imgproc__transform.html "OpenCV — Geometric Image Transformations"

[9]: https://docs.opencv.org/4.12.0/da/d53/tutorial_py_houghcircles.html "OpenCV — Hough Circle Transform"

## Referências

[1]: https://github.com/devtiagoabreu/config-server-geofissura-orange-pi-3-lts "Configuração da Central de Processamento de Dados Local GeoFissura"

[2]: https://github.com/devtiagoabreu/geofissura "GeoFissura — plataforma SaaS para monitoramento de edificações"

[3]: https://github.com/devtiagoabreu/geofissura/blob/main/.agent/architecture.md "Arquitetura documentada do ecossistema GeoFissura"

[4]: https://github.com/devtiagoabreu/geofissura/blob/main/src/app/api/sync/route.ts "Implementação do endpoint de sincronização de leituras"

[5]: https://github.com/devtiagoabreu/geofissura/blob/main/src/app/api/sensores/sincronizar/route.ts "Implementação do endpoint de sincronização de sensores"

[6]: https://github.com/devtiagoabreu/geofissura/blob/main/src/lib/gateway-auth.ts "Implementação da autenticação do gateway"

[10]: https://github.com/devtiagoabreu/config-server-geofissura-orange-pi-3-lts "Configuração da central Orange Pi 3 LTS"

[11]: https://backend.intelbras.com/sites/default/files/2020-11/Manual_VIP_3230_SL_11-20_0.pdf "Manual oficial de câmera IP Intelbras — exemplo de modelo"
