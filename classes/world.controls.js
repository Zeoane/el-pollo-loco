// classes/world.controls.js
Object.assign(World.prototype, {
/**
 * Handles player input and applies movement/jump to the character.
 * @param {number} dtMs - Delta time in milliseconds.
 */
handleInput(dtMs) {
  const c = this.character;
  if (!c || c?.isDead?.()) return;

  this._applyMoveInput(c, dtMs);
  this._applyJumpInput(c);
},

/**
 * Applies left/right movement input.
 * @param {any} c
 * @param {number} dtMs
 */
_applyMoveInput(c, dtMs) {
  c.speed = this.cfg.player?.speed ?? 3.4;
  if (this.keyboard?.RIGHT) return this._step(c, dtMs, 1);
  if (this.keyboard?.LEFT) return this._step(c, dtMs, -1);
},

/**
 * Performs one movement step and updates facing.
 * @param {any} c
 * @param {number} dtMs
 * @param {number} dir - 1 for right, -1 for left.
 */
_step(c, dtMs, dir) {
  if (dir > 0) c.stepRight?.(dtMs);
  else c.stepLeft?.(dtMs);
  c.facing = dir;
},

/**
 * Applies jump input with a simple jump lock.
 * @param {any} c
 */
_applyJumpInput(c) {
  const wantJump = this.keyboard?.SPACE || this.keyboard?.UP;
  if (!wantJump) return (this.jumpLock = false);

  if (!this.jumpLock && c.onGround) {
    c.vy = this.cfg.player?.jumpVy ?? -12;
    c.onGround = false;
    this.jumpLock = true;
    SFX.play?.("jump", { vol: 0.5 });
  }
},

/**
 * Updates camera X position based on the character position.
 */
updateCamera() {
  const leftOffset = 100;
  this.cameraX = Math.max(0, this.character.x - leftOffset);
},
});

