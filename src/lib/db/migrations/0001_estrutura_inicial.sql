CREATE TABLE IF NOT EXISTS clientes (
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
  cliente_id  INTEGER NOT NULL REFERENCES clientes(id),
  nome       VARCHAR(200) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS edificacoes (
  id         SERIAL PRIMARY KEY,
  cliente_id  INTEGER NOT NULL REFERENCES clientes(id),
  nome       VARCHAR(200) NOT NULL,
  endereco   TEXT,
  ativo      VARCHAR(1) DEFAULT 'S',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensores (
  id              SERIAL PRIMARY KEY,
  cliente_id       INTEGER NOT NULL REFERENCES clientes(id),
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  tipo_sensor     VARCHAR(50) NOT NULL,
  nome            VARCHAR(200) NOT NULL,
  descricao       TEXT,
  dados           JSONB NOT NULL DEFAULT '{}',
  ativo           VARCHAR(1) DEFAULT 'S',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leituras (
  id              SERIAL PRIMARY KEY,
  cliente_id       INTEGER NOT NULL REFERENCES clientes(id),
  sensor_id       INTEGER NOT NULL REFERENCES sensores(id) ON DELETE CASCADE,
  topico_mqtt     VARCHAR(500),
  valor           NUMERIC(12, 4),
  unidade         VARCHAR(20),
  metadata        JSONB DEFAULT '{}',
  lida_em         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edificacoes_cliente    ON edificacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sensores_cliente       ON sensores(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sensores_edificacao    ON sensores(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_sensores_tipo          ON sensores(tipo_sensor);
CREATE INDEX IF NOT EXISTS idx_leituras_sensor        ON leituras(sensor_id);
CREATE INDEX IF NOT EXISTS idx_leituras_tempo         ON leituras(lida_em DESC);
