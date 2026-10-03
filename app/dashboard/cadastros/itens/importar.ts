export interface LinhaImportacao {
  linha: number;
  nome: string;
  unidade: 'metro' | 'peca' | 'servico' | '';
  valor: number | null;
  fornecedor: string;
  erros: string[];
}

export const MAX_LINHAS = 1000;

const normalizar = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .trim();

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

function parseCsv(texto: string): string[][] {
  const primeira = texto.split(/\r?\n/, 1)[0] || '';
  const delimitador = [';', '\t', ','].sort((a, b) => primeira.split(b).length - primeira.split(a).length)[0];
  const linhas: string[][] = [];
  let campo = '';
  let linha: string[] = [];
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === delimitador) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      linhas.push(linha); linha = [];
    } else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

export async function lerPlanilha(arquivo: File): Promise<string[][]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith('.csv') || nome.endsWith('.txt')) {
    const buffer = await arquivo.arrayBuffer();
    let texto: string;
    try {
      texto = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      texto = new TextDecoder('windows-1252').decode(buffer);
    }
    return parseCsv(texto.replace(/^﻿/, ''));
  }
  if (nome.endsWith('.xlsx')) {
    const { readSheet } = await import('read-excel-file/browser');
    const dados = await readSheet(arquivo);
    return dados.map(linha => linha.map(c => (c === null || c === undefined ? '' : c instanceof Date ? c.toISOString() : String(c))));
  }
  throw new Error('Formato não suportado. Envie um arquivo .xlsx ou .csv (se for .xls, abra no Excel e salve como .xlsx).');
}

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
    const valor = lerValor(valorBruto);
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
