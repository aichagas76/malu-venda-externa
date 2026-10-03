import { MAX_LINHAS, normalizar, lerPlanilha, lerNumero } from '@/lib/planilha';

export { lerPlanilha };

export interface LinhaImportacao {
  linha: number;
  nome: string;
  unidade: 'metro' | 'peca' | 'servico' | '';
  valor: number | null;
  fornecedor: string;
  erros: string[];
}


const COLUNAS: Record<'nome' | 'unidade' | 'valor' | 'fornecedor', string[]> = {
  nome: ['nome', 'item', 'descricao'],
  unidade: ['unidade', 'un', 'und', 'unid'],
  valor: ['valor unitario', 'valor unit', 'valor', 'preco', 'preco unitario'],
  fornecedor: ['fornecedor'],
};

const UNIDADES: Record<string, 'metro' | 'peca' | 'servico'> = {
  metro: 'metro', metros: 'metro', m: 'metro', mt: 'metro', mts: 'metro',
  peca: 'peca', pecas: 'peca', pc: 'peca', pcs: 'peca', pç: 'peca', un: 'peca', und: 'peca', unid: 'peca', unidade: 'peca',
  servico: 'servico', servicos: 'servico', serv: 'servico', srv: 'servico',
};

function lerValor(bruto: string): number | null {
  let t = bruto.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function interpretarPlanilha(dados: string[][]): { linhas: LinhaImportacao[]; erro?: string } {
  const preenchidas = dados
    .map((cels, i) => ({ cels, numero: i + 1 }))
    .filter(l => l.cels.some(c => String(c).trim() !== ''));

  if (preenchidas.length === 0) return { linhas: [], erro: 'A planilha está vazia.' };

  const cabecalho = preenchidas[0].cels.map(normalizar);
  const indice = (chave: keyof typeof COLUNAS) => cabecalho.findIndex(h => COLUNAS[chave].includes(h));
  const idx = { nome: indice('nome'), unidade: indice('unidade'), valor: indice('valor'), fornecedor: indice('fornecedor') };

  const faltando = (['nome', 'unidade', 'valor'] as const).filter(k => idx[k] === -1);
  if (faltando.length > 0) {
    return {
      linhas: [],
      erro: 'A primeira linha deve ter os títulos das colunas: Nome, Unidade, Valor Unitário e Fornecedor. Não encontrei: ' +
        faltando.map(k => ({ nome: 'Nome', unidade: 'Unidade', valor: 'Valor Unitário' }[k])).join(', ') + '.',
    };
  }

  const corpo = preenchidas.slice(1);
  if (corpo.length === 0) return { linhas: [], erro: 'A planilha só tem o cabeçalho, sem nenhum item.' };
  if (corpo.length > MAX_LINHAS) return { linhas: [], erro: `Máximo de ${MAX_LINHAS} itens por importação (a planilha tem ${corpo.length}).` };

  const linhas: LinhaImportacao[] = corpo.map(({ cels, numero }) => {
    const pega = (i: number) => (i >= 0 ? String(cels[i] ?? '').trim() : '');
    const erros: string[] = [];

    const nome = pega(idx.nome);
    if (!nome) erros.push('Nome vazio');
    else if (nome.length > 150) erros.push('Nome com mais de 150 caracteres');

    const unidadeBruta = pega(idx.unidade);
    const unidade = UNIDADES[normalizar(unidadeBruta)] || '';
    if (!unidadeBruta) erros.push('Unidade vazia');
    else if (!unidade) erros.push(`Unidade "${unidadeBruta}" inválida (use Metro, Peça ou Serviço)`);

    const valorBruto = pega(idx.valor);
    const valor = lerNumero(valorBruto);
    if (!valorBruto) erros.push('Valor unitário vazio');
    else if (valor === null) erros.push(`Valor "${valorBruto}" inválido`);
    else if (valor < 0) erros.push('Valor não pode ser negativo');

    return { linha: numero, nome, unidade, valor, fornecedor: pega(idx.fornecedor), erros };
  });

  return { linhas };
}

export async function baixarModelo() {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const titulo = (value: string) => ({ value, fontWeight: 'bold' as const });
  await writeExcelFile([
    [titulo('Nome'), titulo('Unidade'), titulo('Valor Unitário'), titulo('Fornecedor')],
    ['Corrente aço 40cm', 'Metro', 2.5, 'Fornecedor Exemplo'],
    ['Pingente coração', 'Peça', 1.2, 'Fornecedor Exemplo'],
    ['Banho de ouro', 'Serviço', 0.8, ''],
  ]).toFile('modelo-itens.xlsx');
}
