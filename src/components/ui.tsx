import { useEffect, useState, type ReactNode } from 'react';
import { categoriaIMC, type Clasificacion } from '../lib/referencias';

export function Panel({ titulo, eyebrow, onClose, children }: { titulo: string; eyebrow?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="panel-cab">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 style={{ marginTop: 6 }}>{titulo}</h2>
          </div>
          <button className="btn fantasma" onClick={onClose} aria-label="Cerrar">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Campo({ label, children, style }: { label: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <label className="campo" style={style}>
      <span>{label}</span>
      {children}
    </label>
  );
}

/** Input numérico que acepta coma decimal y devuelve number | undefined. */
export function NumInput({ value, onChange, unidad, step = 'any', placeholder }: { value?: number | null; onChange: (n: number | undefined) => void; unidad?: string; step?: string; placeholder?: string }) {
  const input = (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')))}
    />
  );
  return unidad ? <div className="unidad">{input}<em>{unidad}</em></div> : input;
}

export function Tabs<T extends string>({ items, activo, onChange }: { items: { id: T; label: string }[]; activo: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={activo === i.id} className={activo === i.id ? 'activo' : ''} onClick={() => onChange(i.id)}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Vacio({ titulo, texto, accion }: { titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <h3>{titulo}</h3>
      {texto && <p style={{ margin: '0 0 14px', maxWidth: 520 }}>{texto}</p>}
      {accion}
    </div>
  );
}

export function Cabecera({ eyebrow, titulo, children }: { eyebrow?: string; titulo: string; children?: ReactNode }) {
  return (
    <div className="cabecera">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{titulo}</h1>
      </div>
      {children && <div className="fila">{children}</div>}
    </div>
  );
}

/** Botón con confirmación en dos pasos dentro de la página (sin diálogos del navegador). */
export function BotonConfirmar({ children, pregunta, onConfirm, className = 'btn fantasma' }: { children: ReactNode; pregunta: string; onConfirm: () => void; className?: string }) {
  const [paso, setPaso] = useState(false);
  if (!paso) return <button type="button" className={className} onClick={() => setPaso(true)}>{children}</button>;
  return (
    <span className="fila" role="group" aria-label={pregunta}>
      <span className="small">{pregunta}</span>
      <button type="button" className="btn chico" style={{ background: 'var(--alerta)', borderColor: 'var(--alerta)' }} onClick={() => { setPaso(false); onConfirm(); }}>Sí</button>
      <button type="button" className="btn sec chico" onClick={() => setPaso(false)}>No</button>
    </span>
  );
}

/** Clasificación por color, solo para la profesional. El texto siempre acompaña al color. */
export function ChipNivel({ c, titulo }: { c?: Clasificacion; titulo?: string }) {
  if (!c) return null;
  const rango = `${c.normal[0].toLocaleString('es-AR')}–${c.normal[1].toLocaleString('es-AR')}`;
  return <span className={`chip nivel-${c.nivel}`} title={`${titulo ?? ''} Normal para su sexo y edad: ${rango}`.trim()}>{c.nivel}</span>;
}

export function ChipIMC({ imc }: { imc?: number }) {
  const c = categoriaIMC(imc);
  if (!c) return null;
  return <span className={`chip imc-${c.tono}`} title={`IMC ${c.rango}`}>{c.categoria}</span>;
}
