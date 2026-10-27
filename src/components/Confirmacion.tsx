import { useEffect, useRef, useState } from 'react';
import { registrarHostConfirmacion, type PedidoConfirmacion } from '../lib/confirmar';

type Activo = PedidoConfirmacion & { resolver: (ok: boolean) => void; rechazar: (e: unknown) => void };

/** Se monta una sola vez (en App) y muestra las confirmaciones pedidas con `confirmar()`. */
export function ConfirmacionHost() {
  const [p, setP] = useState<Activo | null>(null);
  const [texto, setTexto] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    registrarHostConfirmacion((nuevo) => { setTexto(''); setOcupado(false); setP(nuevo); });
    return () => registrarHostConfirmacion(null);
  }, []);

  useEffect(() => {
    if (!p) return;
    cancelarRef.current?.focus();
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) { e.stopPropagation(); cerrar(false); }
    };
    window.addEventListener('keydown', k, true);
    return () => window.removeEventListener('keydown', k, true);
  });

  if (!p) return null;
  const habilitado = !p.escribir || texto.trim().toLowerCase() === p.escribir.trim().toLowerCase();

  function cerrar(ok: boolean) {
    p?.resolver(ok);
    setP(null);
  }

  async function aceptar() {
    if (!p || ocupado || !habilitado) return;
    if (!p.ejecutar) return cerrar(true);
    setOcupado(true);
    try {
      await p.ejecutar();
      cerrar(true);
    } catch (e) {
      setP(null);
      p.rechazar(e);
    }
  }

  return (
    <div className="confirma-velo" role="presentation">
      <div className={`confirma ${ocupado ? 'ocupado' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="confirma-t" aria-describedby="confirma-d">
        <h2 id="confirma-t">{p.titulo}</h2>
        <p id="confirma-d">{p.texto}</p>
        {p.escribir && (
          <label className="campo">
            <span>Para confirmar, escribí «{p.escribir}»</span>
            <input id="confirma-escribir" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" disabled={ocupado} />
          </label>
        )}
        <div className="fila confirma-acciones">
          <button ref={cancelarRef} type="button" className="btn sec" onClick={() => cerrar(false)} disabled={ocupado}>Cancelar</button>
          <button type="button" className={`btn ${p.peligro ? 'peligro' : ''}`} onClick={aceptar} disabled={!habilitado || ocupado}>
            {ocupado ? 'Un momento…' : p.accion}
          </button>
        </div>
      </div>
    </div>
  );
}
