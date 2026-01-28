class Endboss extends MovableObject {
  /**
   * Creates a new boss instance.
   */
  constructor() {
    super();
    this.initDimensions();
    this.initCombat();
    this.initHealth();
    this.initState();
    this.initTiming();
    this.initFrames();
    this.setState("walk");
  }

  /**
   * Initializes size, speed, and hitbox settings.
   */
  initDimensions() {
    this.setSize(358, 358).setSpeed(1.0);
    this.footOffset = 18;
    this.setHitbox(40, 18, this.width - 80, this.height - 44);
  }

  /**
   * Initializes combat-related values.
   */
  initCombat() {
    this.dmg = 26;
    this.bumpVX = 3.5;
    this.bumpVY = -9;
  }

  /**
   * Initializes health values.
   */
  initHealth() {
    this.hpMax = 300;
    this.hp = this.hpMax;
  }

  /**
   * Initializes animation and state trackers.
   */
  initState() {
    this.state = "walk";
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.stateElapsedMs = 0;
  }

  /**
   * Initializes timers and frame pacing.
   */
  initTiming() {
    this.attackCooldown = 1200;
    this.attackTimer = 0;
    this.invT = 0;
    this.frameMs = { walk: 120, alert: 90, attack: 80, hurt: 110, dead: 160 };
    this.stateMinMs = { walk: 1200, alert: 2500 };
  }

  /**
   * Loads all animation frames.
   */
  initFrames() {
    const base = "img/4_enemie_boss_chicken";
    this.frames = {
      walk: this.loadImages(this.walkFrames(base)),
      alert: this.loadImages(this.alertFrames(base)),
      attack: this.loadImages(this.attackFrames(base)),
      hurt: this.loadImages(this.hurtFrames(base)),
      dead: this.loadImages(this.deadFrames(base)),
    };
  }

  /**
   * @param {string} base
   * @returns {string[]}
   */
  walkFrames(base) {
    return [
      `${base}/1_walk/G1.png`,
      `${base}/1_walk/G2.png`,
      `${base}/1_walk/G3.png`,
      `${base}/1_walk/G4.png`,
    ];
  }

  /**
   * @param {string} base
   * @returns {string[]}
   */
  alertFrames(base) {
    return [
      `${base}/2_alert/G5.png`,
      `${base}/2_alert/G6.png`,
      `${base}/2_alert/G7.png`,
      `${base}/2_alert/G8.png`,
      `${base}/2_alert/G9.png`,
      `${base}/2_alert/G10.png`,
      `${base}/2_alert/G11.png`,
      `${base}/2_alert/G12.png`,
    ];
  }

  /**
   * @param {string} base
   * @returns {string[]}
   */
  attackFrames(base) {
    return [
      `${base}/3_attack/G13.png`,
      `${base}/3_attack/G14.png`,
      `${base}/3_attack/G15.png`,
      `${base}/3_attack/G16.png`,
      `${base}/3_attack/G17.png`,
      `${base}/3_attack/G18.png`,
      `${base}/3_attack/G19.png`,
      `${base}/3_attack/G20.png`,
    ];
  }

  /**
   * @param {string} base
   * @returns {string[]}
   */
  hurtFrames(base) {
    return [
      `${base}/4_hurt/G21.png`,
      `${base}/4_hurt/G22.png`,
      `${base}/4_hurt/G23.png`,
    ];
  }

  /**
   * @param {string} base
   * @returns {string[]}
   */
  deadFrames(base) {
    return [
      `${base}/5_dead/G24.png`,
      `${base}/5_dead/G25.png`,
      `${base}/5_dead/G26.png`,
    ];
  }

  /**
   * @param {string} s
   */
  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.resetFrameState();
    this.applyStateSprite(s);
    this.applyStateEffects(s);
  }

  /**
   * @private
   */
  resetFrameState() {
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.stateElapsedMs = 0;
  }

  /**
   * @param {string} s
   * @private
   */
  applyStateSprite(s) {
    const arr = this.frames?.[s];
    if (arr?.length) this.img = arr[0];
  }

  /**
   * @param {string} s
   * @private
   */
  applyStateEffects(s) {
    if (s === "attack") this.armAttack();
    if (s === "hurt") this.invT = 500;
  }

  /**
   * Prepares attack movement settings.
   */
  armAttack() {
    this.chargeVel = 3.5;
    this.attackTimer = 600;
  }

  /**
   * Updates facing/flip and returns distance to player center.
   * @param {World} world
   * @returns {number}
   */
  updateFacing(world) {
    const c = world.character;
    if (!c) return 0;
    const dist = c.x + c.width / 2 - (this.x + this.width / 2);
    this.otherDirection = dist >= 0;
    return dist;
  }

  /**
   * Applies damage to the boss.
   * @param {number} dmg
   */
  onHit(dmg = 20) {
    if (this.state === "dead" || this.invT > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) return this.die();
    this.setState("hurt");
  }

  /**
   * Handles boss death and triggers win state.
   */
  die() {
    this.setState("dead");
    SFX.play?.("rooster", { vol: 0.9 });
    this._deadline = 800;
    setTimeout(() => window.world?.triggerGameOver?.("win"), 1000);
  }

  /**
   * Returns current health as percentage (0–100).
   * @returns {number}
   */
  hpPercent() {
    const current = this.hp ?? 0;
    const max = this.hpMax ?? 300;
    const pct = (100 * current) / max;
    return Math.max(0, Math.min(100, pct));
  }

  /**
   * @param {World} world
   * @param {number} dtMs
   */
  updateBoss(world, dtMs = 16) {
    this.updateInvulnerability(dtMs);
    const dist = this.updateFacing(world);
    this.stateElapsedMs += dtMs;
    this.updateState(world, dist, dtMs);
    this.animateState(dtMs);
  }

  /**
   * @param {number} dtMs
   */
  updateInvulnerability(dtMs) {
    if (this.invT > 0) this.invT = Math.max(0, this.invT - dtMs);
  }

  /**
   * @param {World} world
   * @param {number} dist
   * @param {number} dtMs
   */
  updateState(world, dist, dtMs) {
    const k = this.getFrameScale(dtMs);
    if (this.state === "walk") return this.updateWalk(dist, dtMs, k);
    if (this.state === "alert") return this.updateAlert(dist, dtMs, k);
    if (this.state === "attack") return this.updateAttack(dist, dtMs, k);
    if (this.state === "hurt") return this.updateHurt(dist, k);
    if (this.state === "dead") return this.updateDead(dtMs);
  }

  /**
   * @param {number} dtMs
   * @returns {number}
   */
  getFrameScale(dtMs) {
    return dtMs / 16;
  }

  /**
   * @param {number} dist
   * @param {number} dtMs
   * @param {number} k
   */
  updateWalk(dist, dtMs, k) {
    const moveDir = dist >= 0 ? 1 : -1;
    this.x += this.speed * moveDir * k * 2.8;
    if (Math.abs(dist) < 550 && this.stateElapsedMs >= this.stateMinMs.walk)
      this.setState("alert");
    this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
  }

  /**
   * @param {number} dist
   * @param {number} dtMs
   * @param {number} k
   */
  updateAlert(dist, dtMs, k) {
    const moveDir = dist >= 0 ? 1 : -1;
    if (this.canAttack(dist)) {
      this.setState("attack");
      this.attackCooldown = 1200;
      return;
    }
    this.x += this.speed * 1.0 * moveDir * k * 2.5;
    this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
    if (Math.abs(dist) > 600) this.setState("walk");
  }

  /**
   * @param {number} dist
   * @returns {boolean}
   */
  canAttack(dist) {
    return (
      this.attackCooldown === 0 &&
      Math.abs(dist) < 300 &&
      this.stateElapsedMs >= this.stateMinMs.alert
    );
  }

  /**
   * @param {number} dist
   * @param {number} dtMs
   * @param {number} k
   */
  updateAttack(dist, dtMs, k) {
    const moveDir = dist >= 0 ? 1 : -1;
    this.x += (this.chargeVel || 3) * moveDir * k * 2;
    this.attackTimer -= dtMs;
    if (this.attackTimer <= 0) this.setState("alert");
  }

  /**
   * @param {number} dist
   * @param {number} k
   */
  updateHurt(dist, k) {
    const moveDir = dist >= 0 ? 1 : -1;
    this.x -= 0.6 * moveDir * k * 2;
    if (this.invT === 0) this.setState(Math.abs(dist) > 450 ? "walk" : "alert");
  }

  /**
   * @param {number} dtMs
   */
  updateDead(dtMs) {
    if (this._deadline == null) return;
    this._deadline -= dtMs;
    if (this._deadline <= 0) this._dead = true;
  }

  /**
   * @param {number} dtMs
   */
  animateState(dtMs) {
    const arr = this.frames?.[this.state];
    if (!arr?.length) return;
    if (!this.isNextFrameDue(dtMs)) return;
    this.advanceFrameIndex(arr);
    this.img = arr[this.frameIndex];
  }

  /**
   * @param {number} dtMs
   * @returns {boolean}
   */
  isNextFrameDue(dtMs) {
    this.frameElapsedMs += dtMs;
    const ms = this.frameMs?.[this.state] || 100;
    if (this.frameElapsedMs < ms) return false;
    this.frameElapsedMs = 0;
    return true;
  }

  /**
   * @param {any[]} arr
   */
  advanceFrameIndex(arr) {
    if (this.state === "dead") return this.advanceDeadFrame(arr);
    this.frameIndex = (this.frameIndex + 1) % arr.length;
  }

  /**
   * @param {any[]} arr
   */
  advanceDeadFrame(arr) {
    this.frameIndex = Math.min(this.frameIndex + 1, arr.length - 1);
  }
}

window.Endboss = Endboss;
