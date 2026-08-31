# SPEC — Frogger: integración core del juego

> **Estado:** Implementado
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-20
> **Objetivo:** Integrar Frogger (canvas puro, construido desde cero) como juego jugable en Arcade Vault con ID `frogger`, conectando score, vidas, nivel y game over con el HUD React y la play-page dedicada.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `frogger` a la tabla `games` en Supabase.
- Crear `components/games/FroggerGame.tsx` — componente React `"use client"` que encapsula el canvas principal (480 × 640 px). Acepta props: `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- Game loop construido desde cero en el componente: cuadrícula de 16 columnas × 14 filas de 40 × 40 px. El mapa vertical se divide en tres zonas fijas: zona segura inferior (fila 13 — base de inicio), zona de carretera (filas 12–8, 5 carriles de tráfico), zona de río (filas 7–2, 6 carriles fluviales) y zona de metas (fila 1, 5 bocas destino).
- Entidades de carretera: coches y camiones de distintas longitudes (1–3 celdas), velocidades y direcciones por carril; se mueven horizontalmente en loop continuo; colisión con la rana es letal.
- Entidades de río: troncos (longitud 2–4 celdas) y tortugas (grupos de 2–3) por carril; se mueven horizontalmente. La rana sólo sobrevive en el río si está encima de un tronco o tortugas visibles; si cae al agua, muere. Las tortugas pueden sumergirse periódicamente (fase visible → bajo el agua → visible); mientras están bajo el agua no sirven de apoyo.
- Movimiento de la rana: basado en saltos discretos de 1 celda (40 px) en 4 direcciones (↑ ↓ ← →); cada pulsación desplaza la rana exactamente una celda tras completar una animación de salto de 120 ms. La rana no puede moverse fuera de los bordes laterales.
- Condición de meta alcanzada: la rana llega a una de las 5 bocas destino de la fila superior (cada boca ocupa 2 columnas de las 16). Una boca ya ocupada no puede volver a usarse en la misma ronda. Al rellenar las 5 bocas se completa la ronda y comienza la siguiente.
- Condición de muerte: (a) colisión con vehículo, (b) caída al agua, (c) sumergirse la tortuga bajo la rana, (d) salir por los bordes izquierdo/derecho del río, (e) agotar el temporizador de ronda (15 s iniciales reducidos en niveles altos).
- Sistema de vidas: la rana arranca con 3 vidas. Cada muerte resta 1 vida y llama `onLivesChange(lives - 1)`. Si `lives - 1 === 0` se llama `onLivesChange(0)` y luego `onGameOver(finalScore)`.
- Puntuación: +10 pts por cada celda avanzada hacia arriba por primera vez en la ronda; +50 pts al ocupar una boca destino; +200 pts al completar una ronda; +bonus de tiempo = `tiempo_restante × 10` al ocupar una boca.
- Temporizador de ronda visible en HUD: 15 s por defecto, decrementado en rondas altas.
- HUD interno del canvas (score top-left, vidas como iconos de rana top-right, nivel top-center, barra de tiempo en la fila 0) — patrón doble HUD igual que los demás juegos de la plataforma.
- Prop `paused: boolean` congela `update()` pero sigue llamando a `draw()`.
- Limpiar los event listeners (`keydown` en `document`) en el `return` del `useEffect`.
- Crear `app/games/frogger/play/page.tsx` — play-page específica.
- Guardar score al terminar: modal React pre-rellena nombre desde `localStorage` (`av_player_name`), inserta en Supabase y persiste el nombre para la próxima partida.

**Fuera de alcance:**

- Sprites bitmap externos — todos los elementos se dibujan con primitivas canvas (rectángulos, arcos, formas compuestas) con colores temáticos; no se carga ninguna imagen.
- Controles táctiles o mobile.
- Animaciones de muerte elaboradas (explosiones, partículas) — se cubre en spec secundario.
- Power-ups especiales (mosca en la boca destino, cocodrilo disfrazado de tronco) — se cubre en spec secundario.
- Supabase Auth y RLS — `user_id` se almacena como `null`.
- Realtime en el leaderboard.
- Componente genérico `CanvasGame` (YAGNI).

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'frogger',
  'FROGGER',
  'Cruza la carretera y el río sin convertirte en papilla.',
  'Guía a tu rana a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.',
  'ARCADE',
  'cover-frogger',
  'lime'
);
```

### Props del componente `FroggerGame`

```ts
interface FroggerGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local arranca con `lives = 3`, `score = 0`, `level = 1`.
`onLivesChange(n)` se dispara cada vez que la rana muere.
`onLivesChange(0)` se dispara justo antes de `onGameOver(score)` en cualquier condición de fin de partida.

No se introducen nuevas tablas ni tipos TypeScript — se reutilizan `GameRow` y `ScoreRow` de `lib/supabase/types.ts`.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `frogger` aparece en el Table Editor; `/games` muestra la card con cover `cover-frogger` y color `lime`.

2. **Definir constantes y tipos** dentro de `FroggerGame.tsx`:

   ```ts
   const COLS = 16;
   const ROWS = 14;
   const CELL = 40; // px
   const CANVAS_W = COLS * CELL; // 640 — se escala con CSS al contenedor
   const CANVAS_H = ROWS * CELL; // 560
   // Zonas (índice de fila, 0 = arriba)
   const ROW_GOALS = 0;
   const ROW_RIVER_TOP = 1;
   const ROW_RIVER_BOT = 6;
   const ROW_SAFE_MID = 7;
   const ROW_ROAD_TOP = 8;
   const ROW_ROAD_BOT = 12;
   const ROW_START = 13;
   ```

   Tipos locales (no exportados):

   ```ts
   type Direction = 'up' | 'down' | 'left' | 'right';
   interface Lane {
     row: number;
     speed: number;
     dir: 1 | -1;
     entities: Entity[];
   }
   interface Entity {
     col: number;
     width: number;
     type: 'car' | 'truck' | 'log' | 'turtle';
     submerged?: boolean;
   }
   interface Frog {
     col: number;
     row: number;
     animating: boolean;
     animT: number;
     targetCol: number;
     targetRow: number;
   }
   ```

3. **Construir el mapa de carriles** — función `buildLanes(level: number): Lane[]`:
   - Carriles de carretera (filas 8–12): velocidades entre 1.5 y 4 px/frame (escaladas por nivel); sentidos alternos; entidades precargadas con huecos para que sean atravesables.
   - Carriles de río (filas 1–6): velocidades entre 1 y 3 px/frame; troncos de 2–4 celdas con huecos de al menos 1 celda; grupos de tortugas de 2–3 con ciclo de inmersión de 3 s visible / 1.5 s bajo el agua.
   - Cada nivel incrementa todas las velocidades en un 15 %.
     Verificación: al imprimir el array `lanes` en consola, cada carril tiene al menos 2 entidades y los huecos son visibles.

4. **Game loop principal** con `requestAnimationFrame`:
   - `update(dt: number)`:
     - Si `paused`, saltar toda lógica.
     - Avanzar posición de cada entidad en su carril (`entity.col += lane.speed * lane.dir * dt / 16`); cuando una entidad sale del borde, se reintroduce por el lado opuesto (`col = -entity.width` o `col = COLS`).
     - Si la rana no está animando: comprobar input (`pendingDir`); si hay dirección pendiente, iniciar animación (`animating = true`, `animT = 0`, calcular `targetCol/targetRow`).
     - Si la rana está animando: avanzar `animT += dt`; si `animT >= 120`, completar salto (`col = targetCol`, `row = targetRow`, `animating = false`), resolver lógica de celda destino (detección de muerte/meta/puntuación).
     - Si la rana está en el río y no animando: aplicar el desplazamiento horizontal de la entidad sobre la que descansa (se verifica con `getSupport(frog, lanes)`).
     - Decrementar temporizador de ronda; si llega a 0, muerte por tiempo.
     - Llamar callbacks de cambio de estado si el valor difiere del anterior.

   - `draw()`:
     - Fondo por zonas: negro para carretera, azul oscuro para río, verde oscuro para filas seguras, verde claro para bocas destino.
     - Dibujar entidades de cada carril: coches (rectángulo rojo/amarillo/azul con ruedas circulares), camiones (rectángulo gris con cabina diferenciada), troncos (rectángulo marrón con textura de líneas), tortugas visibles (círculo verde con patrón de escamas), tortugas sumergidas (contorno semitransparente).
     - Dibujar rana: cuerpo verde brillante (elipse 28×24 px) con ojos blancos/negros (dos círculos), patas extendidas durante animación de salto.
     - Dibujar bocas destino: rectángulo de meta verde oscuro con borde dorado; si ocupada, dibujar silueta de rana dentro.
     - HUD interno: score top-left (fuente blanca 16 px), nivel top-center, iconos de rana top-right (un círculo verde por vida), barra de tiempo (rectángulo en fila 0, anchura proporcional al tiempo restante, color verde → amarillo → rojo).

5. **Detección de colisiones y soporte**:
   - `checkRoadCollision(frog, lanes)`: itera entidades de carriles de carretera; si `frog.col` está dentro del rango `[entity.col, entity.col + entity.width)` y `frog.row === lane.row`, devuelve `true`.
   - `getSupport(frog, lanes)`: itera entidades de carriles de río; devuelve la entidad cuyo rango cubre la columna de la rana en el mismo carril, o `null`. Si la entidad es una tortuga con `submerged === true`, devuelve `null` (sin soporte).
   - `checkGoal(frog, goals)`: si `frog.row === ROW_GOALS`, calcula la boca que corresponde a `frog.col`; si no está ocupada, la marca y suma puntos; si ya estaba ocupada o `frog.col` no es una boca, es muerte.

6. **Gestión de ronda completada** — `completeRound()`:
   - Resetea la posición de la rana a `ROW_START`, columna central.
   - Vacía las bocas ocupadas.
   - Incrementa `level`, llama `onLevelChange(level)`.
   - Reconstruye los carriles con `buildLanes(level)`.
   - Resetea el temporizador.

7. **Gestión de muerte** — `killFrog()`:
   - Decrementa `lives`.
   - Llama `onLivesChange(lives)`.
   - Si `lives === 0`: llama `onLivesChange(0)`, luego `onGameOver(score)`, detiene el loop.
   - Si `lives > 0`: resetea la posición de la rana a `ROW_START`, columna central; resetea temporizador.

8. **Crear `app/games/frogger/play/page.tsx`** — play-page específica:
   - Importa `FroggerGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `3`), `level`, `paused`, `over`, `name`, `saved`, `gameKey`.
   - Pasa `paused` y los cuatro callbacks a `FroggerGame`.
   - Reutiliza el layout visual de la plataforma (HUD React + CRT + modal game over), igual que las play-pages de Asteroids, Tetris, Arkanoid, Snake y Space Invaders.
   - Modal game over: pre-rellena nombre desde `localStorage.getItem('av_player_name')`; al confirmar, guarda en `localStorage` e inserta en Supabase `{ game_id: 'frogger', player_name: name, score, user_id: null }`.
   - Botón de guardar se deshabilita tras el primer envío.
   - Botón "JUGAR DE NUEVO" incrementa `gameKey` para remontar `FroggerGame`.
     Verificación: el HUD React refleja score, vidas y nivel en tiempo real.

9. **Verificación final** — `npm run build` termina sin errores de TypeScript. Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `frogger` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Frogger aparece en `/games` con cover `cover-frogger` y color `lime`.
- [ ] La ruta `/games/frogger/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas (640 × 560) se renderiza con las tres zonas visualmente diferenciadas (carretera, río, zonas seguras, bocas destino).
- [ ] La rana aparece centrada en la fila de inicio al cargar la partida.
- [ ] La rana salta exactamente una celda (40 px) por pulsación de tecla de dirección con animación de 120 ms.
- [ ] La rana no puede salir por los bordes laterales.
- [ ] Los coches y camiones se mueven horizontalmente en loop por sus carriles; se reintroducen por el lado opuesto al salir.
- [ ] Los troncos y tortugas se mueven horizontalmente en loop por sus carriles.
- [ ] Las tortugas alternan entre visible y sumergida con el ciclo definido.
- [ ] La rana muere al ser alcanzada por un vehículo de carretera.
- [ ] La rana muere al caer al agua (no estar sobre tronco ni tortugas visibles).
- [ ] La rana muere cuando la tortuga que la soporta se sumerge.
- [ ] La rana muere al agotar el temporizador de ronda.
- [ ] Al morir, `onLivesChange(lives - 1)` se dispara; la rana vuelve a la fila de inicio.
- [ ] Al llegar a una boca libre, la boca queda marcada y se suma el bonus de puntuación.
- [ ] Al llegar a una boca ya ocupada, la rana muere.
- [ ] Al completar las 5 bocas, la ronda termina y comienza la siguiente con `level` incrementado.
- [ ] `onLevelChange(level)` se dispara al iniciar cada nueva ronda.
- [ ] La velocidad de entidades aumenta con cada nivel.
- [ ] El temporizador de ronda disminuye con cada nivel.
- [ ] `onScoreChange(score)` se dispara en cada cambio de puntuación.
- [ ] El HUD interno del canvas (score, nivel, vidas-iconos, barra de tiempo) se dibuja correctamente.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" de la plataforma congela el game loop; "REANUDAR" lo reanuda.
- [ ] Las teclas P / Esc no provocan una pausa independiente del canvas.
- [ ] Al llegar a `lives = 0`, `onLivesChange(0)` y `onGameOver(score)` se disparan; aparece el modal React.
- [ ] El modal pre-rellena el nombre desde `av_player_name` si existe en localStorage.
- [ ] Al confirmar el nombre, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero (nuevo `gameKey`).
- [ ] El score guardado aparece en `/games/frogger` y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Primitivas canvas sin sprites bitmap** — coches, camiones, troncos, tortugas y rana se dibujan con formas geométricas canvas y colores temáticos. Razón: no existen assets de Frogger en el repositorio; dibujar por código elimina dependencias de carga de imágenes y permite ajustar visual sin archivos externos.

- **Sí: Cuadrícula discreta de 40 px con animación de salto de 120 ms** — el movimiento de la rana es celda a celda, no continuo. Razón: mecánica canónica de Frogger; el movimiento discreto simplifica enormemente la detección de colisiones y el soporte en el río al comparar filas/columnas enteras.

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores en el HUD de la plataforma. Razón: coherencia con el patrón establecido en todos los juegos de la plataforma.

- **Sí: 3 vidas** — Frogger original arranca con 3 vidas. `onLivesChange` notifica cada pérdida. Razón: fiel a la mecánica clásica; coherente con Arkanoid y Space Invaders.

- **Sí: Tortugas con ciclo de inmersión** — alternan entre soporte y peligro con temporizador independiente por grupo. Razón: mecánica diferenciadora de Frogger respecto a un río de sólo troncos; añade gestión de riesgo sin complejidad de implementación excesiva.

- **Sí: Temporizador de ronda** — 15 s iniciales, decrementados en niveles altos. La muerte por tiempo añade urgencia. Razón: mecánica original de Frogger; impide que el jugador espere indefinidamente en la zona segura.

- **Sí: 5 bocas destino** — requieren llenarse todas para completar la ronda. Razón: mecánica original que da estructura de objetivo claro por ronda sin ser un nivel único lineal.

- **Sí: Canvas 640 × 560 px (16 × 14 celdas de 40 px)** — relación de aspecto vertical cercana a la original. Razón: el mapa de Frogger es vertical (el jugador avanza hacia arriba); un canvas más ancho que alto no representaría bien el recorrido.

- **Sí: Play-page específica `app/games/frogger/play/page.tsx`** — en lugar de la ruta genérica `[id]/play`. Razón: coherencia con todos los juegos anteriores; Next.js App Router da prioridad a rutas estáticas sobre dinámicas.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente. Razón: `canvas` y `requestAnimationFrame` no existen en el entorno Node.js de Next.js SSR.

- **No: Movimiento continuo (interpolado)** — la rana no se desliza; salta de celda en celda. Razón: la interpolación continua requeriría colisiones AABB en espacio continuo para el río y la carretera, aumentando la complejidad sin añadir diversión.

- **No: Cocodrilo disfrazado de tronco ni mosca bonus en bocas** — se cubren en el spec secundario de power-ups y eventos. Razón: son capas de dificultad y recompensa independientes de la mecánica base.

- **No: Componente genérico `CanvasGame`** — cada juego tiene su componente propio. Razón: YAGNI.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos). Razón: se mitiga en el spec futuro de seguridad.

- **No: Realtime en leaderboards** — los scores se ven al recargar. Razón: la complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.
