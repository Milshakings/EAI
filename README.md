# EvalúaAI — Piloto GovTech (Inyector Normativo + Puente Copiloto + Dashboard UTP)

Aplicación web/PWA que implementa los 3 módulos de la propuesta:

1. **Inyector Normativo**: sube una foto/escaneo (OCR en el navegador) o pega texto, y genera un
   borrador de Perfil Neuro-Psico-Educativo (Decreto 170) usando un modelo de IA **local** vía Ollama.
2. **Puente Copiloto**: mapea los informes ya firmados al formato del Formulario Único FUDEI, para
   copiarlos en minutos en vez de re-digitarlos (FUDEI no tiene API pública, así que este módulo
   prepara los campos, no los envía automáticamente).
3. **Dashboard de Trazabilidad UTP**: termómetro de horas recuperadas, auditoría preventiva de plazos
   y alerta temprana de inasistencia.

Todo corre **on-premise / offline**: no hay llamadas a APIs de IA externas. El único servicio de red
que se usa es tu propio servidor Ollama en `localhost`.

---

## 1. Requisitos

- Node.js 18 o superior
- [Ollama](https://ollama.com) instalado en el computador/servidor del establecimiento

## 2. Instalar y levantar Ollama (motor de IA local)

```bash
# Instala Ollama (sigue las instrucciones de ollama.com para tu sistema operativo)
ollama serve                  # deja corriendo el servidor local (puerto 11434)
ollama pull llama3.1:8b       # descarga el modelo elegido (una sola vez, con internet)
```

Desde ese momento, la generación de borradores funciona **sin internet**: solo necesita que
`ollama serve` esté corriendo en la misma red/máquina.

> Puedes cambiar de modelo editando `OLLAMA_MODEL` en `.env.local` (ver paso 3). Por ejemplo
> `mistral:7b` si el equipo es más limitado, o `qwen2.5:7b` si priorizas calidad en español.

## 3. Instalar y correr la aplicación

```bash
cp .env.example .env.local    # ajusta el modelo/host si es necesario
npm install
npm run dev                   # http://localhost:3000
```

Para producción dentro del establecimiento (servidor siempre encendido en la red local):

```bash
npm run build
npm start
```

## 4. Usuarios de demostración (menús asegurados por rol)

| Rol | RUT | Clave | Ve en el menú |
|---|---|---|---|
| Profesional PIE | `12.345.678-9` | `pie2026` | Inyector Normativo, Puente Copiloto |
| Coordinación UTP | `9.876.543-2` | `utp2026` | Dashboard UTP, Puente Copiloto, Inyector Normativo |

El acceso a cada página se valida **en el servidor** (`getServerSideProps` + cookie de sesión firmada,
`lib/auth.js`), no solo ocultando botones en el frontend — así un usuario no puede entrar a una URL
de un módulo que no le corresponde. Antes de producción real, reemplaza las contraseñas en
`data/users.json` (texto plano, solo para el piloto) por hashes (ej. `bcrypt`) y credenciales por
usuario real.

## 5. Instalar como app en el celular del docente (PWA)

1. Asegúrate de que el celular esté en la **misma red Wi-Fi** que el servidor donde corre
   `npm start` (o publica la app con HTTPS en un dominio interno; los navegadores exigen HTTPS para
   instalar PWAs, salvo en `localhost`).
2. Abre esa dirección en Chrome/Safari desde el celular.
3. Android (Chrome): menú ⋮ → "Instalar aplicación" / "Añadir a pantalla de inicio".
   iOS (Safari): botón compartir → "Añadir a pantalla de inicio".
4. Desde el ícono instalado, el botón **"Tomar foto"** del Inyector Normativo abre directo la
   cámara del celular (`capture="environment"`) para fotografiar observaciones escritas a mano o
   documentos impresos, y el OCR corre en el propio navegador.

## 6. OCR 100% offline (opcional, recomendado para terreno sin señal)

Por defecto, `tesseract.js` descarga el modelo de idioma español (`spa.traineddata`) desde un CDN la
**primera vez** que se usa (luego el navegador lo cachea). Para que funcione offline desde el primer
uso:

1. Descarga `spa.traineddata.gz` desde el repositorio oficial `tessdata_fast` de Tesseract.
2. Colócalo en `public/tesseract-lang/spa.traineddata.gz`.
3. En `components/UploadOCR.js`, pasa `langPath: "/tesseract-lang"` como opción adicional a
   `Tesseract.recognize(file, "spa", { langPath: "/tesseract-lang", ... })`.

## 7. Modelo freemium (5 informes gratis al mes)

El plan gratuito permite generar hasta **5 borradores con IA por mes** por establecimiento
(configurable en `data/plan.json` → `limiteMensual`). El contador se resetea solo al cambiar el mes
calendario, sin necesitar cron ni conexión a internet (`lib/plan.js`).

- El cupo se controla en `pages/api/ollama/generate.js`: si está agotado, responde `402` y el
  Inyector Normativo (`pages/inyector.js`) muestra un aviso con botón de contacto en vez de generar.
- Cualquier usuario puede ver su uso en `/plan` (también aparece como barra de progreso en el
  sidebar). Ahí también están el correo y WhatsApp de ventas para la venta manual (orden de compra,
  transferencia, convenio SLEP — sin checkout de tarjeta).
- **Activar el plan pagado es 100% offline**: tras confirmar el pago fuera del sistema, corres:

  ```bash
  EVALUAAI_LICENSE_SECRET=tu-secreto node scripts/generar-licencia.js <id-del-establecimiento>
  ```

  Eso imprime una clave `EVALUA-xxxxxxxx…`. Se la envías al colegio, y la Coordinación UTP la
  ingresa una sola vez en `/plan`. Desde ese momento el plan queda "paid" e ilimitado — sin que el
  servidor del colegio necesite volver a conectarse a ningún sistema tuyo.
- Importante: `EVALUAAI_LICENSE_SECRET` debe ser el **mismo** valor en el `.env.local` del colegio y
  en tu máquina al generar la clave (o no calzará). Trátalo como una contraseña maestra tuya.
- El `establecimientoId` que identifica a cada colegio vive en `data/plan.json`; cámbialo por colegio
  antes de generar su clave, para que una licencia no sirva para otro establecimiento.

## 8. Estructura del proyecto

```
pages/
  login.js            Ingreso por RUT/clave
  dashboard.js         Módulo 3 — Dashboard UTP (solo coordinación)
  inyector.js           Módulo 1 — carga/OCR + generación IA + firma
  puente.js              Módulo 2 — sincronización a formato FUDEI
  api/
    auth/               login, logout, sesión activa
    ollama/generate.js   llama al servidor Ollama local
    informes/            CRUD de informes (JSON local en /data)
    fudei/sync.js        mapeo de campos hacia FUDEI
    dashboard/stats.js   métricas agregadas
lib/
  auth.js               sesión (JWT en cookie httpOnly) y control de menús por rol
  db.js                 acceso a /data/*.json (reemplazable por Mongo/NoSQL real)
  d170Prompt.js          prompt del "Inyector Normativo"
  ollama.js              cliente HTTP a Ollama
components/               UI reutilizable (Layout, UploadOCR, InformeEditor, widgets)
public/
  manifest.json, sw.js, icons/   PWA
data/
  users.json, informes.json, plan.json   almacenamiento local del piloto y del plan freemium
scripts/
  generar-licencia.js   CLI para que TÚ generes claves de licencia tras una venta manual
```

## 9. Próximos pasos sugeridos (fuera del alcance de este MVP)

- Reemplazar el almacenamiento JSON por la base NoSQL privada mencionada en la propuesta.
- Sumar extracción real de texto desde PDF/Word (ej. `pdfjs-dist`, `mammoth`) en vez de "pegar texto".
- Hash de contraseñas + gestión de usuarios desde una pantalla de administración.
- Integración real con FUDEI si el Mineduc habilita una API/convenio de interoperabilidad.
