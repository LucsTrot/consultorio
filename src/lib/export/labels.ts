import type { Antecedentes } from '../types';

export const ANTECEDENTES_LABELS: [keyof Antecedentes, string][] = [
  ['personales', 'Antecedentes personales'],
  ['familiares', 'Antecedentes familiares'],
  ['medicacion', 'Medicación y suplementos'],
  ['alergias', 'Alergias e intolerancias'],
  ['cirugias', 'Cirugías'],
  ['historia_dietas', 'Dietas anteriores'],
  ['alimentacion', 'Anamnesis alimentaria'],
  ['actividad_fisica', 'Actividad física'],
  ['sueno', 'Sueño y descanso'],
  ['habitos', 'Hidratación, tabaco, alcohol'],
];
