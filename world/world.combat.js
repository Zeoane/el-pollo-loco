Object.assign(World.prototype, {
  /**
   * Handles bottle throwing with a charge mechanic (hold to increase speed).
   * @param {number} dtMs
   */
  updateThrow(dtMs) {
    const KB = window.keyboard || this.keyboard || {};
    const fire = KB.F || KB.G || KB.THROW;
    const ts = this.throwState;

    ts.powerCdMs = Math.max(0, (ts.powerCdMs || 0) - dtMs);
    if (ts.powerCdMs > 0 && !ts.charging) return;
    if (!fire && !ts.charging) return;
    if ((this.inventory.bottles || 0) <= 0 && !ts.charging) return;

    fire ? this.chargeThrow(ts, dtMs) : this.releaseThrow(ts);
  },

  /**
   * Updates the charge timer while the throw key is held down.
   * @param {Object} ts
   * @param {number} dtMs
   */
  chargeThrow(ts, dtMs) {
    if (!ts.charging) {
      ts.charging = true;
      ts.holdMs = 0;
    }
    ts.holdMs = Math.min(ts.holdMs + dtMs, ts.maxMs);
  },

  /**
   * Releases a charged throw and spawns a projectile if ammo is available.
   * @param {Object} ts
   */
  releaseThrow(ts) {
    if (!ts.charging) return;
    ts.charging = false;
    if ((this.inventory.bottles || 0) <= 0) return;

    const pow = 1 + (ts.holdMs / ts.maxMs) * 1.5;
    const dir = this.character.facing === -1 ? -1 : 1;
    this.spawnProjectile(dir, pow);
    if (this.isBossFightActive?.() && ts.holdMs >= ts.maxMs) {
      ts.powerCdMs = Math.max(ts.powerCdMs || 0, 500);
    }
  },

  /**
   * Spawns a projectile with optional speed multiplier and consumes one bottle.
   * @param {number} dir
   * @param {number} pow
   */
  spawnProjectile(dir, pow) {
    const c = this.character;
    const spawnX = c.x + c.width / 2;
    const spawnY = c.y + c.height * 0.45;
    this.projectiles.push(
      new Projectile(spawnX, spawnY, dir, { speedMul: pow }),
    );
    this.inventory.bottles--;
    SFX.play?.("bottle_throw", { vol: 0.8 });
  },

  /**
   * Updates all projectiles, resolves impacts, and removes dead entities.
   * @param {number} dtMs
   */
  updateProjectiles(dtMs) {
    this.updateProjectileFlight(dtMs);
    this.resolveProjectileHits();
    this.cleanupProjectilesAndOpponents();
  },

  /**
   * Advances projectile movement and triggers ground splashes.
   * @param {number} dtMs
   */
  updateProjectileFlight(dtMs) {
    const gY = this.groundY;
    this.projectiles.forEach((p) => {
      p.update(dtMs);
      if (p.state === "fly" && p.y + p.height >= gY) p.hitAndSplash(gY);
    });
  },

  /**
   * Checks projectile collisions with opponents and applies damage.
   */
  resolveProjectileHits() {
    this.projectiles.forEach((p) => {
      if (p.state !== "fly") return;
      const hit = this.findProjectileHit(p);
      if (!hit) return;
      this.applyHitDamage(hit);
      SFX.play?.("bottle_hit", { vol: 0.8 });
      p.hitAndSplash();
    });
  },

  /**
   * Removes projectiles and opponents flagged as dead.
   */
  cleanupProjectilesAndOpponents() {
    this.projectiles = this.projectiles.filter((p) => !p._dead);
    this.opponents = this.opponents.filter((o) => !o._dead);
  },

  /**
   * Finds the first opponent hit by a projectile.
   * @param {Object} p
   * @returns {Object|null}
   */
  findProjectileHit(p) {
    return (
      this.opponents.find(
        (o) => !(o.state === "dead" || o._dead) && AABB(p, o),
      ) || null
    );
  },

  /**
   * Applies damage to a hit opponent (supports custom onHit handlers).
   * @param {Object} target
   */
  applyHitDamage(target) {
    if (typeof target.onHit === "function") {
      target.onHit(25);
      return;
    }
    target.hp = (target.hp || 1) - 1;
    if (target.hp <= 0) target.die?.();
  },

  /**
   * Resolves collisions between the character and living opponents.
   * Supports stomp kills and damage hits with invulnerability frames.
   * @param {number} dtMs
   */
  checkCharEnemyCollisions(dtMs) {
    if (!this.canProcessCharHit(dtMs)) return;

    const c = this.character;
    const cb = c.getBounds?.() || c;

    for (const e of this.opponents) {
      if (this.isDeadEnemy(e)) continue;
      if (!AABB(cb, e.getBounds?.() || e)) continue;

      this.isStomp(c, e) ? this.applyStomp(c, e) : this.applyEnemyHit(c, e);
      break;
    }
  },

  /**
   * Updates invulnerability timer and checks whether collisions should be processed.
   * @param {number} dtMs
   * @returns {boolean}
   */
  canProcessCharHit(dtMs) {
    const c = this.character;
    c.invT = Math.max(0, (c.invT || 0) - dtMs);
    return !c.invT;
  },

  /**
   * Checks whether an enemy should be considered dead.
   * @param {Object} e
   * @returns {boolean}
   */
  isDeadEnemy(e) {
    return !!(e._dead || e.state === "dead");
  },

  /**
   * Returns true if the character is stomping the enemy from above.
   * @param {Object} c
   * @param {Object} e
   * @returns {boolean}
   */
  getStompBounds(c, e) {
    const cb = c.getBounds?.() || c;
    const eb = e.getBounds?.() || e;
    const cbOffsetY = (cb.y ?? 0) - (c.y ?? cb.y ?? 0);
    const cbHeight = cb.height ?? c.height ?? 0;
    const prevBottom = (c.prevY ?? c.y ?? 0) + cbOffsetY + cbHeight;
    const currBottom = (cb.y ?? c.y ?? 0) + cbHeight;
    const enemyTop = eb.y ?? e.y ?? 0;
    return { cb, eb, prevBottom, currBottom, enemyTop };
  },

  hasStompOverlapX(c, e, cb, eb) {
    const inset = 3;
    const cbX = cb.x ?? c.x ?? 0;
    const cbWidth = cb.width ?? c.width ?? 0;
    const footLeft = cbX + inset;
    const footRight = cbX + cbWidth - inset;
    const enemyLeft = eb.x ?? e.x ?? 0;
    const enemyRight = enemyLeft + (eb.width ?? e.width ?? 0);
    return footRight > enemyLeft && footLeft < enemyRight;
  },

  isStomp(c, e) {
    const { cb, eb, prevBottom, currBottom, enemyTop } =
      this.getStompBounds(c, e);
    const overlapX = this.hasStompOverlapX(c, e, cb, eb);
    return (
      c.vy > 0 &&
      prevBottom <= enemyTop + 10 &&
      currBottom >= enemyTop - 2 &&
      overlapX
    );
  },

  /**
   * Applies stomp kill logic to an enemy and bounces the character.
   * @param {Object} c
   * @param {Object} e
   */
  applyStomp(c, e) {
    e.die?.();
    SFX.play?.("chicken", { vol: 0.6 });
    c.vy = -8;
  },

  /**
   * Applies damage to the character from an enemy and triggers game over if needed.
   * @param {Object} c
   * @param {Object} e
   */
  applyEnemyHit(c, e) {
    c.hp = Math.max(0, (c.hp ?? 100) - (e.dmg ?? 20));
    c.invT = 600;
    c.hurtT = 400;
    c.vx = c.facing === 1 ? -2.5 : 2.5;

    SFX.play?.("hit", { vol: 0.9 });
    if ((c.hp ?? 0) > 0 || this.gameOver) return;

    const byBoss = e instanceof Endboss;
    this.triggerGameOver(byBoss ? "boss" : "enemy");
  },

  /**
   * Ends the game, freezes gameplay, and triggers end screen + sounds.
   * @param {"enemy"|"boss"|"win"} reason
   */
  triggerGameOver(reason = "enemy") {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gameOverReason = reason;
    this.gameOverAt = performance.now();
    this.pause(true);
    SFX.stop?.("menu");
    window.playEndSound?.(reason);
    window.showEndControls?.();
  },

  /**
   * Handles character healing using coins with cooldown and validation checks.
   * @param {number} dtMs
   */
  handleHeal(dtMs) {
    this.updateHealCooldown(dtMs);
    if (!this.canHeal()) return;

    this.applyHeal();
    this.startHealCooldown();
  },

  /**
   * Updates the heal cooldown timer.
   * @param {number} dtMs
   */
  updateHealCooldown(dtMs) {
    this._healCdMs = Math.max(0, (this._healCdMs || 0) - dtMs);
  },

  /**
   * Checks whether healing can currently be performed.
   * @returns {boolean}
   */
  canHeal() {
    const KB = window.keyboard || this.keyboard || {};
    this.keyboard = KB;

    if (!KB.HEAL) return false;
    if (this.character?.state === "dead" || (this.character?.hp ?? 0) <= 0)
      return false;
    if (this._healCdMs > 0) return false;

    const max = this.character.hpMax ?? 100;
    const hp = this.character.hp ?? max;
    const cost = this.healCfg.coinCost || 3;

    return hp < max && (this.inventory.coins || 0) >= cost;
  },

  /**
   * Applies healing to the character and consumes coins.
   */
  applyHeal() {
    const max = this.character.hpMax ?? 100;
    const hp = this.character.hp ?? max;
    const gain = Math.round(max * ((this.healCfg.hpPct || 20) / 100));

    this.inventory.coins -= this.healCfg.coinCost || 3;
    this.character.hp = Math.min(max, hp + gain);
    SFX.play?.("heal_chimes", { vol: 0.8 });
  },

  /**
   * Starts the heal cooldown timer.
   */
  startHealCooldown() {
    this._healCdMs = this.healCfg.cdMs || 1000;
  },
});
