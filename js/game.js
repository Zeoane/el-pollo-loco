// game.js
window.USERKEY = true;
try { localStorage.setItem('loggedInUserKey', 'dev'); } catch (e) {}

let canvas;
let world;
let keyboard = new Keyboard();

function init() {
  canvas = document.getElementById('canvas');
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  world = new World(canvas, keyboard);

  const isGameKey = (code) =>
    code === 'ArrowLeft' || code === 'ArrowRight' ||
    code === 'ArrowUp'   || code === 'ArrowDown' ||
    code === 'Space';

  window.addEventListener('keydown', (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation(); 
    if (e.code === 'ArrowLeft')  keyboard.LEFT  = true;
    if (e.code === 'ArrowRight') keyboard.RIGHT = true;
    if (e.code === 'ArrowUp')    keyboard.UP    = true;
    if (e.code === 'ArrowDown')  keyboard.DOWN  = true;
    if (e.code === 'Space')      keyboard.SPACE = true;
  }, true); 

  window.addEventListener('keyup', (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === 'ArrowLeft')  keyboard.LEFT  = false;
    if (e.code === 'ArrowRight') keyboard.RIGHT = false;
    if (e.code === 'ArrowUp')    keyboard.UP    = false;
    if (e.code === 'ArrowDown')  keyboard.DOWN  = false;
    if (e.code === 'Space')      keyboard.SPACE = false;
  }, true);
}



