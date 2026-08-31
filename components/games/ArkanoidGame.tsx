'use client';

import React, { useEffect, useRef } from 'react';

interface ArkanoidGameProps {
  paused: boolean;
  skinKey?: string;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Skin system ───────────────────────────────────────────────────────────────

type BlockColor =
  | 'red'
  | 'yellow'
  | 'cyan'
  | 'magenta'
  | 'hotpink'
  | 'green'
  | 'gray';

type Skin = {
  name: string;
  boardBg: string;
  // When true the skin draws blocks itself (retro/neon); when false the
  // caller falls back to the spritesheet.
  drawsBlocks: boolean;
  drawBlock: (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: BlockColor,
  ) => void;
  hudColor: string;
};

// NES-accurate Arkanoid block palette used by the classic skin
const CLASSIC_BLOCK_COLORS: Record<BlockColor, string> = {
  red: '#e03030',
  yellow: '#e0c000',
  cyan: '#00c8d0',
  magenta: '#c040c0',
  hotpink: '#e050a0',
  green: '#28b040',
  gray: '#909090',
};

// Retro CRT palette — saturated solids, no shadow
const RETRO_BLOCK_COLORS: Record<BlockColor, string> = {
  red: '#ff5555',
  yellow: '#ffdd55',
  cyan: '#55ffee',
  magenta: '#dd55ff',
  hotpink: '#ff55aa',
  green: '#55ff88',
  gray: '#aaaaaa',
};

// Neon electric palette
const NEON_BLOCK_COLORS: Record<BlockColor, string> = {
  red: '#ff2244',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  hotpink: '#ff0088',
  green: '#00ff66',
  gray: '#888899',
};

const SKINS: Record<string, Skin> = {
  classic: {
    name: 'Classic',
    boardBg: '#000000',
    drawsBlocks: false,
    // Fallback used only when spritesheet is unavailable
    drawBlock(ctx, x, y, w, h, color) {
      ctx.fillStyle = CLASSIC_BLOCK_COLORS[color] ?? '#888';
      ctx.fillRect(x, y, w, h);
    },
    hudColor: '#ffffff',
  },

  retro: {
    name: 'Retro',
    boardBg: '#0a0a0f',
    drawsBlocks: true,
    drawBlock(ctx, x, y, w, h, color) {
      const fill = RETRO_BLOCK_COLORS[color] ?? '#888';
      ctx.fillStyle = fill;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      // CRT highlight: 4 px white strip at the top
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, y + 1, w - 2, 4);
    },
    hudColor: '#e0e0e0',
  },

  neon: {
    name: 'Neon',
    boardBg: '#000000',
    drawsBlocks: true,
    drawBlock(ctx, x, y, w, h, color) {
      const fill = NEON_BLOCK_COLORS[color] ?? '#888';
      const r = parseInt(fill.slice(1, 3), 16);
      const g = parseInt(fill.slice(3, 5), 16);
      const b = parseInt(fill.slice(5, 7), 16);

      ctx.shadowColor = fill;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

      ctx.strokeStyle = fill;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1.75, y + 1.75, w - 3.5, h - 3.5);
      ctx.shadowBlur = 0;
    },
    hudColor: '#00ffff',
  },
};

// ── Spritesheet data ──────────────────────────────────────────────────────────

const EXPLOSION_FRAMES: Record<
  string,
  { sx: number; sy: number; sw: number; sh: number }[]
> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

const EXPLOSION_DURATION = 150;

const SPRITES: Record<
  string,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
};

const BLOCK_SPRITES: Record<
  string,
  { sx: number; sy: number; sw: number; sh: number }
> = {
  gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
  red: { sx: 32, sy: 176, sw: 32, sh: 16 },
  yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
  cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
  magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
  hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
  green: { sx: 32, sy: 208, sw: 32, sh: 16 },
};

// ── Level data ────────────────────────────────────────────────────────────────

type BlockDef = { col: number; row: number; color: string };
type Level = { speed: number; blocks: BlockDef[] };

const LEVELS: Level[] = (() => {
  const rowColors1 = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
  const rowColors2 = ['gray', 'cyan', 'hotpink', 'yellow', 'magenta', 'green'];
  const rowColors4 = ['cyan', 'magenta', 'green', 'yellow', 'hotpink', 'red'];

  const l1: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      l1.push({ col, row, color: rowColors1[row] });

  const l2: BlockDef[] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < 6; row++)
    for (let col = pyStart[row]; col <= pyEnd[row]; col++)
      l2.push({ col, row, color: rowColors2[row] });

  const l3: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if ((col + row) % 2 === 0)
        l3.push({ col, row, color: row < 3 ? 'yellow' : 'magenta' });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++)
      if (!gaps4[row].includes(col))
        l4.push({ col, row, color: rowColors4[row] });

  const l5: BlockDef[] = [];
  for (let row = 0; row < 6; row++)
    for (let col = 0; col < 10; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? 'hotpink' : 'cyan' });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

// ── Game constants ─────────────────────────────────────────────────────────────

const W = 800;
const H = 600;
const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

// ── Types ──────────────────────────────────────────────────────────────────────

type Block = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
};
type Explosion = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  elapsed: number;
};

function buildNeonCache(): Map<BlockColor, HTMLCanvasElement> {
  const cache = new Map<BlockColor, HTMLCanvasElement>();
  for (const [color, fill] of Object.entries(NEON_BLOCK_COLORS) as [
    BlockColor,
    string,
  ][]) {
    const oc = document.createElement('canvas');
    oc.width = BLOCK_W;
    oc.height = BLOCK_H;
    const octx = oc.getContext('2d')!;
    const r = parseInt(fill.slice(1, 3), 16);
    const g = parseInt(fill.slice(3, 5), 16);
    const b = parseInt(fill.slice(5, 7), 16);
    octx.shadowColor = fill;
    octx.shadowBlur = 12;
    octx.fillStyle = `rgba(${r},${g},${b},0.45)`;
    octx.fillRect(1, 1, BLOCK_W - 2, BLOCK_H - 2);
    octx.strokeStyle = fill;
    octx.lineWidth = 1.5;
    octx.strokeRect(1.75, 1.75, BLOCK_W - 3.5, BLOCK_H - 3.5);
    octx.shadowBlur = 0;
    cache.set(color, oc);
  }
  return cache;
}

function ArkanoidGame({
  paused,
  skinKey = 'classic',
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: ArkanoidGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skinKey] ?? SKINS.classic);
  const neonCacheRef = useRef<Map<BlockColor, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    skinRef.current = SKINS[skinKey] ?? SKINS.classic;
    if (skinKey === 'neon') neonCacheRef.current = buildNeonCache();
  }, [skinKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // ── Spritesheet ──────────────────────────────────────────────────────────
    let ssImg: HTMLCanvasElement | null = null;
    let ssLoaded = false;

    function drawFrame(
      frame: { sx: number; sy: number; sw: number; sh: number },
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      if (!ssLoaded || !ssImg) return;
      ctx.drawImage(ssImg, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
    }

    function drawSprite(
      name: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ) {
      if (!ssLoaded || !ssImg) return;
      const sp = name.startsWith('block_')
        ? BLOCK_SPRITES[name.slice(6)]
        : SPRITES[name];
      if (!sp) return;
      ctx.drawImage(ssImg, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
    }

    // ── Game state ───────────────────────────────────────────────────────────
    const paddle = { x: 0, y: 560, w: 81, h: 14 };
    const ball = {
      x: 0,
      y: 0,
      w: 16,
      h: 16,
      vx: BASE_BALL_VX,
      vy: BASE_BALL_VY,
    };

    let blocks: Block[] = [];
    let explosions: Explosion[] = [];
    let lives = 3;
    let score = 0;
    let gameState: 'playing' | 'gameover' | 'win' = 'playing';
    let currentLevel = 1;

    // Reported-value trackers so callbacks only fire on change
    let reportedScore = 0;
    let reportedLives = 3;
    let reportedLevel = 1;
    let gameOverFired = false;

    const keys: Record<string, boolean> = {
      ArrowLeft: false,
      ArrowRight: false,
    };

    // ── Audio ────────────────────────────────────────────────────────────────
    const bounceSound = new Audio('/ball-bounce.mp3');
    const breakSound = new Audio('/break-sound.mp3');

    function playBounce() {
      try {
        (bounceSound.cloneNode() as HTMLAudioElement).play().catch(() => {});
      } catch {}
    }
    function playBreak() {
      try {
        (breakSound.cloneNode() as HTMLAudioElement).play().catch(() => {});
      } catch {}
    }

    // ── Init helpers ─────────────────────────────────────────────────────────
    function initPaddle() {
      paddle.x = (W - paddle.w) / 2;
    }

    function initBall() {
      const speed = LEVELS[currentLevel - 1].speed;
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * speed;
      ball.vy = BASE_BALL_VY * speed;
    }

    function loadLevel(n: number) {
      currentLevel = n;
      const level = LEVELS[n - 1];
      blocks = level.blocks.map((b) => ({
        x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
        y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
        w: BLOCK_W,
        h: BLOCK_H,
        color: b.color,
        alive: true,
      }));
      explosions = [];
      ball.x = paddle.x + (paddle.w - ball.w) / 2;
      ball.y = paddle.y - ball.h;
      ball.vx = BASE_BALL_VX * level.speed;
      ball.vy = BASE_BALL_VY * level.speed;
    }

    // ── Collision ────────────────────────────────────────────────────────────
    function collideAABB(block: Block) {
      return (
        ball.x < block.x + block.w &&
        ball.x + ball.w > block.x &&
        ball.y < block.y + block.h &&
        ball.y + ball.h > block.y
      );
    }

    // ── Update ───────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (gameState !== 'playing') return;

      if (keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
      if (keys.ArrowRight)
        paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x <= 0) {
        ball.x = 0;
        ball.vx = Math.abs(ball.vx);
        playBounce();
      }
      if (ball.x + ball.w >= W) {
        ball.x = W - ball.w;
        ball.vx = -Math.abs(ball.vx);
        playBounce();
      }
      if (ball.y <= 0) {
        ball.y = 0;
        ball.vy = Math.abs(ball.vy);
        playBounce();
      }

      if (
        ball.vy > 0 &&
        ball.x + ball.w > paddle.x &&
        ball.x < paddle.x + paddle.w &&
        ball.y + ball.h >= paddle.y &&
        ball.y + ball.h <= paddle.y + paddle.h + 8
      ) {
        ball.y = paddle.y - ball.h;
        ball.vy = -Math.abs(ball.vy);
        playBounce();
      }

      for (const block of blocks) {
        if (!block.alive) continue;
        if (collideAABB(block)) {
          block.alive = false;
          explosions.push({
            x: block.x,
            y: block.y,
            w: block.w,
            h: block.h,
            color: block.color,
            elapsed: 0,
          });
          score += 10;
          ball.vy = -ball.vy;
          playBreak();
          if (blocks.every((b) => !b.alive)) {
            if (currentLevel < 5) loadLevel(currentLevel + 1);
            else gameState = 'win';
          }
          break;
        }
      }

      for (const exp of explosions) exp.elapsed += dt * 1000;
      explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

      if (ball.y > H) {
        lives--;
        if (lives <= 0) {
          lives = 0;
          gameState = 'gameover';
        } else {
          initBall();
        }
      }

      // ── Notify React ───────────────────────────────────────────────────────
      if (score !== reportedScore) {
        reportedScore = score;
        onScoreChange(score);
      }
      if (lives !== reportedLives) {
        reportedLives = lives;
        onLivesChange(lives);
      }
      if (currentLevel !== reportedLevel) {
        reportedLevel = currentLevel;
        onLevelChange(currentLevel);
      }

      if (!gameOverFired && (gameState === 'gameover' || gameState === 'win')) {
        gameOverFired = true;
        onLivesChange(0);
        onGameOver(score);
      }
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function draw() {
      const skin = skinRef.current;

      ctx.fillStyle = skin.boardBg;
      ctx.fillRect(0, 0, W, H);

      for (const block of blocks) {
        if (!block.alive) continue;
        if (skin.drawsBlocks) {
          if (skin.name === 'Neon') {
            const cached = neonCacheRef.current.get(block.color as BlockColor);
            if (cached) ctx.drawImage(cached, block.x, block.y);
            else
              skin.drawBlock(
                ctx,
                block.x,
                block.y,
                block.w,
                block.h,
                block.color as BlockColor,
              );
          } else {
            skin.drawBlock(
              ctx,
              block.x,
              block.y,
              block.w,
              block.h,
              block.color as BlockColor,
            );
          }
        } else {
          // classic: use spritesheet, fallback to solid if not loaded
          if (ssLoaded) {
            drawSprite(
              'block_' + block.color,
              block.x,
              block.y,
              block.w,
              block.h,
            );
          } else {
            skin.drawBlock(
              ctx,
              block.x,
              block.y,
              block.w,
              block.h,
              block.color as BlockColor,
            );
          }
        }
      }

      for (const exp of explosions) {
        const frameIndex = Math.min(
          Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4),
          3,
        );
        drawFrame(
          EXPLOSION_FRAMES[exp.color][frameIndex],
          exp.x,
          exp.y,
          exp.w,
          exp.h,
        );
      }

      // Paddle and ball always use the spritesheet
      drawSprite('paddle', paddle.x, paddle.y, paddle.w, paddle.h);
      drawSprite('ball', ball.x, ball.y, ball.w, ball.h);

      // Internal HUD
      ctx.fillStyle = skin.hudColor;
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Score: ' + score, 10, 10);
      ctx.textAlign = 'center';
      ctx.fillText('Nivel: ' + currentLevel, W / 2, 10);
      const ballSize = 16;
      const ballSpacing = 4;
      for (let i = 0; i < lives; i++) {
        const bx = W - 10 - (lives - i) * (ballSize + ballSpacing);
        drawSprite('ball', bx, 10, ballSize, ballSize);
      }
    }

    // ── Loop ─────────────────────────────────────────────────────────────────
    let rafId: number;
    let lastTime: number | null = null;
    let pauseDrawn = false;

    function loop(timestamp: number) {
      if (lastTime === null) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (pausedRef.current) {
        if (!pauseDrawn) {
          draw();
          pauseDrawn = true;
        }
        rafId = requestAnimationFrame(loop);
        return;
      }
      pauseDrawn = false;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    // ── Event handlers ────────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      if (e.key in keys) keys[e.key] = true;
      // P / Escape intentionally NOT handled — platform controls pause
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key in keys) keys[e.key] = false;
    }
    function onMouseMove(e: MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);

    // ── Start ─────────────────────────────────────────────────────────────────
    // Guard against React Strict Mode double-mount: if the effect is cleaned up
    // before the async image load completes, do not start the loop.
    let cleaned = false;

    const rawImg = new Image();
    rawImg.onload = () => {
      if (cleaned) return;
      const oc = document.createElement('canvas');
      oc.width = rawImg.width;
      oc.height = rawImg.height;
      oc.getContext('2d')!.drawImage(rawImg, 0, 0);
      ssImg = oc;
      ssLoaded = true;
      initPaddle();
      loadLevel(1);
      rafId = requestAnimationFrame(loop);
    };
    rawImg.onerror = () => console.error('Failed to load spritesheet');
    rawImg.src = '/spritesheet-breakout.png';

    return () => {
      cleaned = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

export default React.memo(ArkanoidGame);
