import { categoriaIMC, nivelGrasa, nivelMusculo, type Clasificacion } from './referencias';
import type { Medicion, Paciente } from './types';

export const r1 = (n: number) => Math.round(n * 10) / 10;
export const r2 = (n: number) => Math.round(n * 100) / 100;
const redondear = (n: number, dec: number) => Math.round(n * 10 ** dec) / 10 ** dec;
const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

export function edad(fechaNac?: string, en: Date = new Date()): number | undefined {
  if (!fechaNac) return;
  const n = new Date(fechaNac + 'T12:00:00');
  let e = en.getFullYear() - n.getFullYear();
  const m = en.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && en.getDate() < n.getDate())) e--;
  return e;
}

export const edadEnMedicion = (m: Medicion, p?: Paciente) => edad(p?.fecha_nacimiento, new Date(m.fecha + 'T12:00:00'));

export interface Indice {
  clave: string;
  nombre: string;
  valor: number;
  unidad: string;
  formula: string;
  /** Referencia de uso clínico interno. Nunca llega al informe para la persona. */
  referencia?: string;
}

/**
 * Índices derivados de una medición. La profesional carga números y la plataforma devuelve índices, sin planillas.
 * Unidades: masa muscular en %, agua en kg, cintura y cadera en metros, talla en cm.
 */
export function indices(m: Medicion, p?: Paciente): Indice[] {
  const out: Indice[] = [];
  const talla = m.talla_cm ?? p?.talla_cm;
  const tm = ok(talla) ? talla / 100 : undefined;
  const e = edadEnMedicion(m, p);

  if (ok(m.peso) && ok(m.grasa_pct)) {
    const mg = (m.peso * m.grasa_pct) / 100;
    const mlg = m.peso - mg;
    out.push({ clave: 'masa_grasa', nombre: 'Masa grasa', valor: r1(mg), unidad: 'kg', formula: 'peso × % grasa' });
    out.push({ clave: 'mlg', nombre: 'Masa libre de grasa', valor: r1(mlg), unidad: 'kg', formula: 'peso − masa grasa' });
    if (tm) {
      out.push({ clave: 'imlg', nombre: 'Índice de masa libre de grasa', valor: r1(mlg / tm ** 2), unidad: 'kg/m²', formula: 'MLG ÷ talla²', referencia: 'Bajo: < 15 (F) · < 17 (M) — ESPEN.' });
      out.push({ clave: 'img', nombre: 'Índice de masa grasa', valor: r1(mg / tm ** 2), unidad: 'kg/m²', formula: 'MG ÷ talla²' });
    }
    out.push({ clave: 'katch', nombre: 'Gasto en reposo (Katch-McArdle)', valor: Math.round(370 + 21.6 * mlg), unidad: 'kcal/día', formula: '370 + 21,6 × MLG' });
  }
  if (ok(m.peso) && ok(m.masa_muscular_pct)) {
    out.push({ clave: 'masa_muscular_kg', nombre: 'Masa muscular en kg', valor: r1((m.peso * m.masa_muscular_pct) / 100), unidad: 'kg', formula: 'peso × % masa muscular' });
  }
  if (ok(m.peso) && ok(m.agua_kg)) {
    out.push({ clave: 'agua_pct', nombre: 'Agua sobre peso', valor: r1((m.agua_kg / m.peso) * 100), unidad: '%', formula: 'agua ÷ peso' });
  }
  if (ok(m.cintura_m) && ok(m.cadera_m)) {
    out.push({ clave: 'icc', nombre: 'Relación cintura/cadera', valor: r2(m.cintura_m / m.cadera_m), unidad: '', formula: 'cintura ÷ cadera', referencia: 'OMS: riesgo aumentado ≥ 0,85 (F) · ≥ 0,90 (M).' });
  }
  if (ok(m.peso) && ok(talla) && e !== undefined && p?.sexo) {
    const msj = 10 * m.peso + 6.25 * talla - 5 * e + (p.sexo === 'M' ? 5 : -161);
    out.push({ clave: 'mifflin', nombre: 'Gasto en reposo (Mifflin-St Jeor)', valor: Math.round(msj), unidad: 'kcal/día', formula: '10·P + 6,25·T − 5·E ± s' });
  }
  // El IMC va al final, con su categoría (uso interno).
  if (ok(m.peso) && tm) {
    const imc = r1(m.peso / tm ** 2);
    out.push({ clave: 'imc', nombre: 'IMC', valor: imc, unidad: 'kg/m²', formula: 'peso ÷ talla²', referencia: categoriaIMC(imc)?.categoria });
  }
  return out;
}

/** Clasificación de masa muscular y grasa para la profesional (bajo / normal / alto según sexo y edad). */
export function clasificaciones(m: Medicion, p?: Paciente): { musculo?: Clasificacion; grasa?: Clasificacion } {
  const e = edadEnMedicion(m, p);
  return { musculo: nivelMusculo(m.masa_muscular_pct, p?.sexo, e), grasa: nivelGrasa(m.grasa_pct, p?.sexo, e) };
}

export function imcDe(m: Medicion, p?: Paciente) {
  return indices(m, p).find((i) => i.clave === 'imc')?.valor;
}

/** Métricas graficables: directas o índices. `dec` = decimales para mostrar. */
export type Metrica =
  | 'peso' | 'grasa_pct' | 'masa_muscular_pct' | 'agua_kg' | 'grasa_visceral' | 'masa_osea_kg'
  | 'cintura_m' | 'cadera_m' | 'icc' | 'masa_grasa' | 'mlg' | 'imlg' | 'imc' | 'masa_muscular_kg';

export const METRICAS: Record<Metrica, { nombre: string; unidad: string; dec: number }> = {
  masa_muscular_pct: { nombre: 'Masa muscular', unidad: '%', dec: 1 },
  grasa_pct: { nombre: 'Grasa corporal', unidad: '%', dec: 1 },
  peso: { nombre: 'Peso', unidad: 'kg', dec: 1 },
  agua_kg: { nombre: 'Agua', unidad: 'kg', dec: 1 },
  grasa_visceral: { nombre: 'Grasa visceral', unidad: 'nivel', dec: 0 },
  masa_osea_kg: { nombre: 'Masa ósea', unidad: 'kg', dec: 2 },
  cintura_m: { nombre: 'Cintura', unidad: 'm', dec: 2 },
  cadera_m: { nombre: 'Cadera', unidad: 'm', dec: 2 },
  icc: { nombre: 'Relación cintura/cadera', unidad: '', dec: 2 },
  masa_grasa: { nombre: 'Masa grasa', unidad: 'kg', dec: 1 },
  mlg: { nombre: 'Masa libre de grasa', unidad: 'kg', dec: 1 },
  imlg: { nombre: 'IMLG', unidad: 'kg/m²', dec: 1 },
  imc: { nombre: 'IMC', unidad: 'kg/m²', dec: 1 },
  masa_muscular_kg: { nombre: 'Masa muscular', unidad: 'kg', dec: 1 },
};

export function valorMetrica(m: Medicion, p: Paciente | undefined, k: Metrica): number | undefined {
  const directo = (m as unknown as Record<string, unknown>)[k];
  if (typeof directo === 'number') return directo;
  return indices(m, p).find((i) => i.clave === k)?.valor;
}

export function serie(ms: Medicion[], p: Paciente | undefined, k: Metrica) {
  return [...ms]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((m) => ({ fecha: m.fecha, valor: valorMetrica(m, p, k) }))
    .filter((d): d is { fecha: string; valor: number } => d.valor !== undefined);
}

export function delta(ms: Medicion[], p: Paciente | undefined, k: Metrica) {
  const s = serie(ms, p, k);
  const dec = METRICAS[k].dec;
  if (s.length < 2) return { ultimo: s.at(-1)?.valor, vsAnterior: undefined, vsInicio: undefined };
  const u = s.at(-1)!.valor;
  return { ultimo: u, vsAnterior: redondear(u - s.at(-2)!.valor, dec), vsInicio: redondear(u - s[0].valor, dec) };
}
