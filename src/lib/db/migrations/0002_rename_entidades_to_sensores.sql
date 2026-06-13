-- Renomear apenas se a tabela antiga ainda existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'entidades_da_edificacao') THEN
    ALTER TABLE entidades_da_edificacao RENAME TO sensores;
    ALTER TABLE sensores RENAME COLUMN tipo_entidade TO tipo_sensor;
    ALTER TABLE leituras RENAME COLUMN entidade_id TO sensor_id;
    ALTER TABLE leituras DROP CONSTRAINT IF EXISTS leituras_entidade_id_fkey;
    ALTER TABLE leituras ADD CONSTRAINT leituras_sensor_id_fkey
      FOREIGN KEY (sensor_id) REFERENCES sensores(id) ON DELETE CASCADE;
    DROP INDEX IF EXISTS idx_entidades_tenant;
    DROP INDEX IF EXISTS idx_entidades_edificacao;
    DROP INDEX IF EXISTS idx_entidades_tipo;
    DROP INDEX IF EXISTS idx_leituras_entidade;
    CREATE INDEX IF NOT EXISTS idx_sensores_cliente ON sensores(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_sensores_edificacao ON sensores(edificacao_id);
    CREATE INDEX IF NOT EXISTS idx_sensores_tipo ON sensores(tipo_sensor);
    CREATE INDEX IF NOT EXISTS idx_leituras_sensor ON leituras(sensor_id);
  END IF;
END
$$;
