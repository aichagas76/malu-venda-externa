import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Buscar resumos do banco
  const [clientesResult, produtosResult, pedidosResult] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact' }),
    supabase.from('produtos').select('id', { count: 'exact' }),
    supabase.from('pedidos').select('id', { count: 'exact' }),
  ]);

  const stats = [
    {
      title: 'Clientes',
      value: clientesResult.count || 0,
      icon: '👥',
      color: '#6366f1',
    },
    {
      title: 'Produtos',
      value: produtosResult.count || 0,
      icon: '📦',
      color: '#10b981',
    },
    {
      title: 'Pedidos',
      value: pedidosResult.count || 0,
      icon: '🛒',
      color: '#8b5cf6',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          👋 Bem-vindo!
        </h1>
        <p style={{ fontSize: '1rem', color: '#64748b' }}>
          Gerencie suas vendas com eficiência e inteligência
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="stat-card"
            style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              padding: '1.5rem',
              transition: 'all 0.3s ease',
              border: '1px solid #e2e8f0',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  fontWeight: '500',
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {stat.title}
                </p>
                <p style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                backgroundColor: stat.color,
                color: 'white',
                fontSize: '2.5rem',
                padding: '1rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '70px',
                height: '70px'
              }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #155e75 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        color: 'white',
        boxShadow: '0 12px 32px rgba(8, 145, 178, 0.25)'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1rem'
        }}>
          🚀 Próximos Passos
        </h2>
        <p style={{ fontSize: '1rem', marginBottom: '1.5rem', opacity: '0.9' }}>
          Comece gerenciando seus dados. Use o menu lateral para acessar cada módulo.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontWeight: '600' }}>Clientes</div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Organize contatos</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📦</div>
            <div style={{ fontWeight: '600' }}>Produtos</div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Gerencie inventário</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🛒</div>
            <div style={{ fontWeight: '600' }}>Pedidos</div>
            <div style={{ fontSize: '0.875rem', opacity: '0.8' }}>Acompanhe vendas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
