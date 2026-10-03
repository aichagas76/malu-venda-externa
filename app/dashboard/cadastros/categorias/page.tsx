'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarCategorias, criarCategoria, atualizarCategoria, deletarCategoria } from './actions';

interface Categoria {
  id: string;
  nome: string;
  criado_em?: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    const result = await listarCategorias();
    if (result.success) setCategorias(result.data as Categoria[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNova = () => {
    setEditando(null);
    setNome('');
    setShowModal(true);
  };

  const abrirEdicao = (categoria: Categoria) => {
    setEditando(categoria);
    setNome(categoria.nome);
    setShowModal(true);
  };

  const handleSalvar = async () => {
    setEnviando(true);
    const result = editando
      ? await atualizarCategoria(editando.id, editando.nome, nome)
      : await criarCategoria(nome);

    if (result.success) {
      await carregar();
      setShowModal(false);
    } else {
      alert(result.error || 'Erro ao salvar categoria');
    }
    setEnviando(false);
  };

  const handleDeletar = async (categoria: Categoria) => {
    if (!confirm(`Deletar a categoria "${categoria.nome}"?`)) return;
    const result = await deletarCategoria(categoria.id, categoria.nome);
    if (result.success) await carregar();
    else alert(result.error || 'Erro ao deletar categoria');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  const th = { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: '#64748b' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Categorias</h1>
        <button
          onClick={abrirNova}
          style={{ padding: '10px 20px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          + Nova Categoria
        </button>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={th}>Nome</th>
              <th style={{ ...th, textAlign: 'center', width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={2} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhuma categoria cadastrada
                </td>
              </tr>
            ) : (
              categorias.map((categoria) => (
                <tr key={categoria.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>{categoria.nome}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirEdicao(categoria)}
                        title="Editar"
                        aria-label="Editar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#0891b2', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeletar(categoria)}
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px' }}>
              {editando ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome *</label>
              <input
                type="text"
                value={nome}
                autoFocus
                onChange={e => setNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !enviando) handleSalvar(); }}
                placeholder="Nome da categoria"
                style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={enviando}
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
