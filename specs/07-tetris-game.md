# SPEC 07 — Integración del juego Tetris

> **Estado:** Implementado
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-18
> **Objetivo:** Integrar el juego Tetris (canvas puro) como nuevo juego jugable en la
> plataforma con ID `tetris`, conectando su estado interno (score, vidas, nivel, game over)
> con el HUD y la interfaz React de la play-page dedicada.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `tetris` a la tabla `games` en Supabase.
- Crear `components/games/TetrisGame.tsx` — componente React `"use client"` que encapsula
  dos canvas: el principal (300 × 600 px, centrado) y el de siguiente pieza (120 × 120 px,
  desplazado a la derecha sin alineación estricta con el principal). Acepta props:
  `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- El game loop adaptado de `references/started-games/03-tetris/game.js` vive íntegramente
  dentro del componente.
- El HUD interno del canvas (score, lines, level) se conserva sin modificaciones — patrón
  doble HUD igual que Asteroids.
- El componente notifica a React de cada cambio de estado vía callbacks (comparando con
  el valor anterior antes de disparar).
- Eliminar el overlay HTML "GAME OVER" (`#gameover-overlay`) y el leaderboard local en
  localStorage del juego original; sustituirlos por la llamada `onGameOver(finalScore)`.
- La tecla `P` / `Esc` del canvas original se desactiva; la pausa la controla la plataforma
  exclusivamente vía prop `paused`.
- Limpiar los event listeners de `document` (`keydown`) en el `return` del `useEffect`.
- Crear `app/games/tetris/play/page.tsx` — play-page específica para este juego.
  Gestiona el estado (`score`, `lives`, `level`, `paused`, `over`, `name`, `saved`) y
  pasa callbacks al componente canvas.
- Guardar score al terminar: modal React pre-rellena nombre desde `localStorage`
  (`av_player_name`), inserta en Supabase y persiste el nombre para la próxima partida.

**Fuera de alcance:**

- Controles táctiles o mobile.
- Selector de skins del juego original (Retro / Neon / Pastel / Pixel Art).
- Menú de pausa interno del canvas original — la plataforma gestiona la pausa.
- Extracción de un componente genérico `CanvasGame` — se hará cuando llegue el tercer
  juego canvas.
- Supabase Auth y RLS — `user_id` se almacena como `null`.
- Realtime en el leaderboard.

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'tetris',
  'TETRIS',
  'Apila tetrominos antes de que el techo te aplaste.',
  'Siete piezas, diez columnas, una sola regla: no dejes que el tablero llegue arriba. Gira y encaja tetrominos para completar líneas y ganar puntos; cada nivel te las acelera un poco más.',
  'PUZZLE',
  'cover-tetro',
  'cyan'
);
```

### Props del componente `TetrisGame`

```ts
interface TetrisGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local del componente no introduce modelos persistentes. Las vidas arrancan en `1`;
`onLivesChange(0)` se dispara justo antes de `onGameOver(score)`.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `tetris` aparece en el Table Editor; `/games` muestra la card de
   Tetris.

2. **Crear `components/games/TetrisGame.tsx`** — componente `"use client"` que:
   - Renderiza dos `<canvas>`: `id="board"` (300 × 600, centrado) y `id="next-canvas"`
     (120 × 120, desplazado a la derecha).
   - Contiene el game loop completo adaptado de `game.js` (lógica de tablero, piezas,
     colisiones, wall kicks, line clear, puntuación, ghost piece, speed).
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no
     ejecuta el auto-drop ni procesa entradas de juego.
   - Desactiva los handlers de `P` / `Esc` para pausa (los absorbe la plataforma).
   - Llama `onScoreChange`, `onLevelChange` cuando esos valores cambian dentro del loop.
   - Llama `onLivesChange(0)` y luego `onGameOver(score)` cuando `endGame()` se dispara,
     en lugar de mostrar el overlay HTML original.
   - Conserva el HUD interno del canvas (score, lines, level) sin modificaciones.
   - Captura la referencia al handler de `keydown` y lo limpia en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/tetris/play` y es jugable con teclado.

3. **Crear `app/games/tetris/play/page.tsx`** — play-page específica:
   - Importa `TetrisGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `1`), `level`, `paused`, `over`, `name`, `saved`.
   - Pasa `paused` y los cuatro callbacks a `TetrisGame`.
   - Reutiliza el layout visual de la plataforma (HUD React + CRT + modal game over),
     igual que la play-page de Asteroids.
   - Modal game over: pre-rellena nombre desde `localStorage.getItem('av_player_name')`;
     al confirmar, guarda en `localStorage` e inserta en Supabase
     `{ game_id: 'tetris', player_name: name, score, user_id: null }`.
   - Botón de guardar se deshabilita tras el primer envío.
     Verificación: el HUD React refleja score, vidas y nivel en tiempo real.

4. **Verificación final** — `npm run build` termina sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `tetris` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Tetris aparece en `/games` con cover `cover-tetro` y color `cyan`.
- [ ] La ruta `/games/tetris/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas principal (300 × 600) se renderiza centrado; el canvas de siguiente pieza
      (120 × 120) aparece desplazado a la derecha.
- [ ] El juego es jugable con teclado (←/→ mover, ↑/X rotar, ↓ soft drop, Space hard drop).
- [ ] El HUD interno del canvas (score, lines, level) se dibuja correctamente durante la partida.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" de la plataforma congela el game loop; "REANUDAR" lo reanuda.
- [ ] Las teclas P / Esc no provocan una pausa independiente del canvas.
- [ ] Al producirse game over, `onLivesChange(0)` y `onGameOver(score)` se disparan; aparece
      el modal React de la plataforma con la puntuación final.
- [ ] El overlay HTML "GAME OVER" del canvas original no se muestra.
- [ ] El botón "JUGAR DE NUEVO" del modal reinicia la partida desde cero.
- [ ] Al terminar una partida, el modal pre-rellena el nombre desde `av_player_name` si existe.
- [ ] Al confirmar el nombre, el score se inserta en Supabase y el nombre se persiste en
      `localStorage`.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/tetris` y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores
  en el HUD de la plataforma. Razón: coherencia con el patrón establecido en Asteroids;
  el juego funciona visualmente como standalone dentro del canvas.

- **Sí: 1 vida** — Tetris no tiene vidas en el sentido clásico, pero la plataforma exige
  el campo. Se modela como 1 vida que cae a 0 al perder. Razón: consistencia con el HUD
  estándar de todos los juegos de la plataforma.

- **Sí: Canvas secundario dentro del mismo componente** — el canvas de siguiente pieza
  (120 × 120) vive dentro de `TetrisGame`. Razón: el game loop original ya escribe en ese
  canvas; sacarlo fuera obligaría a exponer refs adicionales sin beneficio.

- **Sí: Play-page específica `app/games/tetris/play/page.tsx`** — en lugar de modificar
  la ruta genérica `[id]/play`. Razón: coherencia con Asteroids; Next.js App Router da
  prioridad a rutas estáticas sobre dinámicas.

- **Sí: Eliminar leaderboard local en localStorage** — el juego original guarda top 5 en
  localStorage. Se elimina para centralizar scores en Supabase. Razón: consistencia con
  la plataforma; duplicar persistencia local y remota sería confuso.

- **Sí: Skins del juego original** — el selector Retro / Neon / Pastel / Pixel Art se
  implementa. Razón: se añade para que el usuario pueda cambiar el aspecto del juego, y se graba la preferencia en localStorage.

- **No: Menú de pausa interno del canvas** — la plataforma controla la pausa vía prop.
  Razón: consistencia con el resto de juegos; el menú de pausa del canvas tiene opciones
  (nivel inicial, reinicio) que chocan con el flujo de la plataforma.

- **No: Componente genérico `CanvasGame`** — se extrae cuando llegue el tercer juego canvas.
  Razón: YAGNI; con dos casos no hay suficiente patrón confirmado para abstraer bien.
