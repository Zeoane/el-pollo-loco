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
});
