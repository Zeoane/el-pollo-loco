// background-object.class.js
class BackgroundObject extends MovableObject {
  constructor(folder, y=0, h=null, flow=0, parallax=0) {
    super(); this.x=0; this.y=y; this.height=h;
    this.flowSpeed=flow; this.parallax=parallax; this._flow=0;
    this.tiles=[]; this.fallback=new Image(); this._loadTiles(folder);
  }

  _loadTiles(folder) {
    ['1.png','2.png'].forEach(n=>{
      const img=new Image();
      img.onload=()=>img._ok=true; img.onerror=()=>{};
      img.src=`${folder}/${n}`; this.tiles.push(img);
    });
    this.fallback.onload=()=>this.fallback._ok=true;
    this.fallback.onerror=()=>{}; this.fallback.src=`${folder}/full.png`;
  }

  update(cameraX, canvas, dtMs=16, moving=false) {
    if (moving && this.flowSpeed) this._flow -= this.flowSpeed;
  }

  draw(ctx, cameraX=0) {
    const A=this._activeA(), B=this._activeB(A);
    if (!A) return;
    const {w,h}=this._dims(ctx, A); const px=this._snap(cameraX*(1-this.parallax));
    let x=this._startX(w)-w, i=0; ctx.save(); ctx.translate(px,0);
    for(; x<ctx.canvas.width + 2*w; x+=w) this._blit(ctx, (i++%2?B:A), x, w, h);
    ctx.restore();
  }

  _activeA(){ return this.tiles.find(t=>t._ok&&t.naturalWidth>0) || (this.fallback._ok?this.fallback:null); }
  _activeB(A){ const b=this.tiles.find(t=>t!==A && t._ok&&t.naturalWidth>0); return b||A; }

  _dims(ctx, img) {
    const h = this.height ?? ctx.canvas.height, s = h / img.naturalHeight;
    return { w: img.naturalWidth * s, h };
  }

  _startX(w) {
    const mod = ((this._flow % w) + w) % w;         
    let s = this.x + mod; return s>0 ? s-w : s;
  }

  _blit(ctx, img, x, w, h) {
    const o=0.5, sx=this._snap(x);
    ctx.drawImage(img, sx-o, this.y, w+o*2, h);
  }

  _snap(v) { const d=window.devicePixelRatio||1; return Math.round(v*d)/d; }
}

class SkyLayer extends MovableObject {
  constructor(path, parallax=0.0, y=0, h=null){ super(); this.y=y; this.h=h; this.parallax=parallax; this.loadImage(path); }
  update() {}
  draw(ctx, cameraX=0){
    if(!this.imageLoaded) return;
    const h=this.h ?? ctx.canvas.height, s=h/this.img.naturalHeight, w=this.img.naturalWidth*s;
    const px = ((window.devicePixelRatio||1) * (cameraX*(1-this.parallax)))|0 / (window.devicePixelRatio||1);
    let x=-w; ctx.save(); ctx.translate(px,0);
    for(; x<ctx.canvas.width+w; x+=w) ctx.drawImage(this.img, x-0.5, this.y, w+1, h);
    ctx.restore();
  }
}
class CloudLayer extends BackgroundObject {
  constructor(folder='img/5_background/layers/4_clouds', y=0, h=null, flow=0.02, parallax=0.05){
    super(folder, y, h, flow, parallax);
  }
  update(cameraX, canvas, dtMs=16, moving=false){
    const k = (dtMs || 16) / 16;          
    this._flow -= (this.flowSpeed || 0) * k; 
  }
}

const BackgroundLayers = {
  make(folder, flow, parallax, y=0, h=null) {
    return new BackgroundObject(`img/5_background/layers/${folder}`, y, h, flow, parallax);
  },
  defaultSet() {
    return [
      new SkyLayer('img/5_background/layers/air.png', 0.00),
      new CloudLayer('img/5_background/layers/4_clouds', 0, null, 0.02, 0.05), // ← zieht immer
      this.make('3_third_layer', 0.05, 0.15),
      this.make('2_second_layer',0.08, 0.30),
      this.make('1_first_layer', 0.12, 0.60),
    ];
  }
};






