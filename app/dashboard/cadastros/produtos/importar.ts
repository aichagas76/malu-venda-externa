import { unzipSync } from 'fflate';
import { createClient } from '@/lib/supabase/client';
import { MAX_LINHAS, normalizar, lerPlanilha, lerNumero } from '@/lib/planilha';

export { lerPlanilha };

export interface LinhaProduto {
  linha: number;
  foto: string;
  fotoTipo: 'link' | 'arquivo' | '';
  arquivo: string;
  categoria: string;
  codigo: string;
  nome: string;
  fabricante: string;
  peso: number | null;
  erros: string[];
}

const COLUNAS: Record<'foto' | 'categoria' | 'codigo' | 'nome' | 'fabricante' | 'peso', string[]> = {
  foto: ['foto', 'imagem', 'link da foto', 'link foto', 'url', 'url da foto', 'link'],
  categoria: ['categoria', 'tipo'],
  codigo: ['codigo', 'codigo sku', 'codigo (sku)', 'sku', 'cod', 'ref', 'referencia'],
  nome: ['nome', 'descricao', 'produto'],
  fabricante: ['fabricante', 'marca', 'fornecedor'],
  peso: ['peso', 'peso g', 'peso (g)', 'peso em gramas', 'gramas'],
};

const EXTENSAO_IMAGEM = /\.(jpe?g|png|webp|gif|bmp)$/i;

export function nomeBase(caminho: string): string {
  const ultimo = caminho.split(/[\\/]/).pop() || '';
  let nome = ultimo;
  try { nome = decodeURIComponent(ultimo); } catch { /* mantém o nome original */ }
  return nome.trim().toLowerCase();
}

export function interpretarPlanilhaProdutos(dados: string[][]): { linhas: LinhaProduto[]; erro?: string } {
  const preenchidas = dados
    .map((cels, i) => ({ cels, numero: i + 1 }))
    .filter(l => l.cels.some(c => String(c).trim() !== ''));

  if (preenchidas.length === 0) return { linhas: [], erro: 'A planilha está vazia.' };

  const cabecalho = preenchidas[0].cels.map(normalizar);
  const indice = (chave: keyof typeof COLUNAS) => cabecalho.findIndex(h => COLUNAS[chave].includes(h));
  const idx = {
    foto: indice('foto'),
    categoria: indice('categoria'),
    codigo: indice('codigo'),
    nome: indice('nome'),
    fabricante: indice('fabricante'),
    peso: indice('peso'),
  };

  if (idx.codigo === -1) {
    return {
      linhas: [],
      erro: 'A primeira linha deve ter os títulos das colunas: Foto, Categoria, Código, Nome, Fabricante e Peso. Não encontrei a coluna Código.',
    };
  }

  const corpo = preenchidas.slice(1);
  if (corpo.length === 0) return { linhas: [], erro: 'A planilha só tem o cabeçalho, sem nenhum produto.' };
  if (corpo.length > MAX_LINHAS) return { linhas: [], erro: `Máximo de ${MAX_LINHAS} produtos por importação (a planilha tem ${corpo.length}).` };

  const linhas: LinhaProduto[] = corpo.map(({ cels, numero }) => {
    const pega = (i: number) => (i >= 0 ? String(cels[i] ?? '').trim() : '');
    const erros: string[] = [];

    const codigo = pega(idx.codigo);
    if (!codigo) erros.push('Código vazio');
    else if (codigo.length > 100) erros.push('Código com mais de 100 caracteres');

    const nome = pega(idx.nome);
    if (nome.length > 255) erros.push('Nome com mais de 255 caracteres');

    const fabricante = pega(idx.fabricante);
    if (fabricante.length > 200) erros.push('Fabricante com mais de 200 caracteres');

    const categoria = pega(idx.categoria);
    if (categoria.length > 100) erros.push('Categoria com mais de 100 caracteres');

    const pesoBruto = pega(idx.peso);
    let peso: number | null = null;
    if (pesoBruto) {
      peso = lerNumero(pesoBruto);
      if (peso === null) erros.push(`Peso "${pesoBruto}" inválido`);
      else if (peso < 0) erros.push('Peso não pode ser negativo');
    }

    const foto = pega(idx.foto);
    let fotoTipo: LinhaProduto['fotoTipo'] = '';
    let arquivo = '';
    if (foto) {
      if (/^https?:\/\//i.test(foto)) {
        if (!/^https?:\/\/\S+$/i.test(foto) || foto.length > 2000) erros.push('Link da foto inválido');
        else fotoTipo = 'link';
      } else if (EXTENSAO_IMAGEM.test(foto)) {
        fotoTipo = 'arquivo';
        arquivo = nomeBase(foto);
      } else {
        erros.push('Foto: use um link (http...) ou o nome do arquivo, como Produto_Images/foto.jpg');
      }
    }

    return { linha: numero, foto, fotoTipo, arquivo, categoria, codigo, nome, fabricante, peso, erros };
  });

  return { linhas };
}

export interface FotosIndexadas {
  nomes: Set<string>;
  total: number;
  obter: (nome: string) => Promise<Blob | null>;
}

const ignorar = (caminho: string) => /(^|[\\/])(__macosx|\.)/i.test(caminho) || !EXTENSAO_IMAGEM.test(caminho);

export async function indexarFotos(arquivos: File[]): Promise<FotosIndexadas> {
  const soltas = new Map<string, File>();
  const zips: { dados: Uint8Array; nomes: Set<string> }[] = [];
  const nomes = new Set<string>();

  for (const arquivo of arquivos) {
    if (arquivo.name.toLowerCase().endsWith('.zip')) {
      const dados = new Uint8Array(await arquivo.arrayBuffer());
      const doZip = new Set<string>();
      unzipSync(dados, {
        filter: (f) => {
          if (!ignorar(f.name)) doZip.add(nomeBase(f.name));
          return false;
        },
      });
      doZip.forEach(n => nomes.add(n));
      zips.push({ dados, nomes: doZip });
    } else if (arquivo.type.startsWith('image/') || EXTENSAO_IMAGEM.test(arquivo.name)) {
      const n = nomeBase(arquivo.name);
      soltas.set(n, arquivo);
      nomes.add(n);
    }
  }

  const obter = async (nome: string): Promise<Blob | null> => {
    const solta = soltas.get(nome);
    if (solta) return solta;
    for (const zip of zips) {
      if (!zip.nomes.has(nome)) continue;
      const extraidos = unzipSync(zip.dados, { filter: (f) => !ignorar(f.name) && nomeBase(f.name) === nome });
      const primeiro = Object.values(extraidos)[0];
      if (primeiro) return new Blob([primeiro as BlobPart]);
    }
    return null;
  };

  return { nomes, total: nomes.size, obter };
}

export async function reduzirImagem(origem: Blob, ladoMaximo = 800): Promise<Blob> {
  const bitmap = await createImageBitmap(origem);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * escala));
  canvas.height = Math.max(1, Math.round(bitmap.height * escala));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) throw new Error('Não foi possível converter a imagem');
  return blob;
}

export async function enviarFoto(foto: Blob): Promise<string> {
  const supabase = createClient();
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 13)}.jpg`;
  const { error } = await supabase.storage.from('produtos').upload(nome, foto, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from('produtos').getPublicUrl(nome).data.publicUrl;
}

export async function baixarModeloProdutos() {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const titulo = (value: string) => ({ value, fontWeight: 'bold' as const });
  await writeExcelFile([
    [titulo('Foto'), titulo('Categoria'), titulo('Código'), titulo('Nome'), titulo('Fabricante'), titulo('Peso')],
    ['Produto_Images/an-001.jpg', 'Anel', 'AN-001', 'Anel solitário', 'Fabricante A', 3.5],
    ['https://exemplo.com/fotos/br-001.jpg', 'Brinco', 'BR-001', 'Brinco argola', 'Fabricante B', 1.2],
    ['', 'Colar', 'CO-001', '', '', ''],
  ]).toFile('modelo-produtos.xlsx');
}

// ---- Importação dos itens de cada produto (planilha: Produto, ItemProduto, Quantidade) ----

export const MAX_LINHAS_ITENS = 20000;

export interface LinhaItemProduto {
  linha: number;
  produto: string;
  item: string;
  quantidade: number | null;
  erros: string[];
}

const COLUNAS_ITENS: Record<'produto' | 'item' | 'quantidade', string[]> = {
  produto: ['produto', 'codigo', 'codigo sku', 'codigo (sku)', 'sku', 'cod', 'ref', 'referencia'],
  item: ['itemproduto', 'item produto', 'item do produto', 'item', 'itens', 'componente'],
  quantidade: ['quantidade', 'qtd', 'qtde', 'quant'],
};

export const chaveTexto = (v: string) => normalizar(v).replace(/\s+/g, ' ');

export function interpretarPlanilhaItensProduto(dados: string[][]): { linhas: LinhaItemProduto[]; erro?: string } {
  const preenchidas = dados
    .map((cels, i) => ({ cels, numero: i + 1 }))
    .filter(l => l.cels.some(c => String(c).trim() !== ''));

  if (preenchidas.length === 0) return { linhas: [], erro: 'A planilha está vazia.' };

  const cabecalho = preenchidas[0].cels.map(normalizar);
  const indice = (chave: keyof typeof COLUNAS_ITENS) => cabecalho.findIndex(h => COLUNAS_ITENS[chave].includes(h));
  const idx = { produto: indice('produto'), item: indice('item'), quantidade: indice('quantidade') };

  const faltando = [
    idx.produto === -1 ? 'Produto' : '',
    idx.item === -1 ? 'ItemProduto' : '',
    idx.quantidade === -1 ? 'Quantidade' : '',
  ].filter(Boolean);
  if (faltando.length > 0) {
    return { linhas: [], erro: `A primeira linha deve ter os títulos Produto, ItemProduto e Quantidade. Não encontrei: ${faltando.join(', ')}.` };
  }

  const corpo = preenchidas.slice(1);
  if (corpo.length === 0) return { linhas: [], erro: 'A planilha só tem o cabeçalho, sem nenhuma linha.' };
  if (corpo.length > MAX_LINHAS_ITENS) return { linhas: [], erro: `Máximo de ${MAX_LINHAS_ITENS} linhas por importação (a planilha tem ${corpo.length}).` };

  const linhas: LinhaItemProduto[] = corpo.map(({ cels, numero }) => {
    const pega = (i: number) => String(cels[i] ?? '').trim();
    const erros: string[] = [];

    const produto = pega(idx.produto);
    if (!produto) erros.push('Produto vazio');

    const item = pega(idx.item);
    if (!item) erros.push('Item vazio');

    const bruto = pega(idx.quantidade);
    let quantidade: number | null = null;
    if (!bruto) erros.push('Quantidade vazia');
    else {
      quantidade = lerNumero(bruto);
      if (quantidade === null) erros.push(`Quantidade "${bruto}" inválida`);
      else if (quantidade < 0) erros.push('Quantidade não pode ser negativa');
    }

    return { linha: numero, produto, item, quantidade, erros };
  });

  return { linhas };
}

export async function baixarModeloItensProduto() {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const titulo = (value: string) => ({ value, fontWeight: 'bold' as const });
  await writeExcelFile([
    [titulo('Produto'), titulo('ItemProduto'), titulo('Quantidade')],
    ['AN-001', 'Montagem', 1],
    ['AN-001', 'Galvânica -Ouro', 2],
    ['BR-001', 'Montagem', 1],
  ]).toFile('modelo-itens-produto.xlsx');
}
