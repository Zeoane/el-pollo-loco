// movable-object.class.js
class MovableObject {
  imageCache = {};
  img = null; imageLoaded = false;
  x = 0; y = 0; width = 50; height = 50; vx = 0; vy = 0;
  footOffset = 0; speed = 0; _groundY = null;

  setSize(w, h){ this.width = w; this.height = h; return this; }
  setSpeed(s){ this.speed = s || 0; return this; }
  setGround(gy){ this._groundY = gy; return this; }
  setState(name){ this.state = name; return this; }

  placeOnGround(){
    const gy = this._groundY ?? 0;
    this.y = gy - this.height + (this.footOffset || 0);
    return this;
  }

  stepLeft(dtMs = 16){ this.x -= (this.speed || 0) * (dtMs / 16); this.facing = -1; }
  stepRight(dtMs = 16){ this.x += (this.speed || 0) * (dtMs / 16); this.facing = 1; }

  setWalkFrames(paths = [], frameMs = 100){
    this.frames = this.loadImages(paths);
    this.frameIndex = 0; this.frameElapsedMs = 0; this.frameDurationMs = frameMs;
    if (this.frames?.length){ this.img = this.frames[0]; this.imageLoaded = true; }
    return this;
  }

  updateWalkAnimation(dtMs = 16, moving = false){
    if (!moving || !this.frames?.length){ this.frameIndex = 0; this.img = this.frames?.[0]; this.frameElapsedMs = 0; return; }
    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs >= (this.frameDurationMs || 100)){
      this.frameElapsedMs = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.img = this.frames[this.frameIndex];
    }
  }

  loadImage(path){
    this.img = new Image();
    this.img.onload = () => { this.imageLoaded = true; };
    this.img.onerror = (e) => { console.error('Fehler beim Laden des Bildes:', path, e); };
    this.img.src = path;
  }

  loadImageFromCandidates(paths = []){
    if (!paths.length) return;
    let i = 0;
    const tryNext = () => {
      if (i >= paths.length){ console.error('Kein Bildpfad gültig:', paths); return; }
      const p = paths[i++], img = new Image();
      img.onload = () => { this.img = img; this.imageLoaded = true; };
      img.onerror = () => { console.warn('Pfad ungültig, versuche nächsten:', p); tryNext(); };
      img.src = p;
    };
    tryNext();
  }

  // mehrere Bilder cachen
  loadImages(paths = []){
    const frames = [];
    paths.forEach((path) => {
      if (this.imageCache[path]){ frames.push(this.imageCache[path]); return; }
      const im = new Image();
      im.onerror = (e) => { console.error('Fehler beim Laden des Bildes:', path, e); };
      im.src = path; this.imageCache[path] = im; frames.push(im);
    });
    return frames;
  }

  draw(ctx){
    if (this.img && this.img.complete && this.img.naturalWidth > 0){
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }

  // Bodenschatten
  drawGroundShadow(ctx, groundY, opts = {}){
    const { alpha = 0.12, yOffset = -2, rxFactor = 0.45, ryFactor = 0.10, minRy = 4 } = opts;
    const cx = this.x + this.width / 2;
    const rx = Math.max(6, this.width * rxFactor);
    const ry = Math.max(minRy, this.height * ryFactor);
    const cy = groundY + yOffset;

    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}


