import { isToday } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { completarPlantilla, leerAjustes } from '../lib/ajustes';
import { repo, useRows } from '../lib/db';
import { fFecha, fHora, nombreCompleto, waLink } from '../lib/format';
import type { Paciente, Recordatorio, Turno } from '../lib/types';
import { RecordatorioForm } from '../components/forms/RecordatorioForm';
import { Cabecera, Vacio } from '../components/ui';

export function mensajeWhatsApp(r: Recordatorio, p?: Paciente, t?: Turno) {
  const aj = leerAjustes();
  if (r.tipo === 'turno' && t)
    return completarPlantilla(aj.plantilla_turno, {
      nombre: p?.nombre ?? '',
      dia: new Date(t.inicio).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
      hora: fHora(t.inicio),
      modalidad: t.modalidad === 'Online' ? 'online' : `presencial, ${aj.consultorio}`,
    });
  if (r.tipo === 'control') return completarPlantilla(aj.plantilla_control, { nombre: p?.nombre ?? '' });
  return `Hola ${p?.nombre ?? ''}, `;
}

export function FilaRecordatorio({ r, p, t, onEditar }: { r: Recordatorio; p?: Paciente; t?: Turno; onEditar: () => void }) {
  // Optimista: la casilla cambia al instante y el guardado sigue por detrás (la planilla tarda ~1 s).
  const [hecho, setHecho] = useState(r.hecho);
  useEffect(() => setHecho(r.hecho), [r.hecho]);
  const marcar = (v: boolean) => {
    setHecho(v);
    repo.save('recordatorios', { id: r.id, hecho: v }).catch((e) => { setHecho(!v); throw e; });
  };
  const vencido = !hecho && new Date(r.fecha) < new Date() && !isToday(new Date(r.fecha));
  return (
    <tr style={{ opacity: hecho ? 0.5 : 1 }}>
      <td style={{ width: 36 }}>
        <input type="checkbox" style={{ width: 18, height: 18 }} checked={hecho} aria-label="Hecho" onChange={(e) => marcar(e.target.checked)} />
      </td>
      <td>
        <strong style={{ textDecoration: hecho ? 'line-through' : undefined }}>{r.tipo === 'turno' && t ? `Turno ${fFecha(t.inicio)} · ${fHora(t.inicio)}` : r.mensaje}</strong>
        <div className="small muted">
          {p ? <Link to={`/pacientes/${p.id}`}>{nombreCompleto(p)}</Link> : 'Sin persona'} · <span className="chip">{r.tipo}</span>
        </div>
      </td>
      <td className="small" style={{ color: vencido ? 'var(--alerta)' : undefined, whiteSpace: 'nowrap' }}>{fFecha(r.fecha)} · {fHora(r.fecha)}{vencido && ' · vencido'}</td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {p?.telefono && r.tipo !== 'tarea' && !hecho && (
          <a className="btn sec chico" href={waLink(p.telefono, mensajeWhatsApp(r, p, t))} target="_blank" rel="noopener" onClick={() => r.tipo === 'turno' && marcar(true)}>
            WhatsApp
          </a>
        )}
        <button className="btn fantasma chico" onClick={onEditar}>Editar</button>
      </td>
    </tr>
  );
}

export default function Recordatorios() {
  const { rows } = useRows('recordatorios');
  const { rows: pacientes } = useRows('pacientes');
  const { rows: turnos } = useRows('turnos');
  const [modal, setModal] = useState<{ r?: Recordatorio } | null>(null);
  const [verHechos, setVerHechos] = useState(false);
  const [permiso, setPermiso] = useState(() => ('Notification' in window ? Notification.permission : 'denied'));
  const pac = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes]);
  const tur = useMemo(() => new Map(turnos.map((t) => [t.id, t])), [turnos]);

  const ahora = new Date();
  const ord = [...rows].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const grupos: [string, Recordatorio[]][] = [
    ['Para hoy y vencidos', ord.filter((r) => !r.hecho && (new Date(r.fecha) <= ahora || isToday(new Date(r.fecha))))],
    ['Próximos', ord.filter((r) => !r.hecho && new Date(r.fecha) > ahora && !isToday(new Date(r.fecha)))],
    ...(verHechos ? [['Hechos', ord.filter((r) => r.hecho).reverse()] as [string, Recordatorio[]]] : []),
  ];

  return (
    <>
      <Cabecera eyebrow="04 · Recordatorios" titulo="Recordatorios">
        <button className="btn sec" onClick={() => setVerHechos(!verHechos)}>{verHechos ? 'Ocultar hechos' : 'Ver hechos'}</button>
        <button className="btn" onClick={() => setModal({})}>Nuevo recordatorio</button>
      </Cabecera>
      {permiso === 'default' && (
        <div className="aviso-modo">
          <span>Activá los avisos para que la app te notifique cuando vence un recordatorio.</span>
          <button className="btn chico" onClick={() => Notification.requestPermission().then(setPermiso)}>Activar avisos</button>
        </div>
      )}
      {grupos.map(([titulo, lista]) => (
        <div className="tarjeta" key={titulo}>
          <div className="tarjeta-cab"><h3>{titulo}</h3><span className="mono small muted">{lista.length}</span></div>
          {lista.length ? (
            <div className="scroll-x"><table className="tabla"><tbody>
              {lista.map((r) => <FilaRecordatorio key={r.id} r={r} p={r.paciente_id ? pac.get(r.paciente_id) : undefined} t={r.turno_id ? tur.get(r.turno_id) : undefined} onEditar={() => setModal({ r })} />)}
            </tbody></table></div>
          ) : <Vacio titulo="Nada pendiente acá" />}
        </div>
      ))}
      {modal && <RecordatorioForm inicial={modal.r} onClose={() => setModal(null)} />}
    </>
  );
}
