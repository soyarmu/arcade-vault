# Template de spec para un nuevo juego en Arcade Vault

Este archivo es el molde que el skill `/add-game` usa al generar specs. Cada sección muestra su propósito y un ejemplo con placeholders. **No copiar verbatim** — los placeholders `{{VARIABLE}}` se reemplazan con los valores reales del juego.

Placeholders disponibles:

| Placeholder               | Descripción                                            |
| ------------------------- | ------------------------------------------------------ |
| `{{NN}}`                  | Número secuencial del spec (ej. `07`)                  |
| `{{ID}}`                  | Slug del juego, kebab-case (ej. `tetris`)              |
| `{{TITLE}}`               | Nombre del juego en mayúsculas (ej. `TETRIS`)          |
| `{{COMPONENT_NAME}}`      | PascalCase del componente React (ej. `TetrisGame`)     |
| `{{CAT}}`                 | Categoría: `ARCADE`, `PUZZLE` o `SHOOTER`              |
| `{{COVER}}`               | Clase CSS de cover (ej. `cover-rocas`)                 |
| `{{COLOR}}`               | Color de acento: `cyan`, `magenta`, `yellow` o `green` |
| `{{SHORT}}`               | Descripción corta (≤ 50 caracteres)                    |
| `{{LONG}}`                | Descripción larga (2-3 frases)                         |
| `{{CANVAS_W}}`            | Ancho del canvas en px (ej. `800`)                     |
| `{{CANVAS_H}}`            | Alto del canvas en px (ej. `600`)                      |
| `{{CONTROLS}}`            | Lista de teclas y sus acciones                         |
| `{{GAME_OVER_CONDITION}}` | Condición que termina la partida                       |
| `{{HUD_FIELDS}}`          | Campos expuestos al HUD React (score, lives, level…)   |
| `{{TOP_N}}`               | Tamaño del leaderboard (por defecto `10`)              |
| `{{SOURCE_NOTE}}`         | Nota sobre origen del juego (reference o desde cero)   |

---

## Header

```markdown
# SPEC {{NN}} — Integración del juego {{TITLE}}

> **Estado:** Borrador
> **Depende de:** 06-games-table-leaderboard-supabase
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Integrar {{TITLE}} como juego jugable en Arcade Vault, adaptando su canvas a React y conectando el leaderboard de Supabase.
```

---

## Scope

```markdown
## Scope

**In:**

- Insertar la fila `{{ID}}` en la tabla `games` de Supabase (seed manual via SQL).
- Crear `components/games/{{COMPONENT_NAME}}.tsx` — componente React que encapsula el canvas
  y el game loop. Acepta props: `paused`, `onScoreChange`, {{HUD_CALLBACKS}}`onGameOver`.
- Crear `app/games/{{ID}}/play/page.tsx` — play-page específica para este juego.
  Gestiona el estado ({{HUD_FIELDS}}, pausa, game over) y pasa callbacks al componente canvas.
- Wiring del modal de game over: pre-rellenar nombre desde `localStorage.getItem('av_player_name')`;
  al confirmar, guardar nombre en localStorage e insertar score en la tabla `scores` vía cliente browser.
- Botón de pausa de la plataforma pasa el flag `paused` al componente canvas, que congela el game loop.
- Eliminar únicamente el overlay "GAME OVER" del canvas — el modal React de la plataforma lo reemplaza.
  El HUD interno del canvas ({{HUD_FIELDS}}) se conserva intacto.

**Fuera de alcance:**

- Crear las tablas `games` o `scores` en Supabase — ya existen (spec 06).
- Supabase Auth — `user_id` se almacena como `null` en todos los scores.
- RLS (Row Level Security) — se configura en un spec futuro de seguridad.
- Realtime — el leaderboard no se actualiza en vivo; solo al cargar la página.
- Paginación del leaderboard — se muestran los top {{TOP_N}} fijos.
- Controles táctiles o mobile.
- Actualización automática de `best` y `plays` en la tabla `games` — campos estáticos.
```

---

## Data model

```markdown
## Data model

### Seed en Supabase — tabla `games`

Ejecutar en el SQL Editor de Supabase:

\`\`\`sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
'{{ID}}', '{{TITLE}}', '{{SHORT}}',
'{{LONG}}',
'{{CAT}}', '{{COVER}}', '{{COLOR}}'
);
\`\`\`

### Props del componente `{{COMPONENT_NAME}}`

\`\`\`ts
interface {{COMPONENT_NAME}}Props {
paused: boolean;
onScoreChange: (score: number) => void;
// Añadir o quitar según {{HUD_FIELDS}}:
onLivesChange: (lives: number) => void;
onLevelChange: (level: number) => void;
onGameOver: (finalScore: number) => void;
}
\`\`\`

No se introducen nuevas tablas ni tipos TypeScript — se reutilizan `GameRow` y `ScoreRow`
de `lib/supabase/types.ts`.
```

---

## Implementation plan

```markdown
## Implementation plan

1. **Seed en Supabase** — ejecutar el INSERT de la fila `{{ID}}` en el SQL Editor de Supabase.
   Verificación: la card de {{TITLE}} aparece en `/games`.

2. **Crear `components/games/{{COMPONENT_NAME}}.tsx`** — componente `"use client"` que:
   - Renderiza un `<canvas>` de {{CANVAS_W}}×{{CANVAS_H}}.
   - Contiene el game loop completo {{SOURCE_NOTE}}.
   - Recibe prop `paused: boolean` — si es `true`, el loop llama a `draw()` pero no a `update()`.
   - Llama `onScoreChange`, {{HUD_CALLBACKS_LIST}} cada vez que esos valores cambian
     dentro del loop (comparando con el valor anterior antes de disparar el callback).
   - Llama `onGameOver(score)` cuando el juego llega a su condición de fin: {{GAME_OVER_CONDITION}}.
   - El overlay canvas "GAME OVER" se elimina del `draw()`.
   - El HUD canvas se mantiene sin cambios.
   - Limpia los event listeners de teclado en el `return` del `useEffect`.
     Verificación: el juego arranca en `/games/{{ID}}/play` y es jugable con {{CONTROLS}}.

3. **Crear `app/games/{{ID}}/play/page.tsx`** — play-page específica:
   - Importa `{{COMPONENT_NAME}}` con `dynamic(..., { ssr: false })`.
   - Estado local: `score`, {{HUD_STATE_VARS}}, `paused`, `over`, `name`, `saved`, `gameKey`.
   - Al montar el modal de game over (`over === true`), lee `localStorage.getItem('av_player_name')`
     y pre-rellena el campo `name`.
   - Al confirmar, persiste el nombre en `av_player_name` e inserta en `scores`:
     `{ game_id: '{{ID}}', player_name: name, score, user_id: null }`.
   - Marca `saved: true` para deshabilitar el botón y evitar doble inserción.
   - Reutiliza el mismo layout visual (HUD React + CRT + modal game over) que
     `app/games/asteroids/play/page.tsx`.
     Verificación: el HUD React muestra los valores en tiempo real; tras una partida el score
     aparece en `/games/{{ID}}` y en `/hall-of-fame` al recargar.

4. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.
```

---

## Acceptance criteria

```markdown
## Acceptance criteria

- [ ] La card de {{TITLE}} aparece en `/games`.
- [ ] `/games/{{ID}}` carga con los datos reales del juego y el leaderboard top {{TOP_N}}.
- [ ] `/games/{{ID}}/play` carga sin errores de SSR ni de TypeScript.
- [ ] El canvas renderiza el juego y es jugable con {{CONTROLS}}.
- [ ] El HUD interno del canvas se dibuja correctamente durante la partida.
- [ ] El HUD React de la plataforma refleja en tiempo real los valores de {{HUD_FIELDS}}.
- [ ] El botón "PAUSA" congela el game loop; "REANUDAR" lo reanuda.
- [ ] Al terminar la partida, aparece el modal React de game over con la puntuación final.
- [ ] El overlay "GAME OVER" del canvas ya no se dibuja (el modal React lo reemplaza).
- [ ] El botón "JUGAR DE NUEVO" reinicia la partida desde cero.
- [ ] Al abrir el modal, el campo de nombre se pre-rellena con `av_player_name` de localStorage si existe.
- [ ] Al confirmar, el score se inserta en Supabase y el nombre se persiste en localStorage.
- [ ] El botón "GUARDAR PUNTUACIÓN" se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/{{ID}}` y en `/hall-of-fame` al recargar.
- [ ] Cuando no hay scores, el leaderboard muestra "Sé el primero en entrar al salón de la fama".
- [ ] `/hall-of-fame` muestra un tab para {{TITLE}}.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.
```

---

## Decisions

```markdown
## Decisions

- **Sí: Doble HUD** — el canvas conserva su HUD interno y React muestra los mismos valores
  en el HUD de la plataforma. Razón: el juego funciona visualmente como standalone dentro del
  canvas, y la plataforma necesita los valores para integraciones futuras.

- **Sí: Callbacks como interfaz de comunicación** — el componente canvas llama a
  `onScoreChange`, {{HUD_CALLBACKS_LIST}}, `onGameOver` cuando el estado cambia.
  Razón: desacoplamiento limpio; el juego no sabe nada de React ni de la plataforma.

- **Sí: `dynamic(..., { ssr: false })`** — el componente canvas se carga solo en cliente.
  Razón: `canvas` y `requestAnimationFrame` no existen en el entorno Node.js de Next.js SSR.

- **Sí: Play-page específica `app/games/{{ID}}/play/page.tsx`** — en lugar de modificar la ruta
  genérica `[id]/play`. Razón: evita condicionales en la ruta genérica; Next.js App Router
  da prioridad a rutas estáticas sobre dinámicas.

- **Sí: Un único spec combinado (juego + leaderboard)** — las tablas `games` y `scores` ya
  existen; solo se añade la fila del juego y el wiring. Separarlos no aportaría valor visible.

- **No: Crear tablas nuevas por juego** — se reutilizan `games` y `scores` del spec 06.
  Razón: el modelo es suficientemente genérico para cualquier juego con score numérico.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: se mitiga en el spec futuro de seguridad.

- **No: Realtime en leaderboards** — los scores se ven al recargar.
  Razón: la complejidad de subscriptions no aporta valor mientras haya pocos jugadores activos.

- **No: Componente genérico `CanvasGame`** — cada juego tiene su componente propio.
  Razón: YAGNI; generalizar ahora sería abstraer sin caso de uso suficientemente confirmado.
```

---

## Reglas globales del documento generado

- **Nombres concretos.** Si se menciona una función, dar su nombre real. Si se menciona un archivo, dar su ruta relativa completa.
- **Sin TODOs.** Una decisión pendiente se documenta como decisión con `?` y razón de aplazamiento.
- **Sin código ejecutable largo.** El spec describe; el código lo escribe `/spec-impl`. Snippets cortos para ilustrar estructuras de datos son válidos; funciones completas no.
- **Markdown estándar.** Debe renderizar en GitHub sin extensiones.
