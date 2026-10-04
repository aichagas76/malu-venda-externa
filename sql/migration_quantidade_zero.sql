ALTER TABLE padroes_itens_linhas DROP CONSTRAINT IF EXISTS padroes_itens_linhas_quantidade_check;
ALTER TABLE padroes_itens_linhas ADD CONSTRAINT padroes_itens_linhas_quantidade_check CHECK (quantidade >= 0);

ALTER TABLE produto_itens DROP CONSTRAINT IF EXISTS produto_itens_quantidade_check;
ALTER TABLE produto_itens ADD CONSTRAINT produto_itens_quantidade_check CHECK (quantidade >= 0);
