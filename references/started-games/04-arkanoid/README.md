# Arkanoid

Juego de Arkanoid en HTML, CSS y JavaScript puro — sin dependencias, cero frameworks.

## Jugar

Abre `index.html` directamente en el navegador. No requiere servidor ni build.

## Controles

| Acción            | Tecla / Input                      |
| ----------------- | ---------------------------------- |
| Mover paddle      | Mouse o ← →                        |
| Pausar / reanudar | P o Escape                         |
| Saltar a nivel    | Botones 1–5 en el overlay de pausa |

## Características

- Canvas 800×600 px con sprites del spritesheet
- Paddle, pelota y colisiones con física básica
- 3 vidas — al caer la pelota se descuenta una vida y se reposiciona
- Score acumulado a través de los 5 niveles (10 pts por bloque)
- HUD con score, vidas y nivel actual
- 5 niveles con patrones de bloques distintos
- La pelota aumenta un 10 % de velocidad por nivel (nivel 5 ≈ +46 % vs nivel 1)
- Animación de explosión al destruir un bloque (4 frames del spritesheet)
- Efectos de sonido al rebotar y al romper bloques
- Overlay de pausa con selector de nivel
- Overlay de Game Over y de victoria ("¡Completaste el juego!")

## Niveles

| Nivel | Patrón                 | Velocidad |
| ----- | ---------------------- | --------- |
| 1     | Parrilla completa 10×6 | ×1.0      |
| 2     | Pirámide centrada      | ×1.1      |
| 3     | Tablero de ajedrez     | ×1.21     |
| 4     | Filas con huecos       | ×1.33     |
| 5     | Marco + cruz central   | ×1.46     |

## Estructura del proyecto

```
index.html          # punto de entrada
game.js             # lógica del juego (estado, loop, físicas, render)
levels.js           # definición de los 5 niveles (LEVELS)
assets/
  spritesheet-breakout.png
  spritesheet.js    # helpers drawSprite / drawFrame
  sounds/
    ball-bounce.mp3
    break-sound.mp3
specs/              # specs de diseño (flujo spec-driven)
```

## Specs implementadas

| #   | Spec                                                | Estado       |
| --- | --------------------------------------------------- | ------------ |
| 01  | MVP jugable (paddle, pelota, bloques, vidas, score) | Implementado |
| 02  | Animación de explosión al romper bloques            | Implementado |
| 03  | Sonidos y 5 niveles con selector en pausa           | Implementado |
