import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { reactivarPaciente } from '../lib/borrar';
import { edad } from '../lib/calc';
import { useRow, useRows } from '../lib/db';
import { fFecha, fHora, nombreCompleto, waLink } from '../lib/format';
import type { Consulta, Laboratorio, Medicion, Turno } from '../lib/types';
import { ConsultaForm } from '../components/forms/ConsultaForm';
import { ImportarBalanza } from '../components/forms/ImportarBalanza';
import { LaboratorioForm } from '../components/forms/LaboratorioForm';
import { MedicionForm } from '../components/forms/MedicionForm';
import { PacienteForm } from '../components/forms/PacienteForm';
import { TurnoForm } from '../components/forms/TurnoForm';
import { Tabs, Vacio } from '../components/ui';
import { MenuExportar } from '../components/MenuExportar';
import { Composicion } from './paciente/Composicion';
import { Consultas, Historia } from './paciente/Historia';
import { Laboratorios } from './paciente/Laboratorios';
import { Resumen } from './paciente/Resumen';

type Tab = 'resumen' | 'historia' | 'consultas' | 'composicion' | 'laboratorios' | 'turnos';
type Modal =
  | { t: 'ficha' } | { t: 'consulta'; c?: Consulta } | { t: 'medicion'; m?: Medicion }
  | { t: 'importar' } | { t: 'lab'; l?: Laboratorio } | { t: 'turno'; x?: Turno } | null;

export default function Paciente() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { row: p, cargando } = useRow('pacientes', id);
  const { rows: consultas } = useRows('consultas', { paciente_id: id });
  const { rows: mediciones } = useRows('mediciones', { paciente_id: id });
  const { rows: labs } = useRows('laboratorios', { paciente_id: id });
  const { rows: turnos } = useRows('turnos', { paciente_id: id });
  const [tab, setTab] = useState<Tab>('resumen');
  const [modal, setModal] = useState<Modal>(null);
  const cerrar = () => setModal(null);

  if (!p) return cargando ? null : <Vacio titulo="No encontramos esta historia clínica" accion={<Link className="btn" to="/pacientes">Volver a pacientes</Link>} />;

  const e = edad(p.fecha_nacimiento);
  const accionTab: Record<Tab, { label: string; fn: () => void } | null> = {
    resumen: { label: 'Nueva consulta', fn: () => setModal({ t: 'consulta' }) },
    historia: { label: 'Editar ficha', fn: () => setModal({ t: 'ficha' }) },
    consultas: { label: 'Nueva consulta', fn: () => setModal({ t: 'consulta' }) },
    composicion: { label: 'Nueva medición', fn: () => setModal({ t: 'medicion' }) },
    laboratorios: { label: 'Cargar laboratorio', fn: () => setModal({ t: 'lab' }) },
    turnos: { label: 'Nuevo turno', fn: () => setModal({ t: 'turno' }) },
  };
  const accion = accionTab[tab];
  const turnosOrden = [...turnos].sort((a, b) => b.inicio.localeCompare(a.inicio));

  return (
    <>
      <div className="cabecera">
        <div>
          <Link to="/pacientes" className="eyebrow" style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>← Pacientes</Link>
          <h1>{nombreCompleto(p)}</h1>
          <div className="fila small muted" style={{ marginTop: 10 }}>
            {e !== undefined && <span>{e} años</span>}
            {p.estado === 'suspendido' && <span className="chip aviso">suspendida</span>}
            {p.modalidad && <span className="chip">{p.modalidad}</span>}
            {p.telefono && <a href={waLink(p.telefono, `Hola ${p.nombre}, `)} target="_blank" rel="noopener">WhatsApp</a>}
            {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
          </div>
        </div>
        <div className="fila">
          {tab === 'composicion' && <button className="btn sec" onClick={() => setModal({ t: 'importar' })}>Importar balanza</button>}
          {accion && <button className="btn" onClick={accion.fn}>{accion.label}</button>}
          <MenuExportar paciente={p} consultas={consultas} mediciones={mediciones} labs={labs} />
        </div>
      </div>

      {p.estado === 'suspendido' && (
        <div className="aviso-modo">
          <span><strong>Historia clínica suspendida.</strong> No aparece en la lista ni en la agenda. Podés consultarla y exportarla igual.</span>
          <button className="btn chico" onClick={() => reactivarPaciente(p)}>Reactivar</button>
        </div>
      )}

      <Tabs<Tab>
        activo={tab}
        onChange={setTab}
        items={[
          { id: 'resumen', label: 'Resumen' },
          { id: 'historia', label: 'Historia clínica' },
          { id: 'consultas', label: `Consultas · ${consultas.length}` },
          { id: 'composicion', label: `Composición · ${mediciones.length}` },
          { id: 'laboratorios', label: `Laboratorios · ${labs.length}` },
          { id: 'turnos', label: 'Turnos' },
        ]}
      />

      {tab === 'resumen' && <Resumen p={p} mediciones={mediciones} consultas={consultas} labs={labs} />}
      {tab === 'historia' && <Historia p={p} onEditar={() => setModal({ t: 'ficha' })} onBorrado={() => navegar('/pacientes')} />}
      {tab === 'consultas' && <Consultas consultas={consultas} onNueva={() => setModal({ t: 'consulta' })} onEditar={(c) => setModal({ t: 'consulta', c })} />}
      {tab === 'composicion' && (
        <Composicion p={p} mediciones={mediciones} onNueva={() => setModal({ t: 'medicion' })} onImportar={() => setModal({ t: 'importar' })} onEditar={(m) => setModal({ t: 'medicion', m })} />
      )}
      {tab === 'laboratorios' && <Laboratorios labs={labs} onNuevo={() => setModal({ t: 'lab' })} onEditar={(l) => setModal({ t: 'lab', l })} />}
      {tab === 'turnos' && (
        <div className="tarjeta">
          {turnosOrden.length ? (
            <div className="scroll-x"><table className="tabla">
              <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Modalidad</th><th>Estado</th></tr></thead>
              <tbody>
                {turnosOrden.map((t) => (
                  <tr key={t.id} className="clic" onClick={() => setModal({ t: 'turno', x: t })}>
                    <td>{fFecha(t.inicio)}</td><td className="mono">{fHora(t.inicio)}</td><td>{t.tipo}</td><td>{t.modalidad}</td><td><span className="chip">{t.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          ) : <Vacio titulo="Sin turnos" accion={<button className="btn" onClick={() => setModal({ t: 'turno' })}>Agendar turno</button>} />}
        </div>
      )}

      {modal?.t === 'ficha' && <PacienteForm inicial={p} onClose={cerrar} />}
      {modal?.t === 'consulta' && <ConsultaForm pacienteId={p.id} inicial={modal.c} onClose={cerrar} />}
      {modal?.t === 'medicion' && <MedicionForm paciente={p} inicial={modal.m} onClose={cerrar} />}
      {modal?.t === 'importar' && <ImportarBalanza paciente={p} existentes={mediciones} onClose={cerrar} />}
      {modal?.t === 'lab' && <LaboratorioForm paciente={p} inicial={modal.l} onClose={cerrar} />}
      {modal?.t === 'turno' && <TurnoForm pacienteId={p.id} inicial={modal.x} onClose={cerrar} />}
    </>
  );
}
