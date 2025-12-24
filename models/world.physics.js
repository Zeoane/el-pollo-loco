// models/world.physics.js
Object.assign(World.prototype, {
  handleInput(dtMs){
    const run = this.cfg.player?.speed ?? 3.4;
    this.character.speed = run;

    if (this.keyboard?.RIGHT){ this.character.stepRight?.(dtMs); this.character.facing = 1; }
    if (this.keyboard?.LEFT ){ this.character.stepLeft?.(dtMs);  this.character.facing = -1; }

    if (!this.jumpLock && (this.keyboard?.SPACE || this.keyboard?.UP) && this.character.onGround){
      this.character.vy = this.cfg.player?.jumpVy ?? -12;
      this.character.onGround = false;
      this.jumpLock = true;
    }
    if (!this.keyboard?.SPACE && !this.keyboard?.UP) this.jumpLock = false;
  },

  applyPhysics(dtMs){
    const c = this.character, k = dtMs/16;
    c.vy += this.gravity * k;

    if (c.hurtT > 0) c.knockT = Math.max(c.knockT || 0, 250);

    if ((c.knockT || 0) > 0){
      c.knockT -= dtMs;
      c.vx *= Math.pow(0.9, k);
      if (Math.abs(c.vx) < 0.02) c.vx = 0;
    } else {
      c.vx = 0;
    }

    c.x += c.vx;
    c.y += c.vy * k;
  },

  handleGround(){
    const c = this.character;
    if (c.y + c.height >= this.groundY){ c.y = this.groundY - c.height; c.vy = 0; c.onGround = true; }
    if (c.x < 0) c.x = 0;
  },

  updateCamera(moving){
    const target = this.character.x - this.canvas.width * 0.4;
    this.cameraX = moving ? this.cameraX + (target - this.cameraX) * 0.1 : target;
  },

  updateClouds(){ this.clouds.forEach(cl => cl.update?.(this.canvas.width)); },

  updateBackgrounds(dtMs, moving){
    this.backgroundObjects.forEach(bo => bo.update(this.cameraX, this.canvas, dtMs, moving));
  }
});
