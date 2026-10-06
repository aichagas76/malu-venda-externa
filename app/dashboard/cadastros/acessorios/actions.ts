'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarTiposAcessorio() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('acessorios_tipos')
    .select('id, tipo')
    .eq('empresa_id', EMPRESA_ID)
    .order('tipo');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarTipoAcessorio(tipo: string) {
  const supabase = await createClient();
  if (!tipo.trim()) return { success: false, error: 'Selecione o tipo' };

  const { error } = await supabase
    .from('acessorios_tipos')
    .insert([{ empresa_id: EMPRESA_ID, tipo: tipo.trim() }]);

  if (error) return { success: false, error: error.code === '23505' ? 'Este tipo já está cadastrado' : error.message };
  revalidatePath('/dashboard/cadastros/acessorios');
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}

export async function deletarTipoAcessorio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('acessorios_tipos')
    .delete()
    .eq('id', id)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/acessorios');
  revalidatePath('/dashboard/fabricacao');
  return { success: true };
}
