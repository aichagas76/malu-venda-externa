'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { listarCategorias } from '../categorias/actions';
import { listarItens } from '../itens/actions';
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto, listarItensProduto, salvarItensProduto, listarValoresProdutos } from './actions';

const UNIDADES_ITEM: Record<string, string> = { metro: 'Metro', peca: 'Peça', servico: 'Serviço' };

interface Produto {
  id: string;
  nome: string | null;
  sku?: string;
  categoria?: string;
  peso?: number;
  imagem_url?: string;
  criado_em?: string;
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
  const [cameraAberta, setCameraAberta] = useState(false);
  const [erroCamera, setErroCamera] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const [itensCatalogo, setItensCatalogo] = useState<{ id: string; nome: string; unidade: string; valor_unitario: number }[]>([]);
  const [itensProduto, setItensProduto] = useState<{ item_id: string; quantidade: string }[]>([]);
  const [valoresProdutos, setValoresProdutos] = useState<Record<string, number>>({});
  const [produtoItens, setProdutoItens] = useState<Produto | null>(null);
  const [enviandoItens, setEnviandoItens] = useState(false);
  const [novoItemId, setNovoItemId] = useState('');
  const [novaQtd, setNovaQtd] = useState('');

  const carregarProdutos = useCallback(async () => {
    const [result, cats, its, vals] = await Promise.all([listarProdutos(), listarCategorias(), listarItens(), listarValoresProdutos()]);
    if (vals.success) setValoresProdutos(vals.data);
    if (result.success) setProdutos(result.data as Produto[]);
    if (cats.success) setCategorias(cats.data as { id: string; nome: string }[]);
    if (its.success) setItensCatalogo(its.data as unknown as { id: string; nome: string; unidade: string; valor_unitario: number }[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  const adicionarItem = () => {
    const qtd = parseFloat(novaQtd);
    if (!novoItemId) return alert('Selecione um item');
    if (!(qtd > 0)) return alert('Informe uma quantidade maior que zero');
    setItensProduto(prev => [...prev, { item_id: novoItemId, quantidade: novaQtd }]);
    setNovoItemId('');
    setNovaQtd('');
  };

  const abrirItens = (produto: Produto) => {
    setItensProduto([]);
    setNovoItemId('');
    setNovaQtd('');
    setProdutoItens(produto);
    listarItensProduto(produto.id).then(res => {
      if (res.success) setItensProduto((res.data as { item_id: string; quantidade: number }[]).map(r => ({ item_id: r.item_id, quantidade: String(r.quantidade) })));
    });
  };

  const salvarItens = async () => {
    if (!produtoItens) return;
    setEnviandoItens(true);
    const res = await salvarItensProduto(
      produtoItens.id,
      itensProduto.map(p => ({ item_id: p.item_id, quantidade: parseFloat(p.quantidade) }))
    );
    if (res.success) {
      setProdutoItens(null);
      await carregarProdutos();
    }
    else alert(res.error || 'Erro ao salvar itens');
    setEnviandoItens(false);
  };

  const abrirNovoProduto = () => {
    setEditando(null);
    setFormData(FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEdicao = (produto: Produto) => {
    setEditando(produto);
    setFormData({
      nome: produto.nome || '',
      sku: produto.sku || '',
      categoria: produto.categoria || '',
      peso: produto.peso ? produto.peso.toString() : '',
      foto: produto.imagem_url || '',
    });
    setShowModal(true);
  };

  const fecharCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraAberta(false);
  }, []);

  const abrirCamera = async () => {
    setErroCamera('');
    setCameraAberta(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;    } catch {
      setErroCamera('Não foi possível acessar a câmera. Verifique a permissão do navegador.');
    }
  };

  const capturarFoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const maxW = 800;
    const escala = Math.min(1, maxW / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth * escala;
    canvas.height = video.videoHeight * escala;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setFormData(prev => ({ ...prev, foto: canvas.toDataURL('image/jpeg', 0.8) }));
    fecharCamera();
  };

  useEffect(() => { if (!showModal) fecharCamera(); }, [showModal, fecharCamera]);

  useEffect(() => {
    if (cameraAberta && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraAberta, erroCamera]);

  const handleSalvar = async () => {
    setEnviando(true);
    const result = editando
      ? await atualizarProduto(editando.id, formData.nome, formData.sku, formData.categoria, formData.peso, formData.foto)
      : await criarProduto(formData.nome, formData.sku, formData.categoria, formData.peso, formData.foto);

    if (result.success) {
      await carregarProdutos();
      setShowModal(false);
    } else {
      alert(result.error || 'Erro ao salvar produto');
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
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Valor Unitário</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Data de Cadastro</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum produto cadastrado
                </td>
              </tr>
            ) : (
              produtos.map((produto) => (
                <tr key={produto.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {produto.imagem_url ? (
                      <img src={produto.imagem_url} alt={produto.nome || 'Foto do produto'} style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.categoria || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.sku || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>{produto.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{produto.peso ? `${produto.peso} g` : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {valoresProdutos[produto.id] ? valoresProdutos[produto.id].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {produto.criado_em ? new Date(produto.criado_em).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => abrirItens(produto)}
                      title="Itens do produto"
                      aria-label="Itens do produto"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                    </button>
                    <button
                      onClick={() => abrirEdicao(produto)}
                      title="Editar"
                      aria-label="Editar"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: '#0891b2', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeletar(produto.id)}
                      title="Deletar"
                      aria-label="Deletar"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px' }}>
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Foto</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>📁 Procurar arquivo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const img = new Image();
                        const url = URL.createObjectURL(file);
                        img.onload = () => {
                          const escala = Math.min(1, 800 / img.width);
                          const canvas = document.createElement('canvas');
                          canvas.width = img.width * escala;
                          canvas.height = img.height * escala;
                          canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
                          setFormData(prev => ({ ...prev, foto: canvas.toDataURL('image/jpeg', 0.8) }));
                          URL.revokeObjectURL(url);
                        };
                        img.src = url;
                      }}
                      style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>📷 Tirar foto</label>
                    <button
                      type="button"
                      onClick={abrirCamera}
                      style={{ width: '100%', padding: '9px', border: '1px solid #0891b2', backgroundColor: '#ecfeff', color: '#0891b2', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxSizing: 'border-box' }}>
                      Abrir câmera
                    </button>
                  </div>
                </div>
                {cameraAberta && (
                  <div style={{ marginBottom: '8px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '6px', backgroundColor: '#000' }} />
                    {erroCamera && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{erroCamera}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="button" onClick={capturarFoto}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                        📸 Capturar
                      </button>
                      <button type="button" onClick={fecharCamera}
                        style={{ padding: '8px 14px', backgroundColor: 'white', color: '#374151', border: '1px solid #e2e8f0', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
                {formData.foto && formData.foto.startsWith('data:') && (
                  <div style={{ marginTop: '8px' }}>
                    <img src={formData.foto} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Categoria</label>
                <select
                  value={formData.categoria}
                  onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}>
                  <option value="">Selecione uma categoria</option>
                  {formData.categoria && !categorias.some(c => c.nome === formData.categoria) && (
                    <option value={formData.categoria}>{formData.categoria}</option>
                  )}
                  {categorias.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Código (SKU) *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Código/SKU do produto"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome</label>
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

      {produtoItens && (
        <div onClick={() => setProdutoItens(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' }}>Itens do produto</h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
              {produtoItens.sku}{produtoItens.nome ? ` · ${produtoItens.nome}` : ''}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select value={novoItemId} onChange={e => setNovoItemId(e.target.value)} aria-label="Item"
                style={{ flex: 1, minWidth: 0, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', backgroundColor: 'white' }}>
                <option value="">Selecione um item</option>
                {itensCatalogo.filter(i => !itensProduto.some(p => p.item_id === i.id)).map(i => (
                  <option key={i.id} value={i.id}>{i.nome}</option>
                ))}
              </select>
              <input type="number" min="0" step="any" value={novaQtd} onChange={e => setNovaQtd(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') adicionarItem(); }}
                placeholder="Qtd" aria-label="Quantidade"
                style={{ width: '80px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              <button type="button" onClick={adicionarItem}
                style={{ padding: '10px 14px', backgroundColor: '#ecfeff', color: '#0891b2', border: '1px solid #0891b2', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                Adicionar
              </button>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
              {itensProduto.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Nenhum item adicionado</div>
              ) : (
                itensProduto.map((ip) => {
                  const item = itensCatalogo.find(i => i.id === ip.item_id);
                  const subtotal = item ? Number(item.valor_unitario) * (parseFloat(ip.quantidade) || 0) : 0;
                  return (
                    <div key={ip.item_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#1e293b', fontWeight: '500' }}>{item?.nome || 'Item removido'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                          {item ? `${UNIDADES_ITEM[item.unidade] || item.unidade} · ${Number(item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 4 })} · Subtotal ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                        </div>
                      </div>
                      <input
                        type="number" min="0" step="any" value={ip.quantidade}
                        onChange={e => setItensProduto(prev => prev.map(p => p.item_id === ip.item_id ? { ...p, quantidade: e.target.value } : p))}
                        aria-label="Quantidade do item"
                        style={{ width: '80px', padding: '6px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                      <button type="button" title="Remover item" aria-label="Remover item"
                        onClick={() => setItensProduto(prev => prev.filter(p => p.item_id !== ip.item_id))}
                        style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: '#64748b', fontWeight: '600' }}>Valor unitário do produto</span>
              <span style={{ color: '#1e293b', fontWeight: '700' }}>
                {itensProduto.reduce((total, ip) => total + (Number(itensCatalogo.find(i => i.id === ip.item_id)?.valor_unitario) || 0) * (parseFloat(ip.quantidade) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setProdutoItens(null)}
                style={{ padding: '10px 20px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={salvarItens} disabled={enviandoItens}
                style={{ padding: '10px 20px', backgroundColor: '#0891b2', color: 'white', border: 'none', borderRadius: '6px', cursor: enviandoItens ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: enviandoItens ? 0.6 : 1 }}>
                {enviandoItens ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
