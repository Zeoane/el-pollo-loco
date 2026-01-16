// classes/world.audio.js
(function attachAmbient() {
  const W = window.World;
  if (!W?.prototype) return setTimeout(attachAmbient, 0);

  Object.assign(W.prototype, {
    /**
     * Plays ambient enemy sounds based on the current phase and timers.
     * @param {number} dtMs 
     */
    tickAmbientAudio(dtMs) {
      this.ensureAudioState();
      const t = this.elapsedMs | 0;
      if (this.phase !== "boss") return this.tickChickenAmbient(t);
      this.tickBossRoosterAmbient(t);
    },

    /**
     * Ensures the ambient audio state object exists.
     */
    ensureAudioState() {
      if (this.audio) return;
      this.audio = {
        chickenInt: 30000,
        roosterInt: 30000,
        nextChicken: 2000,
        nextRooster: 0,
        roosterLeft: 2,
      };
    },

    /**
     * Plays random chicken ambience outside the boss phase.
     * Resets boss rooster state when leaving the boss phase.
     * @param {number} t 
     */
    tickChickenAmbient(t) {
      const a = this.audio;
      if (!a.nextChicken || t >= a.nextChicken) {
        SFX.play?.("chicken", { vol: 0.7 });
        a.nextChicken = t + (a.chickenInt || 30000);
      }
      a.roosterLeft = 2;
      a.nextRooster = 0;
    },

    /**
     * Plays rooster ambience during the boss phase for a limited number of times.
     * @param {number} t 
     */
    tickBossRoosterAmbient(t) {
      const a = this.audio;
      const due = !a.nextRooster || t >= a.nextRooster;
      if ((a.roosterLeft || 0) <= 0 || !due) return;

      SFX.play?.("rooster", { vol: 0.85 });
      a.roosterLeft--;
      a.nextRooster = t + (a.roosterInt || 30000);
    },
  });
})();

