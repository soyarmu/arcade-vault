---
name: add-game
description: Genera un spec para añadir un nuevo juego canvas a Arcade Vault (componente React, play-page, fila en tabla games de Supabase y wiring del modal de leaderboard). Acepta una carpeta de references/started-games/ o una descripción libre del juego. No escribe código; solo produce specs/NN-<slug>-game.md.
disable-model-invocation: true
argument-hint: '<carpeta references/started-games/NN-name> o <descripción corta del juego>'
---

# /add-game — Generador de spec para nuevo juego

Este skill produce un spec siguiendo el patrón consolidado de `specs/05-asteroids-game.md` + `specs/06-games-table-leaderboard-supabase.md`. **No escribe código.** Solo genera el `.md` del spec que luego se ejecuta con `/spec-impl`.

Asume que el spec 06 ya está implementado: las tablas `games` y `scores` existen en Supabase, `lib/supabase/types.ts` exporta `GameRow` y `ScoreRow`, y las rutas `/games`, `/games/[id]`, `/games/[id]/play` y `/hall-of-fame` ya consumen esas tablas dinámicamente.

Tus respuestas deben estar siempre en el **mismo idioma que el prompt inicial** (si el usuario escribe en español, responde en español).

---

## Fase 1 — Contexto del proyecto

Antes de preguntar nada, recoge contexto:

1. Leer `CLAUDE.md` y `AGENTS.md`.
2. **Leer `.claude/skills/spec/SKILL.md`** — es el skill base de escritura de specs de este proyecto.
   Sus reglas de formato, tono, estructura de secciones y criterios de calidad son la referencia
   canónica que debes respetar al generar cualquier spec. En particular, interioriza:
   - Las reglas de la Fase 3 (desarrollo sección por sección con confirmación).
   - Las reglas de la Fase 4 (guardado, numeración, estado `Borrador` por defecto).
   - Las reglas invariantes ("Hard rules") del final del documento.
3. **Leer `.claude/skills/spec/template.md`** — es el molde estructural que todo spec de este
   proyecto sigue. Las secciones, el orden y el nivel de detalle de los specs que produces
   deben ser coherentes con ese template (ajustado al dominio de juegos mediante `template.md`
   de este skill).
4. Listar `specs/` para determinar el número `NN` del próximo spec (el mayor número existente + 1).
5. Leer los dos specs más recientes para mantener convención de idioma, formato y nivel de detalle.
6. Verificar que `lib/supabase/types.ts` exporta `GameRow` y `ScoreRow`. Si no existen, abortar y pedir al usuario que implemente primero el spec 06 (`06-games-table-leaderboard-supabase`).
7. Verificar que `components/games/AsteroidsGame.tsx` existe — te sirve como referencia de patrón del componente canvas.

---

## Fase 2 — Resolución de la fuente del juego

Evalúa `$ARGUMENTS`:

**Caso A — Reference folder.** Si `$ARGUMENTS` coincide con una ruta dentro de `references/started-games/` (ej. `references/started-games/03-tetris` o simplemente `03-tetris`):

- Leer `game.js` de esa carpeta.
- Leer `index.html` para identificar dimensiones del canvas y script de arranque.
- Leer `README.md` o `requirements.md` si existe.
- Extraer internamente: controles de teclado, variables de estado (score, lives, level, u otros), condición de game over, si hay overlay GAME OVER dibujado en canvas.
- Usar los valores extraídos como respuestas tentativas en los bloques de preguntas (proponlos al usuario y pide confirmación, no los asumas silenciosamente).

**Caso B — Descripción libre.** Si `$ARGUMENTS` es texto descriptivo (o está vacío):

- Si está vacío, pedir una frase de descripción del juego antes de continuar.
- Tratar los datos del juego como desconocidos; preguntar todo en el Bloque B.

**Caso C — Sin argumentos claros.** Preguntar: "¿El juego viene de `references/started-games/` o lo describimos desde cero?"

---

## Fase 3 — Preguntas por bloques

Haz preguntas en bloques de 3-5. Espera respuesta antes de avanzar al siguiente bloque. Usa recomendaciones concretas, no preguntas abiertas.

### Bloque A — Identidad del juego

1. **ID / slug** — será la PK en la tabla `games` y el segmento de URL (ej. `tetris`, `arkanoid`). Propón uno basado en `$ARGUMENTS` si puedes.
2. **Title** — nombre en mayúsculas para mostrar en la UI (ej. `TETRIS`).
3. **short** — una línea sensorial, máx. 50 caracteres (ej. "Apila tetrominos antes de que el techo te aplaste.").
4. **long** — 2-3 frases para la página de detalle.
5. **cat** — `ARCADE`, `PUZZLE` o `SHOOTER`. Propón el más obvio.
6. **cover** — clase CSS (ej. `cover-rocas`). Leer `app/globals.css` para ver las disponibles y proponer la más adecuada. Si no hay ninguna apropiada, indicar que habrá que añadir una nueva al CSS (fuera del alcance de este spec).
7. **color** — `cyan`, `magenta`, `yellow` o `green`. Propón basándote en la estética del juego.

### Bloque B — Mecánica

1. **Canvas size** — ancho × alto en px. Si viene de reference, extrae de `index.html`; propón como valor por defecto.
2. **Controles** — teclas o eventos. Si viene de reference, extraer de `game.js`.
3. **Estado HUD** — ¿qué valores expone el juego al HUD React? Las opciones estándar son `score`, `lives`, `level`. Si el juego no tiene alguno de ellos, preguntar si se omite del HUD o se sustituye por otro campo (ej. `lines`, `next-piece`, `time`). El HUD custom debe documentarse en el spec.
4. **Condición de game over** — ¿cuándo termina la partida?
5. **Pausa** — ¿el game loop respeta un prop `paused: boolean`? (recomendado sí, coherente con `AsteroidsGame`).

### Bloque C — Leaderboard

Estos tres puntos tienen respuestas por defecto que el usuario puede cambiar:

1. **¿Se guarda el score al terminar?** — sí por defecto. Si no, el spec omite el modal de guardado.
2. **Top N del leaderboard** — 10 por defecto (como Asteroids).
3. **¿Aparece tab en `/hall-of-fame`?** — sí automáticamente por estar en `games`; mencionarlo como info, no como pregunta.

### Bloque D — Adaptación canvas → React (solo si Caso A)

1. **Overlay GAME OVER del canvas** — ¿se elimina del `draw()` para que el modal React lo reemplace? (recomendado sí, patrón Asteroids). Confirmar explícitamente.
2. **HUD interno del canvas** — ¿se conserva sin cambios? (recomendado sí, doble HUD). Confirmar.
3. **Event listeners de teclado** — recordar que hay que limpiarlos en el `return` del `useEffect`. Preguntar si el `game.js` original los añade globalmente o al canvas.

---

## Fase 4 — Generación del spec, sección por sección

Una vez tienes todas las respuestas, genera el spec usando `template.md` como molde. Muestra **una sección a la vez**, espera confirmación antes de avanzar.

Orden obligatorio:

1. **Header** — bloqueo de metadatos + objetivo en una sola frase.
2. **Scope** — In y Fuera de alcance. El "Fuera" debe incluir explícitamente las exclusiones estándar.
3. **Data model** — INSERT SQL listo para copiar + interfaz TypeScript de props del componente.
4. **Implementation plan** — 4 pasos numerados, cada uno dejando el sistema funcional.
5. **Acceptance criteria** — checklist booleano.
6. **Decisions** — Sí/No con razón breve.

Tras cada sección: "¿Esta sección queda así o quieres ajustar algo?"

---

## Fase 5 — Guardado del spec

Cuando todas las secciones estén confirmadas:

1. Calcular `NN` = número más alto en `specs/` + 1 (con cero a la izquierda si NN < 10).
2. Slug de archivo: `NN-<id>-game.md` (ej. `07-tetris-game.md`).
3. Confirmar el nombre de archivo con el usuario antes de escribir.
4. Crear `specs/NN-<id>-game.md` con todo el contenido aprobado.
5. Marcar estado como `Borrador` (para mantener la convención en español del proyecto).
6. Confirmar al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec está en estado `Borrador`. Cámbialo a `Aprobado` cuando lo hayas releído.
   - Sugerencia del siguiente paso: _"Implementa el spec NN paso a paso con: `/spec-impl NN`"_.

---

## Reglas invariantes

- **Nunca escribir código durante este skill.** Solo el archivo `.md` del spec al final.
- **Nunca asumir decisiones que el usuario no confirmó.** Si falta información, preguntar.
- **Nunca generar el spec completo de un golpe.** Sección por sección, con confirmación.
- **Si `GameRow` o `ScoreRow` no existen en `lib/supabase/types.ts`**, detener y pedir que se implemente el spec 06 primero.
- **Si el juego ya existe** — si hay una carpeta `app/games/<id>/` o una fila `<id>` conocida en `games`, avisar al usuario antes de continuar.
- **El spec que produces no incluye pasos para crear las tablas `games` o `scores`** — ya existen. Solo incluye el INSERT de la fila nueva.
