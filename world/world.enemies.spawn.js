Object.assign(World.prototype, {
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
