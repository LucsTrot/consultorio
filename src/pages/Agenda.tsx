import { addDays, addWeeks, format, isSameDay, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { useRows } from '../lib/db';
import { fDiaLargo, fHora, nombreCompleto, toLocalISO } from '../lib/format';
import type { Turno } from '../lib/types';
import { TurnoForm } from '../components/forms/TurnoForm';
import { Cabecera } from '../components/ui';

const H0 = 8, H1 = 21, SLOT = 30, ALTO = 28;

/** Turnos que se pisan en el mismo día van lado a lado, cada uno en su carril. */
function carriles(ts: Turno[]) {
  const orden = [...ts].sort((a, b) => a.inicio.localeCompare(b.inicio));
  const fin = (t: Turno) => new Date(t.inicio).getTime() + t.duracion_min * 60_000;
  const out: { t: Turno; carril: number; total: number }[] = [];
  let grupo: { t: Turno; carril: number; total: number }[] = [];
  let finGrupo = 0;
  const cerrar = () => { const n = Math.max(...grupo.map((g) => g.carril)) + 1; grupo.forEach((g) => (g.total = n)); out.push(...grupo); grupo = []; };
  for (const t of orden) {
    const ini = new Date(t.inicio).getTime();
    if (grupo.length && ini >= finGrupo) cerrar();
    const libres = grupo.filter((g) => fin(g.t) > ini).map((g) => g.carril);
    let c = 0;
    while (libres.includes(c)) c++;
    grupo.push({ t, carril: c, total: 1 });
    finGrupo = Math.max(finGrupo, fin(t));
  }
  if (grupo.length) cerrar();
  return out;
}

export default function Agenda() {
  const [semana, setSemana] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [vista, setVista] = useState<'semana' | 'lista'>(() => (window.innerWidth < 860 ? 'lista' : 'semana'));
  const [modal, setModal] = useState<{ x?: Turno; inicio?: string } | null>(null);
  const { rows: turnos } = useRows('turnos');
  const { rows: pacientes } = useRows('pacientes');
  const pac = useMemo(() => new Map(pacientes.map((p) => [p.id, p])), [pacientes]);
  const dias = Array.from({ length: 6 }, (_, i) => addDays(semana, i));
  const deLaSemana = turnos.filter((t) => {
    const d = new Date(t.inicio);
    return d >= semana && d < addDays(semana, 7);
  });
  const slots = Array.from({ length: ((H1 - H0) * 60) / SLOT }, (_, i) => H0 * 60 + i * SLOT);
  const hoy = new Date();

  return (
    <>
      <Cabecera eyebrow="03 · Agenda" titulo={`Semana del ${format(semana, "d 'de' MMMM", { locale: es })}`}>
        <button className="btn sec" onClick={() => setSemana(addWeeks(semana, -1))} aria-label="Semana anterior">←</button>
        <button className="btn sec" onClick={() => setSemana(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Hoy</button>
        <button className="btn sec" onClick={() => setSemana(addWeeks(semana, 1))} aria-label="Semana siguiente">→</button>
        <button className="btn sec" onClick={() => setVista(vista === 'semana' ? 'lista' : 'semana')}>{vista === 'semana' ? 'Ver lista' : 'Ver semana'}</button>
        <button className="btn" onClick={() => setModal({})}>Nuevo turno</button>
      </Cabecera>

      {vista === 'semana' ? (
        <div className="scroll-x">
          <div className="agenda">
            <div style={{ borderBottom: '1px solid var(--linea-fuerte)' }} />
            {dias.map((d) => (
              <div key={+d} className={`dia-cab ${isSameDay(d, hoy) ? 'hoy' : ''}`}>
                <span>{format(d, 'EEE', { locale: es })}</span>
                <b>{format(d, 'd')}</b>
              </div>
            ))}
            <div>
              {slots.map((m) => <div key={m} className="hora" style={{ height: ALTO }}>{m % 60 === 0 ? `${String(m / 60).padStart(2, '0')}:00` : ''}</div>)}
            </div>
            {dias.map((d) => (
              <div key={+d} className="col">
                {slots.map((m) => (
                  <div
                    key={m}
                    className={`slot ${m % 60 === 30 ? 'hr' : ''}`}
                    onClick={() => { const x = new Date(d); x.setHours(0, m, 0, 0); setModal({ inicio: toLocalISO(x) }); }}
                    title="Agendar acá"
                  />
                ))}
                {carriles(deLaSemana.filter((t) => isSameDay(new Date(t.inicio), d))).map(({ t, carril, total }) => {
                  const ini = new Date(t.inicio);
                  const min = ini.getHours() * 60 + ini.getMinutes() - H0 * 60;
                  const p = pac.get(t.paciente_id);
                  return (
                    <div
                      key={t.id}
                      className={`turno ${t.modalidad === 'Online' ? 'online' : ''} ${t.estado}`}
                      style={{
                        top: (min / SLOT) * ALTO + 1, height: Math.max((t.duracion_min / SLOT) * ALTO - 3, 24),
                        left: `calc(${(carril / total) * 100}% + 4px)`, right: 'auto', width: `calc(${100 / total}% - 8px)`,
                      }}
                      onClick={() => setModal({ x: t })}
                    >
                      <b>{p ? nombreCompleto(p) : '—'}</b>
                      <span>{fHora(t.inicio)} · {t.modalidad}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {dias.map((d) => {
            const delDia = deLaSemana.filter((t) => isSameDay(new Date(t.inicio), d)).sort((a, b) => a.inicio.localeCompare(b.inicio));
            return (
              <div className="tarjeta" key={+d}>
                <div className="tarjeta-cab"><h3 style={{ textTransform: 'capitalize' }}>{fDiaLargo(d)}</h3>{isSameDay(d, hoy) && <span className="chip ok">hoy</span>}</div>
                {delDia.length ? (
                  <table className="tabla"><tbody>
                    {delDia.map((t) => (
                      <tr key={t.id} className="clic" onClick={() => setModal({ x: t })}>
                        <td className="mono" style={{ width: 64 }}>{fHora(t.inicio)}</td>
                        <td><strong>{nombreCompleto(pac.get(t.paciente_id))}</strong><div className="small muted">{t.tipo} · {t.modalidad}</div></td>
                        <td style={{ textAlign: 'right' }}><span className="chip">{t.estado}</span></td>
                      </tr>
                    ))}
                  </tbody></table>
                ) : <p className="muted small" style={{ margin: 0 }}>Sin turnos.</p>}
              </div>
            );
          })}
        </div>
      )}
      {modal && <TurnoForm inicial={modal.x} inicio={modal.inicio} onClose={() => setModal(null)} />}
    </>
  );
}
