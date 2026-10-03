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

export async function importarItens(
  linhas: { nome: string; unidade: string; valor: number; fornecedor: string }[]
) {
  if (!Array.isArray(linhas) || linhas.length === 0) return { success: false, error: 'Nenhum item para importar' };
  if (linhas.length > 1000) return { success: false, error: 'Máximo de 1000 itens por importação' };

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const nome = (l.nome || '').trim();
    if (!nome || nome.length > 150) return { success: false, error: `Item ${i + 1}: nome inválido` };
    if (!UNIDADES.includes(l.unidade)) return { success: false, error: `Item ${i + 1} (${nome}): unidade inválida` };
    if (typeof l.valor !== 'number' || !Number.isFinite(l.valor) || l.valor < 0) {
      return { success: false, error: `Item ${i + 1} (${nome}): valor inválido` };
    }
  }

  const supabase = await createClient();

  const { data: existentes, error: errExistentes } = await supabase
    .from('itens')
    .select('nome')
    .eq('empresa_id', EMPRESA_ID);
  if (errExistentes) return { success: false, error: errExistentes.message };

  const nomes = new Set((existentes || []).map(i => String(i.nome).trim().toLowerCase()));
  const novas: typeof linhas = [];
  let ignorados = 0;
  for (const l of linhas) {
    const chave = l.nome.trim().toLowerCase();
    if (nomes.has(chave)) { ignorados++; continue; }
    nomes.add(chave);
    novas.push(l);
  }

  if (novas.length === 0) return { success: true, criados: 0, ignorados, fornecedoresCriados: 0 };

  const { data: fornecedores, error: errForn } = await supabase
    .from('fornecedores')
    .select('id, nome')
    .eq('empresa_id', EMPRESA_ID);
  if (errForn) return { success: false, error: errForn.message };

  const mapa = new Map<string, string>((fornecedores || []).map(f => [String(f.nome).trim().toLowerCase(), f.id as string]));

  const nomesNovos = new Map<string, string>();
  for (const l of novas) {
    const f = (l.fornecedor || '').trim();
    if (f && !mapa.has(f.toLowerCase()) && !nomesNovos.has(f.toLowerCase())) nomesNovos.set(f.toLowerCase(), f);
  }

  if (nomesNovos.size > 0) {
    const { data: criados, error: errCriar } = await supabase
      .from('fornecedores')
      .insert([...nomesNovos.values()].map(nome => ({ empresa_id: EMPRESA_ID, nome })))
      .select('id, nome');
    if (errCriar) return { success: false, error: errCriar.message };
    for (const f of criados || []) mapa.set(String(f.nome).trim().toLowerCase(), f.id as string);
  }

  const { error: errItens } = await supabase.from('itens').insert(
    novas.map(l => ({
      empresa_id: EMPRESA_ID,
      nome: l.nome.trim(),
      unidade: l.unidade,
      valor_unitario: l.valor,
      fornecedor_id: (l.fornecedor || '').trim() ? mapa.get(l.fornecedor.trim().toLowerCase()) || null : null,
    }))
  );
  if (errItens) return { success: false, error: errItens.message };

  revalidatePath('/dashboard/cadastros/itens');
  revalidatePath('/dashboard/cadastros/fornecedores');
  return { success: true, criados: novas.length, ignorados, fornecedoresCriados: nomesNovos.size };
}
