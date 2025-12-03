// models/projectile.class.js
class Projectile extends MovableObject {
  constructor(x,y,dir){
    super(); this.x=x; this.y=y; this.width=24; this.height=24;
    this.vx = 6 * (dir||1); this.vy = -4; this.loadImage('img/7_bottles/bottle_throw.png');
  }
  update(dtMs=16){
    const k = dtMs/16; this.vy += 0.5 * k; this.x += this.vx * k; this.y += this.vy * k;
  }
}
window.Projectile = Projectile;
