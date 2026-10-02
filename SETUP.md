# Guia Completo de Setup - Malu Vendas

## 1. Ambiente Local

### Verificar Node.js
```bash
node --version  # Deve ser v18+ ou v20+
npm --version   # Deve ser v9+
```

Se não tiver instalado, baixe em https://nodejs.org/

### Instalar Dependências
```bash
cd C:\Projetos_SaaS\malu-vendas
npm install
```

Isso instalará:
- Next.js 16
- TypeScript
- Tailwind CSS
- Supabase JS Client
- Axios
- Lucide React Icons

## 2. Criar Conta Supabase

### Passo 1: Acessar Supabase
1. Vá para https://supabase.com
2. Clique em "Sign Up"
3. Use seu email: **aichagasconsultoria@gmail.com**
4. Defina uma senha segura
5. Confirme o email

### Passo 2: Criar Projeto
1. No dashboard, clique em "New project"
2. Preencha assim:
   - **Name:** malu-vendas
   - **Database Password:** Escolha uma senha forte (salve em lugar seguro!)
   - **Region:** South America (São Paulo)
3. Clique em "Create new project"
4. Aguarde 3-5 minutos pela inicialização

## 3. Obter Credenciais Supabase

### Passo 1: Abrir Settings
1. No projeto Supabase criado, clique em **Settings** (rodinha no canto inferior esquerdo)
2. Vá para **API**

### Passo 2: Copiar URLs e Keys
Você verá uma tela com as credenciais. Copie:

**NEXT_PUBLIC_SUPABASE_URL:**
- Procure por "Project URL"
- Formato: `https://seu-projeto.supabase.co`
- Botão copiar está à direita

**NEXT_PUBLIC_SUPABASE_ANON_KEY:**
- Procure por "anon public"
- Clique em "Reveal" se necessário
- Copie a chave longa

**SUPABASE_SERVICE_ROLE_KEY:**
- Procure por "service_role"
- Clique em "Reveal" 
- Copie a chave (cuidado! Não compartilhe isso!)

## 4. Configurar Variáveis de Ambiente

### Arquivo .env.local
1. Abra o arquivo `C:\Projetos_SaaS\malu-vendas\.env.local`
2. Preencha com as credenciais copiadas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

3. Salve o arquivo

**⚠️ IMPORTANTE:**
- Nunca commit o `.env.local` no git
- Já está no `.gitignore` (arquivo que ignora)
- Mantenha as credenciais privadas

## 5. Criar Tabelas no Banco

### Passo 1: Abrir SQL Editor
1. No Supabase, clique em **SQL Editor** (esquerda)
2. Clique em "New Query"

### Passo 2: Copiar e Executar Schema
1. Abra o arquivo `sql/schema.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em "Run" (canto direito em cima)
5. Aguarde a conclusão (deve mostrar "Success")

**O que foi criado:**
- 8 tabelas principais (usuarios, empresas, clientes, etc)
- Índices para performance
- Row Level Security (RLS) para segurança
- Triggers para atualizar timestamps
- Views para consultas úteis

### Passo 3: Verificar Tabelas
1. Clique em **Table Editor** (esquerda)
2. Você deve ver as 8 tabelas criadas
3. Se não ver, volte ao SQL e verifique se não teve erro

## 6. Iniciar o Servidor

```bash
cd C:\Projetos_SaaS\malu-vendas
npm run dev
```

Você verá algo como:
```
  ▲ Next.js 16.3.8
  - Local:        http://localhost:3000
  - Environments: .env.local
```

Abra http://localhost:3000 no navegador.

## 7. Testar a Conexão

### Na Home Page
1. Você deve ver a página "Malu Vendas" com:
   - Navbar com botões Login/Cadastro
   - Hero section com features
   - Cards de funcionalidades

2. Clique em "Comece Grátis" (button azul)
   - Deve levar para página de signup (ainda não implementada)
   - Isso confirma que o Next.js está funcionando

### Testar Supabase Connection
1. Abra o DevTools do navegador (F12)
2. Vá para Console (aba Console)
3. Se não houver erros vermelhos sobre Supabase, está tudo bem

## Próximos Passos

### Tarefas de Desenvolvimento
1. [ ] Criar página de autenticação (Login/Signup)
2. [ ] Implementar dashboard
3. [ ] Criar CRUD de Clientes
4. [ ] Criar CRUD de Pedidos
5. [ ] Criar CRUD de Produtos

### Estrutura Recomendada para Nova Feature
```
app/
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── dashboard/
│   ├── layout.tsx
│   ├── page.tsx (home/overview)
│   ├── clientes/
│   │   ├── page.tsx (listagem)
│   │   ├── [id]/
│   │   │   └── page.tsx (detalhe)
│   │   └── novo/
│   │       └── page.tsx (criar)
│   └── pedidos/
│       ├── page.tsx
│       └── ...
```

## Troubleshooting

### Erro: "NEXT_PUBLIC_SUPABASE_URL is not defined"
**Causa:** Arquivo `.env.local` não tem as variáveis
**Solução:** 
1. Verifique se `.env.local` existe
2. Verifique se tem as 3 variáveis preenchidas
3. Reinicie o servidor (Ctrl+C e npm run dev)

### Erro: "Unable to connect to Supabase"
**Causa:** URL ou credenciais incorretas
**Solução:**
1. Copie a URL novamente do Supabase Settings
2. Certifique-se que não tem espaços no início/fim
3. Verifique o nome do projeto (deve ser 'malu-vendas')

### Erro: "Cannot POST /api/..."
**Causa:** API routes ainda não implementadas
**Solução:** Crie as rotas conforme necessário em `app/api/`

### Tabelas não aparecem no Supabase
**Causa:** Schema não foi executado corretamente
**Solução:**
1. Verifique se não tinha erro na execução do SQL
2. Tente copiar apenas um bloco de CREATE TABLE
3. Verifique se RLS está habilitado (deve estar)

## Variáveis de Ambiente Explicadas

| Variável | Explicação | Confidencial |
|----------|-----------|---|
| NEXT_PUBLIC_SUPABASE_URL | URL do projeto Supabase | Não (público) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave pública anon | Não (público) |
| SUPABASE_SERVICE_ROLE_KEY | Chave admin do servidor | **SIM** |
| NEXT_PUBLIC_API_URL | URL da API local | Não |

**Nota:** "NEXT_PUBLIC_" significa que será incluído no navegador (público). Nunca coloque dados sensíveis nesses!

## Documentação Útil

- **TypeScript:** O projeto usa TypeScript. Tipos em `types/index.ts`
- **Supabase:** Documentação em https://supabase.com/docs
- **Next.js:** Docs em https://nextjs.org/docs
- **Tailwind:** Docs em https://tailwindcss.com/docs

## Contato

**Email:** aichagasconsultoria@gmail.com

---

**Versão:** 1.0.0
**Última atualização:** Outubro 2024
