// models/hud.class.js
class StatusBar {
  constructor(base, icon, x, y, w=228, h=28){
    this.x=x; this.y=y; this.w=w; this.h=h; this.p=0;
    this.icon = new Image(); this.icon.src = icon;
    this.cache={}; ['0','20','40','60','80','100'].forEach(n=>{
      const im=new Image(); im.src=`${base}/${n}.png`; this.cache[n]=im;
    });
  }
  set(p){ this.p=Math.max(0,Math.min(100,p|0)); }
  _img(){ const s=['0','20','40','60','80','100']; return this.cache[s[Math.round(this.p/20)]]; }
  draw(ctx){
    const im=this._img(); if(im?.complete) ctx.drawImage(im,this.x,this.y,this.w,this.h);
    if(this.icon?.complete) ctx.drawImage(this.icon,this.x-34,this.y-2,30,30);
  }
}

class HUD {
  constructor(){
    const base='img/7_statusbars/1_statusbar/1_statusbar_coin/green';
    this.left=16; this.top=34; this.gap=52; this.font='700 16px system-ui,sans-serif';
    this.coinBar   = new StatusBar(base,'img/7_statusbars/3_icons/icon_coin.png',0,0);
    this.bottleBar = new StatusBar(base,'img/7_statusbars/3_icons/icon_salsa_bottle.png',0,0);
    this.healthBar = new StatusBar(base,'img/7_statusbars/3_icons/icon_health.png',0,0);
    this.counts={coins:0,bottles:0};
  }
  layout(){
    this.bottleBar.x=this.left; this.bottleBar.y=this.top;
    this.healthBar.x=this.left; this.healthBar.y=this.top+this.gap;
    this.coinBar.x  =this.left; this.coinBar.y  =this.top+2*this.gap;
  }
  sync(world){
    const inv=world.inventory||{}, cfg=world.cfg||{}, hp=world.character?.hpPercent?.()??100;
    this.coinBar.set(100*(inv.coins||0)/((cfg.items?.coins)||10));
    this.bottleBar.set(100*(inv.bottles||0)/((cfg.items?.bottles)||5));
    this.healthBar.set(hp);
    this.counts={coins:inv.coins||0,bottles:inv.bottles||0};
  }
  draw(ctx,world){
    this.layout(); this.sync(world);
    [this.bottleBar,this.healthBar,this.coinBar].forEach(b=>{ b.draw(ctx); this._label(ctx,b); });
  }
  _label(ctx,b){
    const n = (b===this.coinBar)? this.counts.coins : (b===this.bottleBar? this.counts.bottles : null);
    if(n==null) return;
    ctx.save(); ctx.font=this.font; ctx.fillStyle='#000';
    ctx.fillText('×'+n, b.x+b.w+12, b.y+20); ctx.restore();
  }
}
window.HUD = HUD;
