# SPEC 15 — Hardening de autenticación: política de contraseña, callback OAuth y autocomplete

> **Estado:** aprobado
> **Depende de:** SPEC 13 · SPEC 14
> **Fecha:** 2026-05-27
> **Objetivo:** Corregir cuatro vulnerabilidades detectadas en la revisión de
> seguridad del flujo de autenticación: política de contraseña inconsistente en
> el reset, error silencioso en el callback OAuth, uso de `window.location.origin`
> en redirectTo, y ausencia de atributos `autocomplete` en campos de contraseña.

---

## Scope

**In:**

- `app/auth/reset-password/page.tsx` — aplicar `PASSWORD_REGEX` (mismo del registro)
  en lugar de la validación de longitud mínima 6; añadir `autocomplete="new-password"`
  en ambos campos de contraseña.
- `app/auth/callback/route.ts` — capturar el error de `exchangeCodeForSession` y
  redirigir a `/auth?error=callback` en lugar de continuar silenciosamente.
- `app/auth/page.tsx` — mostrar banner de error cuando `?error=callback` está presente
  en la URL; usar `NEXT_PUBLIC_APP_URL` en el `redirectTo` del forgot-password y OAuth;
  añadir `autocomplete="current-password"` en login y `autocomplete="new-password"`
  en registro.
- `.env.local` — documentar la variable `NEXT_PUBLIC_APP_URL` (añadirla también a
  `.env.example` si existe en el repo).

**Out of scope (para specs futuros):**

- Content-Security-Policy y HSTS — ya diferidos en SPEC 14.
- Rate limiting / CAPTCHA en el formulario de login — requiere un proveedor externo.
- Edición de perfil y cambio de contraseña desde panel de usuario — spec futuro.
- Validación de fortaleza de contraseña en el formulario de login — el login delega
  la verificación a Supabase (igual que en SPEC 14).

---

## Modelo de datos

No se crean tablas ni estructuras nuevas. Cambios sobre lo existente:

### `PASSWORD_REGEX` — reutilizada desde SPEC 14

```ts
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
```

Se declara localmente en `reset-password/page.tsx` con la misma constante que
ya existe en `auth/page.tsx`.

### Variable de entorno `NEXT_PUBLIC_APP_URL`

```
NEXT_PUBLIC_APP_URL=http://localhost:3000    # desarrollo
NEXT_PUBLIC_APP_URL=https://arcade-vault.gg  # producción
```

Usada en `auth/page.tsx` para construir el `redirectTo` en:

- `supabase.auth.resetPasswordForEmail` → `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
- `supabase.auth.signInWithOAuth` → `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`

### Query param de error en callback

No hay estado nuevo en base de datos. El error se comunica por URL:
`/auth?error=callback` — la página de auth lee `useSearchParams().get('error')`
y muestra un banner si el valor es `'callback'`.

---

## Plan de implementación

1. **Añadir `NEXT_PUBLIC_APP_URL` al entorno**

   Agregar en `.env.local`:

   ```
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Si existe `.env.example` en el repo, añadirla ahí también (sin valor real).
   Verificación: `console.log(process.env.NEXT_PUBLIC_APP_URL)` en dev devuelve
   la URL correcta.

2. **Corregir `app/auth/callback/route.ts` — capturar error**

   ```ts
   const { error } = await supabase.auth.exchangeCodeForSession(code);
   if (error) return NextResponse.redirect(`${origin}/auth?error=callback`);
   return NextResponse.redirect(`${origin}/`);
   ```

   Verificación: con un `code` inválido o expirado en la URL, el navegador
   redirige a `/auth?error=callback` en lugar de `/`.

3. **Actualizar `app/auth/page.tsx` — banner de error callback**
   - Convertir el componente para leer `useSearchParams()` y detectar
     `error === 'callback'`.
   - Mostrar un banner sobre el formulario con el mensaje:
     _"El enlace de acceso ha expirado o es inválido. Inténtalo de nuevo."_
   - El banner se muestra en el mismo estilo que los errores inline existentes
     (color `var(--neon-red, #ff4444)`).
   - Verificación: navegar a `/auth?error=callback` muestra el banner; navegar
     a `/auth` sin parámetro no lo muestra.

4. **Actualizar `app/auth/page.tsx` — reemplazar `window.location.origin`**

   Sustituir las dos ocurrencias de `window.location.origin` por
   `process.env.NEXT_PUBLIC_APP_URL`:
   - `handleForgot`: `redirectTo: \`${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password\``
   - `handleOAuth`: `redirectTo: \`${process.env.NEXT_PUBLIC_APP_URL}/auth/callback\``

   Verificación: los flujos de forgot-password y OAuth siguen funcionando en
   desarrollo; el build no arroja warnings de `window is not defined`.

5. **Añadir `autocomplete` en `app/auth/page.tsx`**
   - Campo de contraseña en login: `autocomplete="current-password"`
   - Campo de contraseña en registro: `autocomplete="new-password"`

   Verificación: los password managers del navegador identifican correctamente
   el propósito de cada campo.

6. **Corregir `app/auth/reset-password/page.tsx` — política de contraseña**
   - Declarar `PASSWORD_REGEX` (misma constante que en `auth/page.tsx`).
   - En `handleSubmit`, sustituir `pass.length < 6` por `!PASSWORD_REGEX.test(pass)`.
   - Actualizar el mensaje de error a:
     _"La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas,
     minúsculas, números y símbolos."_
   - Añadir `autocomplete="new-password"` en ambos campos de contraseña.

   Verificación: intentar guardar "abc123" → muestra error inline, no llama a
   Supabase; "Abc123!@" → flujo continúa normalmente.

7. **Verificación final**

   `npm run build` completa sin errores de TypeScript ni warnings de variables
   de entorno.

---

## Criterios de aceptación

- [ ] `NEXT_PUBLIC_APP_URL` está definida en `.env.local` y (si aplica) en `.env.example`.
- [ ] Un `code` inválido en `/auth/callback` redirige a `/auth?error=callback`, no a `/`.
- [ ] La página `/auth?error=callback` muestra el banner de error; `/auth` sin parámetro no lo muestra.
- [ ] `handleForgot` usa `NEXT_PUBLIC_APP_URL` en lugar de `window.location.origin`.
- [ ] `handleOAuth` usa `NEXT_PUBLIC_APP_URL` en lugar de `window.location.origin`.
- [ ] El campo de contraseña en login tiene `autocomplete="current-password"`.
- [ ] El campo de contraseña en registro tiene `autocomplete="new-password"`.
- [ ] `reset-password/page.tsx` declara `PASSWORD_REGEX` y la usa en la validación.
- [ ] Intentar resetear con "abc123" muestra el mensaje de error y no llama a Supabase.
- [ ] Intentar resetear con "Abc123!@" completa el flujo sin errores de validación.
- [ ] Los dos campos de contraseña en `reset-password/page.tsx` tienen `autocomplete="new-password"`.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisiones tomadas

- **Sí: mismo `PASSWORD_REGEX` en reset que en registro** — garantiza que un usuario
  no pueda eludir la política fuerte creando una contraseña débil a través del flujo
  de recuperación.

- **Sí: redirigir a `/auth?error=callback` con banner visible** — el usuario recibe
  feedback explícito en lugar de aparecer en la pantalla de auth sin contexto de
  por qué no tiene sesión.

- **Sí: `NEXT_PUBLIC_APP_URL` como variable de entorno** — elimina la dependencia de
  `window.location.origin`, que puede ser manipulada en contextos embebidos y genera
  el warning `window is not defined` durante el build en algunos entornos SSR.

- **No: extraer `PASSWORD_REGEX` a un módulo compartido** — la constante tiene dos
  usos (registro y reset); duplicarla es más simple que añadir un módulo `lib/auth/`
  solo para una regex. Si se añaden más reglas de validación, ese módulo tendrá sentido.

- **No: eliminar el parámetro `error` de la URL con `router.replace`** — añadiría
  lógica extra sin beneficio real; el banner desaparece al navegar o recargar
  el formulario.

---

## Riesgos identificados

| Riesgo                                                        | Mitigación                                                                                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL` no definida en producción               | El build de Next.js no falla, pero los `redirectTo` tendrán valor `undefined/auth/...`. Documentar la variable como requerida en el README o `.env.example`. |
| Usuarios con contraseñas antiguas débiles intentan resetear   | El regex solo bloquea la nueva contraseña; no afecta el login ni las contraseñas existentes. El mensaje de error es suficientemente claro.                   |
| `useSearchParams()` requiere `Suspense` en Next.js App Router | Envolver el componente que lee `searchParams` en un `<Suspense>` boundary para evitar errores de build.                                                      |

---

## Qué NO está en este spec

- CSP y HSTS — spec futuro.
- Rate limiting y CAPTCHA — requiere proveedor externo, spec futuro.
- Módulo compartido de validación de contraseña — diferido hasta que haya más reglas.
- Edición de perfil / cambio de contraseña desde panel — spec futuro.
