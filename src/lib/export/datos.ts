import { clasificaciones, edad, indices, METRICAS, serie, type Metrica } from '../calc';
import { leerAjustes } from '../ajustes';
import { fFecha, fNum, nombreCompleto } from '../format';
import { estado, todosLosResultados } from '../labs';
import type { Consulta, Laboratorio, Medicion, Paciente } from '../types';
import { ANTECEDENTES_LABELS } from './labels';

export type Modo = 'clinico' | 'paciente';

export interface Fuente {
  paciente: Paciente;
  consultas: Consulta[];
  mediciones: Medicion[];
  labs: Laboratorio[];
}

export interface Tabla { titulo?: string; cabecera: string[]; filas: string[][]; alinearDerecha?: number[] }
export interface Grafico { titulo: string; unidad: string; dec?: number; datos: { fecha: string; valor: number }[] }
export interface Seccion { titulo: string; texto?: string; pares?: [string, string][]; tablas?: Tabla[]; graficos?: Grafico[] }
export interface Informe { titulo: string; subtitulo: string; secciones: Seccion[]; pie: string[]; archivo: string }

/** Orden de métricas para la persona: músculo y medidas primero, el peso al final. */
const PARA_PACIENTE: Metrica[] = ['masa_muscular_pct', 'grasa_pct', 'cintura_m', 'cadera_m', 'peso'];
const PARA_CLINICA: Metrica[] = ['masa_muscular_pct', 'grasa_pct', 'peso', 'icc', 'agua_kg', 'grasa_visceral'];

export function armarInforme({ paciente: p, consultas, mediciones, labs }: Fuente, modo: Modo): Informe {
  const aj = leerAjustes();
  const med = [...mediciones].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const cons = [...consultas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const lbs = [...labs].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const hoy = fFecha(new Date().toISOString().slice(0, 10));
  const secciones: Seccion[] = [];
  const slug = `${p.apellido}-${p.nombre}`.normalize('NFD').replace(/[^\w-]/g, '').toLowerCase();

  if (modo === 'clinico') {
    secciones.push({
      titulo: 'Datos personales',
      pares: ([
        ['Fecha de nacimiento', p.fecha_nacimiento ? `${fFecha(p.fecha_nacimiento)} (${edad(p.fecha_nacimiento)} años)` : ''],
        ['Sexo (fórmulas)', p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : ''],
        ['Talla', p.talla_cm ? `${fNum(p.talla_cm)} cm` : ''],
        ['DNI', p.dni ?? ''], ['Teléfono', p.telefono ?? ''], ['Mail', p.email ?? ''],
        ['Ocupación', p.ocupacion ?? ''], ['Cobertura', p.cobertura ?? ''], ['Modalidad', p.modalidad ?? ''],
      ] as [string, string][]).filter(([, v]) => v),
    });
    if (p.motivo_consulta) secciones.push({ titulo: 'Motivo de consulta', texto: p.motivo_consulta });
    if (p.objetivos) secciones.push({ titulo: 'Objetivos', texto: p.objetivos });
    const ant = ANTECEDENTES_LABELS.map(([k, l]) => [l, p.antecedentes?.[k] ?? ''] as [string, string]).filter(([, v]) => v);
    if (ant.length) secciones.push({ titulo: 'Antecedentes', pares: ant });

    if (med.length) {
      const ultima = med.at(-1)!;
      const cls = clasificaciones(ultima, p);
      secciones.push({
        titulo: 'Composición corporal',
        tablas: [
          {
            titulo: 'Mediciones',
            cabecera: ['Fecha', 'Peso', 'Grasa %', 'Músculo %', 'Agua kg', 'Visceral', 'Cintura m', 'Cadera m', 'Cint./cad.'],
            filas: med.map((m) => [fFecha(m.fecha), fNum(m.peso), fNum(m.grasa_pct), fNum(m.masa_muscular_pct), fNum(m.agua_kg), fNum(m.grasa_visceral, 0), fNum(m.cintura_m, 2, true), fNum(m.cadera_m, 2, true), fNum(indices(m, p).find((i) => i.clave === 'icc')?.valor, 2)]),
            alinearDerecha: [1, 2, 3, 4, 5, 6, 7, 8],
          },
          {
            titulo: `Índices · ${fFecha(ultima.fecha)}`,
            cabecera: ['Índice', 'Valor', 'Cálculo', 'Clasificación'],
            filas: [
              ...([['Masa muscular', ultima.masa_muscular_pct, cls.musculo], ['Grasa corporal', ultima.grasa_pct, cls.grasa]] as const)
                .filter(([, v]) => v != null)
                .map(([n, v, c]) => [n, `${fNum(v)} %`, 'balanza', c ? `${c.nivel} · rango normal ${fNum(c.normal[0])}–${fNum(c.normal[1])} %` : '']),
              ...indices(ultima, p).map((i) => [i.nombre, `${fNum(i.valor, 2)} ${i.unidad}`.trim(), i.formula, i.clave === 'imc' ? i.referencia ?? '' : '']),
            ],
            alinearDerecha: [1],
          },
        ],
        graficos: PARA_CLINICA.map((k) => ({ titulo: METRICAS[k].nombre, unidad: METRICAS[k].unidad, dec: METRICAS[k].dec, datos: serie(med, p, k) })).filter((g) => g.datos.length > 1),
      });
    }

    if (lbs.length) {
      secciones.push({
        titulo: 'Laboratorios',
        tablas: lbs.map((l) => ({
          titulo: `${fFecha(l.fecha)}${l.laboratorio ? ` · ${l.laboratorio}` : ''}`,
          cabecera: ['Analito', 'Valor', 'Unidad', 'Referencia', 'Estado'],
          filas: todosLosResultados(l).map((r) => [
            r.analito, fNum(r.valor, 2), r.unidad ?? '',
            r.ref_min != null && r.ref_max != null ? `${fNum(r.ref_min, 2)}–${fNum(r.ref_max, 2)}` : r.ref_min != null ? `≥ ${fNum(r.ref_min, 2)}` : r.ref_max != null ? `≤ ${fNum(r.ref_max, 2)}` : '',
            estado(r) ?? '',
          ]),
          alinearDerecha: [1],
        })),
      });
    }

    if (cons.length) {
      secciones.push({
        titulo: 'Evolución',
        pares: cons.flatMap((c) => {
          const partes = [c.relato && `Relato: ${c.relato}`, c.observaciones && `Observaciones: ${c.observaciones}`, c.indicaciones && `Acuerdos: ${c.indicaciones}`, c.proximo_control && `Próximo control: ${fFecha(c.proximo_control)}`].filter(Boolean);
          return [[`${fFecha(c.fecha)} · ${c.tipo}`, partes.join('\n')] as [string, string]];
        }),
      });
    }

    return {
      titulo: nombreCompleto(p),
      subtitulo: `Historia clínica · emitida el ${hoy}`,
      secciones,
      pie: [`${aj.profesional} · Nutrición · ${aj.matricula}`, 'Documento confidencial. Contiene datos de salud protegidos (Ley 25.326 y Ley 26.529).'],
      archivo: `historia-clinica-${slug}`,
    };
  }

  // Informe para la persona: sin índices poblacionales, sin rangos ni etiquetas de categorización.
  if (p.objetivos) secciones.push({ titulo: 'Tus objetivos', texto: p.objetivos });
  if (med.length) {
    const prim = med[0], ult = med.at(-1)!;
    const filas = PARA_PACIENTE.map((k) => {
      const s = serie(med, p, k);
      if (!s.length) return null;
      const a = s[0].valor, b = s.at(-1)!.valor;
      const dec = METRICAS[k].dec;
      const d = Math.round((b - a) * 10 ** dec) / 10 ** dec;
      const fijo = METRICAS[k].unidad === 'm';
      return [METRICAS[k].nombre, `${fNum(a, dec, fijo)} ${METRICAS[k].unidad}`, `${fNum(b, dec, fijo)} ${METRICAS[k].unidad}`, s.length > 1 ? `${d > 0 ? '+' : d < 0 ? '−' : ''}${fNum(Math.abs(d), dec, fijo)}` : ''];
    }).filter((f): f is string[] => f !== null);
    secciones.push({
      titulo: 'Cómo venís',
      texto: med.length > 1 ? `Comparación entre la primera medición (${fFecha(prim.fecha)}) y la última (${fFecha(ult.fecha)}). Los números acompañan; no son el centro.` : `Medición del ${fFecha(ult.fecha)}.`,
      tablas: [{ cabecera: ['', 'Inicio', 'Hoy', 'Cambio'], filas, alinearDerecha: [1, 2, 3] }],
      graficos: PARA_PACIENTE.map((k) => ({ titulo: METRICAS[k].nombre, unidad: METRICAS[k].unidad, dec: METRICAS[k].dec, datos: serie(med, p, k) })).filter((g) => g.datos.length > 1),
    });
  }
  const ultCons = cons.at(-1);
  if (ultCons?.indicaciones) secciones.push({ titulo: 'Lo que acordamos', texto: ultCons.indicaciones + (ultCons.proximo_control ? `\n\nPróximo encuentro: ${fFecha(ultCons.proximo_control)}` : '') });

  return {
    titulo: nombreCompleto(p),
    subtitulo: `Tu evolución · ${hoy}`,
    secciones,
    pie: [`${aj.profesional} · Nutrición · ${aj.matricula}`, `${aj.sitio} · ${aj.instagram}`],
    archivo: `evolucion-${slug}`,
  };
}
