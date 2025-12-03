// models/hud.class.js
class HUD {
  constructor(){
    this.coin = new Image();   this.coin.src = 'img/6_coins/coin.png';
    this.bottle = new Image(); this.bottle.src = 'img/7_bottles/bottle.png';
    this.heart = new Image();  this.heart.src = 'img/ui/heart.png'; // fallback unten
    this.pad = 10; this.icon = 26;
  }

  draw(ctx, world){
    const y = this.pad, x0 = this.pad;
    this.drawBadge(ctx, this.coin,   world.inventory?.coins||0, x0, y);
    this.drawBadge(ctx, this.bottle, world.inventory?.bottles||0, x0+100, y);
    const hp = world.character?.hp ?? (world.cfg?.player?.health ?? 3);
    this.drawHearts(ctx, hp, x0+200, y);
  }

  drawBadge(ctx, img, count, x, y){
    this.drawPanel(ctx, x, y, 86, this.icon+8);
    this.drawIcon(ctx, img, x+6, y+6, this.icon, this.icon);
    this.drawLabel(ctx, '× ' + count, x+40, y+25);
  }

  drawHearts(ctx, n, x, y){
    this.drawPanel(ctx, x, y, 120, this.icon+8);
    const w = this.icon, gap = 6, y2 = y+6;
    for(let i=0;i<Math.max(0,n)&&i<4;i++) this.drawIcon(ctx, this.heart, x+6+i*(w+gap), y2, w, w);
  }

  drawPanel(ctx, x, y, w, h){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
    ctx.restore();
  }

  drawIcon(ctx, img, x, y, w, h){
    if (img && img.complete && img.naturalWidth>0) ctx.drawImage(img, x, y, w, h);
    else { ctx.save(); ctx.fillStyle='#ccc'; ctx.fillRect(x,y,w,h); ctx.restore(); }
  }

  drawLabel(ctx, text, x, y){
    ctx.save();
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillStyle = '#000'; ctx.fillText(text, x+1, y+1);
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
window.HUD = HUD;
