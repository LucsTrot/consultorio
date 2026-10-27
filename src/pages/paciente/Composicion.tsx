import { useState } from 'react';
import { clasificaciones, imcDe, indices, METRICAS, serie, type Metrica } from '../../lib/calc';
import { fFecha, fNum } from '../../lib/format';
import { categoriaIMC } from '../../lib/referencias';
import type { Medicion, Paciente } from '../../lib/types';
import { Linea } from '../../components/Grafico';
import { ChipIMC, ChipNivel } from '../../components/ui';

const GRUPOS: { nombre: string; metricas: Metrica[] }[] = [
  { nombre: 'Bioimpedancia', metricas: ['masa_muscular_pct', 'grasa_pct', 'peso', 'agua_kg', 'grasa_visceral', 'masa_osea_kg'] },
  { nombre: 'Perímetros', metricas: ['icc', 'cintura_m', 'cadera_m'] },
  { nombre: 'Índices', metricas: ['mlg', 'masa_grasa', 'imlg', 'imc'] },
];

export function Composicion({ p, mediciones, onNueva, onImportar, onEditar }: { p: Paciente; mediciones: Medicion[]; onNueva: () => void; onImportar: () => void; onEditar: (m: Medicion) => void }) {
  const [grupo, setGrupo] = useState(0);
  const orden = [...mediciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultima = orden[0];

  if (!ultima)
    return (
      <div className="tarjeta vacio">
        <h3>Sin mediciones</h3>
        <p>Cargá los valores de la balanza o importá el historial desde su app. Los índices y gráficos se arman solos.</p>
        <div className="fila"><button className="btn" onClick={onNueva}>Nueva medición</button><button className="btn sec" onClick={onImportar}>Importar desde la balanza</button></div>
      </div>
    );

  const ind = indices(ultima, p).filter((i) => i.clave !== 'imc');
  const cls = clasificaciones(ultima, p);
  const imc = imcDe(ultima, p);
  const cat = categoriaIMC(imc);
  const metricas = GRUPOS[grupo].metricas.filter((k) => serie(mediciones, p, k).length);

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="tarjeta">
        <div className="tarjeta-cab">
          <div><h3>Última medición</h3><span className="mono small muted">{fFecha(ultima.fecha)}</span></div>
          <button className="btn fantasma chico" onClick={() => onEditar(ultima)}>Editar</button>
        </div>
        <div className="scroll-x">
          <table className="tabla">
            <thead><tr><th>Dato</th><th className="num">Valor</th><th>Cálculo</th><th>Referencia (uso interno)</th></tr></thead>
            <tbody>
              {ultima.masa_muscular_pct != null && (
                <tr>
                  <td><strong>Masa muscular</strong></td>
                  <td className="num">{fNum(ultima.masa_muscular_pct)} %</td>
                  <td className="small muted">balanza</td>
                  <td>{cls.musculo ? <><ChipNivel c={cls.musculo} titulo="Masa muscular." /> <span className="small muted">normal {fNum(cls.musculo.normal[0])}–{fNum(cls.musculo.normal[1])} %</span></> : <span className="small muted">Falta sexo o edad</span>}</td>
                </tr>
              )}
              {ultima.grasa_pct != null && (
                <tr>
                  <td><strong>Grasa corporal</strong></td>
                  <td className="num">{fNum(ultima.grasa_pct)} %</td>
                  <td className="small muted">balanza</td>
                  <td>{cls.grasa ? <><ChipNivel c={cls.grasa} titulo="Grasa corporal." /> <span className="small muted">normal {fNum(cls.grasa.normal[0])}–{fNum(cls.grasa.normal[1])} %</span></> : <span className="small muted">Falta sexo o edad</span>}</td>
                </tr>
              )}
              {ind.map((i) => (
                <tr key={i.clave}>
                  <td>{i.nombre}</td>
                  <td className="num">{fNum(i.valor, 2)} {i.unidad}</td>
                  <td className="small muted">{i.formula}</td>
                  <td className="small muted">{i.referencia ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!p.sexo || !p.fecha_nacimiento || !(ultima.talla_cm ?? p.talla_cm) ? (
          <p className="small" style={{ color: 'var(--aviso)', marginBottom: 0 }}>Completá sexo, fecha de nacimiento y talla en la ficha para habilitar clasificaciones e índices.</p>
        ) : null}
      </div>

      <div>
        <div className="fila" style={{ marginBottom: 12 }}>
          {GRUPOS.map((g, i) => (
            <button key={g.nombre} className={`btn chico ${i === grupo ? '' : 'sec'}`} onClick={() => setGrupo(i)} aria-pressed={i === grupo}>{g.nombre}</button>
          ))}
        </div>
        <div className="grid g2">
          {metricas.map((k) => (
            <div className="tarjeta" key={k}>
              <div className="tarjeta-cab"><h3>{METRICAS[k].nombre}</h3><span className="mono small muted">{METRICAS[k].unidad}</span></div>
              <Linea datos={serie(mediciones, p, k)} unidad={METRICAS[k].unidad} decimales={METRICAS[k].dec} etiqueta={METRICAS[k].nombre} />
            </div>
          ))}
          {!metricas.length && <p className="muted">No hay datos de este grupo todavía.</p>}
        </div>
      </div>

      <div className="tarjeta">
        <div className="tarjeta-cab"><h3>Todas las mediciones</h3><span className="mono small muted">{orden.length}</span></div>
        <div className="scroll-x">
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th className="num">Músculo %</th><th className="num">Grasa %</th><th className="num">Peso</th><th className="num">Agua kg</th><th className="num">Visceral</th><th className="num">Cint./cad.</th><th className="num">IMC</th><th>Origen</th></tr>
            </thead>
            <tbody>
              {orden.map((m) => {
                const c = clasificaciones(m, p);
                const ix = indices(m, p);
                const v = (k: string) => ix.find((i) => i.clave === k)?.valor;
                return (
                  <tr key={m.id} className="clic" onClick={() => onEditar(m)}>
                    <td>{fFecha(m.fecha)}</td>
                    <td className={`num ${c.musculo ? 'v nivel-' + c.musculo.nivel : ''}`} title={c.musculo?.nivel}>{fNum(m.masa_muscular_pct)}</td>
                    <td className={`num ${c.grasa ? 'v nivel-' + c.grasa.nivel : ''}`} title={c.grasa?.nivel}>{fNum(m.grasa_pct)}</td>
                    <td className="num">{fNum(m.peso)}</td>
                    <td className="num">{fNum(m.agua_kg)}</td>
                    <td className="num">{fNum(m.grasa_visceral, 0)}</td>
                    <td className="num">{fNum(v('icc'), 2, true)}</td>
                    <td className="num">{fNum(v('imc'))}</td>
                    <td><span className="chip">{m.fuente}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginBottom: 0 }}>Músculo y grasa en color según su rango para sexo y edad: <span style={{ color: 'var(--aviso)' }}>bajo</span> · <span style={{ color: 'var(--ok)' }}>normal</span> · <span style={{ color: 'var(--alerta)' }}>alto</span>.</p>
      </div>

      {imc !== undefined && cat && (
        <div className="tarjeta">
          <div className="tarjeta-cab"><h3>Categoría según IMC</h3><span className="mono small muted">{fFecha(ultima.fecha)} · uso interno</span></div>
          <div className="fila" style={{ gap: 16 }}>
            <span className="stat"><span className="v">{fNum(imc)}<small>kg/m²</small></span></span>
            <ChipIMC imc={imc} />
          </div>
          <div className="fila small muted" style={{ marginTop: 12, gap: 16 }}>
            {(['Bajo peso', 'Normal', 'Sobrepeso', 'Obesidad'] as const).map((n, i) => (
              <span key={n} style={{ fontWeight: n === cat.categoria ? 700 : 400, color: n === cat.categoria ? 'var(--tinta)' : undefined }}>
                {n} {['< 18,5', '18,5–24,9', '25–29,9', '≥ 30'][i]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
