# SPEC 12 — Performance fixes para FroggerGame

> **Estado:** implementado
> **Depende de:** specs/game-jam/frogger/01-frogger-core.md
> **Fecha:** 2026-05-25
> **Objetivo:** Eliminar el jank de frames y el crecimiento de memoria en FroggerGame
> corrigiendo allocaciones dentro del loop RAF, evitando redraws innecesarios en pausa,
> y bloqueando re-renders React del componente canvas cuando el estado del padre cambia
> pero las props de FroggerGame no lo hacen.

---

## Scope

**In:**

- `components/games/FroggerGame.tsx`
  - Mover `[8, 8]` y `[]` de `setLineDash` a constantes de módulo para eliminar
    allocaciones por frame.
  - Saltar `draw()` cuando `pausedRef.current === true`; dibujar un único frame
    al entrar en pausa para dejar el canvas congelado bajo el overlay React.
  - Limitar `submergeTimer` a `% (TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS)` para
    evitar crecimiento numérico ilimitado.
  - Precomputar el índice de cada lane en un `Map<Lane, number>` al construir las
    lanes, eliminando `lanes.indexOf(lane)` del hot loop de dibujo.
  - Exportar el componente con `React.memo` para que re-renders del padre no
    re-renderizen el componente canvas cuando sus props no han cambiado.

- `app/games/frogger/play/page.tsx`
  - Convertir `score`, `lives` y `level` de `useState` a `useRef<number>` + refs
    de DOM, actualizando el texto directamente (`scoreEl.current.textContent = ...`)
    desde los callbacks para eliminar re-renders React durante el juego.
  - Mantener como `useState`: `paused`, `over`, `name`, `saved`, `gameKey`,
    `skinKey` — solo cambian por acción del usuario, no a 60 fps.
  - Los callbacks `onScoreChange`, `onLivesChange`, `onLevelChange` pasan a escribir
    en refs en lugar de llamar a setters de estado.
  - El modal de game-over toma la puntuación final de `scoreRef.current` en lugar
    de estado React.
  - El HUD visible (puntuación, vidas, nivel, skin-selector) se mantiene en el DOM
    React; solo cambia el mecanismo de actualización (DOM directo vs. setState).

**Out:**

- Los demás juegos (Asteroids, Tetris, Arkanoid, Snake) — quedan para un spec separado.
- Offscreen canvas / dirty-rect rendering — complejidad no justificada hasta verificar
  que las fixes simples resuelven el problema.
- Cambios en el diseño visual del HUD React o del HUD interno del canvas.
- Profiling formal con DevTools — este spec parte de observación subjetiva.

---

## Modelo de datos

No se introducen estructuras nuevas. Los cambios son internos:

- `DASH_ROAD: number[]` — constante de módulo que reemplaza el literal `[8, 8]`.
- `DASH_CLEAR: number[]` — constante de módulo que reemplaza el literal `[]`.
- `laneIndexMap: Map<Lane, number>` — creado en `buildLanes`, devuelto junto con
  las lanes para que el loop de dibujo lo consulte en O(1).
- En la play-page: `scoreRef`, `livesRef`, `levelRef` son `useRef<number>` que
  almacenan los valores actuales del juego sin disparar re-renders.
- `scoreEl`, `livesEl`, `levelEl` son `useRef<HTMLElement>` que apuntan a los
  nodos DOM del HUD para actualización directa.

---

## Plan de implementación

Cada paso deja el sistema funcional.

1. **Constantes de módulo para `setLineDash`** (`FroggerGame.tsx`)
   Añadir en el nivel de módulo (fuera de todo componente):

   ```ts
   const DASH_ROAD: number[] = [8, 8];
   const DASH_CLEAR: number[] = [];
   ```

   Reemplazar las dos llamadas `ctx.setLineDash([8, 8])` y `ctx.setLineDash([])`
   dentro de `draw()` por `DASH_ROAD` y `DASH_CLEAR`.

2. **Saltar `draw()` cuando pausado** (`FroggerGame.tsx`)
   Añadir `let pauseDrawn = false` junto al resto del estado local del efecto.
   En el loop RAF:

   ```ts
   if (pausedRef.current) {
     if (!pauseDrawn) {
       draw();
       pauseDrawn = true;
     }
     rafId = requestAnimationFrame(loop);
     return;
   }
   pauseDrawn = false;
   update(dt);
   draw();
   ```

3. **Limitar `submergeTimer`** (`FroggerGame.tsx`)
   En la sección donde se actualiza `submergeTimer` dentro de `update()`:

   ```ts
   const cycle = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS;
   e.submergeTimer = ((e.submergeTimer ?? 0) + dt) % cycle;
   e.submerged = e.submergeTimer >= TURTLE_VISIBLE_MS;
   ```

   Eliminar la duplicación de `cycle` que ya existe en el mismo bloque.

4. **Precomputar índice de lane** (`FroggerGame.tsx`)
   Cambiar la firma de `buildLanes` para que devuelva también el mapa:

   ```ts
   function buildLanes(level: number): {
     lanes: Lane[];
     laneIndexMap: Map<Lane, number>;
   };
   ```

   Construir el `Map` al final de `buildLanes` antes del `return`.
   En el estado local del efecto, sustituir `let lanes = buildLanes(1)` por
   `let { lanes, laneIndexMap } = buildLanes(1)`.
   Actualizar `completeRound()` para desestructurar igual al llamar `buildLanes(level)`.
   En `draw()`, reemplazar `lanes.indexOf(lane)` por `laneIndexMap.get(lane) ?? 0`.

5. **`React.memo` en FroggerGame** (`FroggerGame.tsx`)
   Cambiar la exportación final:

   ```ts
   // antes
   export default function FroggerGame(...) { ... }
   // después
   function FroggerGame(...) { ... }
   export default React.memo(FroggerGame);
   ```

   Añadir `import React from 'react'` si no está ya importado explícitamente.

6. **Convertir score/lives/level a refs en la play-page** (`play/page.tsx`)
   - Eliminar `const [score, setScore] = useState(0)`,
     `const [level, setLevel] = useState(1)`,
     `const [lives, setLives] = useState(3)`.
   - Añadir:
     ```ts
     const scoreRef = useRef(0);
     const livesRef = useRef(3);
     const levelRef = useRef(1);
     const scoreEl = useRef<HTMLSpanElement>(null);
     const livesEl = useRef<HTMLSpanElement>(null);
     const levelEl = useRef<HTMLSpanElement>(null);
     ```
   - Actualizar `handleScoreChange`, `handleLivesChange`, `handleLevelChange`
     para escribir en el ref y en el DOM directamente:

     ```ts
     const handleScoreChange = useCallback((s: number) => {
       scoreRef.current = s;
       if (scoreEl.current)
         scoreEl.current.textContent = s.toLocaleString('es-ES');
     }, []);

     const handleLivesChange = useCallback((l: number) => {
       livesRef.current = l;
       if (livesEl.current) {
         livesEl.current.innerHTML = Array.from({ length: 3 })
           .map(
             (_, i) =>
               `<span style="color:${i < l ? 'var(--green)' : 'var(--ink-dim)'}">♥</span>`,
           )
           .join('');
       }
     }, []);

     const handleLevelChange = useCallback((l: number) => {
       levelRef.current = l;
       if (levelEl.current)
         levelEl.current.textContent = String(l).padStart(2, '0');
     }, []);
     ```

   - En `handleGameOver`, leer `scoreRef.current` para actualizar el modal:
     ```ts
     const handleGameOver = useCallback((finalScore: number) => {
       scoreRef.current = finalScore;
       if (scoreEl.current)
         scoreEl.current.textContent = finalScore.toLocaleString('es-ES');
       setOver(true);
     }, []);
     ```
   - Añadir `ref={scoreEl}`, `ref={livesEl}`, `ref={levelEl}` a los spans del HUD.
   - En el modal de game-over, reemplazar `{score.toLocaleString('es-ES')}` por
     `{scoreRef.current.toLocaleString('es-ES')}` (valor estático en el render
     del modal, correcto porque `over` se activa después de actualizar el ref).
   - En `restart()`, resetear los refs y el DOM:
     ```ts
     scoreRef.current = 0; livesRef.current = 3; levelRef.current = 1;
     if (scoreEl.current) scoreEl.current.textContent = '0';
     if (livesEl.current) livesEl.current.innerHTML = /* corazones iniciales */;
     if (levelEl.current) levelEl.current.textContent = '01';
     ```

---

## Criterios de aceptación

- [ ] La memoria del tab en Chrome DevTools no crece continuamente durante 2 minutos de juego con skin classic.
- [ ] No se observan frame drops en los primeros 60 segundos de juego.
- [ ] El canvas no se redibuja mientras el juego está en pausa (verificable añadiendo `console.count('draw')` temporalmente).
- [ ] El HUD React muestra la puntuación correcta cuando la rana avanza filas.
- [ ] El HUD React muestra las vidas correctas al morir.
- [ ] El modal de game-over muestra la puntuación final correcta.
- [ ] El skin-selector cambia el skin del canvas en tiempo real.
- [ ] El botón PAUSA / REANUDAR funciona igual que antes.
- [ ] JUGAR DE NUEVO reinicia score, vidas y nivel a 0 / 3 / 1 tanto en el canvas como en el HUD.
- [ ] React DevTools Profiler muestra 0 re-renders de `FroggerPlay` durante gameplay normal (solo rana moviéndose, sin morir ni subir nivel).

---

## Post-implementación: problema residual en skin Neon

### Diagnóstico (2026-05-25)

Tras implementar los 6 pasos del spec, los skins **Classic** y **Retro** fueron fluidos, pero el skin **Neon** seguía con jank. La causa raíz no era ninguno de los problemas del scope original — era el uso masivo de `ctx.shadowBlur` en el loop `draw()`:

| Bloque                      | Llamadas `shadowBlur > 0` por frame |
| --------------------------- | ----------------------------------- |
| Coches (fill + stroke neon) | ~2 × nº coches ≈ 12                 |
| Camiones (fill + stroke)    | ~2 × nº camiones ≈ 10               |
| Logs                        | ~1 × nº logs ≈ 9                    |
| Tortugas (por segmento)     | ~1 × nº segmentos ≈ 18              |
| Goals, rana, timer, vidas   | ~5–10 fijos                         |
| **Total**                   | **~60–70 por frame, sólo en neon**  |

`ctx.shadowBlur` hace que el navegador rasterice cada shape dos veces y aplique un desenfoque gaussiano — notoriamente caro en Canvas 2D. Los otros juegos del repo usan el mismo patrón pero con muchas menos shapes por frame.

### Solución aplicada: caché de sprites neon offscreen

Se pre-renderizó cada tipo de entidad neon **una sola vez** al montar (y al cambiar de skin) en pequeños `HTMLCanvasElement` con `shadowBlur` ya horneado. El loop `draw()` llama `ctx.drawImage(sprite, x, y)` — coste de composición, sin blur runtime.

**Sprites generados (~20 en total):**

- `spriteCarNeon(sk, width, color)` — por color × ancho (1 o 2 celdas)
- `spriteTruckNeon(sk, dir)` — dos variantes: cab derecha / cab izquierda
- `spriteLogNeon(sk, width)` — anchos 2, 3, 4
- `spriteTurtleSegNeon(sk, dir, submerged)` — 4 variantes (dir × submerged)

**Cambios en `FroggerGame.tsx`:**

- Funciones `spriteCarNeon`, `spriteTruckNeon`, `spriteLogNeon`, `spriteTurtleSegNeon`, `buildNeonCache` a nivel de módulo.
- `interface NeonCache` con los mapas de sprites.
- `const SPRITE_PAD = 20` — padding para que el blur no se recorte en los bordes.
- `neonCacheRef = useRef<NeonCache | null>(null)` en el componente.
- `useEffect([skinKey])` unificado: actualiza `skinRef.current` **y** reconstruye `neonCacheRef.current`.
- Loop de entidades en `draw()`: ramificación `if (isNeon && neonCache) { drawImage } else { código original }`.

**Resultado:** de ~65 invocaciones `shadowBlur` por frame a **≤5** (rana, patas durante salto, barra de tiempo, goals, vidas), manteniendo el look visual idéntico al diseño original neon.

**Commit:** `35b7672` — `perf(frogger): neon sprite cache eliminates per-frame shadowBlur on entities`

---

## Decisiones tomadas y descartadas

- **Offscreen canvas para el fondo estático**: descartado — complejidad no justificada hasta comprobar que las fixes simples resuelven el problema.
- **Parar el RAF completamente al pausar y reiniciarlo al reanudar**: descartado — añade complejidad de arranque diferido; saltar `draw()` con `pauseDrawn` es suficiente.
- **Mover score/vidas/nivel al canvas exclusivamente (eliminar HUD React)**: descartado — el usuario quiere mantener score, vidas, nivel y skin-selector en el HUD React.
- **React.memo con comparador personalizado**: descartado — el comparador shallow por defecto es suficiente porque los callbacks son estables (`useCallback` con `[]`).
- **Definición rápida sin clarificación detallada**: no aplicado — se realizaron 3 bloques de preguntas antes de escribir el spec.

---

## Riesgos identificados

- **Modal con score 0**: si `handleGameOver` no actualiza `scoreRef.current` antes de llamar `setOver(true)`, el modal renderiza `0`. Mitigación: el paso 6 actualiza el ref antes del setter, y el modal usa `scoreRef.current` (valor por referencia en el momento del render del modal, que ocurre después).
- **`React.memo` oculta bugs futuros**: si se añaden nuevas props a FroggerGame que deberían forzar re-renders pero son objetos creados inline, el memo los ignorará. Mitigación: los props actuales son `boolean`, `string` y funciones estables — bajo riesgo mientras no se añadan props de objeto.
- **innerHTML en livesEl**: usar `innerHTML` en un callback introduce riesgo de XSS si el contenido viniera de input externo. Aquí el contenido es 100% controlado (corazones hardcoded + número). Sin riesgo real.
