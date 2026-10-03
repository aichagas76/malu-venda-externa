CREATE TABLE IF NOT EXISTS itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  unidade VARCHAR(20) NOT NULL CHECK (unidade IN ('metro', 'peca', 'servico')),
  valor_unitario NUMERIC(12, 4) NOT NULL DEFAULT 0,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itens_empresa ON itens (empresa_id);

CREATE TABLE IF NOT EXISTS produto_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
  quantidade NUMERIC(12, 4) NOT NULL CHECK (quantidade > 0),
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (produto_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_produto_itens_produto ON produto_itens (produto_id);
CREATE INDEX IF NOT EXISTS idx_produto_itens_item ON produto_itens (item_id);
