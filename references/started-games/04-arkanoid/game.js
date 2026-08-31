const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCK_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'];
const BLOCKS_ORIGIN_X = (800 - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

const paddle = { x: 0, y: 560, w: 81, h: 14 };
const ball   = { x: 0, y: 0, w: 16, h: 16, vx: 200, vy: -300 };

const bounceSound = new Audio('assets/sounds/ball-bounce.mp3');
const breakSound  = new Audio('assets/sounds/break-sound.mp3');

let blocks = [];
let explosions = [];
let lives = 3;
let score = 0;
let gameState = 'playing';
let currentLevel = 1;
let isPaused = false;

const keys = { ArrowLeft: false, ArrowRight: false };

function initPaddle() {
  paddle.x = (canvas.width - paddle.w) / 2;
}

function initBall() {
  const speed = LEVELS[currentLevel - 1].speed;
  ball.x = paddle.x + (paddle.w - ball.w) / 2;
  ball.y = paddle.y - ball.h;
  ball.vx = BASE_BALL_VX * speed;
  ball.vy = BASE_BALL_VY * speed;
}

function loadLevel(n) {
  currentLevel = n;
  const level = LEVELS[n - 1];
  blocks = level.blocks.map(b => ({
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

function collideAABB(block) {
  return (
    ball.x < block.x + block.w &&
    ball.x + ball.w > block.x &&
    ball.y < block.y + block.h &&
    ball.y + ball.h > block.y
  );
}

canvas.addEventListener('click', (e) => {
  if (!isPaused) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  for (let i = 0; i < 5; i++) {
    const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
    if (mx >= bx && mx <= bx + PAUSE_BTN_W && my >= PAUSE_BTN_Y && my <= PAUSE_BTN_Y + PAUSE_BTN_H) {
      loadLevel(i + 1);
      isPaused = false;
      return;
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const mouseX = (e.clientX - rect.left) * scaleX;
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, mouseX - paddle.w / 2));
});

document.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
  if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && gameState === 'playing') {
    isPaused = !isPaused;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function update(dt) {
  if (gameState !== 'playing') return;

  // Paddle
  if (keys.ArrowLeft)  paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
  if (keys.ArrowRight) paddle.x = Math.min(canvas.width - paddle.w, paddle.x + PADDLE_SPEED * dt);

  // Ball movement
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Wall bounces (left, right, top)
  if (ball.x <= 0) { ball.x = 0; ball.vx = Math.abs(ball.vx); bounceSound.cloneNode().play(); }
  if (ball.x + ball.w >= canvas.width) { ball.x = canvas.width - ball.w; ball.vx = -Math.abs(ball.vx); bounceSound.cloneNode().play(); }
  if (ball.y <= 0) { ball.y = 0; ball.vy = Math.abs(ball.vy); bounceSound.cloneNode().play(); }

  // Paddle bounce
  if (
    ball.vy > 0 &&
    ball.x + ball.w > paddle.x &&
    ball.x < paddle.x + paddle.w &&
    ball.y + ball.h >= paddle.y &&
    ball.y + ball.h <= paddle.y + paddle.h + 8
  ) {
    ball.y = paddle.y - ball.h;
    ball.vy = -Math.abs(ball.vy);
    bounceSound.cloneNode().play();
  }

  // Block collisions
  for (const block of blocks) {
    if (!block.alive) continue;
    if (collideAABB(block)) {
      block.alive = false;
      explosions.push({ x: block.x, y: block.y, w: block.w, h: block.h, color: block.color, elapsed: 0 });
      score += 10;
      ball.vy = -ball.vy;
      breakSound.cloneNode().play();
      if (blocks.every(b => !b.alive)) {
        if (currentLevel < 5) loadLevel(currentLevel + 1);
        else gameState = 'win';
      }
      break; // one block per frame
    }
  }

  // Explosions
  for (const exp of explosions) exp.elapsed += dt * 1000;
  explosions = explosions.filter(exp => exp.elapsed < EXPLOSION_DURATION);

  // Ball lost
  if (ball.y > canvas.height) {
    lives--;
    if (lives <= 0) {
      lives = 0;
      gameState = 'gameover';
    } else {
      initBall();
    }
  }
}

function drawOverlay(message) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

const PAUSE_BTN_W = 60;
const PAUSE_BTN_H = 40;
const PAUSE_BTN_GAP = 12;
const PAUSE_BTN_Y = 340;
const PAUSE_BTN_ROW_X = (canvas.width - (5 * PAUSE_BTN_W + 4 * PAUSE_BTN_GAP)) / 2;

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSA', canvas.width / 2, 260);

  ctx.font = 'bold 16px monospace';
  ctx.fillText('Saltar al nivel:', canvas.width / 2, 310);

  for (let i = 0; i < 5; i++) {
    const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
    const isActive = (i + 1) === currentLevel;
    ctx.fillStyle = isActive ? '#f0c040' : '#444';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, PAUSE_BTN_Y, PAUSE_BTN_W, PAUSE_BTN_H, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isActive ? '#000' : '#fff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, bx + PAUSE_BTN_W / 2, PAUSE_BTN_Y + PAUSE_BTN_H / 2);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const block of blocks) {
    if (block.alive) drawSprite(ctx, 'block_' + block.color, block.x, block.y, block.w, block.h);
  }

  for (const exp of explosions) {
    const frameIndex = Math.min(Math.floor(exp.elapsed / EXPLOSION_DURATION * 4), 3);
    drawFrame(ctx, EXPLOSION_FRAMES[exp.color][frameIndex], exp.x, exp.y, exp.w, exp.h);
  }

  drawSprite(ctx, 'paddle', paddle.x, paddle.y, paddle.w, paddle.h);
  drawSprite(ctx, 'ball', ball.x, ball.y, ball.w, ball.h);

  if (gameState === 'playing') {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Score: ' + score, 10, 10);
    ctx.textAlign = 'center';
    ctx.fillText('Nivel: ' + currentLevel, canvas.width / 2, 10);
    const ballSize = 16;
    const ballSpacing = 4;
    for (let i = 0; i < lives; i++) {
      const bx = canvas.width - 10 - (lives - i) * (ballSize + ballSpacing);
      drawSprite(ctx, 'ball', bx, 10, ballSize, ballSize);
    }
  }

  if (gameState === 'gameover') drawOverlay('GAME OVER');
  if (gameState === 'win')      drawOverlay('¡Completaste el juego!');
  if (isPaused)                 drawPauseOverlay();
}

let lastTime = null;

function loop(timestamp) {
  if (lastTime === null) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  if (!isPaused) update(dt);
  draw();

  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  initPaddle();
  loadLevel(1);
  requestAnimationFrame(loop);
});
