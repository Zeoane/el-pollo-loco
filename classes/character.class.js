class Character extends MovableObject {
  constructor() {
    super();
    this.initStats();
    this.initImages();
    this.img = this._idleFrames[0];
    this.resetFrame("idle");
  }

  initStats() {
    this.hpMax = 100;
    this.hp = 100;
    this.x = 120;
    this.setSize(160, 320);
    this.footOffset = 16;
    this.setHitbox(10, 6, this.width - 20, this.height - 12);
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.idleElapsed = 0;
  }

  initImages() {
    this.IMAGES_WALKING = [
      "img/2_character_pepe/2_walk/W-21.png",
      "img/2_character_pepe/2_walk/W-22.png",
      "img/2_character_pepe/2_walk/W-23.png",
      "img/2_character_pepe/2_walk/W-24.png",
      "img/2_character_pepe/2_walk/W-25.png",
      "img/2_character_pepe/2_walk/W-26.png",
    ];
    this.IMAGES_JUMPING = [
      "img/2_character_pepe/3_jump/J-31.png",
      "img/2_character_pepe/3_jump/J-32.png",
      "img/2_character_pepe/3_jump/J-33.png",
      "img/2_character_pepe/3_jump/J-34.png",
      "img/2_character_pepe/3_jump/J-35.png",
      "img/2_character_pepe/3_jump/J-36.png",
      "img/2_character_pepe/3_jump/J-37.png",
      "img/2_character_pepe/3_jump/J-38.png",
      "img/2_character_pepe/3_jump/J-39.png",
    ];
    this.IMAGES_IDLE = [
      "img/2_character_pepe/1_idle/idle/I-1.png",
      "img/2_character_pepe/1_idle/idle/I-2.png",
      "img/2_character_pepe/1_idle/idle/I-3.png",
      "img/2_character_pepe/1_idle/idle/I-4.png",
      "img/2_character_pepe/1_idle/idle/I-5.png",
      "img/2_character_pepe/1_idle/idle/I-6.png",
      "img/2_character_pepe/1_idle/idle/I-7.png",
      "img/2_character_pepe/1_idle/idle/I-8.png",
      "img/2_character_pepe/1_idle/idle/I-9.png",
      "img/2_character_pepe/1_idle/idle/I-10.png",
    ];
    this.IMAGES_LONG_IDLE = [
      "img/2_character_pepe/1_idle/long_idle/I-11.png",
      "img/2_character_pepe/1_idle/long_idle/I-12.png",
      "img/2_character_pepe/1_idle/long_idle/I-13.png",
      "img/2_character_pepe/1_idle/long_idle/I-14.png",
      "img/2_character_pepe/1_idle/long_idle/I-15.png",
      "img/2_character_pepe/1_idle/long_idle/I-16.png",
      "img/2_character_pepe/1_idle/long_idle/I-17.png",
      "img/2_character_pepe/1_idle/long_idle/I-18.png",
      "img/2_character_pepe/1_idle/long_idle/I-19.png",
      "img/2_character_pepe/1_idle/long_idle/I-20.png",
    ];
    this.IMAGES_HURT = [
      "img/2_character_pepe/4_hurt/H-41.png",
      "img/2_character_pepe/4_hurt/H-42.png",
      "img/2_character_pepe/4_hurt/H-43.png",
    ];
    this.IMAGES_DEAD = [
      "img/2_character_pepe/5_dead/D-51.png",
      "img/2_character_pepe/5_dead/D-52.png",
      "img/2_character_pepe/5_dead/D-53.png",
      "img/2_character_pepe/5_dead/D-54.png",
      "img/2_character_pepe/5_dead/D-55.png",
      "img/2_character_pepe/5_dead/D-56.png",
      "img/2_character_pepe/5_dead/D-57.png",
    ];
    this._walkFrames = this.loadImages(this.IMAGES_WALKING);
    this._jumpFrames = this.loadImages(this.IMAGES_JUMPING);
    this._idleFrames = this.loadImages(this.IMAGES_IDLE);
    this._longIdleFrames = this.loadImages(this.IMAGES_LONG_IDLE);
    this._hurtFrames = this.loadImages(this.IMAGES_HURT);
    this._deadFrames = this.loadImages(this.IMAGES_DEAD);
  }

  updateAnimation(dtMs, moving) {
    this.updateTimers(dtMs);
    this.determineState(moving);
    this.playCurrentAnimation(dtMs);
  }


  hpPercent() {
  const currentHp = this.hp || 0;
  const maxHp = this.hpMax || 100;
  return Math.max(0, Math.min(100, (100 * currentHp) / maxHp));
}

  updateTimers(dtMs) {
    this.hurtT = Math.max(0, (this.hurtT || 0) - dtMs);
    const isIdle = this.state === "idle" || this.state === "long_idle";
    this.idleElapsed = isIdle ? (this.idleElapsed || 0) + dtMs : 0;
  }

  determineState(moving) {
    const next = this.calculateNextState(moving);
    if (next !== this.state) this.resetFrame(next);
  }

  calculateNextState(moving) {
    if (this.hp <= 0) return "dead";
    if (this.hurtT > 0) return "hurt";
    if (!this.onGround) return "jump";
    return moving ? "walk" : this.idleElapsed > 3000 ? "long_idle" : "idle";
  }

  resetFrame(next) {
    this.state = next;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
  }

  playCurrentAnimation(dtMs) {
    if (this.state === "dead")
      return this._animateSequence(dtMs, this._deadFrames, 120, false);
    if (this.state === "hurt")
      return this._animateSequence(dtMs, this._hurtFrames, 120, false);
    if (this.state === "jump")
      return this._animateSequence(dtMs, this._jumpFrames, 90, false);
    this.playLoopingAnimation(dtMs);
  }

  playLoopingAnimation(dtMs) {
    if (this.state === "walk")
      return this._animateSequence(dtMs, this._walkFrames, 90, true);
    this.playIdleAnimation(dtMs);
  }

  playIdleAnimation(dtMs) {
    const frames =
      this.state === "long_idle" ? this._longIdleFrames : this._idleFrames;
    this._animateSequence(dtMs, frames, 120, true);
  }

  _animateSequence(dtMs, frames, ms, loop) {
    if (!frames || frames.length === 0) return;
    this.frameElapsedMs = (this.frameElapsedMs || 0) + dtMs;
    if (this.frameElapsedMs >= ms) this.advanceFrame(frames, loop);
    this.img = frames[this.frameIndex] || frames[0];
  }

  advanceFrame(frames, loop) {
    this.frameElapsedMs = 0;
    this.frameIndex++;
    if (loop) this.frameIndex %= frames.length;
    else this.frameIndex = Math.min(this.frameIndex, frames.length - 1);
  }
}
window.Character = Character;
