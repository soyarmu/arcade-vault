'use client';

import React, { useEffect, useRef } from 'react';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FroggerGameProps {
  paused: boolean;
  skinKey?: string;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Grid constants ────────────────────────────────────────────────────────────

const COLS = 16;
const ROWS = 14;
const CELL = 40; // px
const CANVAS_W = COLS * CELL; // 640
const CANVAS_H = ROWS * CELL; // 560

// Row indices (0 = top)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const ROUND_TIME = 15; // base seconds per round
const JUMP_MS = 120; // jump animation duration in ms
const TURTLE_VISIBLE_MS = 6000;
const TURTLE_SUBMERGED_MS = 2000;
const DEATH_FLASH_MS = 500;

// Goal slot left-column starts; each slot is 2 cols wide
const GOAL_STARTS = [1, 4, 7, 10, 13] as const;

const DASH_ROAD: number[] = [8, 8];
const DASH_CLEAR: number[] = [];

// ── Skin system ───────────────────────────────────────────────────────────────

type Skin = {
  name: string;
  boardBg: string | null;
  // Zone backgrounds
  goalsBg: string;
  goalsFilled: string;
  riverBg: string;
  safeBg: string;
  roadBg: string;
  startBg: string;
  // Road dividers
  dividerColor: string;
  // Goal mouth border
  goalBorder: string;
  goalFilledFrog: string;
  // Cars
  carColors: string[];
  carWindow: string;
  carWheel: string;
  // Trucks
  truckBody: string;
  truckCab: string;
  truckWindow: string;
  truckWheel: string;
  // Logs
  logBody: string;
  logGrain: string;
  logEnd: string;
  // Turtles
  turtleBody: string;
  turtleBodySub: string;
  turtleShell: string;
  turtleShellSub: string;
  turtleHead: string;
  turtleHeadSub: string;
  // Frog
  frogBody: string;
  frogDying: string;
  frogLegs: string;
  frogEyeWhite: string;
  frogEyePupil: string;
  // HUD
  hudBg: string;
  hudScore: string;
  hudLevel: string;
  hudLifeOn: string;
  hudLifeOff: string;
  hudTimerEmpty: string;
  hudTimerHigh: string;
  hudTimerMid: string;
  hudTimerLow: string;
  // Neon glow (null = no glow)
  neonGlow: string | null;
};

const SKINS: Record<string, Skin> = {
  classic: {
    name: 'Classic',
    boardBg: null,
    // Zones
    goalsBg: '#0d2b0d',
    goalsFilled: '#1a5c1a',
    riverBg: '#001833',
    safeBg: '#112211',
    roadBg: '#111111',
    startBg: '#112211',
    // Road dividers
    dividerColor: 'rgba(255,220,0,0.18)',
    // Goals
    goalBorder: '#ffd700',
    goalFilledFrog: '#00cc44',
    // Cars
    carColors: ['#cc2222', '#2244cc', '#ccaa00', '#aa2299', '#22aacc'],
    carWindow: 'rgba(180,230,255,0.45)',
    carWheel: '#1a1a1a',
    // Trucks
    truckBody: '#445566',
    truckCab: '#667788',
    truckWindow: 'rgba(180,230,255,0.45)',
    truckWheel: '#1a1a1a',
    // Logs
    logBody: '#5c3a0d',
    logGrain: '#7a4f1a',
    logEnd: '#8b5e2a',
    // Turtles
    turtleBody: '#2a8a2a',
    turtleBodySub: '#1a4d1a',
    turtleShell: '#1a6a1a',
    turtleShellSub: '#0d3d0d',
    turtleHead: '#1a7a1a',
    turtleHeadSub: '#0d3d0d',
    // Frog
    frogBody: '#00e64d',
    frogDying: '#ff4400',
    frogLegs: '#00cc44',
    frogEyeWhite: '#ffffff',
    frogEyePupil: '#000000',
    // HUD
    hudBg: 'rgba(0,0,0,0.7)',
    hudScore: '#00ff88',
    hudLevel: '#ffffff',
    hudLifeOn: '#00e64d',
    hudLifeOff: '#333333',
    hudTimerEmpty: '#0a0a0a',
    hudTimerHigh: '#00cc44',
    hudTimerMid: '#ffcc00',
    hudTimerLow: '#ff3300',
    // Neon
    neonGlow: null,
  },

  retro: {
    name: 'Retro',
    boardBg: null,
    // Zones — muted CRT palette, darker
    goalsBg: '#0f2b14',
    goalsFilled: '#1e4d24',
    riverBg: '#0a1e38',
    safeBg: '#1a2a1a',
    roadBg: '#1a1a1a',
    startBg: '#1a2a1a',
    // Road dividers — amber CRT
    dividerColor: 'rgba(255,200,60,0.22)',
    // Goals
    goalBorder: '#c8a800',
    goalFilledFrog: '#4cba4c',
    // Cars — saturated but solid, no glow
    carColors: ['#c43030', '#2050b8', '#b89820', '#982088', '#1890b8'],
    carWindow: 'rgba(160,210,240,0.38)',
    carWheel: '#222222',
    // Trucks — muted steel
    truckBody: '#384858',
    truckCab: '#506070',
    truckWindow: 'rgba(160,210,240,0.38)',
    truckWheel: '#222222',
    // Logs — deeper wood
    logBody: '#4a2e08',
    logGrain: '#6a4015',
    logEnd: '#7a5020',
    // Turtles — muted greens
    turtleBody: '#248024',
    turtleBodySub: '#143814',
    turtleShell: '#185818',
    turtleShellSub: '#0c300c',
    turtleHead: '#186818',
    turtleHeadSub: '#0c300c',
    // Frog — phosphor green
    frogBody: '#30d048',
    frogDying: '#e03800',
    frogLegs: '#28b838',
    frogEyeWhite: '#e8e8e8',
    frogEyePupil: '#101010',
    // HUD — amber monochrome CRT
    hudBg: 'rgba(0,0,0,0.75)',
    hudScore: '#f0c000',
    hudLevel: '#f0c000',
    hudLifeOn: '#30d048',
    hudLifeOff: '#2a2a2a',
    hudTimerEmpty: '#0a0a0a',
    hudTimerHigh: '#30c840',
    hudTimerMid: '#d8a800',
    hudTimerLow: '#d03000',
    // No glow
    neonGlow: null,
  },

  neon: {
    name: 'Neon',
    boardBg: '#000000',
    // Zones — pure black + dark tinted
    goalsBg: '#001400',
    goalsFilled: '#004400',
    riverBg: '#000818',
    safeBg: '#001800',
    roadBg: '#080808',
    startBg: '#001800',
    // Road dividers — electric yellow
    dividerColor: 'rgba(255,255,0,0.28)',
    // Goals
    goalBorder: '#ffff00',
    goalFilledFrog: '#00ff44',
    // Cars — electric palette
    carColors: ['#ff2020', '#2060ff', '#ffdd00', '#ff00cc', '#00ddff'],
    carWindow: 'rgba(0,200,255,0.35)',
    carWheel: '#080808',
    // Trucks — dark steel with cyan tint
    truckBody: '#0a2030',
    truckCab: '#103040',
    truckWindow: 'rgba(0,200,255,0.35)',
    truckWheel: '#080808',
    // Logs — deep brown, outlined
    logBody: '#3a2008',
    logGrain: '#5a3810',
    logEnd: '#6a4818',
    // Turtles — neon green
    turtleBody: '#00cc00',
    turtleBodySub: '#003800',
    turtleShell: '#009900',
    turtleShellSub: '#002800',
    turtleHead: '#00aa00',
    turtleHeadSub: '#002800',
    // Frog — electric lime
    frogBody: '#00ff44',
    frogDying: '#ff4400',
    frogLegs: '#00ff44',
    frogEyeWhite: '#ffffff',
    frogEyePupil: '#000000',
    // HUD — neon cyan/magenta
    hudBg: 'rgba(0,0,0,0.85)',
    hudScore: '#00ffff',
    hudLevel: '#ff00ff',
    hudLifeOn: '#00ff44',
    hudLifeOff: '#1a1a1a',
    hudTimerEmpty: '#000000',
    hudTimerHigh: '#00ff44',
    hudTimerMid: '#ffff00',
    hudTimerLow: '#ff2200',
    // Neon glow color
    neonGlow: '#00ff44',
  },
};

// ── Local types ───────────────────────────────────────────────────────────────

type Direction = 'up' | 'down' | 'left' | 'right';

interface Entity {
  col: number;
  width: number;
  type: 'car' | 'truck' | 'log' | 'turtle';
  submerged?: boolean;
  submergeTimer?: number;
}

interface Lane {
  row: number;
  speed: number; // cells per 16-ms frame: col += speed * dir * dt / 16
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

// ── Lane builder ─────────────────────────────────────────────────────────────

function buildLanes(level: number): {
  lanes: Lane[];
  laneIndexMap: Map<Lane, number>;
} {
  const scale = Math.pow(1.15, level - 1);

  function roadLane(
    row: number,
    dir: 1 | -1,
    baseSpeed: number,
    defs: { col: number; width: number; type: 'car' | 'truck' }[],
  ): Lane {
    return {
      row,
      speed: baseSpeed * scale,
      dir,
      entities: defs.map((d) => ({ ...d })),
    };
  }

  function riverLane(
    row: number,
    dir: 1 | -1,
    baseSpeed: number,
    defs: { col: number; width: number; type: 'log' | 'turtle' }[],
  ): Lane {
    return {
      row,
      speed: baseSpeed * scale,
      dir,
      entities: defs.map((d) =>
        d.type === 'turtle'
          ? { ...d, submerged: false, submergeTimer: 0 }
          : { ...d },
      ),
    };
  }

  const lanesArr: Lane[] = [
    // Road (rows 8–12)
    roadLane(12, 1, 0.04, [
      { col: 0, width: 1, type: 'car' },
      { col: 5, width: 1, type: 'car' },
      { col: 10, width: 1, type: 'car' },
    ]),
    roadLane(11, -1, 0.055, [
      { col: 0, width: 3, type: 'truck' },
      { col: 9, width: 3, type: 'truck' },
    ]),
    roadLane(10, 1, 0.05, [
      { col: 0, width: 2, type: 'car' },
      { col: 6, width: 2, type: 'car' },
      { col: 12, width: 2, type: 'car' },
    ]),
    roadLane(9, -1, 0.07, [
      { col: 0, width: 3, type: 'truck' },
      { col: 6, width: 1, type: 'car' },
      { col: 11, width: 3, type: 'truck' },
    ]),
    roadLane(8, 1, 0.065, [
      { col: 0, width: 1, type: 'car' },
      { col: 4, width: 1, type: 'car' },
      { col: 8, width: 1, type: 'car' },
      { col: 12, width: 1, type: 'car' },
    ]),
    // River (rows 1–6)
    riverLane(6, 1, 0.035, [
      { col: 0, width: 3, type: 'log' },
      { col: 6, width: 3, type: 'log' },
      { col: 12, width: 2, type: 'log' },
    ]),
    riverLane(5, -1, 0.04, [
      { col: 1, width: 2, type: 'turtle' },
      { col: 7, width: 2, type: 'turtle' },
      { col: 12, width: 2, type: 'turtle' },
    ]),
    riverLane(4, 1, 0.05, [
      { col: 0, width: 4, type: 'log' },
      { col: 8, width: 4, type: 'log' },
    ]),
    riverLane(3, -1, 0.045, [
      { col: 0, width: 3, type: 'turtle' },
      { col: 6, width: 3, type: 'turtle' },
      { col: 12, width: 2, type: 'turtle' },
    ]),
    riverLane(2, 1, 0.055, [
      { col: 0, width: 3, type: 'log' },
      { col: 8, width: 4, type: 'log' },
    ]),
    riverLane(1, -1, 0.04, [
      { col: 0, width: 3, type: 'log' },
      { col: 6, width: 3, type: 'log' },
      { col: 12, width: 3, type: 'log' },
    ]),
  ];
  const laneIndexMap = new Map<Lane, number>(lanesArr.map((l, i) => [l, i]));
  return { lanes: lanesArr, laneIndexMap };
}

function roundTime(level: number): number {
  return Math.max(5, ROUND_TIME - (level - 1) * 0.5);
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getGoalIdx(col: number): number {
  const c = Math.round(col);
  if (c < 1 || c > 14) return -1;
  const rem = (c - 1) % 3;
  if (rem >= 2) return -1;
  return Math.floor((c - 1) / 3);
}

function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
  const lane = lanes.find((l) => l.row === frog.row);
  if (!lane) return null;
  const center = frog.col + 0.5;
  for (const e of lane.entities) {
    if (e.col <= center && center < e.col + e.width) {
      if (e.type === 'turtle' && e.submerged) return null;
      return e;
    }
  }
  return null;
}

function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
  const lane = lanes.find((l) => l.row === frog.row);
  if (!lane) return false;
  for (const e of lane.entities) {
    if (e.col < frog.col + 1 && e.col + e.width > frog.col) return true;
  }
  return false;
}

// ── Neon sprite cache ─────────────────────────────────────────────────────────
// Each entity is pre-rendered once with shadowBlur into a small offscreen canvas.
// draw() calls ctx.drawImage(sprite, x, y) — zero shadowBlur cost per frame.

const SPRITE_PAD = 20; // px of padding around each sprite so blur doesn't clip

interface NeonCache {
  car: Map<string, HTMLCanvasElement>; // key: `${color}-${width}`
  truckRight: HTMLCanvasElement; // cab on right side (lane.dir === 1)
  truckLeft: HTMLCanvasElement; // cab on left side (lane.dir === -1)
  log: Map<number, HTMLCanvasElement>; // key: cell width
  turtleVisibleRight: HTMLCanvasElement;
  turtleVisibleLeft: HTMLCanvasElement;
  turtleSubmergedRight: HTMLCanvasElement;
  turtleSubmergedLeft: HTMLCanvasElement;
}

function makeNeonCanvas(w: number, h: number): HTMLCanvasElement {
  const el = document.createElement('canvas');
  el.width = w + SPRITE_PAD * 2;
  el.height = h + SPRITE_PAD * 2;
  return el;
}

function spriteCarNeon(
  sk: Skin,
  width: number,
  color: string,
): HTMLCanvasElement {
  const ew = width * CELL;
  const s = makeNeonCanvas(ew, CELL);
  const c = s.getContext('2d')!;
  const P = SPRITE_PAD;
  c.shadowBlur = 10;
  c.shadowColor = color;
  c.fillStyle = color;
  c.fillRect(P + 2, P + 9, ew - 4, CELL - 18);
  c.shadowBlur = 0;
  c.fillStyle = sk.carWindow;
  c.fillRect(P + 5, P + 11, ew - 10, 8);
  c.fillStyle = sk.carWheel;
  c.beginPath();
  c.arc(P + 8, P + CELL - 9, 5, 0, Math.PI * 2);
  c.arc(P + ew - 8, P + CELL - 9, 5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.shadowBlur = 6;
  c.shadowColor = color;
  c.strokeRect(P + 2, P + 9, ew - 4, CELL - 18);
  c.shadowBlur = 0;
  return s;
}

function spriteTruckNeon(sk: Skin, dir: 1 | -1): HTMLCanvasElement {
  const ew = 3 * CELL;
  const cabW = CELL - 4;
  const s = makeNeonCanvas(ew, CELL);
  const c = s.getContext('2d')!;
  const P = SPRITE_PAD;
  c.shadowBlur = 8;
  c.shadowColor = '#00aaff';
  c.fillStyle = sk.truckBody;
  c.fillRect(P + 2, P + 7, ew - 4, CELL - 14);
  c.shadowBlur = 0;
  const cabX = dir === 1 ? P + ew - cabW - 2 : P + 2;
  c.fillStyle = sk.truckCab;
  c.fillRect(cabX, P + 5, cabW, CELL - 10);
  c.fillStyle = sk.truckWindow;
  c.fillRect(cabX + 4, P + 9, cabW - 8, 10);
  c.fillStyle = sk.truckWheel;
  c.beginPath();
  c.arc(P + 8, P + CELL - 9, 5, 0, Math.PI * 2);
  c.arc(P + ew - 8, P + CELL - 9, 5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#00aaff';
  c.lineWidth = 1;
  c.shadowBlur = 6;
  c.shadowColor = '#00aaff';
  c.strokeRect(P + 2, P + 7, ew - 4, CELL - 14);
  c.shadowBlur = 0;
  return s;
}

function spriteLogNeon(sk: Skin, width: number): HTMLCanvasElement {
  const ew = width * CELL;
  const s = makeNeonCanvas(ew, CELL);
  const c = s.getContext('2d')!;
  const P = SPRITE_PAD;
  c.shadowBlur = 6;
  c.shadowColor = '#885522';
  c.fillStyle = sk.logBody;
  c.fillRect(P + 1, P + 7, ew - 2, CELL - 14);
  c.shadowBlur = 0;
  c.strokeStyle = sk.logGrain;
  c.lineWidth = 1;
  for (let lx = P + 1 + 10; lx < P + ew - 2; lx += 12) {
    c.beginPath();
    c.moveTo(lx, P + 7);
    c.lineTo(lx, P + CELL - 7);
    c.stroke();
  }
  c.fillStyle = sk.logEnd;
  c.beginPath();
  c.ellipse(P + 4, P + CELL / 2, 3, (CELL - 14) / 2, 0, 0, Math.PI * 2);
  c.ellipse(P + ew - 4, P + CELL / 2, 3, (CELL - 14) / 2, 0, 0, Math.PI * 2);
  c.fill();
  return s;
}

function spriteTurtleSegNeon(
  sk: Skin,
  dir: 1 | -1,
  submerged: boolean,
): HTMLCanvasElement {
  const s = makeNeonCanvas(CELL, CELL);
  const c = s.getContext('2d')!;
  const P = SPRITE_PAD;
  const tx = P + CELL / 2;
  const ty = P + CELL / 2;
  const bodyColor = submerged ? sk.turtleBodySub : sk.turtleBody;
  if (!submerged) {
    c.shadowBlur = 10;
    c.shadowColor = sk.turtleBody;
  }
  c.fillStyle = bodyColor;
  c.beginPath();
  c.arc(tx, ty, 14, 0, Math.PI * 2);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = submerged ? sk.turtleShellSub : sk.turtleShell;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(tx, ty - 10);
  c.lineTo(tx, ty + 10);
  c.moveTo(tx - 10, ty);
  c.lineTo(tx + 10, ty);
  c.stroke();
  c.fillStyle = submerged ? sk.turtleHeadSub : sk.turtleHead;
  c.beginPath();
  c.arc(tx + (dir === 1 ? 12 : -12), ty, 6, 0, Math.PI * 2);
  c.fill();
  return s;
}

function buildNeonCache(sk: Skin): NeonCache {
  const car = new Map<string, HTMLCanvasElement>();
  for (const color of sk.carColors) {
    for (const w of [1, 2]) {
      car.set(`${color}-${w}`, spriteCarNeon(sk, w, color));
    }
  }
  return {
    car,
    truckRight: spriteTruckNeon(sk, 1),
    truckLeft: spriteTruckNeon(sk, -1),
    log: new Map([2, 3, 4].map((w) => [w, spriteLogNeon(sk, w)])),
    turtleVisibleRight: spriteTurtleSegNeon(sk, 1, false),
    turtleVisibleLeft: spriteTurtleSegNeon(sk, -1, false),
    turtleSubmergedRight: spriteTurtleSegNeon(sk, 1, true),
    turtleSubmergedLeft: spriteTurtleSegNeon(sk, -1, true),
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

function FroggerGame({
  paused,
  skinKey = 'classic',
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const skinRef = useRef(SKINS[skinKey ?? 'classic'] ?? SKINS.classic);
  const neonCacheRef = useRef<NeonCache | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const sk = SKINS[skinKey ?? 'classic'] ?? SKINS.classic;
    skinRef.current = sk;
    neonCacheRef.current = sk.neonGlow !== null ? buildNeonCache(sk) : null;
  }, [skinKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // ── Game state ───────────────────────────────────────────────────────────

    let lives = 3;
    let score = 0;
    let level = 1;
    let timer = roundTime(1);
    let { lanes, laneIndexMap } = buildLanes(1);
    let goals = [false, false, false, false, false];
    let highestRowReached = ROW_START;

    const frog: Frog = {
      col: Math.floor(COLS / 2),
      row: ROW_START,
      animating: false,
      animT: 0,
      targetCol: Math.floor(COLS / 2),
      targetRow: ROW_START,
    };

    let pendingDir: Direction | null = null;
    let dying = false;
    let deathTimer = 0;
    let gameEnded = false;

    let prevScore = 0;
    let prevLives = 3;
    let prevLevel = 1;

    function fireCallbacks() {
      if (score !== prevScore) {
        prevScore = score;
        onScoreChange(score);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        onLivesChange(lives);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        onLevelChange(level);
      }
    }

    // ── Game logic ───────────────────────────────────────────────────────────

    function respawnFrog() {
      frog.col = Math.floor(COLS / 2);
      frog.row = ROW_START;
      frog.animating = false;
      frog.animT = 0;
      frog.targetCol = frog.col;
      frog.targetRow = frog.row;
      highestRowReached = ROW_START;
      timer = roundTime(level);
    }

    function killFrog() {
      if (gameEnded || dying) return;
      lives -= 1;
      if (lives <= 0) {
        lives = 0;
        gameEnded = true;
        onLivesChange(0);
        onGameOver(score);
      } else {
        onLivesChange(lives);
        prevLives = lives;
        dying = true;
        deathTimer = 0;
      }
    }

    function completeRound() {
      score += 200;
      level += 1;
      goals = [false, false, false, false, false];
      ({ lanes, laneIndexMap } = buildLanes(level));
      timer = roundTime(level);
      prevScore = score;
      prevLevel = level;
      onScoreChange(score);
      onLevelChange(level);
      respawnFrog();
    }

    function checkGoal() {
      const goalIdx = getGoalIdx(frog.col);
      if (goalIdx === -1) {
        killFrog();
        return;
      }
      if (goals[goalIdx]) {
        killFrog();
        return;
      }
      goals[goalIdx] = true;
      const timeBonus = Math.floor(timer) * 10;
      score += 50 + timeBonus;
      prevScore = score;
      onScoreChange(score);
      respawnFrog();
      if (goals.every(Boolean)) completeRound();
    }

    function resolveCellArrival() {
      const { row } = frog;

      if (row < highestRowReached) {
        score += (highestRowReached - row) * 10;
        highestRowReached = row;
        prevScore = score;
        onScoreChange(score);
      }

      if (row === ROW_GOALS) {
        checkGoal();
        return;
      }

      if (row >= ROW_ROAD_TOP && row <= ROW_ROAD_BOT) {
        if (checkRoadCollision(frog, lanes)) {
          killFrog();
          return;
        }
      }

      if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) {
        if (!getSupport(frog, lanes)) {
          killFrog();
        }
      }
    }

    function attemptMove(dir: Direction) {
      if (frog.animating || dying || gameEnded) return;
      const dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
      const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
      const baseCol = Math.round(frog.col);
      const nextCol = baseCol + dc;
      const nextRow = frog.row + dr;
      if (nextCol < 0 || nextCol >= COLS) return;
      if (nextRow < ROW_GOALS || nextRow > ROW_START) return;
      frog.targetCol = nextCol;
      frog.targetRow = nextRow;
      frog.animating = true;
      frog.animT = 0;
    }

    // ── Update ───────────────────────────────────────────────────────────────

    function update(dt: number) {
      if (gameEnded) return;

      if (dying) {
        deathTimer += dt;
        if (deathTimer >= DEATH_FLASH_MS) {
          dying = false;
          deathTimer = 0;
          respawnFrog();
        }
        return;
      }

      // Advance lane entities
      for (const lane of lanes) {
        for (const e of lane.entities) {
          e.col += lane.speed * lane.dir * (dt / 16);
          if (lane.dir === 1 && e.col >= COLS) {
            e.col -= COLS + e.width;
          } else if (lane.dir === -1 && e.col + e.width <= 0) {
            e.col += COLS + e.width;
          }
          if (e.type === 'turtle') {
            const cycle = TURTLE_VISIBLE_MS + TURTLE_SUBMERGED_MS;
            e.submergeTimer = ((e.submergeTimer ?? 0) + dt) % cycle;
            e.submerged = e.submergeTimer >= TURTLE_VISIBLE_MS;
          }
        }
      }

      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= JUMP_MS) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;
          frog.animT = 0;
          resolveCellArrival();
        }
      } else {
        if (pendingDir) {
          attemptMove(pendingDir);
          pendingDir = null;
        }

        // River drift + support check
        if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
          const support = getSupport(frog, lanes);
          if (!support) {
            killFrog();
            return;
          }
          const lane = lanes.find((l) => l.row === frog.row)!;
          frog.col += lane.speed * lane.dir * (dt / 16);
          if (frog.col < 0 || frog.col >= COLS) {
            killFrog();
            return;
          }
        }

        // Continuous road collision (vehicle moves into stationary frog)
        if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
          if (checkRoadCollision(frog, lanes)) {
            killFrog();
            return;
          }
        }
      }

      timer -= dt / 1000;
      if (timer <= 0) {
        timer = 0;
        killFrog();
        return;
      }

      fireCallbacks();
    }

    // ── Draw ─────────────────────────────────────────────────────────────────

    function draw() {
      const sk = skinRef.current;
      const isNeon = sk.neonGlow !== null;

      // Board background (neon uses solid black)
      if (sk.boardBg) {
        ctx.fillStyle = sk.boardBg;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }

      // Zone backgrounds
      ctx.fillStyle = sk.goalsBg;
      ctx.fillRect(0, ROW_GOALS * CELL, CANVAS_W, CELL);

      ctx.fillStyle = sk.riverBg;
      ctx.fillRect(
        0,
        ROW_RIVER_TOP * CELL,
        CANVAS_W,
        (ROW_RIVER_BOT - ROW_RIVER_TOP + 1) * CELL,
      );

      ctx.fillStyle = sk.safeBg;
      ctx.fillRect(0, ROW_SAFE_MID * CELL, CANVAS_W, CELL);

      ctx.fillStyle = sk.roadBg;
      ctx.fillRect(
        0,
        ROW_ROAD_TOP * CELL,
        CANVAS_W,
        (ROW_ROAD_BOT - ROW_ROAD_TOP + 1) * CELL,
      );

      ctx.fillStyle = sk.startBg;
      ctx.fillRect(0, ROW_START * CELL, CANVAS_W, CELL);

      // Road lane dividers
      ctx.strokeStyle = sk.dividerColor;
      ctx.lineWidth = 1;
      ctx.setLineDash(DASH_ROAD);
      for (let r = ROW_ROAD_TOP + 1; r <= ROW_ROAD_BOT; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL);
        ctx.lineTo(CANVAS_W, r * CELL);
        ctx.stroke();
      }
      ctx.setLineDash(DASH_CLEAR);

      // Retro CRT highlight on safe zones
      if (!isNeon) {
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, ROW_SAFE_MID * CELL, CANVAS_W, 4);
        ctx.fillRect(0, ROW_START * CELL, CANVAS_W, 4);
      }

      // Goal mouths
      for (let g = 0; g < 5; g++) {
        const gx = GOAL_STARTS[g] * CELL;
        const gy = ROW_GOALS * CELL;
        const gw = 2 * CELL;
        ctx.fillStyle = goals[g] ? sk.goalsFilled : sk.goalsBg;
        ctx.fillRect(gx, gy, gw, CELL);

        if (isNeon) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = sk.goalBorder;
        }
        ctx.strokeStyle = sk.goalBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(gx + 1, gy + 1, gw - 2, CELL - 2);
        if (isNeon) ctx.shadowBlur = 0;

        if (goals[g]) {
          if (isNeon) {
            ctx.shadowBlur = 12;
            ctx.shadowColor = sk.goalFilledFrog;
          }
          ctx.fillStyle = sk.goalFilledFrog;
          ctx.beginPath();
          ctx.ellipse(gx + gw / 2, gy + CELL / 2, 10, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          if (isNeon) ctx.shadowBlur = 0;
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(gx + gw / 2 - 5, gy + CELL / 2 - 3, 3, 0, Math.PI * 2);
          ctx.arc(gx + gw / 2 + 5, gy + CELL / 2 - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Entities
      const neonCache = neonCacheRef.current;
      const P = SPRITE_PAD;
      for (const lane of lanes) {
        for (const e of lane.entities) {
          const ex = e.col * CELL;
          const ey = lane.row * CELL;
          const ew = e.width * CELL;

          if (e.type === 'car') {
            const ci = (laneIndexMap.get(lane) ?? 0) % sk.carColors.length;
            const carColor = sk.carColors[ci];

            if (isNeon && neonCache) {
              ctx.drawImage(
                neonCache.car.get(`${carColor}-${e.width}`)!,
                ex - P,
                ey - P,
              );
            } else {
              if (isNeon) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = carColor;
              }
              ctx.fillStyle = carColor;
              ctx.fillRect(ex + 2, ey + 9, ew - 4, CELL - 18);
              if (!isNeon) {
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(ex + 2, ey + 9, ew - 4, 4);
              }
              if (isNeon) ctx.shadowBlur = 0;
              ctx.fillStyle = sk.carWindow;
              ctx.fillRect(ex + 5, ey + 11, ew - 10, 8);
              ctx.fillStyle = sk.carWheel;
              ctx.beginPath();
              ctx.arc(ex + 8, ey + CELL - 9, 5, 0, Math.PI * 2);
              ctx.arc(ex + ew - 8, ey + CELL - 9, 5, 0, Math.PI * 2);
              ctx.fill();
              if (isNeon) {
                ctx.strokeStyle = carColor;
                ctx.lineWidth = 1;
                ctx.shadowBlur = 6;
                ctx.shadowColor = carColor;
                ctx.strokeRect(ex + 2, ey + 9, ew - 4, CELL - 18);
                ctx.shadowBlur = 0;
              }
            }
          } else if (e.type === 'truck') {
            if (isNeon && neonCache) {
              ctx.drawImage(
                lane.dir === 1 ? neonCache.truckRight : neonCache.truckLeft,
                ex - P,
                ey - P,
              );
            } else {
              if (isNeon) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00aaff';
              }
              ctx.fillStyle = sk.truckBody;
              ctx.fillRect(ex + 2, ey + 7, ew - 4, CELL - 14);
              if (!isNeon) {
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(ex + 2, ey + 7, ew - 4, 4);
              }
              const cabW = CELL - 4;
              const cabX = lane.dir === 1 ? ex + ew - cabW - 2 : ex + 2;
              ctx.fillStyle = sk.truckCab;
              ctx.fillRect(cabX, ey + 5, cabW, CELL - 10);
              ctx.fillStyle = sk.truckWindow;
              ctx.fillRect(cabX + 4, ey + 9, cabW - 8, 10);
              ctx.fillStyle = sk.truckWheel;
              ctx.beginPath();
              ctx.arc(ex + 8, ey + CELL - 9, 5, 0, Math.PI * 2);
              ctx.arc(ex + ew - 8, ey + CELL - 9, 5, 0, Math.PI * 2);
              ctx.fill();
              if (isNeon) {
                ctx.strokeStyle = '#00aaff';
                ctx.lineWidth = 1;
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#00aaff';
                ctx.strokeRect(ex + 2, ey + 7, ew - 4, CELL - 14);
                ctx.shadowBlur = 0;
              }
            }
          } else if (e.type === 'log') {
            if (isNeon && neonCache) {
              ctx.drawImage(neonCache.log.get(e.width)!, ex - P, ey - P);
            } else {
              if (isNeon) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#885522';
              }
              ctx.fillStyle = sk.logBody;
              ctx.fillRect(ex + 1, ey + 7, ew - 2, CELL - 14);
              if (!isNeon) {
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(ex + 1, ey + 7, ew - 2, 4);
              }
              ctx.strokeStyle = sk.logGrain;
              ctx.lineWidth = 1;
              for (let lx = ex + 10; lx < ex + ew - 2; lx += 12) {
                ctx.beginPath();
                ctx.moveTo(lx, ey + 7);
                ctx.lineTo(lx, ey + CELL - 7);
                ctx.stroke();
              }
              ctx.fillStyle = sk.logEnd;
              ctx.beginPath();
              ctx.ellipse(
                ex + 4,
                ey + CELL / 2,
                3,
                (CELL - 14) / 2,
                0,
                0,
                Math.PI * 2,
              );
              ctx.ellipse(
                ex + ew - 4,
                ey + CELL / 2,
                3,
                (CELL - 14) / 2,
                0,
                0,
                Math.PI * 2,
              );
              ctx.fill();
              if (isNeon) ctx.shadowBlur = 0;
            }
          } else if (e.type === 'turtle') {
            ctx.globalAlpha = e.submerged ? 0.28 : 1;
            if (isNeon && neonCache) {
              for (let t = 0; t < e.width; t++) {
                const sx = ex + t * CELL;
                const sprite = e.submerged
                  ? lane.dir === 1
                    ? neonCache.turtleSubmergedRight
                    : neonCache.turtleSubmergedLeft
                  : lane.dir === 1
                    ? neonCache.turtleVisibleRight
                    : neonCache.turtleVisibleLeft;
                ctx.drawImage(sprite, sx - P, ey - P);
              }
            } else {
              for (let t = 0; t < e.width; t++) {
                const tx = ex + t * CELL + CELL / 2;
                const ty = ey + CELL / 2;
                const bodyColor = e.submerged
                  ? sk.turtleBodySub
                  : sk.turtleBody;
                if (isNeon && !e.submerged) {
                  ctx.shadowBlur = 10;
                  ctx.shadowColor = sk.turtleBody;
                }
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.arc(tx, ty, 14, 0, Math.PI * 2);
                ctx.fill();
                if (isNeon) ctx.shadowBlur = 0;
                ctx.strokeStyle = e.submerged
                  ? sk.turtleShellSub
                  : sk.turtleShell;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(tx, ty - 10);
                ctx.lineTo(tx, ty + 10);
                ctx.moveTo(tx - 10, ty);
                ctx.lineTo(tx + 10, ty);
                ctx.stroke();
                ctx.fillStyle = e.submerged ? sk.turtleHeadSub : sk.turtleHead;
                ctx.beginPath();
                ctx.arc(
                  tx + (lane.dir === 1 ? 12 : -12),
                  ty,
                  6,
                  0,
                  Math.PI * 2,
                );
                ctx.fill();
              }
            }
            ctx.globalAlpha = 1;
          }
        }
      }

      // Frog
      if (!gameEnded) {
        const flashOn = !dying || Math.floor(deathTimer / 80) % 2 === 0;
        if (flashOn) {
          let drawCol: number;
          let drawRow: number;
          if (frog.animating) {
            const t = frog.animT / JUMP_MS;
            drawCol = frog.col + (frog.targetCol - frog.col) * t;
            drawRow = frog.row + (frog.targetRow - frog.row) * t;
          } else {
            drawCol = frog.col;
            drawRow = frog.row;
          }

          const fx = (drawCol + 0.5) * CELL;
          const fy = (drawRow + 0.5) * CELL;
          const frogColor = dying ? sk.frogDying : sk.frogBody;

          // Legs during jump
          if (frog.animating) {
            const jumpArc = Math.sin((frog.animT / JUMP_MS) * Math.PI);
            if (isNeon) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = sk.frogLegs;
            }
            ctx.strokeStyle = sk.frogLegs;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(fx - 8, fy + 6);
            ctx.lineTo(fx - 14, fy + 10 + jumpArc * 7);
            ctx.moveTo(fx + 8, fy + 6);
            ctx.lineTo(fx + 14, fy + 10 + jumpArc * 7);
            ctx.moveTo(fx - 6, fy - 6);
            ctx.lineTo(fx - 12, fy - 10 - jumpArc * 5);
            ctx.moveTo(fx + 6, fy - 6);
            ctx.lineTo(fx + 12, fy - 10 - jumpArc * 5);
            ctx.stroke();
            ctx.lineCap = 'butt';
            if (isNeon) ctx.shadowBlur = 0;
          }

          // Body
          if (isNeon) {
            ctx.shadowBlur = 16;
            ctx.shadowColor = frogColor;
          }
          ctx.fillStyle = frogColor;
          ctx.beginPath();
          ctx.ellipse(fx, fy, 14, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          if (isNeon) {
            ctx.shadowBlur = 0;
          }

          // Retro highlight
          if (!isNeon) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath();
            ctx.ellipse(fx, fy - 5, 8, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Eyes
          ctx.fillStyle = sk.frogEyeWhite;
          ctx.beginPath();
          ctx.arc(fx - 6, fy - 5, 5, 0, Math.PI * 2);
          ctx.arc(fx + 6, fy - 5, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = sk.frogEyePupil;
          ctx.beginPath();
          ctx.arc(fx - 5, fy - 5, 2.5, 0, Math.PI * 2);
          ctx.arc(fx + 5, fy - 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // HUD overlay
      ctx.fillStyle = sk.hudBg;
      ctx.fillRect(0, 0, CANVAS_W, 35);

      // Time bar — very top of HUD (y=0..5)
      const maxT = roundTime(level);
      const ratio = Math.max(0, timer / maxT);
      const timerColor =
        ratio > 0.5
          ? sk.hudTimerHigh
          : ratio > 0.25
            ? sk.hudTimerMid
            : sk.hudTimerLow;
      ctx.fillStyle = sk.hudTimerEmpty;
      ctx.fillRect(0, 0, CANVAS_W, 5);
      if (isNeon) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = timerColor;
      }
      ctx.fillStyle = timerColor;
      ctx.fillRect(0, 0, CANVAS_W * ratio, 5);
      if (isNeon) ctx.shadowBlur = 0;

      // Score / level / lives below the time bar (y≈20)
      ctx.font = 'bold 13px monospace';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = sk.hudScore;
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE ${String(score).padStart(6, '0')}`, 8, 20);

      ctx.fillStyle = sk.hudLevel;
      ctx.textAlign = 'center';
      ctx.fillText(`LVL ${String(level).padStart(2, '0')}`, CANVAS_W / 2, 20);

      for (let i = 0; i < 3; i++) {
        if (isNeon && i < lives) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = sk.hudLifeOn;
        }
        ctx.beginPath();
        ctx.arc(CANVAS_W - 20 - i * 22, 20, 7, 0, Math.PI * 2);
        ctx.fillStyle = i < lives ? sk.hudLifeOn : sk.hudLifeOff;
        ctx.fill();
        if (isNeon) ctx.shadowBlur = 0;
      }
    }

    // ── Keyboard ─────────────────────────────────────────────────────────────

    function handleKey(e: KeyboardEvent) {
      if (gameEnded) return;
      const map: Record<string, Direction> = {
        arrowup: 'up',
        w: 'up',
        arrowdown: 'down',
        s: 'down',
        arrowleft: 'left',
        a: 'left',
        arrowright: 'right',
        d: 'right',
      };
      const dir = map[e.key.toLowerCase()];
      if (!dir) return;
      e.preventDefault();
      pendingDir = dir;
    }

    document.addEventListener('keydown', handleKey);

    // ── RAF loop ──────────────────────────────────────────────────────────────

    let rafId: number;
    let lastTime = 0;
    let pauseDrawn = false;

    function loop(time: number) {
      if (!lastTime) lastTime = time;
      const dt = Math.min(time - lastTime, 50);
      lastTime = time;
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

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
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
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ display: 'block', maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}

export default React.memo(FroggerGame);

export type { Direction, Entity, Lane, Frog };
