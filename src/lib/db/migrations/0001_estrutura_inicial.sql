CREATE TABLE IF NOT EXISTS tenants (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(200) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  config     JSONB DEFAULT '{}',
  logo       VARCHAR(500),
  ativo      VARCHAR(1) DEFAULT 'S',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  nome       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edificacoes (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER NOT NULL REFERENCES tenants(id),
  nome       VARCHAR(200) NOT NULL,
  endereco   TEXT,
  ativo      VARCHAR(1) DEFAULT 'S',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entidades_da_edificacao (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  tipo_entidade   VARCHAR(50) NOT NULL,
  nome            VARCHAR(200) NOT NULL,
  descricao       TEXT,
  dados           JSONB NOT NULL DEFAULT '{}',
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leituras (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  entidade_id     INTEGER NOT NULL REFERENCES entidades_da_edificacao(id) ON DELETE CASCADE,
  topico_mqtt     VARCHAR(500),
  valor           NUMERIC(12, 4),
  unidade         VARCHAR(20),
  metadata        JSONB DEFAULT '{}',
  lida_em         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edificacoes_tenant     ON edificacoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entidades_tenant       ON entidades_da_edificacao(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entidades_edificacao   ON entidades_da_edificacao(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_entidades_tipo         ON entidades_da_edificacao(tipo_entidade);
CREATE INDEX IF NOT EXISTS idx_leituras_entidade      ON leituras(entidade_id);
CREATE INDEX IF NOT EXISTS idx_leituras_tempo         ON leituras(lida_em DESC);
