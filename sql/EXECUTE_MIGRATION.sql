-- ============================================
-- MIGRATION: Adicionar campos de Prestador
-- Execute este script no Supabase SQL Editor
-- ============================================

-- 1. Adicionar coluna prestador_nome
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_nome VARCHAR(255);

-- 2. Adicionar coluna prestador_data_saida (quando saiu para a rua)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_data_saida DATE;

-- 3. Adicionar coluna prestador_data_retorno (quando voltou da rua)
ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS prestador_data_retorno DATE;

-- 4. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_itens_pedido_prestador_nome ON itens_pedido(prestador_nome);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_prestador_data_saida ON itens_pedido(prestador_data_saida);

-- ============================================
-- Pronto! As colunas foram adicionadas.
-- Agora reinicie o servidor: npm run dev
-- ============================================
