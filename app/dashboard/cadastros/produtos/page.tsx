'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen, Camera, ChevronDown } from 'lucide-react';
import { listarCategorias } from '../categorias/actions';
import { listarItens } from '../itens/actions';
import { listarProdutos, criarProduto, atualizarProduto, deletarProduto, listarItensProduto, salvarItensProduto, listarValoresProdutos, importarProdutos } from './actions';
import { lerPlanilha, interpretarPlanilhaProdutos, baixarModeloProdutos, indexarFotos, reduzirImagem, enviarFoto, type LinhaProduto, type FotosIndexadas } from './importar';

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
  const [showImportar, setShowImportar] = useState(false);
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [linhasImport, setLinhasImport] = useState<LinhaProduto[]>([]);
  const [erroImport, setErroImport] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<{ criados: number; ignorados: number; categoriasCriadas: number; fotosEnviadas: number; fotosFalharam: number; fotosFaltando: number; motivoFoto: string } | null>(null);
  const [fotosIndex, setFotosIndex] = useState<FotosIndexadas | null>(null);
  const [resumoFotos, setResumoFotos] = useState('');
  const [progressoFotos, setProgressoFotos] = useState('');
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
  const [fotoAmpliada, setFotoAmpliada] = useState<{ src: string; alt: string } | null>(null);
  const [filtroCodigo, setFiltroCodigo] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [codigoAberto, setCodigoAberto] = useState(false);
  const [codigoBusca, setCodigoBusca] = useState('');
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

  useEffect(() => {
    if (!fotoAmpliada) return;
    const fechar = (e: KeyboardEvent) => { if (e.key === 'Escape') setFotoAmpliada(null); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [fotoAmpliada]);

  const adicionarItem = () => {
    const qtd = parseFloat(novaQtd);
    if (!novoItemId) return alert('Selecione um item');
    if (!(qtd > 0)) return alert('Informe uma quantidade maior que zero');
    setItensProduto(prev => [...prev, { item_id: novoItemId, quantidade: novaQtd }]);
    setNovoItemId('');
    setNovaQtd('');
  };

  const produtosFiltrados = produtos.filter(p =>
    (!filtroCodigo.trim() || (p.sku || '').toLowerCase().includes(filtroCodigo.trim().toLowerCase())) &&
    (!filtroCategoria || p.categoria === filtroCategoria)
  );

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

  const abrirImportar = () => {
    setNomeArquivo('');
    setLinhasImport([]);
    setErroImport('');
    setResultadoImport(null);
    setFotosIndex(null);
    setResumoFotos('');
    setProgressoFotos('');
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
      const { linhas, erro } = interpretarPlanilhaProdutos(dados);
      if (erro) setErroImport(erro);
      else setLinhasImport(linhas);
    } catch (err) {
      setErroImport(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
    }
  };

  const handleFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (arquivos.length === 0) return;
    setErroImport('');
    try {
      const indice = await indexarFotos(arquivos);
      setFotosIndex(indice);
      setResumoFotos(`${indice.total} foto(s) encontrada(s) em ${arquivos.length} arquivo(s)`);
    } catch {
      setFotosIndex(null);
      setResumoFotos('');
      setErroImport('Não foi possível ler as fotos. Envie um arquivo .zip ou imagens (.jpg, .png).');
    }
  };

  const codigosExistentes = new Set(produtos.map(pr => (pr.sku || '').trim().toLowerCase()));
  const categoriasExistentes = new Set(categorias.map(c => c.nome.trim().toLowerCase()));

  const analise = (() => {
    const vistos = new Set<string>();
    return linhasImport.map(l => {
      const chave = l.codigo.trim().toLowerCase();
      let situacao: 'ok' | 'erro' | 'duplicado' = 'ok';
      let motivo = '';
      if (l.erros.length > 0) { situacao = 'erro'; motivo = l.erros.join('; '); }
      else if (codigosExistentes.has(chave)) { situacao = 'duplicado'; motivo = 'Código já cadastrado (será ignorado)'; }
      else if (vistos.has(chave)) { situacao = 'duplicado'; motivo = 'Código repetido na planilha (será ignorado)'; }
      if (situacao === 'ok') vistos.add(chave);
      const categoriaNova = situacao === 'ok' && !!l.categoria && !categoriasExistentes.has(l.categoria.toLowerCase());
      const fotoFaltando = situacao === 'ok' && l.fotoTipo === 'arquivo' && !fotosIndex?.nomes.has(l.arquivo);
      return { ...l, situacao, motivo, categoriaNova, fotoFaltando };
    });
  })();

  const validas = analise.filter(l => l.situacao === 'ok');
  const comErro = analise.filter(l => l.situacao === 'erro').length;
  const duplicadas = analise.filter(l => l.situacao === 'duplicado').length;
  const categoriasNovas = Array.from(new Map(validas.filter(l => l.categoriaNova).map(l => [l.categoria.toLowerCase(), l.categoria])).values());

  const fotosParaEnviar = Array.from(new Set(validas.filter(l => l.fotoTipo === 'arquivo' && fotosIndex?.nomes.has(l.arquivo)).map(l => l.arquivo)));
  const fotosFaltando = validas.filter(l => l.fotoFaltando).length;

  const handleImportar = async () => {
    if (validas.length === 0) return;
    setImportando(true);
    setErroImport('');

    const urls = new Map<string, string>();
    let fotosFalharam = 0;
    let motivoFoto = '';

    if (fotosIndex && fotosParaEnviar.length > 0) {
      let feitas = 0;
      const fila = [...fotosParaEnviar];
      const trabalhador = async () => {
        while (fila.length > 0) {
          const nome = fila.shift() as string;
          try {
            const original = await fotosIndex.obter(nome);
            if (!original) throw new Error('arquivo não encontrado');
            const reduzida = await reduzirImagem(original);
            urls.set(nome, await enviarFoto(reduzida));
          } catch (err) {
            fotosFalharam++;
            if (!motivoFoto) motivoFoto = err instanceof Error ? err.message : '';
          }
          feitas++;
          setProgressoFotos(`Enviando fotos: ${feitas} de ${fotosParaEnviar.length}...`);
        }
      };
      setProgressoFotos(`Enviando fotos: 0 de ${fotosParaEnviar.length}...`);
      await Promise.all([trabalhador(), trabalhador(), trabalhador()]);

      if (urls.size === 0) {
        setErroImport(`Nenhuma foto pôde ser enviada${motivoFoto ? ` (${motivoFoto})` : ''}. Nada foi importado.`);
        setProgressoFotos('');
        setImportando(false);
        return;
      }
    }

    setProgressoFotos('Gravando produtos...');
    const result = await importarProdutos(validas.map(l => ({
      codigo: l.codigo,
      nome: l.nome,
      categoria: l.categoria,
      fabricante: l.fabricante,
      peso: l.peso,
      foto: l.fotoTipo === 'link' ? l.foto : l.fotoTipo === 'arquivo' ? (urls.get(l.arquivo) || '') : '',
    })));
    setProgressoFotos('');
    if (result.success) {
      setResultadoImport({
        criados: result.criados ?? 0,
        ignorados: result.ignorados ?? 0,
        categoriasCriadas: result.categoriasCriadas ?? 0,
        fotosEnviadas: urls.size,
        fotosFalharam,
        fotosFaltando,
        motivoFoto,
      });
      setLinhasImport([]);
      await carregarProdutos();
    } else {
      setErroImport(result.error || 'Erro ao importar produtos');
    }
    setImportando(false);
  };

  const handleSalvar = async () => {
    setEnviando(true);

    let foto = formData.foto;
    if (foto.startsWith('data:')) {
      try {
        const blob = await (await fetch(foto)).blob();
        foto = await enviarFoto(blob);
      } catch (err) {
        alert(`Não foi possível enviar a foto: ${err instanceof Error ? err.message : 'erro desconhecido'}`);
        setEnviando(false);
        return;
      }
    }

    const result = editando
      ? await atualizarProduto(editando.id, formData.nome, formData.sku, formData.categoria, formData.peso, foto)
      : await criarProduto(formData.nome, formData.sku, formData.categoria, formData.peso, foto);

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
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--texto)', margin: 0 }}>Produtos</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={abrirImportar}
          style={{ padding: '10px 16px', backgroundColor: 'white', color: 'var(--acao)', border: '1px solid var(--acao)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
          Importar planilha
        </button>
        <button
          onClick={abrirNovoProduto}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--acao)',
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
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Código (SKU)</label>
          <div style={{ position: 'relative' }}>
            <button type="button" onClick={() => { setCodigoAberto(!codigoAberto); setCodigoBusca(''); }}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white', color: filtroCodigo ? 'var(--texto)' : 'var(--texto-suave)', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{filtroCodigo || 'Todos os códigos'}</span>
              <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
            </button>
            {codigoAberto && (
              <>
                <div onClick={() => setCodigoAberto(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '2px', backgroundColor: 'white', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', boxShadow: 'var(--sombra-media)' }}>
                  <div style={{ padding: '6px', borderBottom: '1px solid var(--borda)' }}>
                    <input type="text" autoFocus value={codigoBusca} onChange={e => setCodigoBusca(e.target.value)} placeholder="Buscar código..."
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {!codigoBusca.trim() && (
                      <div onClick={() => { setFiltroCodigo(''); setCodigoAberto(false); }}
                        style={{ padding: '7px 10px', fontSize: '13px', cursor: 'pointer', color: 'var(--texto-suave)' }}>Todos os códigos</div>
                    )}
                    {(Array.from(new Set(produtos.map(p => p.sku).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })).filter(c => c.toLowerCase().includes(codigoBusca.trim().toLowerCase()))).map(c => (
                      <div key={c} onClick={() => { setFiltroCodigo(c); setCodigoAberto(false); }}
                        style={{ padding: '7px 10px', fontSize: '13px', cursor: 'pointer', color: 'var(--texto)', backgroundColor: c === filtroCodigo ? 'var(--ouro-suave)' : 'white' }}>{c}</div>
                    ))}
                    {(Array.from(new Set(produtos.map(p => p.sku).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })).filter(c => c.toLowerCase().includes(codigoBusca.trim().toLowerCase()))).length === 0 && <div style={{ padding: '7px 10px', fontSize: '12px', color: 'var(--texto-suave)' }}>Nenhum código encontrado</div>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Categoria</label>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}>
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>
        {(filtroCodigo || filtroCategoria) && (
          <button
            type="button"
            onClick={() => { setFiltroCodigo(''); setFiltroCategoria(''); }}
            style={{ padding: '10px 16px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--borda)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--borda)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Foto</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Categoria</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Código (SKU)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Nome</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Peso</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Valor Unitário</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Data de Cadastro</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--texto-suave)' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado com os filtros aplicados'}
                </td>
              </tr>
            ) : (
              produtosFiltrados.map((produto) => (
                <tr key={produto.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>
                    {produto.imagem_url ? (
                      <img
                        src={produto.imagem_url}
                        alt={produto.nome || 'Foto do produto'}
                        title="Clique para ampliar"
                        onClick={() => setFotoAmpliada({ src: produto.imagem_url as string, alt: produto.nome || produto.sku || 'Foto do produto' })}
                        style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover', cursor: 'zoom-in' }}
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{produto.categoria || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{produto.sku || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto)' }}>{produto.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>{produto.peso ? `${produto.peso} g` : '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)', whiteSpace: 'nowrap' }}>
                    {valoresProdutos[produto.id] ? valoresProdutos[produto.id].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--texto-suave)' }}>
                    {produto.criado_em ? new Date(produto.criado_em).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => abrirItens(produto)}
                      title="Itens do produto"
                      aria-label="Itens do produto"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                    </button>
                    <button
                      onClick={() => abrirEdicao(produto)}
                      title="Editar"
                      aria-label="Editar"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    </button>
                    <button
                      onClick={() => handleDeletar(produto.id)}
                      title="Deletar"
                      aria-label="Deletar"
                      style={{ width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', cursor: 'pointer' }}>
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
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 20px' }}>
              {editando ? 'Editar Produto' : 'Novo Produto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Foto</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--texto-suave)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><FolderOpen size={13} strokeWidth={1.75} aria-hidden="true" /> Procurar arquivo</label>
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
                      style={{ width: '100%', padding: '8px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '12px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '500', color: 'var(--texto-suave)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Camera size={13} strokeWidth={1.75} aria-hidden="true" /> Tirar foto</label>
                    <button
                      type="button"
                      onClick={abrirCamera}
                      style={{ width: '100%', padding: '9px', border: '1px solid var(--acao)', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', borderRadius: 'var(--raio-sm)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', boxSizing: 'border-box' }}>
                      Abrir câmera
                    </button>
                  </div>
                </div>
                {cameraAberta && (
                  <div style={{ marginBottom: '8px', padding: '8px', border: '1px solid var(--borda)', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 'var(--raio-sm)', backgroundColor: '#000' }} />
                    {erroCamera && <p style={{ color: '#dc2626', fontSize: '12px', margin: '6px 0 0' }}>{erroCamera}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button type="button" onClick={capturarFoto}
                        style={{ flex: 1, padding: '8px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                        <Camera size={15} strokeWidth={1.75} aria-hidden="true" style={{ verticalAlign: '-3px', marginRight: '6px' }} />Capturar
                      </button>
                      <button type="button" onClick={fecharCamera}
                        style={{ padding: '8px 14px', backgroundColor: 'white', color: '#374151', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
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
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box', backgroundColor: 'white' }}>
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
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do produto"
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Peso (g)</label>
                <input
                  type="number"
                  value={formData.peso}
                  onChange={e => setFormData({ ...formData, peso: e.target.value })}
                  placeholder="Peso em gramas"
                  style={{ width: '100%', padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid var(--borda)',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: 'var(--raio-sm)',
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
                  backgroundColor: 'var(--acao)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--raio-sm)',
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

      {fotoAmpliada && (
        <div onClick={() => setFotoAmpliada(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', cursor: 'zoom-out' }}>
          <button type="button" aria-label="Fechar" title="Fechar" onClick={() => setFotoAmpliada(null)}
            style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', border: 'none', backgroundColor: 'white', color: 'var(--texto)', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}>
            ×
          </button>
          <img src={fotoAmpliada.src} alt={fotoAmpliada.alt} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', backgroundColor: 'white', cursor: 'default' }} />
        </div>
      )}

      {produtoItens && (
        <div onClick={() => setProdutoItens(null)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 4px' }}>Itens do produto</h2>
            <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 20px' }}>
              {produtoItens.sku}{produtoItens.nome ? ` · ${produtoItens.nome}` : ''}
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select value={novoItemId} onChange={e => setNovoItemId(e.target.value)} aria-label="Item"
                style={{ flex: 1, minWidth: 0, padding: '10px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '14px', backgroundColor: 'white' }}>
                <option value="">Selecione um item</option>
                {itensCatalogo.filter(i => !itensProduto.some(p => p.item_id === i.id)).map(i => (
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

            <div style={{ border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', marginBottom: '16px', overflow: 'hidden' }}>
              {itensProduto.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Nenhum item adicionado</div>
              ) : (
                itensProduto.map((ip) => {
                  const item = itensCatalogo.find(i => i.id === ip.item_id);
                  const subtotal = item ? Number(item.valor_unitario) * (parseFloat(ip.quantidade) || 0) : 0;
                  return (
                    <div key={ip.item_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--texto)', fontWeight: '500' }}>{item?.nome || 'Item removido'}</div>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>
                          {item ? `${UNIDADES_ITEM[item.unidade] || item.unidade} · ${Number(item.valor_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 4 })} · Subtotal ${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                        </div>
                      </div>
                      <input
                        type="number" min="0" step="any" value={ip.quantidade}
                        onChange={e => setItensProduto(prev => prev.map(p => p.item_id === ip.item_id ? { ...p, quantidade: e.target.value } : p))}
                        aria-label="Quantidade do item"
                        style={{ width: '80px', padding: '6px', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                      <button type="button" title="Remover item" aria-label="Remover item"
                        onClick={() => setItensProduto(prev => prev.filter(p => p.item_id !== ip.item_id))}
                        style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '14px' }}>
              <span style={{ color: 'var(--texto-suave)', fontWeight: '600' }}>Valor unitário do produto</span>
              <span style={{ color: 'var(--texto)', fontWeight: '700' }}>
                {itensProduto.reduce((total, ip) => total + (Number(itensCatalogo.find(i => i.id === ip.item_id)?.valor_unitario) || 0) * (parseFloat(ip.quantidade) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setProdutoItens(null)}
                style={{ padding: '10px 20px', border: '1px solid var(--borda)', backgroundColor: 'white', color: '#374151', borderRadius: 'var(--raio-sm)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={salvarItens} disabled={enviandoItens}
                style={{ padding: '10px 20px', backgroundColor: 'var(--acao)', color: 'white', border: 'none', borderRadius: 'var(--raio-sm)', cursor: enviandoItens ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px', opacity: enviandoItens ? 0.6 : 1 }}>
                {enviandoItens ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportar && (
        <div onClick={() => !importando && setShowImportar(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '820px', width: '94%', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--sombra-modal)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--texto)', margin: '0 0 6px' }}>Importar produtos por planilha</h2>
            <p style={{ fontSize: '13px', color: 'var(--texto-suave)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Envie um arquivo <b>.xlsx</b> ou <b>.csv</b> com os títulos na primeira linha: <b>Foto</b>, <b>Categoria</b>, <b>Código</b>, <b>Nome</b>, <b>Fabricante</b> e <b>Peso</b> (em gramas).
              Só o <b>Código</b> é obrigatório. Na coluna <b>Foto</b>, coloque o <b>link</b> da imagem (http...) ou o <b>nome do arquivo</b> (como no AppSheet: <b>Produto_Images/foto.jpg</b>) e envie as fotos abaixo, em .zip ou soltas.
            </p>

            {resultadoImport ? (
              <div style={{ padding: '14px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', color: '#065f46', fontSize: '14px', lineHeight: 1.6, marginBottom: '16px' }}>
                <b>Importação concluída.</b><br />
                {resultadoImport.criados} produto(s) criado(s)
                {resultadoImport.ignorados > 0 && <> · {resultadoImport.ignorados} ignorado(s) por já existirem</>}
                {resultadoImport.categoriasCriadas > 0 && <> · {resultadoImport.categoriasCriadas} categoria(s) nova(s) cadastrada(s)</>}
                {resultadoImport.fotosEnviadas > 0 && <><br />{resultadoImport.fotosEnviadas} foto(s) enviada(s)</>}
                {(resultadoImport.fotosFaltando > 0 || resultadoImport.fotosFalharam > 0) && (
                  <span style={{ color: '#b45309' }}>
                    <br />
                    {resultadoImport.fotosFaltando > 0 && <>{resultadoImport.fotosFaltando} produto(s) ficaram sem foto por não ter o arquivo na pasta enviada. </>}
                    {resultadoImport.fotosFalharam > 0 && <>{resultadoImport.fotosFalharam} foto(s) não puderam ser enviadas{resultadoImport.motivoFoto ? ` (${resultadoImport.motivoFoto})` : ''}.</>}
                  </span>
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <button type="button" onClick={() => baixarModeloProdutos()}
                    style={{ padding: '9px 14px', backgroundColor: '#f1f5f9', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Baixar modelo (.xlsx)
                  </button>
                  <label style={{ padding: '9px 14px', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', border: '1px solid var(--acao)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Escolher arquivo
                    <input type="file" accept=".xlsx,.csv,.txt" onChange={handleArquivo} style={{ display: 'none' }} />
                  </label>
                  {nomeArquivo && <span style={{ fontSize: '12px', color: 'var(--texto-suave)' }}>{nomeArquivo}</span>}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <label style={{ padding: '9px 14px', backgroundColor: 'var(--acao-suave)', color: 'var(--acao)', border: '1px solid var(--borda-forte)', borderRadius: 'var(--raio-sm)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                    Escolher fotos (.zip ou imagens)
                    <input type="file" multiple accept=".zip,image/*" onChange={handleFotos} style={{ display: 'none' }} />
                  </label>
                  <span style={{ fontSize: '12px', color: 'var(--texto-suave)' }}>{resumoFotos || 'Opcional. Só necessário se a coluna Foto tiver nomes de arquivo.'}</span>
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
                      {fotosFaltando > 0 && <span style={{ color: '#b45309', fontWeight: '600' }}>{fotosFaltando} sem arquivo de foto (entram sem foto)</span>}
                    </div>
                    {categoriasNovas.length > 0 && (
                      <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 10px' }}>
                        Categorias novas que serão cadastradas: <b>{categoriasNovas.join(', ')}</b>
                      </p>
                    )}
                    <div style={{ border: '1px solid var(--borda)', borderRadius: '8px', maxHeight: '300px', overflow: 'auto', marginBottom: '16px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '640px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Linha</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Foto</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Categoria</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Código</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Nome</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Fabricante</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Peso</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--texto-suave)' }}>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analise.map(l => (
                            <tr key={l.linha} style={{ borderTop: '1px solid #f1f5f9', backgroundColor: l.situacao === 'erro' ? '#fef2f2' : l.situacao === 'duplicado' ? '#fffbeb' : 'transparent' }}>
                              <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{l.linha}</td>
                              <td style={{ padding: '6px 10px', color: l.fotoFaltando ? '#b45309' : '#475569' }}>{l.fotoTipo === 'link' ? 'Link' : l.fotoTipo === 'arquivo' ? (l.fotoFaltando ? 'Sem arquivo' : 'Arquivo ✓') : '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.categoria || '—'}{l.categoriaNova ? ' (nova)' : ''}</td>
                              <td style={{ padding: '6px 10px', color: 'var(--texto)', fontWeight: '600' }}>{l.codigo || '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.nome || '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.fabricante || '—'}</td>
                              <td style={{ padding: '6px 10px', color: '#475569' }}>{l.peso !== null ? `${l.peso} g` : '—'}</td>
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
                  {importando ? (progressoFotos || 'Importando...') : `Importar ${validas.length} produto(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
