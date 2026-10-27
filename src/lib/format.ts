import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Paciente } from './types';

export const nombreCompleto = (p?: Pick<Paciente, 'nombre' | 'apellido'>) => (p ? `${p.nombre} ${p.apellido}` : '—');
export const iniciales = (p?: Pick<Paciente, 'nombre' | 'apellido'>) =>
  p ? `${p.nombre[0] ?? ''}${p.apellido[0] ?? ''}`.toUpperCase() : '';

const parse = (s: string) => (s.length === 10 ? parseISO(s + 'T12:00:00') : parseISO(s));
export const fFecha = (s?: string | null) => (s ? format(parse(s), 'd MMM yyyy', { locale: es }) : '—');
export const fFechaCorta = (s?: string | null) => (s ? format(parse(s), 'dd/MM/yy') : '—');
export const fHora = (s: string) => format(parse(s), 'HH:mm');
export const fDiaLargo = (d: Date) => format(d, "EEEE d 'de' MMMM", { locale: es });

/** `fijo`: siempre con todos los decimales (para metros: 0,90 y no 0,9). */
export const fNum = (n?: number | null, dec = 1, fijo = false) =>
  n == null || !Number.isFinite(n) ? '—' : n.toLocaleString('es-AR', { maximumFractionDigits: dec, minimumFractionDigits: fijo ? dec : 0 });

export const fDelta = (n?: number, dec = 1) =>
  n == null ? '' : `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: dec })}`;

export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const toLocalISO = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Teléfono AR a formato wa.me: 11 6719-5241 → 5491167195241 */
export function waNumero(tel?: string) {
  if (!tel) return '';
  let d = tel.replace(/\D/g, '');
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  d = d.replace(/^(\d{2,4})15/, '$1');
  if (!d.startsWith('9')) d = '9' + d;
  return '54' + d;
}
export const waLink = (tel: string | undefined, texto: string) =>
  `https://wa.me/${waNumero(tel)}?text=${encodeURIComponent(texto)}`;
