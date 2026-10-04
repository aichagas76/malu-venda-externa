'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

function mensagem(error: { code?: string; message: string }) {
  return error.code === '23505' ? 'Já existe um fabricante com esse nome' : error.message;
}

export async function listarFabricantes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('fabricantes')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarFabricante(nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('fabricantes')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }]);

  if (error) return { success: false, error: mensagem(error) };
  revalidatePath('/dashboard/cadastros/fabricantes');
  return { success: true };
}

// Os produtos guardam o nome do fabricante: ao renomear, os produtos acompanham.
export async function atualizarFabricante(fabricanteId: string, nome: string) {
  const supabase = await createClient();
  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { data: atual, error: errAtual } = await supabase
    .from('fabricantes')
    .select('nome')
    .eq('id', fabricanteId)
    .eq('empresa_id', EMPRESA_ID)
    .single();
  if (errAtual || !atual) return { success: false, error: errAtual?.message || 'Fabricante não encontrado' };

  const { error } = await supabase
    .from('fabricantes')
    .update({ nome: nome.trim() })
    .eq('id', fabricanteId)
    .eq('empresa_id', EMPRESA_ID);
  if (error) return { success: false, error: mensagem(error) };

  if (atual.nome !== nome.trim()) {
    const { error: errProd } = await supabase
      .from('produtos')
      .update({ fabricante: nome.trim() })
      .eq('empresa_id', EMPRESA_ID)
      .eq('fabricante', atual.nome);
    if (errProd) return { success: false, error: errProd.message };
  }

  revalidatePath('/dashboard/cadastros/fabricantes');
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function deletarFabricante(fabricanteId: string) {
  const supabase = await createClient();

  const { data: atual, error: errAtual } = await supabase
    .from('fabricantes')
    .select('nome')
    .eq('id', fabricanteId)
    .eq('empresa_id', EMPRESA_ID)
    .single();
  if (errAtual || !atual) return { success: false, error: errAtual?.message || 'Fabricante não encontrado' };

  const { count, error: errCount } = await supabase
    .from('produtos')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', EMPRESA_ID)
    .eq('fabricante', atual.nome);
  if (errCount) return { success: false, error: errCount.message };
  if (count) return { success: false, error: `Não é possível deletar: ${count} produto(s) usam este fabricante` };

  const { error } = await supabase
    .from('fabricantes')
    .delete()
    .eq('id', fabricanteId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/fabricantes');
  return { success: true };
}
