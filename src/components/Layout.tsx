import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import lockup from '../assets/marca/lockup-horizontal-inverso.svg';
import { repo, useRows } from '../lib/db';
import { salir } from '../lib/db/sheets';
import { Icono, type NombreIcono } from './Icono';

const NAV: { to: string; icono: NombreIcono; label: string; corto?: string; end?: boolean; badge?: boolean }[] = [
  { to: '/', icono: 'inicio', label: 'Inicio', end: true },
  { to: '/pacientes', icono: 'pacientes', label: 'Pacientes' },
  { to: '/agenda', icono: 'agenda', label: 'Agenda' },
  { to: '/recordatorios', icono: 'recordatorios', label: 'Recordatorios', corto: 'Avisos', badge: true },
  { to: '/ajustes', icono: 'ajustes', label: 'Ajustes' },
];

/** Hay sesión que cerrar con la planilla conectada y en la demo; en modo local de prueba no. */
const puedeSalir = repo.modo === 'sheets' || import.meta.env.MODE === 'demo';

/** Avisos del sistema mientras la app está abierta (o instalada y en segundo plano). */
function useAvisos() {
  const { rows } = useRows('recordatorios');
  useEffect(() => {
    const revisar = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      let avisados: string[] = [];
      try { avisados = JSON.parse(sessionStorage.getItem('avisados') ?? '[]'); } catch { /* sin storage */ }
      const ahora = Date.now();
      rows
        .filter((r) => !r.hecho && new Date(r.fecha).getTime() <= ahora && !avisados.includes(r.id))
        .forEach((r) => {
          navigator.serviceWorker?.ready
            .then((sw) => sw.showNotification('Recordatorio', { body: r.mensaje, tag: r.id, icon: 'icons/icon-192.png' }))
            .catch(() => new Notification('Recordatorio', { body: r.mensaje, tag: r.id }));
          avisados.push(r.id);
        });
      try { sessionStorage.setItem('avisados', JSON.stringify(avisados)); } catch { /* sin storage */ }
    };
    revisar();
    const t = setInterval(revisar, 60_000);
    return () => clearInterval(t);
  }, [rows]);
  return rows.filter((r) => !r.hecho && new Date(r.fecha).getTime() <= Date.now()).length;
}

/** Cualquier guardado que falle (sin conexión, sesión vencida) se avisa acá. */
function useErrores() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    const f = (e: PromiseRejectionEvent) => {
      const m = e.reason instanceof Error ? e.reason.message : '';
      if (m) { setMsg(m); e.preventDefault(); }
    };
    window.addEventListener('unhandledrejection', f);
    return () => window.removeEventListener('unhandledrejection', f);
  }, []);
  return [msg, () => setMsg('')] as const;
}

export function Layout() {
  const pendientes = useAvisos();
  const [error, cerrarError] = useErrores();
  return (
    <div className="app">
      <aside className="barra">
        <div className="barra-marca">
          <img src={lockup} alt="Lic. María Sol Cardacci · Lic. en Nutrición" width={376} height={52} />
        </div>
        <nav className="nav" aria-label="Secciones">
          {NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? 'activo' : '')}>
              <Icono nombre={i.icono} />
              <span className="largo">{i.label}</span>
              <span className="corto" style={{ display: 'none' }}>{i.corto ?? i.label}</span>
              {i.badge && pendientes > 0 && <span className="badge" aria-label={`${pendientes} pendientes`}>{pendientes}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="barra-pie">
          {puedeSalir && (
            <button type="button" className="salir" onClick={() => salir()}>
              <Icono nombre="salir" />
              <span>Salir</span>
            </button>
          )}
          <span className="barra-estado">{repo.modo === 'local' ? 'Modo local · este navegador' : 'Planilla de Google'}</span>
        </div>
      </aside>
      {/* En el celular la barra lateral pasa abajo: arriba queda una franja con la marca. */}
      <header className="marca-movil">
        <img src={lockup} alt="Lic. María Sol Cardacci · Lic. en Nutrición" width={376} height={52} />
        {puedeSalir && (
          <button type="button" className="salir-movil" onClick={() => salir()} aria-label="Salir">
            <Icono nombre="salir" tamano={22} />
          </button>
        )}
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      {error && <div className="toast" role="alert"><span>{error}</span><button onClick={cerrarError}>Cerrar</button></div>}
    </div>
  );
}
