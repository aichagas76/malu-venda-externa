import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Cria uma instância do cliente Supabase para uso no navegador
 * Usado em componentes client-side e hooks
 */
export const createBrowserClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Cliente Supabase singleton para uso no navegador
 * Evita múltiplas instâncias desnecessárias
 */
export const supabaseBrowser = createBrowserClient()

/**
 * Cria uma instância do cliente Supabase para uso no servidor
 * Usado em Server Components e Route Handlers
 */
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

export type Database = any // Será tipado quando o schema for criado
