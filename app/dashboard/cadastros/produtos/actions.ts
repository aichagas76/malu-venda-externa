'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarProdutos() {
  const supabase = await createClient();
  // O Supabase devolve no máximo 1000 linhas por consulta: busca em blocos.
  const TAMANHO = 1000;
  const todos: Record<string, unknown>[] = [];
  for (let inicio = 0; ; inicio += TAMANHO) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('empresa_id', EMPRESA_ID)
      .order('nome')
      .order('id')
      .range(inicio, inicio + TAMANHO - 1);

    if (error) return { success: false, error: error.message, data: [] };
    todos.push(...(data || []));
    if (!data || data.length < TAMANHO) break;
  }
  return { success: true, data: todos };
}

export async function criarProduto(nome: string, sku: string, categoria: string, peso: string, foto: string) {
  const supabase = await createClient();

  if (!sku.trim()) return { success: false, error: 'Código (SKU) é obrigatório' };

  const { data, error } = await supabase
    .from('produtos')
    .insert([{
      empresa_id: EMPRESA_ID,
      nome: nome.trim() || null,
      sku: sku.trim(),
      categoria: categoria.trim() || null,
      peso: peso ? parseFloat(peso) : null,
      imagem_url: foto.trim() || null,
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true, data };
}

export async function atualizarProduto(produtoId: string, nome: string, sku: string, categoria: string, peso: string, foto: string) {
  const supabase = await createClient();

  if (!sku.trim()) return { success: false, error: 'Código (SKU) é obrigatório' };

  const { error } = await supabase
    .from('produtos')
    .update({
      nome: nome.trim() || null,
      sku: sku.trim(),
      categoria: categoria.trim() || null,
      peso: peso ? parseFloat(peso) : null,
      imagem_url: foto.trim() || null,
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

export async function listarItensProduto(produtoId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produto_itens')
    .select('item_id, quantidade')
    .eq('empresa_id', EMPRESA_ID)
    .eq('produto_id', produtoId);

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function salvarItensProduto(produtoId: string, itens: { item_id: string; quantidade: number }[]) {
  const supabase = await createClient();

  if (itens.some(i => !i.item_id || !(i.quantidade > 0))) {
    return { success: false, error: 'Informe uma quantidade maior que zero para cada item' };
  }

  if (itens.length > 0) {
    const { error } = await supabase
      .from('produto_itens')
      .upsert(
        itens.map(i => ({ empresa_id: EMPRESA_ID, produto_id: produtoId, item_id: i.item_id, quantidade: i.quantidade })),
        { onConflict: 'produto_id,item_id' }
      );
    if (error) return { success: false, error: error.message };
  }

  let remover = supabase.from('produto_itens').delete().eq('produto_id', produtoId).eq('empresa_id', EMPRESA_ID);
  if (itens.length > 0) remover = remover.not('item_id', 'in', `(${itens.map(i => i.item_id).join(',')})`);
  const { error: errDel } = await remover;
  if (errDel) return { success: false, error: errDel.message };

  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true };
}

export async function listarValoresProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produto_itens')
    .select('produto_id, quantidade, itens(valor_unitario)')
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message, data: {} as Record<string, number> };

  const valores: Record<string, number> = {};
  for (const row of (data || []) as unknown as { produto_id: string; quantidade: number; itens: { valor_unitario: number } | { valor_unitario: number }[] | null }[]) {
    const item = Array.isArray(row.itens) ? row.itens[0] : row.itens;
    valores[row.produto_id] = (valores[row.produto_id] || 0) + Number(row.quantidade) * Number(item?.valor_unitario || 0);
  }
  return { success: true, data: valores };
}

export async function importarProdutos(
  linhas: { codigo: string; nome: string; categoria: string; fabricante: string; peso: number | null; foto: string }[]
) {
  if (!Array.isArray(linhas) || linhas.length === 0) return { success: false, error: 'Nenhum produto para importar' };
  if (linhas.length > 1000) return { success: false, error: 'Máximo de 1000 produtos por importação' };

  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const codigo = (l.codigo || '').trim();
    if (!codigo || codigo.length > 100) return { success: false, error: `Produto ${i + 1}: código inválido` };
    if (l.peso !== null && (typeof l.peso !== 'number' || !Number.isFinite(l.peso) || l.peso < 0)) {
      return { success: false, error: `Produto ${i + 1} (${codigo}): peso inválido` };
    }
    if (l.foto && !/^https?:\/\/\S+$/i.test(l.foto)) {
      return { success: false, error: `Produto ${i + 1} (${codigo}): link da foto inválido` };
    }
  }

  const supabase = await createClient();

  // O Supabase devolve no máximo 1000 linhas por consulta: busca todos os códigos em blocos.
  const codigos = new Set<string>();
  for (let inicio = 0; ; inicio += 1000) {
    const { data: bloco, error: errExistentes } = await supabase
      .from('produtos')
      .select('sku')
      .eq('empresa_id', EMPRESA_ID)
      .order('id')
      .range(inicio, inicio + 999);
    if (errExistentes) return { success: false, error: errExistentes.message };
    (bloco || []).forEach(p => codigos.add(String(p.sku).trim().toLowerCase()));
    if (!bloco || bloco.length < 1000) break;
  }
  const novas: typeof linhas = [];
  let ignorados = 0;
  for (const l of linhas) {
    const chave = l.codigo.trim().toLowerCase();
    if (codigos.has(chave)) { ignorados++; continue; }
    codigos.add(chave);
    novas.push(l);
  }

  if (novas.length === 0) return { success: true, criados: 0, ignorados, categoriasCriadas: 0 };

  const { data: categorias, error: errCat } = await supabase
    .from('categorias')
    .select('nome')
    .eq('empresa_id', EMPRESA_ID);
  if (errCat) return { success: false, error: errCat.message };

  const nomeCategoria = new Map<string, string>((categorias || []).map(c => [String(c.nome).trim().toLowerCase(), String(c.nome)]));

  const categoriasNovas = new Map<string, string>();
  for (const l of novas) {
    const c = (l.categoria || '').trim();
    if (c && !nomeCategoria.has(c.toLowerCase()) && !categoriasNovas.has(c.toLowerCase())) categoriasNovas.set(c.toLowerCase(), c);
  }

  if (categoriasNovas.size > 0) {
    const { error: errCriar } = await supabase
      .from('categorias')
      .insert([...categoriasNovas.values()].map(nome => ({ empresa_id: EMPRESA_ID, nome })));
    if (errCriar) return { success: false, error: errCriar.message };
    for (const [chave, nome] of categoriasNovas) nomeCategoria.set(chave, nome);
  }

  const { error: errProdutos } = await supabase.from('produtos').insert(
    novas.map(l => ({
      empresa_id: EMPRESA_ID,
      sku: l.codigo.trim(),
      nome: (l.nome || '').trim() || null,
      categoria: (l.categoria || '').trim() ? nomeCategoria.get(l.categoria.trim().toLowerCase()) || null : null,
      fabricante: (l.fabricante || '').trim() || null,
      peso: l.peso,
      imagem_url: (l.foto || '').trim() || null,
    }))
  );
  if (errProdutos) return { success: false, error: errProdutos.message };

  revalidatePath('/dashboard/cadastros/produtos');
  revalidatePath('/dashboard/cadastros/categorias');
  return { success: true, criados: novas.length, ignorados, categoriasCriadas: categoriasNovas.size };
}

export async function aplicarPadraoProduto(produtoId: string, padraoId: string) {
  const supabase = await createClient();

  const { data: linhas, error } = await supabase
    .from('padroes_itens_linhas')
    .select('item_id, quantidade')
    .eq('empresa_id', EMPRESA_ID)
    .eq('padrao_id', padraoId);
  if (error) return { success: false, error: error.message };
  if (!linhas || linhas.length === 0) return { success: false, error: 'Este padrão não tem itens' };

  const { data: existentes, error: errEx } = await supabase
    .from('produto_itens')
    .select('item_id')
    .eq('empresa_id', EMPRESA_ID)
    .eq('produto_id', produtoId);
  if (errEx) return { success: false, error: errEx.message };

  const jaTem = new Set((existentes || []).map(e => e.item_id));
  const novos = linhas.filter(l => !jaTem.has(l.item_id));

  if (novos.length > 0) {
    const { error: errIns } = await supabase
      .from('produto_itens')
      .insert(novos.map(l => ({ empresa_id: EMPRESA_ID, produto_id: produtoId, item_id: l.item_id, quantidade: l.quantidade })));
    if (errIns) return { success: false, error: errIns.message };
  }

  revalidatePath('/dashboard/cadastros/produtos');
  return { success: true, inseridos: novos.length, ignorados: linhas.length - novos.length };
}
