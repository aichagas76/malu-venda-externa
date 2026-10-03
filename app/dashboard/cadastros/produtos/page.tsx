'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto } from './actions';

interface Produto {
  id: string;
  nome: string;
  sku?: string;
  categoria?: string;
  peso?: number;
  foto?: string;
  data_cadastro?: string;
}

interface FormData {
  nome: string;
  sku: string;
  categoria: string;
  peso: string;
  foto: string;
}

const FORM_INICIAL: FormData = { nome: '', sku: '', categoria: '', peso: '', foto: '' };

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Produto | null>(null);
  const [formData, setFormData] = useState<FormData>(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);

  const carregarProdutos = useCallback(async () => {
    const result = await listarProdutos();
    if (result.success) setProdutos(result.data as Produto[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  const abrirNovoProduto = () => {
    setEditando(null);
    setFormData(FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEdicao = (produto: Produto) => {
    setEditando(produto);
    setFormData({
      nome: produto.nome,
      sku: produto.sku || '',
      categoria: produto.categoria || '',
      peso: produto.peso ? produto.peso.toString() : '',
      foto: produto.foto || '',
    });
    setShowModal(true);
  };

  const handleSalvar = async () => {
    setEnviando(true);
    const result = editando
      ? await atualizarProduto(editando.id, formData.nome, formData.sku, formData.categoria, formData.peso, formData.foto)
      : await criarProduto(formData.nome, formData.sku, formData.categoria, formData.peso, formData.foto);

    if (result.success) {
      await carregarProdutos();
      setShowModal(false);
    }
    setEnviando(false);
  };

  const handleDeletar = async (produtoId: string) => {
    if (!confirm('Tem certeza que quer deletar este produto?')) return;
    const result = await deletarProduto(produtoId);
    if (result.success) await carregarProdutos();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Produtos</h1>
        <button
          onClick={abrirNovoProduto}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
          + Novo Produto
        </button>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Foto</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Categoria</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Código (SKU)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Nome</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Peso</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Data de Cadastro</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum produto cadastrado
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <tr key={produto.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {produto.foto ? (
                      <img src={produto.foto} alt={produto.nome} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.categoria || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.sku || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>{produto.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.peso ? `${produto.peso} g` : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {produto.data_cadastro ? new Date(produto.data_cadastro).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => abrirEdicao(produto)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f1f5f9',
                        color: '#0891b2',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(produto.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px' }}>
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Foto</label>
                <input
                  type="text"
                  value={formData.foto}
                  onChange={e => setFormData({ ...formData, foto: e.target.value })}
                  placeholder="URL da foto"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Categoria</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Categoria do produto"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Código (SKU)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código/SKU do produto"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do produto"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Peso (g)</label>
                <input
                  type="number"
                  value={formData.peso}
                  onChange={e => setFormData({ ...formData, peso: e.target.value })}
                  placeholder="Peso em gramas"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={enviando}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: enviando ? 0.6 : 1
                }}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
