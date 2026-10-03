'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarCategorias() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarCategoria(nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('categorias')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }]);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe uma categoria com esse nome' };
    return { success: false, error: error.message };
  }
  revalidatePath('/dashboard/cadastros/categorias');
  return { success: true };
}

export async function atualizarCategoria(categoriaId: string, nomeAntigo: string, nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('categorias')
    .update({ nome: nome.trim() })
    .eq('id', categoriaId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Já existe uma categoria com esse nome' };
    return { success: false, error: error.message };
  }

  await supabase
    .from('produtos')
    .update({ categoria: nome.trim() })
    .eq('empresa_id', EMPRESA_ID)
    .eq('categoria', nomeAntigo);

  revalidatePath('/dashboard/cadastros/categorias');
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function deletarCategoria(categoriaId: string, nome: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', EMPRESA_ID)
    .eq('categoria', nome);

  if (count && count > 0) {
    return { success: false, error: `Categoria em uso por ${count} produto(s). Altere os produtos antes de excluir.` };
  }

  const { error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', categoriaId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/categorias');
  return { success: true };
}
