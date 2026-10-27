import { edad } from '../../lib/calc';
import { fFecha, fNum } from '../../lib/format';
import type { Consulta, Paciente } from '../../lib/types';
import { ANTECEDENTES } from '../../components/forms/PacienteForm';

export function Historia({ p, onEditar }: { p: Paciente; onEditar: () => void }) {
  const datos: [string, string | undefined][] = [
    ['Fecha de nacimiento', p.fecha_nacimiento ? `${fFecha(p.fecha_nacimiento)} · ${edad(p.fecha_nacimiento)} años` : undefined],
    ['Sexo (fórmulas)', p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : undefined],
    ['Talla', p.talla_cm ? `${fNum(p.talla_cm)} cm` : undefined],
    ['DNI', p.dni],
    ['Teléfono', p.telefono],
    ['Mail', p.email],
    ['Ocupación', p.ocupacion],
    ['Cobertura', p.cobertura],
    ['Modalidad', p.modalidad],
  ];
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="tarjeta">
        <div className="tarjeta-cab"><h3>Motivo de consulta</h3><button className="btn sec chico" onClick={onEditar}>Editar ficha</button></div>
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.motivo_consulta || <span className="muted">Sin cargar.</span>}</p>
      </div>
      <div className="grid g2">
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Datos personales</h3></div>
          <div className="def">{datos.map(([k, v]) => [<div key={k}>{k}</div>, <div key={k + 'v'}>{v || <span className="muted">—</span>}</div>])}</div>
        </div>
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Objetivos</h3></div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.objetivos || <span className="muted">Sin cargar.</span>}</p>
          {p.notas && (<><h3 style={{ marginTop: 20, marginBottom: 8 }}>Notas internas</h3><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.notas}</p></>)}
        </div>
      </div>
      <div className="tarjeta">
        <div className="tarjeta-cab"><h3>Antecedentes</h3></div>
        <div className="def">
          {ANTECEDENTES.map(([k, label]) => [
            <div key={k}>{label}</div>,
            <div key={k + 'v'}>{p.antecedentes?.[k] || <span className="muted">—</span>}</div>,
          ])}
        </div>
      </div>
    </div>
  );
}

export function Consultas({ consultas, onNueva, onEditar }: { consultas: Consulta[]; onNueva: () => void; onEditar: (c: Consulta) => void }) {
  const orden = [...consultas].sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (!orden.length)
    return <div className="tarjeta vacio"><h3>Sin consultas registradas</h3><p>Cada consulta suma a la evolución de la persona.</p><button className="btn" onClick={onNueva}>Registrar consulta</button></div>;
  return (
    <div>
      {orden.map((c) => (
        <article className="tarjeta" key={c.id}>
          <div className="tarjeta-cab">
            <div className="fila"><h3>{fFecha(c.fecha)}</h3><span className="chip">{c.tipo}</span></div>
            <button className="btn fantasma chico" onClick={() => onEditar(c)}>Editar</button>
          </div>
          {c.relato && <div className="bloque"><span className="eyebrow">Relato</span><p style={{ marginTop: 4 }}>{c.relato}</p></div>}
          {c.observaciones && <div className="bloque"><span className="eyebrow">Observaciones</span><p style={{ marginTop: 4 }}>{c.observaciones}</p></div>}
          {c.indicaciones && <div className="bloque"><span className="eyebrow">Acuerdos</span><p style={{ marginTop: 4 }}>{c.indicaciones}</p></div>}
          {c.proximo_control && <p className="small muted" style={{ marginBottom: 0 }}>Próximo control: {fFecha(c.proximo_control)}</p>}
        </article>
      ))}
    </div>
  );
}
