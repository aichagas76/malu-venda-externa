'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';
const UNIDADES = ['metro', 'peca', 'servico'];

export async function listarItens() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('itens')
    .select('id, nome, unidade, valor_unitario, fornecedor_id, fornecedores(nome)')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

function validar(nome: string, unidade: string, valor: string) {
  if (!nome.trim()) return 'Nome é obrigatório';
  if (!UNIDADES.includes(unidade)) return 'Unidade é obrigatória';
  const v = parseFloat(valor);
  if (isNaN(v) || v < 0) return 'Valor unitário inválido';
  return null;
}

export async function criarItem(nome: string, unidade: string, valor: string, fornecedorId: string) {
  const erro = validar(nome, unidade, valor);
  if (erro) return { success: false, error: erro };

  const supabase = await createClient();
  const { error } = await supabase.from('itens').insert([{
    empresa_id: EMPRESA_ID,
    nome: nome.trim(),
    unidade,
    valor_unitario: parseFloat(valor),
    fornecedor_id: fornecedorId || null,
  }]);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/itens');
  return { success: true };
}

export async function atualizarItem(itemId: string, nome: string, unidade: string, valor: string, fornecedorId: string) {
  const erro = validar(nome, unidade, valor);
  if (erro) return { success: false, error: erro };

  const supabase = await createClient();
  const { error } = await supabase
    .from('itens')
    .update({
      nome: nome.trim(),
      unidade,
      valor_unitario: parseFloat(valor),
      fornecedor_id: fornecedorId || null,
    })
    .eq('id', itemId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/itens');
  return { success: true };
}

export async function deletarItem(itemId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from('produto_itens')
    .select('id', { count: 'exact', head: true })
    .eq('empresa_id', EMPRESA_ID)
    .eq('item_id', itemId);

  if (count && count > 0) {
    return { success: false, error: `Item em uso por ${count} produto(s). Remova-o dos produtos antes de excluir.` };
  }

  const { error } = await supabase
    .from('itens')
    .delete()
    .eq('id', itemId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/itens');
  return { success: true };
}
