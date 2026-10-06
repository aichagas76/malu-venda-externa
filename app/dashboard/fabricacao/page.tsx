'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarItensFabricacao, avancarEtapa, voltarEtapa, salvarObservacao, salvarPrestador, salvarSoldador, salvarEncartelador } from './actions';
import { listarPrestadores } from '../cadastros/prestadores/actions';
import { listarSoldadores } from '../cadastros/soldadores/actions';
import { listarEncarteladores } from '../cadastros/encarteladores/actions';
import { Factory, ArrowDownToLine, Check } from 'lucide-react';
import MontagemAcessorios from './MontagemAcessorios';

const ETAPAS = [
  { key: 'montagem_inicial',  label: 'Montagem Inicial',     cor: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  { key: 'producao',          label: 'Produção',              cor: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { key: 'preparado_banho',   label: 'Preparado p/ Banho',   cor: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  { key: 'encartelamento',    label: 'Encartelamento',        cor: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  { key: 'enviado_cliente',   label: 'Envio ao Cliente',      cor: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
];

const BANHO_COLORS: Record<string, { bg: string; color: string }> = {
  Ouro:     { bg: '#fef9c3', color: '#854d0e' },
  Prata:    { bg: '#f1f5f9', color: '#475569' },
  Diamante: { bg: '#f0f9ff', color: '#0369a1' },
};

interface ItemFabricacao {
  id: string;
  quantidade: number;
  preco_unitario: number;
  etapa_fabricacao: string;
  banho?: string;
  observacao?: string;
  prestador_nome?: string;
  prestador_data_saida?: string;
  prestador_data_retorno?: string;
  soldador_nome?: string;
  soldador_data_saida?: string;
  soldador_data_retorno?: string;
  encartelador_nome?: string;
  encartelador_data_saida?: string;
  encartelador_data_retorno?: string;
  produto?: { id: string; nome: string; sku: string; categoria: string; imagem_url?: string };
  pedido?: { id: string; numero_pedido: string; cliente?: { nome: string } };
}

interface GrupoProduto {
  produtoId: string;
  sku: string;
  categoria: string;
  totalQtd: number;
  itens: ItemFabricacao[];
}

function agruparPorProduto(itens: ItemFabricacao[]): GrupoProduto[] {
  const map = new Map<string, GrupoProduto>();
  for (const item of itens) {
    // Agrupa por produto + banho para separar Ouro/Prata do mesmo SKU
    const key = `${item.produto?.id || 'sem-produto'}__${item.banho || ''}`;
    if (!map.has(key)) {
      map.set(key, {
        produtoId: key,
        sku: item.produto?.sku || '—',
        categoria: item.produto?.categoria || '',
        totalQtd: 0,
        itens: [],
      });
    }
    const g = map.get(key)!;
    g.totalQtd += item.quantidade;
    g.itens.push(item);
  }
  return Array.from(map.values());
}

// SVG icons
const IconMontador = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="5" r="2.6" />
    <path d="M8 8.2v7" />
    <path d="M8 15.2l-3 6" />
    <path d="M8 15.2l3 6" />
    <path d="M8 10.5l5.5-1.5" />
    <circle cx="14.6" cy="8.6" r="1.7" />
    <path d="M15.8 9.8l5 5" />
  </svg>
);

const IconSoldador = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="8" cy="5" r="2.6" />
    <rect x="5.4" y="4.6" width="5.2" height="2.2" rx="0.6" fill="currentColor" stroke="none" />
    <path d="M8 8.2v7" />
    <path d="M8 15.2l-3 6" />
    <path d="M8 15.2l3 6" />
    <path d="M8 10.5l6 1.2" />
    <path d="M14 11.7l2.4.5" />
    <path d="M19 9l1.4-1.6M19.6 12.4h2.2M19 15.6l1.4 1.6" />
  </svg>
);

const IconEncartelador = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="7" cy="5" r="2.6" />
    <path d="M7 8.2v7" />
    <path d="M7 15.2l-3 6" />
    <path d="M7 15.2l3 6" />
    <path d="M7 10.5l5.5-1" />
    <rect x="12.5" y="4.5" width="9" height="11" rx="1.2" />
    <circle cx="15.5" cy="8" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="18.7" cy="8" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="18.7" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const IconBack = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconNext = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function FabricacaoPage() {
  const [itens, setItens] = useState<ItemFabricacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<'etapas' | 'acessorios'>('etapas');
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'' | 'prestador' | 'soldador' | 'encartelamento'>('');
  const [fotoPopup, setFotoPopup] = useState<{ url: string; sku: string; nome: string } | null>(null);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [prestadorPopup, setPrestadorPopup] = useState<{ itemId: string; nome: string; dataSaida: string; dataRetorno: string; modo: 'saida' | 'retorno' } | null>(null);
  const [soldadorPopup, setSoldadorPopup] = useState<{ itemId: string; nome: string; dataSaida: string; dataRetorno: string; modo: 'saida' | 'retorno' } | null>(null);
  const [encarteladorPopup, setEncarteladorPopup] = useState<{ itemId: string; nome: string; dataSaida: string; dataRetorno: string; modo: 'saida' | 'retorno' } | null>(null);

  const [prestadoresCadastro, setPrestadoresCadastro] = useState<{ id: string; nome: string }[]>([]);
  const [soldadoresCadastro, setSoldadoresCadastro] = useState<{ id: string; nome: string }[]>([]);
  const [encarteladoresCadastro, setEncarteladoresCadastro] = useState<{ id: string; nome: string }[]>([]);

  const carregarItens = useCallback(async () => {
    const result = await listarItensFabricacao();
    if (result.success) setItens(result.data as ItemFabricacao[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregarItens(); }, [carregarItens]);

  useEffect(() => {
    listarPrestadores().then(r => { if (r.success) setPrestadoresCadastro(r.data as { id: string; nome: string }[]); });
    listarSoldadores().then(r => { if (r.success) setSoldadoresCadastro(r.data as { id: string; nome: string }[]); });
    listarEncarteladores().then(r => { if (r.success) setEncarteladoresCadastro(r.data as { id: string; nome: string }[]); });
  }, []);

  async function handleAvancar(itemId: string) {
    setAdvancing(itemId);
    const result = await avancarEtapa(itemId);
    if (result.success) {
      if ((result as { concluido?: boolean }).concluido) {
        setItens(prev => prev.filter(it => it.id !== itemId));
      } else {
        setItens(prev => prev.map(it =>
          it.id === itemId ? { ...it, etapa_fabricacao: (result as { proxima?: string }).proxima || it.etapa_fabricacao } : it
        ));
      }
    }
    setAdvancing(null);
  }

  function handleStartObs(item: ItemFabricacao) {
    setEditingObsId(item.id);
    setObsText(item.observacao || '');
  }

  async function handleSalvarObs(itemId: string) {
    await salvarObservacao(itemId, obsText);
    setItens(prev => prev.map(it => it.id === itemId ? { ...it, observacao: obsText || undefined } : it));
    setEditingObsId(null);
  }

  function handleOpenPrestador(item: ItemFabricacao, modo: 'saida' | 'retorno') {
    const hoje = new Date().toISOString().split('T')[0];
    setPrestadorPopup({
      itemId: item.id,
      nome: item.prestador_nome || '',
      dataSaida: item.prestador_data_saida || hoje,
      dataRetorno: item.prestador_data_retorno || '',
      modo,
    });
  }

  async function handleSalvarPrestador() {
    if (!prestadorPopup) return;
    if (prestadorPopup.modo === 'saida' && !prestadorPopup.nome) { alert('Selecione um prestador'); return; }
    await salvarPrestador(
      prestadorPopup.itemId,
      prestadorPopup.nome,
      prestadorPopup.dataSaida,
      prestadorPopup.dataRetorno
    );
    setItens(prev => prev.map(it =>
      it.id === prestadorPopup.itemId
        ? {
            ...it,
            prestador_nome: prestadorPopup.nome || undefined,
            prestador_data_saida: prestadorPopup.dataSaida || undefined,
            prestador_data_retorno: prestadorPopup.dataRetorno || undefined,
          }
        : it
    ));
    setPrestadorPopup(null);
  }

  function handleOpenSoldador(item: ItemFabricacao, modo: 'saida' | 'retorno') {
    const hoje = new Date().toISOString().split('T')[0];
    setSoldadorPopup({
      itemId: item.id,
      nome: item.soldador_nome || '',
      dataSaida: item.soldador_data_saida || hoje,
      dataRetorno: item.soldador_data_retorno || '',
      modo,
    });
  }

  async function handleSalvarSoldador() {
    if (!soldadorPopup) return;
    if (soldadorPopup.modo === 'saida' && !soldadorPopup.nome) { alert('Selecione um soldador'); return; }
    await salvarSoldador(
      soldadorPopup.itemId,
      soldadorPopup.nome,
      soldadorPopup.dataSaida,
      soldadorPopup.dataRetorno
    );
    setItens(prev => prev.map(it =>
      it.id === soldadorPopup.itemId
        ? {
            ...it,
            soldador_nome: soldadorPopup.nome || undefined,
            soldador_data_saida: soldadorPopup.dataSaida || undefined,
            soldador_data_retorno: soldadorPopup.dataRetorno || undefined,
          }
        : it
    ));
    setSoldadorPopup(null);
  }

  function handleOpenEncartelador(item: ItemFabricacao, modo: 'saida' | 'retorno') {
    const hoje = new Date().toISOString().split('T')[0];
    setEncarteladorPopup({
      itemId: item.id,
      nome: item.encartelador_nome || '',
      dataSaida: item.encartelador_data_saida || hoje,
      dataRetorno: item.encartelador_data_retorno || '',
      modo,
    });
  }

  async function handleSalvarEncartelador() {
    if (!encarteladorPopup) return;
    if (encarteladorPopup.modo === 'saida' && !encarteladorPopup.nome) { alert('Selecione um encartelador'); return; }
    await salvarEncartelador(
      encarteladorPopup.itemId,
      encarteladorPopup.nome,
      encarteladorPopup.dataSaida,
      encarteladorPopup.dataRetorno
    );
    setItens(prev => prev.map(it =>
      it.id === encarteladorPopup.itemId
        ? {
            ...it,
            encartelador_nome: encarteladorPopup.nome || undefined,
            encartelador_data_saida: encarteladorPopup.dataSaida || undefined,
            encartelador_data_retorno: encarteladorPopup.dataRetorno || undefined,
          }
        : it
    ));
    setEncarteladorPopup(null);
  }

  async function handleVoltar(itemId: string, etapaAtual: string) {
    const idx = ETAPAS.findIndex(e => e.key === etapaAtual);
    if (idx === 0) return;
    setAdvancing(itemId);
    const result = await voltarEtapa(itemId);
    if (result.success) {
      setItens(prev => prev.map(it =>
        it.id === itemId ? { ...it, etapa_fabricacao: (result as { anterior?: string }).anterior || it.etapa_fabricacao } : it
      ));
    }
    setAdvancing(null);
  }

  const itensFiltrados = itens.filter(it => {
    // Filtro por código
    if (filtroCodigo.trim() && !it.produto?.sku?.toLowerCase().includes(filtroCodigo.toLowerCase())) {
      return false;
    }

    // Filtro por etapa
    if (filtroEtapa && it.etapa_fabricacao !== filtroEtapa) {
      return false;
    }

    // Filtro por status (item atualmente fora, aguardando retorno)
    if (filtroStatus === 'prestador' && (!it.prestador_nome || it.prestador_data_retorno)) {
      return false;
    }
    if (filtroStatus === 'soldador' && (!it.soldador_nome || it.soldador_data_retorno)) {
      return false;
    }
    if (filtroStatus === 'encartelamento' && (!it.encartelador_nome || it.encartelador_data_retorno)) {
      return false;
    }

    return true;
  });

  const itensPorEtapa = (etapaKey: string) => itensFiltrados.filter(it => it.etapa_fabricacao === etapaKey);

  const barraAbas = (
    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', borderBottom: '1px solid var(--borda)' }}>
      {([['etapas', 'Etapas'], ['acessorios', 'Montagem de Acessórios']] as const).map(([key, rotulo]) => (
        <button key={key} onClick={() => setAba(key)}
          style={{ padding: '7px 14px', fontSize: '12px', fontWeight: aba === key ? '700' : '500', cursor: 'pointer', border: 'none', borderBottom: `2px solid ${aba === key ? 'var(--ouro)' : 'transparent'}`, backgroundColor: 'transparent', color: aba === key ? 'var(--texto)' : 'var(--texto-suave)', marginBottom: '-1px' }}>
          {rotulo}
        </button>
      ))}
    </div>
  );

  if (aba === 'acessorios') {
    return (
      <div style={{ padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--marca)', color: 'var(--ouro-claro)' }}><Factory size={15} strokeWidth={1.75} aria-hidden="true" /></span>
          <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Etapas da Produção</h1>
        </div>
        {barraAbas}
        <MontagemAcessorios />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Carregando fabricação...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Modal foto */}
      {fotoPopup && (
        <div onClick={() => setFotoPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', maxWidth: '340px', width: '90%', boxShadow: 'var(--sombra-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--texto)' }}>{fotoPopup.sku}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{fotoPopup.nome}</div>
              </div>
              <button onClick={() => setFotoPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fotoPopup.url} alt={fotoPopup.sku}
              style={{ width: '100%', borderRadius: '8px', objectFit: 'contain', maxHeight: '280px', backgroundColor: '#f8fafc' }} />
          </div>
        </div>
      )}

      {/* Modal Soldador */}
      {soldadorPopup && (
        <div onClick={() => setSoldadorPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '90%', boxShadow: 'var(--sombra-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>
                {soldadorPopup.modo === 'saida' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconSoldador size={18} /> Saída para Solda</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowDownToLine size={18} strokeWidth={1.75} aria-hidden="true" /> Retorno da Solda</span>}
              </h3>
              <button onClick={() => setSoldadorPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {soldadorPopup.modo === 'saida' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome do Soldador *</label>
                  <select
                    value={soldadorPopup.nome}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, nome: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Selecione um soldador</option>
                    {soldadorPopup.nome && !soldadoresCadastro.some(x => x.nome === soldadorPopup.nome) && (
                      <option value={soldadorPopup.nome}>{soldadorPopup.nome}</option>
                    )}
                    {soldadoresCadastro.map(x => (
                      <option key={x.id} value={x.nome}>{x.nome}</option>
                    ))}
                  </select>
                  {soldadoresCadastro.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }}>
                      Nenhum soldador cadastrado. Cadastre em Cadastros &gt; Soldadores.
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataSaida}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {soldadorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Soldador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--texto)', margin: 0 }}>{soldadorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(soldadorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataRetorno}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSoldadorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSalvarSoldador}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#d97706', color: 'white' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Encartelador */}
      {encarteladorPopup && (
        <div onClick={() => setEncarteladorPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '90%', boxShadow: 'var(--sombra-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>
                {encarteladorPopup.modo === 'saida' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconEncartelador size={18} /> Enviar para Encartelar</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowDownToLine size={18} strokeWidth={1.75} aria-hidden="true" /> Retorno do Encartelamento</span>}
              </h3>
              <button onClick={() => setEncarteladorPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {encarteladorPopup.modo === 'saida' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome do Encartelador *</label>
                  <select
                    value={encarteladorPopup.nome}
                    onChange={e => setEncarteladorPopup({ ...encarteladorPopup, nome: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Selecione um encartelador</option>
                    {encarteladorPopup.nome && !encarteladoresCadastro.some(x => x.nome === encarteladorPopup.nome) && (
                      <option value={encarteladorPopup.nome}>{encarteladorPopup.nome}</option>
                    )}
                    {encarteladoresCadastro.map(x => (
                      <option key={x.id} value={x.nome}>{x.nome}</option>
                    ))}
                  </select>
                  {encarteladoresCadastro.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }}>
                      Nenhum encartelador cadastrado. Cadastre em Cadastros &gt; Encarteladores.
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={encarteladorPopup.dataSaida}
                    onChange={e => setEncarteladorPopup({ ...encarteladorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {encarteladorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Encartelador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--texto)', margin: 0 }}>{encarteladorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(encarteladorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={encarteladorPopup.dataRetorno}
                    onChange={e => setEncarteladorPopup({ ...encarteladorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEncarteladorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSalvarEncartelador}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#d97706', color: 'white' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prestador */}
      {prestadorPopup && (
        <div onClick={() => setPrestadorPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '90%', boxShadow: 'var(--sombra-modal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>
                {prestadorPopup.modo === 'saida' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IconMontador size={18} /> Saída para Rua</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowDownToLine size={18} strokeWidth={1.75} aria-hidden="true" /> Retorno da Rua</span>}
              </h3>
              <button onClick={() => setPrestadorPopup(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {prestadorPopup.modo === 'saida' && (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome do Prestador *</label>
                  <select
                    value={prestadorPopup.nome}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, nome: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="">Selecione um prestador</option>
                    {prestadorPopup.nome && !prestadoresCadastro.some(x => x.nome === prestadorPopup.nome) && (
                      <option value={prestadorPopup.nome}>{prestadorPopup.nome}</option>
                    )}
                    {prestadoresCadastro.map(x => (
                      <option key={x.id} value={x.nome}>{x.nome}</option>
                    ))}
                  </select>
                  {prestadoresCadastro.length === 0 && (
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0' }}>
                      Nenhum prestador cadastrado. Cadastre em Cadastros &gt; Prestadores.
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={prestadorPopup.dataSaida}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {prestadorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Prestador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--texto)', margin: 0 }}>{prestadorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(prestadorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={prestadorPopup.dataRetorno}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPrestadorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid var(--borda)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSalvarPrestador}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'var(--acao)', color: 'white' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--marca)', color: 'var(--ouro-claro)' }}><Factory size={15} strokeWidth={1.75} aria-hidden="true" /></span>
        <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Etapas da Produção</h1>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>({itensFiltrados.length} item(s))</span>
      </div>

      {barraAbas}

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px', marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--borda)' }}>
        <div style={{ width: '120px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Código</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Código..."
              value={filtroCodigo}
              onChange={e => setFiltroCodigo(e.target.value)}
              style={{ width: '100%', padding: '5px 22px 5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', boxSizing: 'border-box' }}
            />
            {filtroCodigo && (
              <button onClick={() => setFiltroCodigo('')} aria-label="Limpar código"
                style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div style={{ minWidth: '150px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Etapa</label>
          <select value={filtroEtapa} onChange={e => setFiltroEtapa(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
            <option value="">Todas as etapas</option>
            {ETAPAS.map(e => (
              <option key={e.key} value={e.key}>{e.label}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: 'var(--texto-suave)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Status</label>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as '' | 'prestador' | 'soldador' | 'encartelamento')}
            style={{ width: '100%', padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
            <option value="">Todos os status</option>
            <option value="prestador">No prestador</option>
            <option value="soldador">No soldador</option>
            <option value="encartelamento">No encartelamento</option>
          </select>
        </div>

        {(filtroCodigo || filtroEtapa || filtroStatus) && (
          <button onClick={() => { setFiltroCodigo(''); setFiltroEtapa(''); setFiltroStatus(''); }}
            style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid #94a3b8', borderRadius: '5px', backgroundColor: 'white', color: 'var(--texto-suave)', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Limpar filtros
          </button>
        )}
      </div>

      {itens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
          <div style={{ marginBottom: '12px', opacity: 0.4, display: 'flex', justifyContent: 'center', color: 'var(--texto-suave)' }}><Factory size={40} strokeWidth={1.25} aria-hidden="true" /></div>
          <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--texto-suave)', margin: '0 0 4px' }}>Nenhum item em produção</p>
          <p style={{ fontSize: '12px', margin: 0 }}>Mude o status de um pedido para &quot;Em Fabricação&quot; para iniciar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' }}>
          {ETAPAS.filter(e => !filtroEtapa || e.key === filtroEtapa).map(etapa => {
            const colItens = itensPorEtapa(etapa.key);
            const grupos = agruparPorProduto(colItens);
            const etapaIdx = ETAPAS.findIndex(e => e.key === etapa.key);
            const isLast = etapaIdx === ETAPAS.length - 1;
            const isFirst = etapaIdx === 0;

            return (
              <div key={etapa.key} style={{ minWidth: '210px', flex: '1', backgroundColor: etapa.bg, borderRadius: '10px', border: `1px solid ${etapa.border}`, overflow: 'hidden' }}>
                {/* Cabeçalho coluna */}
                <div style={{ padding: '7px 10px', backgroundColor: etapa.cor, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{etapa.label}</span>
                  <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', color: 'white', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '10px' }}>{colItens.length}</span>
                </div>

                {/* Cards agrupados por produto */}
                <div style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '60px' }}>
                  {grupos.length === 0 ? (
                    <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '14px 0', margin: 0 }}>Sem itens</p>
                  ) : grupos.map(grupo => (
                    <div key={grupo.produtoId} style={{ backgroundColor: 'white', borderRadius: '6px', border: `1px solid ${etapa.border}`, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                      {/* Header do grupo (produto) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', backgroundColor: etapa.bg, borderBottom: `1px solid ${etapa.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: etapa.cor }}>{grupo.sku}</span>
                          {(() => {
                            const banho = grupo.itens[0]?.banho;
                            if (!banho) {
                              return <span style={{ fontSize: '9px', fontWeight: '600', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#f8fafc', color: '#94a3b8', border: '1px dashed var(--borda-forte)' }}>Sem banho</span>;
                            }
                            const bs = BANHO_COLORS[banho] || { bg: '#f1f5f9', color: '#475569' };
                            return <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: bs.bg, color: bs.color }}>{banho}</span>;
                          })()}
                          {grupo.itens[0]?.produto?.imagem_url && (
                            <button
                              onClick={() => setFotoPopup({ url: grupo.itens[0].produto!.imagem_url!, sku: grupo.sku, nome: grupo.itens[0].produto!.nome })}
                              title="Ver foto"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '4px', border: `1px solid ${etapa.border}`, backgroundColor: 'white', cursor: 'pointer', padding: 0, color: etapa.cor }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                              </svg>
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>{grupo.categoria}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', backgroundColor: etapa.cor, color: 'white', padding: '1px 5px', borderRadius: '8px' }}>{grupo.totalQtd}</span>
                        </div>
                      </div>

                      {/* Linhas por cliente/pedido */}
                      {grupo.itens.map((item, idx) => {
                        const busy = advancing === item.id;
                        const banhoStyle = BANHO_COLORS[item.banho || ''] || { bg: '#f1f5f9', color: '#475569' };

                        return (
                          <div key={item.id} style={{
                            display: 'flex', flexDirection: 'column',
                            borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none',
                          }}>
                            {/* Linha principal */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 4px 3px 2px' }}>
                              {/* Botão voltar */}
                              {!isFirst ? (
                                <button onClick={() => handleVoltar(item.id, item.etapa_fabricacao)} disabled={busy} title="Voltar etapa"
                                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '3px', border: '1px solid var(--borda)', backgroundColor: 'transparent', color: '#94a3b8', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.4 : 1, padding: 0 }}>
                                  <IconBack />
                                </button>
                              ) : <span style={{ width: '18px', flexShrink: 0 }} />}

                              {/* Pedido */}
                              <span style={{ flex: 1, fontSize: '10px', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.pedido?.numero_pedido || '—'}
                              </span>

                              {/* Qtd */}
                              <span style={{ flexShrink: 0, fontSize: '10px', fontWeight: '800', color: etapa.cor, minWidth: '16px', textAlign: 'center' }}>
                                {item.quantidade}
                              </span>

                              {/* Ícone Prestador (só em PRODUÇÃO) */}
                              {etapa.key === 'producao' && (
                                <button
                                  onClick={() => {
                                    if (!item.prestador_nome) {
                                      handleOpenPrestador(item, 'saida');
                                    } else if (item.prestador_nome && !item.prestador_data_retorno) {
                                      const hoje = new Date().toISOString().split('T')[0];
                                      setPrestadorPopup({
                                        itemId: item.id,
                                        nome: item.prestador_nome,
                                        dataSaida: item.prestador_data_saida || hoje,
                                        dataRetorno: hoje,
                                        modo: 'retorno',
                                      });
                                    }
                                  }}
                                  disabled={item.prestador_data_retorno ? true : false}
                                  title={
                                    !item.prestador_nome ? 'Registrar saída para rua' :
                                    !item.prestador_data_retorno ? `Na rua com ${item.prestador_nome} - clique para retorno com hoje` :
                                    `Retornou em ${new Date(item.prestador_data_retorno).toLocaleDateString('pt-BR')}`
                                  }
                                  style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    border: `1px solid ${
                                      item.prestador_data_retorno ? '#10b981' :
                                      item.prestador_nome ? '#d97706' :
                                      etapa.cor
                                    }`,
                                    backgroundColor:
                                      item.prestador_data_retorno ? '#d1fae5' :
                                      item.prestador_nome ? '#fbbf24' :
                                      'white',
                                    color:
                                      item.prestador_data_retorno ? '#059669' :
                                      item.prestador_nome ? '#78350f' :
                                      etapa.cor,
                                    cursor: item.prestador_data_retorno ? 'default' : 'pointer',
                                    padding: 0,
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    opacity: item.prestador_data_retorno ? 0.6 : 1,
                                  }}>
                                  {item.prestador_data_retorno ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <IconMontador size={16} />}
                                </button>
                              )}

                              {/* Ícone Soldador (só em PRODUÇÃO) */}
                              {etapa.key === 'producao' && (
                                <button
                                  onClick={() => {
                                    if (!item.soldador_nome) {
                                      handleOpenSoldador(item, 'saida');
                                    } else if (item.soldador_nome && !item.soldador_data_retorno) {
                                      const hoje = new Date().toISOString().split('T')[0];
                                      setSoldadorPopup({
                                        itemId: item.id,
                                        nome: item.soldador_nome,
                                        dataSaida: item.soldador_data_saida || hoje,
                                        dataRetorno: hoje,
                                        modo: 'retorno',
                                      });
                                    }
                                  }}
                                  disabled={item.soldador_data_retorno ? true : false}
                                  title={
                                    !item.soldador_nome ? 'Registrar saída para solda' :
                                    !item.soldador_data_retorno ? `Na solda com ${item.soldador_nome} - clique para retorno com hoje` :
                                    `Retornou em ${new Date(item.soldador_data_retorno).toLocaleDateString('pt-BR')}`
                                  }
                                  style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    border: `1px solid ${
                                      item.soldador_data_retorno ? '#10b981' :
                                      item.soldador_nome ? '#d97706' :
                                      etapa.cor
                                    }`,
                                    backgroundColor:
                                      item.soldador_data_retorno ? '#d1fae5' :
                                      item.soldador_nome ? '#fbbf24' :
                                      'white',
                                    color:
                                      item.soldador_data_retorno ? '#059669' :
                                      item.soldador_nome ? '#78350f' :
                                      etapa.cor,
                                    cursor: item.soldador_data_retorno ? 'default' : 'pointer',
                                    padding: 0,
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    opacity: item.soldador_data_retorno ? 0.6 : 1,
                                  }}>
                                  {item.soldador_data_retorno ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <IconSoldador size={16} />}
                                </button>
                              )}

                              {/* Ícone Encartelador (só em ENCARTELAMENTO) */}
                              {etapa.key === 'encartelamento' && (
                                <button
                                  onClick={() => {
                                    if (!item.encartelador_nome) {
                                      handleOpenEncartelador(item, 'saida');
                                    } else if (item.encartelador_nome && !item.encartelador_data_retorno) {
                                      const hoje = new Date().toISOString().split('T')[0];
                                      setEncarteladorPopup({
                                        itemId: item.id,
                                        nome: item.encartelador_nome,
                                        dataSaida: item.encartelador_data_saida || hoje,
                                        dataRetorno: hoje,
                                        modo: 'retorno',
                                      });
                                    }
                                  }}
                                  disabled={item.encartelador_data_retorno ? true : false}
                                  title={
                                    !item.encartelador_nome ? 'Enviar para encartelar' :
                                    !item.encartelador_data_retorno ? `No encartelamento com ${item.encartelador_nome} - clique para retorno com hoje` :
                                    `Retornou em ${new Date(item.encartelador_data_retorno).toLocaleDateString('pt-BR')}`
                                  }
                                  style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '4px',
                                    border: `1px solid ${
                                      item.encartelador_data_retorno ? '#10b981' :
                                      item.encartelador_nome ? '#d97706' :
                                      etapa.cor
                                    }`,
                                    backgroundColor:
                                      item.encartelador_data_retorno ? '#d1fae5' :
                                      item.encartelador_nome ? '#fbbf24' :
                                      'white',
                                    color:
                                      item.encartelador_data_retorno ? '#059669' :
                                      item.encartelador_nome ? '#78350f' :
                                      etapa.cor,
                                    cursor: item.encartelador_data_retorno ? 'default' : 'pointer',
                                    padding: 0,
                                    fontSize: '9px',
                                    fontWeight: '700',
                                    opacity: item.encartelador_data_retorno ? 0.6 : 1,
                                  }}>
                                  {item.encartelador_data_retorno ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : <IconEncartelador size={16} />}
                                </button>
                              )}

                              {/* Botão avançar */}
                              <button onClick={() => handleAvancar(item.id)} disabled={busy} title={isLast ? 'Concluir' : 'Avançar etapa'}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '18px', borderRadius: '3px', border: 'none', backgroundColor: busy ? '#94a3b8' : etapa.cor, color: 'white', cursor: busy ? 'not-allowed' : 'pointer', padding: 0 }}>
                                {busy ? '·' : isLast ? <IconCheck /> : <IconNext />}
                              </button>
                            </div>{/* fim linha principal */}

                          {/* Linha de Observação */}
                          {editingObsId === item.id ? (
                            <div style={{ display: 'flex', gap: '3px', padding: '2px 4px 3px', borderTop: '1px solid #f1f5f9' }}>
                              <input
                                autoFocus
                                value={obsText}
                                onChange={e => setObsText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleSalvarObs(item.id); if (e.key === 'Escape') setEditingObsId(null); }}
                                placeholder="Escreva a observação..."
                                style={{ flex: 1, fontSize: '10px', padding: '2px 5px', border: `1px solid ${etapa.cor}`, borderRadius: '3px', outline: 'none', color: '#374151' }}
                              />
                              <button onClick={() => handleSalvarObs(item.id)}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '3px', border: 'none', backgroundColor: etapa.cor, color: 'white', cursor: 'pointer', padding: 0 }}>
                                <IconCheck />
                              </button>
                              <button onClick={() => setEditingObsId(null)}
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '3px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => handleStartObs(item)}
                              title="Clique para adicionar observação"
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 4px 3px', borderTop: '1px solid #f1f5f9', cursor: 'text' }}>
                              <svg style={{ flexShrink: 0, color: item.observacao ? etapa.cor : '#d1d5db' }} width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              <span style={{ fontSize: '9px', color: item.observacao ? '#374151' : '#d1d5db' }}>
                                {item.observacao || 'obs...'}
                              </span>
                            </div>
                          )}

                            {/* Linha de Prestador (só em PRODUÇÃO e se preenchido) */}
                            {etapa.key === 'producao' && item.prestador_nome && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 4px 3px', borderTop: '1px solid #f1f5f9' }}>
                                {item.prestador_data_retorno ? (
                                  <>
                                    <span style={{ fontSize: '9px', color: 'var(--sucesso)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Check size={11} strokeWidth={2.5} aria-hidden="true" /> Retornou</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      ({new Date(item.prestador_data_retorno).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconMontador size={11} /> Na rua</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      {item.prestador_nome} ({new Date(item.prestador_data_saida!).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Linha de Soldador (só em PRODUÇÃO e se preenchido) */}
                            {etapa.key === 'producao' && item.soldador_nome && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 4px 3px', borderTop: '1px solid #f1f5f9' }}>
                                {item.soldador_data_retorno ? (
                                  <>
                                    <span style={{ fontSize: '9px', color: 'var(--sucesso)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Check size={11} strokeWidth={2.5} aria-hidden="true" /> Retornou</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      ({new Date(item.soldador_data_retorno).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconSoldador size={11} /> Na solda</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      {item.soldador_nome} ({new Date(item.soldador_data_saida!).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Linha de Encartelador (só em ENCARTELAMENTO e se preenchido) */}
                            {etapa.key === 'encartelamento' && item.encartelador_nome && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 4px 3px', borderTop: '1px solid #f1f5f9' }}>
                                {item.encartelador_data_retorno ? (
                                  <>
                                    <span style={{ fontSize: '9px', color: 'var(--sucesso)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Check size={11} strokeWidth={2.5} aria-hidden="true" /> Retornou</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      ({new Date(item.encartelador_data_retorno).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}><IconEncartelador size={11} /> Encartelando</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      {item.encartelador_nome} ({new Date(item.encartelador_data_saida!).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
