// classes/chicken.class.js
class Chicken extends MovableObject {
  constructor(){
    super();
    this.spriteFacing = -1;
    this.facing = 1;
    this.footOffset = 6;
    this.setSize(70,60).setSpeed(1.6);
    this.setHitbox(6,4,56,50);
    this.dmg = 15;

    this.IMAGES_WALK = [
      "img/3_enemies_chicken/chicken_normal/1_walk/1_w.png",
      "img/3_enemies_chicken/chicken_normal/1_walk/2_w.png",
      "img/3_enemies_chicken/chicken_normal/1_walk/3_w.png",
    ];
    this.setWalkFrames(this.IMAGES_WALK, 120);

    this.deadImg = new Image();
    this.deadImg.src = "img/3_enemies_chicken/chicken_normal/2_dead/dead.png"; 

    this.hp = 2;
    this.alpha = 1;
    this.state = 'walk';
    this.deadT = 0;
    this.deadHoldMs = 1000;
    this.deadFadeMs = 1000;
  }

  die(){
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.speed = 0; this.vx = 0; this.vy = 0;
    this.img = this.deadImg;
    this.deadT = 0;
    this.alpha = 1;
  }
  onDie(){ this.die(); }

  update(dtMs=16){
    if (this.state === 'dead'){
      this.deadT += dtMs;
      if (this.deadT > this.deadHoldMs){
        const t = this.deadT - this.deadHoldMs;
        const a = 1 - Math.min(1, t / this.deadFadeMs);
        this.alpha = a;
        if (a <= 0) this._dead = true;
      }
      return;
    }
    this.updateWalkAnimation?.(dtMs, true);
  }
}
window.Chicken = Chicken;

