import { useState } from 'react';
import { login } from '../lib/db/sheets';
import filigrana from '../assets/marca/filigrana-verde.svg';
import isotipo from '../assets/marca/isotipo-inverso.svg';
import { Icono } from '../components/Icono';

export default function Login({ onDemo }: { onDemo?: () => void }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ver, setVer] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    if (onDemo) return onDemo();
    try {
      await login(clave);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos ingresar.');
      setCargando(false);
    }
  };

  return (
    <div className="login">
      <div className="login-marca">
        <img src={isotipo} alt="" className="login-iso" width={72} height={72} />
        <span className="eyebrow" style={{ color: 'var(--barra-tinta-2)' }}>Consultorio</span>
        <h1 style={{ fontSize: 'clamp(34px,5vw,56px)', marginTop: 10 }}>Lic. María Sol<br />Cardacci</h1>
        <p style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', color: 'var(--acento-claro)', fontSize: 20, marginTop: 18 }}>Comer bien no es comer perfecto.</p>
      </div>
      <div className="login-lado">
      <img src={filigrana} alt="" className="login-filigrana" aria-hidden="true" />
      <form onSubmit={entrar} className="form login-form">
        <h2>Ingresar</h2>
        <div className="campo">
          <label htmlFor="clave"><span>Contraseña</span></label>
          <div className="clave">
            <input id="clave" type={ver ? 'text' : 'password'} required autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
            <button type="button" className="ver-clave" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={ver} title={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              <Icono nombre={ver ? 'ojo-cerrado' : 'ojo'} />
            </button>
          </div>
        </div>
        {error && <p role="alert" style={{ color: 'var(--alerta)', margin: 0 }}>{error}</p>}
        <div><button className="btn" disabled={cargando}>{cargando ? 'Ingresando…' : 'Ingresar'}</button></div>
        <p className="small muted" style={{ margin: 0 }}>{onDemo ? 'Demo con personas ficticias: entrá con cualquier contraseña.' : 'La sesión dura 30 días en este dispositivo.'}</p>
      </form>
      </div>
    </div>
  );
}
