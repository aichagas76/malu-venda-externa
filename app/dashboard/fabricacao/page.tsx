'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarItensFabricacao, avancarEtapa, voltarEtapa, salvarObservacao, salvarPrestador, salvarSoldador } from './actions';

const ETAPAS = [
  { key: 'montagem_inicial',  label: 'Montagem Inicial',     cor: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { key: 'producao',          label: 'Produção',              cor: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'preparado_banho',   label: 'Preparado p/ Banho',   cor: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'encartelamento',    label: 'Encartelamento',        cor: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'enviado_cliente',   label: 'Envio ao Cliente',      cor: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
];

const BANHO_COLORS: Record<string, { bg: string; color: string }> = {
  Ouro:     { bg: '#fef9c3', color: '#854d0e' },
  Prata:    { bg: '#f1f5f9', color: '#475569' },
  Diamante: { bg: '#f0f9ff', color: '#0369a1' },
};

function BanhoIcon({ banho }: { banho: string }) {
  if (banho === 'Ouro') return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-label="Ouro">
      <circle cx="5" cy="5" r="4.5" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8"/>
    </svg>
  );
  if (banho === 'Prata') return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-label="Prata">
      <circle cx="5" cy="5" r="4.5" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8"/>
    </svg>
  );
  if (banho === 'Diamante') return (
    <svg width="10" height="10" viewBox="0 0 12 12" aria-label="Diamante">
      <polygon points="6,1 11,5 6,11 1,5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8"/>
    </svg>
  );
  return null;
}

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
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroStatusPrestador, setFiltroStatusPrestador] = useState<'todos' | 'na_rua' | 'retornou'>('todos');
  const [filtroPrestadorNome, setFiltroPrestadorNome] = useState('');
  const [filtroDataSaidaDe, setFiltroDataSaidaDe] = useState('');
  const [filtroDataSaidaAte, setFiltroDataSaidaAte] = useState('');
  const [filtroStatusSoldador, setFiltroStatusSoldador] = useState<'todos' | 'na_solda' | 'retornou_solda'>('todos');
  const [filtroSoldadorNome, setFiltroSoldadorNome] = useState('');
  const [fotoPopup, setFotoPopup] = useState<{ url: string; sku: string; nome: string } | null>(null);
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsText, setObsText] = useState('');
  const [prestadorPopup, setPrestadorPopup] = useState<{ itemId: string; nome: string; dataSaida: string; dataRetorno: string; modo: 'saida' | 'retorno' } | null>(null);
  const [soldadorPopup, setSoldadorPopup] = useState<{ itemId: string; nome: string; dataSaida: string; dataRetorno: string; modo: 'saida' | 'retorno' } | null>(null);

  const carregarItens = useCallback(async () => {
    const result = await listarItensFabricacao();
    if (result.success) setItens(result.data as ItemFabricacao[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregarItens(); }, [carregarItens]);

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

    // Filtro por status do prestador
    if (filtroStatusPrestador === 'na_rua' && (!it.prestador_nome || it.prestador_data_retorno)) {
      return false;
    }
    if (filtroStatusPrestador === 'retornou' && !it.prestador_data_retorno) {
      return false;
    }

    // Filtro por nome do prestador
    if (filtroPrestadorNome.trim() && !it.prestador_nome?.toLowerCase().includes(filtroPrestadorNome.toLowerCase())) {
      return false;
    }

    // Filtro por data de saída
    if (filtroDataSaidaDe && it.prestador_data_saida && it.prestador_data_saida < filtroDataSaidaDe) {
      return false;
    }
    if (filtroDataSaidaAte && it.prestador_data_saida && it.prestador_data_saida > filtroDataSaidaAte) {
      return false;
    }

    return true;
  });

  const itensPorEtapa = (etapaKey: string) => itensFiltrados.filter(it => it.etapa_fabricacao === etapaKey);

  // Lista de prestadores únicos para o dropdown
  const prestadoresUnicos = Array.from(new Set(itens.filter(it => it.prestador_nome).map(it => it.prestador_nome))).sort();

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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{fotoPopup.sku}</div>
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {soldadorPopup.modo === 'saida' ? '⚡ Saída para Solda' : '📥 Retorno da Solda'}
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
                  <input
                    type="text"
                    value={soldadorPopup.nome}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataSaida}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {soldadorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Soldador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{soldadorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(soldadorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataRetorno}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSoldadorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
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

      {/* Modal Prestador */}
      {prestadorPopup && (
        <div onClick={() => setPrestadorPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', maxWidth: '380px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {prestadorPopup.modo === 'saida' ? '📤 Saída para Rua' : '📥 Retorno da Rua'}
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
                  <input
                    type="text"
                    value={prestadorPopup.nome}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={prestadorPopup.dataSaida}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {prestadorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Prestador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{prestadorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(prestadorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={prestadorPopup.dataRetorno}
                    onChange={e => setPrestadorPopup({ ...prestadorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPrestadorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
                Cancelar
              </button>
              <button onClick={handleSalvarPrestador}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: '#0891b2', color: 'white' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Soldador */}
      {soldadorPopup && (
        <div onClick={() => setSoldadorPopup(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

            <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
              {soldadorPopup.modo === 'saida' ? '⚡ Saída para Solda' : '📥 Retorno da Solda'}
            </h3>

            {soldadorPopup.modo === 'saida' && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Nome do Soldador</label>
                  <input
                    autoFocus
                    type="text"
                    value={soldadorPopup.nome}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, nome: e.target.value })}
                    placeholder="Ex: João Silva"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Saída</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataSaida}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataSaida: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {soldadorPopup.modo === 'retorno' && (
              <>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                  <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 4px 0' }}>Soldador</p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{soldadorPopup.nome}</p>
                  <p style={{ fontSize: '10px', color: '#94a3b8', margin: '4px 0 0 0' }}>Saiu em {new Date(soldadorPopup.dataSaida).toLocaleDateString('pt-BR')}</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Data de Retorno</label>
                  <input
                    type="date"
                    value={soldadorPopup.dataRetorno}
                    onChange={e => setSoldadorPopup({ ...soldadorPopup, dataRetorno: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSoldadorPopup(null)}
                style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white', color: '#374151' }}>
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '7px', background: 'linear-gradient(135deg, #0891b2, #6366f1)', color: 'white', fontSize: '13px' }}>⚙️</span>
        <h1 style={{ fontSize: '17px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Etapas da Produção</h1>
        <span style={{ fontSize: '12px', color: '#94a3b8' }}>({itensFiltrados.length} item(s))</span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        {/* Filtro por código */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', flex: '1', minWidth: '160px' }}>
          <svg style={{ color: '#94a3b8', flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Código..."
            value={filtroCodigo}
            onChange={e => setFiltroCodigo(e.target.value)}
            style={{ flex: 1, padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white' }}
          />
          {filtroCodigo && (
            <button onClick={() => setFiltroCodigo('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filtro Status Prestador */}
        <select value={filtroStatusPrestador} onChange={e => setFiltroStatusPrestador(e.target.value as 'todos' | 'na_rua' | 'retornou')}
          style={{ padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}>
          <option value="todos">Status: Todos</option>
          <option value="na_rua">🛣️ Na rua</option>
          <option value="retornou">✓ Retornou</option>
        </select>

        {/* Filtro Prestador */}
        {prestadoresUnicos.length > 0 && (
          <select value={filtroPrestadorNome} onChange={e => setFiltroPrestadorNome(e.target.value)}
            style={{ padding: '5px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white', cursor: 'pointer' }}>
            <option value="">Prestador: Todos</option>
            {prestadoresUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}

        {/* Filtro Data De */}
        <input type="date" value={filtroDataSaidaDe} onChange={e => setFiltroDataSaidaDe(e.target.value)}
          style={{ padding: '5px 6px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white' }} title="Data saída de:" />

        {/* Filtro Data Até */}
        <input type="date" value={filtroDataSaidaAte} onChange={e => setFiltroDataSaidaAte(e.target.value)}
          style={{ padding: '5px 6px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '5px', outline: 'none', backgroundColor: 'white' }} title="Data saída até:" />

        {/* Botão Limpar Filtros */}
        {(filtroCodigo || filtroStatusPrestador !== 'todos' || filtroPrestadorNome || filtroDataSaidaDe || filtroDataSaidaAte) && (
          <button onClick={() => {
            setFiltroCodigo('');
            setFiltroStatusPrestador('todos');
            setFiltroPrestadorNome('');
            setFiltroDataSaidaDe('');
            setFiltroDataSaidaAte('');
          }} style={{ padding: '5px 10px', fontSize: '11px', border: '1px solid #94a3b8', borderRadius: '5px', backgroundColor: 'white', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Limpar
          </button>
        )}
      </div>

      {itens.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>⚙️</div>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', margin: '0 0 4px' }}>Nenhum item em produção</p>
          <p style={{ fontSize: '12px', margin: 0 }}>Mude o status de um pedido para &quot;Em Fabricação&quot; para iniciar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'flex-start' }}>
          {ETAPAS.map(etapa => {
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
                          {grupo.itens[0]?.banho && (() => {
                            const bs = BANHO_COLORS[grupo.itens[0].banho!] || { bg: '#f1f5f9', color: '#475569' };
                            return <span style={{ fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '4px', backgroundColor: bs.bg, color: bs.color }}>{grupo.itens[0].banho}</span>;
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
                                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', borderRadius: '3px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#94a3b8', cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.4 : 1, padding: 0 }}>
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

                              {/* Banho ícone */}
                              {item.banho && (
                                <span title={item.banho} style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                                  <BanhoIcon banho={item.banho} />
                                </span>
                              )}

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
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '3px',
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
                                  {item.prestador_data_retorno ? '✓' : '📍'}
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
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '3px',
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
                                  {item.soldador_data_retorno ? '✓' : '⚡'}
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
                                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '3px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
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
                                    <span style={{ fontSize: '9px', color: '#059669', fontWeight: '600' }}>✓ Retornou</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      ({new Date(item.prestador_data_retorno).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: '600' }}>🛣️ Na rua</span>
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
                                    <span style={{ fontSize: '9px', color: '#059669', fontWeight: '600' }}>✓ Retornou</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      ({new Date(item.soldador_data_retorno).toLocaleDateString('pt-BR')})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ fontSize: '9px', color: '#d97706', fontWeight: '600' }}>⚡ Na solda</span>
                                    <span style={{ fontSize: '8px', color: '#94a3b8' }}>
                                      {item.soldador_nome} ({new Date(item.soldador_data_saida!).toLocaleDateString('pt-BR')})
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
