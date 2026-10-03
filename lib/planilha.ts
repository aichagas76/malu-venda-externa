export const MAX_LINHAS = 1000;

export const normalizar = (v: unknown) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .trim();

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

export function lerNumero(bruto: string): number | null {
  let t = bruto.replace(/R\$/gi, '').replace(/\s/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
