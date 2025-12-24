// models/world.core.js
class World {
  canvas; ctx; character;
  opponents = []; backgroundObjects = []; clouds = [];
  tSinceStartMs = 0; phase = 0; cameraX = 0;
  gravity = 0.6; groundY = 432; lastTime = performance.now();
  keyboard = null; jumpLock = false; distanceX = 0;
  bossSpawned = false;
  coins = []; bottles = []; projectiles = [];
  throwState = { charging:false, holdMs:0, maxMs:800 };
  inventory = { coins:0, bottles:0 };
  cfg = {}; paused = false; stopped = false; _raf = 0;
  elapsedMs = 0;

  constructor(canvas, keyboard, level){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard || null;

    this.cfg = level?.config || window.LEVEL1 || {};
    this.character = new Character().setGround?.(this.groundY).placeOnGround?.();
    this.character.setSpeed?.(this.cfg.player?.speed ?? 3.4);

    const L = level || createLevel1?.() || {
      backgroundObjects: BackgroundLayers.defaultSet(),
      opponents: [], clouds: []
    };
    this.backgroundObjects = L.backgroundObjects;
    this.opponents = L.opponents;
    this.clouds = L.clouds;

    this.initOpponents();
    this.spawnSmallChickens();
    this.spawnPickups();

    this.hud = (window.USE_CANVAS_HUD && window.HUD) ? new HUD() : null;

    this.phase = 'small';
    this.phase2AtMs = this.cfg.phase2AtMs ?? 90_000;
    this.bossAtMs   = this.cfg.bossAtMs   ?? 180_000;
    this.maxSmall   = this.cfg.maxSmall   ?? 5;
    this.maxBig     = this.cfg.maxBig     ?? 5;

    this.healCfg = { coinCost:3, hpPct:20, cdMs:1000 };
    this._healLock = false; this._healCdMs = 0;

    this.animate();
  }

  initOpponents(){
    this.opponents.forEach(o => o.setGround?.(this.groundY).placeOnGround?.());
  }

  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime);
    this.lastTime = now;
    if (!this.stopped){
      if (!this.paused) this.update(dtMs);
      this.draw();
      this._raf = requestAnimationFrame(this.animate);
    }
  };

  pause(v){ this.paused = (v === undefined) ? !this.paused : !!v; }
  stop(){ this.stopped = true; if (this._raf){ cancelAnimationFrame(this._raf); this._raf = 0; } }
  resume(){ if (!this.stopped) this.paused = false; }
  dispose(){ this.stop(); }


  update(dtMs){
    this.elapsedMs += dtMs; this.tSinceStartMs += dtMs;
    this.managePhases();
    this.handleInput(dtMs);
    this.character.prevY = this.character.y;

    this.applyPhysics(dtMs);
    this.handleGround();
    this.checkCharEnemyCollisions(dtMs);

    this.tickCollectibles(dtMs);
    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    this.character.updateAnimation?.(dtMs, moving);

    this.updateCamera(moving);
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
    this.maintainEnemies();
  }
}

window.World = World;
