// world.class.js
class World {
  canvas; ctx; character; opponents = []; backgroundObjects = []; clouds = [];
  cameraX = 0; gravity = 0.6; groundY = 432; lastTime = performance.now();
  keyboard = null; jumpLock = false; distanceX = 0; bossSpawned = false;
  coins = []; bottles = []; inventory = { coins:0, bottles:0 }; projectiles = [];
  cfg = {};

  constructor(canvas, keyboard, level) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.keyboard = keyboard||null;
    this.cfg = level?.config || window.LEVEL1 || {};
    this.character = new Character().setGround?.(this.groundY).placeOnGround?.();

    const L = level || createLevel1?.() || { backgroundObjects: BackgroundLayers.defaultSet(), opponents: [], clouds: [] };
    this.backgroundObjects = L.backgroundObjects; this.opponents = L.opponents; this.clouds = L.clouds;

    this.initOpponents(); this.spawnChickens(); this.spawnPickups();
    this.hud = window.HUD ? new HUD() : null;

    this.startBgMusic();          
    this.animate();
  }

  startBgMusic() {
    try { SFX.stop?.('bg'); SFX.loop?.('bg','bg',{ vol:0.5 }); } catch {}
  }

  initOpponents() { this.opponents.forEach(o => o.setGround?.(this.groundY).placeOnGround?.()); }

  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime); this.lastTime = now;
    this.update(dtMs); this.draw(); requestAnimationFrame(this.animate);
  };


  update(dtMs) {
    this.handleInput(dtMs); this.applyPhysics(); this.handleGround();
    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    this.character.updateWalkAnimation?.(dtMs, moving);
    this.updateCamera(moving); this.updateClouds(); this.updateBackgrounds(dtMs, moving);
    this.updateOpponents(); this.distanceX = Math.max(this.distanceX, this.character.x);
    this.maybeSpawnBoss(); this.updateProjectiles(dtMs); this.checkPickups(); this.handleThrow();
  }

  handleInput(dtMs) {
    const run = this.cfg.player?.speed ?? 3.0;
    if (this.keyboard?.RIGHT) { this.character.stepRight?.(dtMs); this.character.facing = 1; }
    if (this.keyboard?.LEFT)  { this.character.stepLeft?.(dtMs);  this.character.facing = -1; }
    if (!this.jumpLock && (this.keyboard?.SPACE || this.keyboard?.UP) && this.character.onGround) {
      this.character.vy = this.cfg.player?.jumpVy ?? -12; this.character.onGround = false; this.jumpLock = true;
    }
    if (!this.keyboard?.SPACE && !this.keyboard?.UP) this.jumpLock = false;
  }

  applyPhysics() { this.character.vy += this.gravity; this.character.x += this.character.vx||0; this.character.y += this.character.vy||0; }

  handleGround() {
    if (this.character.y + this.character.height >= this.groundY) {
      this.character.y = this.groundY - this.character.height; this.character.vy = 0; this.character.onGround = true;
    }
    if (this.character.x < 0) this.character.x = 0;
  }

  updateCamera(moving) {
    const target = this.character.x - this.canvas.width * 0.4;
    this.cameraX = moving ? this.cameraX + (target - this.cameraX) * 0.1 : target;
  }

  updateClouds() { this.clouds.forEach(c => c.update?.(this.canvas.width)); }

  updateBackgrounds(dtMs, moving) { this.backgroundObjects.forEach(bo => bo.update(this.cameraX, this.canvas, dtMs, moving)); }

  updateOpponents() {
    const left = this.cameraX - 150, ahead = this.cameraX + this.canvas.width + 200;
    const far = Math.max(0, ...this.opponents.map(op => op.x||0));
    this.opponents.forEach(o => {
      o.x -= o.speed ?? 0; this.placeOnGround(o);
      if (o.x + o.width < left) { const gap = 260 + Math.random()*460; o.x = Math.max(ahead, far + gap); o.speed = 1.6 + Math.random()*0.8; }
    });
    this.opponents = this.opponents.filter(o => !o._dead);
  }

handleThrow() {
  if (this.keyboard?.F && (this.inventory.bottles||0) > 0 && !this.throwLock) {
    const dir = (this.character.facing===-1)? -1 : 1;
    const p = new Projectile(this.character.x + this.character.width/2, this.character.y + 20, dir);
    this.projectiles.push(p); this.inventory.bottles--; this.throwLock = true;
    SFX.play?.('throw', { vol: 0.8 });
  }
  if (!this.keyboard?.F) this.throwLock = false;
}

updateProjectiles(dtMs) {
  this.projectiles.forEach(p => p.update(dtMs/16));
  this.projectiles = this.projectiles.filter(p => {
    const hit = this.opponents.find(o => AABB(p,o));
    if (hit) {
      hit.hp = (hit.hp||3) - 1;
      SFX.play?.('hit', { vol: 0.9 });
      if (hit.hp <= 0) hit._dead = true;
      return false; 
    }
    return p.y < this.canvas.height;
  });
  this.opponents = this.opponents.filter(o => !o._dead);
}

checkPickups() {
  this.coins = this.coins.filter(c => {
    if (AABB(this.character,c)) { this.inventory.coins++; SFX.play?.('coin', { vol: 0.8 }); return false; }
    return true;
  });
  this.bottles = this.bottles.filter(b => {
    if (AABB(this.character,b)) { this.inventory.bottles++; SFX.play?.('bottle', { vol: 0.8 }); return false; }
    return true;
  });
}

  spawnChickens() {
    const c = this.cfg.enemies || {}; let x = (this.character.x||0) + 500;
    for (let i=0;i<(c.chickens||3);i++){ const h=new Chicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed = (c.speedMin??1.4) + Math.random()*((c.speedMax??2.4)-(c.speedMin??1.4));
      h.x = x; this.opponents.push(h);
      x += (c.gapMin??260) + Math.random()*((c.gapMax??520)-(c.gapMin??260));
    }
  }

  spawnPickups() {
    const it = this.cfg.items||{};
    for (let i=0;i<(it.coins||0);i++)   this.coins.push(Coin.rand(this));
    for (let i=0;i<(it.bottles||0);i++) this.bottles.push(Bottle.rand(this));
  }

  maybeSpawnBoss() {
    if (this.bossSpawned) return;
    const at = this.cfg.bossAtPx ?? 3800;
    if (this.distanceX >= at) { const b = new Endboss().setGround?.(this.groundY).placeOnGround?.();
      b.x = at + 400; this.opponents.push(b); this.bossSpawned = true; }
  }

  draw() {
    const ctx = this.ctx, c = this.canvas;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.save(); ctx.translate(-this.cameraX, 0);
    this.backgroundObjects.forEach(bo => bo.draw(ctx, this.cameraX));
    this.coins.forEach(o=>this.addToMap(o)); this.bottles.forEach(o=>this.addToMap(o));
    this.addToMap(this.character); this.opponents.forEach(o=>this.addToMap(o));
    this.projectiles.forEach(p=>this.addToMap(p)); ctx.restore();
    this.clouds.forEach(cl => cl.draw?.(ctx));
    this.hud?.draw(this.ctx, this);
  }

  placeOnGround(obj) {
    obj.y = this.groundY - obj.height + (obj.footOffset || 0);
  }

addToMap(mo){
  if (!mo) return;
  const img = mo.img;
  const ready = img && img.naturalWidth > 0;
  if (!ready){
    if (mo.loadFailed && !mo._warned){
      console.warn('Skip broken image:', mo.constructor?.name, img?.src);
      mo._warned = true;
    }
    return; // “still loading” → einfach überspringen, nicht warnen
  }
  const ctx = this.ctx;
  mo.drawGroundShadow?.(ctx, this.groundY, { alpha: 0.12, ryFactor: 0.10 });
  const flip = mo.facing === -1 || mo.otherDirection === true;
  if (flip){ ctx.save(); ctx.translate(mo.x+mo.width, mo.y); ctx.scale(-1,1);
    ctx.drawImage(img, 0,0, mo.width, mo.height); ctx.restore();
  } else {
    ctx.drawImage(img, mo.x, mo.y, mo.width, mo.height);
  }
}
} 

window.World = World;

