// models/collectibles.class.js
class Coin extends MovableObject {
  constructor(x,y){ super(); this.x=x; this.y=y; this.setSize(32,32);
    this.loadImageFromCandidates([
      'img/6_coins/coin.png',
      'img/7_statusbars/3_icons/icon_coin.png' 
    ]);
  }
  static rand(w){ const x=600+Math.random()*((w.cfg.lengthPx||5000)-800);
    const y=w.groundY-120-Math.random()*80; return new Coin(x,y);
  }
}

class Bottle extends MovableObject {
  constructor(x,y){ super(); this.x=x; this.y=y; this.setSize(36,54);
    this.loadImageFromCandidates([
      'img/7_bottles/bottle.png',
      'img/7_statusbars/3_icons/icon_salsa_bottle.png' 
    ]);
  }
  static rand(w){ const x=600+Math.random()*((w.cfg.lengthPx||5000)-800);
    return new Bottle(x, w.groundY-60);
  }
}

window.Coin = Coin;
window.Bottle = Bottle;

