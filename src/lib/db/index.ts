import { useCallback, useEffect, useState } from 'react';
import type { Tabla, TablaTipo } from '../types';
import { localRepo } from './local';
import { onChange, type Repo } from './repo';
import { SHEETS_URL, sheetsRepo } from './sheets';

/** Con VITE_SHEETS_URL definida (la URL de la app web de Apps Script) usa Google Sheets. Si no, modo local. */
export const repo: Repo = SHEETS_URL ? sheetsRepo : localRepo;

export function useRows<K extends Tabla>(tabla: K, where?: Partial<TablaTipo[K]>) {
  const [rows, setRows] = useState<TablaTipo[K][]>([]);
  const [cargando, setCargando] = useState(true);
  const clave = JSON.stringify(where ?? {});
  const leer = useCallback(() => {
    repo
      .list(tabla, where)
      .then((r) => setRows([...r]))
      .catch(() => { /* sin sesión o sin conexión: lo avisa el login o el aviso global */ })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla, clave]);
  useEffect(() => {
    leer();
    return onChange(tabla, leer);
  }, [tabla, leer]);
  return { rows, cargando };
}

export function useRow<K extends Tabla>(tabla: K, id?: string) {
  const [row, setRow] = useState<TablaTipo[K] | undefined>();
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    if (!id) return;
    const leer = () =>
      repo
        .get(tabla, id)
        .then((r) => setRow(r ? { ...r } : r))
        .catch(() => { /* idem */ })
        .finally(() => setCargando(false));
    leer();
    return onChange(tabla, leer);
  }, [tabla, id]);
  return { row, cargando };
}
