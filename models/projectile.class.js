// models/projectile.class.js
class Projectile extends MovableObject {
  constructor(x, y, dir, opt = {}) {
    super();
    this.setSize(24, 24);
    this.x = x; this.y = y;
    const mul = opt.speedMul || 1;
    this.vx = 6 * dir * mul;
    this.vy = -4 * mul;
    this.gravity = 0.5;

    // Animations
    this.framesFly = this.loadImages([
      'img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
      'img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
      'img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
      'img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png',
    ]);
    this.framesSplash = this.loadImages([
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
      'img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png',
    ]);

    this.state = 'fly'; // 'fly' | 'splash' | 'dead'
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    // schnellere Rotation bei Power-Wurf:
    this.flyFrameMs = Math.max(40, 90 / mul);
    this.splashFrameMs = 60;

    // erstes Bild setzen
    this.img = this.framesFly[0];
    this.imageLoaded = true;
  }

  hitAndSplash(groundY = null) {
    if (this.state !== 'fly') return;
    this.state = 'splash';
    this.vx = 0; this.vy = 0;
    if (groundY != null) this.y = groundY - this.height + 4;
    this.frameIndex = 0; this.frameElapsedMs = 0;
    this.img = this.framesSplash[0];
    SFX.play?.('bottle_hit', { vol: 0.9 });
  }

  update(dtMs = 16) {
    const k = dtMs / 16;

    if (this.state === 'fly') {
      // Physik
      this.vy += this.gravity * k;
      this.x  += this.vx * k;
      this.y  += this.vy * k;

      // Animation: Rotation
      this.frameElapsedMs += dtMs;
      if (this.frameElapsedMs >= this.flyFrameMs) {
        this.frameElapsedMs = 0;
        this.frameIndex = (this.frameIndex + 1) % this.framesFly.length;
        this.img = this.framesFly[this.frameIndex];
      }

    } else if (this.state === 'splash') {
      // Einmalige Splash-Sequenz
      this.frameElapsedMs += dtMs;
      if (this.frameElapsedMs >= this.splashFrameMs) {
        this.frameElapsedMs = 0;
        this.frameIndex++;
        if (this.frameIndex >= this.framesSplash.length) {
          this.state = 'dead';
          this._dead = true;
        } else {
          this.img = this.framesSplash[this.frameIndex];
        }
      }
    }
  }
}
window.Projectile = Projectile;


class Bottle extends MovableObject {
  constructor(x,y){ 
    super(); this.x=x; this.y=y; this.setSize(36,54);
    this.loadImageFromCandidates([
      'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
      'img/6_salsa_bottle/2_salsa_bottle_on_ground.png',
      // Fallbacks:
      'img/7_statusbars/3_icons/icon_salsa_bottle.png'
    ]);
  }
  static rand(w){ 
    const x = 600 + Math.random()*((w.cfg.lengthPx||5000)-800);
    return new Bottle(x, w.groundY - 60);
  }
}
