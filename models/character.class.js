// models/character.class.js
class Character extends MovableObject {
  // --- Lebenswerte + Helper ---
  hpMax = 100;
  hp    = this.hpMax;
  hpPercent(){ return Math.max(0, Math.min(100, (100*this.hp)/this.hpMax)); }
  takeDamage(n=10){ this.hp = Math.max(0, this.hp - n); }
  heal(n=10){ this.hp = Math.min(this.hpMax, this.hp + n); }

  constructor(){
    super();
    this.x = 120;
    this.setSize(160,320);
    this.footOffset = 16;
    this.setHitbox(10,6, this.width-20, this.height-12);
    this.vx = 0; this.vy = 0; this.onGround = false; this.facing = 1;

    this.IMAGES_WALKING = [
      'img/2_character_pepe/2_walk/W-21.png',
      'img/2_character_pepe/2_walk/W-22.png',
      'img/2_character_pepe/2_walk/W-23.png',
      'img/2_character_pepe/2_walk/W-24.png',
      'img/2_character_pepe/2_walk/W-25.png',
      'img/2_character_pepe/2_walk/W-26.png',
    ];
    this.IMAGES_JUMPING = [
      'img/2_character_pepe/3_jump/J-31.png','img/2_character_pepe/3_jump/J-32.png',
      'img/2_character_pepe/3_jump/J-33.png','img/2_character_pepe/3_jump/J-34.png',
      'img/2_character_pepe/3_jump/J-35.png','img/2_character_pepe/3_jump/J-36.png',
      'img/2_character_pepe/3_jump/J-37.png','img/2_character_pepe/3_jump/J-38.png',
      'img/2_character_pepe/3_jump/J-39.png',
    ];
    this.setWalkFrames(this.IMAGES_WALKING, 90);
  }

  updateAnimation(dtMs, moving){
    if (!this.onGround && this.IMAGES_JUMPING?.length){
      if (!this._jumpFrames) this._jumpFrames = this.loadImages(this.IMAGES_JUMPING);
      this.img = this._jumpFrames[0]; return;
    }
    this.updateWalkAnimation(dtMs, !!moving);
  }
}



