/**
 * Main render loop entry point.
 * Clears the canvas and renders world, entities, HUD and end screen.
 */
Object.assign(World.prototype, {
  draw() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.drawWorldLayer(ctx);
    this.drawEntitiesLayer(ctx);
    this.drawHudLayer(ctx);
    this.drawEndScreenIfNeeded();
  },

  /**
   * Draws all static world background elements.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawWorldLayer(ctx) {
    this.backgroundObjects.forEach((bo) => bo.draw(ctx, this.cameraX));
  },

  /**
   * Draws all dynamic game entities affected by camera movement.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawEntitiesLayer(ctx) {
    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.coins.forEach((c) => this.addToMap(c));
    this.bottles.forEach((b) => this.addToMap(b));
    this.addToMap(this.character);
    this.opponents.forEach((o) => this.addToMap(o));
    this.projectiles.forEach((p) => this.addToMap(p));
    ctx.restore();
    this.clouds.forEach((c) => c.draw?.(ctx));
  },

  /**
   * Draws the HUD overlay elements.
   * @param {CanvasRenderingContext2D} ctx
   */
  drawHudLayer(ctx) {
    this.hud?.draw(ctx, this);
  },

  /**
   * Renders the end screen if the game is over.
   */
  drawEndScreenIfNeeded() {
    if (this.gameOver) this.drawEndScreenSequence();
  },

  /**
   * Draws the appropriate end screen depending on the game over reason.
   */
  drawEndScreenSequence() {
    let img = window.IMG_GAME_OVER;
    if (this.gameOverReason === "lost_boss") img = window.IMG_LOST_BOSS;
    if (this.gameOverReason === "won_boss" || this.gameOverReason === "win")
      img = window.IMG_WON_BOSS;
    if (img && img.complete && img.naturalWidth > 0) {
      this.drawCenteredImage(img);
    } else {
      this.ctx.fillStyle = "rgba(0,0,0,0.5)";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  placeOnGround(obj) {
    obj.y = this.groundY - obj.height + (obj.footOffset || 0);
  },

  /**
   * Draws a movable object onto the canvas if its image is valid.
   * @param {Object} mo
   */
  addToMap(mo) {
    if (!this.isDrawable(mo)) return;
    const ctx = this.ctx;
    const flip = mo.facing === -1 || mo.otherDirection === true;

    ctx.save();
    this.applyObjectAlpha(ctx, mo);
    this.drawObjectShadow(ctx, mo);

    flip ? this.drawFlipped(ctx, mo) : this.drawNormal(ctx, mo);
    ctx.restore();
  },

  /**
   * Checks whether an object can be drawn.
   * @param {Object} mo
   * @returns {boolean}
   */
  isDrawable(mo) {
    const img = mo?.img;
    return !!(img && img.complete && img.naturalWidth > 0 && !img._broken);
  },

  /**
   * Applies alpha transparency if defined.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} mo
   */
  applyObjectAlpha(ctx, mo) {
    if (typeof mo.alpha === "number") ctx.globalAlpha = mo.alpha;
  },

  /**
   * Draws ground shadow for living objects.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} mo
   */
  drawObjectShadow(ctx, mo) {
    if (mo.state !== "dead") {
      mo.drawGroundShadow?.(ctx, this.groundY, { alpha: 0.12, ryFactor: 0.1 });
    }
  },

  /**
   * Draws an object facing the normal direction.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} mo
   */
  drawNormal(ctx, mo) {
    ctx.drawImage(mo.img, mo.x, mo.y, mo.width, mo.height);
  },

  /**
   * Draws an object flipped horizontally.
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} mo
   */
  drawFlipped(ctx, mo) {
    ctx.translate(mo.x + mo.width, mo.y);
    ctx.scale(-1, 1);
    ctx.drawImage(mo.img, 0, 0, mo.width, mo.height);
  },

  /**
   * Draws an image centered on the canvas while keeping its aspect ratio.
   * The image is scaled down to fit within the canvas width if necessary.
   * @param {HTMLImageElement} img - Image to render
   */
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
      h,
    );
  },

  /**
   * Hides the DOM-based HUD overlay.
   * Used when switching to full-canvas end screens.
   */
  hideDomHud() {
    const hud = document.getElementById("hud");
    if (hud) hud.style.display = "none";
  },
});
