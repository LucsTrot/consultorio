// Modelo de datos. Los nombres de campo coinciden 1:1 con las columnas de cada hoja (apps-script/Code.gs → COLUMNAS).

export type ID = string;

export interface Base {
  id: ID;
  creado_en?: string;
  actualizado_en?: string;
  /** Compatibilidad con filas archivadas en versiones anteriores: se ocultan. */
  eliminado_en?: string | null;
}

export type Sexo = 'F' | 'M';
export type Modalidad = 'Presencial' | 'Online';

export interface Antecedentes {
  personales?: string;
  familiares?: string;
  medicacion?: string;
  alergias?: string;
  cirugias?: string;
  actividad_fisica?: string;
  sueno?: string;
  habitos?: string; // tabaco, alcohol, hidratación
  alimentacion?: string; // anamnesis alimentaria / recordatorio 24 h
  historia_dietas?: string; // dietas previas y cómo terminaron
}

export type EstadoPaciente = 'activo' | 'suspendido';

export interface Paciente extends Base {
  /** Suspendida: deja de aparecer en la lista y la agenda, pero conserva toda su historia clínica. */
  estado?: EstadoPaciente;
  suspendido_en?: string;
  nombre: string;
  apellido: string;
  dni?: string;
  fecha_nacimiento?: string; // YYYY-MM-DD
  sexo?: Sexo; // para fórmulas de composición corporal
  telefono?: string;
  email?: string;
  ocupacion?: string;
  cobertura?: string;
  modalidad?: Modalidad;
  talla_cm?: number;
  motivo_consulta?: string;
  objetivos?: string;
  antecedentes?: Antecedentes;
  notas?: string;
}

export type TipoConsulta = 'Primera consulta' | 'Seguimiento' | 'Control';

export interface Consulta extends Base {
  paciente_id: ID;
  fecha: string; // YYYY-MM-DD
  tipo: TipoConsulta;
  relato?: string; // lo que cuenta la persona
  observaciones?: string; // lo que observa la profesional
  indicaciones?: string; // acuerdos y pautas
  proximo_control?: string; // YYYY-MM-DD
}

export type FuenteMedicion = 'balanza' | 'manual' | 'importado';

/** Una visita de medición: bioimpedancia + perímetros en un solo registro. */
export interface Medicion extends Base {
  paciente_id: ID;
  fecha: string;
  fuente: FuenteMedicion;
  // Bioimpedancia (Microfast U-CF625BC-NG)
  peso?: number; // kg
  grasa_pct?: number; // %
  masa_muscular_pct?: number; // %
  agua_kg?: number; // kg
  grasa_visceral?: number; // nivel
  masa_osea_kg?: number;
  proteina_pct?: number;
  tmb_kcal?: number; // la que informa la balanza
  edad_metabolica?: number;
  // Perímetros
  talla_cm?: number;
  cintura_m?: number;
  cadera_m?: number;
  notas?: string;
}

export interface ResultadoLab {
  analito: string;
  valor: number | null;
  unidad?: string;
  ref_min?: number | null;
  ref_max?: number | null;
}

export interface Laboratorio extends Base {
  paciente_id: ID;
  fecha: string;
  laboratorio?: string;
  resultados: ResultadoLab[];
  archivo_path?: string | null;
  archivo_nombre?: string | null;
  notas?: string;
}

export type EstadoTurno = 'agendado' | 'confirmado' | 'asistió' | 'ausente' | 'cancelado';

export interface Turno extends Base {
  paciente_id: ID;
  inicio: string; // ISO con hora local
  duracion_min: number;
  modalidad: Modalidad;
  tipo: TipoConsulta;
  estado: EstadoTurno;
  notas?: string;
}

export type TipoRecordatorio = 'turno' | 'control' | 'laboratorio' | 'tarea';

export interface Recordatorio extends Base {
  paciente_id?: ID | null;
  turno_id?: ID | null;
  tipo: TipoRecordatorio;
  fecha: string; // ISO: cuándo avisar
  mensaje: string;
  hecho: boolean;
}

export type Tabla =
  | 'pacientes'
  | 'consultas'
  | 'mediciones'
  | 'laboratorios'
  | 'turnos'
  | 'recordatorios';

export interface TablaTipo {
  pacientes: Paciente;
  consultas: Consulta;
  mediciones: Medicion;
  laboratorios: Laboratorio;
  turnos: Turno;
  recordatorios: Recordatorio;
}
