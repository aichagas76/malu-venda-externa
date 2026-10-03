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

export async function criarProduto(nome: string, sku: string, categoria: string) {
  const supabase = await createClient();

  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { data, error } = await supabase
    .from('produtos')
    .insert([{
      empresa_id: EMPRESA_ID,
      nome: nome.trim(),
      sku: sku.trim() || null,
      categoria: categoria.trim() || null,
      data_cadastro: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true, data };
}

export async function atualizarProduto(produtoId: string, nome: string, sku: string, categoria: string) {
  const supabase = await createClient();

  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('produtos')
    .update({
      nome: nome.trim(),
      sku: sku.trim() || null,
      categoria: categoria.trim() || null,
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
