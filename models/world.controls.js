// models/world.controls.js
Object.assign(World.prototype, {
  handleInput(dtMs) {
    const c = this.character;
    c.speed = this.cfg.player?.speed ?? 3.4;

    if (this.keyboard?.RIGHT) {
      c.stepRight?.(dtMs);
      c.facing = 1;
    }
    if (this.keyboard?.LEFT) {
      c.stepLeft?.(dtMs);
      c.facing = -1;
    }

    const wantJump = this.keyboard?.SPACE || this.keyboard?.UP;
    if (!this.jumpLock && wantJump && c.onGround) {
      c.vy = this.cfg.player?.jumpVy ?? -12;
      c.onGround = false;
      this.jumpLock = true;
      SFX.play?.('jump', { vol: .5 });
    }
    if (!wantJump) this.jumpLock = false;
  }, 

  updateCamera() {
    const leftOffset = 100; 
    this.cameraX = this.character.x - leftOffset;
    if (this.cameraX < 0) {
      this.cameraX = 0;
    }

    // Optional: nach rechts begrenzen
    // if (this.cameraX > 2500) this.cameraX = 2500;
  }
});

