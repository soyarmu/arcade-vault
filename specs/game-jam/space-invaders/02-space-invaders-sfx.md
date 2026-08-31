# SPEC — Space Invaders: efectos de sonido y sistema de oleadas

> **Estado:** Propuesto
> **Depende de:** specs/game-jam/space-invaders/01-space-invaders-core.md
> **Fecha:** 2026-05-25
> **Objetivo:** Añadir efectos de sonido procedurales (Web Audio API) y un sistema de oleadas con dificultad progresiva parametrizada por nivel al juego Space Invaders, sin modificar la interfaz de props del componente canvas.

---

## Scope

**In:**

- Sistema de sonido procedural basado en Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`) — sin archivos de audio externos. Todos los sonidos se sintetizan en tiempo real:
  - `sfx_march`: tono de marcha de invasores — cuatro notas alternantes (A2 / C3 / A2 / F2, ~60ms cada una) que avanzan en ciclo cada vez que el bloque de invasores da un paso. La frecuencia base sube con el nivel.
  - `sfx_shoot`: disparo del cañón — burst de ruido blanco filtrado con envolvente de caída rápida (30ms).
  - `sfx_invader_hit`: muerte de invasor — descenso de frecuencia de 400 Hz a 80 Hz en 120ms con oscilador de onda cuadrada y ganancia decreciente.
  - `sfx_player_hit`: muerte del cañón — explosión de ruido blanco + tono descendente, 600ms.
  - `sfx_ufo`: UFO activo — tono sinusoidal modulado en frecuencia (LFO 8 Hz) mientras el UFO cruza la pantalla; se detiene al desaparecer.
  - `sfx_ufo_hit`: UFO abatido — glissando de 800 Hz a 200 Hz, 250ms.
  - `sfx_level_clear`: nivel completado — arpeggio ascendente de 4 notas (C4, E4, G4, C5), 400ms total.
  - `sfx_game_over`: game over — descenso cromático de 5 notas, 800ms total.
- Módulo `lib/sfx-space-invaders.ts` — exporta una clase `SpaceInvadersSFX` con métodos `play(name)` y `stop(name)` y gestión del `AudioContext` (se crea en la primera interacción del usuario para respetar la política de autoplay de los navegadores).
- Botón mute/unmute en la play-page (`app/games/space-invaders/play/page.tsx`) — icono de altavoz en la esquina superior derecha del HUD React; persiste preferencia en `localStorage` (`av_sfx_muted`).
- Sistema de oleadas parametrizado en `WAVE_CONFIG`: array de 10 entradas que define por nivel el intervalo de paso del bloque (ms), la tasa de disparo enemigo (ms entre disparos), los puntos multiplicador del UFO y el desplazamiento inicial del bloque hacia abajo.
- `WAVE_CONFIG` se define a nivel de módulo (fuera del componente) como constante readonly para lectura O(1):

```ts
const WAVE_CONFIG = [
  // level 1..10: [stepIntervalMs, enemyFireIntervalMs, ufoMultiplier, blockOffsetY]
  [800, 2000, 1, 0],
  [700, 1800, 1, 20],
  [600, 1600, 1.5, 40],
  [520, 1400, 1.5, 60],
  [440, 1200, 2, 80],
  [370, 1000, 2, 90],
  [300, 850, 2.5, 100],
  [240, 700, 2.5, 110],
  [190, 550, 3, 120],
  [150, 400, 3, 130],
] as const;
```

- Integración del módulo de sonido en `SpaceInvadersGame.tsx`: llamadas a `sfx.play(...)` en los eventos de juego correspondientes (disparo, impacto invasor, impacto cañón, UFO activo, UFO abatido, nivel completado, game over). La instancia `SpaceInvadersSFX` se crea dentro del `useEffect` y se destruye (`sfx.dispose()`) en el `return` de cleanup.
- Prop adicional opcional `muted?: boolean` en `SpaceInvadersGameProps` — si es `true`, la instancia de SFX silencia todos los sonidos sin destruir el `AudioContext`.

**Fuera de alcance:**

- Música de fondo en loop (distinta de los sfx procedurales).
- Archivos `.mp3` / `.ogg` externos — todos los sonidos son procedurales.
- Controles táctiles o mobile.
- Supabase Auth y RLS.
- Realtime en el leaderboard.
- Visualizador de audio (waveform) en el canvas.
- Cambios en la lógica de puntuación más allá del multiplicador de UFO en `WAVE_CONFIG`.

---

## Data model

No se introducen nuevas tablas ni columnas en Supabase. Este spec es puramente de frontend.

### Extensión de props del componente

```ts
interface SpaceInvadersGameProps {
  paused: boolean;
  muted?: boolean; // nuevo — opcional, default false
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}
```

### Módulo `lib/sfx-space-invaders.ts`

```ts
type SfxName =
  | 'march' | 'shoot' | 'invader_hit'
  | 'player_hit' | 'ufo' | 'ufo_hit'
  | 'level_clear' | 'game_over';

class SpaceInvadersSFX {
  private ctx: AudioContext | null = null;
  private ufoNode: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

  /** Llama en la primera interacción del usuario para desbloquear AudioContext */
  init(): void { ... }

  play(name: SfxName): void { ... }
  stop(name: SfxName): void { ... }  // solo para 'ufo' (sonido continuo)
  setMuted(muted: boolean): void { this.muted = muted; }
  dispose(): void { this.ctx?.close(); }
}

export const sfxSpaceInvaders = new SpaceInvadersSFX();
```

---

## Implementation plan

### 1. Crear `lib/sfx-space-invaders.ts`

**1a.** Definir el tipo `SfxName` y la clase `SpaceInvadersSFX` con las propiedades privadas: `ctx`, `ufoNode`, `masterGain`, `muted`, `marchStep` (índice 0–3 para las cuatro notas de marcha).

**1b. `init()`**: crea el `AudioContext` si aún no existe (`this.ctx = new AudioContext()`). Crea `masterGain` conectado a `ctx.destination`. Volumen nominal: 0.4.

**1c. `play('march')`**: avanza `marchStep` en ciclo. Crea un `OscillatorNode` de onda cuadrada con la frecuencia correspondiente a la nota actual (tabla fija de cuatro frecuencias: 110, 130, 110, 87 Hz multiplicadas por `1 + (level-1)*0.05` — la frecuencia base se pasa como argumento opcional `playMarch(level: number)`). Envolvente de ganancia: ataque 0ms, sustain 50ms, caída 10ms.

**1d. `play('shoot')`**: `OscillatorNode` de ruido — no existe en Web Audio nativo; simularlo con un `AudioBufferSourceNode` de 2048 muestras aleatorias (`Math.random()*2-1`). Pasar por `BiquadFilterNode` tipo `bandpass` con Q=0.8, frequency=1200 Hz. Envolvente: duración 30ms, caída exponencial.

**1e. `play('invader_hit')`**: `OscillatorNode` de onda cuadrada. Programar `frequency.setValueAtTime(400, t)` → `frequency.exponentialRampToValueAtTime(80, t+0.12)`. Ganancia cae de 0.5 a 0 en 120ms.

**1f. `play('player_hit')`**: combinar (a) ruido blanco 600ms y (b) `OscillatorNode` sinusoidal 300→80 Hz en 600ms. Ambos conectados al `masterGain` con ganancia 0.6.

**1g. `play('ufo')`** / **`stop('ufo')`**: crear `OscillatorNode` sinusoidal con `LFO` — un segundo oscilador a 8 Hz modula la frecuencia del primero vía `OscillatorNode → GainNode(50) → oscilador.frequency`. Frecuencia base 440 Hz. Guardar la referencia en `this.ufoNode`. `stop('ufo')`: llamar `ufoNode.stop()` y `ufoNode = null`.

**1h. `play('ufo_hit')`**: `OscillatorNode` lineal de 800→200 Hz en 250ms, onda sinusoidal, ganancia 0.5.

**1i. `play('level_clear')`**: secuencia de cuatro notas (261, 329, 392, 523 Hz) con `OscillatorNode` de onda triangular; cada nota dura 100ms con 0ms de gap. Se programa con `start(t)` / `stop(t+0.1)` usando tiempos absolutos `ctx.currentTime + i*0.1`.

**1j. `play('game_over')`**: descenso cromático de 5 notas (392, 370, 349, 330, 311 Hz) con onda sinusoidal; cada nota dura 160ms.

**1k. `setMuted(muted)`**: si `masterGain` existe, `masterGain.gain.setTargetAtTime(muted ? 0 : 0.4, ctx.currentTime, 0.01)`.

**1l. `dispose()`**: `ufoNode?.stop(); ctx?.close(); ctx = null`.

Verificación: importar el módulo en un componente y llamar `sfxSpaceInvaders.init()` desde un evento click; comprobar que suena en la consola sin errores de autoplay.

### 2. Integrar `WAVE_CONFIG` en `SpaceInvadersGame.tsx`

**2a.** Mover el array `WAVE_CONFIG` (10 entradas) al inicio del fichero, fuera del componente, como `const` readonly.

**2b.** En `initGame(level)`, leer `WAVE_CONFIG[level - 1]` para fijar:

- `stepIntervalMs`: intervalo inicial de paso del bloque (antes de la aceleración por invasores eliminados).
- `enemyFireIntervalMs`: intervalo entre disparos enemigos.
- `ufoPointsMultiplier`: multiplicar los valores de `UFO_POINTS` por este factor al elegir la puntuación aleatoria.
- `blockOffsetY`: posición vertical inicial del bloque de invasores.

**2c.** En `update()`, usar los valores de `WAVE_CONFIG` en lugar de las constantes hardcodeadas del spec core. El intervalo de paso sigue reduciéndose 15ms por invasor eliminado, pero partiendo del valor del nivel en lugar de 800ms fijo.

Verificación: en nivel 1 el bloque empieza en la posición base y se mueve lentamente; en nivel 5 el bloque empieza más abajo y se mueve claramente más rápido desde el inicio.

### 3. Añadir prop `muted` y conectar SFX en `SpaceInvadersGame.tsx`

**3a.** Añadir `muted?: boolean` a la interface de props.

**3b.** En el `useEffect`, crear la instancia `sfxSpaceInvaders` (importada de `lib/sfx-space-invaders.ts`). Llamar `sfxSpaceInvaders.init()` dentro del `useEffect` (el contexto de audio se activa con la primera interacción del teclado, no al montar).

**3c.** Añadir un `useEffect([muted])` separado que llame `sfxSpaceInvaders.setMuted(muted ?? false)`.

**3d.** Conectar llamadas en los puntos de evento del game loop:

- Paso del bloque → `sfxSpaceInvaders.play('march')` (con el nivel actual).
- Disparo del jugador → `sfxSpaceInvaders.play('shoot')`.
- Invasor destruido → `sfxSpaceInvaders.play('invader_hit')`.
- Impacto en cañón → `sfxSpaceInvaders.play('player_hit')`.
- UFO aparece → `sfxSpaceInvaders.play('ufo')`.
- UFO desaparece sin ser abatido → `sfxSpaceInvaders.stop('ufo')`.
- UFO abatido → `sfxSpaceInvaders.stop('ufo'); sfxSpaceInvaders.play('ufo_hit')`.
- Nivel completado → `sfxSpaceInvaders.play('level_clear')`.
- Game over → `sfxSpaceInvaders.play('game_over')`.

**3e.** En el `return` del `useEffect`: llamar `sfxSpaceInvaders.stop('ufo')` y `sfxSpaceInvaders.dispose()`.

Verificación: durante una partida se escuchan los sonidos de marcha, disparo e impactos; el UFO emite su tono mientras cruza la pantalla.

### 4. Añadir botón mute en `app/games/space-invaders/play/page.tsx`

**4a.** Añadir estado `muted` (boolean, inicializado desde `localStorage.getItem('av_sfx_muted') === 'true'`).

**4b.** Renderizar un botón en el HUD React (esquina superior derecha) con icono de altavoz SVG inline:

- Activo (no mute): altavoz con ondas sonoras, color blanco.
- Mute: altavoz tachado, color gris.

**4c.** Al clicar el botón: togglear `muted`, persistir en `localStorage('av_sfx_muted', String(!muted))`.

**4d.** Pasar `muted` como prop al componente `SpaceInvadersGame`.

Verificación: clicar el botón silencia / restaura todos los sonidos en tiempo real sin reiniciar la partida.

### 5. Verificación final

`npm run build` termina sin errores de TypeScript. Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] `lib/sfx-space-invaders.ts` existe y exporta la clase `SpaceInvadersSFX` con los métodos `init`, `play`, `stop`, `setMuted`, `dispose`.
- [ ] `sfx_march` suena una vez por cada paso del bloque de invasores con cuatro tonos alternantes.
- [ ] La frecuencia base de `sfx_march` aumenta perceptiblemente entre el nivel 1 y el nivel 5.
- [ ] `sfx_shoot` se escucha al disparar; no genera errores en consola.
- [ ] `sfx_invader_hit` suena al destruir cada invasor con descenso de tono audible.
- [ ] `sfx_player_hit` suena al recibir impacto en el cañón; dura ~600ms.
- [ ] `sfx_ufo` emite tono continuo modulado mientras el UFO está en pantalla.
- [ ] `sfx_ufo` se detiene inmediatamente al desaparecer el UFO (abatido o fuera del canvas).
- [ ] `sfx_ufo_hit` suena al abatir el UFO.
- [ ] `sfx_level_clear` suena al completar cada oleada.
- [ ] `sfx_game_over` suena al producirse el game over.
- [ ] No se crean archivos `.mp3` / `.ogg` ni se hacen `fetch` de assets de audio.
- [ ] `WAVE_CONFIG` está definido a nivel de módulo como `const` readonly con 10 entradas.
- [ ] En nivel 1 el bloque usa `stepIntervalMs = 800` y `blockOffsetY = 0`.
- [ ] En nivel 10 el bloque usa `stepIntervalMs = 150` y `blockOffsetY = 130`.
- [ ] La dificultad (velocidad y tasa de disparo) aumenta visiblemente entre niveles consecutivos.
- [ ] El botón mute aparece en el HUD React de la play-page con icono SVG.
- [ ] Clicar mute silencia todos los sonidos sin reiniciar la partida.
- [ ] Clicar de nuevo restaura los sonidos.
- [ ] La preferencia de mute persiste en `localStorage` entre sesiones.
- [ ] La prop `muted` es opcional; si no se pasa, el componente funciona con sonido activo.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: Web Audio API procedural** — todos los sonidos se sintetizan con osciladores y buffers de ruido blanco, sin archivos externos. Razón: no hay assets de audio para Space Invaders en el repositorio; la síntesis procedural es autocontenida, tiene tamaño cero en disco y es fiel al sonido analógico del arcade original.

- **Sí: Módulo separado `lib/sfx-space-invaders.ts`** — la lógica de audio vive fuera del componente canvas. Razón: separación de responsabilidades; el componente de juego solo llama `sfx.play(name)` y no conoce los detalles de síntesis. Facilita el testing y el reuso en futuras variantes del juego.

- **Sí: Singleton exportado `sfxSpaceInvaders`** — se exporta una instancia única. Razón: el `AudioContext` tiene coste de inicialización; crear múltiples instancias en renders sucesivos provocaría fugas. El singleton es destruido explícitamente en el cleanup del `useEffect`.

- **Sí: `AudioContext` diferido hasta primera interacción** — `init()` se llama desde el primer `keydown` del juego, no al montar el componente. Razón: los navegadores modernos (Chrome 66+, Firefox, Safari) bloquean la creación de `AudioContext` antes de un gesto del usuario; diferirlo evita el warning "AudioContext was not allowed to start".

- **Sí: `WAVE_CONFIG` a nivel de módulo** — array readonly de 10 entradas fuera del componente. Razón: patrón de performance del spec 12 (constantes de módulo para evitar re-creación en cada render); acceso O(1) por índice de nivel.

- **Sí: Botón mute en play-page, no en canvas** — el control de audio es UI React, no canvas. Razón: coherencia con la arquitectura de la plataforma; la play-page gestiona todos los controles del jugador (pausa, mute) y los pasa como props al canvas.

- **Sí: Persistencia de preferencia mute en localStorage** — clave `av_sfx_muted`. Razón: coherencia con `av_player_name`; pequeñas preferencias del usuario se guardan en localStorage sin necesidad de Supabase.

- **No: Música de fondo en loop** — fuera de alcance. Razón: la música de fondo requeriría assets o síntesis más compleja; los efectos puntuales son suficientes para la experiencia arcade. Se puede añadir en un spec futuro.

- **No: Visualizador de audio en canvas** — fuera de alcance. Razón: añadiría complejidad al render sin mejorar la jugabilidad; el canvas ya tiene el HUD y los elementos del juego.

- **No: Cambios en lógica de puntuación más allá de UFO multiplier** — el balance de puntos del spec core no se modifica. Razón: este spec se limita a sonido y configuración de oleadas; alterar la puntuación base requeriría consenso con el spec core.

- **No: Controles táctiles / mobile** — fuera de alcance. Razón: estándar de la plataforma.

- **No: Supabase Auth y RLS** — sin cambios en el modelo de datos. Razón: spec puramente de frontend.
