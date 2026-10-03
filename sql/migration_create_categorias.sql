CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(100) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_empresa_nome ON categorias (empresa_id, lower(nome));

INSERT INTO categorias (empresa_id, nome)
SELECT DISTINCT empresa_id, categoria FROM produtos
WHERE categoria IS NOT NULL AND trim(categoria) <> ''
ON CONFLICT DO NOTHING;
