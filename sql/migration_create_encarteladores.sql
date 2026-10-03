CREATE TABLE IF NOT EXISTS encarteladores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(150) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encarteladores_empresa ON encarteladores (empresa_id);

ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS encartelador_nome VARCHAR(255);
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS encartelador_data_saida DATE;
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS encartelador_data_retorno DATE;

CREATE INDEX IF NOT EXISTS idx_itens_pedido_encartelador_nome ON itens_pedido (encartelador_nome);
