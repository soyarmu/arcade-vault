# SPEC 16 — Métricas de score específicas por juego y autenticación Google en Supabase

> **Estado:** Draft
> **Depende de:** 04-supabase-integration, 06-games-table-leaderboard-supabase, 13-supabase-auth
> **Fecha:** 2026-08-31
> **Objetivo:** Extender la tabla `scores` en Supabase para almacenar métricas específicas de cada juego (nivel alcanzado, tiempo de juego, y métrica particular como rocas destruidas o líneas limpiadas) e integrar autenticación de Google para almacenar el `user_id` real en lugar de null.

---

## Scope

**In:**

- Añadir columnas a la tabla `scores` para métricas específicas de juego:
  - `level_reached` (integer, default 0)
  - `game_time_seconds` (integer, default 0)
  - `game_specific_metric` (integer, default 0) - almacena rocas destruidas para Asteroids, líneas limpiadas para Tetris, etc.
- Modificar la inserción de scores para incluir estas métricas al terminar cada partida
- Actualizar los tipos TypeScript en `lib/supabase/types.ts` para reflejar las nuevas columnas
- Implementar inicio de sesión con Google en la página `/auth` para que `user_id` se almacene correctamente
- Aplicar inicialmente solo a los juegos de Asteroids y Tetris para testing

**Fuera de alcance:**

- Métricas específicas para otros juegos (arkanoid, snake, frogger) - se agregarán en specs futuros
- Almacenamiento de múltiples métricas específicas por juego (se usará una columna genérica con convenciones por juego)
- Configuración de RLS para las nuevas columnas - se abordará en un spec de seguridad futuro
- Visualización de las métricas específicas en los leaderboards - se dejará para specs futuros de UI
- Eliminación del sistema de `localStorage` para el nombre del jugador - se mantiene como fallback
- Integración con otros proveedores de autenticación (GitHub, email/password) - se asume que ya están funcionando desde specs previos

---

## Data model

### Tabla `scores` (Supabase) - Modificaciones

| Columna              | Tipo        | Notas                                                                 |
| -------------------- | ----------- | --------------------------------------------------------------------- |
| id                   | uuid        | PK, default `gen_random_uuid()`                                       |
| game_id              | text        | FK → `games.id`                                                       |
| player_name          | text        |                                                                       |
| score                | int         | Puntaje tradicional del juego                                         |
| user_id              | uuid        | nullable, FK a `auth.users` (se llena con autenticación de Google)    |
| level_reached        | integer     | default 0, nivel alcanzado en el juego                                |
| game_time_seconds    | integer     | default 0, tiempo de juego en segundos                                |
| game_specific_metric | integer     | default 0, métrica específica: rocas destruidas (Asteroids), líneas limpiadas (Tetris) |
| created_at           | timestamptz | default `now()`                                                       |

### Tipos TypeScript — `lib/supabase/types.ts` (actualizados)

```ts
export interface GameRow {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: 'ARCADE' | 'PUZZLE' | 'SHOOTER';
  cover: string;
  color: 'cyan' | 'magenta' | 'yellow' | 'green';
  created_at: string;
}

export interface ScoreRow {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
  level_reached: number;
  game_time_seconds: number;
  game_specific_metric: number;
}
```

### Convenciones para `game_specific_metric` por juego

| Juego      | Métrica almacenada         | Valor por defecto cuando no aplica |
| ---------- | -------------------------- | ---------------------------------- |
| asteroids  | rocas destruidas           | 0                                  |
| tetris     | líneas limpiadas           | 0                                  |
| arkanoid   | bloques destruidos         | 0                                  |
| snake      | frutas comidas             | 0                                  |
| frogger    | niveles superados          | 0                                  |

---

## Implementation plan

1. **Modificar tabla `scores` en Supabase** — ejecutar en el SQL Editor:
   ```sql
   ALTER TABLE scores 
   ADD COLUMN level_reached integer NOT NULL DEFAULT 0,
   ADD COLUMN game_time_seconds integer NOT NULL DEFAULT 0,
   ADD COLUMN game_specific_metric integer NOT NULL DEFAULT 0;
   ```
   Verificación: las columnas aparecen en el Table Editor de Supabase.

2. **Actualizar `lib/supabase/types.ts`** — añadir las nuevas propiedades a `ScoreRow`:
   ```ts
   export interface ScoreRow {
     // ... campos existentes
     level_reached: number;
     game_time_seconds: number;
     game_specific_metric: number;
   }
   ```
   Verificación: TypeScript no reporta errores en `npm run build`.

3. **Modificar inserción de scores en Asteroids** — actualizar `app/games/asteroids/play/page.tsx`:
   - Al montar el modal de game over, calcular:
     - `level_reached`: nivel actual alcanzado
     - `game_time_seconds`: tiempo transcurrido desde inicio de partida
     - `game_specific_metric`: número de rocas destruidas
   - Al confirmar el nombre, insertar en `scores`:
     ```ts
     { 
       game_id: 'asteroids',
       player_name: name,
       score: scoreFinal,
       user_id: user?.id ?? null, // de Supabase Auth si hay sesión
       level_reached: nivelActual,
       game_time_seconds: tiempoSegundos,
       game_specific_metric: rocasDestruidas
     }
     ```
   Verificación: tras una partida, se pueden ver los nuevos valores en la tabla `scores` de Supabase.

4. **Modificar inserción de scores en Tetris** — actualizar `app/games/tetris/play/page.tsx` de forma análoga:
   - `level_reached`: nivel alcanzado
   - `game_time_seconds`: tiempo de juego
   - `game_specific_metric`: líneas limpiadas
   Verificación: idem que para Asteroids.

5. **Implementar autenticación de Google** — actualizar `app/auth/page.tsx`:
   - Añadir botón "Iniciar sesión con Google"
   - Usar `signInWithOAuth` de `@supabase/ssr` para Google
   - Al成功 login, redirigir a la página previa o home
   - El `user_id` se almacenará automáticamente en la sesión de Supabase
   Verificación: al iniciar sesión con Google, los nuevos scores tienen `user_id` no null.

6. **Mantener compatibilidad con `localStorage`** — asegurar que:
   - Si no hay sesión de Supabase Auth, `user_id` se guarda como null
   - El nombre del jugador sigue leyendo/guardando en `av_player_name` de localStorage
   - Si hay sesión, se puede usar `user.user_metadata.name` o similar como fallback para el nombre
   Verificación: jugar sin autenticación sigue funcionando como antes.

7. **Actualización de consultas de leaderboard** — opcional en este spec, pero preparar:
   - Las consultas existentes en `app/games/[id]/page.tsx` y `app/hall-of-fame/page.tsx` siguen funcionando (solo seleccionan los campos existentes)
   - En specs futuros, se pueden añadir ordenaciones por `level_reached` o `game_specific_metric`
   Verificación: `npm run build` completa sin errores.

8. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   - Las rutas `/games/asteroids` y `/games/tetris` cargan correctamente
   - Tras partida y guardado de score, los nuevos campos aparecen en Supabase
   - Autenticación de Google funciona y almacena `user_id` real
   - Sin autenticación, `user_id` permanece null pero el resto de datos se guardan

---

## Acceptance criteria

- [ ] La tabla `scores` en Supabase tiene las columnas `level_reached`, `game_time_seconds`, y `game_specific_metric` con valores por defecto 0
- [ ] `lib/supabase/types.ts` exporta `ScoreRow` con las tres nuevas propiedades
- [ ] Al terminar una partida de Asteroids, se guardan: nivel alcanzado, tiempo de juego, y rocas destruidas
- [ ] Al terminar una partida de Tetris, se guardan: nivel alcanzado, tiempo de juego, y líneas limpiadas
- [ ] Al iniciar sesión con Google, el `user_id` se almacena en la tabla `scores` (no null)
- [ ] Sin autenticación, `user_id` se guarda como null pero el resto de métricas se guardan correctamente
- [ ] El sistema de `localStorage` para `av_player_name` sigue funcionando para pre-llenar el nombre
- [ ] `npm run build` completa sin errores de TypeScript
- [ ] Ninguna ruta existente devuelve 500 tras los cambios
- [ ] Los leaderboards existentes siguen mostrando el `score` tradicional sin romperse

---

## Decisions

- **Sí: Una columna genérica `game_specific_metric`** — en lugar de crear columnas separadas para cada tipo de métrica. Razón: mantiene la tabla simple y evita alteraciones frecuentes del esquema. Se documenta la convención por juego en el spec.
- **Sí: Valores por defecto de 0** — para las nuevas métricas, en lugar de nullable. Razón: simplifica las consultas y evita casos edge con null en operaciones de agregación. Un valor de 0 claramente indica "no medido" o "ninguno".
- **Sí: Mantener `user_id` nullable** — para soportar tanto usuarios autenticados como anónimos. Razón: reducir fricción permite más participación; la FK se agrega cuando madure el sistema de auth.
- **Sí: Extender la inserción existente** — en lugar de crear nuevos endpoints o tablas. Razón: aprovecha la infraestructura actual de guardado de scores y mantiene todo en una sola tabla.
- **No: Almacenar múltiples métricas específicas por juego** — como columnas separadas o tabla JSONB. Razón: complejidad innecesaria para la fase de testing; una métrica por juego es suficiente para validar el concepto.
- **No: Modificar los leaderboards para mostrar métricas específicas** — en este spec. Razón: mantener el enfoque en la persistencia primero; la UI se mejorará en specs futuros.
- **No: Eliminar el sistema de `localStorage` para nombres** — se mantiene como mecanismo independiente de autenticación. Razón: permite jugar sin cuenta pero aún tener consistencia en el nombre mostrado.

---

## Identified risks

- **Confusión en la interpretación de `game_specific_metric`** — mitigada por documentar claramente las convenciones por juego en el spec y en comentarios de código.
- **Valores por defecto de 0 confundidos con puntuaciones reales** — mitigada por el contexto: para métricas como rocas destruidas o líneas limpiadas, 0 es un valor válido y significativo (no destruyó/nada líneas).
- **Dependencia de la implementación específica de cada juego** — mitigada por implementar primero en Asteroids y Tetris como prueba de concepto, luego extrapolar a otros juegos.
- **Posible necesidad de migración de datos** — mitigada por usar valores por defecto, por lo que las filas existentes funcionarán sin alteración.