// models/hud.class.js
class HUD {
  constructor() {
    const base = "img/7_statusbars/1_statusbar/1_statusbar_coin/green";
    this.left = 20; // linker Rand
    this.top = 26; // oberer Rand
    this.gap = 58; // Zeilenabstand
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

    this._row(ctx, this.bottleBar, x, y, this.counts.bottles); // 1. Reihe
    y += this.gap;

    this._row(ctx, this.healthBar, x, y, null); // 2. Reihe
    y += this.gap;

    this._row(ctx, this.coinBar, x, y, this.counts.coins); // 3. Reihe
  }

  _row(ctx, bar, x, y, count = null) {
    bar.setPos(x, y).draw(ctx);
    if (count != null) this._label(ctx, bar, count);
  }

  _label(ctx, bar, n) {
    ctx.save();
    ctx.font = this.font;
    ctx.fillStyle = "#000";
    ctx.fillText("×" + n, bar.x + bar.w + 16, bar.y + 20);
    ctx.restore();
  }
}
window.HUD = HUD;
