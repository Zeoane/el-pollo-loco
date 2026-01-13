// models/endboss.class.js
class Endboss extends MovableObject {
  constructor() {
    super();

    this.setSize(280, 280).setSpeed(0.6);
    this.footOffset = 14;
    this.setHitbox(22, 10, this.width - 44, this.height - 24);
    this.dmg = 26;
    this.bumpVX = 3.5;
    this.bumpVY = -9;
    this.hpMax = 300;
    this.hp = this.hpMax;
    this.state = "walk"; 
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.attackCooldown = 1200; 
    this.attackTimer = 0;
    this.invT = 0; 

    const base = "img/4_enemie_boss_chicken";

    this.frames = {
      walk: this.loadImages([
        `${base}/1_walk/G1.png`,
        `${base}/1_walk/G2.png`,
        `${base}/1_walk/G3.png`,
        `${base}/1_walk/G4.png`,
      ]),
      alert: this.loadImages([
        `${base}/2_alert/G5.png`,
        `${base}/2_alert/G6.png`,
        `${base}/2_alert/G7.png`,
        `${base}/2_alert/G8.png`,
        `${base}/2_alert/G9.png`,
        `${base}/2_alert/G10.png`,
        `${base}/2_alert/G11.png`,
        `${base}/2_alert/G12.png`,
      ]),
      attack: this.loadImages([
        `${base}/3_attack/G13.png`,
        `${base}/3_attack/G14.png`,
        `${base}/3_attack/G15.png`,
        `${base}/3_attack/G16.png`,
        `${base}/3_attack/G17.png`,
        `${base}/3_attack/G18.png`,
        `${base}/3_attack/G19.png`,
        `${base}/3_attack/G20.png`,
      ]),
      hurt: this.loadImages([
        `${base}/4_hurt/G21.png`,
        `${base}/4_hurt/G22.png`,
        `${base}/4_hurt/G23.png`,
      ]),
      dead: this.loadImages([
        `${base}/5_dead/G24.png`,
        `${base}/5_dead/G25.png`,
        `${base}/5_dead/G26.png`,
      ]),
    };

    this.frameMs = { walk: 120, alert: 90, attack: 80, hurt: 110, dead: 160 };

    this.setState("walk");
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s;
    this.frameIndex = 0;
    this.frameElapsedMs = 0;

    const arr = this.frames[s];
    if (arr && arr.length) {
      this.img = arr[0];
      this.imageLoaded = true;
    }

    if (s === "attack") {
      this.chargeDir = this.facing || 1;
      this.chargeVel = 3.0;
      this.attackTimer = 600; 
    }
    if (s === "hurt") {
      this.invT = 500;
    }
  }

onHit(dmg = 20) {
  if (this.state === "dead" || this.invT > 0) return;
  this.hp = Math.max(0, this.hp - dmg);
  
  if (this.hp === 0) {
    this.setState("dead");
    this._deadline = 800;

    if (window.world) {
      setTimeout(() => {
        window.world.triggerGameOver('win');
      }, 1000); 
    }
  } else {
    this.setState("hurt");
  }
}

  updateBoss(world, dtMs = 16) {
    const k = dtMs / 16;
    if (this.invT > 0) this.invT = Math.max(0, this.invT - dtMs);

    const c = world.character;
    if (!c) return;

    const centerX = this.x + this.width / 2;
    const targetX = c.x + c.width / 2;
    const dist = targetX - centerX;
    this.facing = dist >= 0 ? -1 : 1;

    switch (this.state) {
      case "walk": {
        this.x += this.speed * this.facing * k * 2; 

        if (Math.abs(dist) < 360) this.setState("alert");

        this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
        break;
      }

      case "alert": {
         if (this.attackCooldown === 0 && Math.abs(dist) < 260) {
          this.setState("attack");
          this.attackCooldown = 1400;
        } else {
          this.x += this.speed * 0.4 * this.facing * k * 2;
          this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
          if (Math.abs(dist) > 420) this.setState("walk");
        }
        break;
      }

      case "attack": {
        this.x += this.chargeVel * this.facing * k * 2;
        this.attackTimer -= dtMs;
        if (this.attackTimer <= 0) {
          this.setState("alert");
        }
        break;
      }

      case "hurt": {
        this.x -= 0.6 * this.facing * k * 2;
        if (this.invT === 0) {
          this.setState(Math.abs(dist) > 420 ? "walk" : "alert");
        }
        break;
      }

      case "dead": {
        if (this._deadline != null) {
          this._deadline -= dtMs;
          if (this._deadline <= 0) this._dead = true;
        }
        break;
      }
    }

    this.animateState(dtMs);
  }

  animateState(dtMs) {
    const arr = this.frames[this.state];
    if (!arr || arr.length === 0) return;

    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs >= (this.frameMs[this.state] || 100)) {
      this.frameElapsedMs = 0;
      if (this.state === "dead" && this.frameIndex >= arr.length - 1) {
        this.frameIndex = arr.length - 1;
      } else {
        this.frameIndex = (this.frameIndex + 1) % arr.length;
      }
      this.img = arr[this.frameIndex];
    }
  }
}

window.Endboss = Endboss;
