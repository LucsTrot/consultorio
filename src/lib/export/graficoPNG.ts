import { fFechaCorta, fNum } from '../format';
import type { Grafico } from './datos';

/** Dibuja un gráfico de evolución (una serie) en canvas y devuelve PNG. Escala 2× para impresión. */
export async function graficoPNG(g: Grafico, ancho = 520, alto = 210): Promise<{ dataUrl: string; bytes: Uint8Array; ancho: number; alto: number }> {
  try { await document.fonts.load('600 15px "Fraunces Variable"'); await document.fonts.load('400 11px "DM Mono"'); } catch { /* sin fuentes: fallback */ }
  const S = 2;
  const c = document.createElement('canvas');
  c.width = ancho * S; c.height = alto * S;
  const ctx = c.getContext('2d')!;
  ctx.scale(S, S);
  ctx.fillStyle = '#FAF8F5'; ctx.fillRect(0, 0, ancho, alto);

  ctx.fillStyle = '#34433D';
  ctx.font = '600 15px "Fraunces Variable", Georgia, serif';
  ctx.fillText(g.titulo, 14, 24);
  const anchoTitulo = ctx.measureText(g.titulo).width;
  ctx.fillStyle = '#5C6B62';
  ctx.font = '400 11px "DM Mono", monospace';
  ctx.fillText(g.unidad, 14 + anchoTitulo + 8, 24);

  const PL = 48, PR = 18, PT = 44, PB = 30;
  const ts = g.datos.map((d) => new Date(d.fecha + 'T12:00:00').getTime());
  const vs = g.datos.map((d) => d.valor);
  let min = Math.min(...vs), max = Math.max(...vs);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.2; min -= pad; max += pad;
  const t0 = Math.min(...ts), t1 = Math.max(...ts);
  const x = (t: number) => (t1 === t0 ? (PL + ancho - PR) / 2 : PL + ((t - t0) / (t1 - t0)) * (ancho - PL - PR));
  const y = (v: number) => PT + (1 - (v - min) / (max - min)) * (alto - PT - PB);

  ctx.font = '400 10px "DM Mono", monospace';
  ctx.textAlign = 'right';
  for (const f of [0, 0.5, 1]) {
    const v = min + pad + f * (max - min - 2 * pad);
    ctx.strokeStyle = 'rgba(52,67,61,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PL, y(v)); ctx.lineTo(ancho - PR, y(v)); ctx.stroke();
    ctx.fillStyle = '#5C6B62'; ctx.fillText(fNum(v, g.dec ?? 1), PL - 8, y(v) + 3);
  }
  ctx.textAlign = 'left'; ctx.fillText(fFechaCorta(g.datos[0].fecha), PL, alto - 10);
  ctx.textAlign = 'right'; ctx.fillText(fFechaCorta(g.datos.at(-1)!.fecha), ancho - PR, alto - 10);

  ctx.strokeStyle = '#34433D'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
  ctx.beginPath();
  g.datos.forEach((d, i) => (i ? ctx.lineTo(x(ts[i]), y(d.valor)) : ctx.moveTo(x(ts[i]), y(d.valor))));
  ctx.stroke();
  g.datos.forEach((d, i) => {
    const ult = i === g.datos.length - 1;
    ctx.beginPath(); ctx.arc(x(ts[i]), y(d.valor), ult ? 4.5 : 3, 0, Math.PI * 2);
    ctx.fillStyle = ult ? '#A0522D' : '#34433D'; ctx.fill();
    ctx.strokeStyle = '#FAF8F5'; ctx.lineWidth = 2; ctx.stroke();
  });
  const u = g.datos.at(-1)!;
  ctx.fillStyle = '#34433D'; ctx.font = '500 11px "DM Mono", monospace'; ctx.textAlign = 'right';
  const prev = g.datos.at(-2);
  const abajo = !!prev && y(prev.valor) < y(u.valor) && y(u.valor) + 18 < alto - 16;
  ctx.fillText(`${fNum(u.valor, g.dec ?? 1, g.unidad === 'm')} ${g.unidad}`, Math.min(x(ts.at(-1)!), ancho - PR), abajo ? y(u.valor) + 18 : y(u.valor) - 10);

  const dataUrl = c.toDataURL('image/png');
  const bin = atob(dataUrl.split(',')[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { dataUrl, bytes, ancho, alto };
}
