'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

type LinhaPadrao = { item_id: string; quantidade: number };

export async function listarPadroes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('padroes_itens')
    .select('id, nome, criado_em, padroes_itens_linhas(item_id, quantidade)')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

function validar(nome: string, linhas: LinhaPadrao[]) {
  if (!nome.trim()) return 'Nome é obrigatório';
  if (linhas.length === 0) return 'Adicione ao menos um item';
  if (linhas.some(l => !l.item_id || !(l.quantidade > 0))) return 'Informe uma quantidade maior que zero para cada item';
  return null;
}

async function gravarLinhas(padraoId: string, linhas: LinhaPadrao[]) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('padroes_itens_linhas')
    .upsert(
      linhas.map(l => ({ empresa_id: EMPRESA_ID, padrao_id: padraoId, item_id: l.item_id, quantidade: l.quantidade })),
      { onConflict: 'padrao_id,item_id' }
    );
  if (error) return error.message;

  const { error: errDel } = await supabase
    .from('padroes_itens_linhas')
    .delete()
    .eq('padrao_id', padraoId)
    .eq('empresa_id', EMPRESA_ID)
    .not('item_id', 'in', `(${linhas.map(l => l.item_id).join(',')})`);
  return errDel ? errDel.message : null;
}

export async function criarPadrao(nome: string, linhas: LinhaPadrao[]) {
  const erro = validar(nome, linhas);
  if (erro) return { success: false, error: erro };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('padroes_itens')
    .insert([{ empresa_id: EMPRESA_ID, nome: nome.trim() }])
    .select('id')
    .single();
  if (error) return { success: false, error: error.message };

  const erroLinhas = await gravarLinhas(data.id, linhas);
  if (erroLinhas) {
    await supabase.from('padroes_itens').delete().eq('id', data.id).eq('empresa_id', EMPRESA_ID);
    return { success: false, error: erroLinhas };
  }

  revalidatePath('/dashboard/cadastros/padroes-itens');
  return { success: true };
}

export async function atualizarPadrao(padraoId: string, nome: string, linhas: LinhaPadrao[]) {
  const erro = validar(nome, linhas);
  if (erro) return { success: false, error: erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from('padroes_itens')
    .update({ nome: nome.trim() })
    .eq('id', padraoId)
    .eq('empresa_id', EMPRESA_ID);
  if (error) return { success: false, error: error.message };

  const erroLinhas = await gravarLinhas(padraoId, linhas);
  if (erroLinhas) return { success: false, error: erroLinhas };

  revalidatePath('/dashboard/cadastros/padroes-itens');
  return { success: true };
}

export async function deletarPadrao(padraoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('padroes_itens')
    .delete()
    .eq('id', padraoId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/padroes-itens');
  return { success: true };
}
