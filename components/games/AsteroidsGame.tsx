'use client';

import React, { useEffect, useRef } from 'react';

interface AsteroidsGameProps {
  paused: boolean;
  skinKey?: string;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Skin system ───────────────────────────────────────────────────────────────

type Skin = {
  name: string;
  boardBg: string;
  shipStroke: string;
  shipLineWidth: number;
  thrustColor: string;
  asteroidStroke: string;
  asteroidLineWidth: number;
  bulletFill: string;
  bulletRadius: number;
  particleColor: (alpha: number) => string;
  hudColor: string;
  lifeStroke: string;
  shadowBlur: number;
  shadowColor: string;
};

const SKINS: Record<string, Skin> = {
  classic: {
    name: 'Classic',
    // Classic arcade Asteroids: white vectors on black background
    boardBg: '#000000',
    shipStroke: '#ffffff',
    shipLineWidth: 1.5,
    thrustColor: 'rgba(255,130,0,0.85)',
    asteroidStroke: '#ffffff',
    asteroidLineWidth: 1.5,
    bulletFill: '#ffffff',
    bulletRadius: 2,
    particleColor: (a) => `rgba(255,255,255,${a.toFixed(2)})`,
    hudColor: '#ffffff',
    lifeStroke: '#ffffff',
    shadowBlur: 0,
    shadowColor: 'transparent',
  },
  retro: {
    name: 'Retro',
    // CRT phosphor green — saturated solid colors, no glow, subtle highlight
    boardBg: '#0a0a0f',
    shipStroke: '#4dd0e1',
    shipLineWidth: 2,
    thrustColor: 'rgba(255,214,79,0.85)',
    asteroidStroke: '#81c784',
    asteroidLineWidth: 2,
    bulletFill: '#ffd54f',
    bulletRadius: 2.5,
    particleColor: (a) => `rgba(77,208,225,${a.toFixed(2)})`,
    hudColor: '#4dd0e1',
    lifeStroke: '#4dd0e1',
    shadowBlur: 0,
    shadowColor: 'transparent',
  },
  neon: {
    name: 'Neon',
    // Electric neon with shadowBlur glow, pure black board
    boardBg: '#000000',
    shipStroke: '#00ffff',
    shipLineWidth: 1.5,
    thrustColor: '#ff8000',
    asteroidStroke: '#00ff00',
    asteroidLineWidth: 1.5,
    bulletFill: '#ffff00',
    bulletRadius: 2,
    particleColor: (a) => `rgba(255,0,255,${a.toFixed(2)})`,
    hudColor: '#00ffff',
    lifeStroke: '#00ffff',
    shadowBlur: 12,
    shadowColor: '#00ffff',
  },
};

function AsteroidsGame({
  paused,
  skinKey = 'classic',
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: AsteroidsGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs so the game loop always reads the latest prop values without re-running the effect
  const pausedRef = useRef(paused);
  const skinRef = useRef<Skin>(SKINS[skinKey] ?? SKINS.classic);
  const cbScore = useRef(onScoreChange);
  const cbLives = useRef(onLivesChange);
  const cbLevel = useRef(onLevelChange);
  const cbOver = useRef(onGameOver);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    skinRef.current = SKINS[skinKey] ?? SKINS.classic;
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
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 800;
    const H = 600;

    // ── Input ────────────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    function onKeyDown(e: KeyboardEvent) {
      justPressed[e.code] = !keys[e.code];
      keys[e.code] = true;
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
          e.code,
        )
      )
        e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return val;
    }

    // ── Utils ────────────────────────────────────────────────────────────────
    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randInt = (min: number, max: number) =>
      Math.floor(rand(min, max + 1));

    // ── Bullet ───────────────────────────────────────────────────────────────
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      ttl: number;
      radius: number;
      dead: boolean;
      constructor(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        const SPEED = 520;
        this.vx = Math.cos(angle) * SPEED;
        this.vy = Math.sin(angle) * SPEED;
        this.ttl = 1.1;
        this.radius = 2;
        this.dead = false;
      }
      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }
      draw() {
        const skin = skinRef.current;
        ctx.save();
        if (skin.shadowBlur > 0) {
          ctx.shadowBlur = skin.shadowBlur;
          ctx.shadowColor = skin.bulletFill;
        }
        ctx.fillStyle = skin.bulletFill;
        ctx.beginPath();
        ctx.arc(this.x, this.y, skin.bulletRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // ── Asteroid ─────────────────────────────────────────────────────────────
    const RADII = [0, 16, 30, 50];
    const SPEEDS = [0, 85, 55, 32];
    const POINTS = [0, 100, 50, 20];

    class Asteroid {
      x: number;
      y: number;
      size: number;
      radius: number;
      dead: boolean;
      vx: number;
      vy: number;
      rotSpeed: number;
      rot: number;
      verts: [number, number][];
      constructor(x: number, y: number, size = 3) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = RADII[size];
        this.dead = false;
        const angle = rand(0, Math.PI * 2);
        const speed = SPEEDS[size] + rand(-15, 15);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.rotSpeed = rand(-1.2, 1.2);
        this.rot = rand(0, Math.PI * 2);
        const n = randInt(8, 13);
        this.verts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = this.radius * rand(0.6, 1.0);
          this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
      }
      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.rot += this.rotSpeed * dt;
      }
      split(): Asteroid[] {
        if (this.size <= 1) return [];
        return [
          new Asteroid(this.x, this.y, this.size - 1),
          new Asteroid(this.x, this.y, this.size - 1),
        ];
      }
      draw() {
        const skin = skinRef.current;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        if (skin.shadowBlur > 0) {
          ctx.shadowBlur = skin.shadowBlur;
          ctx.shadowColor = skin.asteroidStroke;
        }
        ctx.strokeStyle = skin.asteroidStroke;
        ctx.lineWidth = skin.asteroidLineWidth;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(this.verts[0][0], this.verts[0][1]);
        for (let i = 1; i < this.verts.length; i++)
          ctx.lineTo(this.verts[i][0], this.verts[i][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Ship ─────────────────────────────────────────────────────────────────
    class Ship {
      x!: number;
      y!: number;
      angle!: number;
      vx!: number;
      vy!: number;
      radius!: number;
      thrusting!: boolean;
      invincible!: number;
      shootCooldown!: number;
      dead!: boolean;
      constructor() {
        this.reset();
      }
      reset() {
        this.x = W / 2;
        this.y = H / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.thrusting = false;
        this.invincible = 3;
        this.shootCooldown = 0;
        this.dead = false;
      }
      update(dt: number) {
        if (this.dead) return;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        const ROT = 3.5,
          THRUST = 260,
          DRAG = 0.987;
        if (keys['ArrowLeft']) this.angle -= ROT * dt;
        if (keys['ArrowRight']) this.angle += ROT * dt;
        this.thrusting = !!keys['ArrowUp'];
        if (this.thrusting) {
          this.vx += Math.cos(this.angle) * THRUST * dt;
          this.vy += Math.sin(this.angle) * THRUST * dt;
        }
        this.vx *= DRAG;
        this.vy *= DRAG;
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
      }
      tryShoot(): Bullet[] {
        if (this.shootCooldown > 0 || this.dead) return [];
        this.shootCooldown = 0.2;
        const NOSE = 21;
        const ox = this.x + Math.cos(this.angle) * NOSE;
        const oy = this.y + Math.sin(this.angle) * NOSE;
        return [new Bullet(ox, oy, this.angle)];
      }
      draw() {
        if (this.dead) return;
        if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
          return;
        const skin = skinRef.current;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (skin.shadowBlur > 0) {
          ctx.shadowBlur = skin.shadowBlur;
          ctx.shadowColor = skin.shipStroke;
        }
        ctx.strokeStyle = skin.shipStroke;
        ctx.lineWidth = skin.shipLineWidth;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-12, -9);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-12, 9);
        ctx.closePath();
        ctx.stroke();
        if (this.thrusting && Math.random() > 0.35) {
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.lineTo(-8 - rand(6, 14), 0);
          ctx.lineTo(-8, 4);
          ctx.strokeStyle = skin.thrustColor;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── Particle ─────────────────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      ttl: number;
      dead: boolean;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(30, 130);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = rand(0.4, 1.1);
        this.ttl = this.life;
        this.dead = false;
      }
      update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }
      draw() {
        const skin = skinRef.current;
        const alpha = this.ttl / this.life;
        ctx.strokeStyle = skin.particleColor(alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.stroke();
      }
    }

    // ── Game state ───────────────────────────────────────────────────────────
    let ship: Ship,
      bullets: Bullet[],
      asteroids: Asteroid[],
      particles: Particle[];
    let score: number, lives: number, level: number;
    let state: 'playing' | 'dead' | 'gameover';
    let deadTimer: number;
    let gameOverFired = false;

    // Previous values to avoid spamming callbacks
    let prevScore = -1,
      prevLives = -1,
      prevLevel = -1;

    function spawnAsteroids(count: number) {
      const SAFE_DIST = 130;
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        do {
          x = rand(0, W);
          y = rand(0, H);
        } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
        asteroids.push(new Asteroid(x, y, 3));
      }
    }

    function initGame() {
      ship = new Ship();
      bullets = [];
      asteroids = [];
      particles = [];
      score = 0;
      lives = 3;
      level = 1;
      state = 'playing';
      gameOverFired = false;
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
      spawnAsteroids(4);
    }

    function nextLevel() {
      level++;
      bullets = [];
      particles = [];
      ship.reset();
      spawnAsteroids(3 + level);
    }

    function explode(x: number, y: number, count = 8) {
      for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
    }

    function killShip() {
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives--;
      if (lives <= 0) {
        state = 'gameover';
      } else {
        state = 'dead';
        deadTimer = 2;
      }
    }

    // ── Update ───────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (state === 'gameover') {
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }

      if (state === 'dead') {
        deadTimer -= dt;
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        asteroids.forEach((a) => a.update(dt));
        if (deadTimer <= 0) {
          state = 'playing';
          ship.reset();
        }
        return;
      }

      if (pressed('Space')) bullets.push(...ship.tryShoot());

      ship.update(dt);
      bullets.forEach((b) => b.update(dt));
      asteroids.forEach((a) => a.update(dt));
      particles.forEach((p) => p.update(dt));

      bullets = bullets.filter((b) => !b.dead);
      particles = particles.filter((p) => !p.dead);

      const newAsteroids: Asteroid[] = [];
      for (const b of bullets) {
        for (const a of asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            score += POINTS[a.size];
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
          }
        }
      }
      asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
      bullets = bullets.filter((b) => !b.dead);

      if (ship.invincible <= 0) {
        for (const a of asteroids) {
          if (dist(ship, a) < ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }

      if (asteroids.length === 0) nextLevel();
    }

    // ── Draw ─────────────────────────────────────────────────────────────────
    function drawLifeIcon(x: number, y: number) {
      const skin = skinRef.current;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      if (skin.shadowBlur > 0) {
        ctx.shadowBlur = skin.shadowBlur * 0.6;
        ctx.shadowColor = skin.lifeStroke;
      }
      ctx.strokeStyle = skin.lifeStroke;
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function drawHUD() {
      const skin = skinRef.current;
      ctx.fillStyle = skin.hudColor;
      ctx.font = '15px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE  ${score}`, 14, 26);
      ctx.textAlign = 'center';
      ctx.fillText(`NIVEL ${level}`, W / 2, 26);
      for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
    }

    function draw() {
      const skin = skinRef.current;
      ctx.fillStyle = skin.boardBg;
      ctx.fillRect(0, 0, W, H);
      particles.forEach((p) => p.draw());
      asteroids.forEach((a) => a.draw());
      bullets.forEach((b) => b.draw());
      ship.draw();
      drawHUD();
      // GAME OVER overlay removed — React modal handles it
    }

    // ── Loop ─────────────────────────────────────────────────────────────────
    let rafId: number;
    let lastTime: number | null = null;
    let pauseDrawn = false;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;

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

      // Notify React of state changes
      if (score !== prevScore) {
        cbScore.current(score);
        prevScore = score;
      }
      if (lives !== prevLives) {
        cbLives.current(lives);
        prevLives = lives;
      }
      if (level !== prevLevel) {
        cbLevel.current(level);
        prevLevel = level;
      }
      if (state === 'gameover' && !gameOverFired) {
        gameOverFired = true;
        cbOver.current(score);
      }

      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
}

export default React.memo(AsteroidsGame);
