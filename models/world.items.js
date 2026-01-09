// models/world.items.js
Object.assign(World.prototype, {
  tickCollectibles(dtMs){
    this.coins.forEach(c => c.update?.(dtMs));
    this.bottles.forEach(b => b.update?.(dtMs));
  },

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

  spawnPickups(){
    const it = this.cfg.items || {};
    for (let i=0;i<(it.coins||0);i++) this.coins.push(Coin.rand(this));
    const clusters = it.bottleClusters ?? Math.ceil((it.bottles || 12)/2);
    this.spawnBottleClusters(clusters);
  },

  maintainBottlesAhead(minAhead=6){
    const from = this.cameraX + this.canvas.width * 0.6;
    const to   = from + 1200;
    const count = this.bottles.filter(b => b.x >= from && b.x <= to).length;
    if (count < minAhead) this.spawnBottleCluster(to - 200 + Math.random()*300);
  },

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
