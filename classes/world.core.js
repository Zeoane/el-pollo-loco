class World {
  canvas;
  ctx;
  character;

  opponents = [];
  backgroundObjects = [];
  clouds = [];

  tSinceStartMs = 0;
  elapsedMs = 0;

  phase = "small";
  phase2AtMs = 20_000;
  bossAtMs = 40_000;
  bossSpawned = false;
  bossPending = false;

  cameraX = 0;
  gravity = 0.6;
  groundY = 432;

  lastTime = performance.now();
  keyboard = null;

  jumpLock = false;
  distanceX = 0;

  coins = [];
  bottles = [];
  projectiles = [];

  throwState = { charging: false, holdMs: 0, maxMs: 800 };
  inventory = { coins: 0, bottles: 0 };

  cfg = {};
  healCfg = { coinCost: 3, hpPct: 20, cdMs: 1000 };
  _healLock = false;
  _healCdMs = 0;

  paused = false;
  stopped = false;
  _raf = 0;

  imgGameOver = null;
  gameOver = false;
  gameOverReason = "";
  gameOverAt = 0;

  audio = null;
  hud = null;
  _hudMissing = false;

  /** @param {HTMLCanvasElement} canvas @param {Keyboard} keyboard @param {Level} level */
  constructor(canvas, keyboard, level) {
    this.initCore(canvas, keyboard);
    const L = this.initLevel(level);
    this.initPlayer();
    this.initWorldData(L);
    this.initGameOver();
    this.normalizeBackgroundFlow();
    this.initOpponents();
    this.initStartup();
    this.animate();
  }

  /** @param {HTMLCanvasElement} canvas @param {Keyboard} keyboard */
  initCore(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.keyboard = keyboard || null;
  }

  /** @param {Level} level @returns {any} */
  initLevel(level) {
    this.cfg = level?.config || window.LEVEL1 || {};
    return (
      level ||
      createLevel1?.() || {
        backgroundObjects: BackgroundLayers.defaultSet(),
        opponents: [],
        clouds: [],
      }
    );
  }

  /** @returns {void} */
  initPlayer() {
    this.character = new Character()
      .setGround?.(this.groundY)
      .placeOnGround?.();
    this.character.setSpeed?.(this.cfg.player?.speed ?? 3.4);
  }

  /** @param {any} level */
  initWorldData(level) {
    this.backgroundObjects = level.backgroundObjects || [];
    this.opponents = level.opponents || [];
    this.clouds = level.clouds || [];
  }

  /** @returns {void} */
  initGameOver() {
    this.imgGameOver = window.IMG_GAME_OVER || null;
  }

  /** @returns {void} */
  normalizeBackgroundFlow() {
    this.backgroundObjects.forEach((b) => {
      const isCloud = b && b.constructor && b.constructor.name === "CloudLayer";
      if (!isCloud && (b?.flowSpeed || 0) !== 0) {
        b.flowSpeed = 0;
        b._flow = 0;
        b._forcedFlowZero = true;
      }
    });
  }

  /** @returns {void} */
  initStartup() {
    this.initSpawns();
    this.initHud();
    this.initPhaseConfig();
    this.initHealConfig();
    this.initAudioState();
  }

  /** @returns {void} */
  initSpawns() {
    this.spawnSmallChickens?.();
    this.spawnPickups?.();
  }

  /** @returns {void} */
  initHud() {
    if (typeof HUD !== "undefined") this.hud = new HUD();
    else this._hudMissing = true;
  }

  /** @returns {void} */
  initPhaseConfig() {
    this.phase = "small";
    this.phase2AtMs = this.cfg.phase2AtMs ?? 20_000;
    this.bossAtMs = this.cfg.bossAtMs ?? 40_000;
    this.maxSmall = this.cfg.maxSmall ?? 5;
    this.maxBig = this.cfg.maxBig ?? 5;
    this.bossPending = false;
  }

  /** @returns {void} */
  initHealConfig() {
    this.healCfg = { coinCost: 3, hpPct: 20, cdMs: 1000 };
    this._healLock = false;
    this._healCdMs = 0;
  }

  /** @returns {void} */
  initAudioState() {
    this.audio = {
      chickenInt: 30000,
      roosterInt: 30000,
      nextChicken: 2000,
      nextRooster: 0,
      roosterLeft: 2,
    };
  }

  /** Initializes existing opponents by placing them on the ground. */
  initOpponents() {
    this.opponents.forEach((o) =>
      o.setGround?.(this.groundY).placeOnGround?.(),
    );
  }

  /** @param {number} now */
  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime);
    this.lastTime = now;

    if (this.stopped) return;
    if (!this.paused) this.update(dtMs);

    this.draw();
    this._raf = requestAnimationFrame(this.animate);
  };

  /** @param {boolean=} v */
  pause(v) {
    this.paused = v === undefined ? !this.paused : !!v;
  }

  /** @returns {void} */
  stop() {
    this.stopped = true;
    if (!this._raf) return;
    cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  /** @returns {void} */
  resume() {
    if (!this.stopped) this.paused = false;
  }

  /** @returns {void} */
  dispose() {
    this.stop();
  }
}

Object.assign(World.prototype, {
  /** @param {number} dtMs */
  update(dtMs) {
    this.advanceTimers(dtMs);
    this.updatePrePhysics(dtMs);
    this.updatePhysicsAndCollisions(dtMs);
    if (this.paused) return;
    this.updateWorldSimulation(dtMs);
    this.updateGameplaySystems(dtMs);
  },

  /** @param {number} dtMs */
  advanceTimers(dtMs) {
    this.elapsedMs += dtMs;
    this.tSinceStartMs += dtMs;
    this.managePhases?.();
  },

  /** @param {number} dtMs */
  updatePrePhysics(dtMs) {
    this.tickAmbientAudio?.(dtMs);
    this.handleInput?.(dtMs);
    if (this.character) this.character.prevY = this.character.y;
  },

  /** @param {number} dtMs */
  updatePhysicsAndCollisions(dtMs) {
    this.applyPhysics?.(dtMs);
    this.handleGround?.();
    this.checkCharEnemyCollisions?.(dtMs);

    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    const bossFight = !!this.isBossFightActive?.();
    this.character?.updateAnimation?.(dtMs, moving, bossFight);
    if ((this.character?.hp ?? 1) <= 0)
      this.character?.updateAnimation?.(dtMs, false, bossFight);
  },

  /** @param {number} dtMs */
  updateWorldSimulation(dtMs) {
    const moving = !!(this.keyboard?.LEFT || this.keyboard?.RIGHT);
    this.updateCamera?.();
    this.updateClouds?.();
    this.updateBackgrounds?.(dtMs, moving);
    this.updateOpponents?.(dtMs);
    this.distanceX = Math.max(this.distanceX, this.character?.x || 0);
  },

  /** @param {number} dtMs */
  updateGameplaySystems(dtMs) {
    this.tickCollectibles?.(dtMs);
    this.updateThrow?.(dtMs);
    this.handleHeal?.(dtMs);
    this.updateProjectiles?.(dtMs);
    this.checkPickups?.();

    this.maintainBottlesAhead?.(6);
    this.maintainCoinsAhead?.(6);
    this.maintainEnemies?.();
  },

  /** @returns {void} */
  draw() {
    const { ctx, canvas } = this;
    this.resetCanvasState(ctx, canvas);
    this.drawWorldLayer(ctx);
    this.drawEntitiesLayer(ctx);
    this.drawHudLayer(ctx);
  },

  /** @param {CanvasRenderingContext2D} ctx @param {HTMLCanvasElement} canvas */
  resetCanvasState(ctx, canvas) {
    ctx.setTransform?.(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  /** @param {CanvasRenderingContext2D} ctx */
  drawWorldLayer(ctx) {
    this.backgroundObjects.forEach((bo) => bo.draw(ctx, this.cameraX));
  },

  /** @param {CanvasRenderingContext2D} ctx */
  drawEntitiesLayer(ctx) {
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.coins.forEach((c) => this.addToMap?.(c));
    this.bottles.forEach((b) => this.addToMap?.(b));
    this.addToMap?.(this.character);
    this.opponents.forEach((o) => this.addToMap?.(o));
    this.projectiles.forEach((p) => this.addToMap?.(p));
    ctx.restore();

    this.clouds.forEach((c) => c.draw?.(ctx, this.cameraX));
  },

  /** @param {CanvasRenderingContext2D} ctx */
  drawHudLayer(ctx) {
    this.hud?.draw?.(ctx, this);
  },

  /** @param {number} minAhead */
  maintainCoinsAhead(minAhead = 6) {
    const from = this.cameraX + this.canvas.width * 0.6;
    const to = from + 1000;
    const n = this.coins.filter((c) => c.x >= from && c.x <= to).length;
    if (n < minAhead) this.spawnCoinRow(to - 200 + Math.random() * 300);
  },

  /** @param {number} baseX */
  spawnCoinRow(baseX) {
    const cnt = 3 + Math.floor(Math.random() * 4);
    const dx = 34;
    const y = this.groundY - 120 - Math.random() * 60;
    for (let i = 0; i < cnt; i++) {
      const coin = new Coin(baseX + i * dx, y);
      if (
        this._originalGroundY !== undefined &&
        this.groundY !== this._originalGroundY
      ) {
        const offsetFromGround = y - this.groundY;
        coin._originalOffset = offsetFromGround;
      }
      this.coins.push(coin);
    }
  },
});

window.World = World;
