// models/endboss.class.js
class Endboss extends MovableObject {
  constructor(){
    super();                       
    this.setSize(250, 350).setSpeed(0.15);
    this.footOffset = 10;
    this.loadImage('img/4_enemie_boss_chicken/1_walk/1_w.png');
    this.IMAGES_WALKING = [
      'img/4_enemie_boss_chicken/1_walk/1_w.png',
      'img/4_enemie_boss_chicken/1_walk/2_w.png',
      'img/4_enemie_boss_chicken/1_walk/3_w.png',
      'img/4_enemie_boss_chicken/1_walk/4_w.png',
      'img/4_enemie_boss_chicken/1_walk/5_w.png',
      'img/4_enemie_boss_chicken/1_walk/6_w.png'
    ];
    this.setWalkFrames(this.IMAGES_WALKING, 120);
  }
}
window.Endboss = Endboss;
