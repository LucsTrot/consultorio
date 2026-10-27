import type { Laboratorio, ResultadoLab, Sexo } from './types';

export interface Analito {
  nombre: string;
  unidad: string;
  grupo: string;
  min?: number;
  max?: number;
  /** Rangos distintos por sexo cuando corresponde. */
  porSexo?: Partial<Record<Sexo, { min?: number; max?: number }>>;
}

/**
 * Rangos de referencia orientativos para adultos. Cada laboratorio informa los suyos:
 * al cargar, la profesional puede pisar el rango con el del informe.
 */
export const CATALOGO: Analito[] = [
  { grupo: 'Glucídico', nombre: 'Glucemia', unidad: 'mg/dL', min: 70, max: 100 },
  { grupo: 'Glucídico', nombre: 'Insulina basal', unidad: 'µUI/mL', min: 2, max: 25 },
  { grupo: 'Glucídico', nombre: 'Hemoglobina glicosilada (HbA1c)', unidad: '%', min: 4, max: 5.6 },
  { grupo: 'Lípidos', nombre: 'Colesterol total', unidad: 'mg/dL', max: 200 },
  { grupo: 'Lípidos', nombre: 'Colesterol HDL', unidad: 'mg/dL', porSexo: { F: { min: 50 }, M: { min: 40 } } },
  { grupo: 'Lípidos', nombre: 'Colesterol LDL', unidad: 'mg/dL', max: 130 },
  { grupo: 'Lípidos', nombre: 'Triglicéridos', unidad: 'mg/dL', max: 150 },
  { grupo: 'Tiroides', nombre: 'TSH', unidad: 'µUI/mL', min: 0.4, max: 4 },
  { grupo: 'Tiroides', nombre: 'T4 libre', unidad: 'ng/dL', min: 0.8, max: 1.8 },
  { grupo: 'Hemograma', nombre: 'Hemoglobina', unidad: 'g/dL', porSexo: { F: { min: 12, max: 16 }, M: { min: 13, max: 17 } } },
  { grupo: 'Hemograma', nombre: 'Hematocrito', unidad: '%', porSexo: { F: { min: 36, max: 46 }, M: { min: 40, max: 50 } } },
  { grupo: 'Hierro', nombre: 'Ferritina', unidad: 'ng/mL', porSexo: { F: { min: 15, max: 150 }, M: { min: 30, max: 400 } } },
  { grupo: 'Hierro', nombre: 'Hierro sérico', unidad: 'µg/dL', min: 60, max: 170 },
  { grupo: 'Vitaminas', nombre: 'Vitamina B12', unidad: 'pg/mL', min: 200, max: 900 },
  { grupo: 'Vitaminas', nombre: 'Vitamina D (25-OH)', unidad: 'ng/mL', min: 30, max: 100 },
  { grupo: 'Vitaminas', nombre: 'Ácido fólico', unidad: 'ng/mL', min: 3 },
  { grupo: 'Renal', nombre: 'Creatinina', unidad: 'mg/dL', porSexo: { F: { min: 0.5, max: 1.1 }, M: { min: 0.7, max: 1.3 } } },
  { grupo: 'Renal', nombre: 'Urea', unidad: 'mg/dL', min: 15, max: 45 },
  { grupo: 'Renal', nombre: 'Ácido úrico', unidad: 'mg/dL', porSexo: { F: { min: 2.4, max: 6 }, M: { min: 3.4, max: 7 } } },
  { grupo: 'Hepático', nombre: 'TGO (AST)', unidad: 'U/L', max: 40 },
  { grupo: 'Hepático', nombre: 'TGP (ALT)', unidad: 'U/L', max: 40 },
  { grupo: 'Hepático', nombre: 'GGT', unidad: 'U/L', max: 50 },
  { grupo: 'Otros', nombre: 'Albúmina', unidad: 'g/dL', min: 3.5, max: 5 },
  { grupo: 'Otros', nombre: 'PCR ultrasensible', unidad: 'mg/L', max: 3 },
];

export function rangoPara(nombre: string, sexo?: Sexo) {
  const a = CATALOGO.find((x) => x.nombre === nombre);
  if (!a) return {};
  const s = sexo && a.porSexo?.[sexo];
  return { min: s ? s.min : a.min, max: s ? s.max : a.max, unidad: a.unidad };
}

export type Estado = 'bajo' | 'alto' | 'en rango' | undefined;
export function estado(r: ResultadoLab): Estado {
  if (r.valor == null) return;
  if (r.ref_min != null && r.valor < r.ref_min) return 'bajo';
  if (r.ref_max != null && r.valor > r.ref_max) return 'alto';
  if (r.ref_min != null || r.ref_max != null) return 'en rango';
}

/** Índices calculados a partir de un laboratorio. */
export function derivados(l: Laboratorio): ResultadoLab[] {
  const v = (n: string) => l.resultados.find((r) => r.analito === n)?.valor ?? null;
  const out: ResultadoLab[] = [];
  const g = v('Glucemia');
  const i = v('Insulina basal');
  if (g && i) out.push({ analito: 'HOMA-IR', valor: Math.round(((g * i) / 405) * 100) / 100, unidad: '', ref_max: 2.5 });
  const tg = v('Triglicéridos');
  const hdl = v('Colesterol HDL');
  if (tg && hdl) out.push({ analito: 'Triglicéridos/HDL', valor: Math.round((tg / hdl) * 100) / 100, unidad: '', ref_max: 3 });
  const ct = v('Colesterol total');
  if (ct && hdl) out.push({ analito: 'Colesterol total/HDL', valor: Math.round((ct / hdl) * 100) / 100, unidad: '', ref_max: 5 });
  return out;
}

export function todosLosResultados(l: Laboratorio) {
  return [...l.resultados, ...derivados(l)];
}

/** Serie de un analito a través de todos los laboratorios de la persona. */
export function serieAnalito(labs: Laboratorio[], analito: string) {
  return [...labs]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((l) => {
      const r = todosLosResultados(l).find((x) => x.analito === analito);
      return r?.valor != null ? { fecha: l.fecha, valor: r.valor, ref_min: r.ref_min, ref_max: r.ref_max, unidad: r.unidad } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}
