// models/world.core.js
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
  elapsedMs = 0;

  constructor(canvas, keyboard, level) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard || null;

    this.cfg = level?.config || window.LEVEL1 || {};
    this.character = new Character()
      .setGround?.(this.groundY)
      .placeOnGround?.();
    this.character.setSpeed?.(this.cfg.player?.speed ?? 3.4);

    const L = level ||
      createLevel1?.() || {
        backgroundObjects: BackgroundLayers.defaultSet(),
        opponents: [],
        clouds: [],
      };
    this.backgroundObjects = L.backgroundObjects;
    this.imgGameOver = window.IMG_GAME_OVER || null;
    this.gameOver = false;
    this.gameOverReason = "";
    this.gameOverAt = 0;

    this.backgroundObjects.forEach((b) => {
      const isCloud = b && b.constructor && b.constructor.name === "CloudLayer";
      if (!isCloud && (b.flowSpeed || 0) !== 0) {
        console.warn(
          "[BG] Forcing flow=0 on non-cloud layer",
          b.constructor?.name,
          b.flowSpeed
        );
        b.flowSpeed = 0;
        b._flow = 0;
      }
    });

    this.opponents = L.opponents;
    this.clouds = L.clouds;

    this.initOpponents();
    this.spawnSmallChickens();
    this.spawnPickups();

if (typeof HUD !== 'undefined') {
    this.hud = new HUD();
} else {
    console.error("HUD-Klasse wurde nicht gefunden.");
}


    this.phase = "small";
    this.phase2AtMs = this.cfg.phase2AtMs ?? 90_000;
    this.bossAtMs = this.cfg.bossAtMs ?? 180_000;
    this.maxSmall = this.cfg.maxSmall ?? 5;
    this.maxBig = this.cfg.maxBig ?? 5;

    this.healCfg = { coinCost: 3, hpPct: 20, cdMs: 1000 };
    this._healLock = false;
    this._healCdMs = 0;
    this.audio = {
      chickenInt: 30000,
      roosterInt: 30000,
      nextChicken: 2000,
      nextRooster: 0,
      roosterLeft: 2,
    };
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
    this.elapsedMs += dtMs;
    this.tSinceStartMs += dtMs;
    this.managePhases();
    this.tickAmbientAudio?.(dtMs);
    this.handleInput?.(dtMs);
    this.character.prevY = this.character.y;

    this.applyPhysics(dtMs);
    this.handleGround();
    this.checkCharEnemyCollisions(dtMs);

    this.tickCollectibles(dtMs);
    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    this.character.updateAnimation(dtMs, moving);
    if (this.character.hp <= 0) {
      this.character.updateAnimation(dtMs, false);
    }

    if (this.paused) return;
    this.updateCamera();
    this.updateClouds();
    this.updateBackgrounds(dtMs, moving);
    this.updateOpponents(dtMs);

    this.distanceX = Math.max(this.distanceX, this.character.x);

    this.handleThrow();
    this.updateThrow(dtMs);
    this.handleHeal(dtMs);
    this.updateProjectiles(dtMs);
    this.checkPickups();
    this.maintainBottlesAhead(6);
    this.maintainCoinsAhead(6);
    this.maintainEnemies();
  }
}

Object.assign(World.prototype, {
  draw() {
    const { ctx, canvas } = this;
    ctx.setTransform?.(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.backgroundObjects.forEach((bo) => bo.draw(ctx, this.cameraX));

    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.coins.forEach((c) => this.addToMap(c));
    this.bottles.forEach((b) => this.addToMap(b));
    this.addToMap(this.character);
    this.opponents.forEach((o) => this.addToMap(o));
    this.projectiles.forEach((p) => this.addToMap(p));
    ctx.restore();

    this.clouds.forEach((c) => c.draw?.(ctx, this.cameraX));
    this.hud?.draw(ctx, this);
  },
});

Object.assign(World.prototype, {
  maintainCoinsAhead(minAhead = 6) {
    const from = this.cameraX + this.canvas.width * 0.6;
    const to = from + 1000;
    const n = this.coins.filter((c) => c.x >= from && c.x <= to).length;
    if (n < minAhead) this.spawnCoinRow(to - 200 + Math.random() * 300);
  },
  spawnCoinRow(baseX) {
    const cnt = 3 + Math.floor(Math.random() * 4);
    const dx = 34;
    const y = this.groundY - 120 - Math.random() * 60;
    for (let i = 0; i < cnt; i++) this.coins.push(new Coin(baseX + i * dx, y));
  },
});

window.World = World;
