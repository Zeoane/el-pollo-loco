// models/statusbar.class.js
(() => {
  if (window.StatusBar) return; 

  class StatusBar {
    constructor(folder, iconPath, x, y, w = 228, h = 28) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.value = 100; this.idx = 5; this.iconSize = 30;

      // Frames 0..100 in 20er-Schritten laden
      this.frames = [0,20,40,60,80,100].map(p => {
        const im = new Image(); im.src = `${folder}/${p}.png`; return im;
      });

      this.icon = new Image(); this.icon.src = iconPath;
    }

    set(v) {                
      v = v|0; v = Math.max(0, Math.min(100, v));
      this.value = v; this.idx = Math.round(v / 20);
    }

    setPos(x, y) { this.x = x; this.y = y; } // optional

    draw(ctx) {
      const bar = this.frames[this.idx];
      if (bar?.complete && bar.naturalWidth)
        ctx.drawImage(bar, this.x + 40, this.y, this.w, this.h);

      const ic = this.icon;
      if (ic?.complete && ic.naturalWidth)
        ctx.drawImage(ic, this.x, this.y - 6, this.iconSize, this.iconSize);
    }
  }

  window.StatusBar = StatusBar;
})();
