import { useState } from 'react';
import { repo } from '../../lib/db';
import { hoyISO } from '../../lib/format';
import { CATALOGO, estado, rangoPara } from '../../lib/labs';
import type { Laboratorio, Paciente, ResultadoLab } from '../../lib/types';
import { Campo, NumInput, Panel } from '../ui';

const GRUPOS = [...new Set(CATALOGO.map((a) => a.grupo))];

export function LaboratorioForm({ paciente, inicial, onClose }: { paciente: Paciente; inicial?: Laboratorio; onClose: () => void }) {
  const [l, setL] = useState<Partial<Laboratorio>>(inicial ?? { paciente_id: paciente.id, fecha: hoyISO(), resultados: [] });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [otro, setOtro] = useState('');
  const [guardando, setGuardando] = useState(false);
  const res = l.resultados ?? [];

  const agregar = (nombres: string[]) => {
    const ya = new Set(res.map((r) => r.analito));
    const nuevos: ResultadoLab[] = nombres.filter((n) => !ya.has(n)).map((n) => {
      const r = rangoPara(n, paciente.sexo);
      return { analito: n, valor: null, unidad: r.unidad, ref_min: r.min ?? null, ref_max: r.max ?? null };
    });
    setL({ ...l, resultados: [...res, ...nuevos] });
  };
  const upd = (i: number, cambio: Partial<ResultadoLab>) => setL({ ...l, resultados: res.map((r, j) => (j === i ? { ...r, ...cambio } : r)) });
  const quitar = (i: number) => setL({ ...l, resultados: res.filter((_, j) => j !== i) });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    let extra: Partial<Laboratorio> = {};
    if (archivo) {
      const path = `${paciente.id}/${l.fecha}-${archivo.name.replace(/[^\w.-]/g, '_')}`;
      extra = { archivo_path: await repo.uploadFile(path, archivo), archivo_nombre: archivo.name };
    }
    await repo.save('laboratorios', { ...l, ...extra, resultados: res.filter((r) => r.valor != null) });
    setGuardando(false);
    onClose();
  };

  return (
    <Panel titulo={inicial ? 'Editar laboratorio' : 'Cargar laboratorio'} eyebrow="Laboratorios" onClose={onClose}>
      <form className="form" onSubmit={guardar}>
        <div className="grid g2">
          <Campo label="Fecha de extracción"><input type="date" required value={l.fecha} onChange={(e) => setL({ ...l, fecha: e.target.value })} /></Campo>
          <Campo label="Laboratorio"><input value={l.laboratorio ?? ''} onChange={(e) => setL({ ...l, laboratorio: e.target.value })} /></Campo>
        </div>
        <Campo label={l.archivo_nombre ? `Informe adjunto: ${l.archivo_nombre} (reemplazar)` : 'Informe original (PDF o foto)'}>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
        </Campo>

        <fieldset>
          <legend>Resultados</legend>
          <div className="fila">
            <span className="small muted">Agregar panel:</span>
            {GRUPOS.map((g) => (
              <button type="button" key={g} className="btn sec chico" onClick={() => agregar(CATALOGO.filter((a) => a.grupo === g).map((a) => a.nombre))}>{g}</button>
            ))}
          </div>
          <div className="fila">
            <select style={{ flex: 1, minWidth: 180 }} value="" onChange={(e) => e.target.value && agregar([e.target.value])}>
              <option value="">Agregar un analito…</option>
              {GRUPOS.map((g) => (
                <optgroup key={g} label={g}>
                  {CATALOGO.filter((a) => a.grupo === g).map((a) => <option key={a.nombre}>{a.nombre}</option>)}
                </optgroup>
              ))}
            </select>
            <input style={{ flex: 1, minWidth: 160 }} placeholder="Otro analito" value={otro} onChange={(e) => setOtro(e.target.value)} />
            <button type="button" className="btn sec" disabled={!otro.trim()} onClick={() => { agregar([otro.trim()]); setOtro(''); }}>Agregar</button>
          </div>

          {res.length > 0 && (
            <div className="scroll-x">
              <table className="tabla">
                <thead><tr><th>Analito</th><th>Valor</th><th>Unidad</th><th>Ref. mín</th><th>Ref. máx</th><th /></tr></thead>
                <tbody>
                  {res.map((r, i) => {
                    const e = estado(r);
                    return (
                      <tr key={r.analito}>
                        <td style={{ minWidth: 150 }}>{r.analito}{e && e !== 'en rango' && <> <span className={`chip ${e}`}>{e}</span></>}</td>
                        <td style={{ minWidth: 90 }}><NumInput value={r.valor} onChange={(v) => upd(i, { valor: v ?? null })} /></td>
                        <td style={{ minWidth: 80 }}><input value={r.unidad ?? ''} onChange={(ev) => upd(i, { unidad: ev.target.value })} /></td>
                        <td style={{ minWidth: 80 }}><NumInput value={r.ref_min} onChange={(v) => upd(i, { ref_min: v ?? null })} /></td>
                        <td style={{ minWidth: 80 }}><NumInput value={r.ref_max} onChange={(v) => upd(i, { ref_max: v ?? null })} /></td>
                        <td><button type="button" className="btn fantasma chico" onClick={() => quitar(i)} aria-label={`Quitar ${r.analito}`}>Quitar</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="muted small">Los rangos vienen precargados como orientación. Si el informe trae otros, pisalos: valen los del laboratorio.</p>
            </div>
          )}
        </fieldset>
        <Campo label="Notas"><textarea rows={2} value={l.notas ?? ''} onChange={(e) => setL({ ...l, notas: e.target.value })} /></Campo>
        <div className="acciones">
          <button className="btn" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="btn sec" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </Panel>
  );
}
