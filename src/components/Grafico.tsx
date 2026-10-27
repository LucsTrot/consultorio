import { useEffect, useMemo, useRef, useState } from 'react';
import { fFecha, fFechaCorta, fNum } from '../lib/format';

export interface Punto { fecha: string; valor: number }

/**
 * Línea de evolución de UNA métrica. Varias métricas = varios gráficos (small multiples),
 * nunca dos escalas en el mismo eje.
 */
export function Linea({
  datos, unidad = '', alto = 150, refMin, refMax, color = 'var(--tinta)', decimales = 1, etiqueta,
}: {
  datos: Punto[]; unidad?: string; alto?: number; refMin?: number | null; refMax?: number | null;
  color?: string; decimales?: number; etiqueta?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  // Se dibuja al ancho real del contenedor: el texto de los ejes queda siempre a 11 px.
  const caja = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(520);
  useEffect(() => {
    if (!caja.current) return;
    const ro = new ResizeObserver(([e]) => e.contentRect.width > 0 && setW(Math.round(e.contentRect.width)));
    ro.observe(caja.current);
    return () => ro.disconnect();
  }, [datos.length > 0]);
  const H = alto, PL = 44, PR = 14, PT = 18, PB = 26;

  const g = useMemo(() => {
    if (!datos.length) return null;
    const ts = datos.map((d) => new Date(d.fecha + 'T12:00:00').getTime());
    const vs = datos.map((d) => d.valor);
    const extras = [refMin, refMax].filter((x): x is number => x != null);
    let min = Math.min(...vs, ...extras), max = Math.max(...vs, ...extras);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.18;
    min -= pad; max += pad;
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    const x = (t: number) => (t1 === t0 ? (PL + W - PR) / 2 : PL + ((t - t0) / (t1 - t0)) * (W - PL - PR));
    const y = (v: number) => PT + (1 - (v - min) / (max - min)) * (H - PT - PB);
    const ticks = [0, 0.5, 1].map((f) => min + pad + f * (max - min - 2 * pad));
    const decTicks = max - min - 2 * pad < 1.5 ? 2 : max - min - 2 * pad < 15 ? 1 : 0;
    return { pts: datos.map((d, i) => ({ ...d, x: x(ts[i]), y: y(d.valor) })), y, ticks, decTicks };
  }, [datos, refMin, refMax, H, W]);

  if (!g) return <div className="mini" ref={caja}><p className="muted small" style={{ margin: 0 }}>Sin datos todavía.</p></div>;
  const path = g.pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const h = hover != null ? g.pts[hover] : null;
  const ultimo = g.pts.at(-1)!;
  const penultimo = g.pts.at(-2);
  // Si la línea llega desde arriba, la etiqueta va abajo para no pisarla (salvo que no entre).
  const etiquetaAbajo = !!penultimo && penultimo.y < ultimo.y && ultimo.y + 18 < H - 16;

  return (
    <div className="mini" ref={caja} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} height={H} role="img" aria-label={`${etiqueta ?? 'Evolución'}: ${datos.map((d) => `${fFechaCorta(d.fecha)} ${fNum(d.valor, decimales)} ${unidad}`).join(', ')}`}>
        {(refMin != null || refMax != null) && (
          <rect
            x={PL} width={W - PL - PR}
            y={refMax != null ? g.y(refMax) : PT}
            height={(refMin != null ? g.y(refMin) : H - PB) - (refMax != null ? g.y(refMax) : PT)}
            fill="rgba(46,107,79,0.08)"
          />
        )}
        {g.ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={g.y(t)} y2={g.y(t)} stroke="rgba(52,67,61,0.1)" />
            <text x={PL - 8} y={g.y(t) + 4} textAnchor="end" fontSize="11" fontFamily="DM Mono, monospace" fill="#5C6B62">{fNum(t, g.decTicks)}</text>
          </g>
        ))}
        {g.pts.length > 1 && [g.pts[0], ultimo].map((p, i) => (
          <text key={i} x={p.x} y={H - 6} textAnchor={i ? 'end' : 'start'} fontSize="11" fontFamily="DM Mono, monospace" fill="#5C6B62">{fFechaCorta(p.fecha)}</text>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {g.pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === g.pts.length - 1 || i === hover ? 4.5 : 3} fill={i === g.pts.length - 1 ? 'var(--acento)' : color} stroke="var(--tarjeta)" strokeWidth="2" />
        ))}
        <text x={Math.min(ultimo.x, W - PR)} y={etiquetaAbajo ? ultimo.y + 18 : ultimo.y - 10} textAnchor="end" fontSize="12" fontFamily="DM Mono, monospace" fill="#34433D" fontWeight="500">
          {fNum(ultimo.valor, decimales, unidad === 'm')} {unidad}
        </text>
        {g.pts.map((p, i) => {
          const prev = g.pts[i - 1]?.x ?? PL, next = g.pts[i + 1]?.x ?? W - PR;
          const x0 = i === 0 ? PL : (prev + p.x) / 2, x1 = i === g.pts.length - 1 ? W - PR : (p.x + next) / 2;
          return <rect key={i} x={x0} y={0} width={Math.max(1, x1 - x0)} height={H} fill="transparent" onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />;
        })}
        {h && <line x1={h.x} x2={h.x} y1={PT} y2={H - PB} stroke="rgba(52,67,61,0.25)" strokeDasharray="3 3" pointerEvents="none" />}
      </svg>
      {h && (
        <div className="tooltip" style={{ left: `${(h.x / W) * 100}%`, top: `${(h.y / H) * 100}%` }}>
          {fFecha(h.fecha)} · {fNum(h.valor, decimales)} {unidad}
        </div>
      )}
    </div>
  );
}
