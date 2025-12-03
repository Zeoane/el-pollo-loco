// chicken.class.js
class Chicken extends MovableObject {
  constructor() {
    super();
    this.footOffset = 6;
    this.setSize(60,60).setSpeed(0.8);
    this.loadImage('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
  }
  
}

