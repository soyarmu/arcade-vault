'use client';

import React, { useEffect, useRef } from 'react';

interface TetrisGameProps {
  paused: boolean;
  skinKey?: string;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

type Skin = {
  name: string;
  colors: (string | null)[];
  boardBg: string | null;
  drawBlock: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    ci: number,
    size: number,
    alpha?: number,
  ) => void;
};

const SKINS: Record<string, Skin> = {
  retro: {
    name: 'Retro',
    colors: [
      null,
      '#4dd0e1',
      '#ffd54f',
      '#ba68c8',
      '#81c784',
      '#e57373',
      '#90caf9',
      '#ffb74d',
      '#9e9e9e',
    ],
    boardBg: null,
    drawBlock(ctx, x, y, ci, size, alpha = 1) {
      if (!ci) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.colors[ci] as string;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      ctx.globalAlpha = 1;
    },
  },
  neon: {
    name: 'Neon',
    colors: [
      null,
      '#00ffff',
      '#ffff00',
      '#ff00ff',
      '#00ff00',
      '#ff0040',
      '#00aaff',
      '#ff8000',
      '#8000ff',
    ],
    boardBg: '#000000',
    drawBlock(ctx, x, y, ci, size, alpha = 1) {
      if (!ci) return;
      const color = this.colors[ci] as string;
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = alpha < 0.5 ? 8 : 15;
      ctx.shadowColor = color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},0.55)`;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x * size + 1.75, y * size + 1.75, size - 3.5, size - 3.5);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    },
  },
  pastel: {
    name: 'Pastel',
    colors: [
      null,
      '#bae1ff',
      '#ffffba',
      '#e8baff',
      '#baffc9',
      '#ffb3ba',
      '#ffdfba',
      '#ffd9ba',
      '#d9d9d9',
    ],
    boardBg: '#f8f0ff',
    drawBlock(ctx, x, y, ci, size, alpha = 1) {
      if (!ci) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.colors[ci] as string;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillRect(x * size + 2, y * size + 2, size - 4, 5);
      ctx.fillRect(x * size + 2, y * size + 2, 5, size - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x * size + 2, y * size + size - 5, size - 4, 4);
      ctx.fillRect(x * size + size - 5, y * size + 2, 4, size - 4);
      ctx.globalAlpha = 1;
    },
  },
  pixel: {
    name: 'Pixel Art',
    colors: [
      null,
      '#3ab8c8',
      '#d4b840',
      '#9a50a8',
      '#60a060',
      '#c05060',
      '#7090d8',
      '#d08030',
      '#808080',
    ],
    boardBg: '#1a1a2e',
    drawBlock(ctx, x, y, ci, size, alpha = 1) {
      if (!ci) return;
      const color = this.colors[ci] as string;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const dark = `rgba(${Math.max(0, r - 60)},${Math.max(0, g - 60)},${Math.max(0, b - 60)},0.7)`;
      ctx.strokeStyle = dark;
      ctx.lineWidth = 0.5;
      const bx = x * size + 1;
      const by = y * size + 1;
      const bw = size - 2;
      for (let i = 4; i < bw; i += 4) {
        ctx.beginPath();
        ctx.moveTo(bx + i, by);
        ctx.lineTo(bx + i, by + bw);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx, by + i);
        ctx.lineTo(bx + bw, by + i);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  },
};

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [2, 2],
    [2, 2],
  ],
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
  // [
  //   [8, 8, 8],
  //   [8, 0, 8],
  //   [8, 8, 8],
  // ],
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

function buildNeonBlockCache(
  colors: (string | null)[],
): Map<number, HTMLCanvasElement> {
  const cache = new Map<number, HTMLCanvasElement>();
  for (let ci = 1; ci < colors.length; ci++) {
    const color = colors[ci];
    if (!color) continue;
    const oc = document.createElement('canvas');
    oc.width = BLOCK;
    oc.height = BLOCK;
    const octx = oc.getContext('2d')!;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    octx.shadowBlur = 15;
    octx.shadowColor = color;
    octx.fillStyle = `rgba(${r},${g},${b},0.55)`;
    octx.fillRect(1, 1, BLOCK - 2, BLOCK - 2);
    octx.strokeStyle = color;
    octx.lineWidth = 1.5;
    octx.strokeRect(1.75, 1.75, BLOCK - 3.5, BLOCK - 3.5);
    octx.shadowBlur = 0;
    cache.set(ci, oc);
  }
  return cache;
}

function TetrisGame({
  paused,
  skinKey = 'retro',
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: TetrisGameProps) {
  const boardRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);

  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skinKey] ?? SKINS.retro);
  const neonCacheRef = useRef<Map<number, HTMLCanvasElement> | null>(null);
  const cbScore = useRef(onScoreChange);
  const cbLives = useRef(onLivesChange);
  const cbLevel = useRef(onLevelChange);
  const cbOver = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    skinRef.current = SKINS[skinKey] ?? SKINS.retro;
    neonCacheRef.current =
      skinKey === 'neon' ? buildNeonBlockCache(SKINS.neon.colors) : null;
  }, [skinKey]);
  useEffect(() => {
    cbScore.current = onScoreChange;
  }, [onScoreChange]);
  useEffect(() => {
    cbLives.current = onLivesChange;
  }, [onLivesChange]);
  useEffect(() => {
    cbLevel.current = onLevelChange;
  }, [onLevelChange]);
  useEffect(() => {
    cbOver.current = onGameOver;
  }, [onGameOver]);

  useEffect(() => {
    const canvas = boardRef.current!;
    const ctx = canvas.getContext('2d')!;
    const nextCanvas = nextRef.current!;
    const nextCtx = nextCanvas.getContext('2d')!;

    type Piece = { type: number; shape: number[][]; x: number; y: number };

    let board: number[][];
    let current: Piece;
    let next: Piece;
    let score: number;
    let lines: number;
    let level: number;
    let dropInterval: number;
    let dropAccum: number;
    let lastTime: number;
    let animId: number;
    let gameOver: boolean;
    let gameOverFired: boolean;
    let prevScore: number;
    let prevLevel: number;

    function createBoard() {
      return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
    }

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 7) + 1;
      const shape = (PIECES[type] as number[][]).map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]): number[][] {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array(rows).fill(0),
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      for (const kick of [0, -1, 1, -2, 2]) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += (LINE_SCORES[cleared] ?? 0) * level;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }

    function ghostY() {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function endGame() {
      gameOver = true;
    }

    function drawNext() {
      const NB = 30;
      const skin = skinRef.current;
      if (skin.boardBg) {
        nextCtx.fillStyle = skin.boardBg;
        nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
      } else {
        nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
      }
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          skin.drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) {
        endGame();
        return;
      }
      drawNext();
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function drawGrid() {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, ROWS * BLOCK);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(COLS * BLOCK, r * BLOCK);
        ctx.stroke();
      }
    }

    function drawHUD() {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${score.toLocaleString()}`, 4, 13);
      ctx.fillText(`LINES ${lines}`, 4, 27);
      ctx.fillText(`LEVEL ${level}`, 4, 41);
    }

    function draw() {
      const skin = skinRef.current;
      if (skin.boardBg) {
        ctx.fillStyle = skin.boardBg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      drawGrid();

      const isNeon = skin.name === 'Neon';
      const neonCache = neonCacheRef.current;

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const ci = board[r][c];
          if (!ci) continue;
          if (isNeon && neonCache) {
            const sprite = neonCache.get(ci);
            if (sprite) ctx.drawImage(sprite, c * BLOCK, r * BLOCK);
          } else {
            skin.drawBlock(ctx, c, r, ci, BLOCK);
          }
        }

      if (!gameOver) {
        const gy = ghostY();
        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++) {
            const ci = current.shape[r][c];
            if (!ci) continue;
            if (isNeon && neonCache) {
              const sprite = neonCache.get(ci);
              if (sprite) {
                ctx.globalAlpha = 0.2;
                ctx.drawImage(
                  sprite,
                  (current.x + c) * BLOCK,
                  (gy + r) * BLOCK,
                );
                ctx.globalAlpha = 1;
              }
            } else {
              skin.drawBlock(ctx, current.x + c, gy + r, ci, BLOCK, 0.2);
            }
          }

        for (let r = 0; r < current.shape.length; r++)
          for (let c = 0; c < current.shape[r].length; c++) {
            const ci = current.shape[r][c];
            if (!ci) continue;
            if (isNeon && neonCache) {
              const sprite = neonCache.get(ci);
              if (sprite)
                ctx.drawImage(
                  sprite,
                  (current.x + c) * BLOCK,
                  (current.y + r) * BLOCK,
                );
            } else {
              skin.drawBlock(ctx, current.x + c, current.y + r, ci, BLOCK);
            }
          }
      }

      drawHUD();
    }

    function init() {
      board = createBoard();
      score = 0;
      lines = 0;
      level = 1;
      dropInterval = 1000;
      dropAccum = 0;
      gameOver = false;
      gameOverFired = false;
      prevScore = -1;
      prevLevel = -1;
      lastTime = performance.now();
      next = randomPiece();
      spawn();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (pausedRef.current || gameOver) return;
      switch (e.code) {
        case 'ArrowLeft':
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case 'ArrowRight':
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case 'ArrowDown':
          softDrop();
          break;
        case 'ArrowUp':
        case 'KeyX':
          tryRotate();
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          break;
      }
    }

    let pauseDrawn = false;

    function loop(ts: number) {
      const dt = Math.min(ts - lastTime, 100);
      lastTime = ts;

      if (pausedRef.current) {
        if (!pauseDrawn) {
          draw();
          pauseDrawn = true;
        }
        animId = requestAnimationFrame(loop);
        return;
      }
      pauseDrawn = false;

      if (!gameOver) {
        dropAccum += dt;
        if (dropAccum >= dropInterval) {
          dropAccum = 0;
          if (!collide(current.shape, current.x, current.y + 1)) {
            current.y++;
          } else {
            lockPiece();
          }
        }
      }

      draw();

      if (score !== prevScore) {
        cbScore.current(score);
        prevScore = score;
      }
      if (level !== prevLevel) {
        cbLevel.current(level);
        prevLevel = level;
      }
      if (gameOver && !gameOverFired) {
        gameOverFired = true;
        cbLives.current(0);
        cbOver.current(score);
      }

      animId = requestAnimationFrame(loop);
    }

    document.addEventListener('keydown', onKeyDown);
    init();
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      <canvas ref={boardRef} width={300} height={600} />
      <canvas ref={nextRef} width={120} height={120} />
    </div>
  );
}

export default React.memo(TetrisGame);
