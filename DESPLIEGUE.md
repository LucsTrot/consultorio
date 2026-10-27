# Despliegue paso a paso

Plataforma del consultorio de la Lic. María Sol Cardacci.
Son dos partes que se conectan entre sí:

| Parte | Qué es | Dónde vive | Paquete |
|---|---|---|---|
| **Backend** | Guarda y lee los datos | Planilla de Google de Sol + Apps Script | `consultorio-appscript.zip` |
| **App** | Lo que Sol abre en el celular y la compu | GitHub Pages | `consultorio-github.zip` |

Primero va la planilla, porque la app necesita su dirección.

---

## Parte 1 · La planilla y el Apps Script

Todo con la **cuenta de Google de Sol**. La planilla, la carpeta de laboratorios y el script quedan a su nombre.

1. **Crear la planilla.** En Google Drive, *Nuevo → Hojas de cálculo*. Nombre: *Consultorio · Historias clínicas*. No compartirla con nadie.
2. **Abrir el editor.** En la planilla: *Extensiones → Apps Script*.
3. **Pegar el backend.** Borrar todo lo que haya en `Código.gs` y pegar el contenido completo de `Code.gs`. Guardar (ícono del disquete).
4. **Pegar la configuración.**
   - Engranaje de la izquierda (*Configuración del proyecto*) → tildar *Mostrar el archivo de manifiesto "appsscript.json" en el editor*.
   - Volver al editor (ícono `< >`), abrir `appsscript.json`, reemplazar todo su contenido por el del paquete y guardar.
5. **Configurar.** Volver a la pestaña de la planilla y recargarla (F5). Aparece el menú **Consultorio**.
   - *Consultorio → Configurar (primera vez)*.
   - Google pide permisos: *Revisar permisos* → elegir la cuenta de Sol → *Configuración avanzada* → *Ir a… (no seguro)* → *Permitir*. Ese aviso aparece porque el script es propio y no está publicado en Google; es normal.
   - Elegir la **contraseña de la app** (mínimo 8 caracteres). Es la que Sol va a usar para entrar.
   - Se crean las 6 hojas y la carpeta privada *Consultorio · Laboratorios* en el Drive de Sol.
6. **Publicar el script.** En el editor de Apps Script:
   - *Implementar → Nueva implementación*.
   - Engranaje junto a *Seleccionar tipo* → **Aplicación web**.
   - *Ejecutar como:* **Yo**. *Quién tiene acceso:* **Cualquier usuario**.
   - *Implementar* → copiar la **URL de la aplicación web** (termina en `/exec`). La vas a usar en la parte 2.
7. **Seguridad.** Activar la verificación en dos pasos en la cuenta de Google de Sol: ahí quedan las historias clínicas.

---

## Parte 2 · La app en GitHub Pages

1. **Crear el repo.** En GitHub: *New repository*. Nombre sugerido: `consultorio`. Con cuenta gratuita tiene que ser **público** para usar Pages (es seguro: el código no tiene contraseñas ni datos).
2. **Subir los archivos.** Descomprimir `consultorio-github.zip` y subir **todo su contenido** a la rama `main`.
   - Desde la web: *Add file → Upload files*, arrastrar todo y *Commit changes*.
   - Ojo con las carpetas que empiezan con punto (`.github`, `.gitignore`, `.env.example`): en Mac están ocultas, se muestran con **Cmd + Shift + .** en Finder. Sin `.github/workflows/deploy.yml` no se publica.
3. **Cargar la dirección de la planilla.** En el repo: *Settings → Secrets and variables → Actions* → pestaña **Variables** → *New repository variable*.
   - *Name:* `VITE_SHEETS_URL`
   - *Value:* la URL `/exec` de la parte 1.
4. **Activar Pages.** *Settings → Pages → Source:* **GitHub Actions**.
5. **Publicar.** Pestaña *Actions* → *Publicar en GitHub Pages* → *Run workflow*. Tarda un par de minutos; cuando aparece el tilde verde, la app está en `https://TU-USUARIO.github.io/consultorio/`.
   - Si falta la variable del paso 3, el workflow se corta con un aviso. No se publica nada roto.

---

## Parte 3 · Probar e instalar

1. Abrir la dirección de la app, entrar con la contraseña y crear una persona de prueba.
2. Cargar una medición y exportar un PDF.
3. Abrir la planilla: tienen que aparecer las filas en las hojas *pacientes* y *mediciones*.
4. Archivar la persona de prueba (queda marcada en la planilla, no se borra).
5. Instalar en el celular de Sol:
   - **Android (Chrome):** menú ⋮ → *Instalar app*.
   - **iPhone (Safari):** botón Compartir → *Agregar a pantalla de inicio*.
6. En la compu (Chrome o Edge): ícono de instalar a la derecha de la barra de direcciones.

---

## Después: cómo actualizar

| Qué cambia | Qué hacer |
|---|---|
| La app (cualquier archivo del repo) | Subir el cambio a `main`. Se publica sola en un par de minutos. |
| El `Code.gs` | Pegar el nuevo en el editor → *Implementar → Administrar implementaciones* → lápiz → *Versión: Nueva versión* → *Implementar*. La URL no cambia y no hay que tocar GitHub. |
| Las columnas de la planilla (cuando cambie el `Code.gs`) | Después de actualizarlo: *Consultorio → Configurar (primera vez)* otra vez. Reescribe los encabezados; no toca la contraseña ni los datos. |
| La contraseña | En la planilla: *Consultorio → Cambiar contraseña*. Cierra todas las sesiones abiertas. |
| Un celular perdido | *Consultorio → Cerrar todas las sesiones*. |

## Opcional: dominio propio

Para usar `consultorio.solcardaccinutricion.com`:
1. En el DNS del dominio, crear un registro **CNAME** `consultorio` → `TU-USUARIO.github.io`.
2. En el repo: *Settings → Pages → Custom domain* → `consultorio.solcardaccinutricion.com` → *Save* → tildar *Enforce HTTPS* cuando se habilite.
