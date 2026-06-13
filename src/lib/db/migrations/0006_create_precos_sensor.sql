CREATE TABLE IF NOT EXISTS precos_sensor (
  id            SERIAL PRIMARY KEY,
  sensor_id     INTEGER NOT NULL UNIQUE REFERENCES sensores(id) ON DELETE CASCADE,
  valor_mensal  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
