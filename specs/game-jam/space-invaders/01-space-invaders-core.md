# SPEC — Space Invaders: integración core del juego

> **Estado:** Propuesto
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** 2026-05-25
> **Objetivo:** Integrar Space Invaders (canvas puro, construido desde cero) como juego jugable en Arcade Vault con ID `space-invaders`, conectando score, vidas, nivel y game over con el HUD React y la play-page dedicada.

---

## Scope

**In:**

- INSERT SQL para añadir la fila `space-invaders` a la tabla `games` en Supabase.
- Crear `components/games/SpaceInvadersGame.tsx` — componente React `"use client"` que encapsula el canvas principal (600 × 700 px). Acepta props: `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- Game loop construido desde cero en el componente usando `requestAnimationFrame` con acumulador de delta time.
- Grid de invasores: 11 columnas × 5 filas = 55 invasores totales. Tres tipos: crabs (filas 3–5, 10 pts), squids (fila 2, 20 pts), octopus (fila 1, 30 pts). El bloque completo se mueve horizontalmente; al alcanzar un borde lateral da un paso hacia abajo y revierte dirección. La velocidad horizontal aumenta conforme hay menos invasores vivos.
- Cañón del jugador: se mueve horizontalmente con ← → (o A/D). Dispara con Space; un único proyectil en vuelo a la vez. El proyectil viaja hacia arriba a velocidad fija; destruye al primer invasor impactado y otorga los puntos del tipo.
- Proyectiles enemigos: los invasores de la fila inferior de cada columna disparan hacia abajo a intervalos aleatorios dentro de un rango parametrizable. El proyectil enemigo es letal para el cañón. La tasa de disparo enemigo aumenta con el nivel.
- Escudos destructibles: 4 escudos horizontales posicionados entre los invasores y el cañón. Cada escudo es una matriz de 22 × 16 píxeles lógicos de 3 px; cada píxel lógico se destruye individualmente al ser impactado por proyectiles amigos o enemigos. Los proyectiles se detienen al tocar el escudo.
- UFO / nave misteriosa: cada 20–30 segundos (aleatorio) aparece en la parte superior y cruza de izquierda a derecha. Puntuación variable (50, 100, 150 o 300 pts) revelada al dispararle. Desaparece al llegar al borde o al ser abatida.
- Condición de victoria de nivel: todos los invasores eliminados — se avanza al siguiente nivel (velocidad inicial más alta, tasa de disparo enemigo mayor, invasores descienden un paso más al inicio). El nivel máximo es 10; al completar el nivel 10 se llama `onGameOver(score)` como victoria.
- Condición de game over: (a) un proyectil enemigo impacta al cañón y las vidas llegan a 0, o (b) cualquier invasor alcanza la fila inferior del cañón (y ≥ umbral). El cañón arranca con 3 vidas.
- HUD interno del canvas: score (top-left), hi-score de sesión (top-center), vidas como iconos del cañón (bottom-left), nivel (bottom-right).
- Pausa controlada exclusivamente via prop `paused`: si es `true`, el loop omite `update()` pero sigue llamando a `draw()`.
- Limpieza de event listeners (`keydown`, `keyup` en `document`) en el `return` del `useEffect`.
- Crear `app/games/space-invaders/play/page.tsx` — play-page específica con `dynamic(..., { ssr: false })`.
- Modal game over: pre-rellena desde `localStorage.getItem('av_player_name')`, inserta en Supabase `{ game_id: 'space-invaders', player_name: name, score, user_id: null }`, persiste nombre.

**Fuera de alcance:**

- Controles táctiles o mobile.
- Supabase Auth y RLS — `user_id` se almacena como `null`.
- Realtime en el leaderboard.
- Sonidos (cubierto en spec 02).
- Power-ups o armas especiales (fuera del scope core).
- Modo dos jugadores.
- Animaciones de explosión con partículas (solo frame flash por 200 ms).

---

## Data model

### INSERT en tabla `games`

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'space-invaders',
  'SPACE INVADERS',
  'Destruye oleadas de alienígenas antes de que lleguen a la Tierra.',
  'Maneja tu cañón láser para abatir cinco filas de invasores que descienden implacablemente. Usa los cuatro escudos para cubrirte, dispara la nave misteriosa para puntuación extra y sobrevive hasta la oleada 10.',
  'SHOOTER',
  'cover-space-invaders',
  'green'
);
```

### Props del componente `SpaceInvadersGame`

```ts
interface SpaceInvadersGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

El estado local arranca con `lives = 3`, `score = 0`, `level = 1`.
`onLivesChange(0)` se dispara justo antes de `onGameOver(score)` tanto en derrota como al completar el nivel 10.

---

## Implementation plan

### 1. INSERT en Supabase

Ejecutar el SQL del data model en el SQL Editor de Supabase.

Verificación: la fila `space-invaders` aparece en el Table Editor; `/games` muestra la card con cover `cover-space-invaders` y color `green`.

### 2. Constantes y tipos del módulo

Definir al inicio de `SpaceInvadersGame.tsx` (fuera del componente, nivel de módulo) las constantes que no cambian entre renders:

```ts
const CANVAS_W = 600;
const CANVAS_H = 700;
const COLS = 11;
const ROWS = 5;
const INV_W = 36; // ancho sprite invasor px
const INV_H = 24; // alto sprite invasor px
const INV_GAP_X = 16;
const INV_GAP_Y = 14;
const INV_POINTS = [30, 20, 10, 10, 10]; // por fila 0..4 (fila 0 = octopus en top)
const SHIELD_COUNT = 4;
const BULLET_SPEED = 400; // px/s jugador
const ENEMY_BULLET_SPEED = 220; // px/s enemigo
const UFO_SPEED = 120; // px/s
const UFO_POINTS = [50, 100, 150, 300];
const MAX_LEVEL = 10;
```

Tipos internos:

```ts
type Invader = {
  col: number;
  row: number;
  alive: boolean;
  type: 0 | 1 | 2;
  animFrame: 0 | 1;
};
type Bullet = { x: number; y: number; active: boolean };
type Shield = { pixels: Uint8Array }; // 22*16 bits, 1=intact 0=destroyed
type UFO = { x: number; active: boolean; points: number };
```

### 3. Crear `components/games/SpaceInvadersGame.tsx`

Estructura general del componente:

```
useEffect(() => {
  // 1. Obtener contexto canvas
  // 2. Inicializar estado del juego (initGame)
  // 3. Registrar keydown/keyup en document
  // 4. Arrancar requestAnimationFrame loop
  // 5. return () => { cancelAnimationFrame; removeEventListeners }
}, [paused, onScoreChange, onLivesChange, onLevelChange, onGameOver])
```

Sub-pasos de implementación:

**3a. `initGame(level)`** — reconstruye el estado completo para el nivel dado:

- Crea array de 55 `Invader` con sus posiciones iniciales. En nivel N, el bloque inicia desplazado `(N-1) * 20` px hacia abajo respecto al nivel 1.
- Crea 4 escudos con todos los píxeles intactos (Uint8Array de 352 bytes, uno por escudo).
- Reinicia proyectiles del jugador y enemigos a inactivos.
- Reinicia el UFO a inactivo; genera el próximo tiempo de aparición en `ufoNextAt = now + random(20000, 30000)`.
- Si `level === 1` resetea `lives = 3` y `score = 0`; en niveles siguientes conserva vidas y score acumulado.

**3b. Lógica `update(dt)`** (solo si `!paused`):

- Mover bloque de invasores: acumular `moveTimer`; cuando supera el intervalo (base 800ms reducido 15ms por invasor eliminado, mínimo 80ms) avanzar todo el bloque un paso. Si algún invasor vivo toca los límites laterales (`x ≤ 20` o `x+ancho_bloque ≥ CANVAS_W-20`), descender el bloque `INV_H/2` px y revertir dirección; si el bloque baja por debajo del umbral Y del cañón (`CANVAS_H - 120`), activar game over.
- Animar frame de invasores: alternar `animFrame` cada `moveTimer` reset.
- Disparo del jugador: si `keys.Space` y no hay bala activa y no está en cooldown (200ms), crear `Bullet` en la posición central del cañón.
- Mover bala del jugador: si activa, `y -= BULLET_SPEED * dt`. Si sale del canvas, desactivar.
- Colisión bala del jugador con invasores: para cada invasor vivo, AABB simple. Al hit: `alive = false`, sumar puntos, llamar `onScoreChange` si cambió; si todos muertos llamar `nextLevel()`.
- Colisión bala del jugador con UFO: si UFO activo y AABB, sumar `UFO.points`, desactivar UFO.
- Colisión bala del jugador con escudos: comprobar qué escudo está en esa columna X, destruir píxeles impactados en forma de radial (radio 4px).
- Disparo enemigo: acumular `enemyFireTimer`; intervalo base `2000 - (level-1)*150` ms (mínimo 400ms). Al disparar, elegir al azar un invasor vivo de la fila inferior de su columna; crear `EnemyBullet`.
- Mover balas enemigas: `y += ENEMY_BULLET_SPEED * dt`. Si salen del canvas, desactivar.
- Colisión bala enemiga con escudos: destruir píxeles. Destruir si atraviesa completamente.
- Colisión bala enemiga con cañón: AABB con sprite del cañón (48 × 24px). Al hit: decrementar `lives`, llamar `onLivesChange(lives)`; si `lives === 0` llamar `onLivesChange(0)` + `onGameOver(score)`; si no, animar muerte del cañón (flash 800ms) y reposicionar.
- UFO: si `now >= ufoNextAt` y no activo, activar UFO en `x = -60`, asignar `points` aleatorio. Mover `x += UFO_SPEED * dt`. Si `x > CANVAS_W + 60`, desactivar y programar próxima aparición.

**3c. Lógica `draw()`** (siempre):

- Fondo negro.
- Dibujar invasores vivos con dos frames alternativos (rectángulos de colores por tipo en versión sin sprites; ver Decisions para elección de render):
  - `type 0` (octopus): magenta, forma de pulpo simplificada con `fillRect` + recortes.
  - `type 1` (squid): cyan, antenas y cuerpo.
  - `type 2` (crab): verde claro, pinzas.
- Dibujar escudos: iterar píxeles intactos de cada escudo, `fillRect` de 3×3 px en verde.
- Dibujar bala del jugador: línea vertical blanca 2×10 px.
- Dibujar balas enemigas: zigzag o línea vertical roja 2×10 px.
- Dibujar cañón del jugador: forma de cañón simplificada con `fillRect` (base ancha + cuerpo + cañón), verde.
- Dibujar UFO: elipse roja si activo.
- HUD interno:
  - Top-left: `SCORE: ${score}` en blanco, fuente monoespaciada 16px.
  - Top-center: `HI: ${hiScore}` (mayor score de sesión en memoria).
  - Bottom-left: iconos del cañón (N copias del sprite cañón a escala 0.6) representando vidas restantes.
  - Bottom-right: `LVL ${level}`.
- Si `paused`: overlay semi-transparente con texto "PAUSA".

**3d. `nextLevel()`**:

- Incrementar `level`; si `level > MAX_LEVEL`, llamar `onLivesChange(0)` + `onGameOver(score)` y retornar.
- Llamar `onLevelChange(level)`.
- Llamar `initGame(level)` (conservando `lives` y `score`).

**3e. Event listeners**:

- `keydown`: setear `keys[e.code] = true`. Ignorar repeat (`e.repeat`). Prevenir `preventDefault` para ArrowLeft, ArrowRight, Space.
- `keyup`: setear `keys[e.code] = false`.
- Capturar referencias; limpiar en `return`.

Verificación: el juego arranca en `/games/space-invaders/play`, los invasores se mueven y el cañón responde a las teclas ← → Space.

### 4. Crear `app/games/space-invaders/play/page.tsx`

```tsx
'use client';
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const SpaceInvadersGame = dynamic(
  () => import('@/components/games/SpaceInvadersGame'),
  { ssr: false },
);
```

- Estado local: `score` (0), `lives` (3), `level` (1), `paused` (false), `over` (false), `name` (''), `saved` (false).
- Efecto inicial: leer `localStorage.getItem('av_player_name')` y setear `name`.
- Callbacks memorizados con `useCallback`:
  - `handleScoreChange` → setea `score`.
  - `handleLivesChange` → setea `lives`.
  - `handleLevelChange` → setea `level`.
  - `handleGameOver` → setea `over = true`, `score = finalScore`.
- Layout: reutiliza el patrón visual de las play-pages existentes (HUD React superior con score/vidas/nivel, botón PAUSA/REANUDAR, canvas centrado con efecto CRT, modal game over).
- Modal game over: input de nombre pre-rellenado; botón "GUARDAR SCORE" llama a `supabase.from('scores').insert(...)`, persiste `av_player_name` en localStorage, setea `saved = true` y deshabilita el botón.
- Botón "JUGAR DE NUEVO": setea `over = false`, reinicia `score/lives/level` y cambia `gameKey` para forzar remount del componente canvas.

Verificación: el HUD React refleja score, vidas y nivel en tiempo real durante la partida.

### 5. Verificación final

`npm run build` termina sin errores de TypeScript. Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] La fila `space-invaders` existe en la tabla `games` de Supabase con los valores del data model.
- [ ] La card aparece en `/games` con cover `cover-space-invaders` y color `green`.
- [ ] La ruta `/games/space-invaders/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas (600 × 700) se renderiza correctamente.
- [ ] El grid de 11×5 invasores aparece con los tres tipos visualizados con colores distintos.
- [ ] Los invasores se mueven horizontalmente, descienden al llegar al borde y aceleran al reducirse su número.
- [ ] El cañón se mueve con ← → (y A/D) y dispara con Space.
- [ ] Solo puede haber un proyectil del jugador en vuelo a la vez.
- [ ] Los invasores de la fila inferior de cada columna disparan hacia abajo a intervalos aleatorios.
- [ ] Los 4 escudos se dibujan y se erosionan píxel a píxel al recibir impactos (tanto del jugador como del enemigo).
- [ ] El UFO aparece periódicamente en la parte superior y cruza horizontalmente; si es abatido suma puntos aleatorios.
- [ ] Al eliminar todos los invasores se avanza al siguiente nivel; `onLevelChange` se dispara con el nuevo número.
- [ ] Al recibir un impacto y tener vidas restantes, el cañón desaparece brevemente y reaparece.
- [ ] Al agotar las 3 vidas, `onLivesChange(0)` y `onGameOver(score)` se disparan; aparece el modal React.
- [ ] Si un invasor alcanza la línea inferior del cañón, `onLivesChange(0)` y `onGameOver(score)` se disparan.
- [ ] Al completar el nivel 10, `onLivesChange(0)` y `onGameOver(score)` se disparan como victoria.
- [ ] El HUD interno del canvas (score, hi-score, vidas como iconos, nivel) se dibuja correctamente.
- [ ] El HUD React de la plataforma refleja en tiempo real score, vidas y nivel.
- [ ] El botón "PAUSA" congela el loop; "REANUDAR" lo reanuda.
- [ ] Las teclas P / Esc no provocan pausa independiente del canvas.
- [ ] El modal game over pre-rellena el nombre desde `av_player_name` si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón de guardar se deshabilita tras el primer envío.
- [ ] El score guardado aparece en `/games/space-invaders` y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores en el HUD de la plataforma. Razón: coherencia con el patrón establecido en Asteroids, Tetris, Arkanoid, Snake y Frogger.

- **Sí: 3 vidas** — Space Invaders arranca con 3 vidas en el juego original (3 cañones de reserva). `onLivesChange` notifica cada pérdida; `onLivesChange(0)` dispara el game over. Razón: fiel a la mecánica clásica.

- **Sí: Render vectorial sin sprites externos** — los invasores se dibujan con `fillRect` y `beginPath` en canvas, usando colores canónicos (verde, cyan, magenta). Razón: no hay assets de sprites disponibles para Space Invaders en el repositorio; el render vectorial es autocontenido y evita dependencias externas.

- **Sí: Constantes a nivel de módulo** — todas las constantes numéricas y tipos viven fuera del componente. Razón: evitar re-creación en cada render (patrón de performance del spec 12).

- **Sí: requestAnimationFrame con delta time** — el loop usa acumulador de delta para que la velocidad no dependa del framerate. Razón: consistencia con juegos como Frogger; evita comportamientos distintos en pantallas de 60/120 Hz.

- **Sí: Escudos como Uint8Array de píxeles** — cada escudo es un array de 352 bits (22×16). Razón: representación compacta y acceso O(1) por coordenada; soporta erosión individual sin estructuras complejas.

- **Sí: MAX_LEVEL = 10** — completar el nivel 10 se trata como victoria y dispara `onGameOver`. Razón: el juego original es teóricamente infinito, pero la plataforma necesita una condición de fin; 10 oleadas de dificultad creciente ofrecen un reto razonable.

- **Sí: Play-page específica `app/games/space-invaders/play/page.tsx`** — en lugar de la ruta genérica `[id]/play`. Razón: coherencia con todos los juegos existentes; Next.js App Router prioriza rutas estáticas.

- **No: Sonidos** — cubiertos en el spec 02 (`02-space-invaders-sfx.md`). Razón: mantener el scope core acotado; los sonidos son una mejora progresiva no bloqueante.

- **No: Power-ups** — fuera del scope de este spec. Razón: la mecánica base es suficientemente compleja; los power-ups se pueden añadir en un spec futuro de extensión.

- **No: Controles táctiles / mobile** — fuera de alcance. Razón: estándar de la plataforma; se cubre con el agente `mobile-porter`.

- **No: Supabase Auth y RLS** — `user_id` se almacena como `null`. Razón: estándar de todos los juegos actuales; se abordará en spec futuro de seguridad.

- **No: Realtime en leaderboard** — los scores se ven al recargar. Razón: complejidad de subscriptions no aporta valor con la base de jugadores actual.
