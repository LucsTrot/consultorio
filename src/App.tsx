import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { ConfirmacionHost } from './components/Confirmacion';
import { Layout } from './components/Layout';
import { repo } from './lib/db';
import { iniciarSync, sesion } from './lib/db/sheets';
import Agenda from './pages/Agenda';
import Ajustes from './pages/Ajustes';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Paciente from './pages/Paciente';
import Pacientes from './pages/Pacientes';
import Recordatorios from './pages/Recordatorios';

export default function App() {
  const conPlanilla = repo.modo === 'sheets';
  // La demo publicada también muestra la pantalla de ingreso (con cualquier contraseña) para poder verla.
  const demo = import.meta.env.MODE === 'demo';
  const [token, setToken] = useState(() => (conPlanilla ? sesion.token() : demo ? null : 'local'));

  useEffect(() => {
    if (!conPlanilla) return;
    const f = () => setToken(sesion.token());
    window.addEventListener('consultorio:sesion', f);
    return () => window.removeEventListener('consultorio:sesion', f);
  }, [conPlanilla]);

  useEffect(() => {
    if (!demo) return;
    const f = () => setToken(null);
    window.addEventListener('consultorio:salir', f);
    return () => window.removeEventListener('consultorio:salir', f);
  }, [demo]);

  useEffect(() => {
    if (conPlanilla && token) iniciarSync();
  }, [conPlanilla, token]);

  if (!token) return <Login onDemo={demo ? () => setToken('demo') : undefined} />;

  return (
    <>
    <ConfirmacionHost />
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="pacientes" element={<Pacientes />} />
          <Route path="pacientes/:id" element={<Paciente />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="recordatorios" element={<Recordatorios />} />
          <Route path="ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </HashRouter>
    </>
  );
}
