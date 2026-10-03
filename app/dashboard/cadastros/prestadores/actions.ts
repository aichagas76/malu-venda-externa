'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarPrestadores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prestadores')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarPrestador(nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('prestadores')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/prestadores');
  return { success: true };
}

export async function atualizarPrestador(prestadorId: string, nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('prestadores')
    .update({ nome: nome.trim() })
    .eq('id', prestadorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/prestadores');
  return { success: true };
}

export async function deletarPrestador(prestadorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('prestadores')
    .delete()
    .eq('id', prestadorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/prestadores');
  return { success: true };
}
