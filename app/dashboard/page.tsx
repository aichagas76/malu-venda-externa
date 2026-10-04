import { Users, Package, ShoppingCart, Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import FaturamentoMensal, { type MesFaturamento } from '@/components/FaturamentoMensal';

const MESES_NO_GRAFICO = 12;
const FUSO = 'America/Sao_Paulo';

function chaveMes(data: Date) {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit' }).formatToParts(data);
  return `${partes.find(p => p.type === 'year')?.value}-${partes.find(p => p.type === 'month')?.value}`;
}

// Faturamento = pedidos que já saíram de "aberto", somados pelo mês do pedido.
async function faturamentoMensal(supabase: Awaited<ReturnType<typeof createClient>>): Promise<MesFaturamento[]> {
  const [ano, mes] = chaveMes(new Date()).split('-').map(Number);
  const meses: MesFaturamento[] = Array.from({ length: MESES_NO_GRAFICO }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (MESES_NO_GRAFICO - 1 - i), 15));
    const label = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', month: 'short', year: '2-digit' }).format(d).replace('.', '').replace(' de ', '/');
    return { chave: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`, label, total: 0, pedidos: 0 };
  });
  const porChave = new Map(meses.map(m => [m.chave, m]));
  const inicio = new Date(Date.UTC(ano, mes - 1 - (MESES_NO_GRAFICO - 1), 1) - 24 * 3600 * 1000).toISOString();

  // O Supabase devolve no máximo 1000 linhas por consulta: busca em blocos.
  for (let de = 0; ; de += 1000) {
    const { data } = await supabase
      .from('pedidos')
      .select('data_pedido, valor_total')
      .neq('status', 'aberto')
      .gte('data_pedido', inicio)
      .order('id')
      .range(de, de + 999);
    for (const p of data || []) {
      const m = porChave.get(chaveMes(new Date(p.data_pedido)));
      if (m) {
        m.total += Number(p.valor_total) || 0;
        m.pedidos += 1;
      }
    }
    if (!data || data.length < 1000) break;
  }
  return meses;
}

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

  const faturamento = await faturamentoMensal(supabase);

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

      <FaturamentoMensal meses={faturamento} />

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
