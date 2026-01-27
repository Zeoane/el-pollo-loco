/**
 * Manages all game sounds using the Web Audio API.
*/
class SoundManager {
  /**
   * Create a new sound manager instance.
   */
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
    const handler = this._createUnlockHandler();
    this._addUnlockListeners(handler);
  }

  /**
   * Build a reusable unlock event handler.
   * @returns {(e: Event) => Promise<void>}
   */
  _createUnlockHandler() {
    const handler = async (e) => this._handleUnlockEvent(e, handler);
    return handler;
  }

  /**
   * Handle the unlock event and enable audio playback.
   * @param {Event} e
   * @param {(e: Event) => Promise<void>} handler
   */
  async _handleUnlockEvent(e, handler) {
    if (!e?.isTrusted) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    await this._resumeContext();
    if (!this._isContextRunning()) return;
    this._onUnlocked();
    this._removeUnlockListeners(handler);
  }

  /**
   * Resume the AudioContext if suspended.
   * @returns {Promise<void>}
   */
  async _resumeContext() {
    try {
      if (navigator.userActivation && !navigator.userActivation.isActive)
        return;
      if (this.ctx.state === "suspended") await this.ctx.resume();
    } catch {}
  }
  _isContextRunning() {
    return this.ctx?.state === "running";
  }

  /**
   * Mark audio as unlocked and flush pending jobs.
   */
  _onUnlocked() {
    this.unlocked = true;
    this._flushPending();
  }

  /**
   * @param {(e: Event) => Promise<void>} handler
   */
  _addUnlockListeners(handler) {
    window.addEventListener("pointerdown", handler, true);
    window.addEventListener("click", handler, true);
    window.addEventListener("keydown", handler, true);
  }
  
  /**
   * @param {(e: Event) => Promise<void>} handler
   */
  _removeUnlockListeners(handler) {
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("click", handler, true);
    window.removeEventListener("keydown", handler, true);
  }

  /**
   * Loads a single sound file and decodes it into an AudioBuffer.
   * @param {string} name
   * @param {string} url
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

  _canPlay() {
    return !!this.ctx && this.ctx.state === "running" && !this.muted;
  }

  /**
   * @param {PendingJob} job
   */
  _queue(job) {
    this._pending.push(job);
  }

  /**
   * Execute pending audio jobs when audio is available.
   */
  _flushPending() {
    if (!this._canPlay()) return;
    this._drainPendingJobs();
    this._syncLoopGains();
  }

  /**
   * Run queued jobs that have loaded buffers.
   */
  _drainPendingJobs() {
    for (let i = 0; i < this._pending.length; ) {
      const job = this._pending[i];
      if (!this._canRunJob(job)) {
        i++;
        continue;
      }
      this._runJob(job);
      this._pending.splice(i, 1);
    }
  }
  _canRunJob(job) {
    return !!this.buffers[job.name];
  }

  /**
   * @param {PendingJob} job
   */
  _runJob(job) {
    if (job.type === "play") this.play(job.name, job.opt);
    else this.loop(job.name, job.key, job.opt);
  }

  /**
   * Sync loop gain values to current volume/mute state.
   */
  _syncLoopGains() {
    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      if (!spec || !h?.gain) return;
      h.gain.gain.value = this._loopVolume(spec.opt);
    });
  }

  /**
   * Plays a one-shot sound.
   * @param {string} name
   * @param {SoundOptions} [opt]
   * @returns {{src: AudioBufferSourceNode, gain: GainNode}|null}
   */
  play(name, opt = {}) {
    if (!this._isSoundReady(name)) return this._queuePlay(name, opt);
    const { src, gain } = this._createSourceNodes();
    this._configureSource(src, gain, name, opt);
    this._connectAndStart(src, gain, opt);
    return { src, gain };
  }
  _isSoundReady(name) {
    return !!this.buffers[name] && this._canPlay();
  }
  _queuePlay(name, opt) {
    this._queue({ type: "play", name, opt });
    return null;
  }
  _createSourceNodes() {
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    return { src, gain };
  }

  /**
   * @param {AudioBufferSourceNode} src
   * @param {GainNode} gain
   * @param {string} name
   * @param {SoundOptions} opt
   */
  _configureSource(src, gain, name, opt) {
    src.buffer = this.buffers[name];
    src.playbackRate.value = opt.rate || 1;
    gain.gain.value = this._loopVolume(opt);
  }

  /**
   * @param {AudioBufferSourceNode} src
   * @param {GainNode} gain
   * @param {SoundOptions} opt
   */
  _connectAndStart(src, gain, opt) {
    src.connect(gain).connect(this.master);
    src.start(this.ctx.currentTime, opt.offset || 0);
  }

  /**
   * Updates volume and spec of an existing loop.
   * @param {string} key
   * @param {string} name
   * @param {SoundOptions} opt
   */
  updateExistingLoop(key, name, opt) {
    const h = this.loops[key];
    const v = this.muted ? 0 : (opt.vol ?? 1) * this.vol;
    if (h?.gain) h.gain.gain.value = v;
    this._loopSpecs[key] = { name, opt };
  }

  /**
   * Queues a loop until playback is possible.
   * @param {string} name
   * @param {string} key
   * @param {SoundOptions} opt
   */
  queueLoop(name, key, opt) {
    this._loopSpecs[key] = { name, opt };
    this._queue({ type: "loop", name, key, opt });
  }

  /**
   * Starts or updates a looping sound.
   * @param {string} name
   * @param {string} [key=name]
   * @param {SoundOptions} [opt]
   * @returns {{src: AudioBufferSourceNode, gain: GainNode}|null}
   */
  loop(name, key = name, opt = {}) {
    if (this._hasLoop(key)) {
      this.updateExistingLoop(key, name, opt);
      return this.loops[key];
    }
    if (!this._isSoundReady(name))
      return this._queueLoopAndReturn(name, key, opt);
    const h = this.play(name, opt);
    if (!h) return null;
    this._registerLoop(key, name, opt, h);
    return h;
  }
  _hasLoop(key) {
    return !!this.loops[key];
  }
  _queueLoopAndReturn(name, key, opt) {
    this.queueLoop(name, key, opt);
    return null;
  }

  /**
   * @param {string} key
   * @param {string} name
   * @param {SoundOptions} opt
   * @param {{src: AudioBufferSourceNode, gain: GainNode}} h
   */
  _registerLoop(key, name, opt, h) {
    h.src.loop = true;
    this.loops[key] = h;
    this._loopSpecs[key] = { name, opt };
  }
  _loopVolume(opt) {
    return this.muted ? 0 : (opt?.vol ?? 1) * this.vol;
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
   * Apply current mute/volume state to master gain.
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
    this.vol = this._clampVolume(v);
    this._applyMasterGain();
    this._syncExistingLoopVolumes();
  }
  _clampVolume(v) {
    return Math.max(0, Math.min(1, v));
  }

  /**
   * Update gains for all active loops.
   */
  _syncExistingLoopVolumes() {
    Object.entries(this.loops).forEach(([key, h]) => {
      const spec = this._loopSpecs[key];
      if (!h?.gain || !spec) return;
      h.gain.gain.value = this._loopVolume(spec.opt);
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
