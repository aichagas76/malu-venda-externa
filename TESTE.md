# 🧪 Guia de Testes - MALU Vendas

## ✅ Status da Aplicação

- Dashboard criado ✅
- Páginas CRUD estruturadas ✅
- Autenticação Supabase integrada ✅
- Banco de dados com dados de teste ✅

## 📝 Credenciais de Teste

### Opção 1: Criar via Supabase Dashboard
1. Vá para: https://supabase.com/dashboard/project/odskpprjpnaooicsshex/auth/users
2. Clique "+ Add user"
3. Crie com:
   - Email: `vendedor@test.com`
   - Password: `Test@123456`

### Opção 2: Desabilitar Confirm Email
1. Vá para: https://supabase.com/dashboard/project/odskpprjpnaooicsshex/settings/auth
2. Procure "Confirm email"
3. Desabilite a opção
4. Tente signup novamente no app

## 🧭 Rotas de Teste

```
Login:     http://localhost:3000/login
Signup:    http://localhost:3000/signup
Dashboard: http://localhost:3000/dashboard (protegido)
Clientes:  http://localhost:3000/dashboard/clientes
Produtos:  http://localhost:3000/dashboard/produtos
Pedidos:   http://localhost:3000/dashboard/pedidos
```

## 🎯 Dados de Teste no Banco

### Empresa
- Nome: Empresa Teste
- CNPJ: 12345678000190

### Clientes (2)
- Cliente A (PF)
- Cliente B (PJ)

### Produtos (2)
- Produto 1: SKU001 - R$ 99,90
- Produto 2: SKU002 - R$ 149,90

## ⏳ Próximos Passos

1. Confirmar acesso ao Dashboard
2. Implementar CRUD completo (POST/PUT/DELETE)
3. Adicionar estilos Tailwind
4. Implementar cálculos de pedidos
5. Gerar PDFs
6. Enviar emails

---

**Precisa de ajuda?** Avisé qual erro está recebendo!
