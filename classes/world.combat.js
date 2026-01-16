// classes/world.combat.js
Object.assign(World.prototype, {
  /**
   * Handles bottle throwing with a charge mechanic (hold to increase speed).
   * @param {number} dtMs - Delta time in milliseconds
   */
  updateThrow(dtMs) {
    const KB = window.keyboard || this.keyboard || {};
    const fire = KB.F || KB.G || KB.THROW;
    const ts = this.throwState;

    if (!fire && !ts.charging) return;
    if ((this.inventory.bottles || 0) <= 0 && !ts.charging) return;

    fire ? this.chargeThrow(ts, dtMs) : this.releaseThrow(ts);
  },

  /**
   * Updates the charge timer while the throw key is held down.
   * @param {Object} ts - Throw state
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
   * @param {Object} ts - Throw state
   */
  releaseThrow(ts) {
    if (!ts.charging) return;
    ts.charging = false;
    if ((this.inventory.bottles || 0) <= 0) return;

    const pow = 1 + (ts.holdMs / ts.maxMs) * 1.5;
    const dir = this.character.facing === -1 ? -1 : 1;
    this.spawnProjectile(dir, pow);
  },

  /**
   * Spawns a projectile with optional speed multiplier and consumes one bottle.
   * @param {number} dir - Direction (-1 or 1)
   * @param {number} pow - Speed multiplier
   */
  spawnProjectile(dir, pow) {
    this.projectiles.push(
      new Projectile(
        this.character.x + this.character.width / 2,
        this.character.y + 20,
        dir,
        { speedMul: pow }
      )
    );
    this.inventory.bottles--;
    SFX.play?.("bottle_throw", { vol: 0.8 });
  },

  /**
   * Updates all projectiles, resolves impacts, and removes dead entities.
   * @param {number} dtMs - Delta time in milliseconds
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
   * @param {Object} p - Projectile
   * @returns {Object|null}
   */
  findProjectileHit(p) {
    return (
      this.opponents.find(
        (o) => !(o.state === "dead" || o._dead) && AABB(p, o)
      ) || null
    );
  },

  /**
   * Applies damage to a hit opponent (supports custom onHit handlers).
   * @param {Object} target - Opponent hit by a projectile
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
   * @param {number} dtMs - Delta time in milliseconds
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
  isStomp(c, e) {
    return c.prevY + c.height <= e.y + 8 && c.vy > 0;
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
   * @param {"enemy"|"boss"|"win"} reason - Reason for game over state
   */
  triggerGameOver(reason = "enemy") {
    if (this.gameOver) return;
    this.gameOver = true;
    this.gameOverReason = reason;
    this.gameOverAt = performance.now();
    this.pause(true);
    SFX.stop?.("menu");
    window.playEndSound?.(reason);
  },

  /**
   * Handles character healing using coins with cooldown and validation checks.
   * @param {number} dtMs - Delta time in milliseconds
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
