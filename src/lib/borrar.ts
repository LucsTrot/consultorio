import { confirmar } from './confirmar';
import { repo } from './db';
import { fFecha, fHora, nombreCompleto } from './format';
import type { Consulta, Laboratorio, Medicion, Paciente, Recordatorio, Turno } from './types';

/**
 * Borrados con ventana de confirmación. Cada uno devuelve true si se borró.
 * La ventana queda bloqueada mientras se borra, así un doble clic no repite nada.
 */
const definitivo = 'Se borra de forma definitiva y no se puede recuperar.';

export const borrar = {
  consulta: (c: Consulta) =>
    confirmar({
      titulo: '¿Borrar esta consulta?',
      texto: `Consulta del ${fFecha(c.fecha)} (${c.tipo.toLowerCase()}). ${definitivo}`,
      accion: 'Borrar consulta', peligro: true,
      ejecutar: () => repo.remove('consultas', c.id),
    }),

  medicion: (m: Medicion) =>
    confirmar({
      titulo: '¿Borrar esta medición?',
      texto: `Medición del ${fFecha(m.fecha)}. Desaparece también de los gráficos y de los índices. ${definitivo}`,
      accion: 'Borrar medición', peligro: true,
      ejecutar: () => repo.remove('mediciones', m.id),
    }),

  laboratorio: (l: Laboratorio) =>
    confirmar({
      titulo: '¿Borrar este laboratorio?',
      texto: `Laboratorio del ${fFecha(l.fecha)} con ${l.resultados.length} resultados${l.archivo_nombre ? ' y el informe adjunto' : ''}. ${definitivo}`,
      accion: 'Borrar laboratorio', peligro: true,
      ejecutar: () => repo.remove('laboratorios', l.id),
    }),

  turno: (t: Turno, p?: Paciente) =>
    confirmar({
      titulo: '¿Borrar este turno?',
      texto: `Turno de ${nombreCompleto(p)} el ${fFecha(t.inicio)} a las ${fHora(t.inicio)}. Se borra también su recordatorio. Si la persona avisó que no viene, conviene marcarlo como cancelado en lugar de borrarlo.`,
      accion: 'Borrar turno', peligro: true,
      ejecutar: () => repo.remove('turnos', t.id),
    }),

  recordatorio: (r: Recordatorio) =>
    confirmar({
      titulo: '¿Borrar este recordatorio?',
      texto: `«${r.mensaje}», del ${fFecha(r.fecha)}. ${definitivo}`,
      accion: 'Borrar recordatorio', peligro: true,
      ejecutar: () => repo.remove('recordatorios', r.id),
    }),
};

/** Suspender: la persona sale de la lista y de la agenda, pero su historia clínica queda intacta. */
export async function suspenderPaciente(p: Paciente) {
  return confirmar({
    titulo: `¿Suspender a ${nombreCompleto(p)}?`,
    texto: 'Deja de aparecer en la lista de pacientes y en la agenda. Sus turnos futuros se cancelan. Toda su historia clínica queda guardada y se puede reactivar cuando vuelva.',
    accion: 'Suspender',
    ejecutar: async () => {
      await repo.save('pacientes', { id: p.id, estado: 'suspendido', suspendido_en: new Date().toISOString() });
      const ahora = new Date();
      const futuros = (await repo.list('turnos', { paciente_id: p.id })).filter(
        (t) => new Date(t.inicio) > ahora && (t.estado === 'agendado' || t.estado === 'confirmado'),
      );
      for (const t of futuros) {
        await repo.save('turnos', { id: t.id, estado: 'cancelado' });
        for (const r of await repo.list('recordatorios', { turno_id: t.id })) if (!r.hecho) await repo.save('recordatorios', { id: r.id, hecho: true });
      }
    },
  });
}

export async function reactivarPaciente(p: Paciente) {
  return confirmar({
    titulo: `¿Reactivar a ${nombreCompleto(p)}?`,
    texto: 'Vuelve a aparecer en la lista de pacientes y se le pueden dar turnos. Los turnos que se cancelaron al suspender no se recuperan.',
    accion: 'Reactivar',
    ejecutar: () => repo.save('pacientes', { id: p.id, estado: 'activo', suspendido_en: '' }),
  });
}

export async function borrarPaciente(p: Paciente) {
  return confirmar({
    titulo: `¿Borrar a ${nombreCompleto(p)} y toda su historia clínica?`,
    texto: 'Se borran sus datos, consultas, mediciones, laboratorios (con los informes adjuntos), turnos y recordatorios. No se puede recuperar. La ley de historia clínica (26.529) pide conservarla al menos 10 años: si es por abandono del tratamiento, lo indicado es suspender.',
    accion: 'Borrar todo', peligro: true,
    escribir: p.apellido,
    ejecutar: () => repo.removePaciente(p.id),
  });
}
