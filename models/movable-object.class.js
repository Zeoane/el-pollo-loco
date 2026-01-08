// movable-object.class.js
class MovableObject {
  imageCache = {};
  img = null;
  imageLoaded = false;
  x = 0;
  y = 0;
  width = 50;
  height = 50;
  vx = 0;
  vy = 0;
  footOffset = 0;
  speed = 0;
  _groundY = null;

  setSize(w, h) {
    this.width = w;
    this.height = h;
    return this;
  }
  setSpeed(s) {
    this.speed = s || 0;
    return this;
  }
  setGround(gy) {
    this._groundY = gy;
    return this;
  }
  setState(name) {
    this.state = name;
    return this;
  }

  placeOnGround() {
    const gy = this._groundY ?? 0;
    this.y = gy - this.height + (this.footOffset || 0);
    return this;
  }

  stepLeft(dtMs = 16) {
    this.x -= (this.speed || 0) * (dtMs / 16);
    this.facing = -1;
  }
  stepRight(dtMs = 16) {
    this.x += (this.speed || 0) * (dtMs / 16);
    this.facing = 1;
  }

  setWalkFrames(paths = [], frameMs = 100) {
    this.frames = this.loadImages(paths);
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.frameDurationMs = frameMs;
    if (this.frames?.length) {
      this.img = this.frames[0];
      this.imageLoaded = true;
    }
    return this;
  }

  updateWalkAnimation(dtMs = 16, moving = false) {
    if (!moving || !this.frames?.length) {
      this.frameIndex = 0;
      this.img = this.frames?.[0];
      this.frameElapsedMs = 0;
      return;
    }
    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs >= (this.frameDurationMs || 100)) {
      this.frameElapsedMs = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.img = this.frames[this.frameIndex];
    }
  }

  loadImage(path){
  const img = new Image();
  this.img = img;
  img.onload = () => {
    this.imageLoaded = true;
    img._broken = false;
  };
  img.onerror = (e) => {
    this.imageLoaded = false;
    img._broken = true;
    console.error('Missing/broken:', path, e);
  };
  img.src = path;
  return img;
}


  loadImageFromCandidates(paths = []) {
    if (!paths.length) return;
    let i = 0;
    const tryNext = () => {
      if (i >= paths.length) {
        this.loadFailed = true;
        return;
      }
      const p = paths[i++],
        im = new Image();
      this.loadFailed = false;
      im.onload = () => {
        this.img = im;
        this.imageLoaded = true;
      };
      im.onerror = tryNext;
      im.src = p;
    };
    tryNext();
  }


  setHitbox(ox = 0, oy = 0, w = null, h = null) {
    this.hb = { ox, oy, w, h };
    return this;
  }


  getBounds() {
    const hb = this.hb || {};
    const w = hb.w ?? this.width,
      h = hb.h ?? this.height;
    return {
      x: this.x + (hb.ox || 0),
      y: this.y + (hb.oy || 0),
      width: w,
      height: h,
    };
  }


  intersects(other) {
    if (!other || !window.AABB) return false;
    return AABB(this.getBounds(), other.getBounds?.() || other);
  }


  loadImages(paths = []) {
    const frames = [];
    paths.forEach((path) => {
      if (this.imageCache[path]) {
        frames.push(this.imageCache[path]);
        return;
      }
      const im = new Image();
      im.onerror = (e) => {
        console.error("Fehler beim Laden des Bildes:", path, e);
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

  // Bodenschatten
  drawGroundShadow(ctx, groundY, opts = {}) {
    const {
      alpha = 0.12,
      yOffset = -2,
      rxFactor = 0.45,
      ryFactor = 0.1,
      minRy = 4,
    } = opts;
    const cx = this.x + this.width / 2;
    const rx = Math.max(6, this.width * rxFactor);
    const ry = Math.max(minRy, this.height * ryFactor);
    const cy = groundY + yOffset;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
