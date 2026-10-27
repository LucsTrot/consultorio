import { useState } from 'react';
import { AJUSTES_DEFAULT, useAjustes, type Ajustes as T } from '../lib/ajustes';
import { repo } from '../lib/db';
import { confirmar } from '../lib/confirmar';
import { salir } from '../lib/db/sheets';
import { cargarDemo } from '../lib/demo';
import { Cabecera, Campo } from '../components/ui';

const DATOS: [keyof T, string][] = [
  ['profesional', 'Nombre profesional'], ['matricula', 'Matrícula'], ['sitio', 'Sitio'], ['mail', 'Mail'],
  ['whatsapp', 'WhatsApp'], ['instagram', 'Instagram'], ['consultorio', 'Consultorio'],
];

export default function Ajustes() {
  const [a, setA] = useAjustes();
  const [ok, setOk] = useState('');
  const set = (k: keyof T, v: string | number) => setA({ ...a, [k]: v });

  return (
    <>
      <Cabecera eyebrow="Configuración" titulo="Ajustes" />
      <div className="grid g2">
        <div className="tarjeta form">
          <h3>Datos de la marca</h3>
          <p className="small muted" style={{ margin: 0 }}>Se usan en los encabezados y pies de las exportaciones. La dirección solo aparece en el recordatorio de turno presencial.</p>
          {DATOS.map(([k, l]) => <Campo key={k} label={l}><input value={String(a[k])} onChange={(e) => set(k, e.target.value)} /></Campo>)}
        </div>
        <div>
          <div className="tarjeta form">
            <h3>Turnos y recordatorios</h3>
            <div className="grid g2">
              <Campo label="Duración por defecto">
                <select value={a.duracion_turno} onChange={(e) => set('duracion_turno', Number(e.target.value))}>
                  {[30, 45, 60].map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </Campo>
              <Campo label="Avisar antes del turno">
                <select value={a.aviso_horas_antes} onChange={(e) => set('aviso_horas_antes', Number(e.target.value))}>
                  {[2, 12, 24, 48].map((h) => <option key={h} value={h}>{h} h</option>)}
                </select>
              </Campo>
            </div>
            <Campo label="Mensaje de WhatsApp para turnos"><textarea rows={4} value={a.plantilla_turno} onChange={(e) => set('plantilla_turno', e.target.value)} /></Campo>
            <Campo label="Mensaje de WhatsApp para controles"><textarea rows={4} value={a.plantilla_control} onChange={(e) => set('plantilla_control', e.target.value)} /></Campo>
            <p className="small muted" style={{ margin: 0 }}>Variables: {'{nombre}'} {'{dia}'} {'{hora}'} {'{modalidad}'}</p>
            <div><button className="btn sec chico" onClick={() => setA(AJUSTES_DEFAULT)}>Restaurar valores del manual</button></div>
          </div>
          <div className="tarjeta form">
            <h3>Datos</h3>
            {repo.modo === 'local' ? (
              <>
                <p className="small" style={{ margin: 0 }}>Modo local: todo vive en este navegador. Sirve para probar; para pacientes reales conectá la planilla (ver README).</p>
                <div><button className="btn sec" onClick={async () => { if (await confirmar({ titulo: '¿Reiniciar con datos de ejemplo?', texto: 'Se reemplaza todo lo cargado en este navegador por las personas de ejemplo.', accion: 'Reiniciar', peligro: true, ejecutar: cargarDemo })) setOk('Datos de ejemplo cargados.'); }}>Reiniciar con datos de ejemplo</button></div>
              </>
            ) : (
              <>
                <p className="small" style={{ margin: 0 }}>Los datos viven en la planilla de Google del consultorio. Desde el menú Consultorio de la planilla se cambia la contraseña o se cierran todas las sesiones.</p>
                <div><button className="btn sec" onClick={() => salir()}>Cerrar sesión en este dispositivo</button></div>
              </>
            )}
            {ok && <p className="small" style={{ color: 'var(--ok)', margin: 0 }}>{ok}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
