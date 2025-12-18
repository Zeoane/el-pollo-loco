// world.class.js
class World {
  canvas;
  ctx;
  character;
  opponents = [];
  backgroundObjects = [];
  clouds = [];
  tSinceStartMs = 0;
  phase = 0;
  cameraX = 0;
  gravity = 0.6;
  groundY = 432;
  lastTime = performance.now();
  keyboard = null;
  jumpLock = false;
  distanceX = 0;
  bossSpawned = false;
  coins = [];
  bottles = [];
  projectiles = [];
  throwState = { charging: false, holdMs: 0, maxMs: 800 };
  inventory = { coins: 0, bottles: 0 };
  cfg = {};
  paused = false;
  stopped = false;
  _raf = 0;

  constructor(canvas, keyboard, level) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard || null;

    this.cfg = level?.config || window.LEVEL1 || {};

    this.character = new Character()
      .setGround?.(this.groundY)
      .placeOnGround?.();

    const L = level ||
      createLevel1?.() || {
        backgroundObjects: BackgroundLayers.defaultSet(),
        opponents: [],
        clouds: [],
      };
    this.backgroundObjects = L.backgroundObjects;
    this.opponents = L.opponents;
    this.clouds = L.clouds;

    this.initOpponents();
    this.spawnSmallChickens();
    this.spawnPickups();
    this.hud = window.USE_CANVAS_HUD && window.HUD ? new HUD() : null;
    this.animate();
  }

  initOpponents() {
    this.opponents.forEach((o) =>
      o.setGround?.(this.groundY).placeOnGround?.()
    );
  }

  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime);
    this.lastTime = now;
    if (!this.stopped) {
      if (!this.paused) this.update(dtMs);
      this.draw();
      this._raf = requestAnimationFrame(this.animate);
    }
  };

  pause(v) {
    this.paused = v === undefined ? !this.paused : !!v;
  }

  stop() {
    this.stopped = true;
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  resume() {
    if (!this.stopped) this.paused = false;
  }

  dispose() {
    this.stop();
  }

  update(dtMs) {
    this.tSinceStartMs += dtMs;
    this.managePhases();
    this.handleInput(dtMs);
    this.character.prevY = this.character.y;

    this.applyPhysics();
    this.handleGround();
    this.checkCharEnemyCollisions(dtMs);

    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    this.character.updateWalkAnimation?.(dtMs, moving);

    this.updateCamera(moving);
    this.updateClouds();
    this.updateBackgrounds(dtMs, moving);
    this.updateOpponents();

    this.distanceX = Math.max(this.distanceX, this.character.x);

    this.updateProjectiles(dtMs);
    this.checkPickups();
    this.handleThrow();

    this.updateThrow(dtMs);
    this.updateProjectiles(dtMs);
    this.checkPickups();
    this.maybeSpawnBoss();
  }

  managePhases() {
    const t = this.tSinceStartMs;
    if (this.phase === 0 && t >= 120000) {
      this.spawnRegularChickens();
      this.phase = 1;
    }
    if (this.phase <= 1 && t >= 240000 && !this.bossSpawned) {
      this.spawnBoss();
      this.phase = 2;
    }
  }

  spawnSmallChickens() {
    const c = this.cfg.enemies || {},
      n = c.smallCount || 4;
    let x = (this.character.x || 0) + 500;
    for (let i = 0; i < n; i++) {
      const h = new SmallChicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed =
        (c.smallSpeedMin ?? 1.2) +
        Math.random() * ((c.smallSpeedMax ?? 2.0) - (c.smallSpeedMin ?? 1.2));
      h.x = x;
      this.opponents.push(h);
      x +=
        (c.smallGapMin ?? 220) +
        Math.random() * ((c.smallGapMax ?? 460) - (c.smallGapMin ?? 220));
    }
  }

  spawnRegularChickens() {
    const c = this.cfg.enemies || {},
      n = c.regCount || 3;
    let x = (this.character.x || 0) + 700;
    for (let i = 0; i < n; i++) {
      const h = new Chicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed =
        (c.speedMin ?? 1.4) +
        Math.random() * ((c.speedMax ?? 2.4) - (c.speedMin ?? 1.4));
      h.x = x;
      this.opponents.push(h);
      x +=
        (c.gapMin ?? 260) +
        Math.random() * ((c.gapMax ?? 520) - (c.gapMin ?? 260));
    }
  }

  spawnBoss() {
    if (this.bossSpawned) return;
    const b = new Endboss().setGround?.(this.groundY).placeOnGround?.();
    b.x = this.character.x + 800;
    this.opponents.push(b);
    this.bossSpawned = true;
    SFX.play?.("boss", { vol: 0.8 });
  }

  handleInput(dtMs) {
    if (this.keyboard?.RIGHT) {
      this.character.stepRight?.(dtMs);
      this.character.facing = 1;
    }
    if (this.keyboard?.LEFT) {
      this.character.stepLeft?.(dtMs);
      this.character.facing = -1;
    }
    if (
      !this.jumpLock &&
      (this.keyboard?.SPACE || this.keyboard?.UP) &&
      this.character.onGround
    ) {
      this.character.vy = this.cfg.player?.jumpVy ?? -12;
      this.character.onGround = false;
      this.jumpLock = true;
    }
    if (!this.keyboard?.SPACE && !this.keyboard?.UP) this.jumpLock = false;
  }

  applyPhysics() {
    this.character.vy += this.gravity;
    this.character.x += this.character.vx || 0;
    this.character.y += this.character.vy || 0;
  }

  handleGround() {
    if (this.character.y + this.character.height >= this.groundY) {
      this.character.y = this.groundY - this.character.height;
      this.character.vy = 0;
      this.character.onGround = true;
    }
    if (this.character.x < 0) this.character.x = 0;
  }

  updateCamera(moving) {
    const target = this.character.x - this.canvas.width * 0.4;
    this.cameraX = moving
      ? this.cameraX + (target - this.cameraX) * 0.1
      : target;
  }

  updateClouds() {
    this.clouds.forEach((c) => c.update?.(this.canvas.width));
  }

  updateBackgrounds(dtMs, moving) {
    this.backgroundObjects.forEach((bo) =>
      bo.update(this.cameraX, this.canvas, dtMs, moving)
    );
  }

  updateOpponents(dtMs) {
    const left = this.cameraX - 150,
      ahead = this.cameraX + this.canvas.width + 200;
    const far = Math.max(0, ...this.opponents.map((op) => op.x || 0));
    this.opponents.forEach((o) => {
      o.updateWalkAnimation?.(dtMs, true);
      o.x -= o.speed ?? 0;
      this.placeOnGround(o);
      if (o.x + o.width < left) {
        const g = 260 + Math.random() * 460;
        o.x = Math.max(ahead, far + g);
        o.speed = 1.6 + Math.random() * 0.8;
      }
    });
    this.opponents = this.opponents.filter((o) => !o._dead);
  }



  checkCharEnemyCollisions(dtMs) {
    const c = this.character;
    c.invT = Math.max(0, (c.invT || 0) - dtMs);
    if (c.invT) return;

    const cb = c.getBounds?.() || c;
    for (const e of this.opponents) {
      const eb = e.getBounds?.() || e;
      if (!AABB(cb, eb)) continue;

      c.hp = Math.max(0, (c.hp ?? 100) - (e.dmg ?? 20));
      c.invT = 600; // 0,6s Unverwundbarkeit
      c.vy = -6; // Knock-up
      c.vx = c.facing === 1 ? -2 : 2; // Knock-back
      SFX.play?.("hit", { vol: 0.9 });
      break;
    }
  }

  handleThrow() {
    if (
      this.keyboard?.F &&
      (this.inventory.bottles || 0) > 0 &&
      !this.throwLock
    ) {
      const dir = this.character.facing === -1 ? -1 : 1;
      const p = new Projectile(
        this.character.x + this.character.width / 2,
        this.character.y + 20,
        dir
      );
      this.projectiles.push(p);
      this.inventory.bottles--;
      this.throwLock = true;
      SFX.play?.("throw", { vol: 0.8 });
    }
    if (!this.keyboard?.F) this.throwLock = false;
  }

  updateThrow(dtMs){
  const F = !!this.keyboard?.F, ts = this.throwState;
  if (F && !ts.charging){ ts.charging = true; ts.holdMs = 0; }
  if (F &&  ts.charging){ ts.holdMs = Math.min(ts.holdMs + dtMs, ts.maxMs); }

  if (!F && ts.charging){
    ts.charging = false;
    if ((this.inventory.bottles||0) > 0){
      const pow = 1 + (ts.holdMs / ts.maxMs) * 1.5; // 1.0..2.5
      const dir = (this.character.facing===-1) ? -1 : 1;
      const p = new Projectile(
        this.character.x + this.character.width/2,
        this.character.y + 20,
        dir,
        { speedMul: pow }
      );
      this.projectiles.push(p);
      this.inventory.bottles--;
      SFX.play?.('bottle_throw',{vol:0.8});
    }
  }
}

updateProjectiles(dtMs){
  const gY = this.groundY;

  // bewegen + Bodencheck
  this.projectiles.forEach(p=>{
    p.update(dtMs);
    if (p.state === 'fly' && p.y + p.height >= gY){
      p.hitAndSplash(gY); // Splash auf Boden
    }
  });

  // Gegner-Treffer → Splash & Schaden
  this.projectiles.forEach(p=>{
    if (p.state !== 'fly') return;
    const hit = this.opponents.find(o => AABB(p, o));
    if (hit){
      hit.hp = (hit.hp||3) - 1;
      if (hit.hp <= 0) hit._dead = true;
      p.hitAndSplash();
    }
  });

  // Aufräumen
  this.projectiles = this.projectiles.filter(p => !p._dead);
  this.opponents   = this.opponents.filter(o => !o._dead);
}


  updateProjectiles(dtMs) {
    this.projectiles.forEach((p) => p.update(dtMs / 16));
    this.projectiles = this.projectiles.filter((p) => {
      const hit = this.opponents.find((o) => AABB(p, o));
      if (hit) {
        hit.hp = (hit.hp || 3) - 1;
        SFX.play?.("hit", { vol: 0.9 });
        if (hit.hp <= 0) hit._dead = true;
        return false;
      }
      return p.y < this.canvas.height;
    });
    this.opponents = this.opponents.filter((o) => !o._dead);
  }

  checkPickups() {
    this.coins = this.coins.filter((c) => {
      if (AABB(this.character, c)) {
        this.inventory.coins++;
        SFX.play?.("coin", { vol: 0.8 });
        return false;
      }
      return true;
    });
    this.bottles = this.bottles.filter((b) => {
      if (AABB(this.character, b)) {
        this.inventory.bottles++;
        SFX.play?.("bottle", { vol: 0.8 });
        return false;
      }
      return true;
    });
  }

  spawnChickens() {
    const c = this.cfg.enemies || {};
    let x = (this.character.x || 0) + 500;
    for (let i = 0; i < (c.chickens || 3); i++) {
      const h = new Chicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed =
        (c.speedMin ?? 1.4) +
        Math.random() * ((c.speedMax ?? 2.4) - (c.speedMin ?? 1.4));
      h.x = x;
      this.opponents.push(h);
      x +=
        (c.gapMin ?? 260) +
        Math.random() * ((c.gapMax ?? 520) - (c.gapMin ?? 260));
    }
  }

  spawnPickups() {
    const it = this.cfg.items || {};
    for (let i = 0; i < (it.coins || 0); i++) this.coins.push(Coin.rand(this));
    for (let i = 0; i < (it.bottles || 0); i++)
      this.bottles.push(Bottle.rand(this));
  }

  maybeSpawnBoss() {
    if (this.bossSpawned) return;
    const at = this.cfg.bossAtPx ?? 3800;
    if (this.distanceX >= at) {
      const b = new Endboss().setGround?.(this.groundY).placeOnGround?.();
      b.x = at + 400;
      this.opponents.push(b);
      this.bossSpawned = true;
    }
  }

draw(){
  const {ctx,canvas}=this;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.save();
  ctx.translate(-this.cameraX,0);
  this.backgroundObjects.forEach(bo=>bo.draw(ctx,this.cameraX));
  this.addToMap(this.character);
  this.opponents.forEach(o=>this.addToMap(o));
  this.projectiles.forEach(p=>this.addToMap(p)); 
  ctx.restore();

  this.clouds.forEach(c=>c.draw?.(ctx));
  this.hud?.draw(ctx, this);
}

  placeOnGround(obj) {
    obj.y = this.groundY - obj.height + (obj.footOffset || 0);
  }

  addToMap(mo) {
    if (!mo) return;
    const img = mo.img;
    const ready = img && img.complete && img.naturalWidth > 0 && !img._broken;

    if (!ready) {
      if (img?._broken && !mo._warned) {
        console.warn("Broken image:", mo.constructor?.name, img?.src);
        mo._warned = true;
      }
      // Sichtbarer Platzhalter nur für den Character, damit du ihn siehst
      if (mo === this.character) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = "rgba(200,40,40,0.6)";
        ctx.fillRect(mo.x, mo.y, mo.width, mo.height);
        ctx.restore();
      }
      return;
    }

    const ctx = this.ctx;
    mo.drawGroundShadow?.(ctx, this.groundY, { alpha: 0.12, ryFactor: 0.1 });

    const flip = mo.facing === -1 || mo.otherDirection === true;
    if (flip) {
      ctx.save();
      ctx.translate(mo.x + mo.width, mo.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, mo.width, mo.height);
      ctx.restore();
    } else {
      ctx.drawImage(img, mo.x, mo.y, mo.width, mo.height);
    }
  }
}

window.World = World;

// HUD DOM helper
class HUDOverlay {
  constructor(root) {
    this.root = root;
    this.el = {
      bottleRow: root.querySelector('.hud-row[data-kind="bottle"]'),
      healthRow: root.querySelector('.hud-row[data-kind="health"]'),
      coinRow: root.querySelector('.hud-row[data-kind="coin"]'),
      bottleFill: root.querySelector('.hud-row[data-kind="bottle"] .fill'),
      healthFill: root.querySelector('.hud-row[data-kind="health"] .fill'),
      coinFill: root.querySelector('.hud-row[data-kind="coin"] .fill'),
      lblBottle: document.getElementById("lbl-bottle"),
      lblHealth: document.getElementById("lbl-health"),
      lblCoin: document.getElementById("lbl-coin"),
    };
  }
  _pct(num, den) {
    return Math.max(0, Math.min(100, den ? (num * 100) / den : 0));
  }
  _setFill(el, pct) {
    if (el) el.style.setProperty("--p", pct.toFixed(0) + "%");
  }
  sync(world) {
    const inv = world?.inventory || {},
      cfg = world?.cfg || {};
    const coins = inv.coins || 0,
      coinsMax = cfg.items?.coins || 10;
    const bottles = inv.bottles || 0,
      bottlesMax = cfg.items?.bottles || 5;
    const hpPct = world?.character?.hpPercent?.() ?? 100;

    this._setFill(this.el.coinFill, this._pct(coins, coinsMax));
    this._setFill(this.el.bottleFill, this._pct(bottles, bottlesMax));
    this._setFill(this.el.healthFill, hpPct);

    if (this.el.lblCoin) this.el.lblCoin.textContent = "×" + coins;
    if (this.el.lblBottle) this.el.lblBottle.textContent = "×" + bottles;
    if (this.el.lblHealth)
      this.el.lblHealth.textContent = hpPct.toFixed(0) + "%";
  }
}

window.addEventListener("load", () => {
  const root = document.getElementById("hud");
  if (!root) return;
  window.hudDOM = new HUDOverlay(root);
  const tick = () => {
    if (window.world) window.hudDOM.sync(window.world);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
