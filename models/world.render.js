// models/world.render.js

Object.assign(World.prototype, {
draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.backgroundObjects.forEach(bo => bo.draw(ctx, this.cameraX));
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.coins.forEach(c => this.addToMap(c));
    this.bottles.forEach(b => this.addToMap(b));
    this.addToMap(this.character);
    this.opponents.forEach(o => this.addToMap(o));
    this.projectiles.forEach(o => this.addToMap(o));
    ctx.restore();
    this.clouds.forEach(c => c.draw?.(ctx));
    this.hud?.draw(ctx, this);

    if (
      this.gameOver &&
      this.gameOverReason === "boss" &&
      (this.imgGameOver?.complete || window.IMG_GAME_OVER?.complete)
    ) {
      const img = this.imgGameOver || window.IMG_GAME_OVER;
      const { ctx, canvas } = this;
      const fade = Math.min(
        1,
        (performance.now() - (this.gameOverAt || 0)) / 600
      );
      const maxW = canvas.width * 0.9;
      const scale = Math.min(maxW / img.naturalWidth, 1);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    }
if (this.gameOver) {
      this.drawEndScreens();
      this.hideDomHud(); 
    }
  },



  placeOnGround(obj) {
    obj.y = this.groundY - obj.height + (obj.footOffset || 0);
  },

  addToMap(mo) {
    if (!mo) return;
    const im = mo.img,
      ok = im && im.complete && im.naturalWidth > 0 && !im._broken;
    if (!ok) {
      if (im?._broken && !mo._warned) {
        console.warn("Broken image:", mo.constructor?.name, im?.src);
        mo._warned = true;
      }
      if (mo === this.character) {
        const c = this.ctx;
        c.save();
        c.fillStyle = "rgba(200,40,40,.6)";
        c.fillRect(mo.x, mo.y, mo.width, mo.height);
        c.restore();
      }
      return;
    }
    const c = this.ctx,
      flip = mo.facing === -1 || mo.otherDirection === true;
    c.save();
    if (mo.state !== "dead")
      mo.drawGroundShadow?.(c, this.groundY, { alpha: 0.12, ryFactor: 0.1 });
    if (typeof mo.alpha === "number") c.globalAlpha = mo.alpha;
    if (flip) {
      c.translate(mo.x + mo.width, mo.y);
      c.scale(-1, 1);
      c.drawImage(im, 0, 0, mo.width, mo.height);
    } else {
      c.drawImage(im, mo.x, mo.y, mo.width, mo.height);
    }
    c.restore();
  },

drawEndScreens() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const fade = Math.min(1, (performance.now() - this.gameOverAt) / 800);
    
    ctx.save();
    ctx.globalAlpha = fade;

    if (this.gameOverReason === 'win') {
      this.drawCenteredImage(window.IMG_WON_BOSS);
    } else {
      this.drawCenteredImage(window.IMG_GAME_OVER);
      if (this.gameOverReason === 'boss' && fade > 0.8) {
        this.drawCenteredImage(window.IMG_LOST_BOSS);
      }
    }
    ctx.restore();
  },

  drawCenteredImage(img) {
    if (!img || !img.complete) return;
    const canvas = this.canvas;
    const maxW = canvas.width * 0.8;
    const scale = Math.min(maxW / img.naturalWidth, 1);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    this.ctx.drawImage(
      img,
      (canvas.width - w) / 2,
      (canvas.height - h) / 2,
      w,
      h
    );
  },

  hideDomHud() {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
  }
});
