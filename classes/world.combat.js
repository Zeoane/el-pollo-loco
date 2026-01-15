// models/world.combat.js
Object.assign(World.prototype, {
  handleThrow() {
    const KB = window.keyboard || this.keyboard || {};
    const fire = KB.F || KB.G || KB.THROW;
    if (fire && (this.inventory.bottles || 0) > 0 && !this.throwLock) {
      const dir = this.character.facing === -1 ? -1 : 1;
      const p = new Projectile(
        this.character.x + this.character.width / 2,
        this.character.y + 20,
        dir
      );
      this.projectiles.push(p);
      this.inventory.bottles--;
      this.throwLock = true;
      SFX.play?.("bottle_throw", { vol: 0.8 });
    }
    if (!KB.F && !KB.G && !KB.THROW) this.throwLock = false;
  },

  updateThrow(dtMs) {
    const KB = window.keyboard || this.keyboard || {};
    const fire = KB.F || KB.G || KB.THROW,
      ts = this.throwState;
    if (fire && !ts.charging) {
      ts.charging = true;
      ts.holdMs = 0;
    }
    if (fire && ts.charging) ts.holdMs = Math.min(ts.holdMs + dtMs, ts.maxMs);
    if (!fire && ts.charging) {
      ts.charging = false;
      if ((this.inventory.bottles || 0) > 0) {
        const pow = 1 + (ts.holdMs / ts.maxMs) * 1.5,
          dir = this.character.facing === -1 ? -1 : 1;
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
      }
    }
  },

  updateProjectiles(dtMs) {
    const gY = this.groundY;
    this.projectiles.forEach((p) => {
      p.update(dtMs);
      if (p.state === "fly" && p.y + p.height >= gY) p.hitAndSplash(gY);
    });

    this.projectiles.forEach((p) => {
      if (p.state !== "fly") return;
      const hit = this.opponents.find(
        (o) => !(o.state === "dead" || o._dead) && AABB(p, o)
      );
      if (!hit) return;

      if (typeof hit.onHit === "function") hit.onHit(25);
      else {
        hit.hp = (hit.hp || 1) - 1;
        if (hit.hp <= 0) hit.die?.();
      }
      SFX.play?.("bottle_hit", { vol: 0.8 });
      p.hitAndSplash();
    });

    this.projectiles = this.projectiles.filter((p) => !p._dead);
    this.opponents = this.opponents.filter((o) => !o._dead);
  },


  checkCharEnemyCollisions(dtMs) {
    const c = this.character;
    c.invT = Math.max(0, (c.invT || 0) - dtMs);
    if (c.invT) return;

    const cb = c.getBounds?.() || c;
    for (const e of this.opponents) {
      if (e._dead || e.state === 'dead') continue;

      const eb = e.getBounds?.() || e;
      if (!AABB(cb, eb)) continue;

      const stomp = c.prevY + c.height <= e.y + 8 && c.vy > 0;
      if (stomp) {
        e.die?.();
        SFX.play?.('chicken', { vol: 0.6 });
        c.vy = -8;
        break; 
      } else {
        c.hp   = Math.max(0, (c.hp ?? 100) - (e.dmg ?? 20));
        c.invT = 600;
        c.hurtT = 400;
        c.vx = c.facing === 1 ? -2.5 : 2.5;
        SFX.play?.('hit', { vol: 0.9 });

        if ((c.hp ?? 0) <= 0 && !this.gameOver) {
          const byBoss = e instanceof Endboss;
          this.triggerGameOver(byBoss ? 'boss' : 'enemy');
        }
        break;
      }
    }
  },


triggerGameOver(reason = "enemy") {
  if (this.gameOver) return;
  this.gameOver = true;
  this.gameOverReason = reason;
  this.gameOverAt = performance.now();
  this.pause(true);
  SFX.stop?.("menu");
  window.playEndSound?.(reason);
},


  handleHeal(dtMs) {
    if (window.DEBUG_HEAL)
      console.log("HEAL STATE", {
        healKey: !!this.keyboard?.HEAL,
        cd: this._healCdMs,
        hp: this.character?.hp,
        max: this.character?.hpMax,
        coins: this.inventory?.coins,
      });

    this._healCdMs = Math.max(0, (this._healCdMs || 0) - dtMs);
    const KB = window.keyboard || this.keyboard || {};
    this.keyboard = KB;

    if (!KB.HEAL) return;
    if (this.character?.state === "dead" || (this.character?.hp ?? 0) <= 0)
      return;
    if (this._healCdMs > 0) return;

    const max = this.character.hpMax ?? 100,
      hp = this.character.hp ?? max;
    const cost = this.healCfg.coinCost || 3;
    if (hp >= max || (this.inventory.coins || 0) < cost) return;

    const gain = Math.round(max * ((this.healCfg.hpPct || 20) / 100));
    this.inventory.coins -= cost;
    this.character.hp = Math.min(max, hp + gain);
    SFX.play?.("heal_chimes", { vol: 0.8 });
    this._healCdMs = this.healCfg.cdMs || 1000;

    if (window.DEBUG_HEAL)
      console.log("HEAL OK", {
        hp: this.character.hp,
        coins: this.inventory.coins,
      });
  },
});
