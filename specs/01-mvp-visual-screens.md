# SPEC 01 — MVP visual de Arcade Vault: todas las pantallas

> **Estado:** Implementado · **Depende de:** — · **Fecha:** 2026-05-11
> **Objetivo:** Implementar las 5 pantallas visuales de Arcade Vault en Next.js App Router
> con la estética retro-arcade del prototipo HTML de referencia, sin lógica de juego real.

---

## Scope

**In:**

- Componente `Nav` — logo, enlaces, contador de créditos, botón auth, menú hamburguesa + drawer móvil.
- Página `/` (`biblioteca`) — sección hero con efecto flicker, filtros por categoría/búsqueda, grid de game cards con efecto tilt 3D.
- Página `/games/[id]` (`detalle`) — portada, descripción, estadísticas, leaderboard lateral.
- Página `/games/[id]/play` (`reproductor`) — HUD con puntuación/vidas/nivel, arena placeholder con enemigos animados en CSS, overlay de pausa, overlay de game over con formulario de nombre.
- Página `/auth` — tabs login/registro, campos de formulario, botones sociales (Google, GitHub, solo visual).
- Página `/hall-of-fame` (`salón`) — podio top 3, tabs por juego, tabla completa de puntuaciones.
- `app/data/` — array `GAMES` y función `seededScores` en TypeScript (datos mock, sin API).
- Efectos visuales del prototipo: scanlines, grilla de perspectiva CRT, neon glow, animaciones `fade-in`, `flicker`, `blink`, `pulse`, `slide-in`.
- `globals.css` revisado si faltan variables o efectos del prototipo.
- Tailwind v4 para layout, espaciado y utilidades generales.
- Responsive: layout adaptado en móvil (hamburger funcional, cards en columna).

**Fuera de alcance (para specs futuros):**

- Lógica real de ningún juego.
- Autenticación real (sin backend ni proveedor OAuth).
- Base de datos o API; los datos viven en `app/data/` como constantes.
- Persistencia de scores más allá de lo que ya hace `localStorage` en el cliente.
- Página de perfil de usuario.
- Panel de administración.
- Modo multijugador.

---

## Data model

```ts
// app/data/games.ts

export interface Game {
  id: string;
  title: string;
  short: string; // descripción corta (card)
  long: string; // descripción larga (detalle)
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER';
  cover: string; // clase CSS de la portada, e.g. "cover-bricks"
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  best: number; // mejor puntuación global
  plays: string; // partidas jugadas, e.g. "12.4K"
}

export const GAMES: Game[] = [
  /* 6 juegos del prototipo */
];
```

```ts
// app/data/scores.ts

export interface ScoreEntry {
  rank: number;
  name: string;        // nombre del jugador, e.g. "PX_KAI"
  score: number;
  date: string;        // e.g. "2026-03-14"
}

// Genera N scores ficticios reproducibles dado una semilla numérica.
// Sustituirá a una llamada a BD cuando exista el backend.
export function seededScores(seed: number, count: number): ScoreEntry[] { ... }
```

```ts
// app/data/index.ts  — re-exporta todo para imports limpios
export * from './games';
export * from './scores';
```

> No se introduce ningún modelo de sesión de usuario en este spec: el estado `user` se maneja localmente en el cliente con `localStorage` (`av_user`) tal como hace el prototipo. Eso se formalizará en el spec de autenticación real.

---

## Implementation plan

1. **Crear `app/data/`** — `games.ts` con el array `GAMES` (6 juegos), `scores.ts` con `seededScores`, `index.ts` re-exportando todo. Verificación: importar desde otro archivo sin errores de TypeScript.

2. **Revisar `app/globals.css`** — añadir las clases y efectos que falten del prototipo: `.av-bg`, `.av-noise`, `.av-nav`, `.crt`, `.card`, `.cover-bg`, variantes de cover (`cover-bricks`, `cover-tetro`, etc.), animaciones (`flicker`, `blink`, `fade-in`, `pulse`, `slide-in`), clases de botones (`.btn`, `.btn.ghost`, `.btn.magenta`, etc.). Verificación: el servidor corre sin errores de CSS.

3. **Crear `app/context/UserContext.tsx`** — context `"use client"` con estado `user` (nombre + localStorage `av_user`), funciones `login` y `signOut`. Envolver `app/layout.tsx` con el provider. Verificación: el provider monta sin errores.

4. **Crear `components/Nav.tsx`** — logo, enlaces a `/` y `/hall-of-fame`, contador de créditos, botón auth/signout que lee `UserContext`, hamburger + drawer móvil. `"use client"`. Registrar en `app/layout.tsx` encima del `{children}`. Verificación: la nav aparece en todas las rutas y el drawer abre/cierra en móvil.

5. **Implementar `app/page.tsx`** — pantalla Biblioteca: sección hero con texto `flicker`, filtros por categoría y buscador, grid de `GameCard` con efecto tilt 3D por mousemove. `"use client"`. Verificación: las cards filtran en tiempo real y el tilt responde al ratón.

6. **Implementar `app/games/[id]/page.tsx`** — pantalla Detalle: portada a ancho completo, tags, descripción larga, strip de estadísticas, botón "JUGAR AHORA" → `/games/[id]/play`, leaderboard lateral con `seededScores`. `"use client"`. Verificación: navegar desde una card de Biblioteca muestra los datos correctos del juego.

7. **Implementar `app/games/[id]/play/page.tsx`** — pantalla Reproductor: HUD (jugador, puntuación simulada, vidas, nivel), arena CRT con enemigos animados en CSS copiada del prototipo, overlay de pausa, overlay de game over con campo de nombre y botón guardar. `"use client"`. Verificación: pausa alterna correctamente; el overlay de game over aparece al pulsar "FIN".

8. **Implementar `app/auth/page.tsx`** — tabs "INICIAR SESIÓN" / "CREAR CUENTA", campos de formulario, botón "JUGAR COMO INVITADO", botones sociales (visual). Al hacer submit llama `login` del contexto y redirige a `/`. `"use client"`. Verificación: login de invitado muestra el nombre en la nav; el campo de email aparece solo en el tab de registro.

9. **Implementar `app/hall-of-fame/page.tsx`** — encabezado, tabs por juego, podio top 3 (oro/plata/bronce), tabla completa con animación de entrada escalonada, fila resaltada del usuario si está logueado. `"use client"`. Verificación: cambiar de tab actualiza el podio y la tabla con datos del juego seleccionado.

10. **Verificación end-to-end** — recorrer el flujo completo: Biblioteca → Detalle → Reproductor → Game Over → Hall of Fame → Auth → volver a Biblioteca con sesión activa. Confirmar que no hay errores en consola y que todos los enlaces funcionan.

---

## Acceptance criteria

**Data**

- [ ] `GAMES` exporta exactamente 6 juegos con todos los campos tipados sin errores TypeScript.
- [ ] `seededScores(seed, n)` devuelve siempre el mismo array para los mismos argumentos.

**Nav**

- [ ] El logo navega a `/` desde cualquier ruta.
- [ ] Los enlaces "Biblioteca" y "Salón de la Fama" marcan el estado activo según la ruta actual.
- [ ] En móvil el menú hamburguesa abre y cierra el drawer lateral.
- [ ] Sin sesión: aparece el botón "Iniciar Sesión". Con sesión: aparece el nombre del usuario.

**Biblioteca (`/`)**

- [ ] El hero muestra el texto "ARCADE VAULT" con animación `flicker`.
- [ ] El filtro por categoría oculta cards que no pertenecen a esa categoría.
- [ ] El buscador filtra cards por título en tiempo real.
- [ ] El efecto tilt 3D responde al movimiento del ratón sobre cada card.
- [ ] El botón "JUGAR" de cada card navega a `/games/[id]`.

**Detalle (`/games/[id]`)**

- [ ] Los datos mostrados (título, descripción, stats) corresponden al `id` de la URL.
- [ ] El leaderboard lateral muestra 10 entradas generadas por `seededScores`.
- [ ] El botón "JUGAR AHORA" navega a `/games/[id]/play`.
- [ ] El botón "VOLVER AL VAULT" navega a `/`.

**Reproductor (`/games/[id]/play`)**

- [ ] El HUD muestra nombre del jugador (usuario o "INVITADO"), puntuación, vidas y nivel.
- [ ] El botón "PAUSA" muestra el overlay de pausa; "REANUDAR" lo oculta.
- [ ] El botón "FIN" muestra el overlay de game over.
- [ ] El overlay de game over tiene un campo editable con el nombre y un botón de guardar.
- [ ] El botón "SALIR" navega a `/games/[id]`.

**Auth (`/auth`)**

- [ ] El tab "CREAR CUENTA" muestra el campo de email; "INICIAR SESIÓN" lo oculta.
- [ ] Al hacer submit (con cualquier dato) el usuario queda logueado y la app redirige a `/`.
- [ ] "JUGAR COMO INVITADO" cierra la sesión y redirige a `/` sin nombre de usuario.
- [ ] Los botones de Google y GitHub son visibles pero no hacen nada.

**Salón de la Fama (`/hall-of-fame`)**

- [ ] Los tabs muestran un chip por cada juego en `GAMES`.
- [ ] Cambiar de tab actualiza el podio y la tabla con datos del juego seleccionado.
- [ ] El podio distingue visualmente oro (1º), plata (2º) y bronce (3º).
- [ ] La tabla muestra las entradas con animación de entrada escalonada.

**Visual / global**

- [ ] El fondo con grilla de perspectiva, scanlines y viñeta es visible en todas las páginas.
- [ ] No hay errores en la consola del navegador en ninguna de las 5 rutas.
- [ ] El layout es usable en viewport de 375 px de ancho (móvil).

---

## Decisions

- **Sí:** Rutas reales de Next.js App Router (`/`, `/games/[id]`, `/games/[id]/play`, `/auth`, `/hall-of-fame`) en lugar de hash-routing del prototipo. Next.js gestiona la navegación de forma nativa y las URLs son indexables.

- **No:** Hash-routing con estado React como en el prototipo HTML. Es un patrón válido para una SPA vanilla pero antipatrón en App Router.

- **Sí:** CSS global (`globals.css`) para las variables de tema y efectos visuales complejos (CRT, scanlines, grilla de perspectiva, neon glow). Tailwind no tiene primitivas para estos efectos y replicarlos con clases arbitrarias sería ilegible.

- **No:** Tailwind puro para todo. Los efectos de fondo y las animaciones del prototipo requieren CSS que Tailwind no modela bien. Tailwind se usa donde añade valor: layout, espaciado, responsive.

- **Sí:** `UserContext` compartido en el layout para el estado de sesión. La Nav y el Reproductor necesitan leer el mismo usuario; sin contexto habría lecturas duplicadas de `localStorage`.

- **No:** Server Components para las páginas interactivas. Todas las pantallas usan eventos de ratón, estado o efectos; marcarlas `"use client"` es correcto y explícito.

- **Sí:** `app/data/` como módulo TypeScript con constantes mock. Establece la separación entre capa de datos y UI desde el inicio, lo que facilita sustituirlo por llamadas a API en el futuro.

- **No:** JSON estático o data en el propio componente. Mezclar datos con UI dificulta la migración a backend.

- **Sí:** Copiar el placeholder de la arena del reproductor tal cual del prototipo (enemigos CSS animados). Es suficiente para el MVP visual y no bloquea el trabajo futuro de integrar juegos reales.

- **No:** Pantalla de juego en blanco o con "COMING SOON". Pierde la estética del prototipo y no demuestra el diseño completo.

---

## Risks

| Riesgo                                                                                                                                                    | Mitigación                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Las fuentes `Press Start 2P` y `JetBrains Mono` se cargan desde Google Fonts; sin conexión o con bloqueo de red los textos pixel se degradan visualmente. | Añadir `font-display: swap` y definir fallbacks monospace aceptables en `globals.css`.                                |
| El efecto tilt 3D usa `onMouseMove` en cada card; con muchas cards visibles simultáneamente puede generar jank en hardware lento.                         | Envolver el handler con `requestAnimationFrame` y añadir `will-change: transform` a `.card`.                          |
| `globals.css` ya existe con estilos migrados; añadir las clases del prototipo puede introducir conflictos o duplicados.                                   | Revisar el archivo antes de añadir; usar prefijo `av-` (ya establecido en el prototipo) para todas las clases nuevas. |
| Next.js App Router hidrata los Client Components en el cliente; un flash de contenido sin estilo (FOUC) puede aparecer en la primera carga.               | Asegurarse de que los estilos críticos (fondo, nav) están en `globals.css` y no dependen de JS para renderizarse.     |
| `seededScores` genera datos ficticios; si la función no es determinista, el leaderboard cambia en cada render y rompe el criterio de aceptación.          | Verificar con un test manual: llamar dos veces con la misma semilla y comparar el resultado.                          |

---

## What is **not** in this spec

- Lógica real de ningún juego — cada juego es una pantalla futura con su propio spec.
- Autenticación real con backend, OAuth o gestión de sesiones seguras.
- Llamadas a API o base de datos — todo viene de `app/data/` como constantes.
- Página de perfil de usuario o historial de partidas personal.
- Panel de administración.
- Modo multijugador o funcionalidades sociales (amigos, retos).

Cada uno de estos, si llega, va en su propio spec.
