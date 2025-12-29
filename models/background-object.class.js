//background-object.class.js//
class BackgroundObject extends MovableObject {
  constructor(folder, y=0, h=null, flow=0, parallax=0){
    super();
    this.x=0; this.y=y; this.height=h;
    this.flowSpeed=flow; this.parallax=parallax; this._flow=0;
    this.tiles=[]; this.fallback=new Image();
    this._loadTiles(folder);
  }

  _loadTiles(folder){
    ['1.png','2.png'].forEach(n=>{
      const img=new Image();
      img.onload=()=>img._ok=true;
      img.onerror=()=>{};
      img.src=`${folder}/${n}`;
      this.tiles.push(img);
    });
    this.fallback.onload=()=>this.fallback._ok=true;
    this.fallback.onerror=()=>{};
    this.fallback.src=`${folder}/full.png`;
  }

  update(cameraX, canvas, dtMs=16){
    const k=(dtMs||16)/16;
    const w=this._tileW||0;
    this._flow=((this._flow - (this.flowSpeed||0)*k) % (w||1) + (w||1)) % (w||1);
  }

  draw(ctx, cameraX=0){
    const A=this._activeA(); if(!A) return;
    const {w,h}=this._dims(ctx,A); if(!(w>1)) return;
    this._tileW=w;

    const par=1-(this.parallax||0);
    const cx=((cameraX*par)%w + w)%w;              
    const off=-((cx + (this._flow||0)) % w);

    const B=this._activeB(A);
    ctx.save();
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
    ctx.translate(off,0);
    for(let x=-w,i=0; x<ctx.canvas.width+w; x+=w)
      this._blit(ctx, (i++%2?B:A), x, w, h);
    ctx.restore();
  }

  _activeA(){ return this.tiles.find(t=>t._ok&&t.naturalWidth>0) || (this.fallback._ok?this.fallback:null); }
  _activeB(A){ const b=this.tiles.find(t=>t!==A && t._ok&&t.naturalWidth>0); return b||A; }
  _dims(ctx,img){ const h=this.height ?? ctx.canvas.height; const s=h/(img.naturalHeight||h); return { w:(img.naturalWidth||h)*s, h }; }
  _blit(ctx,img,x,w,h){ ctx.drawImage(img, Math.round(x)-0.5, this.y, w+1, h); }
}

class SkyLayer extends MovableObject {
  constructor(path, parallax=0.0, y=0, h=null){
    super();
    this.y=y; this.h=h; this.parallax=parallax;
    this.img=new Image(); this.imageLoaded=false;
    this.img.onload=()=>{ this.imageLoaded=true; };
    this.img.onerror=(e)=>{ console.error('[SkyLayer] failed:', path, e); this.img._broken=true; };
    this.img.src=path;
  }

   update(cameraX, canvas, dtMs, moving) {} 

  draw(ctx, cameraX=0){
    if(!this.imageLoaded) return;
    const h=this.h ?? ctx.canvas.height;
    const s=h/(this.img.naturalHeight||h);
    const w=(this.img.naturalWidth||h)*s; if(!(w>1)) return;

    const par = 1 - (this.parallax || 0);
    const cx  = ((cameraX * par) % w + w) % w;
    const off = -cx;

    ctx.save();
    ctx.translate(off, 0);
    for (let x = -w; x < ctx.canvas.width + w; x += w) {
      ctx.drawImage(this.img, Math.round(x) - 0.5, this.y, w + 1, h);
    }
    ctx.restore();
  }
}


class MirrorLayer extends MovableObject {
  constructor(pathFolder, parallax = 0.6, y = 0, h = null){
    super();
    this.y = y;
    this.h = h;
    this.parallax = parallax;
    this.img = new Image();
    this._ok = false;
    this.img.onload = () => this._ok = true;
    this.img.onerror = (e) => { console.error('[MirrorLayer] failed:', pathFolder, e); this.img._broken = true; };
    this.img.src = `${pathFolder}/full.png`;
  }

  update(cameraX, canvas, dtMs, moving) {} 

  draw(ctx, cameraX = 0){
    if (!this._ok) return;
    const h = this.h ?? ctx.canvas.height;
    const s = h / (this.img.naturalHeight || h);
    const w = (this.img.naturalWidth || h) * s; if (!(w > 1)) return;
    const par = 1 - (this.parallax || 0);
    const cx  = ((cameraX * par) % w + w) % w;
    const off = -cx;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.translate(off, 0);

    for (let x = -w, i = 0; x < ctx.canvas.width + w; ){
      const drawX = Math.round(x) - 0.5;
      if (i % 2 === 0) {
        ctx.drawImage(this.img, drawX, this.y, w + 1, h);
      } else {
        ctx.save();
        ctx.translate(drawX + w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.img, 0, this.y, w + 1, h);
        ctx.restore();
      }
      x += w;
      i++;
    }
    ctx.restore();
  }
}


class CloudLayer extends BackgroundObject {
  constructor(folder='img/5_background/layers/4_clouds', y=0, h=null, flow=0.02, parallax=0.05){
    super(folder,y,h,flow,parallax);
  }
}

const BackgroundLayers = {
  defaultSet() {
    return [
      new SkyLayer('img/5_background/layers/air.png', 0.00),
      new CloudLayer('img/5_background/layers/4_clouds', 0, null, 0.02, 0.05),
      new MirrorLayer('img/5_background/layers/3_third_layer', 0.15),
      new MirrorLayer('img/5_background/layers/2_second_layer', 0.30),
      new MirrorLayer('img/5_background/layers/1_first_layer', 0.60),
    ];
  }
};
window.BackgroundLayers = BackgroundLayers; 






