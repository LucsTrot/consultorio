import * as XLSX from 'xlsx';
import { clasificaciones, edad, indices } from '../calc';
import { categoriaIMC } from '../referencias';
import { nombreCompleto } from '../format';
import { estado, todosLosResultados } from '../labs';
import type { Fuente } from './datos';
import { ANTECEDENTES_LABELS } from './labels';

/** Excel con datos crudos (números como números) para que se pueda filtrar y graficar. */
export function historiaExcel({ paciente: p, consultas, mediciones, labs }: Fuente) {
  const wb = XLSX.utils.book_new();
  const hoja = (nombre: string, filas: (string | number | null | undefined)[][], anchos?: number[]) => {
    const ws = XLSX.utils.aoa_to_sheet(filas);
    if (anchos) ws['!cols'] = anchos.map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  };

  hoja('Ficha', [
    ['Nombre', nombreCompleto(p)], ['Fecha de nacimiento', p.fecha_nacimiento], ['Edad', edad(p.fecha_nacimiento)],
    ['Sexo (fórmulas)', p.sexo], ['Talla (cm)', p.talla_cm], ['DNI', p.dni], ['Teléfono', p.telefono], ['Mail', p.email],
    ['Ocupación', p.ocupacion], ['Cobertura', p.cobertura], ['Modalidad', p.modalidad],
    [], ['Motivo de consulta', p.motivo_consulta], ['Objetivos', p.objetivos], [],
    ...ANTECEDENTES_LABELS.map(([k, l]) => [l, p.antecedentes?.[k]]),
  ], [26, 80]);

  const med = [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const clavesIdx = ['masa_muscular_kg', 'agua_pct', 'masa_grasa', 'mlg', 'imlg', 'img', 'icc', 'mifflin', 'katch', 'imc'];
  const nombresIdx = ['Músculo (kg)', 'Agua (%)', 'Masa grasa (kg)', 'MLG (kg)', 'IMLG', 'IMG', 'Cintura/cadera', 'Mifflin (kcal)', 'Katch-McArdle (kcal)', 'IMC'];
  hoja('Mediciones', [
    ['Fecha', 'Origen', 'Peso (kg)', 'Grasa (%)', 'Clasif. grasa', 'Músculo (%)', 'Clasif. músculo', 'Agua (kg)', 'Ósea (kg)', 'Visceral', 'Proteína (%)',
      'TMB balanza (kcal)', 'Edad metabólica', 'Talla (cm)', 'Cintura (m)', 'Cadera (m)', ...nombresIdx, 'Categoría IMC', 'Notas'],
    ...med.map((m) => {
      const ind = indices(m, p);
      const c = clasificaciones(m, p);
      return [
        m.fecha, m.fuente, m.peso, m.grasa_pct, c.grasa?.nivel, m.masa_muscular_pct, c.musculo?.nivel, m.agua_kg, m.masa_osea_kg, m.grasa_visceral, m.proteina_pct,
        m.tmb_kcal, m.edad_metabolica, m.talla_cm ?? p.talla_cm, m.cintura_m, m.cadera_m,
        ...clavesIdx.map((k) => ind.find((i) => i.clave === k)?.valor), categoriaIMC(ind.find((i) => i.clave === 'imc')?.valor)?.categoria, m.notas,
      ];
    }),
  ]);

  hoja('Laboratorios', [
    ['Fecha', 'Laboratorio', 'Analito', 'Valor', 'Unidad', 'Ref. mín', 'Ref. máx', 'Estado'],
    ...[...labs].sort((a, b) => a.fecha.localeCompare(b.fecha)).flatMap((l) =>
      todosLosResultados(l).map((r) => [l.fecha, l.laboratorio, r.analito, r.valor, r.unidad, r.ref_min, r.ref_max, estado(r)]),
    ),
  ], [12, 24, 30, 10, 10, 10, 10, 10]);

  hoja('Consultas', [
    ['Fecha', 'Tipo', 'Relato', 'Observaciones', 'Acuerdos', 'Próximo control'],
    ...[...consultas].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((c) => [c.fecha, c.tipo, c.relato, c.observaciones, c.indicaciones, c.proximo_control]),
  ], [12, 16, 50, 50, 50, 14]);

  const slug = `${p.apellido}-${p.nombre}`.normalize('NFD').replace(/[^\w-]/g, '').toLowerCase();
  XLSX.writeFile(wb, `historia-clinica-${slug}.xlsx`);
}
