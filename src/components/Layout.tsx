import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import lockup from '../assets/marca/lockup-horizontal-inverso.svg';
import { repo, useRows } from '../lib/db';

const NAV: { to: string; n: string; label: string; corto?: string; end?: boolean; badge?: boolean }[] = [
  { to: '/', n: '01', label: 'Inicio', end: true },
  { to: '/pacientes', n: '02', label: 'Pacientes' },
  { to: '/agenda', n: '03', label: 'Agenda' },
  { to: '/recordatorios', n: '04', label: 'Recordatorios', corto: 'Avisos', badge: true },
  { to: '/ajustes', n: '05', label: 'Ajustes' },
];

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
              <span className="n">{i.n}</span>
              <span className="largo">{i.label}</span>
              <span className="corto" style={{ display: 'none' }}>{i.corto ?? i.label}</span>
              {i.badge && pendientes > 0 && <span className="badge" aria-label={`${pendientes} pendientes`}>{pendientes}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="barra-pie">
          {repo.modo === 'local' ? 'Modo local · este navegador' : 'Planilla de Google'}
        </div>
      </aside>
      {/* En el celular la barra lateral pasa abajo: arriba queda una franja con la marca. */}
      <header className="marca-movil">
        <img src={lockup} alt="Lic. María Sol Cardacci · Lic. en Nutrición" width={376} height={52} />
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      {error && <div className="toast" role="alert"><span>{error}</span><button onClick={cerrarError}>Cerrar</button></div>}
    </div>
  );
}
