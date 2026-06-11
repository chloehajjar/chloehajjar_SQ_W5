// ============================================================
// Week 5 — Prince Charming Maze!
// ============================================================
const SPRITE = {
  frameWidth: 75, // Width of a single character animation slice
  frameHeight: 150, // Height of a single character animation slice
  numFrames: 4, // Active frames per directional strip
  animSpeed: 20, // Render loop frames per step (higher = slower)
  scale: 0.4, // Scaled down safely to negotiate 50px corridors

  rows: {
    down: 0,
    up: 1,
    right: 2,
    left: 3,
  },

  offsets: {
    down: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    right: { x: 0, y: 10 },
    left: { x: 0, y: 20 },
  },
};

// ------------------------------------------------------------
// COIN CONFIGURATION — Blue Coin
// ------------------------------------------------------------
const COIN = {
  frameWidth: 32, // 256px wide sheet / 8 frames
  frameHeight: 32, // Single row height boundary
  numFrames: 8, // Full rotation cycle frame count
  animSpeed: 6, // Rotational update frequency (lower = faster)
  scale: 1.2, // Scaled to fit comfortably inside a tile
};

// ------------------------------------------------------------
// MAZE GRID SETUP
// 0 = Walkable Floor | 1 = Solid Wall | 2 = Player Spawn
// 3 = Blue Coin Node | 4 = Locked Exit Gateway
// ------------------------------------------------------------
const TILE_SIZE = 50;

const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 3, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 4, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const TILE_COLORS = {
  0: [40, 40, 50], // Floor
  1: [173, 216, 230], // Light-blue maze walls
  2: [40, 40, 50], // Floor color beneath spawn
  3: [40, 40, 50], // Floor color beneath items
  4: [60, 100, 80], // Exit color when locked
};

// ------------------------------------------------------------
// ENTITY VARIABLES
// ------------------------------------------------------------
let player = {
  x: 0,
  y: 0,
  speed: 2.5,

  currentFrame: 0,
  frameTimer: 0,
  direction: "down",
  isMoving: false,

  // Tighter collision mask dimensions to optimize turning in corridors
  hw: 12,
  hh: 12,
};

let coins = [];
let coinsCollected = 0;
let gameWon = false;

let characterSheet;
let coinSheet;

// ============================================================
// RUNTIME FUNCTIONS
// ============================================================

function preload() {
  characterSheet = loadImage("assets/images/prince_charming.png");
  coinSheet = loadImage("assets/images/blue_coin.png");
}

function setup() {
  createCanvas(TILE_SIZE * MAZE[0].length, TILE_SIZE * MAZE.length);
  imageMode(CENTER);

  // Parse maze layout array to assign spawning spots and build object lists
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 2) {
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }

      if (tile === 3) {
        coins.push({
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2,
          frame: floor(random(COIN.numFrames)), // Desynchronizes coin spins
          frameTimer: 0,
          collected: false,
        });
      }
    }
  }
}

function draw() {
  background(20);

  drawMaze();
  updateCoins();
  drawCoins();
  handleInput();
  resolveWallCollisions();
  checkCoinCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawHUD();

  if (gameWon) {
    drawWinScreen();
  }
}

// ------------------------------------------------------------
// MAZE & COIN LOGIC
// ------------------------------------------------------------

function drawMaze() {
  rectMode(CORNER);
  noStroke();

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 4) {
        if (coinsCollected === coins.length) {
          fill(30, 200, 120); // Bright green open state
        } else {
          fill(255, 255, 224); // Light yellow locked state
        }
      } else {
        let c = TILE_COLORS[tile];
        fill(c[0], c[1], c[2]);
      }

      rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function updateCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    coins[i].frameTimer++;
    if (coins[i].frameTimer >= COIN.animSpeed) {
      coins[i].frameTimer = 0;
      coins[i].frame = (coins[i].frame + 1) % COIN.numFrames;
    }
  }
}

function drawCoins() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    let coin = coins[i];

    let sx = coin.frame * COIN.frameWidth;
    let dw = COIN.frameWidth * COIN.scale;
    let dh = COIN.frameHeight * COIN.scale;

    image(
      coinSheet,
      coin.x,
      coin.y,
      dw,
      dh,
      sx,
      0,
      COIN.frameWidth,
      COIN.frameHeight,
    );
  }
}

// ------------------------------------------------------------
// PLAYER CONTROLS & PHYSICS
// ------------------------------------------------------------

function handleInput() {
  if (gameWon) return;

  player.isMoving = false;

  if (keyIsDown(87)) {
    // W — Up
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(83)) {
    // S — Down
    player.y += player.speed;
    player.direction = "down";
    player.isMoving = true;
  }
  if (keyIsDown(65)) {
    // A — Left
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    // D — Right
    player.x += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
}

function resolveWallCollisions() {
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh }, // Top-Left
    { x: player.x + player.hw, y: player.y - player.hh }, // Top-Right
    { x: player.x - player.hw, y: player.y + player.hh }, // Bottom-Left
    { x: player.x + player.hw, y: player.y + player.hh }, // Bottom-Right
  ];

  for (let i = 0; i < corners.length; i++) {
    let c = corners[i];
    let col = floor(c.x / TILE_SIZE);
    let row = floor(c.y / TILE_SIZE);

    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length)
      continue;

    if (MAZE[row][col] === 1) {
      let tileLeft = col * TILE_SIZE;
      let tileRight = tileLeft + TILE_SIZE;
      let tileTop = row * TILE_SIZE;
      let tileBottom = tileTop + TILE_SIZE;

      let overlapLeft = player.x + player.hw - tileLeft;
      let overlapRight = tileRight - (player.x - player.hw);
      let overlapTop = player.y + player.hh - tileTop;
      let overlapBottom = tileBottom - (player.y - player.hh);

      let minOverlap = min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom,
      );

      if (minOverlap === overlapLeft) player.x -= overlapLeft;
      else if (minOverlap === overlapRight) player.x += overlapRight;
      else if (minOverlap === overlapTop) player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }
}

function checkCoinCollection() {
  for (let i = 0; i < coins.length; i++) {
    if (coins[i].collected) continue;

    let d = dist(player.x, player.y, coins[i].x, coins[i].y);
    if (d < TILE_SIZE * 0.6) {
      coins[i].collected = true;
      coinsCollected++;
    }
  }
}

function checkExit() {
  if (coinsCollected < coins.length) return;

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      if (MAZE[row][col] === 4) {
        let exitX = col * TILE_SIZE + TILE_SIZE / 2;
        let exitY = row * TILE_SIZE + TILE_SIZE / 2;
        if (dist(player.x, player.y, exitX, exitY) < TILE_SIZE * 0.6) {
          gameWon = true;
        }
      }
    }
  }
}

// ------------------------------------------------------------
// RENDER & ANIMATION RENDERING
// ------------------------------------------------------------

function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;

    if (player.frameTimer >= SPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % SPRITE.numFrames;
    }
  } else {
    player.currentFrame = 0;
    player.frameTimer = 0;
  }
}

function drawCharacter() {
  let row = SPRITE.rows[player.direction];
  let offset = SPRITE.offsets[player.direction];

  let sx = player.currentFrame * SPRITE.frameWidth + offset.x;
  let sy = row * SPRITE.frameHeight + offset.y;

  let dw = SPRITE.frameWidth * SPRITE.scale;
  let dh = SPRITE.frameHeight * SPRITE.scale;

  image(
    characterSheet,
    player.x,
    player.y,
    dw,
    dh,
    sx,
    sy,
    SPRITE.frameWidth,
    SPRITE.frameHeight,
  );
}

function drawHUD() {
  noStroke();
  fill(255);
  textSize(14);
  textAlign(LEFT);
  textFont("monospace");
  text("Blue Coins: " + coinsCollected + " / " + coins.length, 10, 20);

  if (coinsCollected === coins.length) {
    fill(30, 200, 120);
    text("Gateway Unlocked! Locate the green clearing.", 10, 40);
  }
}

function drawWinScreen() {
  fill(0, 0, 0, 160);
  rectMode(CORNER);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textSize(48);
  text("Stage Cleared!", width / 2, height / 2 - 20);

  textSize(16);
  fill(180);
  text("Prince Charming escaped safely.", width / 2, height / 2 + 20);
}
