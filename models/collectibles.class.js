// models/collectibles.class.js
class Coin extends MovableObject {
  constructor(x,y){
    super();
    this.x=x; this.y=y; this.setSize(32,32);
    this.frames = this.loadImages([
      'img/8_coin/coin_1.png',
      'img/8_coin/coin_2.png',
      'img/7_statusbars/3_icons/icon_coin.png'
    ]);
    this.img = this.frames[0]; this.imageLoaded = true;

    this.setHitbox(6,6,20,20); // kleine, faire Hitbox
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

class Bottle extends MovableObject {
  constructor(x,y){
    super();
    this.x=x; this.y=y; this.setSize(36,54);
    this.frames = this.loadImages([
      'img/6_salsa_bottle/1_salsa_bottle_on_ground.png',
      'img/6_salsa_bottle/2_salsa_bottle_on_ground.png',
      'img/7_statusbars/3_icons/icon_salsa_bottle.png'
    ]);
    this.img = this.frames[0]; this.imageLoaded = true;

    this.setHitbox(6,8,24,40);
    this.frameIndex = 0; this.animMs = 0; this.animEvery = 500;
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
    return new Bottle(x, w.groundY - 60);
  }
}

window.Coin = Coin;
window.Bottle = Bottle;
