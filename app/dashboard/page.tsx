import { Users, Package, ShoppingCart, Rocket } from 'lucide-react';
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
      icon: Users,
    },
    {
      title: 'Produtos',
      value: produtosResult.count || 0,
      icon: Package,
    },
    {
      title: 'Pedidos',
      value: pedidosResult.count || 0,
      icon: ShoppingCart,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--texto)',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          👋 Bem-vindo!
        </h1>
        <p style={{ fontSize: 'var(--fs-destaque)', color: 'var(--texto-suave)' }}>
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
              backgroundColor: 'var(--superficie)',
              borderRadius: 'var(--raio-lg)',
              boxShadow: 'var(--sombra-sutil)',
              padding: '1.5rem',
              transition: 'all 0.2s ease',
              border: '1px solid var(--borda)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{
                  fontSize: 'var(--fs-pequeno)',
                  color: 'var(--texto-suave)',
                  fontWeight: '600',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  {stat.title}
                </p>
                <p style={{
                  fontSize: 'var(--fs-numero)',
                  fontWeight: '700',
                  color: 'var(--texto)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1
                }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                backgroundColor: 'var(--marca)',
                color: 'var(--ouro-claro)',
                borderRadius: 'var(--raio-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px'
              }}>
                <stat.icon size={24} strokeWidth={1.75} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--marca)',
        borderRadius: 'var(--raio-lg)',
        padding: '2rem',
        color: 'white',
        borderTop: '3px solid var(--ouro)',
        boxShadow: 'var(--sombra-media)'
      }}>
        <h2 style={{
          fontSize: 'var(--fs-titulo)',
          fontWeight: '700',
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem'
        }}>
          <Rocket size={22} strokeWidth={1.75} style={{ color: 'var(--ouro-claro)' }} aria-hidden="true" /> Próximos Passos
        </h2>
        <p style={{ fontSize: 'var(--fs-corpo)', marginBottom: '1.5rem', opacity: '0.85' }}>
          Comece gerenciando seus dados. Use o menu lateral para acessar cada módulo.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--raio-md)' }}>
            <div style={{ marginBottom: '0.5rem', color: 'var(--ouro-claro)' }}><Users size={20} strokeWidth={1.75} aria-hidden="true" /></div>
            <div style={{ fontWeight: '600' }}>Clientes</div>
            <div style={{ fontSize: 'var(--fs-pequeno)', opacity: '0.75' }}>Organize contatos</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--raio-md)' }}>
            <div style={{ marginBottom: '0.5rem', color: 'var(--ouro-claro)' }}><Package size={20} strokeWidth={1.75} aria-hidden="true" /></div>
            <div style={{ fontWeight: '600' }}>Produtos</div>
            <div style={{ fontSize: 'var(--fs-pequeno)', opacity: '0.75' }}>Gerencie inventário</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--raio-md)' }}>
            <div style={{ marginBottom: '0.5rem', color: 'var(--ouro-claro)' }}><ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" /></div>
            <div style={{ fontWeight: '600' }}>Pedidos</div>
            <div style={{ fontSize: 'var(--fs-pequeno)', opacity: '0.75' }}>Acompanhe vendas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
