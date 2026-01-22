Object.assign(World.prototype, {
  /**
   * Returns true while the endboss fight is active.
   * @returns {boolean}
   */
  isBossFightActive() {
    if (this.phase !== "boss") return false;
    return this.opponents?.some(
      (o) => o instanceof Endboss && !(o._dead || o.state === "dead"),
    );
  },

  /**
   * Switches enemy phases based on elapsed time.
   */
  managePhases() {
    const t = this.elapsedMs | 0;
    if (this.shouldEnterBigPhase(t)) this.enterBigPhase();
    if (this.shouldEnterBossPhase(t)) this.bossPending = true;
    if (this.shouldSpawnBossNow?.()) this.enterBossPhase();
  },

  /**
   * @param {number} t
   * @returns {boolean}
   */
  shouldEnterBigPhase(t) {
    return this.phase === "small" && t >= this.phase2AtMs;
  },

  /**
   * @param {number} t
   * @returns {boolean}
   */
  shouldEnterBossPhase(t) {
    return this.phase === "big" && t >= this.bossAtMs && !this.bossSpawned;
  },

  /**
   * @returns {boolean}
   */
  shouldSpawnBossNow() {
    if (!this.bossPending || this.phase !== "big" || this.bossSpawned)
      return false;
    return !this.opponents?.some(
      (o) => o instanceof Chicken || o instanceof SmallChicken,
    );
  },

  /**
   * @returns {void}
   */
  enterBigPhase() {
    this.phase = "big";
    this.markOpponentsForRemoval((o) => o instanceof SmallChicken);
    this.spawnRegularChickens();
  },

  /**
   * @returns {void}
   */
  enterBossPhase() {
    this.phase = "boss";
    this.bossPending = false;
    this.markOpponentsForRemoval((o) => !(o instanceof Endboss));
    this.spawnBoss();
  },

  /**
   * @param {(o: any) => boolean} predicate
   */
  markOpponentsForRemoval(predicate) {
    this.opponents.forEach((o) => {
      if (predicate(o) && !o._dead && o.state !== "dead") {
        o._phaseTransitionRemoval = true;
      }
    });
  },

  /**
   * @returns {void}
   */
  maintainEnemies() {
    if (this.phase === "small") return this.maintainSmallPhase();
    if (this.phase === "big") return this.maintainBigPhase();
    if (this.phase === "boss") return this.maintainBossPhase();
  },

  /**
   * @returns {void}
   */
  maintainSmallPhase() {
    while (this.countEnemies(SmallChicken) < this.maxSmall)
      this.spawnEnemy("small");
    this.opponents = this.opponents.filter((o) => !(o instanceof Chicken));
  },

  /**
   * @returns {void}
   */
  maintainBigPhase() {
    if (this.bossPending) return;
    while (this.countEnemies(Chicken) < this.maxBig) this.spawnEnemy("big");
  },

  /**
   * @returns {void}
   */
  maintainBossPhase() {
    this.opponents = this.opponents.filter((o) =>
      this.shouldKeepBossOpponent(o),
    );
  },

  /**
   * @param {any} o
   * @returns {boolean}
   */
  shouldKeepBossOpponent(o) {
    if (o instanceof Endboss) return !o._dead;
    if (o._phaseTransitionRemoval) return !o._dead;
    return false;
  },

  /**
   * @param {Function} Cls
   * @returns {number}
   */
  countEnemies(Cls) {
    return this.opponents.filter((o) => o instanceof Cls).length;
  },

  /**
   * @param {"small"|"big"} kind
   */
  spawnEnemy(kind = "small") {
    const Klass = kind === "small" ? SmallChicken : Chicken;
    const e = new Klass().setGround?.(this.groundY).placeOnGround?.();
    e.speed =
      kind === "small" ? 0.8 + Math.random() * 0.5 : 1.1 + Math.random() * 0.6;
    const ahead = this.cameraX + this.canvas.width + 220;
    const far = Math.max(0, ...this.opponents.map((op) => op.x || 0));
    e.x = this._respawnX(ahead, far);
    this.opponents.push(e);
  },

  /**
   * @returns {void}
   */
  spawnSmallChickens() {
    const cfg = this.getEnemyConfig();
    const n = cfg.smallCount || 4;
    let x = this.getSmallSpawnStart();
    for (let i = 0; i < n; i++) {
      const h = this.createSmallChicken(cfg);
      h.x = x;
      this.opponents.push(h);
      x += this.getSmallGap(cfg);
    }
  },

  /**
   * @param {object} cfg
   * @returns {SmallChicken}
   */
  createSmallChicken(cfg) {
    const h = new SmallChicken().setGround?.(this.groundY).placeOnGround?.();
    h.speed = this.randomRange(
      cfg.smallSpeedMin ?? 0.8,
      cfg.smallSpeedMax ?? 1.3,
    );
    return h;
  },

  /**
   * @param {object} cfg
   * @returns {number}
   */
  getSmallGap(cfg) {
    return this.randomRange(cfg.smallGapMin ?? 220, cfg.smallGapMax ?? 460);
  },

  /**
   * @returns {number}
   */
  getSmallSpawnStart() {
    return (this.character?.x || 0) + 500;
  },

  /**
   * @returns {void}
   */
  spawnRegularChickens() {
    const cfg = this.getEnemyConfig();
    const n = cfg.regCount || 3;
    let x = this.getRegularSpawnStart();
    for (let i = 0; i < n; i++) {
      const h = this.createRegularChicken(cfg);
      h.x = x;
      this.opponents.push(h);
      x += this.getRegularGap(cfg);
    }
  },

  /**
   * @param {object} cfg
   * @returns {Chicken}
   */
  createRegularChicken(cfg) {
    const h = new Chicken().setGround?.(this.groundY).placeOnGround?.();
    h.speed = this.randomRange(cfg.speedMin ?? 1.1, cfg.speedMax ?? 1.7);
    return h;
  },

  /**
   * @param {object} cfg
   * @returns {number}
   */
  getRegularGap(cfg) {
    return this.randomRange(cfg.gapMin ?? 260, cfg.gapMax ?? 520);
  },

  /**
   * @returns {number}
   */
  getRegularSpawnStart() {
    return (this.character?.x || 0) + 700;
  },

  /**
   * @returns {void}
   */
  spawnBoss() {
    if (this.bossSpawned) return;
    const b = this.createBoss();
    b.x = this.getBossSpawnX();
    this.opponents.push(b);
    this.markBossSpawned();
    this.playBossAudio();
  },

  /**
   * @returns {Endboss}
   */
  createBoss() {
    return new Endboss().setGround?.(this.groundY).placeOnGround?.();
  },

  /**
   * @returns {number}
   */
  getBossSpawnX() {
    const canvasWidth = this.canvas?.width || 1920;
    const cameraRight = (this.cameraX || 0) + canvasWidth;
    const offset = Math.max(800, canvasWidth * 0.8);
    return Math.max(cameraRight + 200, (this.character?.x || 0) + offset);
  },

  /**
   * @returns {void}
   */
  markBossSpawned() {
    this.bossSpawned = true;
    this.phase = "boss";
  },

  /**
   * @returns {void}
   */
  playBossAudio() {
    SFX.stop?.("chicken");
    this.ensureAudioState?.();
    SFX.play?.("rooster", { vol: 0.85 });
    this.updateRoosterSchedule();
  },

  /**
   * @returns {void}
   */
  updateRoosterSchedule() {
    if (!this.audio) return;
    this.audio.roosterLeft = 1 + Math.round(Math.random());
    this.audio.nextRooster =
      (this.elapsedMs || 0) + 8000 + Math.random() * 8000;
  },

  /**
   * @param {number} dtMs
   */
  updateOpponents(dtMs) {
    const bounds = this.getEnemyBounds();
    const far = this.getFarthestEnemyX();
    this.opponents.forEach((o) => this.updateOpponent(o, dtMs, bounds, far));
    this.opponents = this.opponents.filter((o) => !o._dead);
  },

  /**
   * @returns {{left:number, ahead:number}}
   */
  getEnemyBounds() {
    return {
      left: this.cameraX - 150,
      ahead: this.cameraX + this.canvas.width + 200,
    };
  },

  /**
   * @returns {number}
   */
  getFarthestEnemyX() {
    return Math.max(0, ...this.opponents.map((op) => op.x || 0));
  },

  /**
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
   * @param {Object} o
   */
  moveOpponent(o) {
    o.x -= o.speed ?? 0;
  },

  /**
   * @param {Object} o
   * @param {{left:number, ahead:number}} bounds
   * @param {number} far
   */
  respawnOpponentIfNeeded(o, bounds, far) {
    if (o.x + o.width >= bounds.left) return;
    if (this.shouldRemoveOpponent(o)) return;
    o.x = this._respawnX(bounds.ahead, far);
    this._rerollSpeed(o);
  },

  /**
   * @param {Object} o
   * @returns {boolean}
   */
  shouldRemoveOpponent(o) {
    if (o._phaseTransitionRemoval) return this.markOpponentDead(o);
    if (this.shouldRemoveForBossPending(o)) return this.markOpponentDead(o);
    return false;
  },

  /**
   * @param {Object} o
   * @returns {boolean}
   */
  shouldRemoveForBossPending(o) {
    return (
      this.bossPending && (o instanceof Chicken || o instanceof SmallChicken)
    );
  },

  /**
   * @param {Object} o
   * @returns {boolean}
   */
  markOpponentDead(o) {
    o._dead = true;
    return true;
  },

  /**
   * @param {number} ahead
   * @param {number} far
   * @returns {number}
   */
  _respawnX(ahead, far) {
    const gap = 260 + Math.random() * 460;
    return Math.max(ahead, far + gap);
  },

  /**
   * @param {Object} o
   */
  _rerollSpeed(o) {
    const cfg = this.getEnemyConfig();
    if (o instanceof SmallChicken) return this.applySmallSpeed(o, cfg);
    this.applyRegularSpeed(o, cfg);
  },

  /**
   * @param {Object} o
   * @param {object} cfg
   */
  applySmallSpeed(o, cfg) {
    const min = cfg.smallSpeedMin ?? 0.8;
    const max = cfg.smallSpeedMax ?? 1.3;
    o.speed = this.randomRange(min, max);
  },

  /**
   * @param {Object} o
   * @param {object} cfg
   */
  applyRegularSpeed(o, cfg) {
    const min = cfg.speedMin ?? 1.1;
    const max = cfg.speedMax ?? 1.7;
    o.speed = this.randomRange(min, max);
  },

  /**
   * @returns {object}
   */
  getEnemyConfig() {
    return this.cfg.enemies || {};
  },

  /**
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  randomRange(min, max) {
    return min + Math.random() * (max - min);
  },
});
