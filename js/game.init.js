/**
 * Global Keyboard state object.
 * @type {Object}
 */
const KB = window.GameKeyboard ? new GameKeyboard() : {};
window.keyboard = KB;

/**
 * Checks if a key code belongs to the game controls.
 * @param {string} code - The keyboard event code.
 * @returns {boolean}
 */
const isGameKey = (code) => ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyF", "KeyG", "KeyH"].includes(code);

/**
 * Maps key codes to internal KB state.
 * @param {string} code - Keyboard code.
 * @param {boolean} val - True for down, false for up.
 */
const updateKB = (code, val) => {
  if (code === "ArrowLeft") KB.LEFT = val;
  if (code === "ArrowRight") KB.RIGHT = val;
  if (code === "ArrowUp") KB.UP = val;
  if (code === "ArrowDown") KB.DOWN = val;
  if (code === "Space") KB.SPACE = val;
  if (code === "KeyF") KB.F = val;
  if (code === "KeyG") KB.G = val;
  if (code === "KeyH") KB.HEAL = val;
};

/**
 * Global key event handler.
 */
const handleKeyEvent = (e, isDown) => {
  if (!isGameKey(e.code)) return;
  e.preventDefault();
  e.stopPropagation();
  updateKB(e.code, isDown);
};

addEventListener("keydown", (e) => handleKeyEvent(e, true), true);
addEventListener("keyup", (e) => handleKeyEvent(e, false), true);

/**
 * Initializes the core game instance.
 */
window.init = function () {
  try {
    const canvas = document.getElementById("canvas");
    window.world = new World(canvas, keyboard, createLevel1());
    world.pause?.(true);
    startHudRAF();
    setupStartScreen();
    wireHowTo();
  } catch (e) {}
};