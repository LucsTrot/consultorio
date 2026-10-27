/** Íconos de línea propios (24 × 24, trazo 1,75, color del texto). */
export type NombreIcono =
  | 'inicio' | 'pacientes' | 'agenda' | 'recordatorios' | 'ajustes' | 'salir'
  | 'ojo' | 'ojo-cerrado' | 'borrar' | 'pausa' | 'reactivar';

const TRAZOS: Record<NombreIcono, React.ReactNode> = {
  inicio: (<><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9v11.5h13V9" /><path d="M10 20.5v-6h4v6" /></>),
  pacientes: (<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20.5c0-3.6 2.9-6.3 6.5-6.3s6.5 2.7 6.5 6.3" /><path d="M15.5 4.7a3.5 3.5 0 0 1 0 6.6" /><path d="M18 14.6c2.1.8 3.5 2.9 3.5 5.9" /></>),
  agenda: (<><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /><path d="M8 14h2M14 14h2M8 17h2" /></>),
  recordatorios: (<><path d="M6 9a6 6 0 0 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9" /><path d="M10.2 20.5a2 2 0 0 0 3.6 0" /></>),
  ajustes: (<><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="17" r="2" /></>),
  salir: (<><path d="M9.5 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3.5" /><path d="m15.5 16.5 4.5-4.5-4.5-4.5" /><path d="M20 12H9.5" /></>),
  ojo: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12" /><circle cx="12" cy="12" r="3" /></>),
  'ojo-cerrado': (<><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.6 3.4" /><path d="M6.3 7.3C3.9 9 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.8-1.4" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m3 3 18 18" /></>),
  borrar: (<><path d="M4 7h16" /><path d="M9.5 7V4.5h5V7" /><path d="M6 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h7.2a1.5 1.5 0 0 0 1.5-1.3L18 7" /><path d="M10 11v6M14 11v6" /></>),
  pausa: (<><circle cx="12" cy="12" r="8.5" /><path d="M10 9v6M14 9v6" /></>),
  reactivar: (<><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4v4.5H9" /></>),
};

export function Icono({ nombre, tamano = 20 }: { nombre: NombreIcono; tamano?: number }) {
  return (
    <svg
      viewBox="0 0 24 24" width={tamano} height={tamano} fill="none" stroke="currentColor"
      strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      className="icono"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
