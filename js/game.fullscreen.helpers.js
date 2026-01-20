/**
 * Saves the original canvas dimensions.
 * @param {HTMLCanvasElement} canvas
 */
function saveOriginalCanvasSize(canvas) {
  if (canvas._originalWidth) return;
  canvas._originalWidth = canvas.width;
  canvas._originalHeight = canvas.height;
}

/**
 * Returns viewport and canvas fallback sizes.
 * @param {HTMLCanvasElement} canvas
 * @returns {{vw:number,vh:number,baseW:number,baseH:number}}
 */
function getViewportSize(canvas) {
  const baseW = canvas._originalWidth || canvas.width || 720;
  const baseH = canvas._originalHeight || canvas.height || 480;
  const vw = Math.max(1, window.innerWidth || screen.width || baseW);
  const vh = Math.max(1, window.innerHeight || screen.height || baseH);
  return { vw, vh, baseW, baseH };
}

/**
 * Sets canvas pixel dimensions.
 * @param {HTMLCanvasElement} canvas
 * @param {number} vw
 * @param {number} vh
 */
function setCanvasPixels(canvas, vw, vh) {
  canvas.width = Math.round(vw);
  canvas.height = Math.round(vh);
}

/**
 * Applies fullscreen styles to the canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {number} vw
 * @param {number} vh
 */
function setCanvasStyles(canvas, vw, vh) {
  canvas.style.width = `${Math.round(vw)}px`;
  canvas.style.height = `${Math.round(vh)}px`;
  canvas.style.maxWidth = "none";
  canvas.style.maxHeight = "none";
}

/**
 * Applies fullscreen styles to the game container.
 * @param {HTMLElement} gameContainer
 * @param {number} vw
 * @param {number} vh
 */
function applyContainerStyles(gameContainer, vw, vh) {
  if (!gameContainer) return;
  gameContainer.style.position = "fixed";
  gameContainer.style.left = "0";
  gameContainer.style.top = "0";
  gameContainer.style.width = `${vw}px`;
  gameContainer.style.height = `${vh}px`;
  gameContainer.style.maxWidth = "none";
  gameContainer.style.maxHeight = "none";
  gameContainer.style.display = "flex";
  gameContainer.style.alignItems = "center";
  gameContainer.style.justifyContent = "center";
}

/**
 * Resets fullscreen styles on the game container.
 * @param {HTMLElement} gameContainer
 */
function resetContainerStyles(gameContainer) {
  if (!gameContainer) return;
  gameContainer.style.position = "";
  gameContainer.style.left = "";
  gameContainer.style.top = "";
  gameContainer.style.width = "";
  gameContainer.style.height = "";
  gameContainer.style.maxWidth = "";
  gameContainer.style.maxHeight = "";
}

/**
 * Updates world ground and elements for fullscreen height.
 * @param {Object} world
 * @param {number} vh
 * @param {number} originalH
 */
function updateWorldForFullscreen(world, vh, originalH) {
  if (!world || !originalH) return;
  const scale = vh / originalH;
  if (world._originalGroundY === undefined) world._originalGroundY = world.groundY;
  world.groundY = Math.round(world._originalGroundY * scale);
  scaleGameElements(world, scale);
}

/**
 * Sets canvas to fullscreen dimensions.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} gameContainer
 */
function setCanvasToFullscreen(canvas, gameContainer) {
  const { vw, vh } = getViewportSize(canvas);
  setCanvasPixels(canvas, vw, vh);
  applyContainerStyles(gameContainer, vw, vh);
  setCanvasStyles(canvas, vw, vh);
  updateWorldForFullscreen(window.world, vh, canvas._originalHeight);
}

/**
 * Clears fullscreen styles from the canvas.
 * @param {HTMLCanvasElement} canvas
 */
function clearCanvasStyles(canvas) {
  canvas.style.width = "";
  canvas.style.height = "";
  canvas.style.maxWidth = "";
  canvas.style.maxHeight = "";
}

/**
 * Restores world ground and elements after fullscreen.
 * @param {Object} world
 */
function restoreWorldFromFullscreen(world) {
  if (!world || world._originalGroundY === undefined) return;
  world.groundY = world._originalGroundY;
  restoreGameElements(world);
  world._originalGroundY = undefined;
}

/**
 * Restores the original canvas dimensions.
 * @param {HTMLCanvasElement} canvas
 */
function restoreOriginalCanvasSize(canvas) {
  if (!canvas._originalWidth) return;
  canvas.width = canvas._originalWidth;
  canvas.height = canvas._originalHeight;
  canvas._originalWidth = null;
  canvas._originalHeight = null;
  clearCanvasStyles(canvas);
  restoreWorldFromFullscreen(window.world);
}

/**
 * Scales all game elements proportionally to new canvas height.
 * @param {Object} world
 * @param {number} scale
 */
function scaleGameElements(world, scale) {
  if (!world || !world._originalGroundY) return;
  const originalGroundY = world._originalGroundY;
  const newGroundY = world.groundY;
  scaleCharacter(world.character, originalGroundY, newGroundY, scale);
  scaleItems(world.coins, originalGroundY, newGroundY);
  scaleItems(world.bottles, originalGroundY, newGroundY);
  scaleOpponents(world.opponents, originalGroundY, newGroundY, scale, world);
}

/**
 * Scales the main character to the new ground.
 * @param {Object} character
 * @param {number} originalGroundY
 * @param {number} newGroundY
 * @param {number} scale
 */
function scaleCharacter(character, originalGroundY, newGroundY, scale) {
  if (!character) return;
  const wasOnGround = character.y + character.height >= originalGroundY - 1;
  if (character._originalGroundOffset === undefined) {
    character._originalGroundOffset = character.y - originalGroundY;
  }
  if (character.setGround) character.setGround(newGroundY);
  if (wasOnGround) return placeCharacterOnGround(character);
  character.y = newGroundY + character._originalGroundOffset * scale;
}

/**
 * Places the character on the ground.
 * @param {Object} character
 */
function placeCharacterOnGround(character) {
  character.placeOnGround?.();
  character.vy = 0;
  character.onGround = true;
}

/**
 * Scales item positions relative to the ground.
 * @param {Object[]} items
 * @param {number} originalGroundY
 * @param {number} newGroundY
 */
function scaleItems(items, originalGroundY, newGroundY) {
  items?.forEach((item) => {
    if (item._originalOffset === undefined) item._originalOffset = item.y - originalGroundY;
    item.y = newGroundY + item._originalOffset;
  });
}

/**
 * Keeps the endboss offscreen to the right.
 * @param {Object} opponent
 * @param {Object} world
 */
function ensureEndbossOffscreen(opponent, world) {
  const isEndboss =
    opponent.constructor?.name === "Endboss" || opponent instanceof window.Endboss;
  if (!isEndboss) return;
  const canvasWidth = world.canvas?.width || 1920;
  const cameraRight = (world.cameraX || 0) + canvasWidth;
  const minX = cameraRight + 200;
  if (opponent.x < minX) opponent.x = minX;
}

/**
 * Scales opponents relative to the ground.
 * @param {Object[]} opponents
 * @param {number} originalGroundY
 * @param {number} newGroundY
 * @param {number} scale
 * @param {Object} world
 */
function scaleOpponents(opponents, originalGroundY, newGroundY, scale, world) {
  opponents?.forEach((opponent) => {
    ensureEndbossOffscreen(opponent, world);
    if (opponent._originalGroundOffset === undefined) {
      opponent._originalGroundOffset = opponent.y - originalGroundY;
    }
    opponent.y = newGroundY + opponent._originalGroundOffset * scale;
    if (opponent.setGround) opponent.setGround(newGroundY);
  });
}

/**
 * Restores original positions of all game elements.
 * @param {Object} world
 */
function restoreGameElements(world) {
  if (!world || !world._originalGroundY) return;
  const originalGroundY = world._originalGroundY;
  restoreCharacter(world.character, originalGroundY);
  restoreItems(world.coins, originalGroundY, world.groundY);
  restoreItems(world.bottles, originalGroundY, world.groundY);
  restoreOpponents(world.opponents, originalGroundY);
}

/**
 * Restores the character position after fullscreen.
 * @param {Object} character
 * @param {number} originalGroundY
 */
function restoreCharacter(character, originalGroundY) {
  if (!character || character._originalGroundOffset === undefined) return;
  character.y = originalGroundY + character._originalGroundOffset;
  character._originalGroundOffset = undefined;
  if (character.setGround) character.setGround(originalGroundY);
}

/**
 * Restores item positions after fullscreen.
 * @param {Object[]} items
 * @param {number} originalGroundY
 * @param {number} currentGroundY
 */
function restoreItems(items, originalGroundY, currentGroundY) {
  items?.forEach((item) => {
    if (item._originalOffset !== undefined) {
      item.y = originalGroundY + item._originalOffset;
      item._originalOffset = undefined;
      return;
    }
    const currentOffset = item.y - currentGroundY;
    item.y = originalGroundY + currentOffset;
  });
}

/**
 * Restores opponent positions after fullscreen.
 * @param {Object[]} opponents
 * @param {number} originalGroundY
 */
function restoreOpponents(opponents, originalGroundY) {
  opponents?.forEach((opponent) => {
    if (opponent._originalGroundOffset === undefined) return;
    opponent.y = originalGroundY + opponent._originalGroundOffset;
    opponent._originalGroundOffset = undefined;
    if (opponent.setGround) opponent.setGround(originalGroundY);
  });
}

/**
 * Updates the world's canvas reference and resets background dimensions.
 * @param {Object} world
 * @param {HTMLCanvasElement} canvas
 */
function updateWorldCanvas(world, canvas) {
  world.canvas = canvas;
  world.ctx = canvas.getContext("2d");
  resetBackgroundLayers(world.backgroundObjects);
}

/**
 * Resets background object dimensions.
 * @param {Object[]} backgroundObjects
 */
function resetBackgroundLayers(backgroundObjects) {
  backgroundObjects?.forEach((bg) => {
    if (bg && typeof bg.resetDimensions === "function") bg.resetDimensions();
  });
}
