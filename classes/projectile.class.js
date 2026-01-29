class Projectile extends MovableObject {
  static CFG = {
    size: { w: 54, h: 74 },
    hitbox: { x: 6, y: 6, w: 32, h: 32 },
    baseVX: 6,
    baseVY: -4,
    gravity: 0.5,
    flyFrameMs: 90,
    splashFrameMs: 60,
    minFlyFrameMs: 40,
  };

  constructor(x, y, dir, opt = {}) {
    super();
    this.initBody(x, y);
    const mul = this.getSpeedMul(opt);
    this.initMotion(dir, mul, opt);
    this.initAnim();
    this.initTiming(mul);
    this.setStateFly();
  }

  /**
   * Initializes size, hitbox, and spawn position.
   * @param {number} x
   * @param {number} y
   */
  initBody(x, y) {
    const c = Projectile.CFG;
    this.setSize(c.size.w, c.size.h);
    this.setHitbox(c.hitbox.x, c.hitbox.y, c.hitbox.w, c.hitbox.h);
    this.x = x;
    this.y = y;
  }

  /**
   * Returns a safe speed multiplier.
   * @param {{speedMul?: number}} opt
   * @returns {number}
   */
  getSpeedMul(opt) {
    const mul = Number(opt?.speedMul ?? 1);
    return Number.isFinite(mul) ? Math.max(0.1, mul) : 1;
  }

  /**
   * Initializes projectile velocity and gravity.
   * @param {number} dir
   * @param {number} mul
   */
  initMotion(dir, mul, opt = {}) {
    const c = Projectile.CFG;
    const vyMul = this.getMul(opt?.vyMul, 1, 0.2, 3);
    const gravityMul = this.getMul(opt?.gravityMul, 1, 0.5, 2);
    this.vx = c.baseVX * dir * mul;
    this.vy = c.baseVY * mul * vyMul;
    this.gravity = c.gravity * gravityMul;
  }

  /**
   * Returns a clamped numeric multiplier.
   * @param {number} raw
   * @param {number} fallback
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  getMul(raw, fallback, min, max) {
    const v = Number(raw);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(min, Math.min(max, v));
  }

  /**
   * Loads animation frames for fly and splash.
   */
  initAnim() {
    this.framesFly = this.loadImages(this.getFlyFrames());
    this.framesSplash = this.loadImages(this.getSplashFrames());
  }

  /** @returns {string[]} */
  getFlyFrames() {
    return [
      "img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png",
      "img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png",
      "img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png",
      "img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png",
    ];
  }

  /** @returns {string[]} */
  getSplashFrames() {
    return [
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png",
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png",
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png",
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png",
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png",
      "img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png",
    ];
  }

  /**
   * Initializes animation timing.
   * @param {number} mul
   */
  initTiming(mul) {
    const c = Projectile.CFG;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.flyFrameMs = Math.max(c.minFlyFrameMs, c.flyFrameMs / mul);
    this.splashFrameMs = c.splashFrameMs;
  }

  /**
   * Sets projectile into fly state.
   */
  setStateFly() {
    this.state = "fly";
    this.img = this.framesFly[0];
    this.imageLoaded = true;
  }

  /**
   * Triggers splash animation and stops movement.
   * @param {number|null} groundY
   */
  hitAndSplash(groundY = null, target = null) {
    if (!this.canSplash()) return;
    if (target) {
      this.applySplashOnTarget(target);
    } else {
      this.applySplash(groundY);
    }
    this.playSplashSfx();
  }

  /**
   * Places splash on a target's bounds.
   * @param {Object} target
   */
  applySplashOnTarget(target) {
    const b = target.getBounds?.() || target;
    if (b && b.x != null && b.y != null && b.width != null && b.height != null) {
      this.state = "splash";
      this.vx = 0;
      this.vy = 0;
      this.frameIndex = 0;
      this.frameElapsedMs = 0;
      this.x = b.x + b.width / 2 - this.width / 2;
      this.y = b.y + b.height * 0.35 - this.height / 2;
      this.img = this.framesSplash[0];
      return;
    }
    this.applySplash(null);
  }

  /** @returns {boolean} */
  canSplash() {
    return this.state === "fly";
  }

  /** @param {number|null} groundY */
  applySplash(groundY) {
    this.state = "splash";
    this.vx = 0;
    this.vy = 0;
    if (groundY != null) this.y = groundY - this.height + 4;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.img = this.framesSplash[0];
  }

  /**
   * Plays splash sound effect if available.
   */
  playSplashSfx() {
    SFX.play?.("bottle_hit", { vol: 0.9 });
  }

  /**
   * Updates projectile physics and animation.
   * @param {number} dtMs
   */
  update(dtMs = 16) {
    if (this.isDead()) return;
    const k = dtMs / 16;
    if (this.state === "fly") return this.updateFly(dtMs, k);
    if (this.state === "splash") return this.updateSplash(dtMs);
  }

  /** @returns {boolean} */
  isDead() {
    return this.state === "dead" || this._dead === true;
  }

  /**
   * Fly state update (gravity, movement, looping animation).
   * @param {number} dtMs
   * @param {number} k
   */
  updateFly(dtMs, k) {
    this.vy += this.gravity * k;
    this.x += this.vx * k;
    this.y += this.vy * k;
    this.stepAnim(dtMs, this.flyFrameMs, this.framesFly, true);
  }

  /**
   * Splash state update (non-looping animation, then die).
   * @param {number} dtMs
   */
  updateSplash(dtMs) {
    const done = this.stepAnim(
      dtMs,
      this.splashFrameMs,
      this.framesSplash,
      false,
    );
    if (!done) return;
    this.state = "dead";
    this._dead = true;
  }

  /**
   * Steps animation frames by elapsed time.
   * @param {number} dtMs
   * @param {number} frameMs
   * @param {HTMLImageElement[]} frames
   * @param {boolean} loop
   * @returns {boolean} true if non-loop animation finished
   */
  stepAnim(dtMs, frameMs, frames, loop) {
    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs < frameMs) return false;
    this.frameElapsedMs = 0;
    return loop ? this.stepLoop(frames) : this.stepOnce(frames);
  }

  /** @param {HTMLImageElement[]} frames */
  stepLoop(frames) {
    this.frameIndex = (this.frameIndex + 1) % frames.length;
    this.img = frames[this.frameIndex];
    return false;
  }

  /** @param {HTMLImageElement[]} frames */
  stepOnce(frames) {
    this.frameIndex++;
    if (this.frameIndex >= frames.length) return true;
    this.img = frames[this.frameIndex];
    return false;
  }
}
window.Projectile = Projectile;
