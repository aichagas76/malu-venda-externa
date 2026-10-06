'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarCategorias } from '../categorias/actions';
import { listarTiposAcessorio, criarTipoAcessorio, deletarTipoAcessorio } from './actions';

interface TipoAcessorio {
  id: string;
  tipo: string;
}

export default function AcessoriosPage() {
  const [tipos, setTipos] = useState<TipoAcessorio[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [escolhido, setEscolhido] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const [res, cats] = await Promise.all([listarTiposAcessorio(), listarCategorias()]);
    if (res.success) setTipos(res.data as TipoAcessorio[]);
    if (cats.success) setCategorias((cats.data as { nome: string }[]).map(c => c.nome).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })));
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleAdicionar = async () => {
    setEnviando(true);
    const result = await criarTipoAcessorio(escolhido);
    if (result.success) {
      setEscolhido('');
      await carregar();
    } else {
      alert(result.error || 'Erro ao salvar');
    }
    setEnviando(false);
  };

  const handleDeletar = async (t: TipoAcessorio) => {
    if (!confirm(`Remover "${t.tipo}" da montagem de acessórios?`)) return;
    const result = await deletarTipoAcessorio(t.id);
    if (result.success) await carregar();
    else alert(result.error || 'Erro ao remover');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  const th = { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' };
  const disponiveis = categorias.filter(c => !tipos.some(t => t.tipo.toLowerCase() === c.toLowerCase()));

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 6px' }}>Acessórios</h1>
      <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
        Escolha os tipos de produto que precisam de montagem de acessórios (ex.: Brinco, Anel). Os itens desses tipos aparecem na aba <b>Montagem de Acessórios</b> em Etapas da Produção.
      </p>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ flex: '1 1 240px', maxWidth: '340px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Tipo *</label>
          <select value={escolhido} onChange={e => setEscolhido(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}>
            <option value="">Selecione o tipo</option>
            {disponiveis.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={handleAdicionar} disabled={enviando || !escolhido}
          style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: enviando || !escolhido ? 'not-allowed' : 'pointer', opacity: enviando || !escolhido ? 0.5 : 1 }}>
          {enviando ? 'Salvando...' : '+ Adicionar'}
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--borda)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--borda)' }}>
              <th style={th}>Tipo que precisa de acessórios</th>
              <th style={{ ...th, textAlign: 'center', width: '100px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tipos.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Nenhum tipo cadastrado</td>
              </tr>
            ) : (
              tipos.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto)', fontWeight: '500' }}>{t.tipo}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button onClick={() => handleDeletar(t)} title="Remover" aria-label="Remover"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
