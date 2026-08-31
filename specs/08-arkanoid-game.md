# SPEC 08 — Integración del juego Arkanoid

> **Estado:** Aprobado
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-18
> **Objetivo:** Integrar el juego Arkanoid (canvas puro) como nuevo juego jugable en la
> plataforma con ID `arkanoid`, conectando su estado interno (score, vidas, nivel, game over,
> victoria) con el HUD y la interfaz React de la play-page dedicada.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `arkanoid` a la tabla `games` en Supabase.
- Crear `components/games/ArkanoidGame.tsx` — componente React `"use client"` que encapsula
  el canvas principal (800 × 600 px). Acepta props:
  `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- El game loop adaptado de `references/started-games/04-arkanoid/game.js` vive íntegramente
  dentro del componente, incluyendo `levels.js` y los helpers de `assets/spritesheet.js`.
- El HUD interno del canvas (score top-left, nivel top-center, vidas como sprites top-right)
  se conserva sin modificaciones — patrón doble HUD igual que Asteroids y Tetris.
- El componente notifica a React de cada cambio de estado vía callbacks (comparando con
  el valor anterior antes de disparar).
- Eliminar los overlays de canvas `drawOverlay('GAME OVER')` y `drawOverlay('¡Completaste
el juego!')` del `draw()`; sustituirlos por la llamada `onGameOver(finalScore)`.
- Eliminar `drawPauseOverlay()` y su lógica de botones de nivel — la plataforma controla
  la pausa exclusivamente vía prop `paused`.
- Las teclas P / Esc del canvas original se desactivan; la pausa la controla la plataforma.
- Limpiar los event listeners (`keydown`, `keyup` en `document`; `mousemove` y `click`
  en el canvas) en el `return` del `useEffect`.
- Crear `app/games/arkanoid/play/page.tsx` — play-page específica para este juego.
  Gestiona el estado (`score`, `lives`, `level`, `paused`, `over`, `name`, `saved`) y
  pasa callbacks al componente canvas.
- Guardar score al terminar (tanto `gameover` como `win`): modal React pre-rellena nombre
  desde `localStorage` (`av_player_name`), inserta en Supabase y persiste el nombre
  para la próxima partida.

**Fuera de alcance:**

- Controles táctiles o mobile.
- Selector de nivel en el overlay de pausa — queda eliminado junto con el overlay.
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
  'arkanoid',
  'ARKANOID',
  'Rompe todos los bloques antes de perder tus 3 vidas.',
  'Controla la paleta y rebota la pelota para destruir todos los bloques. Cinco niveles con patrones distintos y velocidad creciente ponen a prueba tus reflejos. Completa el nivel 5 sin agotar tus vidas para ganar.',
  'ARCADE',
  'cover-bricks',
  'cyan'
);
```

### Props del componente `ArkanoidGame`

```ts
interface ArkanoidGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local arranca con `lives = 3`, `score = 0`, `level = 1`.
`onLivesChange(0)` se dispara justo antes de `onGameOver(score)` tanto en `gameover` como en `win`.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `arkanoid` aparece en el Table Editor; `/games` muestra la card de
   Arkanoid con cover `cover-bricks` y color `cyan`.

2. **Crear `components/games/ArkanoidGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 800 × 600 px.
   - Integra el código de `game.js` adaptado: lógica de paddle, pelota, bloques, colisiones,
     explosiones, niveles y puntuación viven dentro del componente.
   - Copia `LEVELS` de `levels.js` y los helpers `drawSprite` / `drawFrame` de
     `assets/spritesheet.js` directamente en el componente (o en módulos auxiliares).
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no
     ejecuta `update()`.
   - Desactiva los handlers de P / Esc para pausa (los absorbe la plataforma).
   - Llama `onScoreChange`, `onLivesChange`, `onLevelChange` cuando esos valores cambian
     dentro del loop (comparando con valor anterior antes de disparar).
   - Llama `onLivesChange(0)` y luego `onGameOver(score)` cuando `gameState` pasa a
     `'gameover'` o `'win'`, en lugar de dibujar los overlays originales.
   - Conserva el HUD interno del canvas sin modificaciones.
   - Captura las referencias a los handlers de `keydown`, `keyup`, `mousemove` y `click`
     y los limpia en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/arkanoid/play` y es jugable con mouse y teclado.

3. **Crear `app/games/arkanoid/play/page.tsx`** — play-page específica:
   - Importa `ArkanoidGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `lives` (inicial `3`), `level`, `paused`, `over`, `name`, `saved`.
   - Pasa `paused` y los cuatro callbacks a `ArkanoidGame`.
   - Reutiliza el layout visual de la plataforma (HUD React + CRT + modal game over),
     igual que la play-page de Asteroids y Tetris.
   - Modal game over: pre-rellena nombre desde `localStorage.getItem('av_player_name')`;
     al confirmar, guarda en `localStorage` e inserta en Supabase
     `{ game_id: 'arkanoid', player_name: name, score, user_id: null }`.
   - Botón de guardar se deshabilita tras el primer envío.
     Verificación: el HUD React refleja score, vidas y nivel en tiempo real.

4. **Verificación final** — `npm run build` termina sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `arkanoid` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Arkanoid aparece en `/games` con cover `cover-bricks` y color `cyan`.
- [ ] La ruta `/games/arkanoid/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas (800 × 600) se renderiza correctamente.
- [ ] El juego es jugable con mouse (mousemove) y con teclado (← → mover paleta).
- [ ] El HUD interno del canvas (score, nivel, vidas como sprites) se dibuja correctamente.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" de la plataforma congela el game loop; "REANUDAR" lo reanuda.
- [ ] Las teclas P / Esc no provocan una pausa independiente del canvas.
- [ ] Al producirse `gameover`, `onLivesChange(0)` y `onGameOver(score)` se disparan; aparece
      el modal React de la plataforma con la puntuación final.
- [ ] Al completar el nivel 5 (`win`), `onLivesChange(0)` y `onGameOver(score)` se disparan;
      aparece el mismo modal React de la plataforma.
- [ ] Los overlays de canvas `GAME OVER` y `¡Completaste el juego!` no se muestran.
- [ ] El overlay de pausa del canvas no se muestra; la plataforma gestiona la pausa.
- [ ] El botón "JUGAR DE NUEVO" del modal reinicia la partida desde cero.
- [ ] Al terminar una partida, el modal pre-rellena el nombre desde `av_player_name` si existe.
- [ ] Al confirmar el nombre, el score se inserta en Supabase y el nombre se persiste en
      `localStorage`.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/arkanoid` y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores
  en el HUD de la plataforma. Razón: coherencia con el patrón establecido en Asteroids y Tetris;
  el juego funciona visualmente como standalone dentro del canvas.

- **Sí: 3 vidas** — Arkanoid arranca con 3 vidas. `onLivesChange` notifica cada pérdida;
  `onLivesChange(0)` dispara el game over. Razón: fiel a la mecánica original del juego.

- **Sí: `win` equivale a game over** — completar el nivel 5 llama `onGameOver(score)` igual
  que perder. Razón: la plataforma necesita un único punto de salida para mostrar el modal
  de guardar score; no tiene sentido distinguir victoria y derrota en el flujo de la UI.

- **Sí: Play-page específica `app/games/arkanoid/play/page.tsx`** — en lugar de modificar
  la ruta genérica `[id]/play`. Razón: coherencia con Asteroids y Tetris; Next.js App Router
  da prioridad a rutas estáticas sobre dinámicas.

- **Sí: Helpers de spritesheet copiados al componente** — `drawSprite`, `drawFrame` y la
  carga del spritesheet se adaptan dentro de `ArkanoidGame.tsx` o módulos auxiliares.
  Razón: el original usa scripts globales incompatibles con el módulo ES de Next.js.

- **No: Selector de nivel en pausa** — se elimina junto con el overlay de pausa del canvas.
  Razón: la plataforma controla la pausa; el selector de nivel choca con el flujo estándar.

- **No: Componente genérico `CanvasGame`** — se extrae cuando llegue el tercer juego canvas.
  Razón: YAGNI; con dos casos no hay suficiente patrón confirmado para abstraer bien.
