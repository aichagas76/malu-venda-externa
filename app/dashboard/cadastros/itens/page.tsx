'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarItens, criarItem, atualizarItem, deletarItem } from './actions';
import { listarFornecedores } from '../fornecedores/actions';

interface Item {
  id: string;
  nome: string;
  unidade: string;
  valor_unitario: number;
  fornecedor_id: string | null;
  fornecedores?: { nome: string } | { nome: string }[] | null;
}

interface FormData {
  nome: string;
  unidade: string;
  valor: string;
  fornecedorId: string;
}

const UNIDADES: Record<string, string> = { metro: 'Metro', peca: 'Peça', servico: 'Serviço' };
const FORM_INICIAL: FormData = { nome: '', unidade: '', valor: '', fornecedorId: '' };

const nomeFornecedor = (item: Item) => {
  const f = item.fornecedores;
  if (!f) return '—';
  return (Array.isArray(f) ? f[0]?.nome : f.nome) || '—';
};

const moeda = (v: number) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });

export default function ItensPage() {
  const [itens, setItens] = useState<Item[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Item | null>(null);
  const [formData, setFormData] = useState<FormData>(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const [res, forn] = await Promise.all([listarItens(), listarFornecedores()]);
    if (res.success) setItens(res.data as unknown as Item[]);
    if (forn.success) setFornecedores(forn.data as { id: string; nome: string }[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setFormData(FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEdicao = (item: Item) => {
    setEditando(item);
    setFormData({
      nome: item.nome || '',
      unidade: item.unidade || '',
      valor: String(item.valor_unitario ?? ''),
      fornecedorId: item.fornecedor_id || '',
    });
    setShowModal(true);
  };

  const handleSalvar = async () => {
    setEnviando(true);
    const { nome, unidade, valor, fornecedorId } = formData;
    const result = editando
      ? await atualizarItem(editando.id, nome, unidade, valor, fornecedorId)
      : await criarItem(nome, unidade, valor, fornecedorId);

    if (result.success) {
      await carregar();
      setShowModal(false);
    } else {
      alert(result.error || 'Erro ao salvar item');
    }
    setEnviando(false);
  };

  const handleDeletar = async (item: Item) => {
    if (!confirm(`Deletar o item "${item.nome}"?`)) return;
    const result = await deletarItem(item.id);
    if (result.success) await carregar();
    else alert(result.error || 'Erro ao deletar item');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  const th = { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: '#64748b' };
  const campo = { width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' as const, backgroundColor: 'white' };
  const rotulo = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Itens</h1>
        <button
          onClick={abrirNovo}
          style={{ padding: '10px 20px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          + Novo Item
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={th}>Nome</th>
              <th style={th}>Unidade</th>
              <th style={th}>Valor Unitário</th>
              <th style={th}>Fornecedor</th>
              <th style={{ ...th, textAlign: 'center', width: '110px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum item cadastrado
                </td>
              </tr>
            ) : (
              itens.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>{item.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{UNIDADES[item.unidade] || item.unidade}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{moeda(item.valor_unitario)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{nomeFornecedor(item)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirEdicao(item)}
                        title="Editar"
                        aria-label="Editar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#0891b2', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeletar(item)}
                        title="Deletar"
                        aria-label="Deletar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px' }}>
              {editando ? 'Editar Item' : 'Novo Item'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={rotulo}>Nome *</label>
                <input type="text" value={formData.nome} autoFocus
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do item" style={campo} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={rotulo}>Unidade *</label>
                  <select value={formData.unidade}
                    onChange={e => setFormData({ ...formData, unidade: e.target.value })} style={campo}>
                    <option value="">Selecione</option>
                    {Object.entries(UNIDADES).map(([valor, label]) => (
                      <option key={valor} value={valor}>{label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={rotulo}>Valor Unitário (R$) *</label>
                  <input type="number" min="0" step="0.01" value={formData.valor}
                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00" style={campo} />
                </div>
              </div>

              <div>
                <label style={rotulo}>Fornecedor</label>
                <select value={formData.fornecedorId}
                  onChange={e => setFormData({ ...formData, fornecedorId: e.target.value })} style={campo}>
                  <option value="">Sem fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={enviando}
                style={{ padding: '10px 20px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: enviando ? 0.6 : 1 }}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
