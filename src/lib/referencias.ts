import type { Sexo } from './types';

/**
 * Clasificaciones de uso clínico interno. Nunca llegan al informe para la persona.
 *
 * Grasa corporal %: tabla de Gallagher et al. (2000), la que usan la mayoría de las balanzas de bioimpedancia.
 * Masa muscular %: rangos de músculo esquelético por bioimpedancia (tabla Omron, 18 a 80 años).
 * Cada balanza calcula la masa muscular a su manera: si el manual de la Microfast trae su propia tabla,
 * se reemplazan los números de MUSCULO y listo; el resto de la app no cambia.
 */
export type Nivel = 'bajo' | 'normal' | 'alto';

/** [edad máxima, límite inferior de normal, límite inferior de alto] */
type Tramo = [number, number, number];

const GRASA: Record<Sexo, Tramo[]> = {
  F: [[39, 21, 33], [59, 23, 34], [200, 24, 36]],
  M: [[39, 8, 20], [59, 11, 22], [200, 13, 25]],
};

const MUSCULO: Record<Sexo, Tramo[]> = {
  F: [[39, 24.3, 30.4], [59, 24.1, 30.2], [200, 23.9, 30]],
  M: [[39, 33.3, 39.4], [59, 33.1, 39.2], [200, 32.9, 39]],
};

export interface Clasificacion {
  nivel: Nivel;
  /** Rango considerado normal para la persona, extremos incluidos. */
  normal: [number, number];
}

function clasificar(tabla: Record<Sexo, Tramo[]>, valor?: number, sexo?: Sexo, edad?: number): Clasificacion | undefined {
  if (valor == null || !sexo || edad == null || edad < 18) return;
  const [, min, alto] = tabla[sexo].find(([max]) => edad <= max)!;
  return { nivel: valor < min ? 'bajo' : valor >= alto ? 'alto' : 'normal', normal: [min, Math.round((alto - 0.1) * 10) / 10] };
}

export const nivelGrasa = (pct?: number, sexo?: Sexo, edad?: number) => clasificar(GRASA, pct, sexo, edad);
export const nivelMusculo = (pct?: number, sexo?: Sexo, edad?: number) => clasificar(MUSCULO, pct, sexo, edad);

export type CategoriaIMC = 'Bajo peso' | 'Normal' | 'Sobrepeso' | 'Obesidad';

/** Categorías OMS para adultos. */
export function categoriaIMC(imc?: number): { categoria: CategoriaIMC; tono: 'aviso' | 'ok' | 'alerta'; rango: string } | undefined {
  if (imc == null || !Number.isFinite(imc)) return;
  if (imc < 18.5) return { categoria: 'Bajo peso', tono: 'aviso', rango: '< 18,5' };
  if (imc < 25) return { categoria: 'Normal', tono: 'ok', rango: '18,5 – 24,9' };
  if (imc < 30) return { categoria: 'Sobrepeso', tono: 'aviso', rango: '25 – 29,9' };
  return { categoria: 'Obesidad', tono: 'alerta', rango: '≥ 30' };
}
