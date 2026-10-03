export interface ComprasItem {
  itemId: string;
  nome: string;
  unidade: string;
  valorUnitario: number;
  quantidade: number;
  subtotal: number;
}

export interface ComprasFornecedor {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export interface ComprasGrupo {
  fornecedor: ComprasFornecedor | null;
  itens: ComprasItem[];
  total: number;
}

export interface ListaComprasData {
  geradoEm: string;
  statusIncluidos: string[];
  pedidos: { numero: string; cliente: string; status: string }[];
  grupos: ComprasGrupo[];
  produtosSemItens: { sku: string; nome: string; quantidade: number }[];
  fornecedoresCadastrados: ComprasFornecedor[];
  total: number;
}

export const UNIDADE_ROTULO: Record<string, string> = { metro: 'Metro', peca: 'Peça', servico: 'Serviço' };
export const STATUS_ROTULO: Record<string, string> = { aberto: 'Aberto', em_fabricacao: 'Em Fabricação' };

export const formatarQuantidade = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
export const formatarMoeda = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 });

export async function baixarListaComprasPdf(dados: ListaComprasData) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margem = 14;
  const larguraUtil = doc.internal.pageSize.getWidth() - margem * 2;
  const cor = { principal: [8, 145, 178] as [number, number, number], suave: [236, 254, 255] as [number, number, number], cinza: [100, 116, 139] as [number, number, number] };

  const geradoEm = new Date(dados.geradoEm);
  const dataTexto = geradoEm.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Lista de Compras', margem, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...cor.cinza);
  doc.text(`Malu Folhados - gerada em ${dataTexto}`, margem, 24);

  const statusTexto = dados.statusIncluidos.map(s => STATUS_ROTULO[s] || s).join(' + ');
  const numeros = dados.pedidos.map(p => p.numero).join(', ');
  const resumo = doc.splitTextToSize(
    `Pedidos considerados (${statusTexto}): ${dados.pedidos.length}${numeros ? ' - ' + numeros : ''}`,
    larguraUtil
  );
  doc.setTextColor(30, 41, 59);
  doc.text(resumo, margem, 31);

  let y = 31 + resumo.length * 5 + 4;
  const aposTabela = () => ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8;

  for (const grupo of dados.grupos) {
    const f = grupo.fornecedor;
    const contato = f ? [f.telefone, f.email].filter(Boolean).join('  |  ') : '';
    const titulo = f
      ? `Fornecedor: ${f.nome}${contato ? '   ' + contato : ''}`
      : 'Sem fornecedor definido - escolha um dos fornecedores listados no fim do documento';

    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [
        [{ content: titulo, colSpan: 5, styles: { halign: 'left', fillColor: f ? cor.principal : [180, 83, 9], textColor: 255, fontSize: 10 } }],
        ['Item', 'Un.', 'Qtd. a comprar', 'Valor unit.', 'Subtotal'],
      ],
      body: grupo.itens.map(i => [
        i.nome,
        UNIDADE_ROTULO[i.unidade] || i.unidade,
        formatarQuantidade(i.quantidade),
        formatarMoeda(i.valorUnitario),
        formatarMoeda(i.subtotal),
      ]),
      foot: [[{ content: 'Total do fornecedor', colSpan: 4, styles: { halign: 'right' } }, formatarMoeda(grupo.total)]],
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: cor.suave, textColor: [30, 41, 59], fontStyle: 'bold' },
      footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
    });
    y = aposTabela();
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margem, right: margem },
    body: [['Total geral estimado', formatarMoeda(dados.total)]],
    theme: 'plain',
    styles: { fontSize: 11, fontStyle: 'bold', textColor: [30, 41, 59] },
    columnStyles: { 1: { halign: 'right' } },
  });
  y = aposTabela();

  if (dados.produtosSemItens.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: margem, right: margem },
      head: [
        [{ content: 'Atenção: produtos pedidos sem itens vinculados (não entram nesta lista)', colSpan: 3, styles: { halign: 'left', fillColor: [185, 28, 28], textColor: 255 } }],
        ['Código', 'Produto', 'Qtd. pedida'],
      ],
      body: dados.produtosSemItens.map(p => [p.sku, p.nome || '-', String(p.quantidade)]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [254, 242, 242], textColor: [30, 41, 59], fontStyle: 'bold' },
      columnStyles: { 2: { halign: 'right', cellWidth: 28 } },
    });
  }

  if (dados.fornecedoresCadastrados.length > 0) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text('Fornecedores disponíveis', margem, 18);
    autoTable(doc, {
      startY: 22,
      margin: { left: margem, right: margem },
      head: [['Fornecedor', 'Telefone', 'E-mail']],
      body: dados.fornecedoresCadastrados.map(f => [f.nome, f.telefone || '-', f.email || '-']),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: cor.principal, textColor: 255 },
    });
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...cor.cinza);
    doc.text(`Página ${p} de ${total}`, doc.internal.pageSize.getWidth() - margem, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
  }

  const dia = geradoEm.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  doc.save(`lista-de-compras-${dia}.pdf`);
}
