// models/endboss.class.js
class Endboss extends MovableObject {
  constructor() {
    super();

    // Basis-Setup
    this.setSize(280, 280).setSpeed(0.6);
    this.footOffset = 14;
    this.setHitbox(22, 10, this.width - 44, this.height - 24);

    // Lebenswerte
    this.hpMax = 300;
    this.hp    = this.hpMax;

    // State & Timings
    this.state = 'walk';                 // 'walk'|'alert'|'attack'|'hurt'|'dead'
    this.frameIndex = 0;
    this.frameElapsedMs = 0;
    this.attackCooldown = 1200;          // Zeit bis zur nächsten Attacke möglich
    this.attackTimer = 0;
    this.invT = 0;                       // Unverwundbarkeit nach Treffer

    const base = 'img/4_enemie_boss_chicken';

    // Frames laden
    this.frames = {
      walk:   this.loadImages([`${base}/1_walk/G1.png`,   `${base}/1_walk/G2.png`,   `${base}/1_walk/G3.png`,   `${base}/1_walk/G4.png`]),
      alert:  this.loadImages([`${base}/2_alert/G5.png`,  `${base}/2_alert/G6.png`,  `${base}/2_alert/G7.png`,  `${base}/2_alert/G8.png`, `${base}/2_alert/G9.png`, `${base}/2_alert/G10.png`, `${base}/2_alert/G11.png`, `${base}/2_alert/G12.png`]),
      attack: this.loadImages([`${base}/3_attack/G13.png`, `${base}/3_attack/G14.png`, `${base}/3_attack/G15.png`, `${base}/3_attack/G16.png`, `${base}/3_attack/G17.png`, `${base}/3_attack/G18.png`, `${base}/3_attack/G19.png`, `${base}/3_attack/G20.png`]),
      hurt:   this.loadImages([`${base}/4_hurt/G21.png`,  `${base}/4_hurt/G22.png`,  `${base}/4_hurt/G23.png`]),
      dead:   this.loadImages([`${base}/5_dead/G24.png`,  `${base}/5_dead/G25.png`,  `${base}/5_dead/G26.png`]),
    };

    // Animationsgeschwindigkeit je State (ms pro Frame)
    this.frameMs = { walk: 120, alert: 90, attack: 80, hurt: 110, dead: 160 };

    // Startbild
    this.setState('walk');
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

    // kleine State-spezifische Anpassungen
    if (s === 'attack') {
      // kurzer Charge Richtung Spieler
      this.chargeDir = this.facing || 1;
      this.chargeVel = 3.0;      // horizontale Angriffsgeschwindigkeit
      this.attackTimer = 600;    // Dauer Attack-Phase
    }
    if (s === 'hurt') {
      this.invT = 500;           // 0.5 s Invuln
    }
  }

  onHit(dmg = 20) {
    if (this.state === 'dead' || this.invT > 0) return;
    this.hp = Math.max(0, this.hp - dmg);
    if (this.hp === 0) {
      this.setState('dead');
      // Boss bleibt noch kurz sichtbar; markiere nach Ende der Dead-Animation als entfernt
      this._deadline = 800;  // extra Zeit nach letzter Dead-Frame
    } else {
      this.setState('hurt');
    }
    SFX.play?.('hit', { vol: 0.9 });
  }

  /** AI + Animation */
  updateBoss(world, dtMs = 16) {
    const k = dtMs / 16;
    if (this.invT > 0) this.invT = Math.max(0, this.invT - dtMs);

    const c = world.character;
    if (!c) return;

    const centerX = this.x + this.width / 2;
    const targetX = c.x + (c.width / 2);
    const dist = targetX - centerX;
    this.facing = dist >= 0 ? 1 : -1;

    // --- einfache State Machine ---
    switch (this.state) {
      case 'walk': {
        // Boss läuft langsam auf den Spieler zu
        this.x += this.speed * this.facing * k * 2;  // etwas schneller als Standard speed
        // bei Sichtweite "alert"
        if (Math.abs(dist) < 360) this.setState('alert');
        // Cooldown runterzählen
        this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
        break;
      }

      case 'alert': {
        // Alarm-Animation, bewegt sich kaum
        if (this.attackCooldown === 0 && Math.abs(dist) < 260) {
          this.setState('attack');
          this.attackCooldown = 1400; // nächster Angriff frühestens in 1.4s nach Attack
        } else {
          // leichtes Vorrücken
          this.x += this.speed * 0.4 * this.facing * k * 2;
          this.attackCooldown = Math.max(0, this.attackCooldown - dtMs);
          // Wenn Spieler wieder weit weg → walk
          if (Math.abs(dist) > 420) this.setState('walk');
        }
        break;
      }

      case 'attack': {
        // Charge in facing-Richtung
        this.x += this.chargeVel * this.facing * k * 2;
        this.attackTimer -= dtMs;
        if (this.attackTimer <= 0) {
          this.setState('alert');
        }
        break;
      }

      case 'hurt': {
        // kurze Erholungsphase, minimal zurückweichen
        this.x -= 0.6 * this.facing * k * 2;
        if (this.invT === 0) {
          // nach Hurt zurück in Alert (oder Walk, wenn weit weg)
          this.setState(Math.abs(dist) > 420 ? 'walk' : 'alert');
        }
        break;
      }

      case 'dead': {
        // Dead-Animation bis zum Ende laufen lassen
        if (this._deadline != null) {
          this._deadline -= dtMs;
          if (this._deadline <= 0) this._dead = true;
        }
        break;
      }
    }

    // --- Animation abspielen ---
    this.animateState(dtMs);
  }

  animateState(dtMs) {
    const arr = this.frames[this.state];
    if (!arr || arr.length === 0) return;

    this.frameElapsedMs += dtMs;
    if (this.frameElapsedMs >= (this.frameMs[this.state] || 100)) {
      this.frameElapsedMs = 0;
      // Dead letzte Frame stehen lassen
      if (this.state === 'dead' && this.frameIndex >= arr.length - 1) {
        this.frameIndex = arr.length - 1;
      } else {
        this.frameIndex = (this.frameIndex + 1) % arr.length;
      }
      this.img = arr[this.frameIndex];
    }
  }
}

window.Endboss = Endboss;

