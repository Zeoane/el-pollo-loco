/**
 * Creates the initial keyboard state for the game.
 * @returns {{LEFT:boolean,RIGHT:boolean,UP:boolean,DOWN:boolean,SPACE:boolean,F:boolean,G:boolean,HEAL:boolean}}
 */
function createKeyboardState() {
  return {
    LEFT: false,
    RIGHT: false,
    UP: false,
    DOWN: false,
    SPACE: false,
    F: false,
    G: false,
    HEAL: false,
  };
}

/**
 * Returns true if the given KeyboardEvent.code is used by the game.
 * @param {string} code
 * @returns {boolean}
 */
function isGameKey(code) {
  return [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Space",
    "KeyF",
    "KeyG",
    "KeyH",
  ].includes(code);
}

/**
 * Updates the keyboard state based on a key code.
 * @param {object} kb
 * @param {string} code
 * @param {boolean} isDown
 */
function updateKeyboardState(kb, code, isDown) {
  const map = {
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
    ArrowUp: "UP",
    ArrowDown: "DOWN",
    Space: "SPACE",
    KeyF: "F",
    KeyG: "G",
    KeyH: "HEAL",
  };
  const key = map[code];
  if (key) kb[key] = isDown;
}

/**
 * Handles keydown/keyup for game controls only.
 * @param {KeyboardEvent} e
 * @param {object} kb
 * @param {boolean} isDown
 */
function handleKeyEvent(e, kb, isDown) {
  if (!isGameKey(e.code)) return;
  e.preventDefault();
  e.stopPropagation();
  updateKeyboardState(kb, e.code, isDown);
}

/**
 * Binds keyboard listeners once.
 * @param {object} kb
 */
function bindKeyboard(kb) {
  addEventListener("keydown", (e) => handleKeyEvent(e, kb, true), true);
  addEventListener("keyup", (e) => handleKeyEvent(e, kb, false), true);
}

/**
 * Creates the world instance.
 * @returns {World}
 */
function createWorld() {
  const canvas = document.getElementById("canvas");
  return new World(canvas, window.keyboard, createLevel1());
}

/**
 * Initializes the game (entry point called from HTML or load event).
 */
window.init = function init() {
  window.keyboard = window.keyboard ?? createKeyboardState();
  bindKeyboard(window.keyboard);

  injectTemplates?.();
  setupStartScreen?.();
  setupEndControls?.();
  wireHowTo?.();
  setupTouchControls?.();

  window.world = createWorld();
  window.world.pause?.(true);

  startHudRAF?.();
  checkOrientation?.();
};

/**
 * Boots the game as soon as the DOM is ready.
 */
function bootWhenReady() {
  if (window.__initDone) return;
  window.__initDone = true;
  window.init();
}

if (document.readyState === "loading") {
  addEventListener("DOMContentLoaded", bootWhenReady);
} else {
  bootWhenReady();
}
