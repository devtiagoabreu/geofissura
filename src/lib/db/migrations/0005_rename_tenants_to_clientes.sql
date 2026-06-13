-- Renomeia tabela tenants para clientes (apenas se a origem existir e o destino não)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tenants') THEN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes') THEN
      ALTER TABLE tenants RENAME TO clientes;
    ELSE
      DROP TABLE tenants;
    END IF;
  END IF;
END $$;

-- Renomeia colunas tenant_id para cliente_id em todas as tabelas
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='usuarios' AND column_name='tenant_id') THEN ALTER TABLE usuarios RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='edificacoes' AND column_name='tenant_id') THEN ALTER TABLE edificacoes RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='sensores' AND column_name='tenant_id') THEN ALTER TABLE sensores RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='leituras' AND column_name='tenant_id') THEN ALTER TABLE leituras RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='documentos' AND column_name='tenant_id') THEN ALTER TABLE documentos RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='notificacoes_config' AND column_name='tenant_id') THEN ALTER TABLE notificacoes_config RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='notificacoes_regras' AND column_name='tenant_id') THEN ALTER TABLE notificacoes_regras RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT FROM information_schema.columns WHERE table_name='notificacoes' AND column_name='tenant_id') THEN ALTER TABLE notificacoes RENAME COLUMN tenant_id TO cliente_id; END IF; END $$;

-- Renomeia índices
ALTER INDEX IF EXISTS idx_edificacoes_tenant        RENAME TO idx_edificacoes_cliente;
ALTER INDEX IF EXISTS idx_sensores_tenant           RENAME TO idx_sensores_cliente;
ALTER INDEX IF EXISTS idx_documentos_tenant         RENAME TO idx_documentos_cliente;
ALTER INDEX IF EXISTS idx_notificacoes_tenant       RENAME TO idx_notificacoes_cliente;
ALTER INDEX IF EXISTS idx_notificacoes_regras_tenant RENAME TO idx_notificacoes_regras_cliente;
