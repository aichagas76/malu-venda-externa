'use client';

import { useState, useEffect, useRef } from 'react';
import { Gem, Camera } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { listarProdutos, criarProduto, editarProduto, deletarProduto } from './actions';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  imagem_url: string;
  peso: number;
  fabricante: string;
}

const TIPOS = ['Anel', 'Brinco', 'Colar', 'Pulseira', 'Pingente', 'Corrente', 'Aliança', 'Conjunto', 'Tornozeleira', 'Piercing', 'Outro'];

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    tipo: '', referencia: '', produto: '', foto: '', peso: '', fabricante: '',
  });

  useEffect(() => { carregarProdutos(); }, []);

  async function carregarProdutos() {
    const result = await listarProdutos();
    if (result.success) setProdutos(result.data as Produto[]);
    setLoading(false);
  }

  function resetForm() {
    setForm({ tipo: '', referencia: '', produto: '', foto: '', peso: '', fabricante: '' });
    setFotoPreview(null);
    setEditingId(null);
    setShowForm(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function abrirForm() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(p: Produto) {
    setForm({
      tipo: p.categoria || '',
      referencia: p.sku || '',
      produto: p.nome || '',
      foto: p.imagem_url || '',
      peso: p.peso ? String(p.peso) : '',
      fabricante: p.fabricante || '',
    });
    setFotoPreview(p.imagem_url || null);
    setEditingId(p.id);
    setShowForm(true);
    setError('');
  }

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setFotoPreview(preview);
    setUploading(true);
    setError('');

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError('Erro ao enviar foto: ' + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('produtos').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, foto: urlData.publicUrl }));
    } catch {
      setError('Erro ao enviar foto');
    }
    setUploading(false);
  }

  function removerFoto() {
    setForm(prev => ({ ...prev, foto: '' }));
    setFotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    if (!form.referencia.trim()) { setError('Campo "Referência" é obrigatório'); return; }
    if (uploading) { setError('Aguarde o envio da foto'); return; }

    setSaving(true);
    setError('');

    const dados = {
      nome: form.produto.trim(),
      sku: form.referencia.trim(),
      categoria: form.tipo,
      banho: '',
      peso: parseFloat(form.peso) || 0,
      fabricante: form.fabricante.trim(),
      imagem_url: form.foto.trim(),
    };

    const result = editingId
      ? await editarProduto(editingId, dados)
      : await criarProduto(dados);

    if (result.success) {
      resetForm();
      carregarProdutos();
    } else {
      setError(result.error || 'Erro ao salvar');
    }
    setSaving(false);
  }

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"?`)) return;
    const result = await deletarProduto(id);
    if (result.success) carregarProdutos();
    else alert('Erro: ' + result.error);
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '2px solid var(--borda)', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' };
  const thStyle: React.CSSProperties = { padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <p style={{ fontSize: '18px', color: '#6b7280' }}>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', padding: '0 8px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--texto)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white', fontSize: '20px' }}>
              <Gem size={22} strokeWidth={1.75} aria-hidden="true" />
            </span>
            Produtos
          </h1>
          <p style={{ color: 'var(--texto-suave)', fontSize: '14px', marginTop: '4px' }}>
            {produtos.length} {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
          </p>
        </div>
        <button
          onClick={abrirForm}
          onMouseEnter={() => setHoveredBtn('novo')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: hoveredBtn === 'novo' ? 'linear-gradient(135deg, #059669, #047857)' : 'linear-gradient(135deg, #10b981, #34d399)',
            color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease',
          }}
        >
          + Novo Produto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', padding: '24px', marginBottom: '24px', borderLeft: '4px solid #10b981' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
          </h3>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* FOTO — primeiro item */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Foto</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{
                width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                backgroundColor: '#f9fafb', flexShrink: 0, position: 'relative',
              }}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ opacity: 0.4, display: 'inline-flex' }}><Camera size={36} strokeWidth={1.75} aria-hidden="true" /></span>
                )}
                {uploading && (
                  <div style={{
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '600', color: 'var(--acao)',
                  }}>
                    Enviando...
                  </div>
                )}
              </div>

              {/* Botões */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFoto}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={() => setHoveredBtn('foto')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                    cursor: 'pointer', border: '2px solid var(--acao)', transition: 'all 0.15s',
                    backgroundColor: hoveredBtn === 'foto' ? 'var(--acao)' : 'white',
                    color: hoveredBtn === 'foto' ? 'white' : 'var(--acao)',
                  }}
                >
                  <Camera size={16} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: '4px' }} />Tirar Foto / Escolher
                </button>
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={removerFoto}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                      cursor: 'pointer', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626',
                    }}
                  >
                    Remover foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Linha 1: Tipo + Referência + Produto */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={labelStyle}>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                style={{ ...inputStyle, color: '#111827' }}
              >
                <option value="">Selecione</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '130px' }}>
              <label style={labelStyle}>Referência *</label>
              <input
                type="text"
                value={form.referencia}
                onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                placeholder="Ex: REF-001"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={labelStyle}>Produto</label>
              <input
                type="text"
                value={form.produto}
                onChange={(e) => setForm({ ...form, produto: e.target.value })}
                placeholder="Nome do produto"
                autoFocus
                style={inputStyle}
              />
            </div>
          </div>

          {/* Linha 2: Peso + Fabricante */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '130px', minWidth: '100px' }}>
              <label style={labelStyle}>Peso (g)</label>
              <input
                type="number"
                step="0.01"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
                placeholder="0.00"
                style={{ ...inputStyle, textAlign: 'right' }}
              />
            </div>
            <div style={{ flex: 2, minWidth: '180px' }}>
              <label style={labelStyle}>Fabricante</label>
              <input
                type="text"
                value={form.fabricante}
                onChange={(e) => setForm({ ...form, fabricante: e.target.value })}
                placeholder="Nome do fabricante"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSubmit}
              disabled={saving || uploading}
              onMouseEnter={() => setHoveredBtn('salvar')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor: (saving || uploading) ? '#94a3b8' : hoveredBtn === 'salvar' ? '#059669' : '#10b981',
                color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: (saving || uploading) ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
              }}
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
            <button
              onClick={resetForm}
              onMouseEnter={() => setHoveredBtn('cancelar')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor: hoveredBtn === 'cancelar' ? '#4b5563' : '#6b7280',
                color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px',
                fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderBottom: '2px solid var(--borda)' }}>
              <th style={thStyle}>Foto</th>
              <th style={thStyle}>Tipo</th>
              <th style={thStyle}>Ref.</th>
              <th style={thStyle}>Produto</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Peso</th>
              <th style={thStyle}>Fabricante</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '150px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length > 0 ? (
              produtos.map((p, i) => (
                <tr
                  key={p.id}
                  onMouseEnter={() => setHoveredRow(p.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ backgroundColor: hoveredRow === p.id ? '#f8fafc' : 'white', borderBottom: i < produtos.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background-color 0.15s' }}
                >
                  <td style={{ padding: '10px 16px' }}>
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt={p.nome} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: '1px solid #fde68a' }}>
                        <Gem size={20} strokeWidth={1.75} aria-hidden="true" />
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {p.categoria ? (
                      <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                        {p.categoria}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '600', color: 'var(--acao)', fontFamily: 'monospace' }}>
                    {p.sku || '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: 'var(--texto)' }}>
                    {p.nome}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                    {p.peso ? `${Number(p.peso).toFixed(2)}g` : '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '13px', color: '#374151' }}>
                    {p.fabricante || '—'}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(p)}
                        onMouseEnter={() => setHoveredBtn(`edit-${p.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          backgroundColor: hoveredBtn === `edit-${p.id}` ? 'var(--acao-suave)' : 'transparent',
                          color: 'var(--acao)', border: '1px solid var(--borda-forte)', padding: '6px 10px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.nome)}
                        onMouseEnter={() => setHoveredBtn(`del-${p.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          backgroundColor: hoveredBtn === `del-${p.id}` ? '#fee2e2' : 'transparent',
                          color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8' }}>
                    <div style={{ marginBottom: '12px', opacity: 0.5, display: 'flex', justifyContent: 'center' }}><Gem size={48} strokeWidth={1.75} aria-hidden="true" /></div>
                    <p style={{ fontSize: '14px', color: 'var(--texto-suave)', margin: '0 0 4px 0', fontWeight: '500' }}>Nenhum produto cadastrado</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Clique em &quot;+ Novo Produto&quot; para começar</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
