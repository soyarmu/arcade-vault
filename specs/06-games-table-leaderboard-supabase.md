# SPEC 06 — Tabla de juegos y leaderboard con Supabase

> **Estado:** Implementado
> **Depende de:** 05-asteroids-game
> **Fecha:** 2026-05-15
> **Objetivo:** Migrar los datos de juegos a una tabla `games` en Supabase y conectar
> los leaderboards (global y por juego) a una tabla `scores` real, guardando el score
> de Asteroids al finalizar cada partida.

---

## Scope

**In:**

- Crear tabla `games` en Supabase con los campos del tipo `Game` actual; seed manual
  con la entrada `asteroids`.
- Crear tabla `scores` en Supabase: `id` (uuid PK), `game_id` (text, FK a `games`),
  `player_name` (text), `score` (int), `user_id` (uuid, nullable), `created_at` (timestamptz).
- Crear `lib/supabase/types.ts` con los tipos TypeScript manuales para ambas tablas.
- Eliminar el array `GAMES` local de `app/data/games.ts` y la función `seededScores`
  de `app/data/scores.ts`; sustituirlos con fetches a Supabase en:
  - `app/games/page.tsx` — lista de juegos (cards), solo muestra los que estén en Supabase.
  - `app/games/[id]/page.tsx` — detalle del juego + leaderboard top 10 por juego.
  - `app/hall-of-fame/page.tsx` — leaderboard global con tabs solo para juegos reales.
- Guardar score al terminar partida en `app/games/asteroids/play/page.tsx`:
  - Al abrir el modal de game over, el campo `name` se pre-rellena con
    `localStorage.getItem('av_player_name')` si existe.
  - Al confirmar, se persiste el nombre en `av_player_name` y se inserta el score
    en Supabase vía cliente browser.
- Estado vacío en leaderboards: mensaje "Sé el primero en entrar al salón de la fama"
  cuando no hay scores para ese juego.

**Fuera de alcance:**

- Supabase Auth — `user_id` se almacena como `null` en todos los scores por ahora.
- RLS (Row Level Security) — se configura en un spec futuro de seguridad.
- Panel de administración de juegos — la tabla `games` es solo lectura desde la app.
- Actualización automática de `best` y `plays` en la tabla `games` — son campos
  estáticos por ahora; el `best` se calcula en tiempo de consulta desde `scores`.
- Realtime — los leaderboards no se actualizan en vivo; solo al cargar la página.
- Paginación del leaderboard — se muestran los top 10 fijos.
- Los 6 juegos placeholder (`bloque-buster`, `caida`, etc.) desaparecen de la UI
  al eliminar el array local; no se migran a Supabase en este spec.

---

## Data model

### Tabla `games` (Supabase)

| Columna    | Tipo        | Notas                                        |
| ---------- | ----------- | -------------------------------------------- |
| id         | text        | PK, e.g. `'asteroids'`                       |
| title      | text        |                                              |
| short      | text        |                                              |
| long       | text        |                                              |
| cat        | text        | `'ARCADE'`, `'PUZZLE'`, `'SHOOTER'`          |
| cover      | text        | CSS class, e.g. `'cover-rocas'`              |
| color      | text        | `'cyan'`, `'magenta'`, `'yellow'`, `'green'` |
| created_at | timestamptz | default `now()`                              |

Seed inicial:

```sql
INSERT INTO games (id, title, short, long, cat, cover, color)
VALUES (
  'asteroids', 'ASTEROIDS', 'Pulveriza rocas en gravedad cero.',
  'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Supera niveles y acumula puntos antes de que los asteroides te alcancen.',
  'SHOOTER', 'cover-rocas', 'yellow'
);
```

### Tabla `scores` (Supabase)

| Columna     | Tipo        | Notas                           |
| ----------- | ----------- | ------------------------------- |
| id          | uuid        | PK, default `gen_random_uuid()` |
| game_id     | text        | FK → `games.id`                 |
| player_name | text        |                                 |
| score       | int         |                                 |
| user_id     | uuid        | nullable, sin FK por ahora      |
| created_at  | timestamptz | default `now()`                 |

### Tipos TypeScript — `lib/supabase/types.ts`

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
}
```

### `best` por juego

No se almacena como campo en `games`. Se calcula en tiempo de consulta:

```sql
SELECT MAX(score) FROM scores WHERE game_id = $1;
```

---

## Implementation plan

1. **Crear tablas en Supabase** — ejecutar en el SQL Editor de Supabase:
   - Tabla `games` con las columnas del data model.
   - Tabla `scores` con las columnas del data model.
   - Seed de la entrada `asteroids` en `games`.
     Verificación: ambas tablas aparecen en el Table Editor de Supabase con la fila
     de asteroids visible.

2. **Crear `lib/supabase/types.ts`** — añadir `GameRow` y `ScoreRow` tal como
   se definen en el data model.
   Verificación: TypeScript no reporta errores.

3. **Eliminar datos locales** — en `app/data/games.ts` borrar el array `GAMES`
   y la interfaz `Game`; en `app/data/scores.ts` borrar `seededScores` y `ScoreEntry`.
   Actualizar `app/data/index.ts` para no re-exportar los símbolos eliminados.
   Verificación: `npm run build` falla únicamente en los archivos que consumen
   esos símbolos (esperado — se arreglan en los pasos siguientes).

4. **Migrar `app/games/page.tsx`** — convertir a Server Component; fetch de todos
   los juegos desde Supabase con `createClient` server; pasar el array como prop
   al componente de cards (que sigue siendo `"use client"` por el hover/filtros).
   Verificación: `/games` carga y muestra únicamente la card de Asteroids.

5. **Migrar `app/games/[id]/page.tsx`** — fetch del juego por `id` y top 10 scores
   de ese juego desde Supabase (ordenados por `score DESC`); calcular `best` como
   el primer resultado. Si el juego no existe → `notFound()`.
   Estado vacío si `scores` está vacío.
   Verificación: `/games/asteroids` carga con los datos reales; un id inválido
   devuelve 404.

6. **Migrar `app/hall-of-fame/page.tsx`** — fetch de todos los juegos desde
   Supabase para construir los tabs; fetch de top 12 scores del juego activo al
   cambiar de tab (client-side con `createClient` browser).
   Tabs muestran solo los juegos presentes en Supabase.
   Estado vacío si no hay scores.
   Verificación: `/hall-of-fame` muestra solo el tab de Asteroids; cambiar de tab
   recarga los scores correctamente.

7. **Guardar score en `app/games/asteroids/play/page.tsx`** — al montar el modal
   de game over, leer `localStorage.getItem('av_player_name')` y pre-rellenar
   el campo `name`. Al confirmar:
   - Guardar el nombre en `localStorage.setItem('av_player_name', name)`.
   - Insertar en `scores` vía `createClient` browser: `{ game_id: 'asteroids',
player_name: name, score, user_id: null }`.
   - Marcar `saved: true` para deshabilitar el botón y evitar doble envío.
     Verificación: tras una partida, el score aparece en `/games/asteroids` y en
     `/hall-of-fame`; al volver a jugar, el nombre está pre-rellenado.

8. **Verificación final** — `npm run build` completa sin errores de TypeScript.
   Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] Las tablas `games` y `scores` existen en Supabase con las columnas del data model.
- [ ] La fila `asteroids` está presente en la tabla `games`.
- [ ] `lib/supabase/types.ts` exporta `GameRow` y `ScoreRow` sin errores de TypeScript.
- [ ] El array `GAMES` local y la función `seededScores` han sido eliminados del codebase.
- [ ] `/games` carga y muestra únicamente los juegos presentes en Supabase (solo Asteroids).
- [ ] `/games/asteroids` muestra los datos reales del juego y el leaderboard top 10.
- [ ] `/games/[id]` con un id inexistente devuelve 404.
- [ ] `/hall-of-fame` muestra únicamente tabs de juegos presentes en Supabase.
- [ ] Cuando no hay scores, los leaderboards muestran el mensaje de estado vacío
      en lugar de datos falsos.
- [ ] Al terminar una partida de Asteroids, el modal pre-rellena el nombre desde
      `localStorage` si existe.
- [ ] Al confirmar el nombre en el modal, el score se inserta en Supabase y el
      nombre se persiste en `localStorage` para la próxima partida.
- [ ] El botón de guardar se deshabilita tras el primer envío (sin doble inserción).
- [ ] El score guardado aparece en `/games/asteroids` y en `/hall-of-fame` al recargar.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Un solo spec para tabla de juegos y leaderboard** — ambas funcionalidades
  comparten el mismo momento de migración a Supabase y las mismas tablas base;
  separarlas hubiera generado un spec intermedio sin valor visible.

- **Sí: `best` calculado desde `scores` en tiempo de consulta** — en lugar de
  almacenarlo como campo en `games`. Razón: evita lógica de sincronización;
  con top 10 scores ya cargados, el máximo es trivial de derivar.

- **Sí: `user_id` nullable sin FK** — la plataforma permite jugar sin cuenta.
  Razón: la fricción de registro reduce la participación; la FK se añade cuando
  llegue el spec de Supabase Auth.

- **Sí: Nombre pre-rellenado desde `av_player_name` en localStorage** — separado
  de `av_user` (el nick de sesión). Razón: un jugador puede tener un nick de
  sesión distinto al nombre que quiere en el leaderboard; además funciona aunque
  no haya sesión activa.

- **Sí: Server Components para los fetches de juegos y scores** — excepto
  `/hall-of-fame` que necesita cambio de tab en cliente. Razón: menos JavaScript
  en el bundle y datos frescos en cada request sin useState/useEffect.

- **No: RLS en este spec** — las tablas quedan abiertas (INSERT y SELECT públicos).
  Razón: RLS requiere definir roles y políticas; hacerlo bien merece su propio spec.
  Riesgo asumido: cualquier cliente puede insertar scores; se mitiga en spec futuro.

- **No: Realtime en leaderboards** — los scores se ven al recargar la página.
  Razón: la complejidad de subscriptions no aporta valor con un solo juego activo.

- **No: Migrar los 6 juegos placeholder a Supabase** — desaparecen de la UI al
  borrar el array local. Razón: no son jugables; añadirlos a Supabase sería datos
  sin funcionalidad real.
