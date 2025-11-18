// background-object.class.js
class BackgroundObject extends MovableObject {
  constructor(path, x=0, y=0, width=null, height=null, flowSpeed=0, parallax=0) {
    super();
    this.x = x; this.y = y;
    this.width = width; this.height = height;
    this.flowSpeed = flowSpeed;     // Eigen-Flow (optional)
    this.parallax  = parallax;      // 0=weit weg, 1=vorn
    this._flow = 0;                 // akkumulierte Eigenverschiebung
    this.loadImage(path);
  }

  update(cameraX, canvas, dtMs=16, moving=false) {
    // Nur wenn du Eigen-Flow NUR bei Bewegung willst:
    if (moving && this.flowSpeed) this._flow -= this.flowSpeed;
    // Falls Flow immer leicht laufen soll: _flow -= this.flowSpeed; ohne Bedingung
  }

  draw(ctx, cameraX=0) {
    if (!this.imageLoaded || !this.img) return;
    const cvs = ctx.canvas;

    // Zielhöhe = Canvas-Höhe, Breite proportional
    const destH = this.height ?? cvs.height;
    const scale = destH / this.img.naturalHeight;
    const destW = this.width  ?? (this.img.naturalWidth * scale);

    // Pixel-Snapping (HiDPI-freundlich)
    const dpr = window.devicePixelRatio || 1;
    const snap = (v) => Math.round(v * dpr) / dpr;

    ctx.save();

     const px = snap(cameraX * (1 - this.parallax));
    ctx.translate(px, 0);

     let startX = this.x + (this._flow % destW);
    if (startX > 0) startX -= destW;

    const overlap = 0.5;

       for (let x = startX - destW; x < cvs.width + destW; x += destW) {
      const sx = snap(x);
      ctx.drawImage(this.img, sx - overlap, this.y, destW + overlap*2, destH);
    }

    ctx.restore();
  }
}




