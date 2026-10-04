'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { listarItens, criarItem, atualizarItem, deletarItem, importarItens } from './actions';
import { lerPlanilha, interpretarPlanilha, baixarModelo, type LinhaImportacao } from './importar';
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
  const [filtroNome, setFiltroNome] = useState('');
  const [nomeAberto, setNomeAberto] = useState(false);
  const [nomeBusca, setNomeBusca] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');

  const [showImportar, setShowImportar] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [linhasImport, setLinhasImport] = useState<LinhaImportacao[]>([]);
  const [erroImport, setErroImport] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<{ criados: number; ignorados: number; fornecedoresCriados: number } | null>(null);

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

  const abrirImportar = () => {
    setNomeArquivo('');
    setLinhasImport([]);
    setErroImport('');
    setResultadoImport(null);
    setShowImportar(true);
  };

  const handleArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    e.target.value = '';
    if (!arquivo) return;
    setNomeArquivo(arquivo.name);
    setLinhasImport([]);
    setErroImport('');
    try {
      const dados = await lerPlanilha(arquivo);
      const { linhas, erro } = interpretarPlanilha(dados);
      if (erro) setErroImport(erro);
      else setLinhasImport(linhas);
    } catch (err) {
      setErroImport(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
    }
  };

  const nomesExistentes = new Set(itens.map(i => (i.nome || '').trim().toLowerCase()));
  const fornecedoresExistentes = new Set(fornecedores.map(f => f.nome.trim().toLowerCase()));

  const analise = (() => {
    const vistos = new Set<string>();
    return linhasImport.map(l => {
      const chave = l.nome.trim().toLowerCase();
      let situacao: 'ok' | 'erro' | 'duplicado' = 'ok';
      let motivo = '';
      if (l.erros.length > 0) { situacao = 'erro'; motivo = l.erros.join('; '); }
      else if (nomesExistentes.has(chave)) { situacao = 'duplicado'; motivo = 'Já cadastrado (será ignorado)'; }
      else if (vistos.has(chave)) { situacao = 'duplicado'; motivo = 'Repetido na planilha (será ignorado)'; }
      if (situacao === 'ok') vistos.add(chave);
      const fornecedorNovo = situacao === 'ok' && !!l.fornecedor && !fornecedoresExistentes.has(l.fornecedor.toLowerCase());
      return { ...l, situacao, motivo, fornecedorNovo };
    });
  })();

  const validas = analise.filter(l => l.situacao === 'ok');
  const comErro = analise.filter(l => l.situacao === 'erro').length;
  const duplicadas = analise.filter(l => l.situacao === 'duplicado').length;
  const fornecedoresNovos = Array.from(new Map(validas.filter(l => l.fornecedorNovo).map(l => [l.fornecedor.toLowerCase(), l.fornecedor])).values());

  const handleImportar = async () => {
    if (validas.length === 0) return;
    setImportando(true);
    const result = await importarItens(validas.map(l => ({ nome: l.nome, unidade: l.unidade, valor: l.valor as number, fornecedor: l.fornecedor })));
    if (result.success) {
      setResultadoImport({ criados: result.criados ?? 0, ignorados: result.ignorados ?? 0, fornecedoresCriados: result.fornecedoresCriados ?? 0 });
      setLinhasImport([]);
      await carregar();
    } else {
      setErroImport(result.error || 'Erro ao importar itens');
    }
    setImportando(false);
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

  const nomesLista = Array.from(new Set(itens.map(i => i.nome).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
    .filter(n => n.toLowerCase().includes(nomeBusca.trim().toLowerCase()));

  const itensFiltrados = itens.filter(i =>
    (!filtroNome || i.nome === filtroNome) &&
    (!filtroFornecedor || nomeFornecedor(i) === filtroFornecedor) &&
    (!filtroUnidade || i.unidade === filtroUnidade)
  );

  const th = { padding: '12px 16px', textAlign: 'left' as const, fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' };
  const campo = { width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' as const, backgroundColor: 'white' };
  const rotulo = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Itens</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={abrirImportar}
            style={{ padding: '10px 16px', backgroundColor: 'white', color: 'var(--acao)', border: '1px solid var(--acao)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            Importar planilha
          </button>
          <button
            onClick={abrirNovo}
            style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
            + Novo Item
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={rotulo}>Nome</label>
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => { setNomeAberto(!nomeAberto); setNomeBusca(''); }}
              style={{ ...campo, color: filtroNome ? 'var(--texto)' : 'var(--texto-suave)', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filtroNome || 'Todos os nomes'}</span>
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} />
            </button>
            {nomeAberto && (
              <>
                <div onClick={() => setNomeAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '2px', backgroundColor: 'white', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', boxShadow: 'var(--sombra-media)' }}>
                  <div style={{ padding: '6px', borderBottom: '1px solid var(--borda)' }}>
                    <input type="text" autoFocus value={nomeBusca} onChange={e => setNomeBusca(e.target.value)} placeholder="Buscar nome..."
                      style={{ ...campo, padding: '8px', fontSize: '13px' }} />
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {!nomeBusca.trim() && (
                      <div onClick={() => { setFiltroNome(''); setNomeAberto(false); }}
                        style={{ padding: '7px 10px', fontSize: '13px', cursor: 'pointer', color: 'var(--texto-suave)' }}>Todos os nomes</div>
                    )}
                    {nomesLista.map(n => (
                      <div key={n} onClick={() => { setFiltroNome(n); setNomeAberto(false); }}
                        style={{ padding: '7px 10px', fontSize: '13px', cursor: 'pointer', color: 'var(--texto)', backgroundColor: n === filtroNome ? 'var(--ouro-suave)' : 'white' }}>{n}</div>
                    ))}
                    {nomesLista.length === 0 && <div style={{ padding: '7px 10px', fontSize: '12px', color: 'var(--texto-suave)' }}>Nenhum nome encontrado</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={rotulo}>Fornecedor</label>
          <select value={filtroFornecedor} onChange={e => setFiltroFornecedor(e.target.value)} style={campo}>
            <option value="">Todos os fornecedores</option>
            {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 160px', maxWidth: '220px' }}>
          <label style={rotulo}>Unidade</label>
          <select value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)} style={campo}>
            <option value="">Todas as unidades</option>
            {Object.entries(UNIDADES).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
        </div>
        {(filtroNome || filtroFornecedor || filtroUnidade) && (
          <button type="button" onClick={() => { setFiltroNome(''); setFiltroFornecedor(''); setFiltroUnidade(''); }}
            style={{ padding: '10px 16px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Limpar filtros
          </button>
        )}
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--borda)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--borda)' }}>
              <th style={th}>Nome</th>
              <th style={th}>Unidade</th>
              <th style={th}>Valor Unitário</th>
              <th style={th}>Fornecedor</th>
              <th style={{ ...th, textAlign: 'center', width: '110px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  {itens.length === 0 ? 'Nenhum item cadastrado' : 'Nenhum item encontrado com os filtros aplicados'}
                </td>
              </tr>
            ) : (
              itensFiltrados.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto)' }}>{item.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{UNIDADES[item.unidade] || item.unidade}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{moeda(item.valor_unitario)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{nomeFornecedor(item)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirEdicao(item)}
                        title="Editar"
                        aria-label="Editar"
                        style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                      </button>
                      <button
                        onClick={() => handleDeletar(item)}
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '450px', width: '90%', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 20px' }}>
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
                style={{ padding: '10px 20px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={enviando}
                style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: 'var(--raio-sm)', cursor: enviando ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: enviando ? 0.6 : 1 }}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportar && (
        <div onClick={() => !importando && setShowImportar(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '760px', width: '94%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 6px' }}>Importar itens por planilha</h2>
            <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Envie um arquivo <b>.xlsx</b> ou <b>.csv</b> com os títulos na primeira linha: <b>Nome</b>, <b>Unidade</b> (Metro, Peça ou Serviço), <b>Valor Unitário</b> e <b>Fornecedor</b> (opcional).
            </p>

            {resultadoImport ? (
              <div style={{ padding: '14px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                <b>Importação concluída.</b><br />
                {resultadoImport.criados} item(ns) criado(s)
                {resultadoImport.ignorados > 0 && <> · {resultadoImport.ignorados} ignorado(s) por já existirem</>}
                {resultadoImport.fornecedoresCriados > 0 && <> · {resultadoImport.fornecedoresCriados} fornecedor(es) novo(s) cadastrado(s)</>}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <button type="button" onClick={() => baixarModelo()}
                    style={{ padding: '9px 14px', backgroundColor: '#f1f5f9', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Baixar modelo (.xlsx)
                  </button>
                  <label style={{ padding: '9px 14px', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', border: '1px solid var(--acao)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Escolher arquivo
                    <input type="file" accept=".xlsx,.csv,.txt" onChange={handleArquivo} style={{ display: 'none' }} />
                  </label>
                  {nomeArquivo && <span style={{ fontSize: '12px', color: 'var(--texto-suave)' }}>{nomeArquivo}</span>}
                </div>

                {erroImport && (
                  <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', color: '#b91c1c', fontSize: '13px', marginBottom: '14px' }}>
                    {erroImport}
                  </div>
                )}

                {analise.length > 0 && (
                  <>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#047857', fontWeight: '600' }}>{validas.length} pronto(s) para importar</span>
                      {duplicadas > 0 && <span style={{ color: '#b45309', fontWeight: '600' }}>{duplicadas} ignorado(s)</span>}
                      {comErro > 0 && <span style={{ color: '#b91c1c', fontWeight: '600' }}>{comErro} com erro</span>}
                    </div>
                    {fornecedoresNovos.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 10px' }}>
                        Fornecedores novos que serão cadastrados: <b>{fornecedoresNovos.join(', ')}</b>
                      </p>
                    )}
                    <div style={{ border: '1px solid var(--borda)', borderRadius: '8px', maxHeight: '300px', overflow: 'auto', marginBottom: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '560px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Linha</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Nome</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Unidade</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Valor</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Fornecedor</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analise.map(l => (
                            <tr key={l.linha} style={{ borderTop: '1px solid #f1f5f9', backgroundColor: l.situacao === 'erro' ? '#fef2f2' : l.situacao === 'duplicado' ? '#fffbeb' : 'transparent' }}>
                              <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{l.linha}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--texto)' }}>{l.nome || '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.unidade ? UNIDADES[l.unidade] : '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.valor !== null ? moeda(l.valor) : '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.fornecedor || '—'}{l.fornecedorNovo ? ' (novo)' : ''}</td>
                              <td style={{ padding: '6px 10px', color: l.situacao === 'ok' ? '#047857' : l.situacao === 'erro' ? '#b91c1c' : '#b45309' }}>
                                {l.situacao === 'ok' ? 'OK' : l.motivo}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowImportar(false)} disabled={importando}
                style={{ padding: '10px 20px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                {resultadoImport ? 'Fechar' : 'Cancelar'}
              </button>
              {!resultadoImport && (
                <button onClick={handleImportar} disabled={importando || validas.length === 0}
                  style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: 'var(--raio-sm)', cursor: importando || validas.length === 0 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: importando || validas.length === 0 ? 0.5 : 1 }}>
                  {importando ? 'Importando...' : `Importar ${validas.length} item(ns)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
