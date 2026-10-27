import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { edad } from '../lib/calc';
import { useRows } from '../lib/db';
import { fFecha, fHora, nombreCompleto } from '../lib/format';
import { PacienteForm } from '../components/forms/PacienteForm';
import { Cabecera, Vacio } from '../components/ui';

export default function Pacientes() {
  const nav = useNavigate();
  const { rows: pacientes, cargando } = useRows('pacientes');
  const { rows: consultas } = useRows('consultas');
  const { rows: turnos } = useRows('turnos');
  const [q, setQ] = useState('');
  const [nuevo, setNuevo] = useState(false);

  const lista = useMemo(() => {
    const ahora = new Date().toISOString();
    const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    return pacientes
      .filter((p) => !q || norm(`${p.nombre} ${p.apellido} ${p.dni ?? ''} ${p.telefono ?? ''}`).includes(norm(q)))
      .map((p) => ({
        p,
        ultima: consultas.filter((c) => c.paciente_id === p.id).map((c) => c.fecha).sort().at(-1),
        proximo: turnos.filter((t) => t.paciente_id === p.id && t.inicio >= ahora.slice(0, 16) && !['cancelado', 'ausente'].includes(t.estado)).map((t) => t.inicio).sort()[0],
      }))
      .sort((a, b) => a.p.apellido.localeCompare(b.p.apellido));
  }, [pacientes, consultas, turnos, q]);

  return (
    <>
      <Cabecera eyebrow="02 · Historias clínicas" titulo="Pacientes">
        <button className="btn" onClick={() => setNuevo(true)}>Nueva persona</button>
      </Cabecera>
      <div className="tarjeta">
        <input type="search" placeholder="Buscar por nombre, DNI o teléfono" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 14, maxWidth: 420 }} aria-label="Buscar" />
        {!cargando && !pacientes.length ? (
          <Vacio titulo="Todavía no hay historias clínicas" texto="Cargá la primera persona para empezar su historia clínica." accion={<button className="btn" onClick={() => setNuevo(true)}>Nueva persona</button>} />
        ) : (
          <div className="scroll-x">
            <table className="tabla">
              <thead><tr><th>Nombre</th><th className="num">Edad</th><th>Modalidad</th><th>Última consulta</th><th>Próximo turno</th></tr></thead>
              <tbody>
                {lista.map(({ p, ultima, proximo }) => (
                  <tr key={p.id} className="clic" onClick={() => nav(`/pacientes/${p.id}`)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && nav(`/pacientes/${p.id}`)}>
                    <td><strong>{nombreCompleto(p)}</strong>{p.motivo_consulta && <div className="small muted" style={{ maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.motivo_consulta}</div>}</td>
                    <td className="num">{edad(p.fecha_nacimiento) ?? '—'}</td>
                    <td><span className="chip">{p.modalidad ?? '—'}</span></td>
                    <td>{fFecha(ultima)}</td>
                    <td>{proximo ? `${fFecha(proximo)} · ${fHora(proximo)}` : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {nuevo && <PacienteForm onClose={() => setNuevo(false)} onGuardado={(p) => nav(`/pacientes/${p.id}`)} />}
    </>
  );
}
