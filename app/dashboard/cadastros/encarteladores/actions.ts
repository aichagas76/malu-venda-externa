'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarEncarteladores() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('encarteladores')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarEncartelador(nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('encarteladores')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/encarteladores');
  return { success: true };
}

export async function atualizarEncartelador(encarteladorId: string, nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('encarteladores')
    .update({ nome: nome.trim() })
    .eq('id', encarteladorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/encarteladores');
  return { success: true };
}

export async function deletarEncartelador(encarteladorId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('encarteladores')
    .delete()
    .eq('id', encarteladorId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/encarteladores');
  return { success: true };
}
