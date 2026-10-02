# Arquitetura - Malu Vendas

## Overview

Malu Vendas é uma aplicação **multi-tenant SaaS** com arquitetura moderna:
- **Frontend:** Next.js 16 (TypeScript + React)
- **Backend:** API Routes do Next.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth com JWT

## Diagrama da Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Browser)                 │
│  ┌─────────────────────────────────────────────────┐│
│  │  Next.js App (React Components + TypeScript)    ││
│  │  - Pages (app/)                                 ││
│  │  - Components (components/)                     ││
│  │  - Hooks (custom)                               ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                          ↓ HTTP
┌─────────────────────────────────────────────────────┐
│            NEXT.JS SERVER (Node.js)                 │
│  ┌─────────────────────────────────────────────────┐│
│  │  API Routes (app/api/)                          ││
│  │  - Middleware                                   ││
│  │  - Route Handlers                               ││
│  │  - Database Operations                          ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
                   ↓ Supabase Client SDK
┌─────────────────────────────────────────────────────┐
│              SUPABASE (Cloud)                       │
│  ┌─────────────────────────────────────────────────┐│
│  │  PostgreSQL Database                            ││
│  │  - Tables                                       ││
│  │  - RLS Policies                                 ││
│  │  - Triggers                                     ││
│  │  - Indexes                                      ││
│  ├─────────────────────────────────────────────────┤│
│  │  Auth Server                                    ││
│  │  - JWT Token Management                         ││
│  │  - User Sessions                                ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Estrutura de Pastas

```
malu-vendas/
│
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Layout root
│   ├── page.tsx                 # Home page
│   ├── api/                     # API Routes
│   │   ├── auth/               # Autenticação
│   │   ├── clientes/           # CRUD Clientes
│   │   ├── pedidos/            # CRUD Pedidos
│   │   ├── produtos/           # CRUD Produtos
│   │   └── middleware/         # Middlewares
│   ├── auth/                    # Auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── dashboard/               # Dashboard area
│   │   ├── layout.tsx           # Layout com sidebar
│   │   ├── page.tsx             # Dashboard home
│   │   ├── clientes/
│   │   ├── pedidos/
│   │   ├── produtos/
│   │   └── relatorios/
│   └── globals.css              # CSS global (app router)
│
├── components/                   # Componentes reutilizáveis
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── ChartCard.tsx
│   │   └── RecentOrders.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── icons/
│       ├── LogoIcon.tsx
│       └── ...
│
├── lib/                         # Utilitários
│   ├── supabase.ts             # Clients (browser + server)
│   ├── utils.ts                # Funções auxiliares
│   ├── formatters.ts           # Formatadores
│   └── api-client.ts           # HTTP client (axios)
│
├── types/                       # TypeScript interfaces
│   └── index.ts                # Todos os tipos
│
├── styles/                      # Estilos
│   └── globals.css             # CSS global (app dir)
│
├── public/                      # Arquivos estáticos
│   ├── images/
│   ├── icons/
│   └── logos/
│
├── sql/                         # Database
│   └── schema.sql              # Schema inicial
│
├── .env.local                  # Vars de ambiente (local)
├── .env.example                # Template de vars
├── README.md                   # Documentação
├── SETUP.md                    # Guia de setup
├── ARCHITECTURE.md             # Este arquivo
├── package.json                # Dependências
├── tsconfig.json               # Config TypeScript
├── tailwind.config.ts          # Config Tailwind
├── postcss.config.mjs          # Config PostCSS
└── next.config.ts              # Config Next.js
```

## Fluxo de Dados

### 1. Autenticação

```
Cliente (Browser)
       ↓
   Login Form
       ↓
  Supabase Auth
       ↓
   JWT Token
       ↓
  Armazenar em Storage/Cookie
       ↓
  Autenticado ✓
```

### 2. Requisição de Dados

```
React Component
       ↓
  useEffect hook / useState
       ↓
  API Route (app/api/...)
       ↓
  Supabase Client (auth verificado)
       ↓
  RLS Policy (verificar acesso)
       ↓
  PostgreSQL Query
       ↓
  Retornar dados
       ↓
  Renderizar componente
```

### 3. Escrita de Dados

```
Formulário (Form)
       ↓
  Validação (Client-side)
       ↓
  POST para API Route
       ↓
  Validação (Server-side)
       ↓
  INSERT/UPDATE no Supabase
       ↓
  RLS Policy verifica
       ↓
  Sucesso/Erro
       ↓
  Response para cliente
       ↓
  Atualizar UI
```

## Camadas da Aplicação

### 1. Presentation Layer (Cliente)

**Responsabilidades:**
- Renderizar UI com React
- Capturar eventos do usuário
- Exibir feedback (loading, error, success)
- Gerenciar estado local

**Localização:** `app/`, `components/`

**Exemplo:**
```tsx
// components/auth/LoginForm.tsx
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e) => {
    setLoading(true)
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    // Handle response
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        value={email} 
        onChange={e => setEmail(e.target.value)}
      />
      <button disabled={loading}>Login</button>
    </form>
  )
}
```

### 2. API Layer (Backend)

**Responsabilidades:**
- Autenticar requisição (JWT)
- Validar dados de entrada
- Executar lógica de negócio
- Chamar banco de dados
- Retornar resposta JSON

**Localização:** `app/api/`

**Exemplo:**
```tsx
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Validar entrada
    if (!email || !password) {
      return Response.json({ error: 'Email e senha obrigatórios' }, 
        { status: 400 })
    }
    
    // Autenticar no Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    
    return Response.json({ user: data.user })
  } catch (err) {
    return Response.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

### 3. Data Layer (Banco de Dados)

**Responsabilidades:**
- Armazenar dados
- Validar constraints (RLS)
- Executar triggers
- Manter integridade dos dados

**Localização:** Supabase PostgreSQL

**Exemplo Table:**
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  empresa_id UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

-- RLS Policy
CREATE POLICY usuarios_empresa_policy ON usuarios
  FOR SELECT USING (
    empresa_id = (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    )
  );
```

## Multi-Tenancy

Cada usuário pertence a uma **empresa** (tenant).

### Isolamento de Dados

1. **Database Level (RLS):**
   - Cada table tem política que filtra por `empresa_id`
   - Usuário só vê dados de sua empresa
   - Implementado em nível de banco de dados

2. **Application Level:**
   - API valida `empresa_id` do token
   - Não confia só no cliente

3. **Query Level:**
   - Sempre incluir filtro `empresa_id` nas queries
   - Usar RLS do Supabase

### Exemplo Fluxo Multi-Tenant

```
Usuario A (empresa 1) → Login
         ↓
    Gera JWT com empresa_id = 1
         ↓
    Acessa /api/clientes
         ↓
    Query: SELECT * FROM clientes 
            WHERE empresa_id = 1
         ↓
    RLS Policy valida: ✓
         ↓
    Retorna clientes da empresa 1

Usuario B (empresa 2) → Login
         ↓
    Gera JWT com empresa_id = 2
         ↓
    Tenta acessar mesmo endpoint
         ↓
    Query incluí empresa_id = 2
         ↓
    RLS Policy valida: ✓
         ↓
    Retorna clientes da empresa 2
```

## Segurança

### 1. Autenticação
- Supabase Auth (email/password)
- JWT tokens
- Refresh automático de sessão
- HTTP-only cookies para tokens

### 2. Autorização
- RLS (Row Level Security) em todas as tables
- Validação em nível de banco de dados
- Policies para cada operação (SELECT, INSERT, UPDATE, DELETE)

### 3. Validação
- Client-side (UX)
- Server-side (segurança)
- Constraints no banco (integridade)

### 4. Secrets
- Usar `.env.local` para dados sensíveis
- Incluir no `.gitignore`
- Nunca fazer commit de credenciais
- Service Role Key é server-only

## Performance

### 1. Indexação
- Índices em `empresa_id` (multi-tenancy)
- Índices em `id` (primary keys)
- Índices em `status` (filtros comuns)

### 2. Paginação
- Implementar LIMIT/OFFSET nas queries
- Carregar dados sob demanda
- Usar scroll infinito ou pagination

### 3. Caching
- Usar React Query / SWR para cache de dados
- Validar dados após ações
- Invalidar cache quando necessário

### 4. Lazy Loading
- Carregar componentes sob demanda
- Code splitting com Next.js
- Imagens otimizadas

## Estado da Aplicação

### 1. Global State (Context API ou Zustand)
- Dados do usuário autenticado
- Tema (light/dark)
- Empresa selecionada

### 2. Local State (useState)
- Formulários
- Modais abertos/fechados
- Abas selecionadas

### 3. Server State (React Query / SWR)
- Dados da API
- Cache automático
- Sincronização com servidor

## Exemplo: Criar Nova Feature (CRUD Cliente)

### 1. Adicionar Type

```tsx
// types/index.ts
export interface Cliente {
  id: string
  empresa_id: string
  nome: string
  email: string
  // ... outros campos
}
```

### 2. Criar API Routes

```tsx
// app/api/clientes/route.ts
export async function GET(request: Request) {
  // Listar clientes
}

export async function POST(request: Request) {
  // Criar cliente
}

// app/api/clientes/[id]/route.ts
export async function GET(request: Request) {
  // Detalhe do cliente
}

export async function PATCH(request: Request) {
  // Atualizar cliente
}

export async function DELETE(request: Request) {
  // Deletar cliente
}
```

### 3. Criar Componentes

```tsx
// components/ClienteForm.tsx
export function ClienteForm() {
  // Formulário para criar/editar
}

// components/ClienteList.tsx
export function ClienteList() {
  // Listar clientes
}

// components/ClienteDetail.tsx
export function ClienteDetail({ id }) {
  // Detalhe de um cliente
}
```

### 4. Criar Pages

```tsx
// app/dashboard/clientes/page.tsx
export default function ClientesPage() {
  return <ClienteList />
}

// app/dashboard/clientes/novo/page.tsx
export default function NovoClientePage() {
  return <ClienteForm />
}

// app/dashboard/clientes/[id]/page.tsx
export default function ClienteDetailPage({ params }) {
  return <ClienteDetail id={params.id} />
}
```

## Testing

### Unit Tests
- Jest + React Testing Library
- Testar componentes isolados
- Testar funções utilitárias

### Integration Tests
- Testar fluxos completos
- Testar API com banco real

### E2E Tests
- Cypress ou Playwright
- Testar do navegador do usuário

## Deployment

### Opções:
1. **Vercel** (recomendado para Next.js)
2. **Netlify**
3. **AWS**
4. **Self-hosted (VPS)**

### Passos:
1. Push para GitHub
2. Conectar ao Vercel/Netlify
3. Adicionar vars de ambiente
4. Deploy automático na cada push

---

**Versão:** 1.0.0
**Atualizado:** Outubro 2024
