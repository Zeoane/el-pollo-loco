const CHARACTER_SPRITES = {
  WALK: [
    "img/2_character_pepe/2_walk/W-21.png",
    "img/2_character_pepe/2_walk/W-22.png",
    "img/2_character_pepe/2_walk/W-23.png",
    "img/2_character_pepe/2_walk/W-24.png",
    "img/2_character_pepe/2_walk/W-25.png",
    "img/2_character_pepe/2_walk/W-26.png",
  ],
  JUMP: [
    "img/2_character_pepe/3_jump/J-31.png",
    "img/2_character_pepe/3_jump/J-32.png",
    "img/2_character_pepe/3_jump/J-33.png",
    "img/2_character_pepe/3_jump/J-34.png",
    "img/2_character_pepe/3_jump/J-35.png",
    "img/2_character_pepe/3_jump/J-36.png",
    "img/2_character_pepe/3_jump/J-37.png",
    "img/2_character_pepe/3_jump/J-38.png",
    "img/2_character_pepe/3_jump/J-39.png",
  ],
  IDLE: [
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
  ],
  LONG_IDLE: [
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
  ],
  HURT: [
    "img/2_character_pepe/4_hurt/H-41.png",
    "img/2_character_pepe/4_hurt/H-42.png",
    "img/2_character_pepe/4_hurt/H-43.png",
  ],
  DEAD: [
    "img/2_character_pepe/5_dead/D-51.png",
    "img/2_character_pepe/5_dead/D-52.png",
    "img/2_character_pepe/5_dead/D-53.png",
    "img/2_character_pepe/5_dead/D-54.png",
    "img/2_character_pepe/5_dead/D-55.png",
    "img/2_character_pepe/5_dead/D-56.png",
    "img/2_character_pepe/5_dead/D-57.png",
  ],
};
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
    this.snoringTimer = 0;
    this.snoringStarted = false;
    this.hasGroundShadow = false;
  }

  /**
/**
 * Loads all character animation frames.
 */
  initImages() {
    this.IMAGES_WALKING = CHARACTER_SPRITES.WALK;
    this.IMAGES_JUMPING = CHARACTER_SPRITES.JUMP;
    this.IMAGES_IDLE = CHARACTER_SPRITES.IDLE;
    this.IMAGES_LONG_IDLE = CHARACTER_SPRITES.LONG_IDLE;
    this.IMAGES_HURT = CHARACTER_SPRITES.HURT;
    this.IMAGES_DEAD = CHARACTER_SPRITES.DEAD;

    this._walkFrames = this._loadFrames(this.IMAGES_WALKING);
    this._jumpFrames = this._loadFrames(this.IMAGES_JUMPING);
    this._idleFrames = this._loadFrames(this.IMAGES_IDLE);
    this._longIdleFrames = this._loadFrames(this.IMAGES_LONG_IDLE);
    this._hurtFrames = this._loadFrames(this.IMAGES_HURT);
    this._deadFrames = this._loadFrames(this.IMAGES_DEAD);
    this._buildAnimMap();
  }

  /**
   * Builds the animation map once after frames are loaded.
   */
  _buildAnimMap() {
    this._animMap = {
      dead: { frames: this._deadFrames, ms: 120, loop: false },
      hurt: { frames: this._hurtFrames, ms: 120, loop: false },
      jump: { frames: this._jumpFrames, ms: 90, loop: false },
      walk: { frames: this._walkFrames, ms: 90, loop: true },
      idle: { frames: this._idleFrames, ms: 120, loop: true },
      long_idle: { frames: this._longIdleFrames, ms: 120, loop: true },
    };
  }

  /**
   * Loads animation frames from a sprite path list.
   * @param {string[]} paths
   * @returns {HTMLImageElement[]}
   */
  _loadFrames(paths) {
    return this.loadImages(paths);
  }

  updateAnimation(dtMs, moving, blockIdle = false) {
    this.updateTimers(dtMs);
    this.determineState(moving, blockIdle);
    if (this.isDead()) return this.playCurrentAnimation(dtMs);
    this.playCurrentAnimation(dtMs);
  }

  /**
   * Returns current health as percentage (0–100).
   * @returns {number}
   */
  hpPercent() {
    const current = this.hp ?? 0;
    const max = this.hpMax ?? 100;
    const pct = (100 * current) / max;
    return Math.max(0, Math.min(100, pct));
  }

  updateTimers(dtMs) {
    this.hurtT = Math.max(0, (this.hurtT || 0) - dtMs);
    const isIdle = this.state === "idle" || this.state === "long_idle";
    this.idleElapsed = isIdle ? (this.idleElapsed || 0) + dtMs : 0;
    if (isIdle && !this.snoringStarted) {
      this.snoringTimer = (this.snoringTimer || 0) + dtMs;
      if (this.snoringTimer >= 2000) {
        window.SFX?.loop?.("snoring", "character_idle", { vol: 1.0 });
        this.snoringStarted = true;
      }
    }
  }

  determineState(moving, blockIdle) {
    const next = this.calculateNextState(moving, blockIdle);
    if (next !== this.state) this.resetFrame(next);
  }

  calculateNextState(moving, blockIdle) {
    if (this.hp <= 0) return "dead";
    if (this.hurtT > 0) return "hurt";
    if (!this.onGround) return "jump";
    if (moving) return "walk";
    if (blockIdle) return "idle";
    return this.idleElapsed > 3000 ? "long_idle" : "idle";
  }

  resetFrame(next) {
    const prevState = this.state;
    this.state = next;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.updateIdleSound(prevState, next);
  }

  /**
   * Updates the snoring sound based on idle state changes.
   * Only resets timer after game has started (prevState is not undefined).
   * @param {string} prevState
   * @param {string} nextState
   */
  updateIdleSound(prevState, nextState) {
    if (prevState === undefined) return;

    const wasIdle = prevState === "idle" || prevState === "long_idle";
    const isIdle = nextState === "idle" || nextState === "long_idle";

    if (isIdle && !wasIdle) {
      this.snoringTimer = 0;
      this.snoringStarted = false;
    } else if (!isIdle && wasIdle) {
      window.SFX?.stop?.("character_idle");
      this.snoringTimer = 0;
      this.snoringStarted = false;
    }
  }

  /**
   * Returns animation config for the current state.
   * @returns {{frames: HTMLImageElement[], ms: number, loop: boolean}|null}
   */
  _getAnimConfig() {
    return this._animMap?.[this.state] || null;
  }

  /**
   * Plays the animation for the current state.
   * @param {number} dtMs
   */
  playCurrentAnimation(dtMs) {
    const cfg = this._getAnimConfig();
    if (!cfg) return;
    this._animateSequence(dtMs, cfg.frames, cfg.ms, cfg.loop);
  }

  /**
   * Returns true if the character is dead.
   * @returns {boolean}
   */
  isDead() {
    return (this.hp ?? 0) <= 0;
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
