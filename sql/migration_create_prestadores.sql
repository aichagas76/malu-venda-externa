CREATE TABLE IF NOT EXISTS prestadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prestadores_empresa ON prestadores (empresa_id);
