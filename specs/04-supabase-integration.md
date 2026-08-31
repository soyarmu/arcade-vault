# SPEC 04 — Integración de Supabase

> **Estado:** Implementado
> **Depende de:** 03-about-page-contact-resend ·
> **Fecha:** 2026-05-14
> **Objetivo:** Instalar y configurar el cliente de Supabase (browser + SSR) como
> infraestructura base para specs futuros de autenticación, base de datos y realtime.

---

## Scope

**In:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`.
- Crear `lib/supabase/client.ts` — cliente browser para componentes `"use client"`.
- Crear `lib/supabase/server.ts` — cliente server para Server Components y Route Handlers.
- Añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.template`
  y a `.env.local` como placeholders vacíos (el dev los completa manualmente).

**Fuera de alcance:**

- Creación de tablas o esquema en Supabase.
- Conectar el `/auth` existente con Supabase Auth.
- Cualquier uso real del cliente en componentes o páginas existentes.
- Realtime, Edge Functions y Storage — quedan para specs futuros.
- `SUPABASE_SERVICE_ROLE_KEY` — se añadirá cuando un spec lo requiera.

---

## Data model

No se introduce ningún modelo de datos persistente en este spec. Los clientes de Supabase
son utilidades de configuración, no estructuras de datos.

---

## Implementation plan

1. **Instalar dependencias** — `npm install @supabase/supabase-js @supabase/ssr`.
   Verificación: ambos paquetes aparecen en `dependencies` de `package.json`.

2. **Añadir variables de entorno** — añadir a `.env.local` y a `.env.template`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

   Verificación: ambos archivos contienen las dos claves (vacías en `.env.local`,
   como placeholders documentados en `.env.template`).

3. **Crear `lib/supabase/client.ts`** — cliente browser con `createBrowserClient`
   de `@supabase/ssr`:

   ```ts
   import { createBrowserClient } from '@supabase/ssr';

   export const createClient = () =>
     createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     );
   ```

   Verificación: el archivo existe y TypeScript no reporta errores.

4. **Crear `lib/supabase/server.ts`** — cliente server con `createServerClient`
   de `@supabase/ssr`, leyendo y escribiendo cookies vía `next/headers`:

   ```ts
   import { createServerClient } from '@supabase/ssr';
   import { cookies } from 'next/headers';

   export const createClient = async () => {
     const cookieStore = await cookies();
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll: () => cookieStore.getAll(),
           setAll: (cookiesToSet) => {
             cookiesToSet.forEach(({ name, value, options }) =>
               cookieStore.set(name, value, options),
             );
           },
         },
       },
     );
   };
   ```

   Verificación: el archivo existe y TypeScript no reporta errores.

5. **Verificación final** — `npm run build` (o `npm run dev`) termina sin errores
   de compilación ni de tipos relacionados con los nuevos archivos.

---

## Acceptance criteria

- [ ] `@supabase/supabase-js` y `@supabase/ssr` aparecen en `dependencies` de `package.json`.
- [ ] `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=`.
- [ ] `.env.template` contiene las mismas dos claves como placeholders documentados.
- [ ] `lib/supabase/client.ts` existe y exporta `createClient` usando `createBrowserClient`.
- [ ] `lib/supabase/server.ts` existe y exporta `createClient` async usando `createServerClient`.
- [ ] `npm run build` completa sin errores de TypeScript relacionados con los nuevos archivos.
- [ ] Ninguna página o componente existente se rompe tras la integración.

---

## Decisions

- **Sí:** `@supabase/ssr` en lugar de instanciar `createClient` de `@supabase/supabase-js`
  directamente. El paquete SSR maneja cookies y sesión correctamente en Next.js App Router;
  usar el cliente básico requeriría refactorizar cuando llegue el spec de Auth.

- **Sí:** Dos archivos separados (`client.ts` y `server.ts`) en lugar de uno universal.
  Next.js App Router tiene contextos de ejecución distintos (browser vs. server); un solo
  cliente que intente cubrir ambos rompe en uno de los dos contextos.

- **No:** `SUPABASE_SERVICE_ROLE_KEY` en este spec. Solo se añade cuando un spec concreto
  lo requiera; incluirla ahora sería infraestructura sin uso.

- **No:** Crear tablas o esquema en Supabase. El objetivo de este spec es únicamente la
  plomería de conexión; el modelo de datos se define spec a spec según la funcionalidad.

- **No:** Conectar `/auth` en este spec. La autenticación real merece su propio spec con
  flujo, estados de error y redirecciones definidos explícitamente.
