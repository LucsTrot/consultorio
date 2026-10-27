import { addDays, setHours, setMinutes, startOfDay, subDays } from 'date-fns';
import { localDB } from './db/local';
import { emit, nuevoId } from './db/repo';
import { toLocalISO } from './format';
import type { Consulta, Laboratorio, Medicion, Paciente, Recordatorio, Turno } from './types';

const iso = (d: Date) => toLocalISO(d).slice(0, 10);

/** Datos ficticios para probar la plataforma en modo local. Ninguna persona es real. */
export async function cargarDemo() {
  const hoy = new Date();
  const P = (p: Omit<Paciente, 'id'>): Paciente => ({ id: nuevoId(), creado_en: new Date().toISOString(), ...p });

  const lucia = P({
    nombre: 'Lucía', apellido: 'Ferreyra', fecha_nacimiento: '1989-04-12', sexo: 'F', telefono: '11 5555-0101',
    email: 'lucia.demo@ejemplo.com', ocupacion: 'Docente', cobertura: 'Particular', modalidad: 'Presencial', talla_cm: 164,
    motivo_consulta: 'Viene de varias dietas que no pudo sostener. Siente que piensa en comida todo el día.',
    objetivos: 'Dejar de vivir la comida con culpa.\nOrdenar horarios de almuerzo en días de escuela.\nSumar actividad que disfrute.',
    antecedentes: {
      personales: 'Hipotiroidismo en tratamiento desde 2019.', familiares: 'Madre con diabetes tipo 2.',
      medicacion: 'Levotiroxina 75 µg en ayunas.', alergias: 'No refiere.', cirugias: 'Apendicectomía (2008).',
      actividad_fisica: 'Camina 2 veces por semana, 30 min.', sueno: '6 h promedio, se despierta cansada.',
      habitos: 'Agua: 1 L/día aprox. Café 3 tazas.', alimentacion: 'Saltea el almuerzo los días de doble turno; a la noche come con apuro.',
      historia_dietas: 'Tres planes restrictivos entre 2018 y 2024; abandonó todos a las pocas semanas.',
    },
  });
  const martin = P({
    nombre: 'Martín', apellido: 'Gutiérrez', fecha_nacimiento: '1978-09-30', sexo: 'M', telefono: '11 5555-0202',
    ocupacion: 'Contador', cobertura: 'OSDE 310', modalidad: 'Online', talla_cm: 178,
    motivo_consulta: 'Derivado por su médica clínica por perfil lipídico alterado.',
    objetivos: 'Entender qué cambios sostener en la oficina.\nMejorar perfil lipídico con hábitos posibles.',
    antecedentes: { personales: 'Dislipemia.', familiares: 'Padre con infarto a los 60.', medicacion: 'No toma.', actividad_fisica: 'Sedentario; quiere arrancar bici.', sueno: '7 h.', alimentacion: 'Almuerza en la oficina, delivery 4 veces por semana.' },
  });
  const ana = P({
    nombre: 'Ana', apellido: 'Rossi', fecha_nacimiento: '1996-01-22', sexo: 'F', telefono: '11 5555-0303',
    ocupacion: 'Diseñadora', cobertura: 'Particular', modalidad: 'Presencial', talla_cm: 158,
    motivo_consulta: 'Quiere aprender a armar comidas para entrenar sin obsesionarse.',
    objetivos: 'Ganar masa muscular acompañando el entrenamiento de fuerza.',
    antecedentes: { actividad_fisica: 'Fuerza 3 veces por semana.', alimentacion: 'Come poco a la mañana.' },
  });

  const med = (p: Paciente, mesesAtras: number, v: Partial<Medicion>): Medicion => ({
    id: nuevoId(), paciente_id: p.id, fecha: iso(subDays(hoy, Math.round(mesesAtras * 30))), fuente: 'balanza', ...v,
  });
  const mediciones: Medicion[] = [
    med(lucia, 6, { peso: 78.4, grasa_pct: 36.8, masa_muscular_pct: 24.0, masa_osea_kg: 2.4, agua_kg: 36.1, grasa_visceral: 9, proteina_pct: 15.2, tmb_kcal: 1422, edad_metabolica: 44, cintura_m: 0.94, cadera_m: 1.08 }),
    med(lucia, 5, { peso: 77.9, grasa_pct: 36.1, masa_muscular_pct: 24.5, masa_osea_kg: 2.4, agua_kg: 36.3, grasa_visceral: 9, proteina_pct: 15.4, tmb_kcal: 1426, edad_metabolica: 43, cintura_m: 0.93, cadera_m: 1.075 }),
    med(lucia, 4, { peso: 77.1, grasa_pct: 35.4, masa_muscular_pct: 25.1, masa_osea_kg: 2.4, agua_kg: 36.2, grasa_visceral: 8, proteina_pct: 15.6, tmb_kcal: 1431, edad_metabolica: 42, cintura_m: 0.915, cadera_m: 1.07 }),
    med(lucia, 2, { peso: 76.6, grasa_pct: 34.2, masa_muscular_pct: 25.8, masa_osea_kg: 2.5, agua_kg: 36.6, grasa_visceral: 8, proteina_pct: 15.9, tmb_kcal: 1440, edad_metabolica: 41, cintura_m: 0.9, cadera_m: 1.06 }),
    med(lucia, 0.3, { peso: 76.2, grasa_pct: 32.8, masa_muscular_pct: 26.4, masa_osea_kg: 2.5, agua_kg: 36.8, grasa_visceral: 7, proteina_pct: 16.1, tmb_kcal: 1446, edad_metabolica: 40, cintura_m: 0.885, cadera_m: 1.055 }),
    med(martin, 3, { peso: 92.3, grasa_pct: 29.4, masa_muscular_pct: 31.5, masa_osea_kg: 3.3, agua_kg: 47.3, grasa_visceral: 14, proteina_pct: 16.4, tmb_kcal: 1890, edad_metabolica: 52, cintura_m: 1.04, cadera_m: 1.06 }),
    med(martin, 1.5, { peso: 90.8, grasa_pct: 28.1, masa_muscular_pct: 32.4, masa_osea_kg: 3.3, agua_kg: 47.2, grasa_visceral: 13, proteina_pct: 16.7, tmb_kcal: 1884, edad_metabolica: 50, cintura_m: 1.01, cadera_m: 1.05 }),
    med(martin, 0.2, { peso: 89.9, grasa_pct: 27.3, masa_muscular_pct: 33.6, masa_osea_kg: 3.3, agua_kg: 47.3, grasa_visceral: 12, proteina_pct: 16.9, tmb_kcal: 1879, edad_metabolica: 49, cintura_m: 0.99, cadera_m: 1.045 }),
    med(ana, 2, { peso: 55.2, grasa_pct: 26.1, masa_muscular_pct: 29.8, masa_osea_kg: 2.1, agua_kg: 29.3, grasa_visceral: 3, proteina_pct: 17.0, tmb_kcal: 1238, edad_metabolica: 27, cintura_m: 0.68, cadera_m: 0.94 }),
    med(ana, 0.5, { peso: 56.0, grasa_pct: 24.9, masa_muscular_pct: 31.2, masa_osea_kg: 2.1, agua_kg: 30.3, grasa_visceral: 3, proteina_pct: 17.6, tmb_kcal: 1262, edad_metabolica: 25, cintura_m: 0.675, cadera_m: 0.945 }),
  ];

  const con = (p: Paciente, mesesAtras: number, c: Partial<Consulta>): Consulta => ({
    id: nuevoId(), paciente_id: p.id, fecha: iso(subDays(hoy, Math.round(mesesAtras * 30))), tipo: 'Seguimiento', ...c,
  });
  const consultas: Consulta[] = [
    con(lucia, 6, { tipo: 'Primera consulta', relato: 'Cuenta que “arranca bien el lunes y para el jueves ya abandonó”. Mucha culpa después de cenar.', observaciones: 'Patrón restricción–descontrol. Almuerzos salteados en días de doble turno.', indicaciones: 'Registro de hambre y saciedad sin cantidades. Llevar vianda simple los martes y jueves.', proximo_control: iso(subDays(hoy, 150)) }),
    con(lucia, 4, { relato: 'Pudo llevar vianda casi todas las semanas. La noche sigue siendo difícil.', observaciones: 'Menos picoteo nocturno. Mejora en registro de señales de hambre.', indicaciones: 'Merienda más completa para llegar a la noche con menos hambre.' }),
    con(lucia, 0.3, { relato: 'Siente que ya no piensa en comida todo el día. Empezó a caminar con una amiga.', observaciones: 'Buena adherencia. Disminución de perímetro de cintura sostenida.', indicaciones: 'Sumar una comida nueva por semana. Control en 6 semanas.', proximo_control: iso(addDays(hoy, 40)) }),
    con(martin, 3, { tipo: 'Primera consulta', relato: 'Lo deriva la clínica. Dice que no tiene tiempo de cocinar.', observaciones: 'Delivery frecuente, alto consumo de ultraprocesados en oficina.', indicaciones: 'Tres opciones de delivery más completas. Fruta en el escritorio.' }),
    con(martin, 0.2, { relato: 'Arrancó bici los sábados.', observaciones: 'Mejora en lípidos.', indicaciones: 'Sostener; sumar legumbres 2 veces por semana.' }),
    con(ana, 2, { tipo: 'Primera consulta', relato: 'Entrena fuerte y siente que no le alcanza la energía.', indicaciones: 'Desayuno con proteína y colación post entrenamiento.' }),
  ];

  const lab = (p: Paciente, mesesAtras: number, resultados: Laboratorio['resultados']): Laboratorio => ({
    id: nuevoId(), paciente_id: p.id, fecha: iso(subDays(hoy, Math.round(mesesAtras * 30))), laboratorio: 'Laboratorio Ramos Mejía', resultados,
  });
  const laboratorios: Laboratorio[] = [
    lab(martin, 3.2, [
      { analito: 'Colesterol total', valor: 248, unidad: 'mg/dL', ref_max: 200 },
      { analito: 'Colesterol HDL', valor: 38, unidad: 'mg/dL', ref_min: 40 },
      { analito: 'Colesterol LDL', valor: 172, unidad: 'mg/dL', ref_max: 130 },
      { analito: 'Triglicéridos', valor: 210, unidad: 'mg/dL', ref_max: 150 },
      { analito: 'Glucemia', valor: 104, unidad: 'mg/dL', ref_min: 70, ref_max: 100 },
      { analito: 'Insulina basal', valor: 14, unidad: 'µUI/mL', ref_min: 2, ref_max: 25 },
    ]),
    lab(martin, 0.4, [
      { analito: 'Colesterol total', valor: 221, unidad: 'mg/dL', ref_max: 200 },
      { analito: 'Colesterol HDL', valor: 42, unidad: 'mg/dL', ref_min: 40 },
      { analito: 'Colesterol LDL', valor: 148, unidad: 'mg/dL', ref_max: 130 },
      { analito: 'Triglicéridos', valor: 158, unidad: 'mg/dL', ref_max: 150 },
      { analito: 'Glucemia', valor: 97, unidad: 'mg/dL', ref_min: 70, ref_max: 100 },
      { analito: 'Insulina basal', valor: 10, unidad: 'µUI/mL', ref_min: 2, ref_max: 25 },
    ]),
    lab(lucia, 5.5, [
      { analito: 'TSH', valor: 3.1, unidad: 'µUI/mL', ref_min: 0.4, ref_max: 4 },
      { analito: 'Ferritina', valor: 11, unidad: 'ng/mL', ref_min: 15, ref_max: 150 },
      { analito: 'Vitamina D (25-OH)', valor: 19, unidad: 'ng/mL', ref_min: 30, ref_max: 100 },
      { analito: 'Hemoglobina', valor: 11.8, unidad: 'g/dL', ref_min: 12, ref_max: 16 },
    ]),
    lab(lucia, 1, [
      { analito: 'TSH', valor: 2.4, unidad: 'µUI/mL', ref_min: 0.4, ref_max: 4 },
      { analito: 'Ferritina', valor: 24, unidad: 'ng/mL', ref_min: 15, ref_max: 150 },
      { analito: 'Vitamina D (25-OH)', valor: 31, unidad: 'ng/mL', ref_min: 30, ref_max: 100 },
      { analito: 'Hemoglobina', valor: 12.6, unidad: 'g/dL', ref_min: 12, ref_max: 16 },
    ]),
  ];

  const at = (diasDesdeHoy: number, h: number, m = 0) => toLocalISO(setMinutes(setHours(startOfDay(addDays(hoy, diasDesdeHoy)), h), m));
  const turno = (p: Paciente, dias: number, h: number, m: number, t: Partial<Turno> = {}): Turno => ({
    id: nuevoId(), paciente_id: p.id, inicio: at(dias, h, m), duracion_min: 45, modalidad: p.modalidad ?? 'Presencial', tipo: 'Seguimiento', estado: 'agendado', ...t,
  });
  const turnos: Turno[] = [
    turno(ana, 0, 10, 0, { estado: 'confirmado' }),
    turno(martin, 0, 17, 30, { modalidad: 'Online' }),
    turno(lucia, 1, 9, 0),
    turno(ana, 3, 11, 0, { tipo: 'Control' }),
    turno(martin, 2, 18, 0, { modalidad: 'Online', tipo: 'Control' }),
    turno(lucia, -7, 9, 0, { estado: 'asistió' }),
  ];

  const recordatorios: Recordatorio[] = [
    ...turnos.filter((t) => new Date(t.inicio) > hoy).map<Recordatorio>((t) => ({
      id: nuevoId(), paciente_id: t.paciente_id, turno_id: t.id, tipo: 'turno', hecho: false,
      fecha: toLocalISO(subDays(new Date(t.inicio), 1)), mensaje: 'Recordar turno',
    })),
    { id: nuevoId(), paciente_id: martin.id, tipo: 'laboratorio', hecho: false, fecha: toLocalISO(addDays(hoy, 60)), mensaje: 'Pedir perfil lipídico de control' },
    { id: nuevoId(), paciente_id: lucia.id, tipo: 'control', hecho: false, fecha: toLocalISO(subDays(hoy, 1)), mensaje: 'Revisar vitamina D con la clínica' },
    { id: nuevoId(), tipo: 'tarea', hecho: false, fecha: toLocalISO(hoy), mensaje: 'Imprimir folletos de primera consulta' },
  ];

  await localDB.transaction('rw', localDB.tables, async () => {
    await Promise.all(localDB.tables.map((t) => t.clear()));
    await localDB.pacientes.bulkPut([lucia, martin, ana]);
    await localDB.mediciones.bulkPut(mediciones);
    await localDB.consultas.bulkPut(consultas);
    await localDB.laboratorios.bulkPut(laboratorios);
    await localDB.turnos.bulkPut(turnos);
    await localDB.recordatorios.bulkPut(recordatorios);
  });
  (['pacientes', 'consultas', 'mediciones', 'laboratorios', 'turnos', 'recordatorios'] as const).forEach(emit);
}
