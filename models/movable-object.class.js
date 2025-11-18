// movable-object.class.js
class MovableObject {
 
  imageCache = {};

  img = null;
  imageLoaded = false;

  x = 0; y = 0; width = 50; height = 50;
  vx = 0; vy = 0;


  loadImage(path) {
    this.img = new Image();
    this.img.onload = () => {
      this.imageLoaded = true;
    };
    this.img.onerror = (e) => {
      console.error('Fehler beim Laden des Bildes:', path, e);
    };
    this.img.src = path;
  }

  /** Kandidaten nacheinander probieren */
  loadImageFromCandidates(paths = []) {
    if (!paths.length) return;
    let i = 0;
    const tryNext = () => {
      if (i >= paths.length) {
        console.error('Kein Bildpfad gültig:', paths);
        return;
      }
      const p = paths[i++];
      const img = new Image();
      img.onload = () => {
        this.img = img;
        this.imageLoaded = true;
       
      };
      img.onerror = () => {
        console.warn('Pfad ungültig, versuche nächsten:', p);
        tryNext();
      };
      img.src = p;
    };
    tryNext();
  }

  /**
   * Mehrere Bilder **vorladen** und im Cache ablegen.
   * @param {string[]} paths
   * @returns {HTMLImageElement[]}
   */
  loadImages(paths = []) {
    const frames = [];
    paths.forEach((path) => {
      
      if (this.imageCache[path]) {
        frames.push(this.imageCache[path]);
        return;
      }
      const im = new Image();
      im.onload = () => {
    
      };
      im.onerror = (e) => {
        console.error('Fehler beim Laden des Bildes:', path, e);
      };
      im.src = path;
      this.imageCache[path] = im;
      frames.push(im);
    });
    return frames;
  }

  draw(ctx) {
    if (this.img && this.img.complete && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }

  /** Bodenschatten (Ellipse) */
  drawGroundShadow(ctx, groundY, opts = {}) {
    const {
      alpha = 0.12,      
      yOffset = -2,
      rxFactor = 0.45,
      ryFactor = 0.10,
      minRy = 4,
    } = opts;

    const cx = this.x + this.width / 2;
    const rx = Math.max(6, this.width * rxFactor);
    const ry = Math.max(minRy, this.height * ryFactor);
    const cy = groundY + yOffset;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

