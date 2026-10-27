import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { categoriaIMC, type Clasificacion } from '../lib/referencias';
import { Icono } from './Icono';

/**
 * Panel lateral de carga. Con `ocupado`, queda bloqueado (cursor de espera, sin clics,
 * sin Escape ni cerrar) hasta que termina el guardado y se cierra.
 */
export function Panel({ titulo, eyebrow, onClose, ocupado = false, children }: { titulo: string; eyebrow?: string; onClose: () => void; ocupado?: boolean; children: ReactNode }) {
  const ocupadoRef = useRef(ocupado);
  ocupadoRef.current = ocupado;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && !ocupadoRef.current && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="velo" onMouseDown={(e) => e.target === e.currentTarget && !ocupado && onClose()}>
      <div className={`panel ${ocupado ? 'ocupado' : ''}`} role="dialog" aria-modal="true" aria-label={titulo} aria-busy={ocupado}>
        <div className="panel-cab">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h2 style={{ marginTop: 6 }}>{titulo}</h2>
          </div>
          <button className="btn fantasma" onClick={onClose} aria-label="Cerrar" disabled={ocupado}>Cerrar</button>
        </div>
        <fieldset className="panel-cuerpo" disabled={ocupado}>{children}</fieldset>
        {ocupado && <div className="panel-bloqueo" aria-live="polite"><span>Guardando…</span></div>}
      </div>
    </div>
  );
}

/**
 * Evita guardados duplicados: el primer clic bloquea; los siguientes se ignoran hasta que termina.
 * Si falla, se libera para reintentar y el error sube al aviso global.
 */
export function useGuardar() {
  const [ocupado, setOcupado] = useState(false);
  const enCurso = useRef(false);
  const correr = useCallback(async (fn: () => Promise<unknown>) => {
    if (enCurso.current) return;
    enCurso.current = true;
    setOcupado(true);
    try {
      await fn();
    } finally {
      enCurso.current = false;
      setOcupado(false);
    }
  }, []);
  return { ocupado, correr };
}

export function BotonBorrar({ onClick, children = 'Borrar', chico = false }: { onClick: () => void; children?: ReactNode; chico?: boolean }) {
  return (
    <button type="button" className={`btn borrar ${chico ? 'chico' : ''}`} onClick={onClick}>
      <Icono nombre="borrar" tamano={chico ? 16 : 18} />{children}
    </button>
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
