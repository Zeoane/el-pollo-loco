/**
 * Represents a moving cloud entity in the game world.
 * Clouds move from right to left and respawn when leaving the screen.
 */
class Cloud extends MovableObject {
  /**
   * Creates a cloud instance.
   * @param {number} x
   * @param {number} y
   * @param {number} [speed=0.3]
   */
  constructor(x, y, speed = 0.3) {
    super();
    this.x = x;
    this.y = y;
    this.width = 340;
    this.height = 280;
    this.speed = speed;

    this.loadImageFromCandidates([
      "img//5_background//layers//4_clouds//1.png",
      "img//5_background//layers//4_clouds//2.png",
      "img//5_background//layers//4_clouds//full.png",
    ]);
  }

  /**
   * Updates cloud position and respawns it when leaving the screen.
   * @param {number} canvasWidth - Width of the canvas
   */
  update(canvasWidth) {
    this.x -= this.speed;
    if (this.x + this.width < 0) {
      this.x = canvasWidth + Math.random() * 200;
      this.y = 20 + Math.random() * 150;
    }
  }

  /**
   * Draws the cloud on the canvas.
   * Falls back to a placeholder rectangle if the image is not loaded.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.imageLoaded && this.img && this.img.naturalWidth > 0) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

window.Cloud = Cloud;
