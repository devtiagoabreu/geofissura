CREATE TABLE IF NOT EXISTS notificacoes_config (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL UNIQUE REFERENCES tenants(id),
  smtp_host       VARCHAR(255) DEFAULT 'smtp.gmail.com',
  smtp_port       INTEGER DEFAULT 587,
  smtp_user       VARCHAR(255),
  smtp_pass       VARCHAR(255),
  smtp_from       VARCHAR(255),
  push_ativo      BOOLEAN DEFAULT true,
  email_ativo     BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacoes_regras (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  nome            VARCHAR(200) NOT NULL,
  descricao       TEXT,
  sensor_tipo     VARCHAR(50),
  condicao        VARCHAR(20) NOT NULL DEFAULT '>',
  valor_min       NUMERIC(12,4),
  valor_max       NUMERIC(12,4),
  prioridade      VARCHAR(20) DEFAULT 'media',
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacoes_regra_destinatarios (
  id              SERIAL PRIMARY KEY,
  regra_id        INTEGER NOT NULL REFERENCES notificacoes_regras(id) ON DELETE CASCADE,
  tipo            VARCHAR(20) NOT NULL DEFAULT 'usuario',
  usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  email           VARCHAR(255),
  email_ativo     BOOLEAN DEFAULT true,
  push_ativo      BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  regra_id        INTEGER REFERENCES notificacoes_regras(id) ON DELETE SET NULL,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  titulo          VARCHAR(300) NOT NULL,
  mensagem        TEXT,
  prioridade      VARCHAR(20) DEFAULT 'media',
  lida            BOOLEAN DEFAULT false,
  lida_em         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_cliente     ON notificacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario    ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida       ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_regras_cliente ON notificacoes_regras(cliente_id);
