// models/smallchicken.class.js
class SmallChicken extends MovableObject {
  constructor(){
    super();
    this.spriteFacing = -1;   
    this.facing = 1;
    this.footOffset = 4;
    this.setSize(46, 46).setSpeed(1.15);
    this.setHitbox(5, 3, 36, 40);

    this.IMAGES_WALK = [
      'img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
      'img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
      'img/3_enemies_chicken/chicken_small/1_walk/3_w.png',
    ];
    this.setWalkFrames(this.IMAGES_WALK, 120);

    this.deadImg = new Image();
    this.deadImg.src = 'img/3_enemies_chicken/chicken_small/2_dead/dead.png';
    this.hp = 1;            
    this.dmg = 10;          
  }

  onDie(){                 
    this.img = this.deadImg; this.speed = 0;
  }
}
window.SmallChicken = SmallChicken;
