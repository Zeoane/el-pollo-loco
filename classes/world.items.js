Object.assign(World.prototype, {
  /**
   * Updates all collectible items each frame.
   * @param {number} dtMs
   */
  tickCollectibles(dtMs) {
    this.coins.forEach((c) => c.update?.(dtMs));
    this.bottles.forEach((b) => b.update?.(dtMs));
  },

  /**
   * Initializes the item budget from level config.
   */
  initItemBudget() {
    const items = this.cfg?.items || {};
    const coins = Number.isFinite(items.coins) ? items.coins : 0;
    const bottles = Number.isFinite(items.bottles) ? items.bottles : 0;
    this.itemBudget = { coins, bottles };
    this.itemBudgetActive = false;
  },

  /**
   * Consumes budget for a given item type.
   * @param {"coins"|"bottles"} type
   * @param {number} count
   * @returns {number}
   */
  consumeItemBudget(type, count) {
    if (!this.itemBudget) return count;
    const bossActive = !!this.isBossFightActive?.();
    if (!bossActive) return count;
    if (!this.itemBudgetActive) return count;
    const want = Math.max(0, count || 0);
    const left = Math.max(0, this.itemBudget[type] ?? 0);
    const take = Math.min(left, want);
    this.itemBudget[type] = left - take;
    return take;
  },

  /**
   * Checks collisions between the character and collectible items.
   * Updates inventory and removes collected items.
   */
  checkPickups() {
    const base =
      this.character.getBounds?.() ||
      this.character;
    const coinBounds =
      this.character.getPickupBounds?.(34) || base;
    const bottleBounds =
      this.character.getPickupBounds?.(40) || base;
    this.collectCoins(coinBounds);
    this.collectBottles(bottleBounds);
  },

  /**
   * Collects coins that collide with the character bounds.
   * @param {Object} cbb
   */
  collectCoins(cbb) {
    this.coins = this.coins.filter((c) => {
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
    this.bottles = this.bottles.filter((b) => {
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
    this.itemBudgetActive = true;
  },

  /**
   * Spawns a number of randomly placed coins.
   * @param {number} count
   */
  spawnRandomCoins(count) {
    const total = this.consumeItemBudget?.("coins", count) ?? count;
    if (total <= 0) return;
    for (let i = 0; i < total; i++) {
      const coin = Coin.rand(this);
      if (
        this._originalGroundY !== undefined &&
        this.groundY !== this._originalGroundY &&
        coin._originalOffset === undefined
      ) {
        const offsetFromGround = coin.y - this.groundY;
        coin._originalOffset = offsetFromGround;
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
    const budget = this.itemBudget?.bottles;
    const bottles = Number.isFinite(budget) ? budget : it.bottles || 12;
    return it.bottleClusters ?? Math.ceil(bottles / 2);
  },

  /**
   * Ensures a minimum number of bottles are spawned ahead of the camera.
   * @param {number} minAhead
   */
  maintainBottlesAhead(minAhead = 6) {
    if (this.isBossFightActive?.()) return;
    if ((this.itemBudget?.bottles ?? 1) <= 0) return;
    const from = this.cameraX + this.canvas.width * 0.6;
    const to = from + 1200;
    const count = this.bottles.filter((b) => b.x >= from && b.x <= to).length;
    if (count < minAhead)
      this.spawnBottleCluster(to - 200 + Math.random() * 300);
  },

  /**
   * Spawns a small cluster of bottles at a given x position.
   * @param {number} baseX
   */
  spawnBottleCluster(baseX) {
    const cfg = this.getBottleClusterSpec(baseX);
    const total = this.consumeItemBudget?.("bottles", cfg.cnt) ?? cfg.cnt;
    if (total <= 0) return;
    for (let i = 0; i < total; i++) this.spawnOneBottle(cfg, i);
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
    if (
      this._originalGroundY !== undefined &&
      this.groundY !== this._originalGroundY
    ) {
      const offsetFromGround = y - this.groundY;
      b._originalOffset = offsetFromGround;
    }
    this.bottles.push(b);
  },

  /**
   * Spawns multiple bottle clusters distributed across the level.
   * @param {number} total
   */
  spawnBottleClusters(total = 6) {
    const len = this.cfg.lengthPx || 5000;
    const minX = (this.character.x || 0) + 500;
    const maxX = Math.max(minX + 800, len - 600);
    for (let i = 0; i < total; i++) {
      const baseX = minX + Math.random() * Math.max(300, maxX - minX);
      this.spawnBottleCluster(baseX);
    }
  },

  /**
   * Triggers game over when no coins or bottles remain in the level.
   */
  checkResourceExhaustion() {
    if (this.gameOver) return;
    const cfgItems = this.cfg?.items || {};
    const coinsTotal = cfgItems.coins ?? 0;
    const bottlesTotal = cfgItems.bottles ?? 0;
    const coinsLeft = (this.inventory?.coins || 0) + (this.coins?.length || 0);
    const bottlesLeft =
      (this.inventory?.bottles || 0) + (this.bottles?.length || 0);

    if (coinsTotal > 0 && coinsLeft <= 0) {
      this.triggerGameOver?.("no_coins");
      return;
    }
    if (bottlesTotal > 0 && bottlesLeft <= 0) {
      this.triggerGameOver?.("no_bottles");
    }
  },
});
