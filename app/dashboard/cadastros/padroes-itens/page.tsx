'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarItens } from '../itens/actions';
import { listarPadroes, criarPadrao, atualizarPadrao, deletarPadrao } from './actions';

interface Padrao {
  id: string;
  nome: string;
  padroes_itens_linhas: { item_id: string; quantidade: number }[];
}

interface ItemCatalogo {
  id: string;
  nome: string;
  unidade: string;
}

const UNIDADES_ITEM: Record<string, string> = { metro: 'Metro', peca: 'Peça', servico: 'Serviço' };

export default function PadroesItensPage() {
  const [padroes, setPadroes] = useState<Padrao[]>([]);
  const [itensCatalogo, setItensCatalogo] = useState<ItemCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Padrao | null>(null);
  const [nome, setNome] = useState('');
  const [linhas, setLinhas] = useState<{ item_id: string; quantidade: string }[]>([]);
  const [novoItemId, setNovoItemId] = useState('');
  const [novaQtd, setNovaQtd] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const [res, its] = await Promise.all([listarPadroes(), listarItens()]);
    if (res.success) setPadroes(res.data as unknown as Padrao[]);
    if (its.success) setItensCatalogo(its.data as unknown as ItemCatalogo[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setNome('');
    setLinhas([]);
    setNovoItemId('');
    setNovaQtd('');
    setShowModal(true);
  };

  const abrirEdicao = (padrao: Padrao) => {
    setEditando(padrao);
    setNome(padrao.nome);
    setLinhas(padrao.padroes_itens_linhas.map(l => ({ item_id: l.item_id, quantidade: String(l.quantidade) })));
    setNovoItemId('');
    setNovaQtd('');
    setShowModal(true);
  };

  const adicionarItem = () => {
    const qtd = parseFloat(novaQtd);
    if (!novoItemId) return alert('Selecione um item');
    if (!(qtd > 0)) return alert('Informe uma quantidade maior que zero');
    setLinhas(prev => [...prev, { item_id: novoItemId, quantidade: novaQtd }]);
    setNovoItemId('');
    setNovaQtd('');
  };

  const handleSalvar = async () => {
    setEnviando(true);
    const payload = linhas.map(l => ({ item_id: l.item_id, quantidade: parseFloat(l.quantidade) }));
    const result = editando
      ? await atualizarPadrao(editando.id, nome, payload)
      : await criarPadrao(nome, payload);

    if (result.success) {
      await carregar();
      setShowModal(false);
    } else {
      alert(result.error || 'Erro ao salvar padrão');
    }
    setEnviando(false);
  };

  const handleDeletar = async (padrao: Padrao) => {
    if (!confirm(`Deletar o padrão "${padrao.nome}"?`)) return;
    const result = await deletarPadrao(padrao.id);
    if (result.success) await carregar();
    else alert(result.error || 'Erro ao deletar padrão');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  const th = { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' };
  const nomeItem = (id: string) => itensCatalogo.find(i => i.id === id)?.nome || 'Item removido';

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Padrão Itens do produto</h1>
        <button
          onClick={abrirNovo}
          style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          + Novo Padrão
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--borda)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--borda)' }}>
              <th style={th}>Nome</th>
              <th style={th}>Itens</th>
              <th style={{ ...th, textAlign: 'center', width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {padroes.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum padrão cadastrado
                </td>
              </tr>
            ) : (
              padroes.map(padrao => (
                <tr key={padrao.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto)', fontWeight: '500' }}>{padrao.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--texto-suave)' }}>
                    {padrao.padroes_itens_linhas.length === 0
                      ? '—'
                      : padrao.padroes_itens_linhas.map(l => `${nomeItem(l.item_id)} (${Number(l.quantidade).toLocaleString('pt-BR')})`).join(' · ')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirEdicao(padrao)}
                        title="Editar"
                        aria-label="Editar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeletar(padrao)}
                        title="Deletar"
                        aria-label="Deletar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 20px' }}>
              {editando ? 'Editar Padrão' : 'Novo Padrão'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome *</label>
              <input
                type="text"
                value={nome}
                autoFocus
                onChange={e => setNome(e.target.value)}
                placeholder="Nome do padrão"
                style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Itens *</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={novoItemId} onChange={e => setNovoItemId(e.target.value)} aria-label="Item"
                style={{ flex: 1, minWidth: 0, padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', backgroundColor: 'white' }}>
                <option value="">Selecione um item</option>
                {itensCatalogo.filter(i => !linhas.some(l => l.item_id === i.id)).map(i => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
              <input type="number" min="0" step="any" value={novaQtd} onChange={e => setNovaQtd(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') adicionarItem(); }}
                placeholder="Qtd" aria-label="Quantidade"
                style={{ width: '80px', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' }} />
              <button type="button" onClick={adicionarItem}
                style={{ padding: '10px 14px', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', border: '1px solid var(--acao)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                Adicionar
              </button>
            </div>

            <div style={{ border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', marginBottom: '24px', overflow: 'hidden' }}>
              {linhas.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Nenhum item adicionado</div>
              ) : (
                linhas.map(l => {
                  const item = itensCatalogo.find(i => i.id === l.item_id);
                  return (
                    <div key={l.item_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--texto)', fontWeight: '500' }}>{item?.nome || 'Item removido'}</div>
                        {item && <div style={{ color: '#94a3b8', fontSize: '11px' }}>{UNIDADES_ITEM[item.unidade] || item.unidade}</div>}
                      </div>
                      <input
                        type="number" min="0" step="any" value={l.quantidade}
                        onChange={e => setLinhas(prev => prev.map(p => p.item_id === l.item_id ? { ...p, quantidade: e.target.value } : p))}
                        aria-label="Quantidade do item"
                        style={{ width: '80px', padding: '6px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                      <button type="button" title="Remover item" aria-label="Remover item"
                        onClick={() => setLinhas(prev => prev.filter(p => p.item_id !== l.item_id))}
                        style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={enviando}
                style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: 'var(--raio-sm)', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: enviando ? 0.6 : 1 }}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
