// models/statusbar.class.js
class StatusBar {
  constructor(folder, iconPath, w = 260, h = 28) {
    this.x = 0; this.y = 0; this.w = w; this.h = h; this.value = 100;
    this.steps = [0, 20, 40, 60, 80, 100];
    this.frames = this.steps.map(p => {
      const im = new Image(); im.src = `${folder}/${p}.png`; return { p, im };
    });
    this.icon = new Image(); this.icon.src = iconPath;
    this.iconSize = 28;
  }
  setPos(x, y) { this.x = x; this.y = y; return this; }
  set(v) { this.value = Math.max(0, Math.min(100, v)); }
  _frame() {
    let best = 0;
    for (const s of this.steps) if (Math.abs(this.value - s) < Math.abs(this.value - best)) best = s;
    return this.frames.find(f => f.p === best)?.im;
  }
  draw(ctx) {
    const f = this._frame();
    if (f?.complete) ctx.drawImage(f, this.x + 40, this.y, this.w, this.h);
    const iy = this.y + (this.h - this.iconSize) / 2 - 2;
    if (this.icon?.complete) ctx.drawImage(this.icon, this.x, iy, this.iconSize, this.iconSize);
  }
}
window.StatusBar = StatusBar;
