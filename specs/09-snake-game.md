# SPEC 09 — Integración del juego Snake

> **Estado:** Implementado
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-19
> **Objetivo:** Integrar Snake como juego jugable en Arcade Vault, construyendo su
> canvas desde cero con sprites de frutas de `references/source-assets/snake-assets/`
> y conectando el leaderboard de Supabase.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `snake` a la tabla `games` en Supabase.
- Crear `components/games/SnakeGame.tsx` — componente React `"use client"` que encapsula
  el canvas (800 × 800 px) y el game loop completo. Acepta props:
  `paused`, `onScoreChange`, `onLevelChange`, `onLivesChange`, `onGameOver`.
- El game loop se construye desde cero: grid de 20×20 celdas de 40px, serpiente con
  dirección controlada por WASD, fruta aleatoria con sprites de `fruits.png` usando el
  atlas definido en `references/source-assets/snake-assets/sprites.js`.
- El HUD interno del canvas (score y level) se dibuja dentro del canvas — patrón doble
  HUD igual que Asteroids, Tetris y Arkanoid.
- El componente notifica a React de cada cambio de estado vía callbacks (comparando con
  el valor anterior antes de disparar).
- La condición de game over es colisión con una pared o con el propio cuerpo; dispara
  `onLivesChange(0)` y `onGameOver(finalScore)`.
- El prop `paused: boolean` congela el loop (no ejecuta `update()`) pero sigue llamando
  a `draw()`.
- Limpiar los event listeners de teclado (`keydown` en `document`) en el `return`
  del `useEffect`.
- Crear `app/games/snake/play/page.tsx` — play-page específica para este juego.
  Gestiona el estado (`score`, `level`, `lives`, `paused`, `over`, `name`, `saved`,
  `gameKey`) y pasa callbacks al componente canvas.
- Guardar score al terminar: modal React pre-rellena nombre desde `localStorage`
  (`av_player_name`), inserta en Supabase y persiste el nombre para la próxima partida.

**Fuera de alcance:**

- Crear las tablas `games` o `scores` en Supabase — ya existen (spec 06).
- Controles táctiles o mobile.
- Supabase Auth y RLS — `user_id` se almacena como `null`.
- Realtime en el leaderboard.
- Paginación del leaderboard — se muestran los top 10 fijos.
- Modos de juego alternativos (toroidal, multijugador, obstáculos).
- Animación de muerte o efectos especiales al colisionar.

---

## Data model

### Seed en Supabase — tabla `games`

Ejecutar en el SQL Editor de Supabase:

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'snake',
  'SNAKE',
  'Come frutas, crece y no te muerdas la cola.',
  'Guía a la serpiente por el tablero comiendo frutas que aparecen aleatoriamente. Cada fruta que comes hace crecer tu cuerpo y sube tu puntuación. La partida termina si chocas contra una pared o contra ti mismo.',
  'ARCADE',
  'cover-snake',
  'green'
);
```

### Props del componente `SnakeGame`

```ts
interface SnakeGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onLivesChange: (lives: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local arranca con `lives = 1`, `score = 0`, `level = 1`.
`onLivesChange(0)` se dispara justo antes de `onGameOver(score)` al colisionar.
El nivel sube cada 5 frutas comidas; cada nivel incrementa la velocidad del loop.

No se introducen nuevas tablas ni tipos TypeScript — se reutilizan `GameRow` y `ScoreRow`
de `lib/supabase/types.ts`.

---

## Implementation plan

1. **INSERT en Supabase** — ejecutar el SQL del data model en el SQL Editor de Supabase.
   Verificación: la fila `snake` aparece en el Table Editor; `/games` muestra la card de
   Snake con cover `cover-snake` y color `green`.

2. **Crear `components/games/SnakeGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 800 × 800 px.
   - Carga `fruits.png` desde `references/source-assets/snake-assets/` y utiliza el atlas
     de `sprites.js` (copiado/adaptado al componente) para dibujar una fruta aleatoria
     en cada celda objetivo.
   - Game loop con `setInterval` (o `requestAnimationFrame` con acumulador de tiempo):
     - `update()` avanza la serpiente, detecta colisiones con paredes y cuerpo propio,
       comprueba si come la fruta, actualiza score y level.
     - `draw()` limpia el canvas, dibuja el grid, el cuerpo de la serpiente, la fruta
       con sprite y el HUD interno (score top-left, level top-right).
   - Dirección controlada por WASD (`keydown` en `document`); se ignoran giros de 180°.
   - Cada 5 frutas comidas, `level` sube 1 y la velocidad del intervalo aumenta.
   - Llama `onScoreChange` y `onLevelChange` cuando esos valores cambian (comparando
     con valor anterior antes de disparar).
   - Al colisionar, llama `onLivesChange(0)` y luego `onGameOver(score)`.
   - Prop `paused: boolean` — si es `true`, el loop omite `update()` pero ejecuta `draw()`.
   - Limpia el event listener de `keydown` y el intervalo/frame en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/snake/play` y es jugable con WASD.

3. **Crear `app/games/snake/play/page.tsx`** — play-page específica:
   - Importa `SnakeGame` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, `level`, `lives` (inicial `1`), `paused`, `over`, `name`,
     `saved`, `gameKey`.
   - Pasa `paused` y los cuatro callbacks a `SnakeGame`.
   - Reutiliza el layout visual de la plataforma (HUD React + CRT + modal game over),
     igual que las play-pages de Asteroids, Tetris y Arkanoid.
   - Modal game over: pre-rellena nombre desde `localStorage.getItem('av_player_name')`;
     al confirmar, guarda en `localStorage` e inserta en Supabase
     `{ game_id: 'snake', player_name: name, score, user_id: null }`.
   - Botón de guardar se deshabilita tras el primer envío.
     Verificación: el HUD React refleja score y nivel en tiempo real; tras una partida
     el score aparece en `/games/snake` y en `/hall-of-fame` al recargar.

4. **Verificación final** — `npm run build` termina sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `snake` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card de Snake aparece en `/games` con cover `cover-snake` y color `green`.
- [ ] La ruta `/games/snake/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas (800 × 800) se renderiza correctamente con el grid de 20×20 celdas.
- [ ] El juego es jugable con WASD; se ignoran giros de 180°.
- [ ] La fruta se dibuja usando el sprite correspondiente de `fruits.png`.
- [ ] El HUD interno del canvas (score top-left, level top-right) se dibuja correctamente.
- [ ] El HUD React de la plataforma refleja en tiempo real score y nivel.
- [ ] El botón "PAUSA" de la plataforma congela el game loop; "REANUDAR" lo reanuda.
- [ ] Al colisionar con una pared, `onLivesChange(0)` y `onGameOver(score)` se disparan.
- [ ] Al colisionar con el propio cuerpo, `onLivesChange(0)` y `onGameOver(score)` se disparan.
- [ ] Aparece el modal React de game over con la puntuación final.
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero.
- [ ] Al abrir el modal, el campo de nombre se pre-rellena con `av_player_name` de localStorage si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/snake` y en `/hall-of-fame` al recargar.
- [ ] `/hall-of-fame` muestra un tab para Snake.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores
  en el HUD de la plataforma. Razón: coherencia con el patrón establecido en Asteroids,
  Tetris y Arkanoid; el juego funciona visualmente como standalone dentro del canvas.

- **Sí: 1 vida** — Snake no tiene vidas en el sentido clásico, pero la plataforma exige
  el campo. Se modela como 1 vida que cae a 0 al morir. Razón: consistencia con el HUD
  estándar de todos los juegos de la plataforma (igual que Tetris).

- **Sí: Sprites de frutas del atlas** — se usa `fruits.png` y el mapa de coordenadas de
  `sprites.js` para dibujar una fruta aleatoria en cada nueva posición objetivo.
  Razón: los assets ya existen y aportan identidad visual sin coste adicional.

- **Sí: Nivel sube cada 5 frutas** — cada 5 frutas comidas el nivel sube 1 y la velocidad
  del loop aumenta. Razón: progresión natural que incrementa dificultad sin complicar el modelo.

- **Sí: Play-page específica `app/games/snake/play/page.tsx`** — en lugar de modificar
  la ruta genérica `[id]/play`. Razón: coherencia con Asteroids, Tetris y Arkanoid;
  Next.js App Router da prioridad a rutas estáticas sobre dinámicas.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente.
  Razón: `canvas` y `setInterval`/`requestAnimationFrame` no existen en el entorno Node.js
  de Next.js SSR.

- **No: Tablero toroidal** — las paredes matan la serpiente.
  Razón: mecánica clásica de Snake; el tablero toroidal se puede añadir como modo futuro.

- **No: Componente genérico `CanvasGame`** — cada juego tiene su componente propio.
  Razón: YAGNI; generalizar ahora sería abstraer sin caso de uso suficientemente confirmado.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: se mitiga en el spec futuro de seguridad.

- **No: Realtime en leaderboards** — los scores se ven al recargar.
  Razón: la complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.
