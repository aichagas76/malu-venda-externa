export interface MesFaturamento {
  chave: string;
  label: string;
  total: number;
  pedidos: number;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function compacto(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

function maximoArredondado(max: number) {
  if (max <= 0) return 1000;
  const base = Math.pow(10, Math.floor(Math.log10(max)));
  const passo = [1, 2, 2.5, 5, 10].map(m => m * base).find(p => p * 4 >= max) as number;
  return passo * 4;
}

export default function FaturamentoMensal({ meses }: { meses: MesFaturamento[] }) {
  const total = meses.reduce((s, m) => s + m.total, 0);
  const pedidos = meses.reduce((s, m) => s + m.pedidos, 0);
  const ticket = (t: number, n: number) => (n > 0 ? t / n : 0);
  const topo = maximoArredondado(Math.max(...meses.map(m => m.total), 0));
  const linhas = [4, 3, 2, 1, 0].map(i => (topo / 4) * i);
  const ultimo = meses.length - 1;

  return (
    <div style={{
      backgroundColor: 'var(--superficie)',
      border: '1px solid var(--borda)',
      borderRadius: 'var(--raio-lg)',
      boxShadow: 'var(--sombra-sutil)',
      padding: '1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: 'var(--fs-destaque)', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Faturamento mensal</h2>
          <p style={{ fontSize: 'var(--fs-pequeno)', color: 'var(--texto-suave)', margin: '4px 0 0' }}>
            Pedidos que já saíram de Aberto, por mês do pedido · últimos {meses.length} meses
          </p>
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {[
            { rotulo: 'Total no período', valor: brl(total) },
            { rotulo: 'Pedidos', valor: pedidos.toLocaleString('pt-BR') },
            { rotulo: 'Ticket médio por pedido', valor: pedidos > 0 ? brl(ticket(total, pedidos)) : '—' },
          ].map(k => (
            <div key={k.rotulo} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--texto-suave)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.rotulo}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--texto)' }}>{k.valor}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', width: '64px', height: '220px', flexShrink: 0 }}>
          {linhas.map(v => (
            <span key={v} style={{ position: 'absolute', right: 0, bottom: `${(v / topo) * 100}%`, transform: 'translateY(50%)', fontSize: 'var(--fs-micro)', color: 'var(--texto-mudo)', whiteSpace: 'nowrap' }}>
              {compacto(v)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'flex-end', gap: '6px', borderBottom: '1px solid var(--borda-forte)' }}>
            {linhas.map(v => (
              <div key={v} aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: `${(v / topo) * 100}%`, borderTop: v === 0 ? 'none' : '1px dashed var(--borda)' }} />
            ))}
            {meses.map((m, i) => (
              <div key={m.chave} title={`${m.label}: ${brl(m.total)} · ${m.pedidos} pedido(s) · ticket médio ${brl(ticket(m.total, m.pedidos))}`}
                style={{ position: 'relative', flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                {m.total > 0 && (
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--texto-suave)', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                    {compacto(m.total)}
                  </span>
                )}
                <div style={{
                  width: '100%',
                  maxWidth: '44px',
                  height: `${(m.total / topo) * 100}%`,
                  minHeight: m.total > 0 ? '2px' : 0,
                  backgroundColor: i === ultimo ? 'var(--ouro)' : 'var(--marca)',
                  borderRadius: '4px 4px 0 0',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            {meses.map(m => (
              <div key={m.chave} style={{ flex: 1, textAlign: 'center', fontSize: 'var(--fs-micro)', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>{m.label}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--borda)' }}>
            {meses.map(m => (
              <div key={m.chave} style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--texto)', fontWeight: '600' }}>{m.pedidos > 0 ? compacto(ticket(m.total, m.pedidos)) : '—'}</div>
                <div style={{ fontSize: '10px', color: 'var(--texto-mudo)' }}>{m.pedidos} ped.</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--texto-mudo)', marginTop: '4px' }}>Linha de baixo: ticket médio e nº de pedidos de cada mês</div>
        </div>
      </div>
    </div>
  );
}
