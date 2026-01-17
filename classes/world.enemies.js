// classes/world.enemies.js
Object.assign(World.prototype, {
/**
 * Switches enemy phases based on elapsed time (small -> big -> boss).
 * Spawns/removes enemies when phase thresholds are reached.
 */
managePhases() {
  const t = this.elapsedMs | 0;
  if (this.shouldEnterBigPhase(t)) this.enterBigPhase();
  if (this.shouldEnterBossPhase(t)) this.enterBossPhase();
},

/**
 * Checks whether the world should transition into the big phase.
 * @param {number} t 
 * @returns {boolean}
 */
shouldEnterBigPhase(t) {
  return this.phase === "small" && t >= this.phase2AtMs;
},

/**
 * Checks whether the world should transition into the boss phase.
 * @param {number} t 
 * @returns {boolean}
 */
shouldEnterBossPhase(t) {
  return this.phase === "big" && t >= this.bossAtMs && !this.bossSpawned;
},

/**
 * Transitions to the big phase: marks transition and spawns regular chickens.
 * Living SmallChickens are allowed to finish moving off-screen naturally.
 */
enterBigPhase() {
  this.phase = "big";
  // Mark all SmallChickens to be removed when they leave the screen
  // They will continue their normal movement until they're off-screen
  this.opponents.forEach(o => {
    if (o instanceof SmallChicken && !o._dead && o.state !== "dead") {
      o._phaseTransitionRemoval = true; // Mark for removal when off-screen
    }
  });
  this.spawnRegularChickens();
},

/**
 * Transitions to the boss phase: marks transition and spawns the endboss.
 * Living enemies are allowed to finish moving off-screen naturally.
 */
enterBossPhase() {
  this.phase = "boss";
  // Mark all non-Endboss enemies to be removed when they leave the screen
  // They will continue their normal movement until they're off-screen
  this.opponents.forEach(o => {
    if (!(o instanceof Endboss) && !o._dead && o.state !== "dead") {
      o._phaseTransitionRemoval = true; // Mark for removal when off-screen
    }
  });
  this.spawnBoss();
},

/**
 * Keeps the current phase enemy population within configured limits
 * and removes enemies that do not belong to the active phase.
 */
maintainEnemies() {
  if (this.phase === "small") return this.maintainSmallPhase();
  if (this.phase === "big") return this.maintainBigPhase();
  if (this.phase === "boss") return this.maintainBossPhase();
},

/**
 * Maintains enemies for the "small" phase.
 */
maintainSmallPhase() {
  while (this.countEnemies(SmallChicken) < this.maxSmall) this.spawnEnemy("small");
  this.opponents = this.opponents.filter(o => !(o instanceof Chicken));
},

/**
 * Maintains enemies for the "big" phase.
 */
maintainBigPhase() {
  while (this.countEnemies(Chicken) < this.maxBig) this.spawnEnemy("big");
  // Keep leftover SmallChickens so they can walk off-screen
  // (they'll be removed once they leave the left bound)
},

/**
 * Keeps only the living endboss during the "boss" phase.
 */
maintainBossPhase() {
  // Keep endboss plus any transition-marked enemies until off-screen
  this.opponents = this.opponents.filter(o => {
    if (o instanceof Endboss) return !o._dead;
    if (o._phaseTransitionRemoval) return !o._dead;
    return false;
  });
},

/**
 * Counts enemies of a given class.
 * @param {Function} Cls 
 * @returns {number}
 */
countEnemies(Cls) {
  return this.opponents.filter(o => o instanceof Cls).length;
},

  /**
   * Spawns a single enemy of the given kind and places it ahead of the camera.
   * @param {"small"|"big"} kind 
   */
  spawnEnemy(kind = "small") {
    const Klass = kind === "small" ? SmallChicken : Chicken;
    const e = new Klass().setGround?.(this.groundY).placeOnGround?.();
    e.speed =
      kind === "small" ? 1.2 + Math.random() * 0.7 : 1.6 + Math.random() * 0.9;

    const left = this.cameraX - 150;
    const ahead = this.cameraX + this.canvas.width + 220;
    const far = Math.max(0, ...this.opponents.map((op) => op.x || 0));
    e.x = this._respawnX(ahead, far);
    this.opponents.push(e);
  },

  /**
   * Spawns the initial set of small chickens based on level configuration.
   */
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
  },

  /**
   * Spawns the initial set of regular chickens based on level configuration.
   */
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
  },

  /**
   * Spawns the endboss once and transitions the world into boss phase.
   */
  spawnBoss(/* ... */) {
    if (this.bossSpawned) return;
    const b = new Endboss().setGround?.(this.groundY).placeOnGround?.();
    // Spawn boss off-screen to the right, relative to canvas width
    // Use cameraX + canvas width + additional offset to ensure boss starts off-screen
    const canvasWidth = this.canvas?.width || 1920;
    const cameraRight = (this.cameraX || 0) + canvasWidth;
    const offset = Math.max(800, canvasWidth * 0.8); // At least 800px, or 80% of canvas width
    b.x = Math.max(cameraRight + 200, (this.character.x || 0) + offset);
    this.opponents.push(b);
    this.bossSpawned = true;
    this.phase = "boss";
    SFX.stop?.("chicken");
    if (this.audio) {
      this.audio.roosterLeft = 2;
      this.audio.nextRooster = this.elapsedMs + 1000;
    }
    SFX.play?.("boss", { vol: 0.8 });
  },

/**
 * Updates all opponents, applies movement, and respawns offscreen enemies.
 * @param {number} dtMs 
 */
updateOpponents(dtMs) {
  const bounds = this.getEnemyBounds();
  const far = this.getFarthestEnemyX();
  this.opponents.forEach(o => this.updateOpponent(o, dtMs, bounds, far));
  this.opponents = this.opponents.filter(o => !o._dead);
},

/**
 * Returns left/ahead bounds used for enemy respawn logic.
 * @returns {{left:number, ahead:number}}
 */
getEnemyBounds() {
  return {
    left: this.cameraX - 150,
    ahead: this.cameraX + this.canvas.width + 200,
  };
},

/**
 * Returns the maximum x position among current opponents.
 * @returns {number}
 */
getFarthestEnemyX() {
  return Math.max(0, ...this.opponents.map(op => op.x || 0));
},

/**
 * Updates a single opponent instance.
 * @param {Object} o 
 * @param {number} dtMs 
 * @param {{left:number, ahead:number}} bounds 
 * @param {number} far 
 */
updateOpponent(o, dtMs, bounds, far) {
  o.update?.(dtMs);
  if (this.handleBossOpponent(o, dtMs)) return;
  if (o.state === "dead") return;

  this.moveOpponent(o);
  this.placeOnGround(o);
  this.respawnOpponentIfNeeded(o, bounds, far);
},

/**
 * Handles boss-specific update logic.
 * @param {Object} o
 * @param {number} dtMs
 * @returns {boolean} 
 */
handleBossOpponent(o, dtMs) {
  if (!o.updateBoss) return false;
  o.updateBoss(this, dtMs);
  return true;
},

/**
 * Applies horizontal movement to an opponent.
 * @param {Object} o
 */
moveOpponent(o) {
  o.x -= o.speed ?? 0;
},

/**
 * Respawns an opponent if it moved out of the left bound.
 * @param {Object} o
 * @param {{left:number, ahead:number}} bounds
 * @param {number} far
 */
respawnOpponentIfNeeded(o, bounds, far) {
  if (o.x + o.width >= bounds.left) return;
  
  // If enemy is marked for phase transition removal, don't respawn - mark as dead instead
  if (o._phaseTransitionRemoval) {
    o._dead = true;
    return;
  }
  
  o.x = this._respawnX(bounds.ahead, far);
  this._rerollSpeed(o);
},

  /**
   * Calculates a new respawn x-position based on camera and farthest enemy.
   * @param {number} ahead 
   * @param {number} far
   * @returns {number}
   */
  _respawnX(ahead, far) {
    const gap = 260 + Math.random() * 460;
    return Math.max(ahead, far + gap);
  },

  /**
   * Re-randomizes the movement speed for an enemy based on its class/config.
   * @param {Object} o 
   */
  _rerollSpeed(o) {
    const E = this.cfg.enemies || {};
    if (o instanceof SmallChicken) {
      const a = E.smallSpeedMin ?? 1.2,
        b = E.smallSpeedMax ?? 2.0;
      o.speed = a + Math.random() * (b - a);
    } else {
      const a = E.speedMin ?? 1.6,
        b = E.speedMax ?? 2.5;
      o.speed = a + Math.random() * (b - a);
    }
  }
});
