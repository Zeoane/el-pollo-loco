// classes/world.items.js
/**
 * Updates all collectible items each frame.
 * @param {number} dtMs - Delta time in milliseconds
 */
Object.assign(World.prototype, {
  tickCollectibles(dtMs){
    this.coins.forEach(c => c.update?.(dtMs));
    this.bottles.forEach(b => b.update?.(dtMs));
  },

  /**
 * Checks collisions between the character and collectible items.
 * Increases inventory and removes collected items.
 */
  checkPickups(){
    const cbb = this.character.getBounds?.() || this.character;

    this.coins = this.coins.filter(c => {
      const hit = AABB(cbb, c.getBounds?.() || c);
      if (hit){ this.inventory.coins++; SFX.play?.('coin',{vol:.6}); return false; }
      return true;
    });

    this.bottles = this.bottles.filter(b => {
      const hit = AABB(cbb, b.getBounds?.() || b);
      if (hit){ this.inventory.bottles++; SFX.play?.('bottle_pick',{vol:.6}); return false; }
      return true;
    });
  },

  /**
 * Spawns initial collectible items based on level configuration.
 */
  spawnPickups(){
    const it = this.cfg.items || {};
    for (let i=0;i<(it.coins||0);i++) this.coins.push(Coin.rand(this));
    const clusters = it.bottleClusters ?? Math.ceil((it.bottles || 12)/2);
    this.spawnBottleClusters(clusters);
  },

  /**
 * Ensures a minimum number of bottles are spawned ahead of the camera.
 * @param {number} minAhead - Minimum number of bottles ahead of the player
 */
  maintainBottlesAhead(minAhead=6){
    const from = this.cameraX + this.canvas.width * 0.6;
    const to   = from + 1200;
    const count = this.bottles.filter(b => b.x >= from && b.x <= to).length;
    if (count < minAhead) this.spawnBottleCluster(to - 200 + Math.random()*300);
  },

  /**
 * Spawns a small cluster of bottles at a given x position.
 * @param {number} baseX - Base x-coordinate for the cluster
 */
  spawnBottleCluster(baseX){
    const cnt = 1 + Math.floor(Math.random()*3);
    const dx  = 26 + Math.floor(Math.random()*12);
    const firstX = baseX + (Math.random()*80 - 40);
    for (let i=0;i<cnt;i++){
      const v = Math.random()<0.5 ? 1 : 2;
      const b = new Bottle(firstX + i*dx, this.groundY - 60, v);
      this.bottles.push(b);
    }
  },

  /**
 * Spawns multiple bottle clusters distributed across the level.
 * @param {number} total - Number of clusters to spawn
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
