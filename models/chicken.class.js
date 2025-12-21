class Chicken extends MovableObject {
  constructor() {
    super();
    this.footOffset = 6;
    this.setSize(60, 60).setSpeed(0.8);
    this.setHitbox(6, 4, 48, 52);
    this.hp = 1;
    this.facing = 1;
    this.dmg = 18;
    this.bumpVX = 2.5;
    this.bumpVY = -7;

    // Animation
    this.IMAGES_WALK = [
      "img/3_enemies_chicken/chicken_normal/1_walk/1_w.png",
      "img/3_enemies_chicken/chicken_normal/1_walk/2_w.png",
      "img/3_enemies_chicken/chicken_normal/1_walk/3_w.png",
    ];
    this.IMAGE_DEAD = "img/3_enemies_chicken/chicken_normal/2_dead/dead.png";

    this.setWalkFrames(this.IMAGES_WALK, 120);
    this.loadImage(this.IMAGES_WALK[0]);

    this._tLast = performance.now();
  }

  _tick() {
    const now = performance.now();
    const dt = Math.min(50, now - (this._tLast || now));
    this._tLast = now;
    this.updateAnimation(dt);
  }

  updateAnimation(dtMs = 16) {
    if (this.hp <= 0) {
      if (!this._deadShown) {
        this.loadImage(this.IMAGE_DEAD);
        this._deadShown = true;
      }
      return;
    }
    this.updateWalkAnimation(dtMs, true);
  }

  draw(ctx) {
    this._tick();
    super.draw(ctx);
  }
}
window.Chicken = Chicken;
