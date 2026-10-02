-- Schema do banco de dados Malu Vendas
-- Execute este script no Supabase para criar as tabelas

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  empresa_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'vendedor', 'gerente')),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela: empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  logo_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cpf_cnpj VARCHAR(20),
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pessoa_fisica', 'pessoa_juridica')),
  data_cadastro DATE DEFAULT CURRENT_DATE,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela: produtos
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  sku VARCHAR(50) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  custo DECIMAL(10, 2),
  estoque INTEGER DEFAULT 0,
  categoria VARCHAR(100),
  imagem_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  UNIQUE (empresa_id, sku)
);

-- Tabela: pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  cliente_id UUID NOT NULL,
  numero_pedido VARCHAR(50) NOT NULL,
  data_pedido TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_entrega TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'em_separacao', 'enviado', 'entregue', 'cancelado')),
  valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10, 2) DEFAULT 0,
  observacoes TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  UNIQUE (empresa_id, numero_pedido)
);

-- Tabela: itens_pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT
);

-- Tabela: encartadores
CREATE TABLE IF NOT EXISTS encartadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cnpj VARCHAR(20) NOT NULL,
  comissao_percentual DECIMAL(5, 2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela: fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cnpj VARCHAR(20) NOT NULL,
  endereco VARCHAR(500),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabela de auditoria: logs_auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL,
  empresa_id UUID NOT NULL,
  tabela VARCHAR(100),
  acao VARCHAR(50) NOT NULL,
  descricao TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Índices para melhorar performance
CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresa_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_produtos_empresa_id ON produtos(empresa_id);
CREATE INDEX idx_pedidos_empresa_id ON pedidos(empresa_id);
CREATE INDEX idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_itens_pedido_pedido_id ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_produto_id ON itens_pedido(produto_id);
CREATE INDEX idx_encartadores_empresa_id ON encartadores(empresa_id);
CREATE INDEX idx_fornecedores_empresa_id ON fornecedores(empresa_id);
CREATE INDEX idx_logs_auditoria_usuario_id ON logs_auditoria(usuario_id);
CREATE INDEX idx_logs_auditoria_empresa_id ON logs_auditoria(empresa_id);

-- RLS (Row Level Security) - Políticas básicas
-- Enable RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE encartadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Política: usuários só veem usuários de sua empresa
CREATE POLICY usuarios_empresa_policy ON usuarios
  FOR SELECT USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Política: usuários só veem clientes de sua empresa
CREATE POLICY clientes_empresa_policy ON clientes
  FOR SELECT USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Política: usuários só veem produtos de sua empresa
CREATE POLICY produtos_empresa_policy ON produtos
  FOR SELECT USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Política: usuários só veem pedidos de sua empresa
CREATE POLICY pedidos_empresa_policy ON pedidos
  FOR SELECT USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

-- Views úteis
CREATE VIEW view_pedidos_com_cliente AS
SELECT
  p.id,
  p.numero_pedido,
  p.data_pedido,
  p.status,
  p.valor_total,
  c.nome as cliente_nome,
  c.email as cliente_email
FROM pedidos p
LEFT JOIN clientes c ON p.cliente_id = c.id;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
CREATE TRIGGER trigger_usuarios_timestamp
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_empresas_timestamp
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_clientes_timestamp
  BEFORE UPDATE ON clientes
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_produtos_timestamp
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_pedidos_timestamp
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_encartadores_timestamp
  BEFORE UPDATE ON encartadores
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_fornecedores_timestamp
  BEFORE UPDATE ON fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_timestamp();
