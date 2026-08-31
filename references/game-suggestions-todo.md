# Sugerencias de juegos — To-Do

> Mantenido por el agente `game-planner`. No editar manualmente sin avisar al agente.

## 🟡 Sugeridos (pendientes de decisión)

| ID               | Título            | Categoría  | Color  | Descripción breve                                                                            | Justificación                                                                                         | Fecha      |
| ---------------- | ----------------- | ---------- | ------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------- |
| `frogger`        | FROGGER           | MAZE       | lime   | Cruza la carretera y el río sin convertirte en papilla.                                      | Añade categoría MAZE ausente; lógica de cuadrícula simple, colisiones por celda, sin físicas.         | 2026-05-20 |
| `pacman`         | PAC-MAN           | MAZE       | yellow | Come todos los puntos del laberinto huyendo de 4 fantasmas.                                  | Segunda cobertura de MAZE con IA de fantasmas clásica; canvas 2D con tilemaps es bien conocido.       | 2026-05-20 |
| `dig-dug`        | DIG DUG           | MAZE       | orange | Excava túneles bajo tierra para inflar y reventar monstruos subterráneos.                    | Terreno destructible como grid de celdas booleanas; dos tipos de enemigos, factibilidad alta.         | 2026-05-20 |
| `space-invaders` | SPACE INVADERS    | SHOOTER    | green  | Destruye oleadas de alienígenas antes de que lleguen a la Tierra.                            | Shooter icónico; grid de enemigos con movimiento uniforme, escudos destructibles, factibilidad alta.  | 2026-05-20 |
| `galaga`         | GALAGA            | SHOOTER    | purple | Repele formaciones enemigas que se lanzan en picado sobre tu nave.                           | Shooter con patrones de vuelo Bezier; más dinámico que Space Invaders, factibilidad media.            | 2026-05-20 |
| `pong`           | PONG              | SPORTS     | blue   | Golpea la pelota más rápido de lo que tu rival puede reaccionar.                             | Incorpora categoría SPORTS; es el juego más simple del canon arcade, implementación en <200 líneas.   | 2026-05-20 |
| `ice-hockey`     | ICE HOCKEY        | SPORTS     | cyan   | Controla tu equipo en una pista helada y marca más goles que el rival en 90 segundos.        | Cubre SPORTS con multi-sprite; lógica de posesión del disco, factibilidad media.                      | 2026-05-20 |
| `tennis`         | TENNIS            | SPORTS     | lime   | Devuelve cada golpe con precisión de ángulo antes de que la pelota bote dos veces.           | Variante de SPORTS con pseudo-perspectiva 3D; más profundidad visual que Pong, factibilidad media.    | 2026-05-20 |
| `kong`           | DONKEY KONG       | PLATFORMER | red    | Sube escaleras y salta barriles rodantes para rescatar a la princesa en la cima.             | Introduce categoría PLATFORMER; física de salto + plataformas, factibilidad media.                    | 2026-05-20 |
| `minesweeper`    | MINESWEEPER       | STRATEGY   | gray   | Despeja el campo de minas usando lógica antes de pisar una.                                  | Introduce STRATEGY; grid simple, flood-fill, pura lógica de tablero, factibilidad alta.               | 2026-05-20 |
| `battleship`     | BATTLESHIP        | STRATEGY   | navy   | Hunde la flota enemiga antes de que destruyan la tuya.                                       | Segunda cobertura STRATEGY; dos grids, IA hunting-mode, factibilidad media.                           | 2026-05-20 |
| `2048`           | 2048              | PUZZLE     | amber  | Desliza y fusiona fichas hasta alcanzar el número 2048.                                      | Puzzle moderno icónico; grid 4×4, animaciones de merge simples, factibilidad alta.                    | 2026-05-20 |
| `sokoban`        | SOKOBAN           | PUZZLE     | brown  | Empuja cajas hacia sus marcadores sin quedar atrapado.                                       | Puzzle clásico; tilemap estático, movimiento discreto por celdas, sistema de undo, factibilidad alta. | 2026-05-20 |
| `columns`        | COLUMNS           | PUZZLE     | violet | Alinea 3 joyas del mismo color en columnas que caen sin parar.                               | Variante de Tetris con detección en 4 direcciones; sin rotaciones complejas, factibilidad alta.       | 2026-05-20 |
| `road-fighter`   | ROAD FIGHTER      | RACING     | red    | Rebasa coches rivales y gestiona el combustible hasta llegar a la meta.                      | Introduce categoría RACING con scroll vertical top-down; patrón familiar a Snake, factibilidad alta.  | 2026-05-20 |
| `out-run`        | OUT RUN           | RACING     | pink   | Conduce tu Ferrari por carreteras ramificadas antes de que el tiempo expire.                 | Racing pseudo-3D icónico; trapezoides en canvas 2D, factibilidad media.                               | 2026-05-20 |
| `pole-position`  | POLE POSITION     | RACING     | silver | Clasifica en pole y gana la carrera en un circuito de Fórmula 1 retro.                       | Racing pseudo-3D + IA de rivales; más complejo que Road Fighter, factibilidad media.                  | 2026-05-20 |
| `karate-champ`   | KARATE CHAMP      | FIGHTING   | gold   | Ejecuta técnicas de karate precisas para puntuar antes de que el árbitro detenga el combate. | Introduce FIGHTING; sistema de poses por combinación de teclas, factibilidad alta.                    | 2026-05-20 |
| `street-fighter` | STREET FIGHTER II | FIGHTING   | red    | Elige tu luchador y derrota al oponente con combos antes de que acabe el tiempo.             | Fighting icónico; hitboxes por frame + combos, más complejo, factibilidad media.                      | 2026-05-20 |

## 🟢 Aceptados / en desarrollo

| ID  | Título | Spec | Fecha aceptado |
| --- | ------ | ---- | -------------- |

## ✅ Implementados

| ID          | Título    | Categoría | Fecha |
| ----------- | --------- | --------- | ----- |
| `asteroids` | ASTEROIDS | SHOOTER   | —     |
| `tetris`    | TETRIS    | PUZZLE    | —     |
| `arkanoid`  | ARKANOID  | ARCADE    | —     |
| `snake`     | SNAKE     | ARCADE    | —     |

## ❌ Descartados

| ID  | Título | Motivo | Fecha |
| --- | ------ | ------ | ----- |
