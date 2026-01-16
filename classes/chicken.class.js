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

/**
 * Kills the enemy and switches to dead state.
 */
die() {
  if (this.state === "dead") return;
  this._setDeadState();
  this._setDeadSprite();
  this._resetDeadTimers();
  }

/**
 * @private
 */
_setDeadState() {
  this.state = "dead";
  this.speed = 0;
  this.vx = 0;
  this.vy = 0;
}

/**
 * @private
 */
_setDeadSprite() {
  this.img = this.deadImg;
}

/**
 * @private
 */
_resetDeadTimers() {
  this.deadT = 0;
  this.alpha = 1;
}

/**
 * Alias for die().
 */
onDie() {
  this.die();
}

/**
 * @param {number} dtMs
 */
update(dtMs = 16) {
  if (this.state === "dead") return this._updateDead(dtMs);
  this.updateWalkAnimation?.(dtMs, true);
}

/**
 * @param {number} dtMs
 * @private
 */
_updateDead(dtMs) {
  this.deadT += dtMs;
  if (this.deadT <= this.deadHoldMs) return;
  this._fadeOutDead();
}

/**
 * @private
 */
_fadeOutDead() {
  const t = this.deadT - this.deadHoldMs;
  this.alpha = 1 - Math.min(1, t / this.deadFadeMs);
  if (this.alpha <= 0) this._dead = true;
}
}
window.Chicken = Chicken;

