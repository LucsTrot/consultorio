import type { Tabla, TablaTipo } from '../types';
import { emit, nuevoId, type Repo } from './repo';

/**
 * Adaptador para Google Sheets vía Apps Script (apps-script/Code.gs).
 * Lee todo con un solo `init`, trabaja sobre una caché en memoria y guarda por POST.
 * Los datos clínicos no se guardan en el dispositivo: solo el token de sesión.
 */
export const SHEETS_URL = import.meta.env.VITE_SHEETS_URL as string | undefined;

const TABLAS: Tabla[] = ['pacientes', 'consultas', 'mediciones', 'laboratorios', 'turnos', 'recordatorios'];
const CLAVE_TOKEN = 'consultorio.token';
const SYNC_MS = 120_000;

type Datos = { [K in Tabla]: TablaTipo[K][] };
let datos: Datos | null = null;
let cargando: Promise<Datos> | null = null;

export const sesion = {
  token(): string | null {
    try { return localStorage.getItem(CLAVE_TOKEN); } catch { return null; }
  },
  guardar(t: string | null) {
    try { if (t) localStorage.setItem(CLAVE_TOKEN, t); else localStorage.removeItem(CLAVE_TOKEN); } catch { /* sin storage */ }
    window.dispatchEvent(new Event('consultorio:sesion'));
  },
};

export class ErrorSheets extends Error {
  codigo: string;
  constructor(codigo: string, mensaje: string) {
    super(mensaje);
    this.codigo = codigo;
  }
}

async function llamar<T>(accion: string, cuerpo: Record<string, unknown> = {}): Promise<T> {
  let res: Response;
  try {
    // text/plain evita el preflight CORS que Apps Script no responde.
    res = await fetch(SHEETS_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion, token: sesion.token(), ...cuerpo }),
      redirect: 'follow',
    });
  } catch {
    throw new ErrorSheets('red', 'Sin conexión con la planilla. Revisá internet y probá de nuevo.');
  }
  const r = await res.json();
  if (r.error) {
    if (r.error === 'sesion') { datos = null; sesion.guardar(null); }
    throw new ErrorSheets(r.error, r.mensaje ?? 'Error en la planilla.');
  }
  return r as T;
}

export async function login(clave: string) {
  const r = await llamar<{ token: string }>('login', { clave });
  sesion.guardar(r.token);
}

export async function logout() {
  try { await llamar('logout'); } finally { datos = null; sesion.guardar(null); }
}

/** Cierra la sesión en este dispositivo. En la demo vuelve a la pantalla de ingreso. */
export async function salir() {
  if (SHEETS_URL) return logout();
  window.dispatchEvent(new Event('consultorio:salir'));
}

function cargar(forzar = false): Promise<Datos> {
  if (datos && !forzar) return Promise.resolve(datos);
  if (cargando) return cargando;
  cargando = llamar<{ datos: Datos }>('init')
    .then((r) => {
      datos = Object.fromEntries(TABLAS.map((t) => [t, r.datos[t] ?? []])) as unknown as Datos;
      return datos;
    })
    .finally(() => { cargando = null; });
  return cargando;
}

/** Resincroniza al volver a la app y cada 2 minutos: celular y compu ven lo mismo. */
let sincronizando = false;
export function iniciarSync() {
  if (sincronizando) return;
  sincronizando = true;
  const sync = () => {
    if (!sesion.token() || document.visibilityState !== 'visible') return;
    cargar(true).then(() => TABLAS.forEach(emit)).catch(() => { /* reintenta en el próximo ciclo */ });
  };
  document.addEventListener('visibilitychange', sync);
  setInterval(sync, SYNC_MS);
}

function coincide(r: object, where?: object) {
  return !where || Object.entries(where).every(([k, v]) => (r as Record<string, unknown>)[k] === v);
}

function aBase64(file: Blob): Promise<string> {
  return new Promise((ok, mal) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result).split(',')[1]);
    fr.onerror = () => mal(fr.error);
    fr.readAsDataURL(file);
  });
}

export const sheetsRepo: Repo = {
  modo: 'sheets',
  async list(tabla, where) {
    const d = await cargar();
    return (d[tabla] as TablaTipo[typeof tabla][]).filter((r) => coincide(r, where));
  },
  async get(tabla, id) {
    const d = await cargar();
    return (d[tabla] as TablaTipo[typeof tabla][]).find((r) => r.id === id);
  },
  async save(tabla, row) {
    const fila = { ...row, id: row.id ?? nuevoId() };
    const { fila: guardada } = await llamar<{ fila: TablaTipo[typeof tabla] }>('save', { tabla, fila });
    const d = await cargar();
    const lista = d[tabla] as TablaTipo[typeof tabla][];
    const i = lista.findIndex((r) => r.id === guardada.id);
    if (i >= 0) lista[i] = guardada; else lista.push(guardada);
    emit(tabla as Tabla);
    return guardada;
  },
  async remove(tabla, id) {
    await llamar('borrar', { tabla, id });
    const d = await cargar();
    const sacar = (t: Tabla, f: (r: Record<string, unknown>) => boolean) => {
      (d[t] as unknown as Record<string, unknown>[]) = (d[t] as unknown as Record<string, unknown>[]).filter((r) => !f(r));
    };
    sacar(tabla, (r) => r.id === id);
    if (tabla === 'turnos') sacar('recordatorios', (r) => r.turno_id === id);
    emit(tabla);
    if (tabla === 'turnos') emit('recordatorios');
  },
  async removePaciente(id) {
    await llamar('borrarPaciente', { id });
    const d = await cargar();
    for (const t of TABLAS) {
      (d[t] as unknown as Record<string, unknown>[]) = (d[t] as unknown as Record<string, unknown>[]).filter((r) => (t === 'pacientes' ? r.id : r.paciente_id) !== id);
      emit(t);
    }
  },
  async uploadFile(path, file) {
    const nombre = path.split('/').pop() ?? 'informe';
    const { path: id } = await llamar<{ path: string }>('subir', { nombre, tipo: file.type, base64: await aBase64(file) });
    return id;
  },
  async fileUrl(path) {
    const r = await llamar<{ base64: string; tipo: string }>('archivo', { path });
    const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
    return URL.createObjectURL(new Blob([bytes], { type: r.tipo }));
  },
};
