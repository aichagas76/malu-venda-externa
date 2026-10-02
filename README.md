# Malu Vendas - Sistema ASaaS de Gestão de Vendas

Plataforma SaaS completa para gerenciar clientes, pedidos, produtos e equipe de vendas em nuvem.

## Stack Tecnológico

- **Frontend:** Next.js 16 com TypeScript e Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **UI Components:** Lucide React para ícones

## Instalação Rápida

```bash
cd C:\Projetos_SaaS\malu-vendas
npm install
npm run dev
```

Acesse http://localhost:3000

## Configuração Supabase

### Passo 1: Criar Conta
Acesse https://supabase.com e crie uma conta com seu email.

### Passo 2: Criar Projeto
- Nome: malu-vendas
- Region: South America (São Paulo)
- Defina uma senha forte

### Passo 3: Copiar Credenciais
Em Settings → API, copie:
- Project URL → NEXT_PUBLIC_SUPABASE_URL
- anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY
- service_role secret → SUPABASE_SERVICE_ROLE_KEY

### Passo 4: Preencher .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Passo 5: Executar SQL
1. Abra SQL Editor no Supabase
2. Copie o conteúdo de `sql/schema.sql`
3. Clique em "Run"

## Estrutura do Projeto

```
malu-vendas/
├── app/
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Home page
│   └── api/               # API Routes
├── components/            # Componentes reutilizáveis
├── lib/
│   └── supabase.ts       # Cliente Supabase
├── types/
│   └── index.ts          # TypeScript interfaces
├── styles/
│   └── globals.css       # Estilos globais
├── public/               # Assets estáticos
└── sql/
    └── schema.sql        # Schema do banco de dados
```

## Tipos de Dados

### Empresas
Cada cliente SaaS tem uma empresa.

### Usuários
Usuários da empresa com roles: admin, vendedor, gerente.

### Clientes
Clientes dos usuários (PF ou PJ).

### Produtos
Produtos vendidos pela empresa.

### Pedidos
Pedidos dos clientes com itens.

### Encartadores & Fornecedores
Gestão de parceiros externos.

## Features Prontas para Implementar

### MVP (Curto Prazo)
- [ ] Autenticação (Login/Signup)
- [ ] Dashboard com estatísticas
- [ ] CRUD Clientes
- [ ] CRUD Pedidos
- [ ] CRUD Produtos
- [ ] Listagem com paginação

### Médio Prazo
- [ ] Relatórios Analíticos
- [ ] Sistema de Comissões
- [ ] Exportação (PDF/Excel)
- [ ] Notificações por email
- [ ] Upload de imagens

### Longo Prazo
- [ ] Mobile App (React Native)
- [ ] API pública
- [ ] Webhooks
- [ ] Chat em tempo real

## Scripts Disponíveis

```bash
npm run dev      # Iniciar servidor de desenvolvimento
npm run build    # Build para produção
npm run start    # Iniciar servidor de produção
npm run lint     # Executar linter
```

## Segurança

- RLS (Row Level Security) habilitado em todas as tabelas
- Usuários só acessam dados de sua empresa
- Auditoria de operações
- JWT tokens seguros

## Recursos Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

## Contato

Email: aichagasconsultoria@gmail.com

---

**Versão:** 1.0.0 - MVP
**Status:** Em Desenvolvimento
**Criado:** 2024
