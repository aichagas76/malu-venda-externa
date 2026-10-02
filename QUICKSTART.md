# Quick Start - Malu Vendas

**Quer começar rápido? Siga este guia em 10 minutos!**

## 1. Clonar/Acessar o Projeto

```bash
cd C:\Projetos_SaaS\malu-vendas
```

## 2. Instalar Dependências (já instaladas)

```bash
npm install  # Se precisar reinstalar
```

## 3. Configurar Supabase

### 3.1 Criar Conta (5 minutos)
- Acesse https://supabase.com
- Sign Up com seu email
- Confirme o email

### 3.2 Criar Projeto (3 minutos)
- Name: `malu-vendas`
- Region: `South America (São Paulo)`
- Password: Escolha uma forte

### 3.3 Copiar Credenciais

No Supabase → Settings → API:

```bash
# Copie estes valores:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3.4 Preencher .env.local

Abra `C:\Projetos_SaaS\malu-vendas\.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3.5 Executar Schema SQL (2 minutos)

1. Abra Supabase → SQL Editor
2. Clique "New Query"
3. Copie TODO o arquivo `sql/schema.sql`
4. Cole no editor
5. Clique "Run"
6. Aguarde "Success"

## 4. Iniciar Servidor

```bash
npm run dev
```

Deve aparecer:
```
▲ Next.js 16.3.8
  - Local:        http://localhost:3000
```

## 5. Abrir no Navegador

```
http://localhost:3000
```

Você deve ver a **Home Page** com:
- Navbar com Login/Cadastro
- Hero section
- Features
- Call-to-action

## 6. Testar Conexão

### 6.1 Verificar Supabase Connection
1. Abra DevTools (F12)
2. Console (aba)
3. Não deve ter erros vermelhos

### 6.2 Clicar em "Comece Grátis"
- Deve levar a página de signup (ainda não implementada)
- Mostra que o Next.js está funcionando

## 7. Próximas Tarefas

### Implementar Autenticação (1-2 dias)
```bash
# Criar páginas
mkdir -p app/auth/login
mkdir -p app/auth/signup
# Criar componentes em components/auth/
```

### Implementar Dashboard (1-2 dias)
```bash
# Criar layout
app/dashboard/layout.tsx
app/dashboard/page.tsx
# Criar componentes em components/dashboard/
```

### Implementar CRUD Clientes (2-3 dias)
```bash
# Criar API routes
app/api/clientes/route.ts
app/api/clientes/[id]/route.ts
# Criar páginas e componentes
```

## 8. Struktura de Pastas Principais

```
malu-vendas/
├── app/              # Pages e API
├── components/       # Componentes reutilizáveis
├── lib/             # Utilitários
├── types/           # TypeScript
├── styles/          # CSS
└── sql/             # Database scripts
```

## 9. Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm run start

# Linting
npm run lint

# Type check
npx tsc --noEmit
```

## 10. Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `.env.local` | **Variáveis de ambiente (copiar credenciais aqui)** |
| `README.md` | Documentação geral |
| `SETUP.md` | Guia detalhado de setup |
| `ARCHITECTURE.md` | Arquitetura da aplicação |
| `ROADMAP.md` | Plano de desenvolvimento |
| `sql/schema.sql` | Schema do banco (executar no Supabase) |
| `types/index.ts` | Tipos TypeScript |
| `lib/supabase.ts` | Cliente Supabase |

## Troubleshooting Rápido

### "Cannot find module..."
```bash
npm install
```

### "NEXT_PUBLIC_SUPABASE_URL is not defined"
1. Verifique `.env.local` existe
2. Verifique tem as 3 variáveis preenchidas
3. Reinicie: `Ctrl+C` e `npm run dev`

### "Cannot connect to Supabase"
1. Verifique a URL (copie novamente)
2. Verifique a chave anon
3. Teste no Supabase Dashboard

### Erro de RLS
- Verifique se schema foi executado
- Verifique se usuário está autenticado
- Verifique políticas em Supabase

## Documentação Completa

Quer aprender mais?

- **Setup Detalhado:** `SETUP.md`
- **Arquitetura:** `ARCHITECTURE.md`
- **Roadmap:** `ROADMAP.md`
- **Next.js:** https://nextjs.org/docs
- **Supabase:** https://supabase.com/docs
- **Tailwind:** https://tailwindcss.com/docs

## Stack Tecnológico

```
Frontend:    Next.js 16 + TypeScript + React + Tailwind
Backend:     Next.js API Routes
Database:    Supabase (PostgreSQL)
Auth:        Supabase Auth (JWT)
```

## Próximas Features

Ordem recomendada:
1. Login/Signup (autenticação)
2. Dashboard básica (overview)
3. CRUD Clientes
4. CRUD Pedidos
5. CRUD Produtos

Ver `ROADMAP.md` para detalhes.

---

**Status:** MVP Iniciado
**Versão:** 1.0.0
**Email:** aichagasconsultoria@gmail.com

**Pronto para começar!** 🚀
