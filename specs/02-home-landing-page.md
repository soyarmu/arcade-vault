# SPEC 02 — Home Landing Page

> **Estado:** Aprobado · **Depende de:** 01-mvp-visual-screens · **Fecha:** 2026-05-12
> **Objetivo:** Convertir `/` en un landing page de bienvenida con hero, features,
> preview de juegos, stats, actividad en vivo, pricing y CTA final; y mover la
> Biblioteca actual a la ruta `/games`.

---

## Scope

**In:**

- Renombrar la ruta `/` (Biblioteca) a `/games` — mover `app/page.tsx` a `app/games/page.tsx`.
- Actualizar todos los enlaces internos que apuntaban a `/` para que apunten a `/games`
  (Nav, botones de Detalle, Reproductor, etc.).
- Crear el nuevo `app/page.tsx` — Landing Page con las siguientes secciones:
  1. **Hero** — silhouettes flotantes pixel-art, eyebrow animado, título de 3 líneas,
     subtítulo, dos CTAs ("EXPLORAR JUEGOS" → `/games`, "CREAR CUENTA" → `/auth`),
     indicador de scroll.
  2. **¿Por qué Arcade Vault?** — grid de 4 feature cards con íconos pixel SVG inline.
  3. **Juegos disponibles ahora** — mini-rail con los primeros 6 items de `GAMES`
     (ya existente en `app/data/`), botón "VER TODOS LOS JUEGOS →" → `/games`.
  4. **Stats** — 3 bloques estáticos (12+ juegos, miles de partidas, ranking global).
  5. **Actividad en vivo** — dos paneles: "Últimas puntuaciones" y "Top jugadores · hoy",
     con datos mock como constantes locales en el componente.
  6. **Pricing** — card "Plan único $0" con lista de features y FAQ de 3 preguntas.
  7. **Final CTA** — título pixel, botón "INSERTAR MONEDA →" → `/games`.
- Revelar secciones con `IntersectionObserver` (clase `.reveal` / `.in`) al hacer scroll.
- Añadir a `globals.css` las clases específicas del landing que no existan todavía.

**Fuera de alcance:**

- Lógica real de autenticación — "CREAR CUENTA" navega a `/auth` visual existente.
- Mini-cards del rail con efecto tilt 3D — solo layout estático, sin mousemove.
- Página About (`about.jsx` del template) — queda para un spec futuro.
- Cualquier cambio al diseño interno de `/games`, `/games/[id]`, `/auth` o `/hall-of-fame`.

---

## Data model

No se introduce ningún modelo de datos nuevo.

- `GAMES` de `app/data/` se consume directamente (solo lectura, `.slice(0, 6)`).
- Los datos de "Actividad en vivo" (últimas puntuaciones y top jugadores) son constantes
  locales en `app/page.tsx`, tipadas inline. No se exportan ni persisten.

---

## Implementation plan

1. **Mover la Biblioteca** — renombrar `app/page.tsx` a `app/games/page.tsx`.
   Verificación: `http://localhost:3000/games` carga la Biblioteca sin errores.

2. **Actualizar enlaces internos** — reemplazar todos los `href="/"` o `navigate({ name: "biblioteca" })`
   que apunten a la Biblioteca por `/games` en Nav, Detalle, Reproductor y cualquier
   otro componente que los tenga.
   Verificación: ningún enlace lleva a una página 404 ni a la raíz vacía.

3. **Crear `app/page.tsx`** — Landing Page completa con las 7 secciones del template,
   marcada `"use client"` (necesita `useEffect` para el `IntersectionObserver`).
   Verificación: `http://localhost:3000/` carga el landing sin errores de consola.

4. **Añadir estilos a `globals.css`** — clases del landing que no existan todavía:
   `.home-hero`, `.home-silos`, `.silo`, `.home-title`, `.home-ctas`, `.hero-scroll`,
   `.feature-grid`, `.feature-card`, `.ft-icon`, `.mini-rail`, `.mini-card`,
   `.home-stats`, `.stat-block`, `.activity-grid`, `.activity-card`, `.ticker`,
   `.tick-row`, `.top-list`, `.top-row`, `.pricing-grid`, `.price-card`, `.pricing-faq`,
   `.home-final`, `.reveal`, `.reveal.in`.
   Verificación: el servidor corre sin errores CSS y todos los elementos tienen estilo.

5. **Verificación end-to-end** — recorrer el flujo: Landing → `/games` → `/games/[id]` →
   `/games/[id]/play` → Auth → Hall of Fame. Confirmar que todos los enlaces funcionan
   y no hay errores en consola.

---

## Acceptance criteria

**Routing**

- [ ] `GET /` devuelve el landing page; `GET /games` devuelve la Biblioteca.
- [ ] No existe ningún enlace interno que apunte a `/` con intención de ir a la Biblioteca.
- [ ] Todos los enlaces de Nav, Detalle y Reproductor que antes apuntaban a la Biblioteca
      ahora apuntan a `/games`.

**Landing — Hero**

- [ ] Las silhouettes pixel-art flotan animadas en el fondo del hero.
- [ ] El eyebrow muestra "▸ INSERTA UNA MONEDA" con cursor `blink`.
- [ ] El botón "EXPLORAR JUEGOS" navega a `/games`.
- [ ] El botón "CREAR CUENTA" navega a `/auth`.

**Landing — Secciones de contenido**

- [ ] La sección "¿Por qué Arcade Vault?" muestra exactamente 4 feature cards con íconos SVG.
- [ ] El mini-rail muestra exactamente los primeros 6 juegos de `GAMES`; cada mini-card
      navega a `/games/[id]`.
- [ ] Los 3 bloques de stats son visibles (12+, MILES, GLOBAL).
- [ ] La sección "Actividad en vivo" muestra los dos paneles (últimas puntuaciones y top jugadores).
- [ ] La sección Pricing muestra el plan $0 con 6 ítems y los 3 FAQs.
- [ ] El botón "INSERTAR MONEDA →" del CTA final navega a `/games`.

**Scroll reveal**

- [ ] Las secciones con clase `.reveal` aparecen con animación al entrar en el viewport.

**Visual / global**

- [ ] No hay errores en la consola del navegador en ninguna de las rutas.
- [ ] El layout es usable en viewport de 375 px de ancho.

---

## Decisions

- **Sí:** Mover la Biblioteca a `/games` en lugar de crear un alias o redirect.
  El cambio es limpio, las URLs son más descriptivas, y no hay SEO que proteger en este punto.

- **No:** Mantener la Biblioteca en `/` y poner el landing en otra ruta.
  Un landing en `/` es la convención estándar para cualquier producto web.

- **Sí:** Datos de "Actividad en vivo" como constantes locales en el componente.
  Son puramente decorativos; moverlos a `app/data/` añadiría estructura sin beneficio real
  hasta que exista un backend.

- **Sí:** `"use client"` en el landing page por el `IntersectionObserver` del scroll reveal.
  No hay datos que beneficien de SSR en esta pantalla.

- **No:** Efecto tilt 3D en las mini-cards del rail.
  El rail es una vista de preview, no la Biblioteca. El tilt se mantiene solo en `/games`.

- **No:** Implementar la página About (`about.jsx` del template) en este spec.
  Es una pantalla independiente que merece su propio spec.
