CREATE TABLE IF NOT EXISTS fabricantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fabricantes_empresa_nome ON fabricantes (empresa_id, lower(nome));

-- Cadastra os fabricantes que já aparecem nos produtos
INSERT INTO fabricantes (empresa_id, nome)
SELECT DISTINCT ON (lower(trim(fabricante))) '550e8400-e29b-41d4-a716-446655440000', trim(fabricante)
FROM produtos
WHERE fabricante IS NOT NULL AND trim(fabricante) <> ''
ORDER BY lower(trim(fabricante)), trim(fabricante)
ON CONFLICT DO NOTHING;

-- Garante que a MALU existe (fabricante padrão)
INSERT INTO fabricantes (empresa_id, nome)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'MALU')
ON CONFLICT DO NOTHING;
