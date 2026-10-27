import { useMemo, useState } from 'react';
import { repo } from '../../lib/db';
import { fFecha, fNum } from '../../lib/format';
import { estado, serieAnalito, todosLosResultados } from '../../lib/labs';
import type { Laboratorio } from '../../lib/types';
import { Linea } from '../../components/Grafico';

export function Laboratorios({ labs, onNuevo, onEditar }: { labs: Laboratorio[]; onNuevo: () => void; onEditar: (l: Laboratorio) => void }) {
  const orden = [...labs].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const analitos = useMemo(() => {
    const cuenta = new Map<string, number>();
    labs.forEach((l) => todosLosResultados(l).forEach((r) => r.valor != null && cuenta.set(r.analito, (cuenta.get(r.analito) ?? 0) + 1)));
    return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [labs]);
  const [sel, setSel] = useState<string>('');
  const activo = sel || analitos[0];
  const s = activo ? serieAnalito(labs, activo) : [];
  const ref = s.at(-1);

  const abrir = async (l: Laboratorio) => {
    if (!l.archivo_path) return;
    // La ventana se abre en el clic (si no, el navegador la bloquea) y se completa al llegar el archivo.
    const w = window.open('', '_blank');
    const url = await repo.fileUrl(l.archivo_path);
    if (w && url) w.location.href = url;
    else if (url) window.location.href = url;
  };

  if (!orden.length)
    return <div className="tarjeta vacio"><h3>Sin laboratorios</h3><p>Cargá los valores del informe y adjuntá el PDF original. Los índices como HOMA-IR se calculan solos.</p><button className="btn" onClick={onNuevo}>Cargar laboratorio</button></div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="tarjeta">
        <div className="tarjeta-cab">
          <h3>Tendencia</h3>
          <select value={activo} onChange={(e) => setSel(e.target.value)} style={{ maxWidth: 280 }} aria-label="Analito">
            {analitos.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <Linea datos={s} unidad={ref?.unidad ?? ''} refMin={ref?.ref_min} refMax={ref?.ref_max} decimales={2} alto={170} etiqueta={activo} />
        {(ref?.ref_min != null || ref?.ref_max != null) && <p className="small muted" style={{ marginBottom: 0 }}>La franja verde marca el rango de referencia del último informe.</p>}
      </div>

      {orden.map((l) => (
        <article className="tarjeta" key={l.id}>
          <div className="tarjeta-cab">
            <div><h3>{fFecha(l.fecha)}</h3>{l.laboratorio && <span className="small muted">{l.laboratorio}</span>}</div>
            <div className="fila">
              {l.archivo_path && <button className="btn sec chico" onClick={() => abrir(l)}>Ver informe</button>}
              <button className="btn fantasma chico" onClick={() => onEditar(l)}>Editar</button>
            </div>
          </div>
          <div className="scroll-x">
            <table className="tabla">
              <thead><tr><th>Analito</th><th className="num">Valor</th><th>Unidad</th><th className="num">Referencia</th><th>Estado</th></tr></thead>
              <tbody>
                {todosLosResultados(l).map((r) => {
                  const e = estado(r);
                  const derivado = !l.resultados.includes(r);
                  return (
                    <tr key={r.analito}>
                      <td>{r.analito}{derivado && <span className="small muted"> · calculado</span>}</td>
                      <td className="num">{fNum(r.valor, 2)}</td>
                      <td className="small muted">{r.unidad}</td>
                      <td className="num small">{r.ref_min != null && r.ref_max != null ? `${fNum(r.ref_min, 2)}–${fNum(r.ref_max, 2)}` : r.ref_min != null ? `≥ ${fNum(r.ref_min, 2)}` : r.ref_max != null ? `≤ ${fNum(r.ref_max, 2)}` : '—'}</td>
                      <td>{e && <span className={`chip ${e === 'en rango' ? 'ok' : e}`}>{e}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {l.notas && <p className="small" style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{l.notas}</p>}
        </article>
      ))}
    </div>
  );
}
