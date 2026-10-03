'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarClientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function listarProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, sku, categoria, banho, peso, fabricante, preco')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function listarProdutosPorTipo(tipo: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, sku, categoria, banho, peso, fabricante, preco')
    .eq('empresa_id', EMPRESA_ID)
    .eq('categoria', tipo)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function listarPedidos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      numero_pedido,
      data_pedido,
      status,
      valor_total,
      desconto,
      observacoes,
      clientes:cliente_id (id, nome)
    `)
    .eq('empresa_id', EMPRESA_ID)
    .order('data_pedido', { ascending: false });

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function listarItensPedido(pedidoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('itens_pedido')
    .select(`
      id,
      quantidade,
      preco_unitario,
      subtotal,
      banho,
      produtos:produto_id (id, nome, sku, categoria)
    `)
    .eq('pedido_id', pedidoId);

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

async function gerarNumeroPedido(supabase: any, clienteId: string): Promise<string> {
  // Busca nome do cliente para gerar prefixo
  const { data: cliente } = await supabase
    .from('clientes')
    .select('nome')
    .eq('id', clienteId)
    .single();

  const nome = cliente?.nome || 'PED';
  // Pega as 3 primeiras letras do nome, sem espaços, em maiúsculas
  const prefixo = nome.replace(/\s+/g, '').substring(0, 3).toUpperCase();

  // Conta pedidos existentes desse cliente para gerar sequência
  const { count } = await supabase
    .from('pedidos')
    .select('*', { count: 'exact', head: true })
    .eq('empresa_id', EMPRESA_ID)
    .eq('cliente_id', clienteId);

  const sequencia = ((count || 0) + 1).toString().padStart(3, '0');
  return `${prefixo}-${sequencia}`;
}

interface ItemPedido {
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
}

export async function criarPedido(clienteId: string, observacoes?: string) {
  const supabase = await createClient();

  if (!clienteId) return { success: false, error: 'Selecione um cliente' };

  const numeroPedido = await gerarNumeroPedido(supabase, clienteId);

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    .insert([{
      empresa_id: EMPRESA_ID,
      cliente_id: clienteId,
      numero_pedido: numeroPedido,
      status: 'aberto',
      valor_total: 0,
      desconto: 0,
      observacoes: observacoes || null,
    }])
    .select()
    .single();

  if (pedidoError) return { success: false, error: pedidoError.message };

  revalidatePath('/dashboard/pedidos');
  return { success: true, data: pedido };
}

export async function adicionarItensMultiplos(
  pedidoId: string,
  produtoIds: string[],
  quantidade: number,
  valorUnitario: number,
  banho?: string
) {
  const supabase = await createClient();

  if (!pedidoId) return { success: false, error: 'Pedido inválido' };
  if (!produtoIds || produtoIds.length === 0) return { success: false, error: 'Selecione pelo menos um produto' };
  if (!banho) return { success: false, error: 'Selecione o banho' };
  if (!quantidade || quantidade <= 0) return { success: false, error: 'Quantidade inválida' };
  if (valorUnitario < 0) return { success: false, error: 'Valor unitário inválido' };

  const preco = valorUnitario || 0;

  const itensData = produtoIds.map((prodId) => ({
    pedido_id: pedidoId,
    produto_id: prodId,
    quantidade,
    preco_unitario: preco,
    subtotal: preco * quantidade,
    banho,
  }));

  const { error: itensError } = await supabase
    .from('itens_pedido')
    .insert(itensData);

  if (itensError) return { success: false, error: itensError.message };

  // Busca total atual e soma os novos itens
  const { data: pedidoAtual } = await supabase
    .from('pedidos')
    .select('valor_total')
    .eq('id', pedidoId)
    .single();

  const totalAtual = pedidoAtual?.valor_total || 0;
  const valorItens = preco * quantidade * produtoIds.length;

  await supabase
    .from('pedidos')
    .update({ valor_total: totalAtual + valorItens })
    .eq('id', pedidoId);

  revalidatePath('/dashboard/pedidos');
  return { success: true, data: itensData };
}

export async function atualizarItemPedido(
  itemId: string,
  pedidoId: string,
  quantidade: number,
  precoUnitario: number
) {
  const supabase = await createClient();
  const subtotal = quantidade * precoUnitario;

  const { data: itemAtual } = await supabase
    .from('itens_pedido')
    .select('quantidade, preco_unitario')
    .eq('id', itemId)
    .single();

  const { error } = await supabase
    .from('itens_pedido')
    .update({ quantidade, preco_unitario: precoUnitario, subtotal })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };

  const diffValor = subtotal - (itemAtual?.quantidade || 0) * (itemAtual?.preco_unitario || 0);

  const { data: pedido } = await supabase.from('pedidos').select('valor_total').eq('id', pedidoId).single();
  await supabase.from('pedidos').update({ valor_total: (pedido?.valor_total || 0) + diffValor }).eq('id', pedidoId);

  revalidatePath('/dashboard/pedidos');
  return { success: true };
}

export async function deletarItemPedido(itemId: string, pedidoId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('itens_pedido')
    .select('quantidade, preco_unitario')
    .eq('id', itemId)
    .single();

  const { error } = await supabase.from('itens_pedido').delete().eq('id', itemId);
  if (error) return { success: false, error: error.message };

  const valorItem = (item?.quantidade || 0) * (item?.preco_unitario || 0);
  const { data: pedido } = await supabase.from('pedidos').select('valor_total').eq('id', pedidoId).single();
  await supabase.from('pedidos').update({ valor_total: Math.max(0, (pedido?.valor_total || 0) - valorItem) }).eq('id', pedidoId);

  revalidatePath('/dashboard/pedidos');
  return { success: true };
}

export async function atualizarStatusPedido(pedidoId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('pedidos')
    .update({ status, atualizado_em: new Date().toISOString() })
    .eq('id', pedidoId);

  if (error) return { success: false, error: error.message };

  if (status === 'em_fabricacao') {
    await supabase
      .from('itens_pedido')
      .update({ etapa_fabricacao: 'montagem_inicial' })
      .eq('pedido_id', pedidoId)
      .is('etapa_fabricacao', null);
  }

  if (status === 'aberto') {
    await supabase
      .from('itens_pedido')
      .update({ etapa_fabricacao: null })
      .eq('pedido_id', pedidoId);
  }

  revalidatePath('/dashboard/pedidos');
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}

export async function deletarPedido(pedidoId: string) {
  const supabase = await createClient();

  await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId);

  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', pedidoId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/pedidos');
  return { success: true };
}
