import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Informe } from './datos';
import { graficoPNG } from './graficoPNG';
import { MARCA } from './marcaImagenes';
import { PDF_FONTS } from './pdfFonts';

const TINTA: [number, number, number] = [52, 67, 61];
const TINTA2: [number, number, number] = [92, 107, 98];
const ACENTO: [number, number, number] = [160, 82, 45];
const LINEA: [number, number, number] = [222, 216, 207];
const SUPERFICIE: [number, number, number] = [237, 231, 221];

function registrarFuentes(doc: jsPDF) {
  const reg = (archivo: string, familia: string, estilo: string) => {
    doc.addFileToVFS(`${archivo}.ttf`, PDF_FONTS[archivo]);
    doc.addFont(`${archivo}.ttf`, familia, estilo);
  };
  reg('Fraunces-Bold', 'Fraunces', 'bold');
  reg('Fraunces-SemiBoldItalic', 'Fraunces', 'italic');
  reg('Karla-Regular', 'Karla', 'normal');
  reg('Karla-Bold', 'Karla', 'bold');
  reg('DMMono-Regular', 'DMMono', 'normal');
}

export async function informePDF(inf: Informe) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  registrarFuentes(doc);
  const W = 210, H = 297, M = 18, ANCHO = W - 2 * M, PIE = 20;
  let y = M;

  const espacio = (h: number) => {
    if (y + h > H - M - PIE) { doc.addPage(); y = M; }
  };
  const lastY = () => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Filigrana del isotipo en la primera página: abajo a la derecha, saliéndose por los bordes (la página la recorta).
  // El PNG ya trae la opacidad de marca (6 %); no se le suma otra.
  const fW = 150, fH = fW * (MARCA.filigrana.alto / MARCA.filigrana.ancho);
  doc.addImage(MARCA.filigrana.dataUrl, 'PNG', W - fW + 42, H - fH + 26, fW, fH, 'filigrana', 'FAST');

  // Encabezado: banda verde con nombre en Fraunces crema e isotipo inverso a la derecha
  doc.setFillColor(...TINTA);
  doc.rect(0, 0, W, 52, 'F');
  const iso = 26;
  doc.addImage(MARCA.isotipoInverso.dataUrl, 'PNG', W - M - iso, 13, iso, iso, 'isotipo', 'FAST');
  doc.setFont('DMMono', 'normal'); doc.setFontSize(8); doc.setTextColor(168, 184, 158);
  doc.text(inf.subtitulo.toUpperCase(), M, 20, { charSpace: 0.6 });
  doc.setFont('Fraunces', 'bold'); doc.setFontSize(26); doc.setTextColor(250, 248, 245);
  doc.text(inf.titulo, M, 36);
  doc.setDrawColor(212, 149, 107); doc.setLineWidth(0.8); doc.line(M, 42, M + 22, 42);
  y = 66;

  for (const s of inf.secciones) {
    espacio(18);
    doc.setFont('Fraunces', 'bold'); doc.setFontSize(15); doc.setTextColor(...TINTA);
    doc.text(s.titulo, M, y);
    y += 7;

    if (s.texto) {
      doc.setFont('Karla', 'normal'); doc.setFontSize(10); doc.setTextColor(...TINTA);
      const lineas = doc.splitTextToSize(s.texto, ANCHO) as string[];
      for (const l of lineas) { espacio(5.2); doc.text(l, M, y); y += 5.2; }
      y += 3;
    }

    if (s.pares?.length) {
      autoTable(doc, {
        startY: y, margin: { left: M, right: M, bottom: M + PIE }, theme: 'plain',
        body: s.pares,
        styles: { font: 'Karla', fontSize: 9.5, textColor: TINTA, cellPadding: { top: 2.4, bottom: 2.4, left: 0, right: 4 }, lineColor: LINEA, lineWidth: { bottom: 0.2 } },
        columnStyles: { 0: { font: 'DMMono', fontStyle: 'normal', fontSize: 7.5, textColor: ACENTO, cellWidth: 52 } },
      });
      y = lastY() + 6;
    }

    for (const t of s.tablas ?? []) {
      if (t.titulo) {
        espacio(14);
        doc.setFont('DMMono', 'normal'); doc.setFontSize(8); doc.setTextColor(...TINTA2);
        doc.text(t.titulo.toUpperCase(), M, y, { charSpace: 0.4 });
        y += 3;
      }
      const derecha = Object.fromEntries((t.alinearDerecha ?? []).map((i) => [i, { halign: 'right' as const }]));
      autoTable(doc, {
        startY: y, margin: { left: M, right: M, bottom: M + PIE }, theme: 'plain',
        head: [t.cabecera], body: t.filas,
        styles: { font: 'Karla', fontSize: 9, textColor: TINTA, cellPadding: 2, lineColor: LINEA, lineWidth: { bottom: 0.2 } },
        headStyles: { font: 'DMMono', fontStyle: 'normal', fontSize: 7.5, textColor: ACENTO, lineColor: [212, 149, 107], lineWidth: { bottom: 0.3 } },
        columnStyles: derecha,
        didParseCell: (d) => {
          if (d.section === 'head' && t.alinearDerecha?.includes(d.column.index)) d.cell.styles.halign = 'right';
          if (d.section === 'body' && t.cabecera[d.column.index] === 'Estado' && (d.cell.raw === 'alto' || d.cell.raw === 'bajo')) d.cell.styles.textColor = [178, 59, 46];
        },
      });
      y = lastY() + 6;
    }

    if (s.graficos?.length) {
      const colW = (ANCHO - 6) / 2;
      for (let i = 0; i < s.graficos.length; i += 2) {
        const par = s.graficos.slice(i, i + 2);
        const imgs = await Promise.all(par.map((g) => graficoPNG(g)));
        const h = colW * (imgs[0].alto / imgs[0].ancho);
        espacio(h + 4);
        imgs.forEach((im, j) => {
          doc.setFillColor(...SUPERFICIE);
          doc.addImage(im.dataUrl, 'PNG', M + j * (colW + 6), y, colW, h, undefined, 'MEDIUM');
        });
        y += h + 5;
      }
    }
    y += 4;
  }

  // Pie en todas las páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...LINEA); doc.setLineWidth(0.2); doc.line(M, H - M - 8, W - M, H - M - 8);
    doc.setFont('DMMono', 'normal'); doc.setFontSize(7); doc.setTextColor(...TINTA2);
    inf.pie.forEach((l, j) => doc.text(l, M, H - M - 3 + j * 3.6));
    doc.text(`${String(i).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, W - M, H - M - 3, { align: 'right' });
  }

  doc.save(`${inf.archivo}.pdf`);
}
