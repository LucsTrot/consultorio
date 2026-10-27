/**
 * Ventana de confirmación para acciones que no se pueden deshacer.
 * Uso: `await confirmar({ titulo, texto, accion, ejecutar })`.
 * Si se pasa `ejecutar`, la ventana queda bloqueada mientras corre y se cierra al terminar,
 * así un doble clic no repite la acción.
 */
export interface PedidoConfirmacion {
  titulo: string;
  texto: string;
  accion: string;
  /** Botón en rojo para acciones destructivas. */
  peligro?: boolean;
  /** Si se indica, hay que escribir este texto para habilitar el botón. */
  escribir?: string;
  ejecutar?: () => Promise<unknown>;
}

type Host = (p: (PedidoConfirmacion & { resolver: (ok: boolean) => void; rechazar: (e: unknown) => void }) | null) => void;
let host: Host | null = null;

export function registrarHostConfirmacion(fn: Host | null) {
  host = fn;
}

export function confirmar(p: PedidoConfirmacion): Promise<boolean> {
  return new Promise((resolver, rechazar) => {
    if (!host) return resolver(false);
    host({ ...p, resolver, rechazar });
  });
}
