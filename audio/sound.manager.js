// audio/sound.manager.js
class SoundManager {
  constructor(){ this.buffers={}; this.vol=0.8; this.muted=false; this.ctx=null; this.unlocked=false; this.loops={}; }

  async init(){ if(this.ctx) return; this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }

  async unlockOnGesture(){
    if(this.unlocked) return;
    const resume = async()=>{ try{ await this.init(); await this.ctx.resume(); this.unlocked=true; }catch{} window.removeEventListener('pointerdown',resume); window.removeEventListener('keydown',resume); };
    window.addEventListener('pointerdown',resume,{once:true}); window.addEventListener('keydown',resume,{once:true});
  }

  async load(name,url){
    await this.init(); const res=await fetch(url); const arr=await res.arrayBuffer();
    this.buffers[name]=await this.ctx.decodeAudioData(arr);
  }

  async loadAll(map){ const jobs=Object.entries(map).map(([n,u])=>this.load(n,u)); await Promise.all(jobs); }

  play(name,opt={}){
    if(this.muted||!this.buffers[name]) return null;
    const t=this.ctx.currentTime, src=this.ctx.createBufferSource(), gain=this.ctx.createGain();
    src.buffer=this.buffers[name]; src.playbackRate.value=opt.rate||1; gain.gain.value=(opt.vol??1)*this.vol;
    src.connect(gain).connect(this.ctx.destination); src.start(t, opt.offset||0); return {src,gain};
  }

  loop(name,key=name,opt={}){
    if(this.loops[key]) return this.loops[key];
    const h=this.play(name,opt); if(!h) return null; h.src.loop=true; this.loops[key]=h; return h;
  }

  stop(key){ const h=this.loops[key]; if(!h) return; try{h.src.stop()}catch{} delete this.loops[key]; }

  setVolume(v){ this.vol=Math.max(0,Math.min(1,v)); }

  setMuted(m){ this.muted=!!m; if(m) Object.keys(this.loops).forEach(k=>this.stop(k)); }
  toggleMute(){ this.setMuted(!this.muted); }
}

window.SFX = new SoundManager();
