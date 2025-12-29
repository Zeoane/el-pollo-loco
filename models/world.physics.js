// models/world.physics.js
Object.assign(World.prototype, {
  updateBackgrounds(dtMs, moving) {
    const camX = this.cameraX, cvs = this.canvas;
    for (let i = 0; i < this.backgroundObjects.length; i++) {
      const bo = this.backgroundObjects[i];
      if (!bo) continue;
      if (typeof bo.update === 'function') {
        bo.update(camX, cvs, dtMs, moving);
      } else if (!bo._warnNoUpdate) {
        console.warn('[BG] layer ohne update():', i, bo?.constructor?.name);
        bo._warnNoUpdate = true;
      }
    }
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
