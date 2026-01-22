class StatusBar extends MovableObject {
  width = 160;
  height = 50;
  percentage = 100;

  /**
   * @param {string} basePath
   * @param {string} iconPath
   * @param {string} [prefix]
   */
  constructor(basePath, iconPath, prefix = "") {
    super();
    this.IMAGES = this.buildImages(basePath, prefix);
    this.loadImages(this.IMAGES);
    this.set(100);
    this.icon = this.createIcon(iconPath);
  }

  /**
   * @param {string} basePath
   * @param {string} prefix
   * @returns {string[]}
   */
  buildImages(basePath, prefix) {
    const prefixPart = prefix ? `${prefix}` : "";
    return [0, 20, 40, 60, 80, 100].map((pct) =>
      prefixPart
        ? `${basePath}/${prefixPart}${pct}.png`
        : `${basePath}/${pct}.png`,
    );
  }

  /**
   * @param {string} iconPath
   * @returns {HTMLImageElement}
   */
  createIcon(iconPath) {
    const icon = new Image();
    icon.src = iconPath;
    return icon;
  }

  /**
   * @param {number} percentage
   */
  set(percentage) {
    this.percentage = percentage;
    const path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  /**
   * @returns {number}
   */
  resolveImageIndex() {
    if (this.percentage >= 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {StatusBar}
   */
  setPos(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.icon?.complete) {
      ctx.drawImage(this.icon, this.x - 36, this.y + 10, 28, 28);
    }
    if (this.img)
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

class HUD {
  /**
   * Creates a new HUD instance.
   */
  constructor() {
    this.left = 12;
    this.top = 18;
    this.gap = 32;
    this.font = "700 16px system-ui,sans-serif";
    this.initBars();
    this.counts = { coins: 0, bottles: 0 };
  }

  /**
   * Initializes all HUD bars.
   */
  initBars() {
    const bases = this.getBarBases();
    this.initPlayerBars(bases);
    this.initEndbossBar();
  }

  /**
   * @returns {{coin: string, bottle: string, health: string}}
   */
  getBarBases() {
    return {
      coin: "img/7_statusbars/1_statusbar/1_statusbar_coin/green",
      bottle: "img/7_statusbars/1_statusbar/3_statusbar_bottle/green",
      health: "img/7_statusbars/1_statusbar/2_statusbar_health/green",
    };
  }

  /**
   * @param {{coin: string, bottle: string, health: string}} bases
   */
  initPlayerBars(bases) {
    this.coinBar = new StatusBar(
      bases.coin,
      "img/7_statusbars/3_icons/icon_coin.png",
    );
    this.bottleBar = new StatusBar(
      bases.bottle,
      "img/7_statusbars/3_icons/icon_salsa_bottle.png",
    );
    this.healthBar = new StatusBar(
      bases.health,
      "img/7_statusbars/3_icons/icon_health.png",
    );
  }

  /**
   * @returns {void}
   */
  initEndbossBar() {
    const endbossBase = "img/7_statusbars/2_statusbar_endboss/orange";
    this.endbossBar = new StatusBar(
      endbossBase,
      "img/7_statusbars/3_icons/icon_health_endboss.png",
      "orange",
    );
  }

  /**
   * @param {World} world
   */
  sync(world) {
    const inv = this.getInventory(world);
    const cfg = this.getConfig(world);
    this.updateBars(world, inv, cfg);
    this.updateCounts(inv);
  }

  /**
   * @param {World} world
   * @returns {object}
   */
  getInventory(world) {
    return world.inventory || {};
  }

  /**
   * @param {World} world
   * @returns {object}
   */
  getConfig(world) {
    return world.cfg || {};
  }

  /**
   * @param {World} world
   * @param {object} inv
   * @param {object} cfg
   */
  updateBars(world, inv, cfg) {
    const hpPct = world.character?.hpPercent?.() ?? 100;
    this.coinBar.set((100 * (inv.coins || 0)) / (cfg.items?.coins || 10));
    this.bottleBar.set((100 * (inv.bottles || 0)) / (cfg.items?.bottles || 5));
    this.healthBar.set(hpPct);
    this.updateEndbossBar(world);
  }

  /**
   * @param {World} world
   */
  updateEndbossBar(world) {
    const endboss = this.getEndboss(world);
    if (!endboss) return;
    const endbossHpPct = endboss.hpPercent?.() ?? 100;
    this.endbossBar.set(endbossHpPct);
  }

  /**
   * @param {World} world
   * @returns {Endboss|null}
   */
  getEndboss(world) {
    if (!world.bossSpawned) return null;
    return (
      world.opponents?.find((o) => o instanceof Endboss && !o._dead) || null
    );
  }

  /**
   * @param {object} inv
   */
  updateCounts(inv) {
    this.counts.coins = inv.coins || 0;
    this.counts.bottles = inv.bottles || 0;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {World} world
   */
  draw(ctx, world) {
    this.sync(world);
    let x = this.left;
    let y = this.top;
    y = this.drawEndbossRow(ctx, world, x, y);
    y = this.drawBottleRow(ctx, x, y);
    y = this.drawHealthRow(ctx, world, x, y);
    this.drawCoinRow(ctx, x, y);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {World} world
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  drawEndbossRow(ctx, world, x, y) {
    const endboss = this.getEndboss(world);
    if (!endboss) return y;
    const endbossHpPct = Math.round(endboss.hpPercent?.() ?? 100);
    this._row(ctx, this.endbossBar, x, y, endbossHpPct + "%");
    return y + this.gap;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  drawBottleRow(ctx, x, y) {
    this._row(ctx, this.bottleBar, x, y, "×" + this.counts.bottles);
    return y + this.gap;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {World} world
   * @param {number} x
   * @param {number} y
   * @returns {number}
   */
  drawHealthRow(ctx, world, x, y) {
    const hpPct = Math.round(world.character?.hpPercent?.() ?? 100);
    this._row(ctx, this.healthBar, x, y, hpPct + "%");
    return y + this.gap;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   */
  drawCoinRow(ctx, x, y) {
    this._row(ctx, this.coinBar, x, y, "×" + this.counts.coins);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {StatusBar} bar
   * @param {number} x
   * @param {number} y
   * @param {string|null} labelText
   */
  _row(ctx, bar, x, y, labelText = null) {
    bar.setPos(x, y).draw(ctx);
    if (labelText !== null) this._drawLabel(ctx, bar, labelText);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {StatusBar} bar
   * @param {string} text
   */
  _drawLabel(ctx, bar, text) {
    ctx.save();
    ctx.font = this.font;
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 4;
    ctx.fillText(text, bar.x + bar.width + 10, bar.y + 35);
    ctx.restore();
  }
}

window.StatusBar = StatusBar;
window.HUD = HUD;
