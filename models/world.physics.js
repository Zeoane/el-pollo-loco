// models/world.physics.js
Object.assign(World.prototype, {
  updateBackgrounds(dtMs = 16, moving) {
    const camX = this.cameraX;
    const cvs  = this.canvas;
    const arr  = this.backgroundObjects || [];
    for (let i = 0; i < arr.length; i++) {
      const bo = arr[i];
      if (!bo) continue;
      if (typeof bo.update === 'function') {
        bo.update(camX, cvs, dtMs, moving);
      } else if (!bo._warnNoUpdate) {
        console.warn('[BG] layer ohne update(): idx=', i, 'type=', bo?.constructor?.name);
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
    const dx = target - this.cameraX;
    if (moving) {
      this.cameraX += dx * 0.10;     
    } else if (Math.abs(dx) > 0.5) {
      this.cameraX += dx * 0.20;       
    } else {
      this.cameraX = target;          
    }
  },

  updateClouds(){ this.clouds.forEach(cl => cl.update?.(this.canvas.width)); },
});
