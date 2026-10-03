'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarProdutos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('produtos')
    .select('id, nome, sku, categoria, imagem_url, banho, peso, fabricante')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarProduto(dados: {
  nome: string;
  sku: string;
  categoria: string;
  banho: string;
  peso: number;
  fabricante: string;
  imagem_url: string;
}) {
  const supabase = await createClient();

  if (!dados.sku?.trim()) return { success: false, error: 'Referência é obrigatória' };

  const { data, error } = await supabase
    .from('produtos')
    .insert([{
      empresa_id: EMPRESA_ID,
      nome: dados.nome?.trim() || null,
      sku: dados.sku.trim(),
      preco: 0,
      categoria: dados.categoria?.trim() || null,
      banho: dados.banho?.trim() || null,
      peso: dados.peso || null,
      fabricante: dados.fabricante?.trim() || null,
      imagem_url: dados.imagem_url?.trim() || null,
    }])
    .select();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/produtos');
  return { success: true, data };
}

export async function editarProduto(produtoId: string, dados: {
  nome: string;
  sku: string;
  categoria: string;
  banho: string;
  peso: number;
  fabricante: string;
  imagem_url: string;
}) {
  const supabase = await createClient();

  if (!dados.sku?.trim()) return { success: false, error: 'Referência é obrigatória' };

  const { error } = await supabase
    .from('produtos')
    .update({
      nome: dados.nome?.trim() || null,
      sku: dados.sku.trim(),
      categoria: dados.categoria?.trim() || null,
      banho: dados.banho?.trim() || null,
      peso: dados.peso || null,
      fabricante: dados.fabricante?.trim() || null,
      imagem_url: dados.imagem_url?.trim() || null,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', produtoId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/produtos');
  return { success: true };
}

export async function deletarProduto(produtoId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', produtoId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dashboard/produtos');
  return { success: true };
}
