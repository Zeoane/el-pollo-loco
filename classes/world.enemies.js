// models/world.enemies.js
Object.assign(World.prototype, {
  managePhases() {
    const t = this.elapsedMs | 0;
    if (this.phase === "small" && t >= this.phase2AtMs) {
      this.phase = "big";
      this.opponents = this.opponents.filter(
        (o) => !(o instanceof SmallChicken)
      );
      this.spawnRegularChickens();
    }
    if (this.phase === "big" && t >= this.bossAtMs && !this.bossSpawned) {
      this.phase = "boss";
      this.opponents.length = 0;
      this.spawnBoss();
    }
  },

  maintainEnemies() {
    const count = (Cls) =>
      this.opponents.filter((o) => o instanceof Cls).length;

    if (this.phase === "small") {
      while (count(SmallChicken) < this.maxSmall) this.spawnEnemy("small");
      this.opponents = this.opponents.filter((o) => !(o instanceof Chicken));
      return;
    }
    if (this.phase === "big") {
      while (count(Chicken) < this.maxBig) this.spawnEnemy("big");
      this.opponents = this.opponents.filter(
        (o) => !(o instanceof SmallChicken)
      );
      return;
    }
    if (this.phase === "boss") {
      this.opponents = this.opponents.filter(
        (o) => o instanceof Endboss && !o._dead
      );
      return;
    }
  },

  spawnEnemy(kind = "small") {
    const Klass = kind === "small" ? SmallChicken : Chicken;
    const e = new Klass().setGround?.(this.groundY).placeOnGround?.();
    e.speed =
      kind === "small" ? 1.2 + Math.random() * 0.7 : 1.6 + Math.random() * 0.9;

    const left = this.cameraX - 150;
    const ahead = this.cameraX + this.canvas.width + 220;
    const far = Math.max(0, ...this.opponents.map((op) => op.x || 0));
    e.x = this._respawnX(ahead, far);
    this.opponents.push(e);
  },

  spawnSmallChickens() {
    const c = this.cfg.enemies || {},
      n = c.smallCount || 4;
    let x = (this.character.x || 0) + 500;
    for (let i = 0; i < n; i++) {
      const h = new SmallChicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed =
        (c.smallSpeedMin ?? 1.2) +
        Math.random() * ((c.smallSpeedMax ?? 2.0) - (c.smallSpeedMin ?? 1.2));
      h.x = x;
      this.opponents.push(h);
      x +=
        (c.smallGapMin ?? 220) +
        Math.random() * ((c.smallGapMax ?? 460) - (c.smallGapMin ?? 220));
    }
  },

  spawnRegularChickens() {
    const c = this.cfg.enemies || {},
      n = c.regCount || 3;
    let x = (this.character.x || 0) + 700;
    for (let i = 0; i < n; i++) {
      const h = new Chicken().setGround?.(this.groundY).placeOnGround?.();
      h.speed =
        (c.speedMin ?? 1.4) +
        Math.random() * ((c.speedMax ?? 2.4) - (c.speedMin ?? 1.4));
      h.x = x;
      this.opponents.push(h);
      x +=
        (c.gapMin ?? 260) +
        Math.random() * ((c.gapMax ?? 520) - (c.gapMin ?? 260));
    }
  },

  spawnBoss(/* ... */) {
    if (this.bossSpawned) return;
    const b = new Endboss().setGround?.(this.groundY).placeOnGround?.();
    b.x = this.character.x + 800;
    this.opponents.push(b);
    this.bossSpawned = true;
    this.phase = "boss";
    SFX.stop?.("chicken");
    if (this.audio) {
      this.audio.roosterLeft = 2;
      this.audio.nextRooster = this.elapsedMs + 1000;
    }
    SFX.play?.("boss", { vol: 0.8 });
  },

  updateOpponents(dtMs) {
    const left = this.cameraX - 150,
      ahead = this.cameraX + this.canvas.width + 200;
    const far = Math.max(0, ...this.opponents.map((op) => op.x || 0));
    this.opponents.forEach((o) => {
      o.update?.(dtMs);
      if (o.updateBoss) {
        o.updateBoss(this, dtMs);
        return;
      }
      if (o.state === "dead") return;
      if (o.updateBoss) {
        o.updateBoss(this, dtMs);
        return;
      }
      o.x -= o.speed ?? 0;
      this.placeOnGround(o);
      if (o.x + o.width < left) {
        o.x = this._respawnX(ahead, far);
        this._rerollSpeed(o);
      }
    });
    this.opponents = this.opponents.filter(o => !o._dead);
  },

  _respawnX(ahead, far) {
    const gap = 260 + Math.random() * 460;
    return Math.max(ahead, far + gap);
  },

  _rerollSpeed(o) {
    const E = this.cfg.enemies || {};
    if (o instanceof SmallChicken) {
      const a = E.smallSpeedMin ?? 1.2,
        b = E.smallSpeedMax ?? 2.0;
      o.speed = a + Math.random() * (b - a);
    } else {
      const a = E.speedMin ?? 1.6,
        b = E.speedMax ?? 2.5;
      o.speed = a + Math.random() * (b - a);
    }
  },
});
