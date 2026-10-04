export interface LinhaTerceiro {
  sku: string;
  nome: string;
  categoria: string;
  quantidade: number;
  imagemUrl: string | null;
}

export interface ListaTerceiroData {
  fabricante: string;
  geradoEm: string;
  statusIncluidos: string[];
  pedidos: number;
  linhas: LinhaTerceiro[];
}

export const STATUS_PEDIDO_ROTULO: Record<string, string> = { aberto: 'Aberto', em_fabricacao: 'Em Fabricação', fechado: 'Fechado' };

export const formatarQtd = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Baixa a foto e reduz para caber leve no PDF. Se falhar, a linha sai sem foto.
async function carregarFoto(url: string): Promise<{ dataUrl: string; largura: number; altura: number } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const bitmap = await createImageBitmap(await resp.blob());
    const escala = Math.min(1, 360 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.75), largura: canvas.width, altura: canvas.height };
  } catch {
    return null;
  }
}

export async function baixarListaTerceiroPdf(dados: ListaTerceiroData, aoProgredir?: (feitas: number, total: number) => void) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const fotos = new Map<string, { dataUrl: string; largura: number; altura: number }>();
  const urls = Array.from(new Set(dados.linhas.map(l => l.imagemUrl).filter(Boolean) as string[]));
  let feitas = 0;
  const fila = [...urls];
  const trabalhador = async () => {
    while (fila.length > 0) {
      const url = fila.shift() as string;
      const foto = await carregarFoto(url);
      if (foto) fotos.set(url, foto);
      feitas++;
      aoProgredir?.(feitas, urls.length);
    }
  };
  await Promise.all([trabalhador(), trabalhador(), trabalhador(), trabalhador()]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margem = 10;
  const geradoEm = new Date(dados.geradoEm);
  const dataTexto = geradoEm.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const nomeFab = dados.fabricante.toUpperCase();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(0, 0, 0);
  const titulo = `LISTA PEDIDOS DO ${nomeFab}`;
  doc.text(titulo, margem, 14);
  const larguraTitulo = doc.getTextWidth(titulo);
  doc.text('DATA:', margem + larguraTitulo + 8, 14);
  const larguraData = doc.getTextWidth('DATA:');
  doc.setFont('helvetica', 'normal');
  doc.text(dataTexto, margem + larguraTitulo + 8 + larguraData + 2, 14);

  const ALTURA_LINHA = 38;
  const checkFab = `Check ${dados.fabricante.charAt(0).toUpperCase()}${dados.fabricante.slice(1).toLowerCase()}`;

  autoTable(doc, {
    startY: 19,
    margin: { left: margem, right: margem, bottom: 12 },
    head: [['Código', 'TIPO', 'QTDE', 'FOTO', checkFab, 'Check Malu']],
    body: dados.linhas.map(l => [l.sku, l.categoria || '', formatarQtd(l.quantidade), '', '', '']),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0], minCellHeight: ALTURA_LINHA, valign: 'top' },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', minCellHeight: 8, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', fontSize: 8 },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 34 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 'auto' },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 3) return;
      const url = dados.linhas[data.row.index]?.imagemUrl;
      const foto = url ? fotos.get(url) : undefined;
      if (!foto) return;
      const maxL = data.cell.width - 1;
      const maxA = data.cell.height - 1;
      const escala = Math.min(maxL / foto.largura, maxA / foto.altura);
      const w = foto.largura * escala;
      const h = foto.altura * escala;
      doc.addImage(foto.dataUrl, 'JPEG', data.cell.x + (data.cell.width - w) / 2, data.cell.y + 0.5, w, h);
    },
  });

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Página ${p} de ${total}`, doc.internal.pageSize.getWidth() - margem, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
  }

  const dia = geradoEm.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const slug = dados.fabricante.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  doc.save(`lista-pedidos-${slug}-${dia}.pdf`);
}
