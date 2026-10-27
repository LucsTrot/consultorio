import Dexie, { type Table } from 'dexie';
import type { Tabla, TablaTipo } from '../types';
import { emit, nuevoId, type Repo } from './repo';

class LocalDB extends Dexie {
  pacientes!: Table<TablaTipo['pacientes'], string>;
  consultas!: Table<TablaTipo['consultas'], string>;
  mediciones!: Table<TablaTipo['mediciones'], string>;
  laboratorios!: Table<TablaTipo['laboratorios'], string>;
  turnos!: Table<TablaTipo['turnos'], string>;
  recordatorios!: Table<TablaTipo['recordatorios'], string>;
  archivos!: Table<{ path: string; blob: Blob }, string>;
  constructor() {
    super('consultorio-cardacci');
    this.version(1).stores({
      pacientes: 'id, apellido',
      consultas: 'id, paciente_id, fecha',
      mediciones: 'id, paciente_id, fecha',
      laboratorios: 'id, paciente_id, fecha',
      turnos: 'id, paciente_id, inicio',
      recordatorios: 'id, paciente_id, turno_id, fecha',
      archivos: 'path',
    });
    // v2: masa muscular pasa a %, agua a kg, cintura y cadera a metros; se quitan otros perímetros y pliegues.
    this.version(2)
      .stores({})
      .upgrade((tx) =>
        tx.table('mediciones').toCollection().modify((m: Record<string, unknown>) => {
          const peso = m.peso as number | undefined;
          if (typeof m.masa_muscular_kg === 'number' && peso) m.masa_muscular_pct = Math.round((m.masa_muscular_kg / peso) * 1000) / 10;
          if (typeof m.agua_pct === 'number' && peso) m.agua_kg = Math.round(peso * m.agua_pct) / 100;
          if (typeof m.cintura === 'number') m.cintura_m = m.cintura / 100;
          if (typeof m.cadera === 'number') m.cadera_m = m.cadera / 100;
          ['masa_muscular_kg', 'agua_pct', 'cintura', 'cadera', 'cuello', 'brazo', 'muslo', 'pantorrilla', 'pliegues'].forEach((k) => delete m[k]);
        }),
      );
  }
}

export const localDB = new LocalDB();

export const localRepo: Repo = {
  modo: 'local',
  async list(tabla, where) {
    const t = localDB.table(tabla);
    const rows = (await t.toArray()) as TablaTipo[typeof tabla][];
    return rows.filter(
      (r) =>
        !r.eliminado_en &&
        (!where ||
          Object.entries(where).every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v)),
    );
  },
  async get(tabla, id) {
    const r = await localDB.table(tabla).get(id);
    return r && !r.eliminado_en ? r : undefined;
  },
  async save(tabla, row) {
    const ahora = new Date().toISOString();
    const t = localDB.table(tabla);
    const previo = row.id ? await t.get(row.id) : undefined;
    const final = { ...previo, ...row, id: row.id ?? nuevoId(), creado_en: previo?.creado_en ?? ahora, actualizado_en: ahora };
    await t.put(final);
    emit(tabla as Tabla);
    return final as TablaTipo[typeof tabla];
  },
  async archive(tabla, id) {
    await localDB.table(tabla).update(id, { eliminado_en: new Date().toISOString() });
    emit(tabla);
  },
  async uploadFile(path, file) {
    await localDB.archivos.put({ path, blob: file });
    return path;
  },
  async fileUrl(path) {
    const a = await localDB.archivos.get(path);
    return a ? URL.createObjectURL(a.blob) : '';
  },
};
