# SPEC 05 — Integración del juego Asteroids

> **Estado:** Implementado
> **Depende de:** 04-supabase-integration
> **Fecha:** 2026-05-15
> **Objetivo:** Integrar el juego Asteroids (canvas puro) como un nuevo juego jugable
> en la plataforma con ID `asteroids`, conectando su estado interno (score, vidas, nivel,
> game over) con el HUD y la interfaz React de la play-page dedicada.

---

## Scope

**In:**

- Añadir entrada `asteroids` al array `GAMES` en `app/data/games.ts`.
- Crear `components/games/AsteroidsGame.tsx` — componente React que encapsula el canvas
  y el game loop adaptado de `references/started-games/02-asteroids/game.js`. Acepta props:
  `paused`, `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver`.
- El juego mantiene su HUD interno dibujado en canvas (score, nivel, vidas) sin modificaciones.
- El componente canvas notifica a React de cada cambio de estado vía callbacks — React
  también refleja esos valores en el HUD de la plataforma.
- Crear `app/games/asteroids/play/page.tsx` — play-page específica para este juego.
  Gestiona el estado (score, vidas, nivel, pausa, game over) y pasa callbacks al componente canvas.
- Botón de pausa de la plataforma pasa el flag `paused` al componente canvas, que congela
  el game loop.
- Eliminar únicamente el overlay "GAME OVER" del canvas — el modal React de la plataforma
  lo reemplaza. El HUD (score, nivel, vidas) se conserva intacto.

**Fuera de alcance:**

- Guardar puntuaciones en Supabase (spec futuro de scores).
- Añadir otros juegos canvas a la plataforma.
- Extraer un componente genérico `CanvasGame` — se hará cuando llegue el segundo juego canvas.
- Controles táctiles o mobile.
- El juego `rocas` (ID distinto, datos distintos — no se toca).

---

## Data model

Una nueva entrada en el array `GAMES` de `app/data/games.ts`:

```ts
{
  id: 'asteroids',
  title: 'ASTEROIDS',
  short: 'Pulveriza rocas en gravedad cero.',
  long: 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Supera niveles y acumula puntos antes de que los asteroides te alcancen.',
  cat: 'SHOOTER',
  cover: 'cover-rocas',
  color: 'yellow',
  best: 0,
  plays: '0',
}
```

Props del componente `AsteroidsGame`:

```ts
interface AsteroidsGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

No se introduce ningún modelo de datos persistente en este spec.

---

## Implementation plan

1. **Añadir `asteroids` a `GAMES`** — agregar la entrada en `app/data/games.ts`.
   Verificación: la página `/games` muestra la card de Asteroids.

2. **Crear `components/games/AsteroidsGame.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de 800×600.
   - Contiene el game loop completo adaptado de `game.js` (clases `Bullet`, `Asteroid`,
     `Ship`, `Particle`, funciones `update`/`draw`/`loop`).
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no a `update()`.
   - Llama `onScoreChange`, `onLivesChange`, `onLevelChange` cada vez que esos valores cambian
     dentro del loop (comparando con el valor anterior antes de disparar el callback).
   - Llama `onGameOver(score)` cuando `state` pasa a `'gameover'`, en lugar de mostrar
     el overlay canvas de game over.
   - El overlay canvas "GAME OVER" y el texto "ESPACIO PARA REINICIAR" se eliminan del `draw()`.
   - El HUD canvas (`drawHUD`) se mantiene sin cambios.
   - Limpia los event listeners de teclado en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/asteroids/play` y es jugable.

3. **Crear `app/games/asteroids/play/page.tsx`** — play-page específica:
   - Importa `AsteroidsGame` con `dynamic(..., { ssr: false })` para evitar errores de canvas
     en SSR.
   - Estado local: `score`, `lives`, `level`, `paused`, `over`, `name`, `saved`.
   - Pasa `paused` y los cuatro callbacks a `AsteroidsGame`.
   - Reutiliza el mismo layout visual (HUD React + CRT + modal game over) que la play-page
     genérica existente, reemplazando el `div.game-arena` placeholder por el componente canvas.
     Verificación: el HUD React muestra los valores en tiempo real mientras se juega.

4. **Verificación final** — `npm run build` termina sin errores de TypeScript.

---

## Acceptance criteria

- [ ] La card de Asteroids aparece en `/games` con ID `asteroids`.
- [ ] La ruta `/games/asteroids/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas renderiza el juego (nave, asteroides, balas, partículas) y es jugable con
      teclado (flechas + espacio).
- [ ] El HUD interno del canvas (score, nivel, vidas) se dibuja correctamente durante la partida.
- [ ] El HUD React de la plataforma refleja en tiempo real los mismos valores de score,
      vidas y nivel que el canvas.
- [ ] El botón "PAUSA" de la plataforma congela el game loop; "REANUDAR" lo reanuda.
- [ ] Al perder todas las vidas, aparece el modal React de game over con la puntuación final.
- [ ] El overlay "GAME OVER" del canvas ya no se dibuja (el modal React lo reemplaza).
- [ ] El botón "JUGAR DE NUEVO" del modal reinicia la partida desde cero.
- [ ] `npm run build` completa sin errores relacionados con los archivos nuevos.
- [ ] La play-page genérica `/games/[id]/play` y el resto de rutas existentes no se rompen.

---

## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores
  en el HUD de la plataforma. Razón: el juego debe funcionar visualmente como standalone
  dentro del canvas, y la plataforma necesita los valores para futuras integraciones
  (guardar scores en Supabase, mostrar récords, etc.).

- **Sí: Callbacks como interfaz de comunicación** — el componente canvas llama a
  `onScoreChange`, `onLivesChange`, `onLevelChange`, `onGameOver` cuando el estado cambia.
  Razón: desacoplamiento limpio; el juego no sabe nada de React ni de la plataforma.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente.
  Razón: `canvas` y `requestAnimationFrame` no existen en el entorno Node.js de Next.js SSR.

- **Sí: Play-page específica `app/games/asteroids/play/page.tsx`** — en lugar de
  modificar la ruta genérica `[id]/play`. Razón: evita condicionales en la ruta genérica
  y mantiene cada juego aislado; Next.js App Router da prioridad a rutas estáticas sobre
  dinámicas.

- **No: Componente genérico `CanvasGame`** — se extrae cuando llegue el segundo juego canvas.
  Razón: YAGNI; generalizar ahora sería abstraer sin caso de uso confirmado.

- **No: Eliminar el HUD canvas** — se mantiene intacto. Razón: el usuario lo confirmó
  explícitamente; tocarlo sería modificar el juego original más allá de lo necesario.

- **No: Controles de pausa dentro del canvas** — la plataforma controla la pausa vía prop.
  Razón: consistencia con el resto de juegos de la plataforma.
