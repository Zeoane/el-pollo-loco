// classes/movable-object.class.js
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

/**
 * Sets the object's render size.
 * @param {number} w
 * @param {number} h
 * @returns {this}
 */
setSize(w, h) {
  this.width = w;
  this.height = h;
  return this;
}

/**
 * Sets the movement speed (used by stepLeft/stepRight).
 * @param {number} s
 * @returns {this}
 */

setSpeed(s) {
  this.speed = s || 0;
  return this;
}

/**
 * Sets the ground Y position used by placeOnGround().
 * @param {number} gy
 * @returns {this}
 */
setGround(gy) {
  this._groundY = gy;
  return this;
}

/**
 * Stores a simple state label (optional, used by subclasses).
 * @param {string} name
 * @returns {this}
 */
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

  /**
   * Creates an image element and wires load/error handlers.
   * @param {string} path
   * @param {Function} onLoad
   * @param {Function} onError
   * @returns {HTMLImageElement}
   */
  _createImage(path, onLoad, onError) {
    const im = new Image();
    im.onload = onLoad;
    im.onerror = onError;
    im.src = path;
    return im;
  }

  /**
   * Loads a single image and sets it as current sprite.
   * @param {string} path
   * @returns {HTMLImageElement}
   */
  loadImage(path) {
    const img = this._createImage(
      path,
      () => {
        this.imageLoaded = true;
        img._broken = false;
      },
      () => {
        this.imageLoaded = false;
        img._broken = true;
        this.loadFailed = true;
      }
    );

    this.img = img;
    return img;
  }

  /**
   * Tries multiple image paths and uses the first one that loads.
   * @param {string[]} paths
   */
  loadImageFromCandidates(paths = []) {
    if (!paths.length) return;

    let i = 0;
    const tryNext = () => {
      if (i >= paths.length) return this._markCandidateFail();

      const path = paths[i++];
      this._loadCandidate(path, tryNext);
    };

    tryNext();
  }

  /**
   * Loads one candidate image and falls back to the next on error.
   * @param {string} path
   * @param {Function} onFail
   */
  _loadCandidate(path, onFail) {
    this.loadFailed = false;
    const im = this._createImage(
      path,
      () => this._useLoadedCandidate(im),
      onFail
    );
  }

  /**
   * Uses a successfully loaded candidate image as current sprite.
   * @param {HTMLImageElement} im
   */
  _useLoadedCandidate(im) {
    this.img = im;
    this.imageLoaded = true;
  }

  /**
   * Marks candidate loading as failed.
   */
  _markCandidateFail() {
    this.loadFailed = true;
  }

/**
 * Defines a hitbox offset and size relative to x/y and width/height.
 * @param {number} [ox=0]
 * @param {number} [oy=0]
 * @param {number|null} [w=null]
 * @param {number|null} [h=null]
 * @returns {this}
 */
setHitbox(ox = 0, oy = 0, w = null, h = null) {
  this.hb = { ox, oy, w, h };
  return this;
}

/**
 * Returns the current collision bounds (hitbox if set, otherwise full size).
 * @returns {{x:number,y:number,width:number,height:number}}
 */
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

/**
 * Checks AABB intersection with another object or bounds.
 * @param {any} other
 * @returns {boolean}
 */
intersects(other) {
  const aabb = window.AABB;
  if (!other || typeof aabb !== "function") return false;
  const b = other.getBounds?.() || other;
  return aabb(this.getBounds(), b);
}

  loadImages(paths = []) {
    const frames = [];
    paths.forEach((path) => {
      if (this.imageCache[path]) {
        frames.push(this.imageCache[path]);
        return;
      }
      const im = new Image();
      im.onerror = () => {
        im._broken = true;
        this.loadFailed = true;
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

  /**
   * Draws a soft ground shadow below the object.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} groundY
   * @param {Object} [opts]
   */
  drawGroundShadow(ctx, groundY, opts = {}) {
    if (this.hasGroundShadow === false) return;
    const s = this._shadowSettings(opts);
    const g = this._shadowGeometry(groundY, s);

    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(g.cx, g.cy, g.rx, g.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Builds shadow settings with defaults.
   * @param {Object} opts
   * @returns {{alpha:number,yOffset:number,rxFactor:number,ryFactor:number,minRy:number}}
   */
  _shadowSettings(opts) {
    return {
      alpha: opts.alpha ?? 0.12,
      yOffset: opts.yOffset ?? -2,
      rxFactor: opts.rxFactor ?? 0.45,
      ryFactor: opts.ryFactor ?? 0.1,
      minRy: opts.minRy ?? 4,
    };
  }

  /**
   * Computes shadow geometry based on object size and ground position.
   * @param {number} groundY
   * @param {{yOffset:number,rxFactor:number,ryFactor:number,minRy:number}} s
   * @returns {{cx:number,cy:number,rx:number,ry:number}}
   */
  _shadowGeometry(groundY, s) {
    const cx = this.x + this.width / 2;
    const rx = Math.max(6, this.width * s.rxFactor);
    const ry = Math.max(s.minRy, this.height * s.ryFactor);
    const cy = groundY + s.yOffset;
    return { cx, cy, rx, ry };
  }
}
