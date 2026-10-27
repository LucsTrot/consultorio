# Consultorio · Lic. María Sol Cardacci

> **Para publicarla:** seguí [DESPLIEGUE.md](DESPLIEGUE.md).

PWA de gestión del consultorio: historias clínicas, composición corporal (bioimpedancia + antropometría), laboratorios, agenda y recordatorios, con exportación a Excel, Word y PDF.

Stack: React + Vite + TypeScript · Google Sheets + Apps Script como backend · GitHub Pages.

## Correr en local

```bash
npm install
npm run dev
```

Sin variables de entorno arranca en **modo local**: los datos viven en el navegador. Sirve para probar (en Inicio hay un botón para cargar personas ficticias). **No usar con pacientes reales en modo local.**

## Conectar la planilla (una sola vez)

Todo se hace **con la cuenta de Google de Sol**, no con la de Lucas: la planilla, la carpeta de laboratorios y el script quedan a su nombre.

1. Crear una planilla nueva: *Consultorio · Historias clínicas*. No compartirla con nadie.
2. Extensiones → Apps Script. Pegar `Code.gs` completo (viene en el paquete de Apps Script, aparte de este repo).
3. En el editor: Configuración del proyecto (engranaje) → tildar *Mostrar el archivo de manifiesto*. Abrir `appsscript.json` y pegar el del paquete de Apps Script.
4. Volver a la planilla y recargarla. Aparece el menú **Consultorio** → *Configurar (primera vez)* → autorizar → elegir la contraseña de la app (mínimo 8 caracteres). Se crean las 6 hojas y la carpeta privada *Consultorio · Laboratorios* en Drive.
5. En Apps Script: Implementar → Nueva implementación → tipo *Aplicación web* → Ejecutar como **Yo** · Acceso **Cualquier usuario**. Copiar la URL.

**Para actualizar el script sin que cambie la URL:** Implementar → Administrar implementaciones → lápiz sobre la implementación existente → Versión: *Nueva versión* → Implementar. Así no hay que tocar GitHub.

## Publicar en GitHub Pages

El workflow `.github/workflows/deploy.yml` construye y publica la app en cada push a `main`.

1. Subir el proyecto a un repo de GitHub (rama `main`).
2. Settings → Secrets and variables → Actions → pestaña **Variables** → *New repository variable*: `VITE_SHEETS_URL` = la URL `/exec` del paso anterior.
3. Settings → Pages → Source: **GitHub Actions**.
4. Pestaña Actions → *Publicar en GitHub Pages* → *Run workflow* (o hacer un push). En un par de minutos queda en `https://<usuario>.github.io/<repo>/`.

Si falta la variable, el workflow se corta a propósito: así nunca se publica en modo local.

**Repo público o privado:** con una cuenta gratuita de GitHub, Pages solo funciona con repos públicos. Es seguro igual: el código no tiene contraseñas ni datos, y las historias clínicas viven en la planilla de Sol detrás del login. Con GitHub Pro el repo puede ser privado. En los dos casos la URL del sitio es accesible para quien la tenga; lo que protege es la contraseña.

**Dominio propio (opcional):** Settings → Pages → Custom domain → `consultorio.solcardaccinutricion.com`, y en el DNS del dominio un registro CNAME `consultorio` → `<usuario>.github.io`.

### Cómo queda protegido

- La URL del script no devuelve nada sin sesión. La sesión se obtiene con la contraseña (guardada solo como hash SHA-256 con sal), dura 30 días por dispositivo y se puede cortar en todos desde el menú *Consultorio → Cerrar todas las sesiones*.
- 5 intentos fallidos bloquean el ingreso 15 minutos.
- En el dispositivo solo queda el token de sesión. Los datos clínicos viven en memoria mientras la app está abierta.
- Los PDF de laboratorio van a la carpeta privada y los entrega el script solo con sesión válida; nunca hay links públicos.
- **Suspender** a una persona la saca de la lista y de la agenda (cancela sus turnos futuros) sin tocar su historia clínica. Se reactiva cuando vuelve.
- **Borrar** es definitivo y siempre pide confirmación en una ventana. Borrar una persona exige escribir su apellido y se lleva toda su historia clínica; los informes adjuntos van a la papelera de Drive (se vacía sola a los 30 días). La Ley 26.529 pide conservar la historia clínica al menos 10 años: para abandonos, lo indicado es suspender.
- Mientras se guarda, el panel queda bloqueado hasta cerrarse: un doble clic no duplica registros.
- Recomendado: verificación en dos pasos en la cuenta de Google de Sol.

### Sincronización

Celular y compu leen la misma planilla. La app se resincroniza al volver a abrirla y cada 2 minutos. Cada guardado tarda alrededor de un segundo (es lo que tarda Apps Script).

## Qué hace cada parte

| Carpeta | Contenido |
|---|---|
| `src/lib/types.ts` | Modelo de datos (coincide 1:1 con las columnas de cada hoja del Apps Script) |
| `src/lib/db/` | Capa de datos: `repo.ts` (interfaz), `local.ts` (navegador), `sheets.ts` (planilla) |
| `src/lib/calc.ts` | Índices: masa grasa/libre de grasa, IMLG, IMG, masa muscular en kg, agua %, relación cintura/cadera, Mifflin-St Jeor, Katch-McArdle e IMC |
| `src/lib/referencias.ts` | Rangos bajo / normal / alto de masa muscular y grasa por sexo y edad, y categorías de IMC (OMS). Uso interno |
| `src/lib/labs.ts` | Catálogo de analitos con rangos orientativos por sexo + HOMA-IR, TG/HDL, CT/HDL |
| `src/lib/scaleImport.ts` | Importador de exportaciones de la app de la balanza (CSV/Excel), con mapeo automático de columnas |
| `src/lib/export/` | Excel, Word y PDF. Dos versiones: historia clínica completa e informe para la persona |
| `src/styles/app.css` | Tokens de color y tipografía, con los contrastes verificados en el encabezado |
| `scripts/pdf_fonts.py` | Regenera las fuentes de marca embebidas en el PDF |
| `scripts/marca_export.py` | Regenera las imágenes de marca del PDF y el Word |

## Balanza Microfast U-CF625BC-NG

Dos formas de cargar:

- **A mano**: el formulario sigue el orden de la pantalla de la balanza.
- **Importar**: exportar el historial desde la app del celular (CSV o Excel) y subirlo en Composición → Importar balanza. Las columnas se reconocen solas (español o inglés); si alguna no, se asigna en la misma pantalla. Las fechas ya cargadas se saltean.

## Unidades de medición

Masa muscular en **%**, agua en **kg**, cintura y cadera en **metros** (0,82), talla en cm. Si en cintura o cadera se escribe un número mayor a 3, el formulario avisa que van en metros.

## Clasificaciones (solo para la profesional)

- **Masa muscular y grasa corporal** se muestran en color según el rango para sexo y edad: ámbar bajo, verde normal, rojo alto. Siempre con la palabra al lado, no solo el color.
- **IMC** con su categoría OMS (bajo peso, normal, sobrepeso, obesidad), al final de la medición y de la pestaña Composición.
- Aparecen en pantalla, en la historia clínica exportada y en el Excel. **Nunca** en el informe para la persona.
- Los rangos de masa muscular están pensados para músculo esquelético. Si el manual de la balanza trae su propia tabla, se reemplazan los números en `src/lib/referencias.ts`.

## Informe para la persona

Sin IMC, sin rangos de referencia, sin etiquetas de categorización y sin laboratorios. Ordena masa muscular y medidas antes que el peso. Lleva matrícula al pie.

## Datos de salud

- El service worker cachea solo la app, nunca datos clínicos.
- Los recordatorios avisan con notificaciones del sistema mientras la app está abierta o instalada. Para avisos con la app cerrada, el siguiente paso es un activador por tiempo en Apps Script que mande el aviso por mail.

## Marca

| Archivo | Dónde se usa |
|---|---|
| `brand/` | Originales del kit de marca (fuente de todo lo demás) |
| `public/favicon.svg` · `public/favicon.ico` | Pestaña del navegador |
| `public/icons/` | Ícono de la app instalada (192, 512, maskable 512 y apple-touch 180), generados del `avatar-verde-1080.png` |
| `src/assets/marca/lockup-horizontal-inverso.svg` | Arriba de la barra lateral y franja superior en el celular |
| `src/assets/marca/isotipo-inverso.svg` | Panel verde del ingreso |
| `src/assets/marca/filigrana-verde.svg` | Fondo del ingreso, saliéndose por el borde |
| `src/lib/export/marcaImagenes.ts` | Isotipo inverso (banda del PDF), filigrana (primera página del PDF) y lockup horizontal (encabezado del Word), rasterizados |

Si cambia algún archivo de `brand/`, se regenera `marcaImagenes.ts` con `python3 scripts/marca_export.py`.
