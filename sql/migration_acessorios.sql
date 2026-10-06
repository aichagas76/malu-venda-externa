-- Tipos de produto que precisam de montagem de acessórios (ex.: Brinco, Anel)
CREATE TABLE IF NOT EXISTS acessorios_tipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_acessorios_tipos_empresa_tipo ON acessorios_tipos (empresa_id, lower(tipo));

-- Controle independente da montagem de acessórios em cada item do pedido (vazio = pendente)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS acessorio_finalizado_em TIMESTAMPTZ;
