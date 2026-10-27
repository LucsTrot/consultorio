import type { Tabla, TablaTipo } from '../types';

/**
 * Interfaz única de datos. La app nunca habla con IndexedDB ni con la planilla directo:
 * cambiar de modo local a Google Sheets es cambiar el adaptador, nada más.
 */
export interface Repo {
  modo: 'local' | 'sheets';
  list<K extends Tabla>(tabla: K, where?: Partial<TablaTipo[K]>): Promise<TablaTipo[K][]>;
  get<K extends Tabla>(tabla: K, id: string): Promise<TablaTipo[K] | undefined>;
  save<K extends Tabla>(tabla: K, row: Partial<TablaTipo[K]>): Promise<TablaTipo[K]>;
  /** Baja lógica (eliminado_en). */
  archive(tabla: Tabla, id: string): Promise<void>;
  uploadFile(path: string, file: Blob): Promise<string>;
  fileUrl(path: string): Promise<string>;
}

export const nuevoId = () =>
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Bus de cambios: los hooks se re-suscriben por tabla y vuelven a leer.
type Listener = () => void;
const listeners = new Map<Tabla, Set<Listener>>();
export function onChange(tabla: Tabla, fn: Listener) {
  if (!listeners.has(tabla)) listeners.set(tabla, new Set());
  listeners.get(tabla)!.add(fn);
  return () => {
    listeners.get(tabla)!.delete(fn);
  };
}
export function emit(tabla: Tabla) {
  listeners.get(tabla)?.forEach((fn) => fn());
}
