// models/collectible.class.js
class Collectible extends MovableObject {
  constructor(x,y,w,h,img){ super(); this.x=x; this.y=y; this.width=w; this.height=h; this.loadImage(img); }
}

class Coin extends Collectible {
  constructor(x,y){ super(x,y,32,32,'img/6_coins/coin.png'); }
  static rand(world){
    const len = world.cfg?.lengthPx || 5000;
    const x = 600 + Math.random() * (len - 800);
    const y = world.groundY - 120 - Math.random()*80;
    return new Coin(x,y);
  }
}

class Bottle extends Collectible {
  constructor(x,y){ super(x,y,36,54,'img/7_bottles/bottle.png'); }
  static rand(world){
    const len = world.cfg?.lengthPx || 5000;
    const x = 600 + Math.random() * (len - 800);
    const y = world.groundY - 60;
    return new Bottle(x,y);
  }
}

// optional: global verfügbar machen
window.Collectible = Collectible;
window.Coin = Coin;
window.Bottle = Bottle;

