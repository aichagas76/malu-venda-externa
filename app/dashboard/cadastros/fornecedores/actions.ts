'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarFornecedores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarFornecedor(nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('fornecedores')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/fornecedores');
  return { success: true };
}

export async function atualizarFornecedor(fornecedorId: string, nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('fornecedores')
    .update({ nome: nome.trim() })
    .eq('id', fornecedorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/fornecedores');
  revalidatePath('/dashboard/cadastros/itens');
  return { success: true };
}

export async function deletarFornecedor(fornecedorId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from('itens')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', EMPRESA_ID)
    .eq('fornecedor_id', fornecedorId);

  if (count && count > 0) {
    return { success: false, error: `Fornecedor em uso por ${count} item(ns). Altere os itens antes de excluir.` };
  }

  const { error } = await supabase
    .from('fornecedores')
    .delete()
    .eq('id', fornecedorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/fornecedores');
  return { success: true };
}
