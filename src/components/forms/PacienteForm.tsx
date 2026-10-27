import { useState } from 'react';
import { repo } from '../../lib/db';
import type { Antecedentes, Paciente } from '../../lib/types';
import { Campo, NumInput, Panel } from '../ui';

const ANTECEDENTES: [keyof Antecedentes, string][] = [
  ['personales', 'Antecedentes personales'],
  ['familiares', 'Antecedentes familiares'],
  ['medicacion', 'Medicación y suplementos'],
  ['alergias', 'Alergias e intolerancias'],
  ['cirugias', 'Cirugías'],
  ['historia_dietas', 'Dietas anteriores y cómo terminaron'],
  ['alimentacion', 'Anamnesis alimentaria'],
  ['actividad_fisica', 'Actividad física'],
  ['sueno', 'Sueño y descanso'],
  ['habitos', 'Hidratación, tabaco, alcohol'],
];

export function PacienteForm({ inicial, onClose, onGuardado }: { inicial?: Paciente; onClose: () => void; onGuardado?: (p: Paciente) => void }) {
  const [p, setP] = useState<Partial<Paciente>>(inicial ?? { modalidad: 'Presencial', antecedentes: {} });
  const [guardando, setGuardando] = useState(false);
  const set = <K extends keyof Paciente>(k: K, v: Paciente[K]) => setP((x) => ({ ...x, [k]: v }));
  const setA = (k: keyof Antecedentes, v: string) => setP((x) => ({ ...x, antecedentes: { ...x.antecedentes, [k]: v } }));

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const g = await repo.save('pacientes', p);
    setGuardando(false);
    onGuardado?.(g);
    onClose();
  };

  return (
    <Panel titulo={inicial ? 'Editar ficha' : 'Nueva persona'} eyebrow="Historia clínica" onClose={onClose}>
      <form className="form" onSubmit={guardar}>
        <fieldset>
          <legend>Datos personales</legend>
          <div className="grid g2">
            <Campo label="Nombre"><input required value={p.nombre ?? ''} onChange={(e) => set('nombre', e.target.value)} /></Campo>
            <Campo label="Apellido"><input required value={p.apellido ?? ''} onChange={(e) => set('apellido', e.target.value)} /></Campo>
          </div>
          <div className="grid g3">
            <Campo label="Fecha de nacimiento"><input type="date" value={p.fecha_nacimiento ?? ''} onChange={(e) => set('fecha_nacimiento', e.target.value)} /></Campo>
            <Campo label="Sexo (para fórmulas)">
              <select value={p.sexo ?? ''} onChange={(e) => set('sexo', (e.target.value || undefined) as Paciente['sexo'])}>
                <option value="">Sin dato</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </Campo>
            <Campo label="Talla"><NumInput unidad="cm" value={p.talla_cm} onChange={(v) => set('talla_cm', v)} /></Campo>
          </div>
          <div className="grid g3">
            <Campo label="DNI"><input value={p.dni ?? ''} onChange={(e) => set('dni', e.target.value)} /></Campo>
            <Campo label="Teléfono"><input inputMode="tel" value={p.telefono ?? ''} onChange={(e) => set('telefono', e.target.value)} placeholder="11 5555-5555" /></Campo>
            <Campo label="Mail"><input type="email" value={p.email ?? ''} onChange={(e) => set('email', e.target.value)} /></Campo>
          </div>
          <div className="grid g3">
            <Campo label="Ocupación"><input value={p.ocupacion ?? ''} onChange={(e) => set('ocupacion', e.target.value)} /></Campo>
            <Campo label="Cobertura"><input value={p.cobertura ?? ''} onChange={(e) => set('cobertura', e.target.value)} /></Campo>
            <Campo label="Modalidad">
              <select value={p.modalidad} onChange={(e) => set('modalidad', e.target.value as Paciente['modalidad'])}>
                <option>Presencial</option>
                <option>Online</option>
              </select>
            </Campo>
          </div>
        </fieldset>

        <fieldset>
          <legend>Motivo y objetivos</legend>
          <Campo label="Motivo de consulta"><textarea value={p.motivo_consulta ?? ''} onChange={(e) => set('motivo_consulta', e.target.value)} /></Campo>
          <Campo label="Objetivos (uno por línea, en palabras de la persona)"><textarea value={p.objetivos ?? ''} onChange={(e) => set('objetivos', e.target.value)} /></Campo>
        </fieldset>

        <fieldset>
          <legend>Antecedentes</legend>
          {ANTECEDENTES.map(([k, label]) => (
            <Campo key={k} label={label}><textarea rows={2} value={p.antecedentes?.[k] ?? ''} onChange={(e) => setA(k, e.target.value)} /></Campo>
          ))}
          <Campo label="Notas internas"><textarea rows={2} value={p.notas ?? ''} onChange={(e) => set('notas', e.target.value)} /></Campo>
        </fieldset>

        <div className="acciones">
          <button className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Panel>
  );
}

export { ANTECEDENTES };
