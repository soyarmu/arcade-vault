# SPEC 13 — Autenticación con Supabase Auth

> **Estado:** Approved
> **Depende de:** 04-supabase-integration · 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-26
> **Objetivo:** Conectar la pantalla de auth existente con Supabase Auth
> (email+password, OAuth Google y GitHub), migrar UserContext al usuario real
> de Supabase, y añadir los flujos de verificación de email y recuperación
> de contraseña.

---

## Scope

**In:**

- `app/auth/page.tsx` — conectar los formularios de login, registro y "olvidé mi
  contraseña" con Supabase Auth. La UI existente se conserva; solo cambia la lógica.
- `app/auth/callback/route.ts` — nueva Route Handler que intercambia el código OAuth
  / confirmación de email por una sesión y redirige al home.
- `app/auth/reset-password/page.tsx` — nueva página con el formulario para establecer
  la nueva contraseña (lee el token de la URL).
- `app/context/UserContext.tsx` — migración completa: expone el objeto `User` de
  Supabase en lugar del string actual; mantiene `signOut` y añade `session`.
- `components/Nav.tsx` — mostrar avatar (inicial del username), nombre de usuario y
  botón "Cerrar sesión" cuando hay sesión activa.
- Todos los `app/games/*/play/page.tsx` — pre-rellenar `player_name` con el username
  del usuario autenticado (editable antes de guardar) y enviar `user_id` al insertar
  en `scores`.
- Dashboard de Supabase — habilitar proveedores Google y GitHub con las credenciales
  OAuth correspondientes; configurar la URL de callback.

**Out:**

- RLS (Row Level Security) en la tabla `scores` — queda para un spec de seguridad.
- Edición de perfil (cambio de username, avatar real, email) — spec futuro.
- Sesiones múltiples / gestión de dispositivos — fuera de scope.
- Autenticación en rutas de servidor con middleware Next.js — las rutas de juego
  siguen siendo accesibles sin sesión.
- Magic link / OTP por SMS — solo email+password y OAuth en este spec.

---

## Modelo de datos

No se crean tablas nuevas. Cambios sobre lo existente:

### `scores.user_id`

Ya existe como `uuid nullable` sin FK. En este spec se empieza a poblar con el
`id` del usuario autenticado al guardar una puntuación. No se añade FK formal
(queda para el spec de RLS).

### `UserContext` — nueva firma

```ts
import { User, Session } from '@supabase/supabase-js';

interface UserContextValue {
  user: User | null; // objeto completo de Supabase Auth
  session: Session | null;
  username: string | null; // user.user_metadata.username ?? null
  signOut: () => Promise<void>;
}
```

El campo `login(name)` desaparece — el login lo gestiona Supabase directamente
en `app/auth/page.tsx`.

`localStorage.getItem('av_user')` y `localStorage.setItem('av_user', …)` se
eliminan por completo; la sesión vive en las cookies gestionadas por `@supabase/ssr`.

### `user_metadata` al registrarse

Al llamar a `supabase.auth.signUp`, se pasa:

```ts
options: {
  data: {
    username: username.trim().toUpperCase().slice(0, 10);
  }
}
```

---

## Plan de implementación

1. **Habilitar proveedores en Supabase Dashboard**
   - Authentication → Providers → Email: activado, "Confirm email" ON.
   - Authentication → Providers → Google: activar, pegar Client ID y Secret.
   - Authentication → Providers → GitHub: activar, pegar Client ID y Secret.
   - Authentication → URL Configuration → Site URL: `http://localhost:3000`
     (producción: dominio real).
   - Añadir a Redirect URLs: `http://localhost:3000/auth/callback`.
     Verificación: los tres proveedores aparecen como "Enabled" en el dashboard.

2. **Crear `app/auth/callback/route.ts`**
   Route Handler GET que lee `code` de los search params, llama a
   `supabase.auth.exchangeCodeForSession(code)` y redirige a `/`.
   Si no hay `code`, redirige a `/auth`.
   Verificación: hacer clic en el link de confirmación del correo redirige al home
   con sesión activa.

3. **Migrar `app/context/UserContext.tsx`**
   - Sustituir el estado de string por `User | null` y `Session | null`.
   - Al montar: llamar a `supabase.auth.getSession()` para hidratar el estado inicial.
   - Suscribirse a `supabase.auth.onAuthStateChange` para mantener el contexto
     sincronizado con cambios de sesión (login, logout, refresh de token).
   - `username` derivado de `user?.user_metadata?.username ?? null`.
   - `signOut` llama a `supabase.auth.signOut()`.
   - Eliminar toda referencia a `localStorage` (`av_user`).
     Verificación: `useUser().user` devuelve el objeto User tras login; `null` tras logout.

4. **Actualizar `app/auth/page.tsx`**
   - **Tab "INICIAR SESIÓN"**: llamar a
     `supabase.auth.signInWithPassword({ email, password })`.
     Si hay error → mostrar mensaje inline debajo del formulario.
     Si OK → `router.push('/')`.
   - **Tab "CREAR CUENTA"**: llamar a
     `supabase.auth.signUp({ email, password, options: { data: { username } } })`.
     Si hay error → mensaje inline.
     Si OK → cambiar vista a un mensaje "Revisa tu correo para confirmar tu cuenta"
     (sin redirigir).
   - **"Olvidé mi contraseña"**: añadir enlace/botón debajo del formulario de login
     que muestra un mini-form con solo el campo email y llama a
     `supabase.auth.resetPasswordForEmail(email, { redirectTo: '.../auth/reset-password' })`.
     Tras llamada exitosa → mensaje "Te hemos enviado un enlace de recuperación".
   - **OAuth Google / GitHub**: los botones existentes llaman a
     `supabase.auth.signInWithOAuth({ provider: 'google' | 'github',
options: { redirectTo: '.../auth/callback' } })`.
   - Eliminar el botón "JUGAR COMO INVITADO" — la app es accesible sin login
     de forma natural; el botón no aporta valor real con auth real.
     Verificación: login con email+password correcto redirige a `/`; credenciales
     incorrectas muestran el error; el registro muestra el mensaje de confirmación.

5. **Crear `app/auth/reset-password/page.tsx`**
   Página cliente que lee el fragmento de URL con el token (Supabase lo pone como
   hash en la URL). Al montar, llama a `supabase.auth.getSession()` para verificar
   que el token es válido (Supabase lo procesa automáticamente desde el hash).
   Muestra un form con "Nueva contraseña" + "Confirmar contraseña".
   Al enviar llama a `supabase.auth.updateUser({ password: newPassword })`.
   Tras éxito → mensaje "Contraseña actualizada" + enlace a `/auth`.
   Verificación: hacer clic en el link del correo de recuperación llega a esta página
   y permite cambiar la contraseña; la nueva contraseña funciona al iniciar sesión.

6. **Actualizar `components/Nav.tsx`**
   - Consumir `useUser()` para leer `user` y `username`.
   - Si hay sesión: mostrar avatar (div con la inicial del username, estilo consistente
     con el diseño actual), el username en texto y botón "Cerrar sesión" que llama a
     `signOut()`.
   - Si no hay sesión: mostrar el enlace "ACCESO" existente que lleva a `/auth`.
     Verificación: tras login el Nav muestra el avatar e inicial; tras logout vuelve
     al enlace de acceso.

7. **Actualizar los play-pages de todos los juegos**
   En cada `app/games/*/play/page.tsx` que tenga modal de game-over con campo `name`:
   - Pre-rellenar `name` con `username` del contexto si está disponible; si no,
     con `localStorage.getItem('av_player_name')` como fallback para invitados.
   - Al insertar en `scores`, incluir `user_id: user?.id ?? null`.
   - Seguir guardando el nombre en `localStorage.setItem('av_player_name', name)`
     como fallback para invitados.
     Verificación: un usuario autenticado ve su username pre-rellenado en el modal;
     el score guardado tiene `user_id` poblado en Supabase.

8. **Verificación final**
   `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Criterios de aceptación

- [ ] Los proveedores Email, Google y GitHub están habilitados en el dashboard de Supabase.
- [ ] `GET /auth/callback` intercambia el código por sesión y redirige a `/`.
- [ ] `UserContext` expone `user: User | null`, `session`, `username` y `signOut`.
- [ ] No queda ninguna referencia a `localStorage.getItem('av_user')` en el codebase.
- [ ] Login con email+password correcto redirige al home con sesión activa.
- [ ] Login con credenciales incorrectas muestra un mensaje de error inline (sin crash).
- [ ] Registro exitoso muestra el mensaje "Revisa tu correo" sin redirigir.
- [ ] El link de confirmación de email activa la sesión y lleva al home.
- [ ] "Olvidé mi contraseña" envía el correo de recuperación y muestra confirmación.
- [ ] `/auth/reset-password` permite cambiar la contraseña; la nueva contraseña funciona.
- [ ] OAuth Google inicia el flujo de redirección al proveedor.
- [ ] OAuth GitHub inicia el flujo de redirección al proveedor.
- [ ] El Nav muestra avatar + username + "Cerrar sesión" cuando hay sesión.
- [ ] El Nav muestra el enlace "ACCESO" cuando no hay sesión.
- [ ] En el modal de game-over, el campo `name` se pre-rellena con el username del usuario autenticado.
- [ ] Los scores guardados por usuarios autenticados tienen `user_id` poblado en Supabase.
- [ ] Los scores guardados por invitados tienen `user_id = null`.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisiones tomadas

- **Sí: verificación de email activada (double opt-in)** — el registro no activa la
  sesión inmediatamente. Razón: evita cuentas con emails inválidos en el leaderboard;
  la fricción es baja (un clic).

- **Sí: username en `user_metadata`** — sin tabla `profiles` adicional. Razón: para
  este spec el username es solo display; una tabla profiles con RLS, avatares y
  estadísticas merece su propio spec.

- **Sí: recuperación de contraseña en este spec** — flujo completo con
  `/auth/reset-password`. Razón: sin recuperación la autenticación real es
  inutilizable en producción.

- **Sí: `user_id` se puebla en `scores` sin añadir FK formal** — la columna ya
  existe como nullable. Razón: la FK + RLS se diseñan juntas en el spec de seguridad;
  hacerlo aquí a medias crearía una restricción sin políticas.

- **No: middleware Next.js para proteger rutas** — las rutas de juego siguen abiertas
  sin sesión. Razón: la app permite jugar como invitado; la protección de rutas
  añade fricción sin beneficio claro hasta tener más funcionalidad premium.

- **No: eliminar el botón "JUGAR COMO INVITADO"** — se elimina silenciosamente.
  Razón: con auth real la app ya es accesible sin login; el botón era un artefacto
  del mock.

- **No: edición de perfil en este spec** — cambiar username, email o contraseña
  desde un panel de usuario queda para un spec futuro. Razón: ampliaría el scope
  más allá de la autenticación básica.

---

## Riesgos identificados

- **Credenciales OAuth no configuradas al implementar** — los botones de Google y
  GitHub mostrarán error de Supabase si los proveedores no tienen Client ID/Secret.
  Mitigación: el paso 1 del plan requiere configurarlos antes de cualquier prueba OAuth.

- **URL de callback en producción** — si el dominio de producción no está añadido
  a "Redirect URLs" en Supabase, el OAuth falla silenciosamente. Mitigación: al
  desplegar a producción, añadir el dominio real al dashboard antes de activar OAuth.

- **Token de reset en el hash de la URL** — algunos proxies/routers eliminan el
  fragmento hash antes de que llegue a la página. Mitigación: Supabase soporta
  también el token en query params (`?token_hash=…&type=recovery`); si el hash
  falla, usar `supabase.auth.verifyOtp` con los query params como alternativa.
