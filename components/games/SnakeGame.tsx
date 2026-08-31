'use client';

import React, { useEffect, useRef } from 'react';

interface SnakeGameProps {
  paused: boolean;
  skinKey?: string;
  onScoreChange: (score: number) => void;
  onLevelChange: (level: number) => void;
  onLivesChange: (lives: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Skin system ───────────────────────────────────────────────────────────────

type Skin = {
  name: string;
  boardBg: string;
  gridColor: string;
  headColor: string;
  bodyColor: string;
  eyeColor: string;
  hudBg: string;
  hudPrimaryColor: string;
  hudSecondaryColor: string;
  drawSegment: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: number,
    isHead: boolean,
    alpha: number,
  ) => void;
};

const SKINS: Record<string, Skin> = {
  classic: {
    name: 'Classic',
    boardBg: '#0a1a0a',
    gridColor: 'rgba(0,255,80,0.06)',
    headColor: '#00ff50',
    bodyColor: '#00cc40',
    eyeColor: '#001a00',
    hudBg: 'rgba(0,0,0,0.55)',
    hudPrimaryColor: '#00ff80',
    hudSecondaryColor: '#80ffcc',
    drawSegment(ctx, x, y, cell, isHead, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = isHead ? this.headColor : this.bodyColor;
      const pad = isHead ? 2 : 4;
      ctx.beginPath();
      ctx.roundRect(
        x * cell + pad,
        y * cell + pad,
        cell - pad * 2,
        cell - pad * 2,
        isHead ? 6 : 4,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    },
  },
  retro: {
    name: 'Retro',
    boardBg: '#0d1f0d',
    gridColor: 'rgba(180,220,100,0.08)',
    headColor: '#a8d848',
    bodyColor: '#78b828',
    eyeColor: '#1a2a00',
    hudBg: 'rgba(10,20,10,0.75)',
    hudPrimaryColor: '#c8e860',
    hudSecondaryColor: '#90c840',
    drawSegment(ctx, x, y, cell, isHead, alpha) {
      ctx.globalAlpha = alpha;
      const pad = isHead ? 2 : 3;
      ctx.fillStyle = isHead ? this.headColor : this.bodyColor;
      ctx.fillRect(
        x * cell + pad,
        y * cell + pad,
        cell - pad * 2,
        cell - pad * 2,
      );
      // CRT highlight strip (4px at top)
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x * cell + pad, y * cell + pad, cell - pad * 2, 4);
      ctx.globalAlpha = 1;
    },
  },
  neon: {
    name: 'Neon',
    boardBg: '#000000',
    gridColor: 'rgba(0,255,120,0.18)',
    headColor: '#00ff88',
    bodyColor: '#00cc66',
    eyeColor: '#003311',
    hudBg: 'rgba(0,0,0,0.7)',
    hudPrimaryColor: '#00ffaa',
    hudSecondaryColor: '#00ff44',
    drawSegment(ctx, x, y, cell, isHead, alpha) {
      ctx.globalAlpha = alpha;
      const color = isHead ? this.headColor : this.bodyColor;
      const pad = isHead ? 2 : 4;
      const bx = x * cell + pad;
      const by = y * cell + pad;
      const bw = cell - pad * 2;

      ctx.shadowBlur = isHead ? 18 : 10;
      ctx.shadowColor = color;

      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
      ctx.fillRect(bx, by, bw, bw);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx + 0.75, by + 0.75, bw - 1.5, bw - 1.5);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    },
  },
};

// ── Constants ─────────────────────────────────────────────────────────────────

const COLS = 20;
const ROWS = 20;
const CELL = 40;
const W = COLS * CELL;
const H = ROWS * CELL;
const BASE_MS = 150;
const SPEED_REDUCTION = 10;
const FRUITS_PER_LEVEL = 5;

// ── Fruit atlas (from references/source-assets/snake-assets/sprites.js) ──────

const FRUIT_SPRITES = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  { x: 378, y: 136, w: 110, h: 160 }, // grape
  { x: 540, y: 136, w: 130, h: 160 }, // garlic
  { x: 712, y: 136, w: 130, h: 160 }, // eggplant
  { x: 894, y: 136, w: 110, h: 160 }, // strawberry
  { x: 1066, y: 136, w: 110, h: 160 }, // cherry
  { x: 1228, y: 136, w: 130, h: 160 }, // carrot
  { x: 1400, y: 136, w: 130, h: 160 }, // mushroom
  { x: 1582, y: 136, w: 110, h: 160 }, // broccoli
  { x: 1734, y: 136, w: 150, h: 160 }, // watermelon
  { x: 1906, y: 136, w: 150, h: 160 }, // pepper
  { x: 2068, y: 136, w: 170, h: 160 }, // kiwi
  { x: 2250, y: 136, w: 140, h: 160 }, // lemon
  { x: 2432, y: 136, w: 130, h: 160 }, // peach
  { x: 2604, y: 136, w: 130, h: 160 }, // peanut
  { x: 2786, y: 136, w: 110, h: 160 }, // apple
  { x: 2948, y: 136, w: 130, h: 160 }, // tomato
  { x: 3110, y: 136, w: 150, h: 160 }, // berries
  { x: 3302, y: 136, w: 110, h: 160 }, // grapes2
  { x: 3454, y: 136, w: 150, h: 160 }, // pineapple
  { x: 3637, y: 136, w: 130, h: 160 }, // melon
];

// ── Types ─────────────────────────────────────────────────────────────────────

type Point = { x: number; y: number };

interface GameState {
  snake: Point[];
  dir: Point;
  nextDir: Point;
  fruit: { pos: Point; spriteIdx: number };
  score: number;
  level: number;
  fruitsEaten: number;
  dead: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomFruit(snake: Point[]): { pos: Point; spriteIdx: number } {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return { pos, spriteIdx: Math.floor(Math.random() * FRUIT_SPRITES.length) };
}

function initialState(): GameState {
  const snake: Point[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  const dir = { x: 1, y: 0 };
  return {
    snake,
    dir,
    nextDir: dir,
    fruit: randomFruit(snake),
    score: 0,
    level: 1,
    fruitsEaten: 0,
    dead: false,
  };
}

function intervalMs(level: number): number {
  return Math.max(50, BASE_MS - (level - 1) * SPEED_REDUCTION);
}

// ── Neon cache ────────────────────────────────────────────────────────────────

type NeonSegmentCache = { head: HTMLCanvasElement; body: HTMLCanvasElement };

function buildNeonSegmentCache(): NeonSegmentCache {
  function makeSprite(
    color: string,
    pad: number,
    blur: number,
  ): HTMLCanvasElement {
    const oc = document.createElement('canvas');
    oc.width = CELL;
    oc.height = CELL;
    const octx = oc.getContext('2d')!;
    const bw = CELL - pad * 2;
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    octx.shadowBlur = blur;
    octx.shadowColor = color;
    octx.fillStyle = `rgba(${r},${g},${b},0.45)`;
    octx.fillRect(pad, pad, bw, bw);
    octx.strokeStyle = color;
    octx.lineWidth = 1.5;
    octx.strokeRect(pad + 0.75, pad + 0.75, bw - 1.5, bw - 1.5);
    octx.shadowBlur = 0;
    return oc;
  }
  return {
    head: makeSprite('#00ff88', 2, 18),
    body: makeSprite('#00cc66', 4, 10),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

function SnakeGame({
  paused,
  skinKey = 'classic',
  onScoreChange,
  onLevelChange,
  onLivesChange,
  onGameOver,
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skinKey ?? 'classic'] ?? SKINS.classic);
  const neonCacheRef = useRef<NeonSegmentCache | null>(null);
  const stateRef = useRef<GameState>(initialState());
  const prevScoreRef = useRef(0);
  const prevLevelRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const deadFiredRef = useRef(false);

  // Sync paused ref so the loop reads the latest value without re-mounting.
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    skinRef.current = SKINS[skinKey ?? 'classic'] ?? SKINS.classic;
    neonCacheRef.current = skinKey === 'neon' ? buildNeonSegmentCache() : null;
  }, [skinKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // ── Image load ──────────────────────────────────────────────────────────
    const img = new Image();
    imgRef.current = img;
    let alive = true;

    img.onload = () => {
      if (!alive) return;
      startLoop();
    };
    img.src = '/fruits.png';

    // ── Draw ────────────────────────────────────────────────────────────────
    function draw() {
      const s = stateRef.current;
      const skin = skinRef.current;

      // Background
      ctx.fillStyle = skin.boardBg;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = skin.gridColor;
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL, 0);
        ctx.lineTo(c * CELL, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(W, r * CELL);
        ctx.stroke();
      }

      // Snake body
      const neonCache = neonCacheRef.current;
      s.snake.forEach((seg, i) => {
        const isHead = i === 0;
        const alpha = isHead ? 1 : Math.max(0.4, 1 - i * 0.03);
        if (neonCache) {
          ctx.globalAlpha = alpha;
          ctx.drawImage(
            isHead ? neonCache.head : neonCache.body,
            seg.x * CELL,
            seg.y * CELL,
          );
          ctx.globalAlpha = 1;
        } else {
          skin.drawSegment(ctx, seg.x, seg.y, CELL, isHead, alpha);
        }

        // Head eyes
        if (isHead) {
          ctx.globalAlpha = 1;
          ctx.fillStyle = skin.eyeColor;
          const d = s.dir;
          const ex = seg.x * CELL + CELL / 2 + d.x * 8;
          const ey = seg.y * CELL + CELL / 2 + d.y * 8;
          const ox = d.y * 7;
          const oy = d.x * 7;
          ctx.beginPath();
          ctx.arc(ex + ox, ey - oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(ex - ox, ey + oy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // Fruit sprite
      const sp = FRUIT_SPRITES[s.fruit.spriteIdx];
      const fx = s.fruit.pos.x * CELL;
      const fy = s.fruit.pos.y * CELL;
      const padding = 4;
      ctx.drawImage(
        img,
        sp.x,
        sp.y,
        sp.w,
        sp.h,
        fx + padding,
        fy + padding,
        CELL - padding * 2,
        CELL - padding * 2,
      );

      // HUD overlay
      ctx.fillStyle = skin.hudBg;
      ctx.fillRect(0, 0, W, 38);

      ctx.font = 'bold 14px monospace';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = skin.hudPrimaryColor;
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE  ${String(s.score).padStart(6, '0')}`, 12, 19);

      ctx.fillStyle = skin.hudSecondaryColor;
      ctx.textAlign = 'right';
      ctx.fillText(`LEVEL  ${String(s.level).padStart(2, '0')}`, W - 12, 19);

      ctx.textAlign = 'left';
    }

    // ── Update ──────────────────────────────────────────────────────────────
    function update() {
      const s = stateRef.current;
      if (s.dead) return;

      s.dir = s.nextDir;
      const head = s.snake[0];
      const newHead: Point = { x: head.x + s.dir.x, y: head.y + s.dir.y };

      // Wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= COLS ||
        newHead.y < 0 ||
        newHead.y >= ROWS
      ) {
        triggerDeath();
        return;
      }

      // Self collision
      if (s.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        triggerDeath();
        return;
      }

      const ateFreuit =
        newHead.x === s.fruit.pos.x && newHead.y === s.fruit.pos.y;

      // Move snake
      s.snake.unshift(newHead);
      if (!ateFreuit) {
        s.snake.pop();
      } else {
        s.fruitsEaten += 1;
        s.score += 10 * s.level;

        const prevLevel = s.level;
        if (s.fruitsEaten % FRUITS_PER_LEVEL === 0) {
          s.level += 1;
          reschedule();
        }

        s.fruit = randomFruit(s.snake);

        // Fire callbacks only when values change
        if (s.score !== prevScoreRef.current) {
          prevScoreRef.current = s.score;
          onScoreChange(s.score);
        }
        if (s.level !== prevLevel) {
          prevLevelRef.current = s.level;
          onLevelChange(s.level);
        }
      }
    }

    function triggerDeath() {
      if (deadFiredRef.current) return;
      deadFiredRef.current = true;
      stateRef.current.dead = true;
      clearInterval(intervalRef.current!);
      draw();
      onLivesChange(0);
      onGameOver(stateRef.current.score);
    }

    // ── Loop ────────────────────────────────────────────────────────────────
    let pauseDrawn = false;

    function tick() {
      if (pausedRef.current) {
        if (!pauseDrawn) {
          draw();
          pauseDrawn = true;
        }
        return;
      }
      pauseDrawn = false;
      update();
      draw();
    }

    function startLoop() {
      clearInterval(intervalRef.current!);
      intervalRef.current = setInterval(
        tick,
        intervalMs(stateRef.current.level),
      );
    }

    function reschedule() {
      clearInterval(intervalRef.current!);
      intervalRef.current = setInterval(
        tick,
        intervalMs(stateRef.current.level),
      );
    }

    // ── Keyboard ────────────────────────────────────────────────────────────
    function handleKey(e: KeyboardEvent) {
      const s = stateRef.current;
      const cur = s.dir;
      const map: Record<string, Point> = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      };
      const next = map[e.key.toLowerCase()];
      if (!next) return;
      e.preventDefault();
      // Ignore 180° reversal
      if (next.x === -cur.x && next.y === -cur.y) return;
      s.nextDir = next;
    }

    document.addEventListener('keydown', handleKey);

    return () => {
      alive = false;
      clearInterval(intervalRef.current!);
      document.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}

export default React.memo(SnakeGame);
