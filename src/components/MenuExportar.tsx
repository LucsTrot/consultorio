import { useEffect, useRef, useState } from 'react';
import type { Consulta, Laboratorio, Medicion, Paciente } from '../lib/types';

type Opcion = { id: string; label: string; detalle: string };
const CLINICO: Opcion[] = [
  { id: 'pdf-clinico', label: 'PDF', detalle: 'Historia clínica completa' },
  { id: 'word-clinico', label: 'Word', detalle: 'Historia clínica editable' },
  { id: 'excel', label: 'Excel', detalle: 'Todos los datos, por hoja' },
];
const PACIENTE: Opcion[] = [
  { id: 'pdf-paciente', label: 'PDF', detalle: 'Evolución, sin índices ni rangos' },
  { id: 'word-paciente', label: 'Word', detalle: 'Evolución editable' },
];

export function MenuExportar(f: { paciente: Paciente; consultas: Consulta[]; mediciones: Medicion[]; labs: Laboratorio[] }) {
  const [abierto, setAbierto] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cerrar = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const exportar = async (id: string) => {
    setAbierto(false);
    setError('');
    setTrabajando(true);
    try {
      // Carga diferida: las librerías de exportación no pesan en la carga inicial.
      const fuente = { paciente: f.paciente, consultas: f.consultas, mediciones: f.mediciones, labs: f.labs };
      if (id === 'excel') (await import('../lib/export/excel')).historiaExcel(fuente);
      else {
        const { armarInforme } = await import('../lib/export/datos');
        const inf = armarInforme(fuente, id.endsWith('paciente') ? 'paciente' : 'clinico');
        if (id.startsWith('pdf')) await (await import('../lib/export/pdf')).informePDF(inf);
        else await (await import('../lib/export/word')).informeWord(inf);
      }
    } catch (e) {
      console.error(e);
      setError('No se pudo generar el archivo. Probá de nuevo.');
    } finally {
      setTrabajando(false);
    }
  };

  const grupo = (titulo: string, ops: Opcion[]) => (
    <div style={{ padding: '6px 0' }}>
      <div className="eyebrow" style={{ padding: '6px 14px' }}>{titulo}</div>
      {ops.map((o) => (
        <button key={o.id} role="menuitem" onClick={() => exportar(o.id)} style={{ display: 'flex', width: '100%', gap: 10, padding: '8px 14px', background: 'none', border: 0, cursor: 'pointer', textAlign: 'left' }} className="item-menu">
          <strong style={{ width: 46 }}>{o.label}</strong><span className="muted small">{o.detalle}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn sec" onClick={() => setAbierto(!abierto)} aria-haspopup="menu" aria-expanded={abierto} disabled={trabajando}>
        {trabajando ? 'Generando…' : 'Exportar'}
      </button>
      {abierto && (
        <div role="menu" className="tarjeta" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 30, padding: 0, width: 300, boxShadow: '0 1px 0 var(--linea)' }}>
          {grupo('Historia clínica', CLINICO)}
          <div style={{ borderTop: '1px solid var(--linea)' }} />
          {grupo('Informe para la persona', PACIENTE)}
        </div>
      )}
      {error && <p className="small" role="alert" style={{ color: 'var(--alerta)', position: 'absolute', right: 0, top: 'calc(100% + 6px)', whiteSpace: 'nowrap', margin: 0 }}>{error}</p>}
      <style>{`.item-menu:hover{background:var(--superficie)}`}</style>
    </div>
  );
}
