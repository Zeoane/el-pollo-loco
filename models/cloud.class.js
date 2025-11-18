// cloud.class.js
class Cloud extends MovableObject {
  constructor(x, y, speed = 0.3) {
    super();
    this.x = x;
    this.y = y;
    this.width = 340;
    this.height = 280;
    this.speed = speed;


    this.loadImageFromCandidates([
      'img//5_background//layers//4_clouds//1.png',
      'img//5_background//layers//4_clouds//2.png',
      'img//5_background//layers//4_clouds//full.png'
    ]);
  }

  update(canvasWidth) {
    this.x -= this.speed;
    if (this.x + this.width < 0) {
      this.x = canvasWidth + Math.random() * 200;
      this.y = 20 + Math.random() * 150;
    }
  }


  draw(ctx) {
    if (this.imageLoaded && this.img && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

