// chicken.class.js
class Chicken extends MovableObject {
  constructor() {
    super();
    this.width = 60;
    this.height = 60;
    this.speed = 0.8; 
    this.loadImage('img/3_enemies_chicken/chicken_normal/1_walk/1_w.png');
  }

  draw(ctx) {
    if (this.imageLoaded) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'sienna';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}
