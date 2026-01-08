// background-object.class.js
class BackgroundObject extends MovableObject {
  constructor(folder, y = 0, h = null, flow = 0, parallax = 0) {
    super();
    this.x = 0;
    this.y = y;
    this.height = h;
    this.flowSpeed = flow;
    this.parallax = parallax;
    this._flow = 0;
    this._tileW = 0;
    this._tileH = 0;

    this.tiles = [];
    this.fallback = new Image();
    this._loadTiles(folder);
  }

  _loadTiles(folder) {
    ["1.png", "2.png"].forEach((n) => {
      const img = new Image();
      img.onload = () => {
        img._ok = true;
      };
      img.onerror = () => {};
      img.src = `${folder}/${n}`;
      this.tiles.push(img);
    });
    this.fallback.onload = () => {
      this.fallback._ok = true;
    };
    this.fallback.onerror = () => {};
    this.fallback.src = `${folder}/full.png`;
  }

  _activeA() {
    return (
      this.tiles.find((t) => t._ok && t.naturalWidth > 0) ||
      (this.fallback._ok ? this.fallback : null)
    );
  }
  _activeB(A) {
    const b = this.tiles.find((t) => t !== A && t._ok && t.naturalWidth > 0);
    return b || A;
  }


  _ensureDims(ctx, img) {
    const H = this.height ?? ctx.canvas.height;
    const s = H / (img.naturalHeight || H);
    let W = (img.naturalWidth || H) * s;

    if (!this._tileW || !this._tileH) {
        this._tileW = Math.max(2, Math.round(W / 2) * 2); 
        this._tileH = Math.max(1, Math.round(H));
    }
}

  update(cameraX, canvas, dtMs = 16) {
    if (this.flowSpeed === 0) {
      if (this._flow !== 0) this._flow = 0;
      return;
    }
    const k = (dtMs || 16) / 16;
    this._flow += this.flowSpeed * k;
  }


draw(ctx, cameraX = 0) {
    const A = this._activeA(); 
    if (!A) return;
    this._ensureDims(ctx, A);
    
    const W = this._tileW;
    const H = this._tileH;
    if (!(W > 1)) return;

    const par = Math.max(0, Math.min(1, this.parallax || 0));
    const flow = this.flowSpeed === 0 ? 0 : this._flow || 0;
    const totalPos = (cameraX * par) + flow;
    const off = -((totalPos % W) + W) % W;
    const startIdx = Math.floor(totalPos / W);

    ctx.save();
    ctx.translate(Math.floor(off), 0);

    for (let i = -1; i <= Math.ceil(ctx.canvas.width / W) + 1; i++) {
        const x = i * W;
        const worldIdx = startIdx + i;
        const isMirrored = Math.abs(worldIdx) % 2 !== 0;

        if (isMirrored) {
            ctx.save();
            ctx.translate(x + W, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(A, 0, this.y, W + 1, H);
            ctx.restore();
        } else {
            ctx.drawImage(A, x, this.y, W + 1, H);
        }
    }
    ctx.restore();
}
}

class SkyLayer extends MovableObject {
  constructor(path, parallax = 0.0, y = 0, h = null) {
    super();
    this.y = y;
    this.h = h;
    this.parallax = parallax;

    this.img = new Image();
    this._ok = false;
    this.img.onload = () => {
      this._ok = true;
    };
    this.img.onerror = (e) => {
      console.error("[SkyLayer] failed:", path, e);
      this.img._broken = true;
    };
    this.img.src = path;

    this._tileW = 0;
    this._tileH = 0;
  }

  update(/*camX, canvas, dtMs, moving*/) {}

  _ensureDims(ctx) {
    const H = this.h ?? ctx.canvas.height;
    const s = H / (this.img.naturalHeight || H);
    const W = (this.img.naturalWidth || H) * s;
    if (!this._tileW || !this._tileH) {
      this._tileW = Math.max(1, Math.round(W));
      this._tileH = Math.max(1, Math.round(H));
    }
  }

  draw(ctx, cameraX = 0) {
    if (!this._ok) return;

    this._ensureDims(ctx);
    const W = this._tileW,
      H = this._tileH;
    const par = Math.max(0, Math.min(1, this.parallax || 0));
    const off = -((((cameraX * par) % W) + W) % W);

    ctx.save();
    ctx.translate(off, 0);
    for (let x = -W; x < ctx.canvas.width + W; x += W) {
      ctx.drawImage(this.img, Math.round(x) - 0.5, this.y, W + 1, H);
    }
    ctx.restore();
  }
}

class CloudLayer extends BackgroundObject {
  constructor(
    folder = "img/5_background/layers/4_clouds",
    y = 0,
    h = null,
    flow = 0.06,
    parallax = 0.05
  ) {
    super(folder, y, h, flow, parallax);
  }
}

const BackgroundLayers = {
  defaultSet() {
    return [
      new SkyLayer("img/5_background/layers/air.png", 0.0),
      new CloudLayer("img/5_background/layers/4_clouds", 0, null, 0.06, 0.05),
      new BackgroundObject(
        "img/5_background/layers/3_third_layer",
        0,
        null,
        0,
        0.15
      ),
      new BackgroundObject(
        "img/5_background/layers/2_second_layer",
        0,
        null,
        0,
        0.3
      ),
      new BackgroundObject(
        "img/5_background/layers/1_first_layer",
        0,
        null,
        0,
        0.6
      ),
    ];
  },
};
window.BackgroundLayers = BackgroundLayers;
