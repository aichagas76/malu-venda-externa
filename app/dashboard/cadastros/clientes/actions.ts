'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const EMPRESA_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function listarClientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', EMPRESA_ID)
    .order('nome');

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

export async function criarCliente(nome: string, email: string, telefone: string, endereco: string) {
  const supabase = await createClient();

  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      empresa_id: EMPRESA_ID,
      nome: nome.trim(),
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
      data_cadastro: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/clientes');
  return { success: true, data };
}

export async function atualizarCliente(clienteId: string, nome: string, email: string, telefone: string, endereco: string) {
  const supabase = await createClient();

  if (!nome.trim()) return { success: false, error: 'Nome é obrigatório' };

  const { error } = await supabase
    .from('clientes')
    .update({
      nome: nome.trim(),
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
    })
    .eq('id', clienteId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/clientes');
  return { success: true };
}

export async function deletarCliente(clienteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clienteId)
    .eq('empresa_id', EMPRESA_ID);

  if (error) return { success: false, error: error.message };
  revalidatePath('/dashboard/cadastros/clientes');
  return { success: true };
}
