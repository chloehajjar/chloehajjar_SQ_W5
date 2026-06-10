// ============================================================
// Week 5 Example 3 — Maze with Animated Character and Stars
// ============================================================
// Updated version featuring:
//   - New Avatar Sprite Sheet Configuration
//   - Golden Star Collectibles (Replacing Coins)
//   - A hardcoded maze drawn with shapes
//   - Wall collision and exit unlock mechanics
// ============================================================

// ------------------------------------------------------------
// SPRITE CONFIGURATION — Walking Character
// Updated for your new avatar. Adjust these dimensions/rows
// to match your specific new sprite sheet layout.
// ------------------------------------------------------------
const SPRITE = {
  frameWidth: 75, // Change to your new avatar's frame width
  frameHeight: 150, // Change to your new avatar's frame height
  numFrames: 4, // Number of frames in your walking loops
  animSpeed: 20, // Animation playback speed
  scale: 0.5, // Scale factor on screen
  rows: {
    down: 0, // Row index for facing down
    up: 1, // Row index for facing up
    right: 2, // Row index for facing right
    left: 3, // Row index for facing left
  },
  offsets: {
    down: { x: 0, y: 0 },
    up: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    left: { x: 0, y: 0 },
  },
};

// ------------------------------------------------------------
// STAR CONFIGURATION
// Updated for the new horizontal golden star sprite sheet.
// ------------------------------------------------------------
const STAR = {
  frameWidth: 64, // Adjusted for a typical 64x64 star asset
  frameHeight: 64,
  numFrames: 6, // Adjusted for a 6-frame spinning cycle
  animSpeed: 6,
  scale: 0.6, // Scaled down to fit nicely inside 50px tiles
};

// ------------------------------------------------------------
// MAZE CONFIGURATION
// Tile values: 0=floor, 1=wall, 2=start, 3=star, 4=exit
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
  0: [40, 40, 50], // floor — dark grey
  1: [80, 60, 100], // wall  — purple-grey
  2: [40, 40, 50], // start — same as floor
  3: [40, 40, 50], // star  — same as floor (star drawn on top)
  4: [60, 100, 80], // exit  — green tint when locked
};

// ------------------------------------------------------------
// PLAYER STATE
// ------------------------------------------------------------
let player = {
  x: 0,
  y: 0,
  speed: 2,

  currentFrame: 0,
  frameTimer: 0,
  direction: "down",
  isMoving: false,

  // Hitbox parameters: Adjust these if your new avatar clips into walls
  hw: 12,
  hh: 12,
};

// ------------------------------------------------------------
// COLLECTIBLES & GAME STATE
// ------------------------------------------------------------
let stars = [];
let starsCollected = 0;
let gameWon = false;

// Images
let characterSheet;
let starSheet;

// ============================================================
// preload()
// ============================================================
function preload() {
  // Loaded your new updated images here
  characterSheet = loadImage("assets/images/your_new_avatar.png");
  starSheet = loadImage("assets/images/golden_star.png");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(TILE_SIZE * MAZE[0].length, TILE_SIZE * MAZE.length);
  imageMode(CENTER);

  // Scan maze for start position and star locations
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 2) {
        player.x = col * TILE_SIZE + TILE_SIZE / 2;
        player.y = row * TILE_SIZE + TILE_SIZE / 2;
      }

      if (tile === 3) {
        stars.push({
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2,
          frame: floor(random(STAR.numFrames)), // Desynchronize spins
          frameTimer: 0,
          collected: false,
        });
      }
    }
  }
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  drawMaze();
  updateStars();
  drawStars();
  handleInput();
  resolveWallCollisions();
  checkStarCollection();
  checkExit();
  animateSprite();
  drawCharacter();
  drawHUD();

  if (gameWon) {
    drawWinScreen();
  }
}

// ------------------------------------------------------------
// SYSTEMS & RENDERING FUNCTIONS
// ------------------------------------------------------------

function drawMaze() {
  rectMode(CORNER);
  noStroke();

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      let tile = MAZE[row][col];

      if (tile === 4) {
        if (starsCollected === stars.length) {
          fill(30, 200, 120); // bright green — open
        } else {
          fill(60, 100, 80); // dim green — locked
        }
      } else {
        let c = TILE_COLORS[tile];
        fill(c[0], c[1], c[2]);
      }

      rect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}

function updateStars() {
  for (let i = 0; i < stars.length; i++) {
    if (stars[i].collected) continue;

    stars[i].frameTimer++;
    if (stars[i].frameTimer >= STAR.animSpeed) {
      stars[i].frameTimer = 0;
      stars[i].frame = (stars[i].frame + 1) % STAR.numFrames;
    }
  }
}

function drawStars() {
  for (let i = 0; i < stars.length; i++) {
    if (stars[i].collected) continue;

    let star = stars[i];
    let sx = star.frame * STAR.frameWidth;
    let dw = STAR.frameWidth * STAR.scale;
    let dh = STAR.frameHeight * STAR.scale;

    image(
      starSheet,
      star.x,
      star.y,
      dw,
      dh,
      sx,
      0,
      STAR.frameWidth,
      STAR.frameHeight,
    );
  }
}

function handleInput() {
  if (gameWon) return;

  player.isMoving = false;

  if (keyIsDown(87)) {
    // W — up
    player.y -= player.speed;
    player.direction = "up";
    player.isMoving = true;
  }
  if (keyIsDown(83)) {
    // S — down
    player.y += player.speed;
    player.direction = "down";
    player.isMoving = true;
  }
  if (keyIsDown(65)) {
    // A — left
    player.x -= player.speed;
    player.direction = "left";
    player.isMoving = true;
  }
  if (keyIsDown(68)) {
    // D — right
    player.x += player.speed;
    player.direction = "right";
    player.isMoving = true;
  }
}

function resolveWallCollisions() {
  let corners = [
    { x: player.x - player.hw, y: player.y - player.hh }, // top left
    { x: player.x + player.hw, y: player.y - player.hh }, // top right
    { x: player.x - player.hw, y: player.y + player.hh }, // bottom left
    { x: player.x + player.hw, y: player.y + player.hh }, // bottom right
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

function checkStarCollection() {
  for (let i = 0; i < stars.length; i++) {
    if (stars[i].collected) continue;

    let d = dist(player.x, player.y, stars[i].x, stars[i].y);
    if (d < TILE_SIZE * 0.6) {
      stars[i].collected = true;
      starsCollected++;
    }
  }
}

function checkExit() {
  if (starsCollected < stars.length) return;

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
  text("Stars: " + starsCollected + " / " + stars.length, 10, 20);

  if (starsCollected === stars.length) {
    fill(30, 200, 120);
    text("Exit is open! Find the green tile.", 10, 40);
  }
}

function drawWinScreen() {
  fill(0, 0, 0, 160);
  rectMode(CORNER);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textSize(48);
  text("You Escaped!", width / 2, height / 2 - 20);

  textSize(16);
  fill(180);
  text("All stars collected", width / 2, height / 2 + 20);
}
