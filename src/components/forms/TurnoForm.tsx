import { useState } from 'react';
import { leerAjustes } from '../../lib/ajustes';
import { repo, useRows } from '../../lib/db';
import { nombreCompleto, toLocalISO } from '../../lib/format';
import type { EstadoTurno, Modalidad, TipoConsulta, Turno } from '../../lib/types';
import { BotonConfirmar, Campo, Panel } from '../ui';

export function TurnoForm({ inicial, inicio, pacienteId, onClose }: { inicial?: Turno; inicio?: string; pacienteId?: string; onClose: () => void }) {
  const aj = leerAjustes();
  const { rows: pacientes } = useRows('pacientes');
  const [t, setT] = useState<Partial<Turno>>(
    inicial ?? { paciente_id: pacienteId, inicio: inicio ?? toLocalISO(new Date()), duracion_min: aj.duracion_turno, modalidad: 'Presencial', tipo: 'Seguimiento', estado: 'agendado' },
  );
  const set = <K extends keyof Turno>(k: K, v: Turno[K]) => setT((x) => ({ ...x, [k]: v }));

  const elegirPaciente = (id: string) => {
    const p = pacientes.find((x) => x.id === id);
    setT((x) => ({ ...x, paciente_id: id, modalidad: inicial ? x.modalidad : p?.modalidad ?? x.modalidad }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const g = await repo.save('turnos', t);
    // Un recordatorio por turno, siempre sincronizado con la fecha del turno.
    const previos = await repo.list('recordatorios', { turno_id: g.id });
    const aviso = new Date(new Date(g.inicio).getTime() - aj.aviso_horas_antes * 3600_000);
    const activo = g.estado === 'agendado' || g.estado === 'confirmado';
    if (previos[0]) {
      await repo.save('recordatorios', { id: previos[0].id, fecha: toLocalISO(aviso), hecho: activo ? previos[0].hecho : true });
    } else if (activo && new Date(g.inicio) > new Date()) {
      await repo.save('recordatorios', { paciente_id: g.paciente_id, turno_id: g.id, tipo: 'turno', fecha: toLocalISO(aviso), mensaje: 'Recordar turno', hecho: false });
    }
    onClose();
  };

  const eliminar = async () => {
    if (!inicial) return;
    await repo.archive('turnos', inicial.id);
    for (const r of await repo.list('recordatorios', { turno_id: inicial.id })) await repo.archive('recordatorios', r.id);
    onClose();
  };

  return (
    <Panel titulo={inicial ? 'Turno' : 'Nuevo turno'} eyebrow="Agenda" onClose={onClose}>
      <form className="form" onSubmit={guardar}>
        <Campo label="Persona">
          <select required value={t.paciente_id ?? ''} onChange={(e) => elegirPaciente(e.target.value)}>
            <option value="">Elegir…</option>
            {[...pacientes].sort((a, b) => a.apellido.localeCompare(b.apellido)).map((p) => <option key={p.id} value={p.id}>{nombreCompleto(p)}</option>)}
          </select>
        </Campo>
        <div className="grid g2">
          <Campo label="Día y hora"><input type="datetime-local" required value={t.inicio?.slice(0, 16)} onChange={(e) => set('inicio', e.target.value)} /></Campo>
          <Campo label="Duración">
            <select value={t.duracion_min} onChange={(e) => set('duracion_min', Number(e.target.value))}>
              {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </Campo>
        </div>
        <div className="grid g3">
          <Campo label="Modalidad">
            <select value={t.modalidad} onChange={(e) => set('modalidad', e.target.value as Modalidad)}>
              <option>Presencial</option><option>Online</option>
            </select>
          </Campo>
          <Campo label="Tipo">
            <select value={t.tipo} onChange={(e) => set('tipo', e.target.value as TipoConsulta)}>
              <option>Primera consulta</option><option>Seguimiento</option><option>Control</option>
            </select>
          </Campo>
          <Campo label="Estado">
            <select value={t.estado} onChange={(e) => set('estado', e.target.value as EstadoTurno)}>
              {(['agendado', 'confirmado', 'asistió', 'ausente', 'cancelado'] as EstadoTurno[]).map((s) => <option key={s}>{s}</option>)}
            </select>
          </Campo>
        </div>
        <Campo label="Notas"><textarea rows={2} value={t.notas ?? ''} onChange={(e) => set('notas', e.target.value)} /></Campo>
        <p className="muted small" style={{ margin: 0 }}>Se crea un recordatorio {aj.aviso_horas_antes} h antes del turno.</p>
        <div className="acciones">
          <button className="btn">Guardar turno</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
          {inicial && <><span className="espacio" /><BotonConfirmar pregunta="¿Eliminar el turno?" onConfirm={eliminar}>Eliminar</BotonConfirmar></>}
        </div>
      </form>
    </Panel>
  );
}
