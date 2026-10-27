import { clasificaciones, delta, METRICAS, serie, type Metrica } from '../../lib/calc';
import { fDelta, fFecha, fNum } from '../../lib/format';
import { estado, todosLosResultados } from '../../lib/labs';
import type { Consulta, Laboratorio, Medicion, Paciente } from '../../lib/types';
import { Linea } from '../../components/Grafico';
import { ChipNivel } from '../../components/ui';

/** El peso no es el centro: la masa muscular va primero. */
const PRINCIPALES: Metrica[] = ['masa_muscular_pct', 'grasa_pct', 'cintura_m', 'peso'];

export function Stat({ m, p, k }: { m: Medicion[]; p: Paciente; k: Metrica }) {
  const d = delta(m, p, k);
  const meta = METRICAS[k];
  // Músculo y grasa llevan su clasificación (bajo / normal / alto), solo visible para la profesional.
  const ultima = [...m].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const c = ultima ? clasificaciones(ultima, p) : {};
  const nivel = k === 'masa_muscular_pct' ? c.musculo : k === 'grasa_pct' ? c.grasa : undefined;
  return (
    <div className="tarjeta stat">
      <div className="fila" style={{ justifyContent: 'space-between' }}>
        <span className="eyebrow">{meta.nombre}</span>
        <ChipNivel c={nivel} titulo={meta.nombre + '.'} />
      </div>
      <span className={`v ${nivel ? 'nivel-' + nivel.nivel : ''}`}>{fNum(d.ultimo, meta.dec, meta.unidad === 'm')}<small>{meta.unidad}</small></span>
      <span className="d">
        {d.vsInicio !== undefined ? `${fDelta(d.vsInicio, meta.dec)} desde el inicio · ${fDelta(d.vsAnterior, meta.dec)} vs anterior` : 'Una sola medición'}
      </span>
    </div>
  );
}

export function Resumen({ p, mediciones, consultas, labs }: { p: Paciente; mediciones: Medicion[]; consultas: Consulta[]; labs: Laboratorio[] }) {
  const ultimaConsulta = [...consultas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const ultimoLab = [...labs].sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const fuera = ultimoLab ? todosLosResultados(ultimoLab).filter((r) => ['alto', 'bajo'].includes(estado(r) ?? '')) : [];
  const conDatos = PRINCIPALES.filter((k) => serie(mediciones, p, k).length);

  return (
    <div className="grid" style={{ gap: 16 }}>
      {conDatos.length > 0 && (
        <div className="grid g4">{conDatos.map((k) => <Stat key={k} m={mediciones} p={p} k={k} />)}</div>
      )}
      {conDatos.length > 0 && (
        <div className="grid g2">
          {conDatos.map((k) => (
            <div className="tarjeta" key={k}>
              <div className="tarjeta-cab"><h3>{METRICAS[k].nombre}</h3><span className="mono small muted">{METRICAS[k].unidad}</span></div>
              <Linea datos={serie(mediciones, p, k)} unidad={METRICAS[k].unidad} decimales={METRICAS[k].dec} etiqueta={METRICAS[k].nombre} />
            </div>
          ))}
        </div>
      )}
      <div className="grid g2">
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Objetivos</h3></div>
          {p.objetivos ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>{p.objetivos.split('\n').filter(Boolean).map((o, i) => <li key={i} style={{ marginBottom: 4 }}>{o}</li>)}</ul>
          ) : <p className="muted" style={{ margin: 0 }}>Sin objetivos cargados.</p>}
        </div>
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Último acuerdo</h3>{ultimaConsulta && <span className="mono small muted">{fFecha(ultimaConsulta.fecha)}</span>}</div>
          {ultimaConsulta?.indicaciones ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{ultimaConsulta.indicaciones}</p> : <p className="muted" style={{ margin: 0 }}>Sin consultas registradas.</p>}
          {ultimaConsulta?.proximo_control && <p className="small muted" style={{ marginBottom: 0 }}>Próximo control: {fFecha(ultimaConsulta.proximo_control)}</p>}
        </div>
      </div>
      {ultimoLab && (
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Último laboratorio</h3><span className="mono small muted">{fFecha(ultimoLab.fecha)}</span></div>
          {fuera.length ? (
            <div className="fila">{fuera.map((r) => <span key={r.analito} className={`chip ${estado(r)}`}>{r.analito} · {fNum(r.valor, 2)} {r.unidad} · {estado(r)}</span>)}</div>
          ) : <p className="muted" style={{ margin: 0 }}>Todos los valores dentro de los rangos cargados.</p>}
        </div>
      )}
    </div>
  );
}
