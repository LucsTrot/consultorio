import { useEffect, useState } from 'react';

/** Datos fijos del Manual de Marca v3, editables desde Ajustes. */
export interface Ajustes {
  profesional: string;
  matricula: string;
  sitio: string;
  mail: string;
  whatsapp: string;
  instagram: string;
  consultorio: string;
  duracion_turno: number;
  aviso_horas_antes: number;
  plantilla_turno: string;
  plantilla_control: string;
}

export const AJUSTES_DEFAULT: Ajustes = {
  profesional: 'Lic. María Sol Cardacci',
  matricula: 'M.N. 14246',
  sitio: 'solcardaccinutricion.com',
  mail: 'sol.cardacci@hotmail.com',
  whatsapp: '11 6719-5241',
  instagram: '@solcardacci.nutricion',
  consultorio: 'Av. de Mayo 656, 2.º C, Ramos Mejía',
  duracion_turno: 45,
  aviso_horas_antes: 24,
  plantilla_turno:
    'Hola {nombre}, te escribo para recordarte la consulta del {dia} a las {hora} ({modalidad}). Si necesitás moverla, avisame por acá. ¡Nos vemos! Sol',
  plantilla_control:
    'Hola {nombre}, ¿cómo venís? Ya pasó un tiempo desde la última consulta y quería saber cómo estás. Si querés coordinar un control, escribime. Sol',
};

const CLAVE = 'consultorio.ajustes';

export function leerAjustes(): Ajustes {
  try {
    return { ...AJUSTES_DEFAULT, ...JSON.parse(localStorage.getItem(CLAVE) ?? '{}') };
  } catch {
    return AJUSTES_DEFAULT;
  }
}

export function useAjustes() {
  const [a, setA] = useState<Ajustes>(leerAjustes);
  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(a));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [a]);
  return [a, setA] as const;
}

export function completarPlantilla(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
