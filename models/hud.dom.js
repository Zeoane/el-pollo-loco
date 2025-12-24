// models/hud.dom.js
class HUDOverlay{
  constructor(root){
    this.root = root;
    this.el = {
      bottleFill: root.querySelector('.hud-row[data-kind="bottle"] .fill'),
      healthFill: root.querySelector('.hud-row[data-kind="health"] .fill'),
      coinFill:   root.querySelector('.hud-row[data-kind="coin"] .fill'),
      lblBottle:  document.getElementById('lbl-bottle'),
      lblHealth:  document.getElementById('lbl-health'),
      lblCoin:    document.getElementById('lbl-coin'),
    };
  }
  _pct(n,d){ return Math.max(0, Math.min(100, d ? (n*100)/d : 0)); }
  _set(el,p){ el?.style.setProperty('--p', p.toFixed(0) + '%'); }
  sync(world){
    const inv = world?.inventory||{}, cfg = world?.cfg||{};
    const coins = inv.coins||0,  coinsMax   = cfg.items?.coins||10;
    const bottles = inv.bottles||0, bottlesMax = cfg.items?.bottles||5;
    const hpPct = world?.character?.hpPercent?.() ?? 100;

    this._set(this.el.coinFill,   this._pct(coins,   coinsMax));
    this._set(this.el.bottleFill, this._pct(bottles, bottlesMax));
    this._set(this.el.healthFill, hpPct);

    if (this.el.lblCoin)   this.el.lblCoin.textContent   = '×' + coins;
    if (this.el.lblBottle) this.el.lblBottle.textContent = '×' + bottles;
    if (this.el.lblHealth) this.el.lblHealth.textContent = hpPct.toFixed(0) + '%';
  }
}

window.addEventListener('load', () => {
  const root = document.getElementById('hud');
  if (!root) return;
  const hud = new HUDOverlay(root);
  const loop = () => { if (window.world) hud.sync(window.world); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
