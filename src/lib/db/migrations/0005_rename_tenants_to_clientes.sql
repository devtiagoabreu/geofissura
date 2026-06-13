-- Renomeia tabela tenants para clientes
ALTER TABLE IF EXISTS tenants RENAME TO clientes;

-- Renomeia colunas tenant_id para cliente_id em todas as tabelas
ALTER TABLE IF EXISTS usuarios             RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS edificacoes          RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS sensores             RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS leituras             RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS documentos           RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS notificacoes_config  RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS notificacoes_regras  RENAME COLUMN tenant_id TO cliente_id;
ALTER TABLE IF EXISTS notificacoes         RENAME COLUMN tenant_id TO cliente_id;

-- Renomeia índices
ALTER INDEX IF EXISTS idx_edificacoes_tenant        RENAME TO idx_edificacoes_cliente;
ALTER INDEX IF EXISTS idx_sensores_tenant           RENAME TO idx_sensores_cliente;
ALTER INDEX IF EXISTS idx_documentos_tenant         RENAME TO idx_documentos_cliente;
ALTER INDEX IF EXISTS idx_notificacoes_tenant       RENAME TO idx_notificacoes_cliente;
ALTER INDEX IF EXISTS idx_notificacoes_regras_tenant RENAME TO idx_notificacoes_regras_cliente;
