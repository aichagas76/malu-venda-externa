'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, Minus, Plus } from 'lucide-react';
import {
  listarPedidos,
  listarClientes,
  listarProdutosPorTipo,
  criarPedido,
  adicionarItensMultiplos,
  atualizarStatusPedido,
  deletarPedido,
  listarItensPedido,
  atualizarItemPedido,
  deletarItemPedido,
  gerarListaCompras,
  listarFabricantesTerceiros,
  gerarListaFabricante,
} from './actions';
import { listarCategorias } from '../cadastros/categorias/actions';
import { baixarListaComprasPdf, formatarMoeda, formatarQuantidade, UNIDADE_ROTULO, type ListaComprasData } from './compras';
import { baixarListaTerceiroPdf, type ListaTerceiroData } from './terceiros';

interface Cliente { id: string; nome: string }
interface Produto { id: string; nome: string; sku: string; categoria: string; banho: string; peso: number; fabricante: string; preco: number }
interface ItemPedido { id: string; quantidade: number; preco_unitario: number; banho?: string; etapa_fabricacao?: string | null; produtos?: { id: string; nome: string; sku: string; categoria: string } }
interface Pedido { id: string; numero_pedido: string; data_pedido: string; status: string; valor_total: number; clientes?: { id: string; nome: string } | null }

const BANHOS = ['Ouro', 'Prata', 'Diamante'];

const ETAPA_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  montagem_inicial: { label: 'Montagem Inicial', bg: '#EFF6FF', color: '#1D4ED8' },
  producao:         { label: 'Produção',          bg: '#FFFBEB', color: '#B45309' },
  preparado_banho:  { label: 'Preparado p/ Banho', bg: '#F0FDFA', color: '#0F766E' },
  encartelamento:   { label: 'Encartelamento',    bg: '#F5F3FF', color: '#6D28D9' },
  enviado_cliente:  { label: 'Envio ao Cliente',  bg: '#ECFDF5', color: '#047857' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  aberto: { label: 'Aberto', bg: 'var(--info-bg)', color: 'var(--info)' },
  em_fabricacao: { label: 'Em Fabricação', bg: 'var(--atencao-bg)', color: 'var(--atencao)' },
  fechado: { label: 'Fechado', bg: 'var(--sucesso-bg)', color: 'var(--sucesso)' },
};

function QtdStepper({ value, onChange, compacto = false }: { value: number; onChange: (n: number) => void; compacto?: boolean }) {
  const [texto, setTexto] = useState<string | null>(null);
  const altura = compacto ? 26 : 34;
  const btn: React.CSSProperties = { width: altura, height: altura, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--borda-forte)', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', cursor: 'pointer', padding: 0 };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'stretch' }}>
      <button type="button" aria-label="Diminuir quantidade" onClick={() => { setTexto(null); onChange(Math.max(1, value - 1)); }}
        style={{ ...btn, borderRadius: '6px 0 0 6px' }}><Minus size={14} strokeWidth={2.25} aria-hidden="true" /></button>
      <input type="number" inputMode="numeric" min="1" value={texto ?? value}
        onChange={e => { setTexto(e.target.value); const n = parseInt(e.target.value); if (n > 0) onChange(n); }}
        onBlur={() => { setTexto(null); if (!(value > 0)) onChange(1); }}
        className="qtd-input"
        style={{ width: compacto ? 44 : 56, height: altura, padding: '0 4px', border: '1px solid var(--borda-forte)', borderLeft: 'none', borderRight: 'none', textAlign: 'center', fontSize: compacto ? '12px' : '13px', boxSizing: 'border-box', borderRadius: 0, outline: 'none', backgroundColor: 'white' }} />
      <button type="button" aria-label="Aumentar quantidade" onClick={() => { setTexto(null); onChange(value + 1); }}
        style={{ ...btn, borderRadius: '0 6px 6px 0' }}><Plus size={14} strokeWidth={2.25} aria-hidden="true" /></button>
    </div>
  );
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [produtosPorTipo, setProdutosPorTipo] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>('aberto');
  const [showCompras, setShowCompras] = useState(false);
  const [statusCompras, setStatusCompras] = useState<string[]>(['aberto']);
  const [listaCompras, setListaCompras] = useState<ListaComprasData | null>(null);
  const [carregandoCompras, setCarregandoCompras] = useState(false);
  const [erroCompras, setErroCompras] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [showTerceiros, setShowTerceiros] = useState(false);
  const [fabricantes, setFabricantes] = useState<string[]>([]);
  const [fabricanteSel, setFabricanteSel] = useState('');
  const [statusTerceiros, setStatusTerceiros] = useState<string[]>(['aberto']);
  const [listaTerceiros, setListaTerceiros] = useState<ListaTerceiroData | null>(null);
  const [carregandoTerceiros, setCarregandoTerceiros] = useState(false);
  const [erroTerceiros, setErroTerceiros] = useState('');
  const [progressoPdfTerc, setProgressoPdfTerc] = useState('');
  const [itensPedido, setItensPedido] = useState<Record<string, ItemPedido[]>>({});

  const [editingPedidoId, setEditingPedidoId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemQtd, setEditItemQtd] = useState(1);
  const [editItemPreco, setEditItemPreco] = useState(0);
  const [editItemBanho, setEditItemBanho] = useState('');

  const [clienteId, setClienteId] = useState('');
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteAberto, setClienteAberto] = useState(false);
  const [prodAberto, setProdAberto] = useState(false);
  const [prodBusca, setProdBusca] = useState('');
  const [tipo, setTipo] = useState('');
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [banho, setBanho] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    const [pedidosRes, clientesRes, categoriasRes] = await Promise.all([
      listarPedidos(),
      listarClientes(),
      listarCategorias(),
    ]);
    if (categoriasRes.success) setTipos((categoriasRes.data as { nome: string }[]).map(c => c.nome).sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })));
    if (pedidosRes.success) setPedidos(pedidosRes.data as Pedido[]);
    if (clientesRes.success) setClientes([...clientesRes.data].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })));
    setLoading(false);
  }

  async function handleCriarPedido() {
    if (!clienteId) { setError('Selecione um cliente'); return; }
    setSaving(true);
    const result = await criarPedido(clienteId);
    if (result.success) {
      setEditingPedidoId(result.data.id);
      setPedidos([result.data as Pedido, ...pedidos]);
      setClienteId('');
      setClienteBusca('');
    } else {
      setError(result.error || 'Erro ao criar pedido');
    }
    setSaving(false);
  }

  async function handleCarregarProdutosPorTipo(tipoSelecionado: string) {
    setTipo(tipoSelecionado);
    setSelectedProdutos([]);
    setProdAberto(false);
    setProdBusca('');
    if (!tipoSelecionado) {
      setProdutosPorTipo([]);
      return;
    }
    const result = await listarProdutosPorTipo(tipoSelecionado);
    if (result.success) setProdutosPorTipo([...(result.data as Produto[])].sort((a, b) => (a.sku || '').localeCompare(b.sku || '', 'pt-BR', { numeric: true, sensitivity: 'base' })));
  }

  async function handleAdicionarItens() {
    if (!editingPedidoId) { setError('Pedido inválido'); return; }
    if (selectedProdutos.length === 0) { setError('Selecione pelo menos um produto'); return; }
    if (!banho) { setError('Selecione o banho'); return; }
    if (!quantidade || quantidade <= 0) { setError('Quantidade inválida'); return; }

    setSaving(true);
    const result = await adicionarItensMultiplos(editingPedidoId, selectedProdutos, quantidade, valorUnitario, banho);
    if (result.success) {
      carregarItensPedido(editingPedidoId);
      carregarDados();
      setTipo('');
      setSelectedProdutos([]);
      setBanho('');
      setQuantidade(1);
      setValorUnitario(0);
      setProdutosPorTipo([]);
    } else {
      setError(result.error || 'Erro ao adicionar itens');
    }
    setSaving(false);
  }

  async function carregarItensPedido(pedidoId: string) {
    const result = await listarItensPedido(pedidoId);
    if (result.success) {
      setItensPedido({ ...itensPedido, [pedidoId]: result.data as ItemPedido[] });
    }
  }

  async function handleExpandirPedido(pedidoId: string) {
    if (expandedPedido === pedidoId) {
      setExpandedPedido(null);
    } else {
      setExpandedPedido(pedidoId);
      carregarItensPedido(pedidoId);
    }
  }

  async function handleMudarStatus(pedidoId: string, novoStatus: string) {
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    await atualizarStatusPedido(pedidoId, novoStatus);
  }

  async function handleDeletarPedido(pedidoId: string) {
    if (!confirm('Excluir pedido?')) return;
    const result = await deletarPedido(pedidoId);
    if (result.success) {
      setPedidos(pedidos.filter(p => p.id !== pedidoId));
      if (editingPedidoId === pedidoId) setEditingPedidoId(null);
    }
  }

  async function carregarCompras(statuses: string[]) {
    setCarregandoCompras(true);
    setErroCompras('');
    if (statuses.length === 0) {
      setListaCompras(null);
      setCarregandoCompras(false);
      return;
    }
    const result = await gerarListaCompras(statuses);
    if (result.success) setListaCompras(result.data);
    else {
      setListaCompras(null);
      setErroCompras(result.error);
    }
    setCarregandoCompras(false);
  }

  function abrirCompras() {
    const inicial = ['aberto'];
    setStatusCompras(inicial);
    setListaCompras(null);
    setShowCompras(true);
    carregarCompras(inicial);
  }

  function alternarStatusCompras(chave: string) {
    const novo = statusCompras.includes(chave) ? statusCompras.filter(x => x !== chave) : [...statusCompras, chave];
    setStatusCompras(novo);
    carregarCompras(novo);
  }

  async function handleBaixarPdf() {
    if (!listaCompras) return;
    setGerandoPdf(true);
    try {
      await baixarListaComprasPdf(listaCompras);
    } catch {
      setErroCompras('Não foi possível gerar o PDF. Tente novamente.');
    }
    setGerandoPdf(false);
  }

  async function carregarTerceiros(fabricante: string, statuses: string[]) {
    setErroTerceiros('');
    setListaTerceiros(null);
    if (!fabricante || statuses.length === 0) return;
    setCarregandoTerceiros(true);
    const result = await gerarListaFabricante(fabricante, statuses);
    if (result.success) setListaTerceiros(result.data);
    else setErroTerceiros(result.error);
    setCarregandoTerceiros(false);
  }

  async function abrirTerceiros() {
    setStatusTerceiros(['aberto']);
    setFabricanteSel('');
    setListaTerceiros(null);
    setErroTerceiros('');
    setShowTerceiros(true);
    if (fabricantes.length === 0) {
      const res = await listarFabricantesTerceiros();
      if (res.success) setFabricantes(res.data);
      else setErroTerceiros(res.error);
    }
  }

  function escolherFabricante(nome: string) {
    setFabricanteSel(nome);
    carregarTerceiros(nome, statusTerceiros);
  }

  function alternarStatusTerceiros(chave: string) {
    const novo = statusTerceiros.includes(chave) ? statusTerceiros.filter(x => x !== chave) : [...statusTerceiros, chave];
    setStatusTerceiros(novo);
    carregarTerceiros(fabricanteSel, novo);
  }

  async function handleBaixarPdfTerceiros() {
    if (!listaTerceiros) return;
    setGerandoPdf(true);
    setErroTerceiros('');
    try {
      await baixarListaTerceiroPdf(listaTerceiros, (feitas, total) => setProgressoPdfTerc(`Carregando fotos: ${feitas} de ${total}...`));
    } catch {
      setErroTerceiros('Não foi possível gerar o PDF. Tente novamente.');
    }
    setProgressoPdfTerc('');
    setGerandoPdf(false);
  }

  function handleStartEditItem(item: ItemPedido) {
    setEditingItemId(item.id);
    setEditItemQtd(item.quantidade);
    setEditItemPreco(item.preco_unitario);
    setEditItemBanho(item.banho || '');
  }

  async function handleSalvarItem(pedidoId: string) {
    if (!editingItemId) return;
    if (!editItemBanho) { alert('Selecione o banho'); return; }
    const result = await atualizarItemPedido(editingItemId, pedidoId, editItemQtd, editItemPreco, editItemBanho);
    if (result.success) {
      setItensPedido(prev => ({
        ...prev,
        [pedidoId]: prev[pedidoId].map(it =>
          it.id === editingItemId ? { ...it, quantidade: editItemQtd, preco_unitario: editItemPreco, banho: editItemBanho } : it
        ),
      }));
      setPedidos(prev => prev.map(p => {
        if (p.id !== pedidoId) return p;
        const total = (itensPedido[pedidoId] || []).reduce((acc, it) => {
          const q = it.id === editingItemId ? editItemQtd : it.quantidade;
          const pr = it.id === editingItemId ? editItemPreco : it.preco_unitario;
          return acc + q * pr;
        }, 0);
        return { ...p, valor_total: total };
      }));
      setEditingItemId(null);
    } else {
      alert(result.error || 'Erro ao salvar item');
    }
  }

  async function handleDeletarItem(itemId: string, pedidoId: string) {
    if (!confirm('Excluir item?')) return;
    const result = await deletarItemPedido(itemId, pedidoId);
    if (result.success) {
      const novosItens = (itensPedido[pedidoId] || []).filter(it => it.id !== itemId);
      setItensPedido(prev => ({ ...prev, [pedidoId]: novosItens }));
      const novoTotal = novosItens.reduce((acc, it) => acc + it.quantidade * it.preco_unitario, 0);
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, valor_total: novoTotal } : p));
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '6px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' };
  const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const btnSm: React.CSSProperties = { border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Carregando pedidos...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', padding: '0 4px' }}>
      {/* Header compacto */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--marca)', color: 'var(--ouro-claro)' }}><ClipboardList size={17} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Pedidos</h1>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>({pedidos.filter(p => filtroStatus === 'todos' || p.status === filtroStatus).length})</span>
          {/* Filtros de status */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            {([
              { key: 'todos',        label: 'Todos',          bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
              { key: 'aberto',       label: 'Aberto',         bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
              { key: 'em_fabricacao',label: 'Em Fabricação',  bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
              { key: 'fechado',      label: 'Fechado',        bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
            ] as { key: string; label: string; bg: string; color: string; border: string }[]).map(({ key, label, bg, color, border }) => (
              <button key={key} onClick={() => setFiltroStatus(key)}
                style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: filtroStatus === key ? '700' : '500',
                  cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                  backgroundColor: filtroStatus === key ? bg : 'transparent',
                  color: filtroStatus === key ? color : '#94a3b8',
                  borderColor: filtroStatus === key ? border : 'var(--borda)',
                  boxShadow: filtroStatus === key ? `0 0 0 2px ${border}55` : 'none',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={abrirCompras}
            title="Gerar lista de compras em PDF"
            style={{ background: 'var(--superficie)', color: 'var(--acao)', border: '1px solid var(--borda-forte)', padding: '7px 14px', borderRadius: 'var(--raio-sm)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Lista de compras
          </button>
          <button
            onClick={abrirTerceiros}
            title="Gerar lista de pedidos de um fabricante terceirizado em PDF"
            style={{ background: 'var(--superficie)', color: 'var(--acao)', border: '1px solid var(--borda-forte)', padding: '7px 14px', borderRadius: 'var(--raio-sm)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Lista por fabricante
          </button>
        </div>
      </div>

      {/* Form - Novo Pedido (compacto, em linha) */}
      {editingPedidoId === null && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: 'var(--sombra-sutil)', border: '1px solid var(--borda)', padding: '12px 16px', marginBottom: '10px', borderLeft: '3px solid var(--ouro)' }}>
          {error && <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '5px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cliente *</label>
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => { setClienteAberto(!clienteAberto); setClienteBusca(''); }}
                  style={{ ...inputStyle, color: clienteId ? '#111827' : 'var(--texto-suave)', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{clientes.find(c => c.id === clienteId)?.nome || 'Selecione um cliente'}</span>
                  <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                </button>
                {clienteAberto && (
                  <>
                    <div onClick={() => setClienteAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '2px', backgroundColor: 'white', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', boxShadow: 'var(--sombra-media)' }}>
                      <div style={{ padding: '6px', borderBottom: '1px solid var(--borda)' }}>
                        <input type="text" autoFocus value={clienteBusca} placeholder="Buscar cliente..."
                          onChange={(e) => setClienteBusca(e.target.value)}
                          style={{ ...inputStyle, color: '#111827' }} />
                      </div>
                      <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        {clientes.filter(c => c.nome.toLowerCase().includes(clienteBusca.trim().toLowerCase())).map(c => (
                          <div key={c.id}
                            onClick={() => { setClienteId(c.id); setClienteBusca(''); setClienteAberto(false); }}
                            style={{ padding: '7px 10px', fontSize: '13px', cursor: 'pointer', backgroundColor: c.id === clienteId ? 'var(--ouro-suave)' : 'white', color: 'var(--texto)' }}>
                            {c.nome}
                          </div>
                        ))}
                        {clientes.filter(c => c.nome.toLowerCase().includes(clienteBusca.trim().toLowerCase())).length === 0 && (
                          <div style={{ padding: '7px 10px', fontSize: '12px', color: 'var(--texto-suave)' }}>Nenhum cliente encontrado</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <button onClick={handleCriarPedido} disabled={saving}
              style={{ ...btnSm, backgroundColor: saving ? 'var(--texto-mudo)' : 'var(--acao)', color: 'white', whiteSpace: 'nowrap', padding: '7px 16px' }}>
              {saving ? 'Criando...' : 'Criar Pedido'}
            </button>
          </div>
        </div>
      )}

      {/* Form - Adicionar Itens (compacto) */}
      {editingPedidoId && (
        <div onClick={() => !saving && setEditingPedidoId(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: 'var(--sombra-modal)', padding: '18px 20px', maxWidth: '760px', width: '94%', maxHeight: '90vh', overflowY: 'auto', borderTop: '3px solid var(--ouro)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adicionando itens em:</span>
            <span style={{ backgroundColor: 'var(--ouro-suave)', color: 'var(--ouro-escuro)', padding: '3px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
              {pedidos.find(p => p.id === editingPedidoId)?.numero_pedido || '—'}
            </span>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {pedidos.find(p => p.id === editingPedidoId)?.clientes?.nome || ''}
            </span>
          </div>
          {error && <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px', padding: '6px 10px', backgroundColor: '#fef2f2', borderRadius: '5px' }}>{error}</div>}

          {/* Linha 1: Tipo */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tipo</label>
              <select value={tipo} onChange={(e) => handleCarregarProdutosPorTipo(e.target.value)} style={{ ...inputStyle, color: '#111827' }}>
                <option value="">Selecione o tipo</option>
                {tipos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>Banho *</label>
              <select value={banho} onChange={(e) => setBanho(e.target.value)} style={{ ...inputStyle, color: '#111827' }}>
                <option value="">Selecione</option>
                {BANHOS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ width: '130px' }}>
              <label style={labelStyle}>Qtd</label>
              <QtdStepper value={quantidade} onChange={setQuantidade} />
            </div>
            <div style={{ width: '120px' }}>
              <label style={labelStyle}>Valor Unit. (R$)</label>
              <input type="number" value={valorUnitario === 0 ? '' : valorUnitario} onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)} min="0" step="0.01" placeholder="0,00" style={{ ...inputStyle, textAlign: 'right' }} />
            </div>
          </div>

          {/* Produtos - dropdown com busca e seleção múltipla */}
          {tipo && produtosPorTipo.length > 0 && (() => {
            const termo = prodBusca.trim().toLowerCase();
            const filtrados = produtosPorTipo.filter(p => !termo || `${p.sku} ${p.nome || ''}`.toLowerCase().includes(termo));
            const alternar = (id: string) => setSelectedProdutos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
            return (
              <div style={{ marginBottom: '10px' }}>
                <label style={labelStyle}>Produtos</label>
                <button type="button" onClick={() => { setProdAberto(!prodAberto); setProdBusca(''); }}
                  style={{ ...inputStyle, color: selectedProdutos.length ? '#111827' : 'var(--texto-suave)', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{selectedProdutos.length ? `${selectedProdutos.length} produto(s) selecionado(s)` : `Selecione os produtos (${produtosPorTipo.length} disponíveis)`}</span>
                  <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                </button>
                {prodAberto && (
                  <div style={{ marginTop: '4px', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', backgroundColor: 'white' }}>
                    <div style={{ padding: '6px', borderBottom: '1px solid var(--borda)' }}>
                      <input type="text" autoFocus value={prodBusca} onChange={e => setProdBusca(e.target.value)} placeholder="Buscar por código ou nome..." style={{ ...inputStyle, color: '#111827' }} />
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', fontWeight: '600' }}>
                        <button type="button" onClick={() => setSelectedProdutos(prev => Array.from(new Set([...prev, ...filtrados.map(p => p.id)])))}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--acao)' }}>Selecionar {termo ? 'filtrados' : 'todos'} ({filtrados.length})</button>
                        <button type="button" onClick={() => setSelectedProdutos([])}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--texto-suave)' }}>Limpar seleção</button>
                      </div>
                    </div>
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                      {filtrados.map(p => {
                        const marcado = selectedProdutos.includes(p.id);
                        return (
                          <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', backgroundColor: marcado ? 'var(--ouro-suave)' : 'white', color: 'var(--texto)', borderBottom: '1px solid #f1f5f9' }}>
                            <input type="checkbox" checked={marcado} onChange={() => alternar(p.id)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                            <span><strong>{p.sku}</strong>{p.nome ? ` - ${p.nome}` : ''}</span>
                          </label>
                        );
                      })}
                      {filtrados.length === 0 && <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--texto-suave)' }}>Nenhum produto encontrado</div>}
                    </div>
                    <div style={{ padding: '6px', borderTop: '1px solid var(--borda)', textAlign: 'right' }}>
                      <button type="button" onClick={() => setProdAberto(false)} style={{ ...btnSm, backgroundColor: 'var(--acao)', color: 'white' }}>Concluir</button>
                    </div>
                  </div>
                )}
                {selectedProdutos.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                    {selectedProdutos.map(id => {
                      const p = produtosPorTipo.find(x => x.id === id);
                      return (
                        <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', padding: '2px 4px 2px 8px', borderRadius: '12px', backgroundColor: 'var(--ouro-suave)', color: 'var(--ouro-escuro)' }}>
                          {p?.sku || '—'}
                          <button type="button" aria-label={`Remover ${p?.sku || ''}`} onClick={() => alternar(id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '14px', lineHeight: 1, padding: '0 4px' }}>×</button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button onClick={handleAdicionarItens} disabled={saving}
              style={{ ...btnSm, backgroundColor: saving ? 'var(--texto-mudo)' : 'var(--acao)', color: 'white', padding: '6px 14px' }}>
              {saving ? 'Adicionando...' : 'Adicionar Itens'}
            </button>
            <button onClick={() => setEditingPedidoId(null)}
              style={{ ...btnSm, backgroundColor: '#6b7280', color: 'white', padding: '6px 14px' }}>
              Fechar
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Lista de Pedidos */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--borda)' }}>
              <th style={thStyle}>Nº Pedido</th>
              <th style={thStyle}>Data</th>
              <th style={thStyle}>Cliente</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Total</th>
              <th style={thStyle}>Status</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '110px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length > 0 ? (
              pedidos.filter(p => filtroStatus === 'todos' || p.status === filtroStatus).map((p) => (
                <React.Fragment key={p.id}>
                  <tr
                    onMouseEnter={() => setHoveredRow(p.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ backgroundColor: hoveredRow === p.id ? '#fafafa' : 'white', borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s' }}
                  >
                    <td style={{ padding: '7px 12px', fontSize: '13px', fontWeight: '600', color: 'var(--acao)' }}>
                      {p.numero_pedido}
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: '12px', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                      {p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: '12px', color: '#374151' }}>
                      {p.clientes?.nome || '—'}
                    </td>
                    <td style={{ padding: '7px 12px', fontSize: '13px', fontWeight: '600', color: '#059669', textAlign: 'right' }}>
                      R$ {p.valor_total.toFixed(2)}
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <select value={p.status} onChange={(e) => handleMudarStatus(p.id, e.target.value)}
                        style={{ padding: '3px 6px', borderRadius: '5px', fontSize: '11px', fontWeight: '600', border: 'none',
                          backgroundColor: STATUS_CONFIG[p.status]?.bg || '#f3f4f6',
                          color: STATUS_CONFIG[p.status]?.color || '#374151', cursor: 'pointer' }}>
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {/* Adicionar Itens */}
                        <button
                          onClick={() => setEditingPedidoId(editingPedidoId === p.id ? null : p.id)}
                          title="Adicionar itens"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '28px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: editingPedidoId === p.id ? '#d1fae5' : 'transparent', borderColor: editingPedidoId === p.id ? '#6ee7b7' : '#d1fae5', color: '#059669' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                          </svg>
                        </button>
                        {/* Ver / Ocultar Itens */}
                        <button
                          onClick={() => handleExpandirPedido(p.id)}
                          title={expandedPedido === p.id ? 'Ocultar itens' : 'Ver itens'}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '28px', borderRadius: '6px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: expandedPedido === p.id ? 'var(--acao-suave)' : 'transparent', borderColor: 'var(--borda-forte)', color: 'var(--acao)' }}>
                          {expandedPedido === p.id ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                              <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          )}
                        </button>
                        {/* Excluir */}
                        <button
                          onClick={() => handleDeletarPedido(p.id)}
                          title="Excluir pedido"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '28px', borderRadius: '6px', border: '1px solid #fecaca', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: 'transparent', color: '#dc2626' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Itens expandidos compactos */}
                  {expandedPedido === p.id && itensPedido[p.id] && (
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <td colSpan={6} style={{ padding: '8px 12px' }}>
                        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Tipo</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Ref.</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Banho</th>
                              <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Qtd</th>
                              <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Etapa</th>
                              <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>V.Unit</th>
                              <th style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '600', color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Subtotal</th>
                              <th style={{ padding: '4px 8px', width: '60px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {itensPedido[p.id].map((item, idx) => {
                              const editing = editingItemId === item.id;
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: editing ? '#fefce8' : 'transparent' }}>
                                  <td style={{ padding: '4px 8px', color: '#374151' }}>{item.produtos?.categoria || '—'}</td>
                                  <td style={{ padding: '4px 8px', fontWeight: '600', color: 'var(--acao)' }}>{item.produtos?.sku || '—'}</td>
                                  <td style={{ padding: '4px 8px', color: '#374151' }}>
                                    {editing ? (
                                      <select value={editItemBanho} onChange={e => setEditItemBanho(e.target.value)}
                                        style={{ padding: '2px 4px', border: '1px solid #d97706', borderRadius: '4px', fontSize: '12px', backgroundColor: 'white', color: '#111827' }}>
                                        <option value="">Selecione</option>
                                        {BANHOS.map(b => <option key={b} value={b}>{b}</option>)}
                                      </select>
                                    ) : (item.banho || '—')}
                                  </td>
                                  <td style={{ padding: '4px 8px', textAlign: 'center', color: '#374151' }}>
                                    {editing ? (
                                      <QtdStepper compacto value={editItemQtd} onChange={setEditItemQtd} />
                                    ) : item.quantidade}
                                  </td>
                                  <td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                                    {(() => {
                                      const cfg = item.etapa_fabricacao ? ETAPA_CONFIG[item.etapa_fabricacao] : null;
                                      if (cfg) return <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>;
                                      if (p.status === 'fechado' || p.status === 'em_fabricacao') return <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '10px', backgroundColor: 'var(--sucesso-bg)', color: 'var(--sucesso)' }}>Concluído</span>;
                                      return <span style={{ color: '#9ca3af' }}>—</span>;
                                    })()}
                                  </td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', color: '#374151' }}>
                                    {editing ? (
                                      <input type="number" value={editItemPreco} min="0" step="0.01"
                                        onChange={e => setEditItemPreco(parseFloat(e.target.value) || 0)}
                                        style={{ width: '72px', padding: '2px 4px', border: '1px solid #d97706', borderRadius: '4px', textAlign: 'right', fontSize: '12px' }} />
                                    ) : `R$ ${item.preco_unitario.toFixed(2)}`}
                                  </td>
                                  <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                    R$ {(editing ? editItemQtd * editItemPreco : item.preco_unitario * item.quantidade).toFixed(2)}
                                  </td>
                                  <td style={{ padding: '4px 8px' }}>
                                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'flex-end' }}>
                                      {editing ? (
                                        <>
                                          <button onClick={() => handleSalvarItem(p.id)} title="Salvar"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '22px', borderRadius: '4px', border: '1px solid #6ee7b7', backgroundColor: '#d1fae5', color: '#059669', cursor: 'pointer' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                          </button>
                                          <button onClick={() => setEditingItemId(null)} title="Cancelar"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '22px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#6b7280', cursor: 'pointer' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button onClick={() => handleStartEditItem(item)} title="Editar item"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '22px', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: 'transparent', color: '#3b82f6', cursor: 'pointer' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          </button>
                                          <button onClick={() => handleDeletarItem(item.id, p.id)} title="Excluir item"
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '22px', borderRadius: '4px', border: '1px solid #fecaca', backgroundColor: 'transparent', color: '#dc2626', cursor: 'pointer' }}>
                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center' }}>
                  <div style={{ color: '#94a3b8' }}>
                    <div style={{ marginBottom: '8px', opacity: 0.5, display: 'flex', justifyContent: 'center', color: 'var(--texto-suave)' }}><ClipboardList size={32} strokeWidth={1.25} aria-hidden="true" /></div>
                    <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 2px 0', fontWeight: '500' }}>Nenhum pedido cadastrado</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Clique em &quot;+ Novo Pedido&quot; para começar</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showTerceiros && (
        <div onClick={() => !gerandoPdf && setShowTerceiros(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '22px', maxWidth: '520px', width: '94%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 4px' }}>Lista por fabricante</h2>
            <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Gera o PDF com os produtos dos pedidos que precisam ser fabricados por um terceiro, com foto, quantidade e colunas de conferência.
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Fabricante *</label>
            <select value={fabricanteSel} onChange={e => escolherFabricante(e.target.value)} disabled={gerandoPdf}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', backgroundColor: 'white', marginBottom: '14px', boxSizing: 'border-box' }}>
              <option value="">Selecione o fabricante</option>
              {fabricantes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '13px', color: '#334155' }}>
              <span style={{ fontWeight: '600' }}>Status do pedido:</span>
              {[{ key: 'aberto', label: 'Aberto' }, { key: 'em_fabricacao', label: 'Em Fabricação (itens ainda não concluídos)' }, { key: 'fechado', label: 'Fechado' }].map(o => (
                <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={statusTerceiros.includes(o.key)} disabled={gerandoPdf} onChange={() => alternarStatusTerceiros(o.key)} />
                  {o.label}
                </label>
              ))}
            </div>

            {erroTerceiros && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>{erroTerceiros}</div>
            )}
            {carregandoTerceiros && <p style={{ fontSize: '13px', color: 'var(--texto-suave)' }}>Calculando...</p>}
            {!carregandoTerceiros && fabricanteSel && statusTerceiros.length === 0 && (
              <p style={{ fontSize: '13px', color: '#b45309' }}>Selecione ao menos um status.</p>
            )}
            {!carregandoTerceiros && listaTerceiros && (
              <p style={{ fontSize: '13px', color: listaTerceiros.linhas.length === 0 ? '#b45309' : '#047857', fontWeight: '600', margin: '0 0 14px' }}>
                {listaTerceiros.linhas.length === 0
                  ? 'Nenhum produto deste fabricante nos pedidos com esse status.'
                  : `${listaTerceiros.linhas.length} produto(s) · ${listaTerceiros.linhas.reduce((t, l) => t + l.quantidade, 0).toLocaleString('pt-BR')} peça(s) · ${listaTerceiros.pedidos} pedido(s)`}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTerceiros(false)} disabled={gerandoPdf}
                style={{ padding: '10px 18px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Fechar
              </button>
              <button onClick={handleBaixarPdfTerceiros} disabled={gerandoPdf || carregandoTerceiros || !listaTerceiros || listaTerceiros.linhas.length === 0}
                style={{ padding: '10px 18px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
                  cursor: gerandoPdf || carregandoTerceiros || !listaTerceiros || listaTerceiros.linhas.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: gerandoPdf || carregandoTerceiros || !listaTerceiros || listaTerceiros.linhas.length === 0 ? 0.5 : 1 }}>
                {gerandoPdf ? (progressoPdfTerc || 'Gerando PDF...') : 'Baixar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompras && (
        <div onClick={() => !gerandoPdf && setShowCompras(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '22px', maxWidth: '820px', width: '94%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 4px' }}>Lista de compras</h2>
            <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Soma os itens (componentes) de todos os produtos dos pedidos escolhidos, agrupados por fornecedor.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '13px', color: '#334155' }}>
              <span style={{ fontWeight: '600' }}>Pedidos:</span>
              {[{ key: 'aberto', label: 'Aberto' }, { key: 'em_fabricacao', label: 'Em Fabricação (itens ainda não concluídos)' }].map(o => (
                <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={statusCompras.includes(o.key)} onChange={() => alternarStatusCompras(o.key)} />
                  {o.label}
                </label>
              ))}
            </div>

            {erroCompras && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', fontSize: '13px', marginBottom: '12px' }}>{erroCompras}</div>
            )}

            {carregandoCompras && <p style={{ fontSize: '13px', color: 'var(--texto-suave)' }}>Calculando...</p>}

            {!carregandoCompras && statusCompras.length === 0 && (
              <p style={{ fontSize: '13px', color: '#b45309' }}>Selecione ao menos um tipo de pedido.</p>
            )}

            {!carregandoCompras && listaCompras && (
              <>
                <p style={{ fontSize: '12px', color: 'var(--texto-suave)', margin: '0 0 10px' }}>
                  {listaCompras.pedidos.length} pedido(s) considerado(s)
                  {listaCompras.pedidos.length > 0 && <>: {listaCompras.pedidos.map(p => p.numero).join(', ')}</>}
                </p>

                {listaCompras.grupos.length === 0 && (
                  <div style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid var(--borda)', borderRadius: '8px', fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                    {listaCompras.pedidos.length === 0
                      ? 'Nenhum pedido encontrado com os status escolhidos.'
                      : 'Nenhum item a comprar: os produtos desses pedidos ainda não têm itens vinculados (Cadastros > Produtos > ícone de caixa).'}
                  </div>
                )}

                {listaCompras.grupos.map(g => (
                  <div key={g.fornecedor?.id || 'sem'} style={{ border: '1px solid var(--borda)', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', backgroundColor: g.fornecedor ? 'var(--acao-suave)' : 'var(--atencao-bg)', fontSize: '13px', fontWeight: '700', color: g.fornecedor ? 'var(--acao)' : 'var(--atencao)' }}>
                      {g.fornecedor ? g.fornecedor.nome : 'Sem fornecedor definido'}
                      {g.fornecedor && (g.fornecedor.telefone || g.fornecedor.email) && (
                        <span style={{ fontWeight: '400', color: 'var(--texto-suave)', marginLeft: '10px', fontSize: '12px' }}>
                          {[g.fornecedor.telefone, g.fornecedor.email].filter(Boolean).join(' | ')}
                        </span>
                      )}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '480px' }}>
                        <thead>
                          <tr style={{ color: 'var(--texto-suave)', textAlign: 'left' }}>
                            <th style={{ padding: '6px 12px' }}>Item</th>
                            <th style={{ padding: '6px 8px' }}>Un.</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Qtd. a comprar</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right' }}>Valor unit.</th>
                            <th style={{ padding: '6px 12px', textAlign: 'right' }}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.itens.map(i => (
                            <tr key={i.itemId} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '6px 12px', color: 'var(--texto)' }}>{i.nome}</td>
                              <td style={{ padding: '6px 8px', color: '#475569' }}>{UNIDADE_ROTULO[i.unidade] || i.unidade}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color: 'var(--texto)' }}>{formatarQuantidade(i.quantidade)}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', color: '#475569' }}>{formatarMoeda(i.valorUnitario)}</td>
                              <td style={{ padding: '6px 12px', textAlign: 'right', color: '#475569' }}>{formatarMoeda(i.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ borderTop: '1px solid var(--borda)', backgroundColor: '#f8fafc' }}>
                            <td colSpan={4} style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', color: '#334155' }}>Total do fornecedor</td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '700', color: '#334155' }}>{formatarMoeda(g.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {listaCompras.grupos.length > 0 && (
                  <p style={{ textAlign: 'right', fontSize: '14px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 12px' }}>
                    Total geral estimado: {formatarMoeda(listaCompras.total)}
                  </p>
                )}

                {listaCompras.produtosSemItens.length > 0 && (
                  <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>
                    <b>Atenção:</b> estes produtos estão nos pedidos mas não têm itens vinculados, então não entram na lista:{' '}
                    {listaCompras.produtosSemItens.map(p => `${p.sku} (${p.quantidade})`).join(', ')}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCompras(false)} disabled={gerandoPdf}
                style={{ padding: '10px 18px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Fechar
              </button>
              <button onClick={handleBaixarPdf} disabled={gerandoPdf || carregandoCompras || !listaCompras || listaCompras.grupos.length === 0}
                style={{ padding: '10px 18px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px',
                  cursor: gerandoPdf || carregandoCompras || !listaCompras || listaCompras.grupos.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: gerandoPdf || carregandoCompras || !listaCompras || listaCompras.grupos.length === 0 ? 0.5 : 1 }}>
                {gerandoPdf ? 'Gerando PDF...' : 'Baixar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
