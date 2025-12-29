// models/world.audio.js
(function attachAmbient(){
  const W = window.World;
  if (!W || !W.prototype){ setTimeout(attachAmbient, 0); return; }

  Object.assign(W.prototype, {
    tickAmbientAudio(dtMs){
      const a = this.audio || (this.audio = {
        chickenInt: 30000, roosterInt: 30000,
        nextChicken: 2000,  nextRooster: 0, roosterLeft: 2
      });
      const t = this.elapsedMs | 0;

      if (this.phase !== 'boss'){
        if (!a.nextChicken || t >= a.nextChicken){
          SFX.play?.('chicken', { vol: .7 });
          a.nextChicken = t + (a.chickenInt || 30000);
        }
        a.roosterLeft = 2; a.nextRooster = 0; 
        return;
      }
      if ((a.roosterLeft || 0) > 0 && (!a.nextRooster || t >= a.nextRooster)){
        SFX.play?.('rooster', { vol: .85 });
        a.roosterLeft--; a.nextRooster = t + (a.roosterInt || 30000);
      }
    }
  });
})();
