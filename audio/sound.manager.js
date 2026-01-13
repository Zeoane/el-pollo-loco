// audio/sound.manager.js
class SoundManager {
  constructor() {
    this.buffers = {};
    this.vol = 0.8;
    this.muted = false;
    this.ctx = null;
    this.unlocked = false;
    this.loops = {};
    this._loopSpecs = {};
    this._pending = [];
  }

  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  unlockOnGesture() {
    if (this.unlocked) return;
    this.init();

    const tryResume = async (e) => {
      if (!e?.isTrusted) return;
      try {
        if (this.ctx.state === "suspended") await this.ctx.resume();
      } catch {}
      if (this.ctx.state !== "running") return;

      this.unlocked = true;
      this._flushPending();

      window.removeEventListener("pointerdown", tryResume, true);
      window.removeEventListener("click", tryResume, true);
      window.removeEventListener("keydown", tryResume, true);
    };

    window.addEventListener("pointerdown", tryResume, true);
    window.addEventListener("click", tryResume, true);
    window.addEventListener("keydown", tryResume, true);
  }

  async load(name, url) {
    await this.init();
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    this.buffers[name] = await this.ctx.decodeAudioData(arr);
    this._flushPending();
  }

  async loadAll(map) {
    const jobs = Object.entries(map).map(([n, u]) => this.load(n, u));
    await Promise.all(jobs);
    this._flushPending();
  }

  _canPlay() {
    return !!this.ctx && this.ctx.state === "running" && !this.muted;
  }

  _queue(job) {
    this._pending.push(job);
  }

  _flushPending() {
    if (!this._canPlay()) return;
    for (let i = 0; i < this._pending.length; ) {
      const job = this._pending[i];
      const hasBuf = !!this.buffers[job.name];
      if (!hasBuf) {
        i++;
        continue;
      }

      if (job.type === "play") {
        this.play(job.name, job.opt);
      } else {
        this.loop(job.name, job.key, job.opt);
      }
      this._pending.splice(i, 1);
    }

    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      if (!spec) return;
      const v = (spec.opt?.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = this.muted ? 0 : v;
    });
  }

  play(name, opt = {}) {
    if (!this.buffers[name] || !this._canPlay()) {
      this._queue({ type: "play", name, opt });
      return null;
    }
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    src.buffer = this.buffers[name];
    src.playbackRate.value = opt.rate || 1;
    gain.gain.value = this.muted ? 0 : (opt.vol ?? 1) * this.vol;

    src.connect(gain).connect(this.ctx.destination);
    src.start(t, opt.offset || 0);
    return { src, gain };
  }

  loop(name, key = name, opt = {}) {
    if (this.loops[key]) {
      const h = this.loops[key];
      const v = this.muted ? 0 : (opt.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = v;
      this._loopSpecs[key] = { name, opt };
      return this.loops[key];
    }

    if (!this.buffers[name] || !this._canPlay()) {
      this._loopSpecs[key] = { name, opt };
      this._queue({ type: "loop", name, key, opt });
      return null;
    }

    const h = this.play(name, opt);
    if (!h) {
      this._loopSpecs[key] = { name, opt };
      return null;
    }
    h.src.loop = true;
    this.loops[key] = h;
    this._loopSpecs[key] = { name, opt };
    return h;
  }

  stop(key) {
    const h = this.loops[key];
    if (h) {
      try {
        h.src.stop();
      } catch {}
    }
    delete this.loops[key];
    delete this._loopSpecs[key];
  }

  setVolume(v) {
    this.vol = Math.max(0, Math.min(1, v));
    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      const lv = (spec?.opt?.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = this.muted ? 0 : lv;
    });
  }

  setMuted(m) {
    this.muted = !!m;
    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      const v = (spec?.opt?.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = this.muted ? 0 : v;
    });
    this._flushPending();
  }

  toggleMute() {
    this.setMuted(!this.muted);
  }

  stopAll() {
  Object.keys(this.loops).forEach((k) => this.stop(k));
  this._pending = [];
}
}

window.SFX = new SoundManager();
