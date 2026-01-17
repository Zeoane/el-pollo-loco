// classes/world.items.js
Object.assign(World.prototype, {
  /**
   * Updates all collectible items each frame.
   * @param {number} dtMs 
   */
  tickCollectibles(dtMs) {
    this.coins.forEach(c => c.update?.(dtMs));
    this.bottles.forEach(b => b.update?.(dtMs));
  },

  /**
   * Checks collisions between the character and collectible items.
   * Updates inventory and removes collected items.
   */
  checkPickups() {
    const cbb = this.character.getBounds?.() || this.character;
    this.collectCoins(cbb);
    this.collectBottles(cbb);
  },

  /**
   * Collects coins that collide with the character bounds.
   * @param {Object} cbb 
   */
  collectCoins(cbb) {
    this.coins = this.coins.filter(c => {
      const hit = AABB(cbb, c.getBounds?.() || c);
      if (!hit) return true;
      this.inventory.coins++;
      SFX.play?.("coin", { vol: 0.6 });
      return false;
    });
  },

  /**
   * Collects bottles that collide with the character bounds.
   * @param {Object} cbb 
   */
  collectBottles(cbb) {
    this.bottles = this.bottles.filter(b => {
      const hit = AABB(cbb, b.getBounds?.() || b);
      if (!hit) return true;
      this.inventory.bottles++;
      SFX.play?.("bottle_pick", { vol: 0.6 });
      return false;
    });
  },

/**
 * Spawns initial collectibles based on level configuration.
 */
spawnPickups() {
  const it = this.cfg.items || {};
  this.spawnRandomCoins(it.coins || 0);
  this.spawnBottleClusters(this.getBottleClusterCount(it));
},

/**
 * Spawns a number of randomly placed coins.
 * @param {number} count
 */
spawnRandomCoins(count) {
  for (let i = 0; i < count; i++) {
    const coin = Coin.rand(this);
    // If we're in scaled mode, save the original offset (relative to original groundY)
    if (this._originalGroundY !== undefined && this.groundY !== this._originalGroundY && coin._originalOffset === undefined) {
      const offsetFromGround = coin.y - this.groundY;
      coin._originalOffset = offsetFromGround; // keep fixed pixel offset
    }
    this.coins.push(coin);
  }
},

/**
 * Returns how many bottle clusters should be spawned from item config.
 * @param {Object} it 
 * @returns {number}
 */
getBottleClusterCount(it) {
  const bottles = it.bottles || 12;
  return it.bottleClusters ?? Math.ceil(bottles / 2);
},

  /**
 * Ensures a minimum number of bottles are spawned ahead of the camera.
 * @param {number} minAhead 
 */
  maintainBottlesAhead(minAhead=6){
    const from = this.cameraX + this.canvas.width * 0.6;
    const to   = from + 1200;
    const count = this.bottles.filter(b => b.x >= from && b.x <= to).length;
    if (count < minAhead) this.spawnBottleCluster(to - 200 + Math.random()*300);
  },

/**
 * Spawns a small cluster of bottles at a given x position.
 * @param {number} baseX 
 */
spawnBottleCluster(baseX) {
  const cfg = this.getBottleClusterSpec(baseX);
  for (let i = 0; i < cfg.cnt; i++) this.spawnOneBottle(cfg, i);
},

/**
 * Builds the randomized bottle cluster specification.
 * @param {number} baseX
 * @returns {{cnt:number, dx:number, firstX:number}}
 */
getBottleClusterSpec(baseX) {
  return {
    cnt: 1 + Math.floor(Math.random() * 3),
    dx: 26 + Math.floor(Math.random() * 12),
    firstX: baseX + (Math.random() * 80 - 40),
  };
},

/**
 * Spawns a single bottle within a cluster spec.
 * @param {{dx:number, firstX:number}} cfg
 * @param {number} i
 */
spawnOneBottle(cfg, i) {
  const v = Math.random() < 0.5 ? 1 : 2;
  const y = this.groundY - 60;
  const b = new Bottle(cfg.firstX + i * cfg.dx, y, v);
  // If we're in scaled mode, save the original offset (relative to original groundY)
  if (this._originalGroundY !== undefined && this.groundY !== this._originalGroundY) {
    const offsetFromGround = y - this.groundY; // e.g. -60
    b._originalOffset = offsetFromGround; // keep fixed pixel offset
  }
  this.bottles.push(b);
},

  /**
 * Spawns multiple bottle clusters distributed across the level.
 * @param {number} total 
 */
  spawnBottleClusters(total=6){
    const len = this.cfg.lengthPx || 5000;
    const minX = (this.character.x||0) + 500;
    const maxX = Math.max(minX+800, len-600);
    for (let i=0;i<total;i++){
      const baseX = minX + Math.random()*Math.max(300, maxX - minX);
      this.spawnBottleCluster(baseX);
    }
  }
});
