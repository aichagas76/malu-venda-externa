import { normalizar, lerPlanilha, lerNumero } from '@/lib/planilha';

export { lerPlanilha };

export interface PedidoImportacao {
  numero: string;
  clienteId: string;
  status: 'aberto' | 'em_fabricacao' | 'fechado';
  itens: { sku: string; numeroItem: number | null; banho: string; quantidade: number; valor: number; quando: string | null }[];
}

export const MAX_LINHAS_PEDIDOS = 20000;
export const BANHOS_VALIDOS = ['Ouro', 'Prata', 'Diamante'];

export interface LinhaPedidoImport {
  linha: number;
  pedido: string;
  numeroItem: number | null;
  sku: string;
  banho: string;
  quantidade: number | null;
  valor: number | null;
  quando: string | null;
  erros: string[];
}

const COLUNAS: Record<'pedido' | 'item' | 'codigo' | 'banho' | 'quantidade' | 'quando' | 'valor', string[]> = {
  pedido: ['pedido', 'numero pedido', 'n pedido', 'no pedido', 'nº pedido', 'n° pedido', 'num pedido'],
  item: ['item', 'n item', 'no item', 'nº item', 'n° item', 'numero item', 'num item'],
  codigo: ['codigo', 'codigo sku', 'codigo (sku)', 'sku', 'cod', 'ref', 'referencia'],
  banho: ['banho'],
  quantidade: ['quantidade', 'qtd', 'qtde', 'quant'],
  quando: ['quando', 'data', 'data hora', 'data/hora', 'data do pedido'],
  valor: ['valor', 'valor unitario', 'valor unit', 'preco', 'preco unitario'],
};

export const chavePedido = (v: string) => v.replace(/\s+/g, ' ').trim();
export const chaveSkuTexto = (v: string) => normalizar(v).replace(/\s+/g, ' ');

// Prefixo do número do pedido: "JARD - 1" -> "JARD"
export function prefixoPedido(numero: string): string {
  const m = numero.match(/^(.*?)\s*-\s*\d+\s*$/);
  return (m ? m[1] : numero).trim().toUpperCase();
}

// Data/hora da planilha (sem fuso) vira horário de Brasília (-03:00).
function lerQuando(bruto: string): { iso: string | null; erro?: string } {
  const t = bruto.trim();
  if (!t) return { iso: null };
  const dois = (n: string) => n.padStart(2, '0');
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] || '00'}-03:00` };
  m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return { iso: null, erro: `Data "${t}" inválida` };
    return { iso: `${m[3]}-${dois(m[2])}-${dois(m[1])}T${dois(m[4] || '0')}:${m[5] || '00'}:${m[6] || '00'}-03:00` };
  }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}T00:00:00-03:00` };
  return { iso: null, erro: `Data "${t}" inválida` };
}

export function interpretarPlanilhaPedidos(dados: string[][]): { linhas: LinhaPedidoImport[]; erro?: string } {
  const preenchidas = dados
    .map((cels, i) => ({ cels, numero: i + 1 }))
    .filter(l => l.cels.some(c => String(c).trim() !== ''));

  if (preenchidas.length === 0) return { linhas: [], erro: 'A planilha está vazia.' };

  const cabecalho = preenchidas[0].cels.map(normalizar);
  const indice = (chave: keyof typeof COLUNAS) => cabecalho.findIndex(h => COLUNAS[chave].includes(h));
  const idx = {
    pedido: indice('pedido'),
    item: indice('item'),
    codigo: indice('codigo'),
    banho: indice('banho'),
    quantidade: indice('quantidade'),
    quando: indice('quando'),
    valor: indice('valor'),
  };

  const faltando = [
    idx.pedido === -1 ? 'Pedido' : '',
    idx.codigo === -1 ? 'Código' : '',
    idx.quantidade === -1 ? 'Quantidade' : '',
    idx.valor === -1 ? 'Valor' : '',
  ].filter(Boolean);
  if (faltando.length > 0) {
    return { linhas: [], erro: `A primeira linha deve ter os títulos Pedido, Item, Código, Banho, Quantidade, Quando e Valor. Não encontrei: ${faltando.join(', ')}.` };
  }

  const corpo = preenchidas.slice(1);
  if (corpo.length === 0) return { linhas: [], erro: 'A planilha só tem o cabeçalho, sem nenhuma linha.' };
  if (corpo.length > MAX_LINHAS_PEDIDOS) return { linhas: [], erro: `Máximo de ${MAX_LINHAS_PEDIDOS} linhas por importação (a planilha tem ${corpo.length}).` };

  const linhas: LinhaPedidoImport[] = corpo.map(({ cels, numero }) => {
    const pega = (i: number) => (i >= 0 ? String(cels[i] ?? '').trim() : '');
    const erros: string[] = [];

    const pedido = chavePedido(pega(idx.pedido));
    if (!pedido) erros.push('Pedido vazio');
    else if (pedido.length > 50) erros.push('Número do pedido com mais de 50 caracteres');

    const sku = pega(idx.codigo);
    if (!sku) erros.push('Código vazio');

    let numeroItem: number | null = null;
    const itemBruto = pega(idx.item);
    if (itemBruto) {
      const n = lerNumero(itemBruto);
      if (n === null || !Number.isInteger(n) || n <= 0) erros.push(`Nº Item "${itemBruto}" inválido`);
      else numeroItem = n;
    }

    let banho = '';
    const banhoBruto = pega(idx.banho);
    if (banhoBruto) {
      const achado = BANHOS_VALIDOS.find(b => normalizar(b) === normalizar(banhoBruto));
      if (!achado) erros.push(`Banho "${banhoBruto}" inválido (use Ouro, Prata ou Diamante)`);
      else banho = achado;
    }

    let quantidade: number | null = null;
    const qtdBruta = pega(idx.quantidade);
    if (!qtdBruta) erros.push('Quantidade vazia');
    else {
      quantidade = lerNumero(qtdBruta);
      if (quantidade === null || !Number.isInteger(quantidade) || quantidade <= 0) {
        erros.push(`Quantidade "${qtdBruta}" inválida (use um número inteiro maior que zero)`);
        quantidade = null;
      }
    }

    let valor: number | null = null;
    const valorBruto = pega(idx.valor);
    if (!valorBruto) erros.push('Valor vazio');
    else {
      valor = lerNumero(valorBruto);
      if (valor === null || valor < 0) { erros.push(`Valor "${valorBruto}" inválido`); valor = null; }
    }

    const q = lerQuando(pega(idx.quando));
    if (q.erro) erros.push(q.erro);

    return { linha: numero, pedido, numeroItem, sku, banho, quantidade, valor, quando: q.iso, erros };
  });

  return { linhas };
}

export async function baixarModeloPedidos() {
  const { default: writeExcelFile } = await import('write-excel-file/browser');
  const titulo = (value: string) => ({ value, fontWeight: 'bold' as const });
  await writeExcelFile([
    [titulo('Pedido'), titulo('Item'), titulo('Tipo'), titulo('Código'), titulo('Banho'), titulo('Quantidade'), titulo('Quando'), titulo('Valor'), titulo('Fabricante')],
    ['JARD - 1', 1, 'Pulseira', 'PC-15', 'Ouro', 12, '30/01/2026 10:04', 9.9, 'MALU'],
    ['JARD - 1', 2, 'Pulseira', 'PC-08', '', 12, '30/01/2026 10:04', 9.9, ''],
    ['JARD - 2', 1, 'Conjunto Duplo', 'GC-32', 'Prata', 6, '02/02/2026 09:30', 15.9, ''],
  ]).toFile('modelo-pedidos.xlsx');
}
