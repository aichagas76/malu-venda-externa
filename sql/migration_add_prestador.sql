-- Migration: Adicionar colunas de prestador na tabela itens_pedido

-- Adicionar coluna prestador_nome
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_nome VARCHAR(255);

-- Adicionar coluna prestador_data_saida (quando saiu para a rua)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_data_saida DATE;

-- Adicionar coluna prestador_data_retorno (quando voltou da rua)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_data_retorno DATE;

-- Soldador (solda)
-- Adicionar coluna soldador_nome
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS soldador_nome VARCHAR(255);

-- Adicionar coluna soldador_data_saida (quando saiu para soldar)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS soldador_data_saida DATE;

-- Adicionar coluna soldador_data_retorno (quando voltou da solda)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS soldador_data_retorno DATE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_pedido_prestador_nome ON itens_pedido(prestador_nome);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_prestador_data_saida ON itens_pedido(prestador_data_saida);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_soldador_nome ON itens_pedido(soldador_nome);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_soldador_data_saida ON itens_pedido(soldador_data_saida);
