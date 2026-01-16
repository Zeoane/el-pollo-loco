// classes/level.class.js
class Level {
  constructor(bg = [], enemies = [], clouds = []) {
    this.backgroundObjects = bg;
    this.opponents = enemies;
    this.clouds = clouds;
  }
}

function mkLayer(folder, flow, parallax, y=0, h=null) {
  return new BackgroundObject(`img/5_background/layers/${folder}`, y, h, flow, parallax);
}

function buildBackground() {
  return [
    new SkyLayer('img/5_background/layers/air.png', 0.00),
    new CloudLayer('img/5_background/layers/4_clouds', 0, null, 0.4, 0.05), 
    mkLayer('3_third_layer',  0.05, 0.15),
    mkLayer('2_second_layer', 0.08, 0.30),
    mkLayer('1_first_layer',  0.10, 0.50), 
  ];
}

function buildOpponents(n = 3, startX = 500) {
  const arr = []; let x = startX;
  for (let i = 0; i < n; i++) {
    const c = new Chicken();
    c.width = 70; c.height = 70; c.speed = 1.6 + Math.random() * 0.8;
    c.x = x; arr.push(c); x += 280 + Math.random() * 420;
  }
  return arr;
}

function buildCloudSprites() { return []; }

function createLevel1() {
  return new Level(buildBackground(), buildOpponents(), buildCloudSprites());
}

const LEVEL1 = {
  lengthPx: 5200,          
  bossAtPx: 3800,         
  player: { speed: 3.0, jumpVy: -12, health: 3, bottlesMax: 6 },
  enemies: { chickens: 6, gapMin: 260, gapMax: 520, speedMin: 1.4, speedMax: 2.4 },
  items: { coins: 20, bottles: 6 }, 
  cloudsFlow: 0.4,
};
window.LEVEL1 = LEVEL1;
window.createLevel1 = createLevel1;

