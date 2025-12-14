// models/character.class.js
class Character extends MovableObject {
  constructor(){
    super(); // MUSS als erstes!

    // Basiswerte
    this.hpMax = 100;
    this.hp    = 100;

    // Geometrie/Physik
    this.x = 120;
    this.setSize(160, 320);
    this.footOffset = 16;
    this.setHitbox(10, 6, this.width - 20, this.height - 12);
    this.vx = 0; this.vy = 0; this.onGround = false; this.facing = 1;

    // Animation-Frames
    this.IMAGES_WALKING = [
      'img/2_character_pepe/2_walk/W-21.png',
      'img/2_character_pepe/2_walk/W-22.png',
      'img/2_character_pepe/2_walk/W-23.png',
      'img/2_character_pepe/2_walk/W-24.png',
      'img/2_character_pepe/2_walk/W-25.png',
      'img/2_character_pepe/2_walk/W-26.png',
    ];
    this.IMAGES_JUMPING = [
      'img/2_character_pepe/3_jump/J-31.png',
      'img/2_character_pepe/3_jump/J-32.png',
      'img/2_character_pepe/3_jump/J-33.png',
      'img/2_character_pepe/3_jump/J-34.png',
      'img/2_character_pepe/3_jump/J-35.png',
      'img/2_character_pepe/3_jump/J-36.png',
      'img/2_character_pepe/3_jump/J-37.png',
      'img/2_character_pepe/3_jump/J-38.png',
      'img/2_character_pepe/3_jump/J-39.png',
    ];
    this.IMAGES_IDLE = [
      'img/2_character_pepe/1_idle/idle/I-1.png',
      'img/2_character_pepe/1_idle/idle/I-2.png',
      'img/2_character_pepe/1_idle/idle/I-3.png',
      'img/2_character_pepe/1_idle/idle/I-4.png',
      'img/2_character_pepe/1_idle/idle/I-5.png',
      'img/2_character_pepe/1_idle/idle/I-6.png',
      'img/2_character_pepe/1_idle/idle/I-7.png',
      'img/2_character_pepe/1_idle/idle/I-8.png',
      'img/2_character_pepe/1_idle/idle/I-9.png',
      'img/2_character_pepe/1_idle/idle/I-10.png',
    ];
    this.IMAGES_LONG_IDLE = [
      'img/2_character_pepe/1_idle/long_idle/I-11.png',
      'img/2_character_pepe/1_idle/long_idle/I-12.png',
      'img/2_character_pepe/1_idle/long_idle/I-13.png',
      'img/2_character_pepe/1_idle/long_idle/I-14.png',
      'img/2_character_pepe/1_idle/long_idle/I-15.png',
      'img/2_character_pepe/1_idle/long_idle/I-16.png',
      'img/2_character_pepe/1_idle/long_idle/I-17.png',
      'img/2_character_pepe/1_idle/long_idle/I-18.png',
      'img/2_character_pepe/1_idle/long_idle/I-19.png',
      'img/2_character_pepe/1_idle/long_idle/I-20.png',
    ];
    this.IMAGES_HURT = [
      'img/2_character_pepe/4_hurt/H-41.png',
      'img/2_character_pepe/4_hurt/H-42.png',
      'img/2_character_pepe/4_hurt/H-43.png',
    ];
    this.IMAGES_DEAD = [
      'img/2_character_pepe/5_dead/D-51.png',
      'img/2_character_pepe/5_dead/D-52.png',
      'img/2_character_pepe/5_dead/D-53.png',
      'img/2_character_pepe/5_dead/D-54.png',
      'img/2_character_pepe/5_dead/D-55.png',
      'img/2_character_pepe/5_dead/D-56.png',
      'img/2_character_pepe/5_dead/D-57.png',
    ];

    this.setWalkFrames(this.IMAGES_WALKING, 90);
    this.idleElapsed = 0;              // für Idle → Long Idle
    this.state = 'idle';                // 'idle' | 'walk' | 'jump' | 'hurt' | 'dead'
  }

  hpPercent(){ return Math.max(0, Math.min(100, (100*this.hp)/this.hpMax)); }

  updateAnimation(dtMs, moving){
    // State bestimmen
    if (this.hp<=0)       this.state='dead';
    else if (!this.onGround) this.state='jump';
    else if (moving)      this.state='walk';
    else                  this.state = (this.idleElapsed>3000 ? 'long_idle' : 'idle');

    // Idle-Timer
    this.idleElapsed = moving || this.state!=='idle'
      ? 0
      : Math.min(4000, this.idleElapsed + dtMs);

    // Frames je State
    if (this.state==='jump'){
      if (!this._jumpFrames) this._jumpFrames = this.loadImages(this.IMAGES_JUMPING);
      this._animateSequence(dtMs, this._jumpFrames, 90, /*loop*/false);
      return;
    }
    if (this.state==='walk'){
      this.updateWalkAnimation(dtMs, true);
      return;
    }
    if (this.state==='hurt'){
      if (!this._hurtFrames) this._hurtFrames = this.loadImages(this.IMAGES_HURT);
      this._animateSequence(dtMs, this._hurtFrames, 120, false);
      return;
    }
    if (this.state==='dead'){
      if (!this._deadFrames) this._deadFrames = this.loadImages(this.IMAGES_DEAD);
      this._animateSequence(dtMs, this._deadFrames, 120, false);
      return;
    }
    // idle / long_idle
    const src = (this.state==='long_idle') ? '_longIdleFrames' : '_idleFrames';
    if (!this[src]) this[src] = this.loadImages(this.state==='long_idle' ? this.IMAGES_LONG_IDLE : this.IMAGES_IDLE);
    this._animateSequence(dtMs, this[src], 120, true);
  }

  _animateSequence(dtMs, frames, frameMs=100, loop=true){
    if (!frames?.length) return;
    this.frameElapsedMs = (this.frameElapsedMs||0) + dtMs;
    if (this.frameElapsedMs >= frameMs){
      this.frameElapsedMs = 0;
      this.frameIndex = ((this.frameIndex||0) + 1);
      if (loop) this.frameIndex %= frames.length;
      else this.frameIndex = Math.min(this.frameIndex, frames.length-1);
    }
    this.img = frames[this.frameIndex||0] || frames[0];
  }
}
window.Character = Character;

