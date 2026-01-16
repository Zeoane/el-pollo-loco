// classes/statusbar.class.js
class StatusBar extends MovableObject {
  width = 160;
  height = 50;
  percentage = 100;

  constructor(basePath, iconPath) {
    super();
    this.IMAGES = [0, 20, 40, 60, 80, 100].map(
      (pct) => `${basePath}/${pct}.png`
    );
    this.loadImages(this.IMAGES);
    this.set(100);
  }

  set(percentage) {
    this.percentage = percentage;
    let path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
  }

  resolveImageIndex() {
    if (this.percentage >= 100) return 5;
    if (this.percentage >= 80) return 4;
    if (this.percentage >= 60) return 3;
    if (this.percentage >= 40) return 2;
    if (this.percentage >= 20) return 1;
    return 0;
  }

  setPos(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  draw(ctx) {
    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }
}

class HUD {
  constructor() {
    const base = "img/7_statusbars/1_statusbar/1_statusbar_coin/green";
    this.left = 20;
    this.top = 26;
    this.gap = 58;
    this.font = "700 16px system-ui,sans-serif";

    this.coinBar = new StatusBar(
      base,
      "img/7_statusbars/3_icons/icon_coin.png"
    );
    this.bottleBar = new StatusBar(
      base,
      "img/7_statusbars/3_icons/icon_salsa_bottle.png"
    );
    this.healthBar = new StatusBar(
      base,
      "img/7_statusbars/3_icons/icon_health.png"
    );

    this.counts = { coins: 0, bottles: 0 };
  }

  sync(world) {
    const inv = world.inventory || {},
      cfg = world.cfg || {};
    const hpPct = world.character?.hpPercent?.() ?? 100;
    this.coinBar.set((100 * (inv.coins || 0)) / (cfg.items?.coins || 10));
    this.bottleBar.set((100 * (inv.bottles || 0)) / (cfg.items?.bottles || 5));
    this.healthBar.set(hpPct);
    this.counts.coins = inv.coins || 0;
    this.counts.bottles = inv.bottles || 0;
  }


  draw(ctx, world) {
    this.sync(world);
    let x = this.left,
      y = this.top;

    this._row(ctx, this.bottleBar, x, y, "×" + this.counts.bottles);
    y += this.gap;

    const hpPct = Math.round(world.character?.hpPercent?.() ?? 100);
    this._row(ctx, this.healthBar, x, y, hpPct + "%");
    y += this.gap;
    this._row(ctx, this.coinBar, x, y, "×" + this.counts.coins);
  }

  _row(ctx, bar, x, y, labelText = null) {
    bar.setPos(x, y).draw(ctx);
    if (labelText !== null) {
      this._drawLabel(ctx, bar, labelText);
    }
  }

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
