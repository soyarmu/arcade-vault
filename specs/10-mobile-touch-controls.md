# SPEC 10 — Controles táctiles para dispositivos móviles

> **Estado:** implementado
> **Depende de:** 05-asteroids-game, 07-tetris-game, 08-arkanoid-game, 09-snake-game
> **Fecha:** 2026-05-21
> **Objetivo:** Añadir controles táctiles (gamepad virtual) y layout adaptado a los
> cuatro juegos existentes (Asteroids, Tetris, Arkanoid, Snake) en pantallas < 768 px,
> sin modificar la experiencia de escritorio.

---

## Scope

**In:**

- Crear `components/MobileGamepad.tsx` — componente `"use client"` reutilizable que
  renderiza el gamepad virtual: D-pad (4 flechas) + 2 botones de acción (A, B) + botón
  PAUSA + selector de skin. Solo visible en pantallas `< md` (< 768 px) via Tailwind.
- Cada pulsación del gamepad despacha un `KeyboardEvent` sintético en `document`
  (`new KeyboardEvent('keydown', { key: '...', bubbles: true })`), reutilizando los
  listeners de teclado ya existentes en cada componente de juego sin modificarlos.
- Modificar las cuatro play-pages para:
  - Ocultar completamente el HUD de React (JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, selector
    de skin, botones PAUSA / FIN / SALIR) en `< md`.
  - Escalar el canvas para que quepa en pantalla (CSS `width: 100%; height: auto` +
    `aspect-ratio` preservado) en `< md`.
  - Renderizar `<MobileGamepad>` debajo del canvas en `< md`, pasándole la función de
    pausa, el skin actual y el setter de skin.
- Mapeo de botones por juego:
  - **Asteroids:** D-pad ↑ = `ArrowUp` (empuje), ← = `ArrowLeft`, → = `ArrowRight` |
    A = `Space` (disparar), B = `z` (hiperespacio — tecla usada en el juego original).
  - **Tetris:** D-pad ← → = `ArrowLeft` / `ArrowRight`, ↓ = `ArrowDown` |
    A = `ArrowUp` (rotar), B = `Shift` o `c` (hard drop si está implementado).
  - **Arkanoid:** D-pad ← → = `ArrowLeft` / `ArrowRight` |
    A = `Space` (lanzar bola), B = sin acción.
  - **Snake:** D-pad ↑↓←→ = `w` / `s` / `a` / `d` | A y B = sin acción.

**Fuera de alcance:**

- Modificar los componentes canvas (`AsteroidsGame`, `TetrisGame`, `ArkanoidGame`,
  `SnakeGame`) — los eventos sintéticos reutilizan sus listeners existentes.
- Soporte táctil para juegos futuros — cada nuevo juego lo define en su propio spec.
- Gestos swipe — se descartaron en favor del D-pad visual para mayor precisión.
- Botón FIN / SALIR en el gamepad — el jugador móvil sale con el botón nativo del navegador.
- Orientación landscape — solo se soporta portrait en este spec.
- Haptic feedback.

---

## Data model

No se introducen nuevas tablas ni tipos TypeScript.

### Props de `MobileGamepad`

```ts
interface KeyMap {
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  a?: string;
  b?: string;
}

interface MobileGamepadProps {
  keyMap: KeyMap;
  paused: boolean;
  onPauseToggle: () => void;
  skin: string;
  onSkinChange: (skin: string) => void;
}
```

### Mapeo de teclas (definido en cada play-page, pasado como prop)

```ts
// app/games/asteroids/play/page.tsx
const keyMap: KeyMap = {
  up: 'ArrowUp',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: ' ',
  b: 'z',
};

// app/games/tetris/play/page.tsx
const keyMap: KeyMap = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  a: 'ArrowUp',
  b: 'Shift',
};

// app/games/arkanoid/play/page.tsx
const keyMap: KeyMap = { left: 'ArrowLeft', right: 'ArrowRight', a: ' ' };

// app/games/snake/play/page.tsx
const keyMap: KeyMap = { up: 'w', down: 's', left: 'a', right: 'd' };
```

`MobileGamepad` solo despacha las teclas que recibe — sin conocer los juegos existentes.
Juegos futuros definen su propio `keyMap` sin tocar el componente.

---

## Implementation plan

1. **Crear `components/MobileGamepad.tsx`**
   - Renderiza el layout del gamepad:
     - Fila superior: D-pad (cruz de 4 botones) a la izquierda + botones A y B a la derecha.
     - Fila inferior: botón PAUSA + selector de skin (mismo selector que el HUD de escritorio).
   - Cada botón usa `onTouchStart` / `onMouseDown` para despachar el `KeyboardEvent`
     sintético con la tecla correspondiente del `KEY_MAP`. Los botones de movimiento
     también despachan `keyup` en `onTouchEnd` / `onMouseUp` para juegos que usan hold
     (Asteroids empuje continuo).
   - El componente completo tiene `className="flex md:hidden ..."` — invisible en escritorio.
   - Verificación: en DevTools con viewport móvil, el gamepad aparece y las pulsaciones
     se registran en la consola al añadir un listener temporal en `document`.

2. **Adaptar `app/games/asteroids/play/page.tsx`**
   - Envolver el HUD de React existente en `<div className="hidden md:block">`.
   - Escalar el canvas: añadir `className="w-full h-auto max-w-[800px]"` al wrapper del canvas.
   - Añadir `<MobileGamepad gameId="asteroids" ... />` debajo del canvas, visible solo en `< md`.
   - Pasar `paused`, `onPauseToggle`, `skin`, `onSkinChange` a `MobileGamepad`.
   - Verificación: en viewport 390 px el HUD React desaparece, el canvas escala y el
     gamepad aparece; disparar con botón A genera proyectiles.

3. **Adaptar `app/games/tetris/play/page.tsx`** — igual que paso 2 con `gameId="tetris"`.
   - Verificación: rotar pieza con botón A y bajar rápido con D-pad ↓ funciona.

4. **Adaptar `app/games/arkanoid/play/page.tsx`** — igual que paso 2 con `gameId="arkanoid"`.
   - Verificación: mover paleta con D-pad ← → y lanzar bola con A funciona.

5. **Adaptar `app/games/snake/play/page.tsx`** — igual que paso 2 con `gameId="snake"`.
   - Verificación: cambiar dirección con el D-pad funciona; la serpiente no invierte 180°.

6. **Verificación final** — `npm run build` sin errores. En escritorio (> 768 px) el HUD
   React y los controles de teclado funcionan exactamente igual que antes.

---

## Acceptance criteria

- [ ] `MobileGamepad` es invisible en viewport ≥ 768 px (escritorio sin cambios).
- [ ] En viewport < 768 px el HUD React (JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, SKIN, botones
      PAUSA/FIN/SALIR) está oculto en los cuatro juegos.
- [ ] El canvas escala para caber en pantalla móvil sin scroll horizontal.
- [ ] El gamepad virtual aparece debajo del canvas en los cuatro juegos en móvil.
- [ ] El D-pad de Asteroids mueve la nave (← → rotan, ↑ empuje continuo mientras se mantiene pulsado).
- [ ] El botón A de Asteroids dispara; el botón B activa el hiperespacio.
- [ ] El D-pad de Tetris mueve la pieza horizontalmente y la baja rápido con ↓.
- [ ] El botón A de Tetris rota la pieza.
- [ ] El D-pad de Arkanoid mueve la paleta horizontalmente.
- [ ] El botón A de Arkanoid lanza la bola.
- [ ] El D-pad de Snake cambia la dirección (sin permitir giro de 180°).
- [ ] El botón PAUSA del gamepad pausa y reanuda el juego en los cuatro juegos.
- [ ] El selector de skin del gamepad cambia el skin del juego activo.
- [ ] En escritorio, el HUD React, los controles de teclado y el mouse funcionan igual que antes.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] Ninguna ruta existente devuelve 500.

---

## Decisions

- **Sí: KeyboardEvent sintético** — el gamepad despacha eventos de teclado sintéticos en
  `document` en lugar de añadir props/callbacks a los componentes de juego. Razón: cero
  cambios en los cuatro componentes canvas; toda la lógica táctil queda encapsulada en
  `MobileGamepad`.

- **Sí: D-pad visual + 2 botones** — en lugar de swipe/joystick analógico. Razón: mayor
  precisión en juegos de arcade que requieren pulsaciones discretas; el usuario confirmó
  este diseño.

- **Sí: `md` (768 px) como breakpoint** — estándar de Tailwind, coherente con el resto de
  la plataforma.

- **Sí: PAUSA y selector de skin en el gamepad** — son los únicos controles de la plataforma
  relevantes durante el juego; el resto (FIN, SALIR) se excluyen para simplificar el footer
  móvil.

- **No: Modificar componentes de juego** — los canvas no reciben props táctiles nuevos;
  los eventos sintéticos reutilizan el código existente sin riesgo de regresión.

- **No: Soporte landscape** — orientación portrait únicamente en este spec. Landscape puede
  tratarse en un spec futuro si hay demanda.

- **No: Juegos futuros** — el soporte táctil de nuevos juegos se define en cada spec
  individual.
