/**
 * Types do projeto Malu Vendas
 */

// Usuario/Autenticação
export interface Usuario {
  id: string
  email: string
  nome: string
  avatar_url?: string
  empresa_id: string
  role: 'admin' | 'vendedor' | 'gerente'
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Empresa
export interface Empresa {
  id: string
  nome: string
  cnpj: string
  telefone: string
  email: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  logo_url?: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Cliente
export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  email: string
  telefone: string
  cpf_cnpj: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  tipo: 'pessoa_fisica' | 'pessoa_juridica'
  data_cadastro: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Produto
export interface Produto {
  id: string
  empresa_id: string
  nome: string
  descricao: string
  sku: string
  preco: number
  custo: number
  estoque: number
  categoria: string
  imagem_url?: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Pedido
export interface Pedido {
  id: string
  empresa_id: string
  cliente_id: string
  numero_pedido: string
  data_pedido: string
  data_entrega?: string
  status: 'pendente' | 'confirmado' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado'
  valor_total: number
  desconto: number
  observacoes?: string
  criado_em: string
  atualizado_em: string
}

// Item do Pedido
export interface ItemPedido {
  id: string
  pedido_id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  criado_em: string
}

// Encartador (vendedor externo)
export interface Encartador {
  id: string
  empresa_id: string
  nome: string
  email: string
  telefone: string
  cnpj: string
  comissao_percentual: number
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Fornecedor
export interface Fornecedor {
  id: string
  empresa_id: string
  nome: string
  email: string
  telefone: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// Dashboard Stats
export interface DashboardStats {
  total_clientes: number
  total_pedidos: number
  pedidos_pendentes: number
  receita_mes: number
  receita_media_pedido: number
  produtos_baixo_estoque: number
}
