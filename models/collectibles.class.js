// models/collectible.class.js
class Coin extends MovableObject {
  constructor(x,y){ super(); this.x=x; this.y=y; this.setSize(32,32);
    this.loadImageFromCandidates([
      'img/6_coins/coin.png',
      'img/8_coin/coin_1.png',
      'img/6_coins/1.png'
    ]);
  }
  static rand(world){
    const x = 600 + Math.random()*((world.cfg.lengthPx||5000)-800);
    const y = world.groundY - 120 - Math.random()*80;
    return new Coin(x,y);
  }
}

class Bottle extends MovableObject {
  constructor(x,y){ super(); this.x=x; this.y=y; this.setSize(36,54);
    this.loadImageFromCandidates([
      'img/7_bottles/bottle.png',
      'img/6_salsa_bottle/salsa_bottle.png',
      'img/6_salsa_bottle/2_salsa_bottle_on_ground.png'
    ]);
  }
  static rand(world){
    const x = 600 + Math.random()*((world.cfg.lengthPx||5000)-800);
    const y = world.groundY - 60; return new Bottle(x,y);
  }
}


// optional: global verfügbar machen
window.Collectible = Collectible;
window.Coin = Coin;
window.Bottle = Bottle;

