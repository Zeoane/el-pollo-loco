/**
 * Manages all game sounds using the Web Audio API.
 * Handles loading, playing, looping, volume and mute state.
 */
class SoundManager {
  constructor() {
    this.buffers = {};
    this.vol = 0.8;
    this.muted = false;
    this.master = null;
    this.ctx = null;
    this.unlocked = false;
    this.loops = {};
    this._loopSpecs = {};
    this._pending = [];
  }

  /**
   * @typedef {Object} SoundOptions
   * @property {number} [vol] 
   * @property {number} [rate] 
   * @property {number} [offset] 
   */

  /**
   * @typedef {Object} PendingJob
   * @property {"play"|"loop"} type
   * @property {string} name
   * @property {string} [key]
   * @property {SoundOptions} [opt]
   */

  /**
   * Initializes the AudioContext and master gain node.
   * Safe to call multiple times.
   * @returns {Promise<void>}
   */
  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.vol;
    this.master.connect(this.ctx.destination);
  }

  /**
   * Unlocks audio playback on first trusted user interaction.
   * Required by browser autoplay policies.
   */
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

  /**
   * Loads a single sound file and decodes it into an AudioBuffer.
   * @param {string} name - Sound identifier.
   * @param {string} url - File path.
   * @returns {Promise<void>}
   */
  async load(name, url) {
    await this.init();
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    this.buffers[name] = await this.ctx.decodeAudioData(arr);
    this._flushPending();
  }

  /**
   * Loads multiple sound files in parallel.
   * @param {Record<string, string>} map - Name-to-URL map.
   * @returns {Promise<void>}
   */
  async loadAll(map) {
    const jobs = Object.entries(map).map(([n, u]) => this.load(n, u));
    await Promise.all(jobs);
    this._flushPending();
  }

  /**
   * Returns whether audio playback is currently allowed.
   * @returns {boolean}
   */
  _canPlay() {
    return !!this.ctx && this.ctx.state === "running" && !this.muted;
  }

  /**
   * Queues an audio job until playback becomes possible.
   * @param {PendingJob} job
   */
  _queue(job) {
    this._pending.push(job);
  }

  /**
   * Executes all pending audio jobs once audio is available.
   */
  _flushPending() {
    if (!this._canPlay()) return;

    for (let i = 0; i < this._pending.length; ) {
      const job = this._pending[i];
      if (!this.buffers[job.name]) {
        i++;
        continue;
      }

      if (job.type === "play") this.play(job.name, job.opt);
      else this.loop(job.name, job.key, job.opt);

      this._pending.splice(i, 1);
    }

    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      if (!spec) return;
      const v = (spec.opt?.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = this.muted ? 0 : v;
    });
  }

  /**
   * Plays a one-shot sound.
   * @param {string} name - Sound identifier.
   * @param {SoundOptions} [opt] - Playback options.
   * @returns {{src: AudioBufferSourceNode, gain: GainNode}|null}
   */
  play(name, opt = {}) {
    if (!this.buffers[name] || !this._canPlay()) {
      this._queue({ type: "play", name, opt });
      return null;
    }

    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    src.buffer = this.buffers[name];
    src.playbackRate.value = opt.rate || 1;
    gain.gain.value = this.muted ? 0 : (opt.vol ?? 1) * this.vol;

    src.connect(gain).connect(this.master);
    src.start(this.ctx.currentTime, opt.offset || 0);
    return { src, gain };
  }

  /**
   * Updates volume and spec of an existing loop.
   * @param {string} key - Loop key.
   * @param {string} name - Sound identifier.
   * @param {SoundOptions} opt - Playback options.
   */
  updateExistingLoop(key, name, opt) {
    const h = this.loops[key];
    const v = this.muted ? 0 : (opt.vol ?? 1) * this.vol;
    if (h?.gain) h.gain.gain.value = v;
    this._loopSpecs[key] = { name, opt };
  }

  /**
   * Queues a loop until playback is possible.
   * @param {string} name - Sound identifier.
   * @param {string} key - Loop key.
   * @param {SoundOptions} opt - Playback options.
   */
  queueLoop(name, key, opt) {
    this._loopSpecs[key] = { name, opt };
    this._queue({ type: "loop", name, key, opt });
  }

  /**
   * Starts or updates a looping sound.
   * @param {string} name - Sound identifier.
   * @param {string} [key=name] - Loop key.
   * @param {SoundOptions} [opt] - Playback options.
   * @returns {{src: AudioBufferSourceNode, gain: GainNode}|null}
   */
  loop(name, key = name, opt = {}) {
    if (this.loops[key]) {
      this.updateExistingLoop(key, name, opt);
      return this.loops[key];
    }

    if (!this.buffers[name] || !this._canPlay()) {
      this.queueLoop(name, key, opt);
      return null;
    }

    const h = this.play(name, opt);
    if (!h) return null;

    h.src.loop = true;
    this.loops[key] = h;
    this._loopSpecs[key] = { name, opt };
    return h;
  }

  /**
   * Stops a looping sound by key.
   * @param {string} key
   */
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

  /**
   * Applies current mute/volume state to the master gain node.
   */
  _applyMasterGain() {
    if (!this.master) return;
    this.master.gain.value = this.muted ? 0 : this.vol;
  }

  /**
   * Sets global volume.
   * @param {number} v - Volume (0–1).
   */
  setVolume(v) {
    this.vol = Math.max(0, Math.min(1, v));
    this._applyMasterGain();

    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      const lv = (spec?.opt?.vol ?? 1) * this.vol;
      if (h?.gain) h.gain.gain.value = this.muted ? 0 : lv;
    });
  }

  /**
   * Sets mute state.
   * @param {boolean} m
   */
  setMuted(m) {
    this.muted = !!m;
    this._applyMasterGain();
    this._flushPending();
  }

  /**
   * Toggles mute on/off.
   */
  toggleMute() {
    this.setMuted(!this.muted);
  }

  /**
   * Stops all looping sounds and clears pending jobs.
   */
  stopAll() {
    Object.keys(this.loops).forEach((k) => this.stop(k));
    this._pending = [];
  }
}

window.SFX = new SoundManager();
