'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarProduto(nome: string, sku: string, categoria: string, peso: string, foto: string) {
  const supabase = await createClient();

  if (!sku.trim()) return { success: false, error: 'Código (SKU) é obrigatório' };

  const { data, error } = await supabase
    .from('produtos')
    .insert([{
      empresa_id: EMPRESA_ID,
      nome: nome.trim() || null,
      sku: sku.trim(),
      categoria: categoria.trim() || null,
      peso: peso ? parseFloat(peso) : null,
      imagem_url: foto.trim() || null,
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true, data };
}

export async function atualizarProduto(produtoId: string, nome: string, sku: string, categoria: string, peso: string, foto: string) {
  const supabase = await createClient();

  if (!sku.trim()) return { success: false, error: 'Código (SKU) é obrigatório' };

  const { error } = await supabase
    .from('produtos')
    .update({
      nome: nome.trim() || null,
      sku: sku.trim(),
      categoria: categoria.trim() || null,
      peso: peso ? parseFloat(peso) : null,
      imagem_url: foto.trim() || null,
    })
    .eq('id', produtoId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function deletarProduto(produtoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', produtoId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function listarItensProduto(produtoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produto_itens')
    .select('item_id, quantidade')
    .eq('empresa_id', EMPRESA_ID)
    .eq('produto_id', produtoId);

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function salvarItensProduto(produtoId: string, itens: { item_id: string; quantidade: number }[]) {
  const supabase = await createClient();

  if (itens.some(i => !i.item_id || !(i.quantidade > 0))) {
    return { success: false, error: 'Informe uma quantidade maior que zero para cada item' };
  }

  if (itens.length > 0) {
    const { error } = await supabase
      .from('produto_itens')
      .upsert(
        itens.map(i => ({ empresa_id: EMPRESA_ID, produto_id: produtoId, item_id: i.item_id, quantidade: i.quantidade })),
        { onConflict: 'produto_id,item_id' }
      );
    if (error) return { success: false, error: error.message };
  }

  let remover = supabase.from('produto_itens').delete().eq('produto_id', produtoId).eq('empresa_id', EMPRESA_ID);
  if (itens.length > 0) remover = remover.not('item_id', 'in', `(${itens.map(i => i.item_id).join(',')})`);
  const { error: errDel } = await remover;
  if (errDel) return { success: false, error: errDel.message };

  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function listarValoresProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produto_itens')
    .select('produto_id, quantidade, itens(valor_unitario)')
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message, data: {} as Record<string, number> };

  const valores: Record<string, number> = {};
  for (const row of (data || []) as unknown as { produto_id: string; quantidade: number; itens: { valor_unitario: number } | { valor_unitario: number }[] | null }[]) {
    const item = Array.isArray(row.itens) ? row.itens[0] : row.itens;
    valores[row.produto_id] = (valores[row.produto_id] || 0) + Number(row.quantidade) * Number(item?.valor_unitario || 0);
  }
  return { success: true, data: valores };
}
