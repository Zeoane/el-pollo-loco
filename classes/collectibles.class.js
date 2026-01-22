class Coin extends MovableObject {
  static CFG = {
    size: { w: 52, h: 52 },
    hitbox: { x: 8, y: 8, w: 36, h: 36 },
    animEveryMs: 140,
    minAnimFrames: 2,
  };

  static IMG = [
    "img/8_coin/coin_1.png",
    "img/8_coin/coin_2.png",
    "img/7_statusbars/3_icons/icon_coin.png",
  ];

  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.initBody(x, y);
    this.initVisual();
    this.initAnim();
  }

  /** @param {number} x @param {number} y */
  initBody(x, y) {
    const c = Coin.CFG;
    this.x = x;
    this.y = y;
    this.setSize(c.size.w, c.size.h);
    this.setHitbox(c.hitbox.x, c.hitbox.y, c.hitbox.w, c.hitbox.h);
  }

  /**
   * Loads frames and sets initial image.
   */
  initVisual() {
    this.frames = this.loadImages(Coin.IMG);
    this.img = this.frames[0];
    this.imageLoaded = true;
  }

  /**
   * Initializes animation counters.
   */
  initAnim() {
    this.frameIndex = 0;
    this.animMs = 0;
    this.animEvery = Coin.CFG.animEveryMs;
  }

  /**
   * Updates coin animation.
   * @param {number} dtMs
   */
  update(dtMs = 16) {
    this.animMs += dtMs;
    if (this.animMs < this.animEvery) return;
    this.animMs = 0;
    this.stepFrame();
  }

  /**
   * Advances the animation frame.
   */
  stepFrame() {
    const len = this.getAnimLen();
    this.frameIndex = (this.frameIndex + 1) % len;
    this.img = this.frames[this.frameIndex] || this.frames[0];
  }

  /** @returns {number} */
  getAnimLen() {
    return Math.max(Coin.CFG.minAnimFrames, this.frames.length);
  }

  /**
   * Spawns a random coin within world bounds.
   * @param {World} w
   * @returns {Coin}
   */
  static rand(w) {
    const x = Coin.randX(w);
    const y = Coin.randY(w);
    return new Coin(x, y);
  }

  /** @param {World} w @returns {number} */
  static randX(w) {
    const len = w?.cfg?.lengthPx || 5000;
    const span = Math.max(200, len - 800);
    return 600 + Math.random() * span;
  }

  /** @param {World} w @returns {number} */
  static randY(w) {
    return w.groundY - 120 - Math.random() * 80;
  }
}

class Bottle extends MovableObject {
  static CFG = {
    size: { w: 52, h: 74 },
    hitbox: { x: 10, y: 12, w: 32, h: 44 },
    groundOffsetY: 60,
  };

  static IMG = {
    v1: "img/6_salsa_bottle/1_salsa_bottle_on_ground.png",
    v2: "img/6_salsa_bottle/2_salsa_bottle_on_ground.png",
    fallback: "img/7_statusbars/3_icons/icon_salsa_bottle.png",
  };

  /**
   * @param {number} x
   * @param {number} y
   * @param {1|2} [variant]
   */
  constructor(x, y, variant) {
    super();
    this.initBody(x, y);
    this.initVisual(variant);
    this.applyHitbox();
  }

  /** @param {number} x @param {number} y */
  initBody(x, y) {
    const c = Bottle.CFG;
    this.setSize(c.size.w, c.size.h);
    this.x = x;
    this.y = y;
  }

  /** @param {1|2} [variant] */
  initVisual(variant) {
    const path = this.getVariantPath(variant);
    this.loadImageFromCandidates([path, Bottle.IMG.fallback]);
  }

  /** @param {1|2} [variant] @returns {string} */
  getVariantPath(variant) {
    const v = variant ?? (Math.random() < 0.5 ? 1 : 2);
    return v === 1 ? Bottle.IMG.v1 : Bottle.IMG.v2;
  }

  /**
   * Applies bottle hitbox.
   */
  applyHitbox() {
    const h = Bottle.CFG.hitbox;
    this.setHitbox(h.x, h.y, h.w, h.h);
  }

  update(/* dtMs */) {}

  /**
   * Spawns a random bottle within world bounds.
   * @param {World} w
   * @returns {Bottle}
   */
  static rand(w) {
    const x = Coin.randX(w);
    const y = w.groundY - Bottle.CFG.groundOffsetY;
    return new Bottle(x, y);
  }
}

window.Coin = Coin;
window.Bottle = Bottle;
