import { useMemo, useState } from 'react';
import { clasificaciones, imcDe, indices } from '../../lib/calc';
import { repo } from '../../lib/db';
import { fNum, hoyISO } from '../../lib/format';
import { categoriaIMC } from '../../lib/referencias';
import type { Medicion, Paciente } from '../../lib/types';
import { borrar } from '../../lib/borrar';
import { BotonBorrar, Campo, ChipIMC, ChipNivel, NumInput, Panel, useGuardar } from '../ui';

type NumKey =
  | 'peso' | 'grasa_pct' | 'masa_muscular_pct' | 'agua_kg' | 'grasa_visceral' | 'masa_osea_kg' | 'proteina_pct'
  | 'tmb_kcal' | 'edad_metabolica' | 'talla_cm' | 'cintura_m' | 'cadera_m';

const BALANZA: [NumKey, string, string][] = [
  ['peso', 'Peso', 'kg'],
  ['grasa_pct', 'Grasa corporal', '%'],
  ['masa_muscular_pct', 'Masa muscular', '%'],
  ['agua_kg', 'Agua', 'kg'],
  ['grasa_visceral', 'Grasa visceral', 'nivel'],
  ['masa_osea_kg', 'Masa ósea', 'kg'],
  ['proteina_pct', 'Proteína', '%'],
  ['tmb_kcal', 'Metabolismo basal', 'kcal'],
  ['edad_metabolica', 'Edad metabólica', 'años'],
];
const PERIMETROS: [NumKey, string, string][] = [
  ['talla_cm', 'Talla', 'cm'],
  ['cintura_m', 'Cintura', 'm'],
  ['cadera_m', 'Cadera', 'm'],
];

export function MedicionForm({ paciente, inicial, onClose }: { paciente: Paciente; inicial?: Medicion; onClose: () => void }) {
  const [m, setM] = useState<Partial<Medicion>>(
    inicial ?? { paciente_id: paciente.id, fecha: hoyISO(), fuente: 'balanza', talla_cm: paciente.talla_cm },
  );
  const { ocupado, correr } = useGuardar();
  const set = (k: NumKey, v: number | undefined) => setM((x) => ({ ...x, [k]: v }));
  const actual = { ...m, fecha: m.fecha ?? hoyISO() } as Medicion;
  const vista = useMemo(() => indices(actual, paciente).filter((i) => i.clave !== 'imc'), [m, paciente]); // eslint-disable-line react-hooks/exhaustive-deps
  const cls = clasificaciones(actual, paciente);
  const imc = imcDe(actual, paciente);
  // Cintura y cadera van en metros: si alguien escribe 74 en vez de 0,74, se avisa.
  const enCm = [m.cintura_m, m.cadera_m].some((v) => v != null && v > 3);

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    correr(async () => {
      await repo.save('mediciones', m);
      if (m.talla_cm && m.talla_cm !== paciente.talla_cm) await repo.save('pacientes', { id: paciente.id, talla_cm: m.talla_cm });
      onClose();
    });
  };

  return (
    <Panel titulo={inicial ? 'Editar medición' : 'Nueva medición'} eyebrow="Composición corporal" onClose={onClose} ocupado={ocupado}>
      <form className="form" onSubmit={guardar}>
        <div className="grid g2">
          <Campo label="Fecha"><input type="date" required value={m.fecha} onChange={(e) => setM({ ...m, fecha: e.target.value })} /></Campo>
          <Campo label="Origen">
            <select value={m.fuente} onChange={(e) => setM({ ...m, fuente: e.target.value as Medicion['fuente'] })}>
              <option value="balanza">Balanza del consultorio</option>
              <option value="manual">Otra medición / dato de la persona</option>
              <option value="importado">Importado</option>
            </select>
          </Campo>
        </div>

        <fieldset>
          <legend>Bioimpedancia</legend>
          <p className="muted small" style={{ margin: '-6px 0 2px' }}>En el mismo orden en que los muestra la balanza. Dejá vacío lo que no midas.</p>
          <div className="grid g3">
            {BALANZA.map(([k, l, u]) => (
              <Campo key={k} label={l}><NumInput unidad={u} value={m[k] as number | undefined} onChange={(v) => set(k, v)} /></Campo>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Perímetros</legend>
          <div className="grid g3">
            {PERIMETROS.map(([k, l, u]) => (
              <Campo key={k} label={l}><NumInput unidad={u} step={u === 'm' ? '0.01' : 'any'} placeholder={u === 'm' ? '0,00' : undefined} value={m[k] as number | undefined} onChange={(v) => set(k, v)} /></Campo>
            ))}
          </div>
          {enCm && <p className="small" style={{ color: 'var(--aviso)', margin: 0 }}>Cintura y cadera van en metros: por ejemplo 0,82 en lugar de 82.</p>}
        </fieldset>

        <Campo label="Notas"><textarea rows={2} value={m.notas ?? ''} onChange={(e) => setM({ ...m, notas: e.target.value })} placeholder="Condiciones de la medición: hora, ayuno, ciclo, entrenamiento previo…" /></Campo>

        {(cls.musculo || cls.grasa || vista.length > 0 || imc) && (
          <div className="bloque">
            <span className="eyebrow">Se calcula al guardar · solo para vos</span>
            <table className="tabla" style={{ marginTop: 8 }}>
              <tbody>
                {cls.musculo && <tr><td>Masa muscular</td><td className="num">{fNum(m.masa_muscular_pct)} %</td><td><ChipNivel c={cls.musculo} titulo="Masa muscular." /></td></tr>}
                {cls.grasa && <tr><td>Grasa corporal</td><td className="num">{fNum(m.grasa_pct)} %</td><td><ChipNivel c={cls.grasa} titulo="Grasa corporal." /></td></tr>}
                {vista.map((i) => (
                  <tr key={i.clave}><td>{i.nombre}</td><td className="num">{fNum(i.valor, 2)} {i.unidad}</td><td /></tr>
                ))}
                {imc !== undefined && (
                  <tr><td><strong>IMC</strong></td><td className="num"><strong>{fNum(imc)}</strong> kg/m²</td><td><ChipIMC imc={imc} /></td></tr>
                )}
              </tbody>
            </table>
            {imc !== undefined && <p className="small muted" style={{ margin: '8px 0 0' }}>Categoría OMS: {categoriaIMC(imc)?.categoria} ({categoriaIMC(imc)?.rango}).</p>}
            {(!paciente.sexo || !paciente.fecha_nacimiento) && <p className="small" style={{ color: 'var(--aviso)', margin: '8px 0 0' }}>Para clasificar masa muscular y grasa, completá sexo y fecha de nacimiento en la ficha.</p>}
          </div>
        )}

        <div className="acciones">
          <button className="btn">Guardar medición</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
          {inicial && <><span className="espacio" /><BotonBorrar onClick={async () => { if (await borrar.medicion(inicial)) onClose(); }} /></>}
        </div>
      </form>
    </Panel>
  );
}
