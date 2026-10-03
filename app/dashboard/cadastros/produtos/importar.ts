import { MAX_LINHAS, normalizar, lerPlanilha, lerNumero } from '@/lib/planilha';

export { lerPlanilha };

export interface LinhaProduto {
  linha: number;
  foto: string;
  categoria: string;
  codigo: string;
  nome: string;
  peso: number | null;
  erros: string[];
}

const COLUNAS: Record<'foto' | 'categoria' | 'codigo' | 'nome' | 'peso', string[]> = {
  foto: ['foto', 'imagem', 'link da foto', 'link foto', 'url', 'url da foto', 'link'],
  categoria: ['categoria', 'tipo'],
  codigo: ['codigo', 'codigo sku', 'codigo (sku)', 'sku', 'cod', 'ref', 'referencia'],
  nome: ['nome', 'descricao', 'produto'],
  peso: ['peso', 'peso g', 'peso (g)', 'peso em gramas', 'gramas'],
};

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
    peso: indice('peso'),
  };

  if (idx.codigo === -1) {
    return {
      linhas: [],
      erro: 'A primeira linha deve ter os títulos das colunas: Foto, Categoria, Código, Nome e Peso. Não encontrei a coluna Código.',
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
    if (foto && !/^https?:\/\/\S+$/i.test(foto)) erros.push('Foto deve ser um link que começa com http:// ou https://');
    else if (foto.length > 2000) erros.push('Link da foto muito longo');

    return { linha: numero, foto, categoria, codigo, nome, peso, erros };
  });

  return { linhas };
}

export async function baixarModeloProdutos() {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const titulo = (value: string) => ({ value, fontWeight: 'bold' as const });
  await writeExcelFile([
    [titulo('Foto'), titulo('Categoria'), titulo('Código'), titulo('Nome'), titulo('Peso')],
    ['https://exemplo.com/fotos/an-001.jpg', 'Anel', 'AN-001', 'Anel solitário', 3.5],
    ['', 'Brinco', 'BR-001', 'Brinco argola', 1.2],
    ['', 'Colar', 'CO-001', '', ''],
  ]).toFile('modelo-produtos.xlsx');
}
