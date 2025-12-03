// game.js
console.log('[GAME] game.js loaded');

// --- Globals ---
window.keyboard = new GameKeyboard(); 
window.world = null;

// --- Init for <body onload="init()">  ---
window.init = function () {
  console.log('[GAME] init() start');
  try {
    const canvas = document.getElementById('canvas');
    const level1 = createLevel1();
    window.world = new World(canvas, keyboard, level1);
    console.log('[GAME] init() done');
  } catch (e) {
    console.error('[GAME] init() error:', e);
  }
};

// (optional) Dev-Flag wie gehabt
window.USERKEY = true;
try { localStorage.setItem('loggedInUserKey', 'dev'); } catch {}

// --- Key handling ---
const isGameKey = (code) =>
  code === 'ArrowLeft' || code === 'ArrowRight' ||
  code === 'ArrowUp'   || code === 'ArrowDown' ||
  code === 'Space'     || code === 'KeyF';

window.addEventListener('keydown', (e) => {
  if (!isGameKey(e.code)) return;
  e.preventDefault(); e.stopPropagation();
  if (e.code === 'ArrowLeft')  keyboard.LEFT  = true;
  if (e.code === 'ArrowRight') keyboard.RIGHT = true;
  if (e.code === 'ArrowUp')    keyboard.UP    = true;
  if (e.code === 'ArrowDown')  keyboard.DOWN  = true;
  if (e.code === 'Space')      keyboard.SPACE = true;
  if (e.code === 'KeyF')       keyboard.F     = true;   
}, true);

window.addEventListener('keyup', (e) => {
  if (!isGameKey(e.code)) return;
  e.preventDefault(); e.stopPropagation();
  if (e.code === 'ArrowLeft')  keyboard.LEFT  = false;
  if (e.code === 'ArrowRight') keyboard.RIGHT = false;
  if (e.code === 'ArrowUp')    keyboard.UP    = false;
  if (e.code === 'ArrowDown')  keyboard.DOWN  = false;
  if (e.code === 'Space')      keyboard.SPACE = false;
  if (e.code === 'KeyF')       keyboard.F     = false;
}, true);

// --- Audio preload / settings ---
window.addEventListener('DOMContentLoaded', async () => {
  SFX.unlockOnGesture();
  await SFX.loadAll({
    coin:  'audio/coin.wav',
    bottle:'audio/bottle_pick.wav',
    throw: 'audio/throw.wav',
    jump:  'audio/jump.wav',
    hit:   'audio/hit.wav',
    boss:  'audio/boss_theme.mp3',
    bg:    'audio/loop_bg.mp3'
  });
  SFX.initFromStorage?.();
  if (localStorage.getItem(SFX.key) == null) SFX.setVolume?.(0.6);

  // Volume/Mute (optional)
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyM') SFX.toggleMute?.();
    if (e.code === 'BracketLeft')  SFX.setVolume?.(Math.max(0, SFX.vol - 0.1));
    if (e.code === 'BracketRight') SFX.setVolume?.(Math.min(1, SFX.vol + 0.1));
  });
});




