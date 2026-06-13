CREATE TABLE IF NOT EXISTS documentos (
  id              SERIAL PRIMARY KEY,
  tenant_id       INTEGER NOT NULL REFERENCES tenants(id),
  edificacao_id   INTEGER NOT NULL REFERENCES edificacoes(id) ON DELETE CASCADE,
  url             VARCHAR(1000) NOT NULL,
  descricao       TEXT NOT NULL,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_edificacao ON documentos(edificacao_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente    ON documentos(cliente_id);
