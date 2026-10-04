'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ListaComprasData, ComprasFornecedor, ComprasGrupo } from './compras';
import type { ListaTerceiroData } from './terceiros';

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
      etapa_fabricacao,
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
  precoUnitario: number,
  banho: string
) {
  const supabase = await createClient();
  if (!banho) return { success: false, error: 'Selecione o banho' };
  const subtotal = quantidade * precoUnitario;

  const { data: itemAtual } = await supabase
    .from('itens_pedido')
    .select('quantidade, preco_unitario')
    .eq('id', itemId)
    .single();

  const { error } = await supabase
    .from('itens_pedido')
    .update({ quantidade, preco_unitario: precoUnitario, subtotal, banho })
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

function um<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export async function gerarListaCompras(statuses: string[]): Promise<{ success: true; data: ListaComprasData } | { success: false; error: string }> {
  const permitidos = ['aberto', 'em_fabricacao'];
  const status = (statuses || []).filter(s => permitidos.includes(s));
  if (status.length === 0) return { success: false, error: 'Selecione ao menos um status de pedido' };

  const supabase = await createClient();

  const { data: pedidos, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, numero_pedido, status, clientes:cliente_id (nome)')
    .eq('empresa_id', EMPRESA_ID)
    .in('status', status)
    .order('numero_pedido');
  if (errPedidos) return { success: false, error: errPedidos.message };

  const { data: fornecedores, error: errForn } = await supabase
    .from('fornecedores')
    .select('id, nome, telefone, email')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');
  if (errForn) return { success: false, error: errForn.message };

  const fornecedoresCadastrados: ComprasFornecedor[] = (fornecedores || []).map(f => ({
    id: f.id, nome: f.nome, telefone: f.telefone ?? null, email: f.email ?? null,
  }));

  const base: ListaComprasData = {
    geradoEm: new Date().toISOString(),
    statusIncluidos: status,
    pedidos: [],
    grupos: [],
    produtosSemItens: [],
    fornecedoresCadastrados,
    total: 0,
  };

  if (!pedidos || pedidos.length === 0) return { success: true, data: base };

  const statusDoPedido = new Map(pedidos.map(p => [p.id as string, p.status as string]));

  const { data: linhas, error: errLinhas } = await supabase
    .from('itens_pedido')
    .select('pedido_id, produto_id, quantidade, etapa_fabricacao, produtos:produto_id (sku, nome)')
    .in('pedido_id', pedidos.map(p => p.id));
  if (errLinhas) return { success: false, error: errLinhas.message };

  // Pedido aberto: tudo ainda precisa ser comprado. Em fabricação: só o que ainda não foi concluído.
  const consideradas = (linhas || []).filter(l => statusDoPedido.get(l.pedido_id) === 'aberto' || l.etapa_fabricacao !== null);

  const pedidosComLinhas = new Set(consideradas.map(l => l.pedido_id));
  base.pedidos = pedidos
    .filter(p => pedidosComLinhas.has(p.id))
    .map(p => ({ numero: p.numero_pedido, cliente: um(p.clientes as { nome: string } | { nome: string }[] | null)?.nome || '', status: p.status }));

  if (consideradas.length === 0) return { success: true, data: base };

  const qtdPorProduto = new Map<string, { qtd: number; sku: string; nome: string }>();
  for (const l of consideradas) {
    const prod = um(l.produtos as { sku: string; nome: string | null } | { sku: string; nome: string | null }[] | null);
    const atual = qtdPorProduto.get(l.produto_id) || { qtd: 0, sku: prod?.sku || '-', nome: prod?.nome || '' };
    atual.qtd += l.quantidade;
    qtdPorProduto.set(l.produto_id, atual);
  }

  const { data: vinculos, error: errVinc } = await supabase
    .from('produto_itens')
    .select('produto_id, quantidade, itens:item_id (id, nome, unidade, valor_unitario, fornecedores:fornecedor_id (id, nome, telefone, email))')
    .eq('empresa_id', EMPRESA_ID)
    .in('produto_id', [...qtdPorProduto.keys()]);
  if (errVinc) return { success: false, error: errVinc.message };

  type ItemRel = { id: string; nome: string; unidade: string; valor_unitario: number; fornecedores: ComprasFornecedor | ComprasFornecedor[] | null };
  const acumulado = new Map<string, { item: ItemRel; quantidade: number }>();
  const produtosComItens = new Set<string>();

  for (const v of vinculos || []) {
    const item = um(v.itens as ItemRel | ItemRel[] | null);
    if (!item) continue;
    produtosComItens.add(v.produto_id);
    const pedida = qtdPorProduto.get(v.produto_id)?.qtd || 0;
    const atual = acumulado.get(item.id) || { item, quantidade: 0 };
    atual.quantidade += pedida * Number(v.quantidade);
    acumulado.set(item.id, atual);
  }

  base.produtosSemItens = [...qtdPorProduto.entries()]
    .filter(([id]) => !produtosComItens.has(id))
    .map(([, p]) => ({ sku: p.sku, nome: p.nome, quantidade: p.qtd }))
    .sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR'));

  const grupos = new Map<string, ComprasGrupo>();
  for (const { item, quantidade } of acumulado.values()) {
    const forn = um(item.fornecedores);
    const chave = forn ? forn.id : 'sem-fornecedor';
    const grupo = grupos.get(chave) || {
      fornecedor: forn ? { id: forn.id, nome: forn.nome, telefone: forn.telefone ?? null, email: forn.email ?? null } : null,
      itens: [],
      total: 0,
    };
    const qtd = Number(quantidade.toFixed(4));
    const valor = Number(item.valor_unitario);
    const subtotal = Number((qtd * valor).toFixed(4));
    grupo.itens.push({ itemId: item.id, nome: item.nome, unidade: item.unidade, valorUnitario: valor, quantidade: qtd, subtotal });
    grupo.total = Number((grupo.total + subtotal).toFixed(4));
    grupos.set(chave, grupo);
  }

  base.grupos = [...grupos.values()]
    .map(g => ({ ...g, itens: g.itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) }))
    .sort((a, b) => {
      if (!a.fornecedor) return 1;
      if (!b.fornecedor) return -1;
      return a.fornecedor.nome.localeCompare(b.fornecedor.nome, 'pt-BR');
    });
  base.total = Number(base.grupos.reduce((t, g) => t + g.total, 0).toFixed(4));

  return { success: true, data: base };
}

// Fabricantes terceirizados: tudo que não é a própria MALU (que fabrica na casa).
export async function listarFabricantesTerceiros() {
  const supabase = await createClient();
  const contagem = new Map<string, number>();
  for (let inicio = 0; ; inicio += 1000) {
    const { data, error } = await supabase
      .from('produtos')
      .select('fabricante')
      .eq('empresa_id', EMPRESA_ID)
      .not('fabricante', 'is', null)
      .order('id')
      .range(inicio, inicio + 999);
    if (error) return { success: false as const, error: error.message, data: [] as string[] };
    for (const p of data || []) {
      const nome = String(p.fabricante || '').trim();
      if (nome && nome.toLowerCase() !== 'malu') contagem.set(nome, (contagem.get(nome) || 0) + 1);
    }
    if (!data || data.length < 1000) break;
  }
  const nomes = [...contagem.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
  return { success: true as const, data: nomes };
}

export async function gerarListaFabricante(fabricante: string, statuses: string[]): Promise<{ success: true; data: ListaTerceiroData } | { success: false; error: string }> {
  const permitidos = ['aberto', 'em_fabricacao', 'fechado'];
  const status = (statuses || []).filter(s => permitidos.includes(s));
  if (!fabricante || !fabricante.trim()) return { success: false, error: 'Selecione o fabricante' };
  if (status.length === 0) return { success: false, error: 'Selecione ao menos um status de pedido' };

  const supabase = await createClient();

  const { data: pedidos, error: errPedidos } = await supabase
    .from('pedidos')
    .select('id, status')
    .eq('empresa_id', EMPRESA_ID)
    .in('status', status);
  if (errPedidos) return { success: false, error: errPedidos.message };

  const base: ListaTerceiroData = { fabricante: fabricante.trim(), geradoEm: new Date().toISOString(), statusIncluidos: status, pedidos: 0, linhas: [] };
  if (!pedidos || pedidos.length === 0) return { success: true, data: base };

  const statusDoPedido = new Map(pedidos.map(p => [p.id as string, p.status as string]));

  type Prod = { sku: string; nome: string | null; categoria: string | null; imagem_url: string | null };
  type Linha = { pedido_id: string; produto_id: string; quantidade: number; etapa_fabricacao: string | null; produtos: Prod | Prod[] | null };
  const linhas: Linha[] = [];
  const ids = pedidos.map(p => p.id as string);
  for (let i = 0; i < ids.length; i += 100) {
    const { data, error } = await supabase
      .from('itens_pedido')
      .select('pedido_id, produto_id, quantidade, etapa_fabricacao, produtos:produto_id!inner (sku, nome, categoria, imagem_url, fabricante)')
      .in('pedido_id', ids.slice(i, i + 100))
      .eq('produtos.fabricante', fabricante.trim());
    if (error) return { success: false, error: error.message };
    linhas.push(...((data || []) as unknown as Linha[]));
  }

  // Mesma regra da lista de compras: em fabricação conta só o que ainda não foi concluído.
  const consideradas = linhas.filter(l => statusDoPedido.get(l.pedido_id) !== 'em_fabricacao' || l.etapa_fabricacao !== null);

  const porProduto = new Map<string, { sku: string; nome: string; categoria: string; quantidade: number; imagemUrl: string | null }>();
  for (const l of consideradas) {
    const prod = um(l.produtos);
    const atual = porProduto.get(l.produto_id) || { sku: prod?.sku || '-', nome: prod?.nome || '', categoria: prod?.categoria || '', quantidade: 0, imagemUrl: prod?.imagem_url || null };
    atual.quantidade += l.quantidade;
    porProduto.set(l.produto_id, atual);
  }

  base.pedidos = new Set(consideradas.map(l => l.pedido_id)).size;
  base.linhas = [...porProduto.values()].sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR', { numeric: true, sensitivity: 'base' }));
  return { success: true, data: base };
}
