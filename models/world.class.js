// world.class.js
class World {
  canvas; ctx; character; opponents = []; backgroundObjects = []; clouds = [];
  cameraX = 0; gravity = 0.6; groundY = 432; lastTime = performance.now();
  keyboard = null; jumpLock = false;

  constructor(canvas, keyboard) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.keyboard = keyboard || null;
    this.character = new Character(); this.placeOnGround(this.character);
    this.opponents = [new Chicken(), new Chicken(), new Chicken()]; this.initOpponents();
    this.backgroundObjects = [
      new BackgroundObject('img/5_background/layers/air.png',0,0,null,null,0.00,0.00),
      new BackgroundObject('img/5_background/layers/3_third_layer/1.png',0,0,null,null,0.05,0.15),
      new BackgroundObject('img/5_background/layers/2_second_layer/1.png',0,0,null,null,0.08,0.30),
      new BackgroundObject('img/5_background/layers/1_first_layer/1.png',0,0,null,null,0.12,0.60),
    ];
    this.clouds = [ new Cloud(50,40,0.25), new Cloud(360,80,0.22), new Cloud(700,30,0.28) ];
    this.animate();
  }

  initOpponents() {
    let cursor = (this.character?.x ?? 0) + 500;
    this.opponents.forEach(o => {
      o.width = 70; o.height = 70; this.placeOnGround(o);
      o.speed = 1.6 + Math.random()*0.8; o.x = cursor;
      cursor += 280 + Math.random()*420;
    });
  }

  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime);
    this.lastTime = now; this.update(dtMs); this.draw();
    requestAnimationFrame(this.animate);
  };

  update(dtMs) {
    const k = this.keyboard || {}; const run = 3.0;
    this.character.vx = (k.RIGHT?+run:0) + (k.LEFT?-run:0);
    if (k.RIGHT && !k.LEFT) this.character.facing = 1;
    else if (k.LEFT && !k.RIGHT) this.character.facing = -1;
    this.handleJump(k); this.applyPhysics(); this.handleGround();
    const moving = !!(k.LEFT || k.RIGHT);
    this.character.updateAnimation?.(dtMs, moving);
    this.updateCamera(moving); this.updateClouds();
    this.updateBackgrounds(dtMs, moving); this.updateOpponents();
  }

  handleJump(k) {
    if (!this.jumpLock && (k.SPACE || k.UP) && this.character.onGround) {
      this.character.vy = -12; this.character.onGround = false; this.jumpLock = true;
    }
    if (!k.SPACE && !k.UP) this.jumpLock = false;
  }

  applyPhysics() {
    this.character.vy += this.gravity;
    this.character.x += this.character.vx;
    this.character.y += this.character.vy;
  }

  handleGround() {
    if (this.character.y + this.character.height >= this.groundY) {
      this.character.y = this.groundY - this.character.height;
      this.character.vy = 0; this.character.onGround = true;
    }
    if (this.character.x < 0) this.character.x = 0;
  }

  updateCamera(moving) {
    const target = this.character.x - this.canvas.width * 0.4;
    this.cameraX = moving ? this.cameraX + (target - this.cameraX)*0.1 : target;
  }

  updateClouds() { this.clouds.forEach(c => c.update(this.canvas.width)); }

  updateBackgrounds(dtMs, moving) {
    this.backgroundObjects.forEach(bo => bo.update(this.cameraX, this.canvas, dtMs, moving));
  }

  updateOpponents() {
    const leftBound = this.cameraX - 150, ahead = this.cameraX + this.canvas.width + 200;
    const farthestX = Math.max(...this.opponents.map(op => op.x));
    this.opponents.forEach(o => {
      o.x -= o.speed; this.placeOnGround(o);
      if (o.x + o.width < leftBound) {
        const gap = 260 + Math.random() * (720 - 260);
        o.x = Math.max(ahead, farthestX + gap); o.speed = 1.6 + Math.random()*0.8;
      }
    });
  }

  draw() {
    const { ctx, canvas } = this; ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save(); ctx.translate(-this.cameraX, 0);
    this.backgroundObjects.forEach(bo => bo.draw(ctx, this.cameraX));
    this.addToMap(this.character); this.opponents.forEach(o => this.addToMap(o));
    ctx.restore(); this.clouds.forEach(c => c.draw(ctx));
  }

  placeOnGround(obj) { obj.y = this.groundY - obj.height; }

  addToMap(mo) {
    if (!mo) return; const { ctx } = this;
    mo.drawGroundShadow?.(ctx, this.groundY, { alpha: 0.12, ryFactor: 0.10 });
    if (!mo.img) return; const flipped = mo.facing === -1 || mo.otherDirection === true;
    if (flipped) { ctx.save(); ctx.translate(mo.x + mo.width, mo.y); ctx.scale(-1,1);
      ctx.drawImage(mo.img, 0, 0, mo.width, mo.height); ctx.restore(); }
    else ctx.drawImage(mo.img, mo.x, mo.y, mo.width, mo.height);
  }
}









