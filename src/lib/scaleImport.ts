import type { Medicion } from './types';

/**
 * Importación de exportaciones de la app de la balanza (CSV o Excel).
 * Las apps de balanzas Bluetooth (Fitdays, OKOK y similares) exportan columnas con
 * nombres distintos según idioma y versión, así que se mapean por coincidencia de texto.
 * Si una columna no se reconoce, la profesional la asigna a mano en la pantalla de importación.
 */
export type CampoBalanza =
  | 'fecha' | 'peso' | 'grasa_pct' | 'masa_muscular_pct' | 'masa_osea_kg' | 'agua_kg'
  | 'grasa_visceral' | 'proteina_pct' | 'tmb_kcal' | 'edad_metabolica';

export const CAMPOS_BALANZA: Record<CampoBalanza, { nombre: string; claves: RegExp }> = {
  fecha: { nombre: 'Fecha', claves: /fecha|date|time|hora|data/i },
  peso: { nombre: 'Peso (kg)', claves: /^(peso|weight|body ?weight)|peso ?\(kg\)/i },
  grasa_pct: { nombre: 'Grasa corporal (%)', claves: /(grasa|fat)(?!.*visceral)(?!.*mass)(?!.*\bkg\b)|body ?fat|bfr/i },
  masa_muscular_pct: { nombre: 'Masa muscular (%)', claves: /(muscul|muscle)/i },
  masa_osea_kg: { nombre: 'Masa ósea (kg)', claves: /(ósea|osea|bone)/i },
  agua_kg: { nombre: 'Agua (kg)', claves: /(agua|water|hidrat)/i },
  grasa_visceral: { nombre: 'Grasa visceral', claves: /visceral/i },
  proteina_pct: { nombre: 'Proteína (%)', claves: /(prote)/i },
  tmb_kcal: { nombre: 'Metabolismo basal (kcal)', claves: /(bmr|basal|tmb)/i },
  edad_metabolica: { nombre: 'Edad metabólica', claves: /(edad metab|metabolic age|body ?age)/i },
};

export type Mapeo = Partial<Record<CampoBalanza, number>>;

export async function leerArchivoTabla(file: File): Promise<string[][]> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const esTexto = /\.(csv|txt)$/i.test(file.name);
  // CSV: texto crudo (si no, la librería reinterpreta fechas en formato estadounidense).
  const wb = XLSX.read(buf, esTexto ? { type: 'array', raw: true } : { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });
  return filas
    .map((f) => f.map((c) => (c instanceof Date ? toISO(c) : String(c ?? '').trim())))
    .filter((f) => f.some(Boolean));
}

export function autoMapear(encabezados: string[]): Mapeo {
  const m: Mapeo = {};
  (Object.keys(CAMPOS_BALANZA) as CampoBalanza[]).forEach((campo) => {
    const i = encabezados.findIndex((h, idx) => CAMPOS_BALANZA[campo].claves.test(h) && !Object.values(m).includes(idx));
    if (i >= 0) m[campo] = i;
  });
  return m;
}

const num = (s?: string) => {
  if (!s) return undefined;
  const limpio = s.replace(/[^\d.,-]/g, '');
  // admite "72,4" y "72.4"; si hay ambos, el último es el decimal
  const normal = limpio.includes(',') && limpio.lastIndexOf(',') > limpio.lastIndexOf('.')
    ? limpio.replace(/\./g, '').replace(',', '.')
    : limpio.replace(/,/g, '');
  const n = parseFloat(normal);
  return Number.isFinite(n) ? n : undefined;
};

const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const valida = (y: number, m: number, d: number) => m >= 1 && m <= 12 && d >= 1 && d <= 31 && y > 1900;
const armar = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function parseFecha(s?: string): string | undefined {
  if (!s) return;
  const iso = s.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (iso && valida(+iso[1], +iso[2], +iso[3])) return armar(+iso[1], +iso[2], +iso[3]);
  const dmy = s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/);
  if (dmy) {
    const y = dmy[3].length === 2 ? 2000 + +dmy[3] : +dmy[3];
    if (valida(y, +dmy[2], +dmy[1])) return armar(y, +dmy[2], +dmy[1]); // día/mes (Argentina)
    if (valida(y, +dmy[1], +dmy[2])) return armar(y, +dmy[1], +dmy[2]); // mes/día si no cierra
  }
  const d = new Date(s);
  return isNaN(+d) ? undefined : toISO(d);
}

/** ¿La columna viene en kg o en %? Se decide por el encabezado (si no dice, se asume la unidad de la plataforma). */
const enKg = (h?: string) => !!h && /kg/i.test(h) && !/%/.test(h);
const enPct = (h?: string) => !!h && (/%|rate|tasa|porc/i.test(h));

export function filasAMediciones(filas: string[][], mapeo: Mapeo, pacienteId: string, encabezados: string[] = []): Partial<Medicion>[] {
  const hMusculo = mapeo.masa_muscular_pct !== undefined ? encabezados[mapeo.masa_muscular_pct] : undefined;
  const hAgua = mapeo.agua_kg !== undefined ? encabezados[mapeo.agua_kg] : undefined;
  return filas
    .map((f) => {
      const get = (c: CampoBalanza) => (mapeo[c] !== undefined ? f[mapeo[c]!] : undefined);
      const m: Partial<Medicion> = {
        paciente_id: pacienteId,
        fuente: 'importado',
        fecha: parseFecha(get('fecha')),
        peso: num(get('peso')),
        grasa_pct: num(get('grasa_pct')),
        masa_muscular_pct: num(get('masa_muscular_pct')),
        masa_osea_kg: num(get('masa_osea_kg')),
        agua_kg: num(get('agua_kg')),
        grasa_visceral: num(get('grasa_visceral')),
        proteina_pct: num(get('proteina_pct')),
        tmb_kcal: num(get('tmb_kcal')),
        edad_metabolica: num(get('edad_metabolica')),
      };
      // La plataforma trabaja con masa muscular en % y agua en kg: si la app exporta otra unidad, se convierte con el peso.
      const r1 = (n: number) => Math.round(n * 10) / 10;
      if (m.peso && m.masa_muscular_pct != null && enKg(hMusculo)) m.masa_muscular_pct = r1((m.masa_muscular_pct / m.peso) * 100);
      if (m.peso && m.agua_kg != null && enPct(hAgua)) m.agua_kg = r1((m.peso * m.agua_kg) / 100);
      return m;
    })
    .filter((m) => m.fecha && m.peso);
}
