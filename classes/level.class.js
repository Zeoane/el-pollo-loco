// classes/level.class.js

/**
 * Represents a game level with background objects, enemies and clouds.
 */
class Level {
  /**
   * @param {any[]} bg - Background objects for the level
   * @param {any[]} enemies - Enemy instances
   * @param {any[]} clouds - Cloud sprites or entities
   */
  constructor(bg = [], enemies = [], clouds = []) {
    this.backgroundObjects = bg;
    this.opponents = enemies;
    this.clouds = clouds;
  }
}

/**
 * Creates a background layer object.
 * @param {string} folder - Folder name inside background layers
 * @param {number} flow - Horizontal flow speed
 * @param {number} parallax - Parallax factor (0..1)
 * @param {number} [y=0] - Vertical offset
 * @param {number|null} [h=null] - Optional fixed height
 * @returns {BackgroundObject}
 */
function mkLayer(folder, flow, parallax, y = 0, h = null) {
  return new BackgroundObject(
    `img/5_background/layers/${folder}`,
    y,
    h,
    flow,
    parallax
  );
}

/**
 * Builds the background layers for the level.
 * @returns {any[]} Array of background objects
 */
function buildBackground() {
  return [
    new SkyLayer("img/5_background/layers/air.png", 0.0),
    new CloudLayer("img/5_background/layers/4_clouds", 0, null, 0.4, 0.05),
    mkLayer("3_third_layer", 0.05, 0.15),
    mkLayer("2_second_layer", 0.08, 0.3),
    mkLayer("1_first_layer", 0.1, 0.5),
  ];
}

/**
 * Builds enemy instances for the level.
 * @param {number} [n=3] - Number of enemies
 * @param {number} [startX=500] - Starting x position
 * @returns {any[]} Array of enemy objects
 */
function buildOpponents(n = 3, startX = 500) {
  const arr = [];
  let x = startX;

  for (let i = 0; i < n; i++) {
    const c = new Chicken();
    c.width = 70;
    c.height = 70;
    c.speed = 1.1 + Math.random() * 0.6;
    c.x = x;
    arr.push(c);
    x += 280 + Math.random() * 420;
  }

  return arr;
}

/**
 * Builds cloud sprite entities for the level.
 * @returns {any[]} Array of cloud objects
 */
function buildCloudSprites() {
  return [];
}

/**
 * Creates level 1 instance.
 * @returns {Level}
 */
function createLevel1() {
  return new Level(buildBackground(), buildOpponents(), buildCloudSprites());
}

/**
 * Configuration object for level 1.
 */
const LEVEL1 = {
  lengthPx: 5200,
  bossAtPx: 3800,
  phase2AtMs: 20_000,
  bossAtMs: 40_000,
  player: {
    speed: 3.3,
    jumpVy: -12,
    health: 3,
    bottlesMax: 6,
  },
  enemies: {
    chickens: 6,
    gapMin: 260,
    gapMax: 520,
    speedMin: 1.1,
    speedMax: 1.7,
    smallSpeedMin: 0.8,
    smallSpeedMax: 1.3,
  },
  items: {
    coins: 20,
    bottles: 6,
  },
  cloudsFlow: 0.4,
};

window.LEVEL1 = LEVEL1;
window.createLevel1 = createLevel1;


