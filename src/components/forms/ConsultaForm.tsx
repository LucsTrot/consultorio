import { useState } from 'react';
import { repo } from '../../lib/db';
import { hoyISO, toLocalISO } from '../../lib/format';
import type { Consulta, TipoConsulta } from '../../lib/types';
import { Campo, Panel } from '../ui';

export function ConsultaForm({ pacienteId, inicial, onClose }: { pacienteId: string; inicial?: Consulta; onClose: () => void }) {
  const [c, setC] = useState<Partial<Consulta>>(inicial ?? { paciente_id: pacienteId, fecha: hoyISO(), tipo: 'Seguimiento' });
  const [recordar, setRecordar] = useState(!inicial);
  const set = <K extends keyof Consulta>(k: K, v: Consulta[K]) => setC((x) => ({ ...x, [k]: v }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    await repo.save('consultas', c);
    if (recordar && c.proximo_control) {
      const d = new Date(c.proximo_control + 'T09:00');
      d.setDate(d.getDate() - 7);
      await repo.save('recordatorios', { paciente_id: pacienteId, tipo: 'control', fecha: toLocalISO(d), mensaje: 'Coordinar próximo control', hecho: false });
    }
    onClose();
  };

  return (
    <Panel titulo={inicial ? 'Editar consulta' : 'Nueva consulta'} eyebrow="Evolución" onClose={onClose}>
      <form className="form" onSubmit={guardar}>
        <div className="grid g2">
          <Campo label="Fecha"><input type="date" required value={c.fecha} onChange={(e) => set('fecha', e.target.value)} /></Campo>
          <Campo label="Tipo">
            <select value={c.tipo} onChange={(e) => set('tipo', e.target.value as TipoConsulta)}>
              <option>Primera consulta</option>
              <option>Seguimiento</option>
              <option>Control</option>
            </select>
          </Campo>
        </div>
        <Campo label="Lo que cuenta la persona"><textarea rows={4} value={c.relato ?? ''} onChange={(e) => set('relato', e.target.value)} /></Campo>
        <Campo label="Observaciones de la profesional"><textarea rows={4} value={c.observaciones ?? ''} onChange={(e) => set('observaciones', e.target.value)} /></Campo>
        <Campo label="Acuerdos e indicaciones"><textarea rows={4} value={c.indicaciones ?? ''} onChange={(e) => set('indicaciones', e.target.value)} /></Campo>
        <div className="grid g2">
          <Campo label="Próximo control"><input type="date" value={c.proximo_control ?? ''} onChange={(e) => set('proximo_control', e.target.value)} /></Campo>
          {!inicial && (
            <label className="fila small" style={{ alignSelf: 'end', paddingBottom: 10 }}>
              <input type="checkbox" style={{ width: 'auto' }} checked={recordar} onChange={(e) => setRecordar(e.target.checked)} />
              Recordarme una semana antes
            </label>
          )}
        </div>
        <div className="acciones">
          <button className="btn">Guardar</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Panel>
  );
}
