import { useState } from 'react';
import { repo, useRows } from '../../lib/db';
import { nombreCompleto, toLocalISO } from '../../lib/format';
import type { Recordatorio, TipoRecordatorio } from '../../lib/types';
import { borrar } from '../../lib/borrar';
import { BotonBorrar, Campo, Panel, useGuardar } from '../ui';

export function RecordatorioForm({ inicial, pacienteId, onClose }: { inicial?: Recordatorio; pacienteId?: string; onClose: () => void }) {
  const { rows: pacientes } = useRows('pacientes');
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  manana.setHours(9, 0, 0, 0);
  const [r, setR] = useState<Partial<Recordatorio>>(inicial ?? { paciente_id: pacienteId ?? null, tipo: 'tarea', fecha: toLocalISO(manana), mensaje: '', hecho: false });

  const { ocupado, correr } = useGuardar();
  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    correr(async () => {
      await repo.save('recordatorios', r);
      onClose();
    });
  };

  return (
    <Panel titulo={inicial ? 'Editar recordatorio' : 'Nuevo recordatorio'} eyebrow="Recordatorios" onClose={onClose} ocupado={ocupado}>
      <form className="form" onSubmit={guardar}>
        <Campo label="Qué hay que recordar"><input required value={r.mensaje} onChange={(e) => setR({ ...r, mensaje: e.target.value })} /></Campo>
        <div className="grid g2">
          <Campo label="Cuándo"><input type="datetime-local" required value={r.fecha?.slice(0, 16)} onChange={(e) => setR({ ...r, fecha: e.target.value })} /></Campo>
          <Campo label="Tipo">
            <select value={r.tipo} onChange={(e) => setR({ ...r, tipo: e.target.value as TipoRecordatorio })}>
              <option value="tarea">Tarea</option><option value="control">Control</option>
              <option value="laboratorio">Laboratorio</option><option value="turno">Turno</option>
            </select>
          </Campo>
        </div>
        <Campo label="Persona (opcional)">
          <select value={r.paciente_id ?? ''} onChange={(e) => setR({ ...r, paciente_id: e.target.value || null })}>
            <option value="">Ninguna</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{nombreCompleto(p)}</option>)}
          </select>
        </Campo>
        <div className="acciones">
          <button className="btn">Guardar</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
          {inicial && <><span className="espacio" /><BotonBorrar onClick={async () => { if (await borrar.recordatorio(inicial)) onClose(); }} /></>}
        </div>
      </form>
    </Panel>
  );
}
