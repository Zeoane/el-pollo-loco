// world.class.js
class World {
  canvas; ctx;
  character;
  opponents = [];
  backgroundObjects = [];
  clouds = [];
  cameraX = 0;           
  gravity = 0.6;
  groundY = 432;        
  lastTime = performance.now();
  keyboard = null;

  constructor(canvas, keyboard) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.keyboard = keyboard || null;

   
    this.character = new Character();
    if (!this.character) throw new Error('Character konnte nicht erzeugt werden');
    this.placeOnGround(this.character);

   
    this.opponents = [new Chicken(), new Chicken(), new Chicken()];
    this.initOpponents();

   
    this.backgroundObjects = [
      new BackgroundObject('img/5_background/layers/air.png',                 0, 0, null, null, 0.00, 0.00),
      new BackgroundObject('img/5_background/layers/3_third_layer/1.png',     0, 0, null, null, 0.05, 0.15),
      new BackgroundObject('img/5_background/layers/2_second_layer/1.png',    0, 0, null, null, 0.08, 0.30),
      new BackgroundObject('img/5_background/layers/1_first_layer/1.png',     0, 0, null, null, 0.12, 0.60),
    ];

  this.clouds = [
      new Cloud(50, 40, 0.25),
      new Cloud(360, 80, 0.22),
      new Cloud(700, 30, 0.28),
    ];

    this.animate();
  }

  /** Gegner initial positionieren & Eigenschaften setzen */
  initOpponents() {
    if (!Array.isArray(this.opponents)) this.opponents = [];
    let cursor = (this.character?.x ?? 0) + 500;

    this.opponents.forEach(o => {
      if (!o) return;
      o.width = 70;
      o.height = 70;
      this.placeOnGround(o);
      o.speed = 1.6 + Math.random() * 0.8;  
      o.x = cursor;
      cursor += 280 + Math.random() * 420;    
    });
  }

  /** zentraler Game-Loop (mit dt) */
  animate = (now = performance.now()) => {
    const dtMs = Math.min(50, now - this.lastTime); 
    this.lastTime = now;

    this.update(dtMs);
    this.draw();
    requestAnimationFrame(this.animate);
  };

update(dtMs) {
  const k = this.keyboard || { LEFT:false, RIGHT:false, SPACE:false };
  const runSpeed = 3.0;

  // Bewegung
  this.character.vx = (k.RIGHT ? +runSpeed : 0) + (k.LEFT ? -runSpeed : 0);

  // Springen (mit Lock optional)
  if (!this.jumpLock && k.SPACE && this.character.onGround) {
    this.character.vy = -12;
    this.character.onGround = false;
    this.jumpLock = true;
  }
  if (!k.SPACE) this.jumpLock = false;

  // Physik
  this.character.vy += this.gravity;
  this.character.x  += this.character.vx;
  this.character.y  += this.character.vy;

  // Boden
  if (this.character.y + this.character.height >= this.groundY) {
    this.character.y  = this.groundY - this.character.height;
    this.character.vy = 0;
    this.character.onGround = true;
  }
  if (this.character.x < 0) this.character.x = 0;

  const moving = !!(k.LEFT || k.RIGHT);

  // Laufanimation nur bei Bewegung
  this.character.updateAnimation?.(dtMs, moving);

  // Kamera folgt nur weich in Bewegung
  const targetCameraX = this.character.x - this.canvas.width * 0.4;
  if (moving) {
    this.cameraX += (targetCameraX - this.cameraX) * 0.1; 
  } else {
    this.cameraX = targetCameraX;
  }

  // Clouds bleiben unabhängig (weiterziehen)
  this.clouds.forEach(c => c.update(this.canvas.width));

  this.backgroundObjects.forEach(bo => bo.update(this.cameraX, this.canvas, dtMs, moving));

  // Gegner-Flow (unverändert)
  this.opponents.forEach(o => {
    o.x -= o.speed;
    this.placeOnGround(o);

    const leftBound = this.cameraX - 150;
    if (o.x + o.width < leftBound) {
      const minGap = 260, maxGap = 720;
      const ahead = this.cameraX + this.canvas.width + 200;
      const farthestX = Math.max(...this.opponents.map(op => op.x));
      o.x = Math.max(ahead, farthestX + (minGap + Math.random() * (maxGap - minGap)));
      o.speed = 1.6 + Math.random() * 0.8;
    }
  });
}


  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

ctx.save();
ctx.translate(-this.cameraX, 0);
this.backgroundObjects.forEach(bo => bo.draw(ctx, this.cameraX)); 

ctx.restore();
    // --- Dynamische Bodenschatten ---
    const falloff = (obj) => {
      const h = Math.max(0, this.groundY - (obj.y + obj.height)); 
      return Math.max(0.4, 1 - (h / 200)); 
    };

    {
      const f = falloff(this.character);
      this.character.drawGroundShadow(ctx, this.groundY, { alpha: 0.12, ryFactor: 0.10 });
      this.character.draw(ctx);
    }

    this.opponents.forEach(o => {
      const f = falloff(o);
      o.drawGroundShadow(ctx, this.groundY, { alpha: 0.08, ryFactor: 0.10 });
      o.draw(ctx);
    });

    ctx.restore();

    this.clouds.forEach(c => c.draw(ctx));
  }

  placeOnGround(obj) {
    obj.y = this.groundY - obj.height;
  }
}









