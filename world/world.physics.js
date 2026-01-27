Object.assign(World.prototype, {
  /**
   * Updates background layers based on camera position.
   * @param {number} dtMs
   * @param {boolean} moving
   */
  updateBackgrounds(dtMs = 16, moving) {
    const camX = this.cameraX;
    const cvs = this.canvas;
    const arr = this.backgroundObjects || [];

    for (let i = 0; i < arr.length; i++) {
      this._updateBgLayer(arr[i], camX, cvs, dtMs, moving);
    }
  },

  /**
   * Updates a single background layer if it supports update().
   * @param {any} layer
   * @param {number} camX
   * @param {HTMLCanvasElement} cvs
   * @param {number} dtMs
   * @param {boolean} moving
   */
  _updateBgLayer(layer, camX, cvs, dtMs, moving) {
    if (layer?.update) return layer.update(camX, cvs, dtMs, moving);
    if (layer) layer._warnNoUpdate = true;
  },

  /**
   * Applies gravity and movement to the character.
   * @param {number} dtMs
   */
  applyPhysics(dtMs) {
    const c = this.character;
    const k = dtMs / 16;
    if (!c || c?.isDead?.()) return;

    this._applyGravity(c, k);
    this._applyKnockback(c, dtMs, k);
    this._applyMovement(c, k);
  },

  /**
   * Applies gravity to vertical velocity.
   * @param {any} c
   * @param {number} k
   */
  _applyGravity(c, k) {
    c.vy += this.gravity * k;
  },

  /**
   * Updates knockback and horizontal velocity damping.
   * @param {any} c
   * @param {number} dtMs
   * @param {number} k
   */
  _applyKnockback(c, dtMs, k) {
    if (c.hurtT > 0) c.knockT = Math.max(c.knockT || 0, 250);

    if ((c.knockT || 0) > 0) {
      c.knockT -= dtMs;
      c.vx *= Math.pow(0.9, k);
      if (Math.abs(c.vx) < 0.02) c.vx = 0;
    } else {
      c.vx = 0;
    }
  },

  /**
   * Applies velocities to position.
   * @param {any} c
   * @param {number} k
   */
  _applyMovement(c, k) {
    c.x += c.vx;
    c.y += c.vy * k;
  },

  /**
   * Keeps the character on the ground and inside the left world boundary.
   */
  handleGround() {
    const c = this.character;
    if (!c) return;

    const hitGround = c.y + c.height >= this.groundY;
    if (hitGround) this._landCharacter(c);

    if (c.x < 0) c.x = 0;
  },

  /**
   * Snaps character to ground and resets vertical motion.
   * @param {Character} c
   */
  _landCharacter(c) {
    c.y = this.groundY - c.height;
    c.vy = 0;
    c.onGround = true;
  },

  /**
   * Updates all cloud layers.
   */
  updateClouds() {
    this.clouds.forEach((cl) => cl.update?.(this.canvas.width));
  },
});
