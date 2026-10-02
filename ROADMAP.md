# Roadmap - Malu Vendas

Plano de desenvolvimento estruturado em fases para o MVP até produção.

## Fase 1: MVP (4-6 semanas)

Objetivo: Ter um produto funcional mínimo que demonstre o conceito.

### Sprint 1: Autenticação (1-2 semanas)

- [ ] Criar página de Login
  - Integrar Supabase Auth
  - Validar credenciais
  - Gerenciar token JWT
  - Redirecionar após login

- [ ] Criar página de Signup
  - Formulário de registro
  - Validar email
  - Confirmar email
  - Criar empresa para novo usuário

- [ ] Criar page Protected Routes
  - Middleware para verificar autenticação
  - Redirecionar não autenticados
  - Guardar rota anterior para redirect

**Entregáveis:**
```
✓ app/auth/login/page.tsx
✓ app/auth/signup/page.tsx
✓ middleware.ts
✓ components/auth/LoginForm.tsx
✓ components/auth/SignupForm.tsx
✓ lib/auth-utils.ts
```

### Sprint 2: Dashboard Básica (1-2 semanas)

- [ ] Criar layout dashboard
  - Sidebar com menu
  - Navbar com usuário
  - Main content area
  - Responsive design

- [ ] Criar página home/overview
  - Cards com estatísticas
  - Gráficos simples
  - Últimos pedidos/clientes
  - Cards de KPIs

- [ ] Adicionar logout
  - Limpar token
  - Redirecionar para login

**Entregáveis:**
```
✓ app/dashboard/layout.tsx
✓ app/dashboard/page.tsx
✓ components/layout/Sidebar.tsx
✓ components/layout/Navbar.tsx
✓ components/dashboard/StatCard.tsx
✓ components/dashboard/RecentOrders.tsx
```

### Sprint 3: CRUD Clientes (1-2 semanas)

- [ ] API Routes
  - GET /api/clientes (listar)
  - POST /api/clientes (criar)
  - GET /api/clientes/[id] (detalhe)
  - PATCH /api/clientes/[id] (editar)
  - DELETE /api/clientes/[id] (deletar)

- [ ] Componentes
  - ClienteList (com paginação)
  - ClienteForm (criar/editar)
  - ClienteDetail
  - ClienteTable

- [ ] Pages
  - /dashboard/clientes
  - /dashboard/clientes/novo
  - /dashboard/clientes/[id]
  - /dashboard/clientes/[id]/editar

- [ ] Validações
  - Client-side (UX)
  - Server-side (segurança)

**Entregáveis:**
```
✓ app/api/clientes/route.ts
✓ app/api/clientes/[id]/route.ts
✓ app/dashboard/clientes/page.tsx
✓ app/dashboard/clientes/novo/page.tsx
✓ app/dashboard/clientes/[id]/page.tsx
✓ components/clientes/ClienteForm.tsx
✓ components/clientes/ClienteList.tsx
✓ components/clientes/ClienteTable.tsx
```

### Sprint 4: CRUD Pedidos (1-2 semanas)

Similar ao Sprint 3, mas para Pedidos.

**Entregáveis:**
```
✓ app/api/pedidos/route.ts
✓ app/api/pedidos/[id]/route.ts
✓ app/dashboard/pedidos/page.tsx
✓ app/dashboard/pedidos/novo/page.tsx
✓ app/dashboard/pedidos/[id]/page.tsx
✓ components/pedidos/PedidoForm.tsx
✓ components/pedidos/PedidoList.tsx
```

### Sprint 5: CRUD Produtos (1 semana)

Simpler que Clientes. Implementação rápida.

**Entregáveis:**
```
✓ app/api/produtos/route.ts
✓ app/api/produtos/[id]/route.ts
✓ app/dashboard/produtos/page.tsx
✓ app/dashboard/produtos/novo/page.tsx
✓ components/produtos/ProdutoForm.tsx
✓ components/produtos/ProdutoList.tsx
```

### Testes & Refinamento (1 semana)

- [ ] Testar fluxos completos
- [ ] Ajustar UX
- [ ] Corrigir bugs
- [ ] Otimizar performance

---

## Fase 2: Polishing & Features (3-4 semanas)

Melhorar UX e adicionar features importantes.

### Sprint 6: Melhorias de UX

- [ ] Toasts de notificação
- [ ] Loading states melhorados
- [ ] Confirmações de ação destrutiva
- [ ] Error boundaries
- [ ] Skeleton loaders

**Tecnologias:**
- React Hot Toast ou Sonner
- React Spinners

### Sprint 7: Relatórios Básicos

- [ ] Gráfico de vendas por mês
- [ ] Gráfico de clientes adicionados
- [ ] Tabela de pedidos com filtros
- [ ] Exportar dados em CSV

**Tecnologias:**
- Recharts ou Chart.js
- React CSV

### Sprint 8: Gerenciamento de Usuários

- [ ] Listar usuários da empresa
- [ ] Convidar novos usuários
- [ ] Gerenciar roles (admin/vendedor)
- [ ] Deletar usuários

**Entregáveis:**
```
✓ app/dashboard/usuarios/page.tsx
✓ app/api/usuarios/route.ts
✓ components/usuarios/UsuarioList.tsx
```

### Sprint 9: Configurações da Empresa

- [ ] Editar dados da empresa
- [ ] Fazer upload de logo
- [ ] Gerenciar plano/assinatura
- [ ] Configurações gerais

**Entregáveis:**
```
✓ app/dashboard/configuracoes/page.tsx
✓ app/api/empresas/[id]/route.ts
```

### Sprint 10: Busca & Filtros Avançados

- [ ] Implementar busca global
- [ ] Filtros nas listagens
- [ ] Ordenação
- [ ] Salvar filtros favoritos

---

## Fase 3: Produção & Escala (Contínuo)

### Deployment

- [ ] Configurar Vercel
- [ ] Setup domain
- [ ] Configure DNS
- [ ] HTTPS certificado

### Monitoramento

- [ ] Sentry para error tracking
- [ ] Google Analytics
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Otimizações

- [ ] Database query optimization
- [ ] Image optimization
- [ ] Code splitting
- [ ] Caching strategy

### Segurança

- [ ] Rate limiting
- [ ] CORS configuration
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

### Features de Longo Prazo

- [ ] Sistema de comissões
- [ ] Integração de pagamento
- [ ] Mobile app (React Native)
- [ ] API pública (REST)
- [ ] Webhooks
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Chat em tempo real
- [ ] Importação bulk de clientes
- [ ] Agendamento de tarefas

---

## Prioridades por Fase

### MVP (Essencial)
1. Autenticação
2. Dashboard básica
3. CRUD Clientes
4. CRUD Pedidos
5. CRUD Produtos

### Polishing (Importante)
1. Melhorias UX
2. Relatórios
3. Gerenciamento de usuários
4. Configurações

### Escala (Nice-to-have)
1. Integrações
2. APIs públicas
3. Mobile app
4. Features avançadas

---

## Métricas de Sucesso

### MVP
- Usuários conseguem fazer login
- Usuários conseguem criar clientes
- Usuários conseguem criar pedidos
- Dashboard mostra dados corretos
- Sem erros críticos

### Produção
- 99.9% uptime
- < 2s load time
- < 500ms API response
- 100% test coverage (crítico)
- 0 security vulnerabilities

---

## Timeline Estimado

| Fase | Duração | Fim Estimado |
|------|---------|---|
| MVP | 4-6 semanas | Dezembro 2024 |
| Polishing | 3-4 semanas | Janeiro 2025 |
| Produção | Contínuo | Fevereiro 2025+ |

---

## Checklist Final MVP

- [ ] Todos os testes passando
- [ ] Documentação completa
- [ ] README atualizado
- [ ] SETUP.md funcional
- [ ] Nenhum console error
- [ ] RLS policies testadas
- [ ] Backup database configurado
- [ ] Staging environment
- [ ] Production environment
- [ ] Email configurado
- [ ] Monitoring ativo

---

**Versão:** 1.0.0
**Atualizado:** Outubro 2024
