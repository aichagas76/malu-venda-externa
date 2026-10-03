'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function criarCliente(formData: FormData) {
  const supabase = await createClient();

  const nome = formData.get('nome') as string;

  if (!nome || !nome.trim()) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  const data = {
    nome: nome.trim(),
    empresa_id: '550e8400-e29b-41d4-a716-446655440000',
  };

  const { error, data: inserted } = await supabase
    .from('clientes')
    .insert([data])
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/clientes');
  return { success: true, data: inserted };
}

export async function deletarCliente(clienteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clienteId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/clientes');
  return { success: true };
}

export async function listarClientes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clientes')
    .select('id, nome')
    .order('nome', { ascending: true });

  if (error) {
    return { success: false, error: error.message, data: [] };
  }

  return { success: true, data: data || [] };
}

export async function editarCliente(clienteId: string, nome: string) {
  const supabase = await createClient();

  if (!nome || !nome.trim()) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  const { error, data } = await supabase
    .from('clientes')
    .update({ nome: nome.trim() })
    .eq('id', clienteId)
    .select();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/clientes');
  return { success: true, data };
}
