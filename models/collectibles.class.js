// models/collectibles.class.js
class Coin extends MovableObject {
  constructor(x,y){
    super();
    this.x=x; this.y=y; this.setSize(52,52);
    this.frames = this.loadImages([
      'img/8_coin/coin_1.png',
      'img/8_coin/coin_2.png',
      'img/7_statusbars/3_icons/icon_coin.png'
    ]);
    this.img = this.frames[0]; this.imageLoaded = true;

    this.setHitbox(8, 8, 36, 36); 
    this.frameIndex = 0; this.animMs = 0; this.animEvery = 140;
  }
  update(dtMs=16){
    this.animMs += dtMs;
    if (this.animMs >= this.animEvery) {
      this.animMs = 0;
      this.frameIndex = (this.frameIndex + 1) % Math.max(2, this.frames.length);
      this.img = this.frames[this.frameIndex] || this.frames[0];
    }
  }
  static rand(w){
    const x = 600 + Math.random()*((w.cfg.lengthPx||5000)-800);
    const y = w.groundY - 120 - Math.random()*80;
    return new Coin(x,y);
  }
}

// models/collectibles.class.js

class Bottle extends MovableObject {
  /**
   * @param {number} x
   * @param {number} y
   * @param {1|2} [variant]  
   */
  constructor(x, y, variant) {
    super();
    this.setSize(52, 74);
    this.x = x;
    this.y = y;

  
    const v = variant ?? (Math.random() < 0.5 ? 1 : 2);
    const path = v === 1
      ? 'img/6_salsa_bottle/1_salsa_bottle_on_ground.png'
      : 'img/6_salsa_bottle/2_salsa_bottle_on_ground.png';

    this.loadImageFromCandidates([
      path,
      'img/7_statusbars/3_icons/icon_salsa_bottle.png' 
    ]);

   this.setHitbox(10, 12, 32, 44);
  }

  update(/*dtMs*/) { /* no animation */ }

  static rand(w) {
    const x = 600 + Math.random() * ((w.cfg.lengthPx || 5000) - 800);
    return new Bottle(x, w.groundY - 60);
  }
}

window.Coin = Coin;
window.Bottle = Bottle;
