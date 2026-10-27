import { useState } from 'react';
import { repo } from '../../lib/db';
import { fFecha, fNum } from '../../lib/format';
import { autoMapear, CAMPOS_BALANZA, filasAMediciones, leerArchivoTabla, type CampoBalanza, type Mapeo } from '../../lib/scaleImport';
import type { Medicion, Paciente } from '../../lib/types';
import { Campo, Panel, useGuardar } from '../ui';

export function ImportarBalanza({ paciente, existentes, onClose }: { paciente: Paciente; existentes: Medicion[]; onClose: () => void }) {
  const [filas, setFilas] = useState<string[][]>([]);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState<number | null>(null);

  const leer = async (f?: File) => {
    if (!f) return;
    setError('');
    try {
      const t = await leerArchivoTabla(f);
      if (t.length < 2) throw new Error();
      setFilas(t);
      setMapeo(autoMapear(t[0]));
    } catch {
      setError('No pudimos leer el archivo. Probá exportarlo como CSV o Excel desde la app de la balanza.');
    }
  };

  const cab = filas[0] ?? [];
  const nuevas = filas.length ? filasAMediciones(filas.slice(1), mapeo, paciente.id, cab) : [];
  const fechasYa = new Set(existentes.map((m) => m.fecha));
  const aImportar = nuevas.filter((n) => !fechasYa.has(n.fecha!));

  const { ocupado, correr } = useGuardar();
  const importar = () => correr(async () => {
    for (const m of aImportar) await repo.save('mediciones', m);
    setHecho(aImportar.length);
  });

  return (
    <Panel titulo="Importar desde la balanza" eyebrow="Composición corporal" onClose={onClose} ocupado={ocupado}>
      {hecho !== null ? (
        <div className="form">
          <p>Se importaron {hecho} mediciones.</p>
          <div><button className="btn" onClick={onClose}>Listo</button></div>
        </div>
      ) : (
        <div className="form">
          <p className="muted" style={{ margin: 0 }}>
            Exportá el historial de esta persona desde la app de la balanza (CSV o Excel) y subilo acá.
            Las columnas se reconocen solas; si alguna no, asignala abajo. Las fechas que ya están cargadas se saltean.
          </p>
          <Campo label="Archivo"><input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={(e) => leer(e.target.files?.[0])} /></Campo>
          {error && <p style={{ color: 'var(--alerta)', margin: 0 }}>{error}</p>}

          {cab.length > 0 && (
            <>
              <fieldset>
                <legend>Columnas</legend>
                <div className="grid g2">
                  {(Object.keys(CAMPOS_BALANZA) as CampoBalanza[]).map((c) => (
                    <Campo key={c} label={CAMPOS_BALANZA[c].nombre}>
                      <select value={mapeo[c] ?? ''} onChange={(e) => setMapeo({ ...mapeo, [c]: e.target.value === '' ? undefined : Number(e.target.value) })}>
                        <option value="">— no importar —</option>
                        {cab.map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                      </select>
                    </Campo>
                  ))}
                </div>
              </fieldset>

              <div className="tarjeta scroll-x" style={{ padding: 12 }}>
                <span className="eyebrow">Vista previa · {aImportar.length} nuevas de {nuevas.length}</span>
                <table className="tabla" style={{ marginTop: 8 }}>
                  <thead><tr><th>Fecha</th><th className="num">Peso</th><th className="num">Grasa</th><th className="num">Músculo %</th><th className="num">Agua kg</th></tr></thead>
                  <tbody>
                    {nuevas.slice(0, 8).map((n, i) => (
                      <tr key={i} style={{ opacity: fechasYa.has(n.fecha!) ? 0.45 : 1 }}>
                        <td>{fFecha(n.fecha)}{fechasYa.has(n.fecha!) && ' · ya cargada'}</td>
                        <td className="num">{fNum(n.peso)}</td><td className="num">{fNum(n.grasa_pct)}</td>
                        <td className="num">{fNum(n.masa_muscular_pct)}</td><td className="num">{fNum(n.agua_kg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="acciones">
                <button className="btn" disabled={!aImportar.length} onClick={importar}>Importar {aImportar.length}</button>
                <button className="btn sec" onClick={onClose}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
