# SPEC 11 — Apariencia Neon del MobileGamepad

> **Estado:** Implementado
> **Depende de:** 10-mobile-touch-controls
> **Fecha:** 2026-05-21
> **Objetivo:** Rediseñar la apariencia visual de `components/MobileGamepad.tsx`
> para que coincida con el asset de referencia `references/gamepad-assets/gamepad.html`
> (contenedor neon con glow cyan, D-pad con gema pulsante y efecto 3D al presionar,
> botones A/B circulares con glow magenta/cyan), conservando toda la funcionalidad
> y la fila inferior (PAUSA, skin, SALIR) ya existentes.

---

## Scope

**In:**

- Actualizar `components/MobileGamepad.tsx` únicamente — sin tocar play-pages ni componentes de juego.
- Añadir el contenedor `.gp`: fondo degradado `#1c1c28 → #0c0c14`, borde `rgba(0,245,255,0.18)`,
  `border-radius: 22px`, `box-shadow` con halo cyan, overlay de puntos 8×8 px
  (replicado con `background-image: radial-gradient` en un `<div>` absoluto).
- Rediseñar los botones del D-pad: fondo degradado oscuro, `border-radius: 10px`,
  flechas SVG inline (triángulo fill=currentColor) en lugar del carácter unicode actual,
  hub central con gema cyan con animación `pulse-led`.
- Rediseñar los botones A/B: circulares `border-radius: 50%`, fuente "Press Start 2P",
  glow magenta (A) / cyan (B), estado activo con `translateY(4px)` y `box-shadow` expandido.
- Aplicar estados interactivos con `useState` + `onPointerDown`/`onPointerUp` para
  la clase `.on` con `translateY` + inner glow idéntico al asset de referencia.
- Cargar "Press Start 2P" desde Google Fonts via `<link>` en `next/head` o
  `@import` en CSS module — solo para los labels A/B.
- Mantener la fila inferior existente (PAUSA, selector de skin, SALIR) adaptando
  colores y bordes para encajar con la paleta neon (sin cambiar estructura ni props).

**Fuera de alcance:**

- Cambios en `app/games/*/play/page.tsx`.
- Modificaciones a la interfaz `MobileGamepadProps` — no cambia.
- Soporte de orientación landscape.
- Nuevos skins o variantes visuales del gamepad.
- El breakpoint `md:hidden` no cambia.

---

## Data model

No se introducen nuevas tablas ni tipos TypeScript. `MobileGamepadProps` no cambia.

Variables de diseño (constantes locales en el componente, no exportadas):

```ts
const CYAN = '#00f5ff';
const MAGENTA = '#ff006e';
```

---

## Implementation plan

1. **Añadir animación `pulse-led` y fuente "Press Start 2P"**
   - Crear `components/MobileGamepad.module.css` con `@keyframes pulse-led`
     y `@import` de Google Fonts para "Press Start 2P".
   - Importar el módulo en `MobileGamepad.tsx`.
   - Verificación: la clase CSS está disponible en el componente sin errores de build.

2. **Reemplazar el contenedor raíz por el contenedor `.gp`**
   - Sustituir el `<div className="md:hidden flex flex-col">` actual por un wrapper
     con: fondo `linear-gradient(180deg, #1c1c28 0%, #0c0c14 100%)`, `border: 1px solid rgba(0,245,255,0.18)`,
     `borderRadius: 22`, `boxShadow` con halo cyan (ver asset de referencia),
     y un `<div>` absoluto interno para el overlay de puntos (`background-image: radial-gradient`).
   - Verificación: el contenedor es visible en viewport < 768 px con el aspecto correcto.

3. **Rediseñar botones del D-pad**
   - Sustituir el `<GamepadButton>` de dirección por un componente `<DPadButton>`
     que renderiza: fondo `linear-gradient(180deg, #1a1a25, #0a0a12)`, `border-radius: 10px`,
     `box-shadow` 3D (sombra inferior + inner highlight), flecha SVG inline,
     y estado activo via prop `isActive` (controlado con `useState` por dirección).
   - Añadir el hub central: `<div>` posicionado con `borderRadius: 6px`, fondo
     radial oscuro, gema `<span>` con `clip-path: polygon(50% 0,100% 50%,50% 100%,0 50%)`
     y `animation: pulse-led 2s ease-in-out infinite`.
   - Verificación: al presionar cada flecha se ve el efecto de hundimiento + glow cyan.

4. **Rediseñar botones A/B**
   - Actualizar los botones A/B en `GamepadButton` (o extraer `<ActionButton>`) con:
     `border-radius: 50%`, `fontFamily: "'Press Start 2P'"`, tamaño 74px,
     degradado radial interior, borde coloreado, estado activo con `translateY(4px)`
     y `box-shadow` expandido.
   - A: border/glow magenta `#ff006e`. B: border/glow cyan `#00f5ff`.
   - Verificación: botones A/B lucen idénticos al asset de referencia.

5. **Adaptar fila inferior (PAUSA, skin, SALIR)**
   - Ajustar colores de borde y texto para usar la paleta neon (PAUSA con acento
     amarillo-neon, SALIR con blanco tenue), sin cambiar estructura ni props.
   - Verificación: la fila inferior encaja visualmente con el contenedor neon.

6. **Verificación final**
   - `npm run build` sin errores TypeScript.
   - En viewport 390 px: gamepad con el diseño neon visible debajo del canvas
     en los cuatro juegos (asteroids, tetris, arkanoid, snake).
   - En escritorio (> 768 px): gamepad invisible, juegos funcionan igual.

---

## Acceptance criteria

- [ ] El contenedor del gamepad muestra fondo degradado oscuro, borde con halo cyan
      y overlay de puntos idéntico al asset `references/gamepad-assets/gamepad-neon.png`.
- [ ] Cada botón del D-pad tiene fondo degradado, esquinas redondeadas y flecha SVG.
- [ ] Al presionar un botón del D-pad se aplica `translateY(3px)` + inner glow cyan.
- [ ] El hub central muestra la gema cyan (animación pulse opcional).
- [ ] Los botones A/B son circulares con fuente "Press Start 2P" y glow magenta/cyan.
- [ ] Al presionar A o B se aplica `translateY(4px)` + box-shadow expandido.
- [ ] La fila inferior (PAUSA, skin, SALIR) encaja visualmente con la paleta neon.
- [ ] `MobileGamepadProps` no cambia — ninguna play-page necesita actualización.
- [ ] El gamepad es invisible en viewport ≥ 768 px.
- [ ] `npm run build` completa sin errores TypeScript.

---

## Decisions

- **Sí: CSS Module para `@keyframes` y Google Fonts** — React no permite `@keyframes`
  en inline styles; un CSS module es la solución mínima sin añadir dependencias.

- **Sí: `useState` por botón para estado activo** — permite aplicar estilos `.on`
  idénticos al asset de referencia; `:active` CSS no es fiable en eventos touch.

- **Sí: SVG arrows inline** — reemplazar unicode por SVGs garantiza fidelidad
  visual al asset sin fuente de iconos adicional.

- **No: Modificar play-pages** — la interfaz de props no cambia; cero riesgo
  de regresión en los cuatro juegos ya implementados.

- **No: Animación pulse-led obligatoria** — es decoración; si el CSS module
  la incluye no añade complejidad, pero no es criterio de aceptación bloqueante.
