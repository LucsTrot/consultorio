import {
  Header,
  AlignmentType, BorderStyle, Document, Footer, ImageRun, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';
import { MARCA } from './marcaImagenes';
import { saveAs } from 'file-saver';
import type { Informe } from './datos';
import { graficoPNG } from './graficoPNG';

const TINTA = '34433D', TINTA2 = '5C6B62', ACENTO = 'A0522D', LINEA = 'DED8CF';
const sinBorde = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const borde = { top: sinBorde, left: sinBorde, right: sinBorde, bottom: { style: BorderStyle.SINGLE, size: 4, color: LINEA } };

const p = (texto: string, o: { font?: string; size?: number; color?: string; bold?: boolean; after?: number; caps?: boolean } = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, line: 300 },
    children: texto.split('\n').map((t, i) => new TextRun({ text: t, break: i ? 1 : 0, font: o.font ?? 'Karla', size: o.size ?? 20, color: o.color ?? TINTA, bold: o.bold, allCaps: o.caps })),
  });

const celda = (t: string, o: { head?: boolean; clave?: boolean; derecha?: boolean; ancho?: number; color?: string } = {}) =>
  new TableCell({
    borders: o.head ? { ...borde, bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D4956B' } } : borde,
    width: o.ancho ? { size: o.ancho, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 0, right: 120 },
    children: [new Paragraph({
      alignment: o.derecha ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: t.split('\n').map((x, i) => new TextRun({
        text: x, break: i ? 1 : 0,
        font: o.head || o.clave ? 'DM Mono' : 'Karla', size: o.head || o.clave ? 15 : 19,
        color: o.color ?? (o.head || o.clave ? ACENTO : TINTA), allCaps: o.head || o.clave,
      })),
    })],
  });

const pngBytes = (dataUrl: string) => Uint8Array.from(atob(dataUrl.split(',')[1]), (c) => c.charCodeAt(0));

export async function informeWord(inf: Informe) {
  const hijos: (Paragraph | Table)[] = [
    p(inf.subtitulo, { font: 'DM Mono', size: 16, color: ACENTO, caps: true, after: 80 }),
    new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: inf.titulo, font: 'Fraunces', size: 52, bold: true, color: TINTA })] }),
  ];

  for (const s of inf.secciones) {
    hijos.push(new Paragraph({ spacing: { before: 280, after: 140 }, children: [new TextRun({ text: s.titulo, font: 'Fraunces', size: 30, bold: true, color: TINTA })] }));
    if (s.texto) hijos.push(p(s.texto));
    if (s.pares?.length) {
      hijos.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: s.pares.map(([k, v]) => new TableRow({ children: [celda(k, { clave: true, ancho: 30 }), celda(v, { ancho: 70 })] })),
      }));
    }
    for (const t of s.tablas ?? []) {
      if (t.titulo) hijos.push(p(t.titulo, { font: 'DM Mono', size: 15, color: TINTA2, caps: true, after: 60 }));
      const der = new Set(t.alinearDerecha ?? []);
      hijos.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ tableHeader: true, children: t.cabecera.map((c, i) => celda(c, { head: true, derecha: der.has(i) })) }),
          ...t.filas.map((f) => new TableRow({
            children: f.map((c, i) => celda(c, { derecha: der.has(i), color: t.cabecera[i] === 'Estado' && (c === 'alto' || c === 'bajo') ? 'B23B2E' : undefined })),
          })),
        ],
      }));
      hijos.push(p('', { after: 120 }));
    }
    for (const g of s.graficos ?? []) {
      const img = await graficoPNG(g);
      hijos.push(new Paragraph({
        spacing: { after: 160 },
        shading: { type: ShadingType.CLEAR, fill: 'FAF8F5', color: 'auto' },
        children: [new ImageRun({ type: 'png', data: img.bytes, transformation: { width: 480, height: Math.round(480 * (img.alto / img.ancho)) } })],
      }));
    }
  }

  const doc = new Document({
    creator: inf.pie[0],
    title: `${inf.titulo} · ${inf.subtitulo}`,
    styles: { default: { document: { run: { font: 'Karla', color: TINTA } } } },
    sections: [{
      properties: { page: { margin: { top: 1020, bottom: 1020, left: 1020, right: 1020 } } },
      headers: {
        default: new Header({
          children: [new Paragraph({
            spacing: { after: 240 },
            children: [new ImageRun({
              type: 'png',
              data: pngBytes(MARCA.lockupHorizontal.dataUrl),
              transformation: { width: 230, height: Math.round(230 * (MARCA.lockupHorizontal.alto / MARCA.lockupHorizontal.ancho)) },
              altText: { name: 'Lic. María Sol Cardacci', description: 'Logo horizontal', title: 'Lic. María Sol Cardacci' },
            })],
          })],
        }),
      },
      footers: { default: new Footer({ children: inf.pie.map((l) => p(l, { font: 'DM Mono', size: 14, color: TINTA2, after: 0 })) }) },
      children: hijos,
    }],
  });
  saveAs(await Packer.toBlob(doc), `${inf.archivo}.docx`);
}
