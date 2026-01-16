// classes/background-object.class.js

/**
 * Represents a scrolling background object using tiled images.
 * Supports parallax movement and optional horizontal flow.
 */
class BackgroundObject extends MovableObject {
  /**
   * @param {string} folder - Folder path containing layer images
   * @param {number} [y=0] - Vertical offset
   * @param {number|null} [h=null] - Optional fixed height
   * @param {number} [flow=0] - Horizontal flow speed
   * @param {number} [parallax=0] - Parallax factor (0..1)
   */
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

  /**
   * Loads tile images and fallback image from a folder.
   * @param {string} folder
   */
  _loadTiles(folder) {
    ["1.png", "2.png"].forEach((n) => this._loadTile(`${folder}/${n}`));
    this._loadFallback(`${folder}/full.png`);
  }

  /**
   * Loads one tile image.
   * @param {string} path
   */
  _loadTile(path) {
    const img = new Image();
    img.onload = () => (img._ok = true);
    img.onerror = () => {};
    img.src = path;
    this.tiles.push(img);
  }

  /**
   * Loads the fallback "full.png" image.
   * @param {string} path
   */
  _loadFallback(path) {
    this.fallback.onload = () => (this.fallback._ok = true);
    this.fallback.onerror = () => {};
    this.fallback.src = path;
  }

  /**
   * Returns the primary active tile image.
   * @returns {HTMLImageElement|null}
   */
  _activeA() {
    return (
      this.tiles.find((t) => t._ok && t.naturalWidth > 0) ||
      (this.fallback._ok ? this.fallback : null)
    );
  }

  /**
   * Returns a secondary active tile image (if available).
   * @param {HTMLImageElement} A
   * @returns {HTMLImageElement}
   */
  _activeB(A) {
    const b = this.tiles.find((t) => t !== A && t._ok && t.naturalWidth > 0);
    return b || A;
  }

  /**
   * Ensures tile dimensions are calculated based on canvas size.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   */
  _ensureDims(ctx, img) {
    if (this._tileW && this._tileH) return;
    const H = this.height ?? ctx.canvas.height;
    const s = H / (img.naturalHeight || H);
    const W = (img.naturalWidth || H) * s;
    this._tileW = Math.max(2, Math.round(W / 2) * 2);
    this._tileH = Math.max(1, Math.round(H));
  }

  /**
   * Updates horizontal flow offset.
   * @param {number} cameraX
   * @param {HTMLCanvasElement} canvas
   * @param {number} [dtMs=16]
   */
  update(cameraX, canvas, dtMs = 16) {
    if (this.flowSpeed === 0) return this._resetFlow();
    const k = (dtMs || 16) / 16;
    this._flow += this.flowSpeed * k;
  }

  /**
   * Resets flow offset to zero.
   */
  _resetFlow() {
    if (this._flow !== 0) this._flow = 0;
  }

  /**
   * Draws the tiled background layer.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} [cameraX=0]
   */
  draw(ctx, cameraX = 0) {
    const img = this._activeA();
    if (!img) return;
    this._ensureDims(ctx, img);
    if (!(this._tileW > 1)) return;
    this._drawTiles(ctx, img, cameraX);
  }

  /**
   * Draws all tiles with parallax + flow offset.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   * @param {number} cameraX
   */
  _drawTiles(ctx, img, cameraX) {
    const off = this._getScrollOffset(cameraX);
    const start = this._getStartIndex(cameraX);
    ctx.save();
    ctx.translate(Math.floor(off), 0);
    this._drawTileRange(ctx, img, start);
    ctx.restore();
  }

  /**
   * Draws visible tile range.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   * @param {number} startIdx
   */
  _drawTileRange(ctx, img, startIdx) {
    const count = Math.ceil(ctx.canvas.width / this._tileW) + 1;
    for (let i = -1; i <= count; i++) {
      this._drawSingleTile(ctx, img, i, startIdx + i);
    }
  }

  /**
   * Draws a single tile, mirrored every second tile index.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   * @param {number} i
   * @param {number} worldIdx
   */
  _drawSingleTile(ctx, img, i, worldIdx) {
    const x = i * this._tileW;
    if (Math.abs(worldIdx) % 2) return this._drawMirrored(ctx, img, x);
    ctx.drawImage(img, x, this.y, this._tileW + 1, this._tileH);
  }

  /**
   * Draws a mirrored tile image.
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   * @param {number} x
   */
  _drawMirrored(ctx, img, x) {
    ctx.save();
    ctx.translate(x + this._tileW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, this.y, this._tileW + 1, this._tileH);
    ctx.restore();
  }

  /**
   * Returns the scroll offset for the current camera position.
   * @param {number} cameraX
   * @returns {number}
   */
  _getScrollOffset(cameraX) {
    const total = this._getTotalPos(cameraX);
    return -((total % this._tileW) + this._tileW) % this._tileW;
  }

  /**
   * Returns start tile index for the current camera position.
   * @param {number} cameraX
   * @returns {number}
   */
  _getStartIndex(cameraX) {
    return Math.floor(this._getTotalPos(cameraX) / this._tileW);
  }

  /**
   * Computes total scroll position (parallax + flow).
   * @param {number} cameraX
   * @returns {number}
   */
  _getTotalPos(cameraX) {
    const par = Math.max(0, Math.min(1, this.parallax || 0));
    const flow = this.flowSpeed === 0 ? 0 : this._flow || 0;
    return cameraX * par + flow;
  }
}

/**
 * Represents a static sky background layer.
 */
class SkyLayer extends MovableObject {
  /**
   * @param {string} path - Image path
   * @param {number} [parallax=0.0] - Parallax factor
   * @param {number} [y=0] - Vertical offset
   * @param {number|null} [h=null] - Optional fixed height
   */
  constructor(path, parallax = 0.0, y = 0, h = null) {
    super();
    this.y = y;
    this.h = h;
    this.parallax = parallax;
    this._tileW = 0;
    this._tileH = 0;
    this._ok = false;
    this._loadImage(path);
  }

  /**
   * Loads sky image.
   * @param {string} path
   */
  _loadImage(path) {
    this.img = new Image();
    this.img.onload = () => (this._ok = true);
    this.img.onerror = (e) => this._onError(path, e);
    this.img.src = path;
  }

  /**
   * Handles image loading errors.
   * @param {string} path
   * @param {any} e
   */
  _onError(path, e) {
    console.error("[SkyLayer] failed:", path, e);
    this.img._broken = true;
  }

  /**
   * Updates sky layer (no-op).
   */
  update() {}

  /**
   * Draws the sky layer.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} [cameraX=0]
   */
  draw(ctx, cameraX = 0) {
    if (!this._ok) return;
    this._ensureDims(ctx);
    this._drawTiles(ctx, cameraX);
  }

  /**
   * Ensures sky tile dimensions.
   * @param {CanvasRenderingContext2D} ctx
   */
  _ensureDims(ctx) {
    if (this._tileW && this._tileH) return;
    const H = this.h ?? ctx.canvas.height;
    const s = H / (this.img.naturalHeight || H);
    const W = (this.img.naturalWidth || H) * s;
    this._tileW = Math.max(1, Math.round(W));
    this._tileH = Math.max(1, Math.round(H));
  }

  /**
   * Draws repeated sky tiles across the canvas width.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX
   */
  _drawTiles(ctx, cameraX) {
    const off = this._getOffset(cameraX);
    ctx.save();
    ctx.translate(off, 0);
    this._drawStrip(ctx);
    ctx.restore();
  }

  /**
   * Draws a continuous strip of sky tiles.
   * @param {CanvasRenderingContext2D} ctx
   */
  _drawStrip(ctx) {
    for (let x = -this._tileW; x < ctx.canvas.width + this._tileW; x += this._tileW) {
      ctx.drawImage(this.img, Math.round(x) - 0.5, this.y, this._tileW + 1, this._tileH);
    }
  }

  /**
   * Computes horizontal offset based on parallax.
   * @param {number} cameraX
   * @returns {number}
   */
  _getOffset(cameraX) {
    const par = Math.max(0, Math.min(1, this.parallax || 0));
    const W = this._tileW || 1;
    return -((((cameraX * par) % W) + W) % W);
  }
}

/**
 * Specialized background layer for clouds.
 */
class CloudLayer extends BackgroundObject {
  /**
   * @param {string} [folder]
   * @param {number} [y=0]
   * @param {number|null} [h=null]
   * @param {number} [flow=0.06]
   * @param {number} [parallax=0.05]
   */
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

/**
 * Factory for predefined background layer sets.
 */
const BackgroundLayers = {
  /**
   * Returns the default background layer set.
   * @returns {any[]}
   */
  defaultSet() {
    return [
      new SkyLayer("img/5_background/layers/air.png", 0.0),
      new CloudLayer("img/5_background/layers/4_clouds", 0, null, 0.06, 0.05),
      new BackgroundObject("img/5_background/layers/3_third_layer", 0, null, 0, 0.15),
      new BackgroundObject("img/5_background/layers/2_second_layer", 0, null, 0, 0.3),
      new BackgroundObject("img/5_background/layers/1_first_layer", 0, null, 0, 0.6),
    ];
  },
};

window.BackgroundLayers = BackgroundLayers;
