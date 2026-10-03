'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

const ETAPAS = ['montagem_inicial', 'producao', 'preparado_banho', 'encartelamento', 'enviado_cliente'] as const;
type Etapa = typeof ETAPAS[number];

export async function listarItensFabricacao() {
  const supabase = await createClient();

  const { data: pedidosEmFabricacao } = await supabase
    .from('pedidos')
    .select('id')
    .eq('empresa_id', EMPRESA_ID)
    .eq('status', 'em_fabricacao');

  const pedidoIds = (pedidosEmFabricacao || []).map(p => p.id);
  if (pedidoIds.length === 0) return { success: true, data: [] };

  const { data, error } = await supabase
    .from('itens_pedido')
    .select(`
      id,
      quantidade,
      preco_unitario,
      etapa_fabricacao,
      banho,
      observacao,
      prestador_nome,
      prestador_data_saida,
      prestador_data_retorno,
      soldador_nome,
      soldador_data_saida,
      soldador_data_retorno,
      encartelador_nome,
      encartelador_data_saida,
      encartelador_data_retorno,
      pedido_id,
      produto_id,
      produto:produto_id (id, nome, sku, categoria, imagem_url),
      pedido:pedido_id (id, numero_pedido, cliente:cliente_id (nome))
    `)
    .not('etapa_fabricacao', 'is', null)
    .in('pedido_id', pedidoIds);

  if (error) return { success: false, error: `Query error: ${error.message}`, data: [] };
  return { success: true, data: data || [] };
}

export async function salvarObservacao(itemId: string, observacao: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('itens_pedido')
    .update({ observacao: observacao || null })
    .eq('id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function avancarEtapa(itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('itens_pedido')
    .select('etapa_fabricacao, pedido_id')
    .eq('id', itemId)
    .single();

  const etapaAtual = item?.etapa_fabricacao as Etapa | null;
  if (!etapaAtual) return { success: false, error: 'Item sem etapa' };

  const idx = ETAPAS.indexOf(etapaAtual);
  if (idx === ETAPAS.length - 1) {
    const { error: errConcluir } = await supabase.from('itens_pedido').update({ etapa_fabricacao: null }).eq('id', itemId);
    if (errConcluir) return { success: false, error: errConcluir.message };

    let pedidoFechado = false;
    if (item?.pedido_id) {
      const { count } = await supabase
        .from('itens_pedido')
        .select('id', { count: 'exact', head: true })
        .eq('pedido_id', item.pedido_id)
        .not('etapa_fabricacao', 'is', null);

      if (count === 0) {
        const { error: errFechar } = await supabase
          .from('pedidos')
          .update({ status: 'fechado', atualizado_em: new Date().toISOString() })
          .eq('id', item.pedido_id)
          .eq('status', 'em_fabricacao');
        pedidoFechado = !errFechar;
      }
    }

    revalidatePath('/dashboard/fabricacao');
    revalidatePath('/dashboard/pedidos');
    return { success: true, concluido: true, pedidoFechado };
  }

  const proxima = ETAPAS[idx + 1];
  const { error } = await supabase
    .from('itens_pedido')
    .update({ etapa_fabricacao: proxima })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/fabricacao');
  return { success: true, proxima };
}

export async function voltarEtapa(itemId: string) {
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('itens_pedido')
    .select('etapa_fabricacao')
    .eq('id', itemId)
    .single();

  const etapaAtual = item?.etapa_fabricacao as Etapa | null;
  if (!etapaAtual) return { success: false, error: 'Item sem etapa' };

  const idx = ETAPAS.indexOf(etapaAtual);
  if (idx === 0) return { success: false, error: 'Já na primeira etapa' };

  const anterior = ETAPAS[idx - 1];
  const { error } = await supabase
    .from('itens_pedido')
    .update({ etapa_fabricacao: anterior })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/fabricacao');
  return { success: true, anterior };
}

export async function salvarPrestador(itemId: string, prestadorNome: string, prestadorDataSaida: string, prestadorDataRetorno?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('itens_pedido')
    .update({
      prestador_nome: prestadorNome || null,
      prestador_data_saida: prestadorDataSaida || null,
      prestador_data_retorno: prestadorDataRetorno || null,
    })
    .eq('id', itemId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}

export async function salvarSoldador(itemId: string, soldadorNome: string, soldadorDataSaida: string, soldadorDataRetorno?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('itens_pedido')
    .update({
      soldador_nome: soldadorNome || null,
      soldador_data_saida: soldadorDataSaida || null,
      soldador_data_retorno: soldadorDataRetorno || null,
    })
    .eq('id', itemId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}

export async function salvarEncartelador(itemId: string, encarteladorNome: string, encarteladorDataSaida: string, encarteladorDataRetorno?: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('itens_pedido')
    .update({
      encartelador_nome: encarteladorNome || null,
      encartelador_data_saida: encarteladorDataSaida || null,
      encartelador_data_retorno: encarteladorDataRetorno || null,
    })
    .eq('id', itemId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}
