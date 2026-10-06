'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarAcessorios, finalizarAcessorio, reabrirAcessorio } from './actions';

const COR = { cor: '#BE185D', bg: '#FDF2F8', border: '#FBCFE8' };

const BANHO_COLORS: Record<string, { bg: string; color: string }> = {
  Ouro:     { bg: '#fef9c3', color: '#854d0e' },
  Prata:    { bg: '#f1f5f9', color: '#475569' },
  Diamante: { bg: '#f0f9ff', color: '#0369a1' },
};

interface ItemAcessorio {
  id: string;
  numero_item?: number | null;
  quantidade: number;
  banho?: string | null;
  acessorio_finalizado_em?: string | null;
  produto?: { id: string; nome: string; sku: string; categoria: string; imagem_url?: string | null };
  pedido?: { id: string; numero_pedido: string; cliente?: { nome: string } };
}

interface Grupo {
  chave: string;
  sku: string;
  categoria: string;
  banho: string;
  imagem?: string | null;
  nome: string;
  totalQtd: number;
  itens: ItemAcessorio[];
}

function agrupar(itens: ItemAcessorio[]): Grupo[] {
  const map = new Map<string, Grupo>();
  for (const item of itens) {
    const chave = `${item.produto?.id || 'sem-produto'}__${item.banho || ''}`;
    if (!map.has(chave)) {
      map.set(chave, { chave, sku: item.produto?.sku || '—', categoria: item.produto?.categoria || '', banho: item.banho || '', imagem: item.produto?.imagem_url, nome: item.produto?.nome || '', totalQtd: 0, itens: [] });
    }
    const g = map.get(chave)!;
    g.totalQtd += item.quantidade;
    g.itens.push(item);
  }
  return [...map.values()].sort((a, b) => a.sku.localeCompare(b.sku, 'pt-BR', { numeric: true, sensitivity: 'base' }));
}

export default function MontagemAcessorios() {
  const [itens, setItens] = useState<ItemAcessorio[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [fotoPopup, setFotoPopup] = useState<{ url: string; sku: string; nome: string } | null>(null);

  const carregar = useCallback(async () => {
    const res = await listarAcessorios();
    if (res.success) {
      setItens(res.data as ItemAcessorio[]);
      setTipos(res.tipos);
      setErro('');
    } else {
      setErro(res.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function alternar(item: ItemAcessorio) {
    setBusy(item.id);
    const finalizado = !!item.acessorio_finalizado_em;
    const res = finalizado ? await reabrirAcessorio(item.id) : await finalizarAcessorio(item.id);
    if (res.success) {
      setItens(prev => prev.map(it => it.id === item.id ? { ...it, acessorio_finalizado_em: finalizado ? null : new Date().toISOString() } : it));
    } else {
      setErro(res.error || 'Erro ao atualizar');
    }
    setBusy(null);
  }

  if (loading) {
    return <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Carregando...</p>;
  }

  if (tipos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
        <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--texto-suave)', margin: '0 0 4px' }}>Nenhum tipo cadastrado para montagem de acessórios</p>
        <p style={{ fontSize: '12px', margin: 0 }}>Cadastre em Cadastros &gt; Acessórios os tipos que precisam (ex.: Brinco, Anel)</p>
      </div>
    );
  }

  const filtrados = itens.filter(it =>
    (!filtroCodigo.trim() || (it.produto?.sku || '').toLowerCase().includes(filtroCodigo.trim().toLowerCase())) &&
    (!filtroTipo || it.produto?.categoria === filtroTipo)
  );
  const grupos = agrupar(filtrados);
  const pendentes = filtrados.filter(it => !it.acessorio_finalizado_em).length;
  const inputStyle = { padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' as const };
  const rotulo = { display: 'block', fontSize: '10px', fontWeight: '700' as const, color: 'var(--texto-suave)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '3px' };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px', marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--borda)' }}>
        <div style={{ width: '120px' }}>
          <label style={rotulo}>Código</label>
          <input type="text" placeholder="Código..." value={filtroCodigo} onChange={e => setFiltroCodigo(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div style={{ minWidth: '150px' }}>
          <label style={rotulo}>Tipo</label>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
            <option value="">Todos os tipos</option>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {(filtroCodigo || filtroTipo) && (
          <button onClick={() => { setFiltroCodigo(''); setFiltroTipo(''); }}
            style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid #94a3b8', borderRadius: '5px', backgroundColor: 'white', color: 'var(--texto-suave)', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Limpar filtros
          </button>
        )}
      </div>

      {erro && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '12px', marginBottom: '10px' }}>{erro}</div>
      )}

      <div style={{ maxWidth: '520px', backgroundColor: COR.bg, borderRadius: '10px', border: `1px solid ${COR.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '7px 10px', backgroundColor: COR.cor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Montagem de Acessórios</span>
          <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px' }}>{pendentes} pendente(s) · {filtrados.length} item(s)</span>
        </div>

        <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '60px' }}>
          {grupos.length === 0 ? (
            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '14px 0', margin: 0 }}>Sem itens</p>
          ) : grupos.map(grupo => (
            <div key={grupo.chave} style={{ backgroundColor: 'white', borderRadius: '6px', border: `1px solid ${COR.border}`, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', backgroundColor: COR.bg, borderBottom: `1px solid ${COR.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: COR.cor }}>{grupo.sku}</span>
                  {grupo.banho ? (
                    <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: (BANHO_COLORS[grupo.banho] || { bg: '#f1f5f9' }).bg, color: (BANHO_COLORS[grupo.banho] || { color: '#475569' }).color }}>{grupo.banho}</span>
                  ) : (
                    <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#94a3b8', border: '1px dashed var(--borda-forte)' }}>Sem banho</span>
                  )}
                  {grupo.imagem && (
                    <button onClick={() => setFotoPopup({ url: grupo.imagem as string, sku: grupo.sku, nome: grupo.nome })} title="Ver foto"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${COR.border}`, backgroundColor: 'white', cursor: 'pointer', padding: 0, color: COR.cor }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{grupo.categoria}</span>
                  <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: COR.cor, color: 'white', padding: '1px 5px', borderRadius: '8px' }}>{grupo.totalQtd}</span>
                </div>
              </div>

              {grupo.itens.map((item, idx) => {
                const finalizado = !!item.acessorio_finalizado_em;
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 6px', borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none', backgroundColor: finalizado ? '#f0fdf4' : 'transparent' }}>
                    {item.numero_item != null && <span title="Nº do item no pedido" style={{ flexShrink: 0, fontSize: '9px', fontWeight: '700', color: '#94a3b8', minWidth: '16px', textAlign: 'center' }}>{item.numero_item}</span>}
                    <span style={{ flex: 1, fontSize: '10px', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.pedido?.cliente?.nome || ''}>
                      {item.pedido?.numero_pedido || '—'}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: '800', color: COR.cor, minWidth: '16px', textAlign: 'center' }}>{item.quantidade}</span>
                    {finalizado ? (
                      <>
                        <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: '700', color: '#047857' }}>Finalizado em {new Date(item.acessorio_finalizado_em as string).toLocaleDateString('pt-BR')}</span>
                        <button onClick={() => alternar(item)} disabled={busy === item.id} title="Desfazer (voltar para pendente)"
                          style={{ flexShrink: 0, padding: '2px 6px', fontSize: '10px', fontWeight: '600', borderRadius: '4px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#64748b', cursor: busy === item.id ? 'not-allowed' : 'pointer' }}>
                          Desfazer
                        </button>
                      </>
                    ) : (
                      <button onClick={() => alternar(item)} disabled={busy === item.id} title="Finalizar montagem de acessórios"
                        style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', fontSize: '10px', fontWeight: '700', borderRadius: '4px', border: `1px solid ${COR.cor}`, backgroundColor: COR.cor, color: 'white', cursor: busy === item.id ? 'not-allowed' : 'pointer', opacity: busy === item.id ? 0.5 : 1 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Finalizar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {fotoPopup && (
        <div onClick={() => setFotoPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'zoom-out' }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px', maxWidth: '90vw', cursor: 'default' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--texto)', marginBottom: '8px' }}>{fotoPopup.sku}{fotoPopup.nome ? ` · ${fotoPopup.nome}` : ''}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPopup.url} alt={fotoPopup.sku} style={{ maxWidth: '80vw', maxHeight: '75vh', borderRadius: '6px' }} />
          </div>
        </div>
      )}
    </div>
  );
}
