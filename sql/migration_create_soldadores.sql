CREATE TABLE IF NOT EXISTS soldadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soldadores_empresa ON soldadores (empresa_id);

-- Importa os nomes já digitados nas Etapas da Produção
INSERT INTO prestadores (empresa_id, nome)
SELECT DISTINCT '550e8400-e29b-41d4-a716-446655440000'::uuid, trim(prestador_nome)
FROM itens_pedido
WHERE prestador_nome IS NOT NULL AND trim(prestador_nome) <> ''
  AND NOT EXISTS (SELECT 1 FROM prestadores p WHERE lower(p.nome) = lower(trim(itens_pedido.prestador_nome)));

INSERT INTO soldadores (empresa_id, nome)
SELECT DISTINCT '550e8400-e29b-41d4-a716-446655440000'::uuid, trim(soldador_nome)
FROM itens_pedido
WHERE soldador_nome IS NOT NULL AND trim(soldador_nome) <> '';
