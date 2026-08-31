# SPEC 03 — About Page + Envío de correo con Resend

> **Estado:** Aprobado · **Depende de:** 02-home-landing-page · **Fecha:** 2026-05-12
> **Objetivo:** Crear la página `/about` con la sección "Acerca de" y el formulario de
> contacto que envía correos reales a `fernando.herrera85@gmail.com` vía Resend.

---

## Scope

**In:**

- Crear `app/about/page.tsx` — página `/about` con dos secciones del template:
  1. **Acerca de** — hero con misión, kicker, título y 3 highlight cards con íconos
     pixel SVG inline (HEART, BROWSER, PLANT).
  2. **Divider animado** — barra con píxeles de colores parpadeantes.
  3. **Contacto** — grid con panel informativo (kicker, título, subtítulo, 3 tips con
     LEDs de colores) y formulario (nombre, email, mensaje, botón de envío).
     - Estado de éxito: terminal animado "VAULT-OS // TERMINAL" con líneas de progreso.
     - Estado de error: mensaje de error visible dentro del formulario (no modal).
     - Animación `shake` en el form si se intenta enviar con campos vacíos.
  4. **Scroll reveal** — secciones con clase `.reveal` / `.in` vía `IntersectionObserver`.
- Añadir enlace "SOBRE NOSOTROS" al Nav (desktop y panel mobile), con estado
  `active` cuando `pathname === '/about'`.
- Crear `app/api/contact/route.ts` — API Route que recibe `{ name, email, msg }`,
  llama a Resend en el servidor y devuelve `{ ok: true }` o `{ error: string }`.
- Configurar la variable de entorno `RESEND_API_KEY` en `.env.local` como placeholder
  vacío; el usuario la completará manualmente.
- Instalar el paquete `resend`.

**Fuera de alcance:**

- Validación de formato de email más allá del `type="email"` nativo del navegador.
- Rate limiting o CAPTCHA en el endpoint `/api/contact`.
- Email de confirmación al remitente (solo va el email al equipo).
- Cualquier cambio al diseño o lógica de otras rutas.

---

## Data model

No se introduce ningún modelo de datos persistente.

- **Payload del formulario** — `{ name: string; email: string; msg: string }` — tipado
  inline en el componente y en el API Route. No se exporta ni se guarda.
- **Variable de entorno** — `RESEND_API_KEY` en `.env.local`. El API Route la lee con
  `process.env.RESEND_API_KEY`. Si está vacía o ausente, Resend lanzará un error que
  el Route captura y devuelve como `{ error: "…" }`.
- **Respuesta del API Route** — `{ ok: true }` en éxito, `{ error: string }` en fallo.
  El componente usa este campo para decidir qué estado mostrar.

---

## Implementation plan

1. **Instalar Resend** — `npm install resend`.
   Verificación: `resend` aparece en `package.json` dependencies.

2. **Crear `.env.local`** — añadir `RESEND_API_KEY=` (valor vacío como placeholder).
   Verificación: el archivo existe en la raíz del proyecto y contiene la clave.

3. **Crear `app/api/contact/route.ts`** — API Route `POST` que:

   - Lee `{ name, email, msg }` del body JSON.
   - Valida que los tres campos no estén vacíos; si faltan, devuelve `400 { error }`.
   - Instancia `new Resend(process.env.RESEND_API_KEY)` y llama a
     `resend.emails.send(...)` con `to: "fernando.herrera85@gmail.com"`,
     `from: "onboarding@resend.dev"` (dominio gratuito de Resend, válido sin
     configurar dominio propio), `subject` y `html` con los datos del form.
   - Devuelve `200 { ok: true }` en éxito o `500 { error }` si Resend falla.
     Verificación: `curl -X POST /api/contact` con body válido retorna `{ ok: true }`
     (cuando la key esté configurada).

4. **Crear `app/about/page.tsx`** — componente `"use client"` que replica exactamente
   el template `about.jsx` adaptado a Next.js/TypeScript:

   - `IntersectionObserver` en `useEffect` para `.reveal` / `.in`.
   - Estado local: `form { name, email, msg }`, `status: "idle" | "sending" |
"success" | "error"`, `shake: boolean`, `errorMsg: string`.
   - `onSubmit`: valida campos → activa shake si vacíos → llama a `POST /api/contact`
     → actualiza `status` según respuesta.
   - Renderiza el terminal de éxito cuando `status === "success"`.
   - Renderiza mensaje de error en rojo pixel dentro del form cuando `status === "error"`.
   - El botón muestra spinner y se deshabilita mientras `status === "sending"`.
     Verificación: `http://localhost:3000/about` carga sin errores de consola.

5. **Actualizar `components/Nav.tsx`** — añadir enlace "SOBRE NOSOTROS" a `/about`
   en la barra desktop y en el panel mobile, con `isAbout = pathname === '/about'`
   para el estado `active`.
   Verificación: el enlace aparece en el Nav, tiene glow cyan al estar en `/about`
   y funciona en mobile.

6. **Verificación end-to-end** — flujo completo: Nav → `/about` → rellenar form →
   enviar → terminal de éxito. Confirmar que `.reveal` anima al hacer scroll y que
   el Nav marca "SOBRE NOSOTROS" como activo.

---

## Acceptance criteria

**Routing y Nav**

- [ ] `GET /about` devuelve la página sin errores de consola.
- [ ] El Nav desktop muestra el enlace "SOBRE NOSOTROS" con glow cyan y subrayado
      cuando `pathname === '/about'`.
- [ ] El panel mobile muestra el enlace "SOBRE NOSOTROS" con estado `active` en
      `/about`.
- [ ] Ningún enlace existente (Biblioteca, Salón de la Fama, Auth) se rompe.

**Sección Acerca de**

- [ ] El kicker "▸ ACERCA DE" aparece en amarillo neon.
- [ ] El título "ACERCA DE ARCADE VAULT" renderiza con gradiente blanco → cyan.
- [ ] Las 3 highlight cards (HEART, BROWSER, PLANT) muestran su ícono SVG pixel-art
      y su texto en los colores correctos (magenta, cyan, green).

**Formulario de contacto**

- [ ] El form muestra shake animation si se intenta enviar con algún campo vacío.
- [ ] El botón se deshabilita y muestra spinner mientras `status === "sending"`.
- [ ] Un envío exitoso (Resend responde OK) muestra el terminal "VAULT-OS // TERMINAL"
      con las líneas de progreso y el nombre del remitente en mayúsculas.
- [ ] Un fallo de Resend muestra un mensaje de error dentro del form (no modal).
- [ ] El botón "ENVIAR OTRO MENSAJE" limpia el form y vuelve al estado inicial.

**API Route**

- [ ] `POST /api/contact` con body incompleto devuelve `400`.
- [ ] `POST /api/contact` con body válido y key configurada devuelve `200 { ok: true }`
      y el email llega a `fernando.herrera85@gmail.com`.

**Scroll reveal y visual**

- [ ] Las secciones con `.reveal` aparecen animadas al entrar en el viewport.
- [ ] El divider animado (píxeles parpadeantes) se renderiza entre las dos secciones.
- [ ] El layout es usable en viewport de 375 px de ancho.

---

## Decisions

- **Sí:** `from: "onboarding@resend.dev"` como remitente en lugar de un dominio propio.
  Resend permite este dominio sin configuración adicional en el plan gratuito.
  Cuando se configure un dominio propio, se cambia esta línea.

- **Sí:** API Route en el servidor (`app/api/contact/route.ts`) en lugar de llamar a
  Resend desde el cliente. La API key nunca sale del servidor; llamarla desde el
  cliente la expondría en el bundle público.

- **Sí:** `status: "idle" | "sending" | "success" | "error"` como máquina de estados
  simple en lugar de flags booleanos separados. Evita estados imposibles
  (`sending === true` y `success === true` al mismo tiempo).

- **Sí:** Mostrar el error dentro del form, no en un modal. El template ya tiene el
  espacio visual del form; un modal sería más intrusivo y fuera de estilo.

- **No:** Email de confirmación al remitente. Está fuera de alcance; requeriría
  un segundo `resend.emails.send` y gestión de templates adicionales.

- **No:** Rate limiting o CAPTCHA. El formulario es de baja frecuencia y el plan
  gratuito de Resend tiene sus propios límites. Se puede añadir en un spec futuro.

- **Sí:** `.env.local` con `RESEND_API_KEY=` vacío. El usuario lo completa manualmente
  tras recibir la key de Resend. El repo no incluye secrets.
