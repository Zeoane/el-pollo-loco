// character.class.js
class Character extends MovableObject {
  constructor() {
    super();

    this.x = 120;
    this.width = 160;
    this.height = 320;

    this.IMAGES_WALKING = [
      'img/2_character_pepe/2_walk/W-21.png',
      'img/2_character_pepe/2_walk/W-22.png',
      'img/2_character_pepe/2_walk/W-23.png',
      'img/2_character_pepe/2_walk/W-24.png',
      'img/2_character_pepe/2_walk/W-25.png',
      'img/2_character_pepe/2_walk/W-26.png',
    ];

    this.frames = this.loadImages(this.IMAGES_WALKING);
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.frameDurationMs = 90; 

    this.img = this.frames[0];
    this.imageLoaded = true;

    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }


  updateAnimation(dtMs, moving) {
    if (!this.frames?.length) return;

    if (!moving) {
      this.frameIndex = 0;
      this.img = this.frames[0];
      this.frameElapsedMs = 0;
      return;
    }

    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs >= this.frameDurationMs) {
      this.frameElapsedMs = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frames.length;
      this.img = this.frames[this.frameIndex];
    }
  }

  draw(ctx) {
    if (this.img) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}



