CREATE TABLE IF NOT EXISTS padroes_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_padroes_itens_empresa ON padroes_itens (empresa_id);

CREATE TABLE IF NOT EXISTS padroes_itens_linhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  padrao_id UUID NOT NULL REFERENCES padroes_itens(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES itens(id) ON DELETE RESTRICT,
  quantidade NUMERIC(12, 4) NOT NULL CHECK (quantidade > 0),
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (padrao_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_padroes_itens_linhas_padrao ON padroes_itens_linhas (padrao_id);
CREATE INDEX IF NOT EXISTS idx_padroes_itens_linhas_item ON padroes_itens_linhas (item_id);
