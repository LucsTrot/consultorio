import { isToday } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { repo, useRows } from '../lib/db';
import { cargarDemo } from '../lib/demo';
import { fDiaLargo, fFecha, fHora, hoyISO, nombreCompleto } from '../lib/format';
import { FilaRecordatorio } from './Recordatorios';
import { RecordatorioForm } from '../components/forms/RecordatorioForm';
import { Vacio } from '../components/ui';
import type { Recordatorio } from '../lib/types';

const saludo = () => { const h = new Date().getHours(); return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'; };

export default function Inicio() {
  const nav = useNavigate();
  const { rows: todos, cargando } = useRows('pacientes');
  const pacientes = useMemo(() => todos.filter((p) => p.estado !== 'suspendido'), [todos]);
  const { rows: turnos } = useRows('turnos');
  const { rows: recs } = useRows('recordatorios');
  const { rows: consultas } = useRows('consultas');
  const [editar, setEditar] = useState<Recordatorio | null>(null);
  // Demo publicada: abre con datos de ejemplo en lugar de una pantalla vacía.
  useEffect(() => {
    if (import.meta.env.MODE !== 'demo' || cargando) return;
    // Si la demo tiene datos de una versión anterior, se recargan los ejemplos actuales.
    let version = '';
    try { version = localStorage.getItem('demo.datos') ?? ''; } catch { /* sin storage */ }
    if (!pacientes.length || version !== '2') {
      cargarDemo().then(() => { try { localStorage.setItem('demo.datos', '2'); } catch { /* sin storage */ } });
    }
  }, [cargando, pacientes.length]);
  const pac = useMemo(() => new Map(todos.map((p) => [p.id, p])), [todos]);
  const tur = useMemo(() => new Map(turnos.map((t) => [t.id, t])), [turnos]);

  const hoy = turnos.filter((t) => isToday(new Date(t.inicio))).sort((a, b) => a.inicio.localeCompare(b.inicio));
  const pendientes = recs.filter((r) => !r.hecho && (new Date(r.fecha) <= new Date() || isToday(new Date(r.fecha)))).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ahoraISO = new Date().toISOString().slice(0, 16);
  // Personas con un control acordado que ya pasó y sin turno futuro.
  const sinControl = pacientes.filter((p) => {
    const ult = consultas.filter((c) => c.paciente_id === p.id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const futuro = turnos.some((t) => t.paciente_id === p.id && t.inicio >= ahoraISO && !['cancelado', 'ausente'].includes(t.estado));
    return ult?.proximo_control && ult.proximo_control < hoyISO() && !futuro;
  });
  const semana = turnos.filter((t) => { const d = new Date(t.inicio); const n = new Date(); return d >= n && d.getTime() - n.getTime() < 7 * 864e5; }).length;

  return (
    <>
      <div className="cabecera">
        <div>
          <span className="eyebrow" style={{ display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>{fDiaLargo(new Date())}</span>
          <h1>{saludo()}, Sol</h1>
        </div>
      </div>

      {repo.modo === 'local' && (
        <div className="aviso-modo">
          <span>{import.meta.env.MODE === 'demo' ? <><strong>Demo con personas ficticias.</strong> Lo que cargues queda solo en este navegador. Las exportaciones descargan en la app instalada, no en esta vista.</> : <><strong>Modo local.</strong> Los datos se guardan solo en este navegador. Para usarla con pacientes reales conectá la planilla (ver README).</>}</span>
          {!cargando && !todos.length && <button className="btn chico" onClick={() => cargarDemo()}>Cargar datos de ejemplo</button>}
        </div>
      )}

      <div className="grid g4" style={{ marginBottom: 16 }}>
        <div className="tarjeta stat"><span className="eyebrow">Turnos hoy</span><span className="v">{hoy.length}</span></div>
        <div className="tarjeta stat"><span className="eyebrow">Próximos 7 días</span><span className="v">{semana}</span></div>
        <div className="tarjeta stat"><span className="eyebrow">Recordatorios</span><span className="v">{pendientes.length}</span><span className="d">para hoy o vencidos</span></div>
        <div className="tarjeta stat"><span className="eyebrow">Pacientes</span><span className="v">{pacientes.length}</span></div>
      </div>

      <div className="grid g2">
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Hoy</h3><Link to="/agenda" className="small">Agenda completa</Link></div>
          {hoy.length ? (
            <table className="tabla"><tbody>
              {hoy.map((t) => {
                const p = pac.get(t.paciente_id);
                return (
                  <tr key={t.id} className="clic" onClick={() => nav(`/pacientes/${t.paciente_id}`)}>
                    <td className="mono" style={{ width: 60 }}>{fHora(t.inicio)}</td>
                    <td><strong>{nombreCompleto(p)}</strong><div className="small muted">{t.tipo} · {t.modalidad}</div></td>
                    <td style={{ textAlign: 'right' }}><span className="chip">{t.estado}</span></td>
                  </tr>
                );
              })}
            </tbody></table>
          ) : <p className="muted" style={{ margin: 0 }}>No hay turnos para hoy.</p>}
        </div>

        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Controles sin turno</h3><span className="mono small muted">{sinControl.length}</span></div>
          {sinControl.length ? (
            <table className="tabla"><tbody>
              {sinControl.map((p) => (
                <tr key={p.id} className="clic" onClick={() => nav(`/pacientes/${p.id}`)}>
                  <td><strong>{nombreCompleto(p)}</strong></td>
                  <td className="small muted" style={{ textAlign: 'right' }}>
                    control acordado {fFecha(consultas.filter((c) => c.paciente_id === p.id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.proximo_control)}
                  </td>
                </tr>
              ))}
            </tbody></table>
          ) : <p className="muted" style={{ margin: 0 }}>Todas las personas con control acordado tienen turno.</p>}
        </div>
      </div>

      <div className="tarjeta" style={{ marginTop: 16 }}>
        <div className="tarjeta-cab"><h3>Recordatorios de hoy</h3><Link to="/recordatorios" className="small">Ver todos</Link></div>
        {pendientes.length ? (
          <div className="scroll-x"><table className="tabla"><tbody>
            {pendientes.map((r) => <FilaRecordatorio key={r.id} r={r} p={r.paciente_id ? pac.get(r.paciente_id) : undefined} t={r.turno_id ? tur.get(r.turno_id) : undefined} onEditar={() => setEditar(r)} />)}
          </tbody></table></div>
        ) : <Vacio titulo="Al día" texto="No hay recordatorios pendientes para hoy." />}
      </div>
      {editar && <RecordatorioForm inicial={editar} onClose={() => setEditar(null)} />}
    </>
  );
}
