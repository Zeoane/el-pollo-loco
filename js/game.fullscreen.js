/**
 * Fullscreen functionality for desktop and mobile devices.
 */

/**
 * Checks if the browser supports fullscreen API.
 * @returns {boolean}
 */
function isFullscreenSupported() {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled ||
    document.msFullscreenEnabled
  );
}

/**
 * Checks if the document is currently in fullscreen mode.
 * @returns {boolean}
 */
function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

/**
 * Checks if the viewport is effectively fullscreen (e.g. F11).
 * @returns {boolean}
 */
function isViewportFullscreen() {
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const sw = screen.width || 0;
  const sh = screen.height || 0;
  if (!vw || !vh || !sw || !sh) return false;
  return vw / sw > 0.95 && vh / sh > 0.95;
}

/**
 * Determines if fullscreen layout should be applied.
 * @returns {boolean}
 */
function shouldUseFullscreenLayout() {
  return (
    isFullscreen() ||
    (isViewportFullscreen() && !isCoarsePointer() && isLargeScreen())
  );
}

/**
 * Returns true on touch-first devices (prevents false fullscreen on mobile).
 * @returns {boolean}
 */
function isCoarsePointer() {
  return !!window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
}

/**
 * Returns true for larger screens (avoid false fullscreen on mobile sizes).
 * @returns {boolean}
 */
function isLargeScreen() {
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  return Math.max(vw, vh) >= 900;
}

/**
 * Toggles fullscreen layout class on root elements.
 * @param {boolean} active
 */
function setFullscreenLayoutActive(active) {
  document.body?.classList.toggle("fullscreen-layout", active);
  document.documentElement?.classList.toggle("fullscreen-layout", active);
}

/**
 * Enters fullscreen mode for the specified element (or body by default).
 * @param {HTMLElement} [element=document.body]
 * @returns {Promise<void>}
 */
async function enterFullscreen(element = document.body) {
  if (!isFullscreenSupported()) {
    console.warn("Fullscreen is not supported in this browser");
    return;
  }

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
  } catch (error) {
    console.error("Error entering fullscreen:", error);
  }
}

/**
 * Exits fullscreen mode.
 * @returns {Promise<void>}
 */
async function exitFullscreen() {
  if (!isFullscreen()) return;

  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      await document.msExitFullscreen();
    }
  } catch (error) {
    console.error("Error exiting fullscreen:", error);
  }
}

/**
 * Toggles fullscreen mode.
 * @param {HTMLElement} [element=document.body]
 * @returns {Promise<void>}
 */
async function toggleFullscreen(element = document.body) {
  if (isFullscreen()) {
    await exitFullscreen();
  } else {
    await enterFullscreen(element);
  }
}

/**
 * Saves the original canvas dimensions.
 * @param {HTMLCanvasElement} canvas
 */
function saveOriginalCanvasSize(canvas) {
  if (!canvas._originalWidth) {
    canvas._originalWidth = canvas.width;
    canvas._originalHeight = canvas.height;
  }
}

/**
 * Sets canvas to fullscreen dimensions.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} gameContainer
 */
function setCanvasToFullscreen(canvas, gameContainer) {
  const baseW = canvas._originalWidth || canvas.width || 720;
  const baseH = canvas._originalHeight || canvas.height || 480;
  const vw = Math.max(1, window.innerWidth || screen.width || baseW);
  const vh = Math.max(1, window.innerHeight || screen.height || baseH);

  canvas.width = Math.round(vw);
  canvas.height = Math.round(vh);
  const cssW = Math.round(vw);
  const cssH = Math.round(vh);

  if (gameContainer) {
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

  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;
  canvas.style.maxWidth = "none";
  canvas.style.maxHeight = "none";
  
  // Scale groundY and all game elements proportionally to new canvas height
  const world = window.world;
  if (world && canvas._originalHeight) {
    const originalH = canvas._originalHeight;
    const scale = vh / originalH;
    
    if (world._originalGroundY === undefined) {
      world._originalGroundY = world.groundY;
    }
    world.groundY = Math.round(world._originalGroundY * scale);
    
    // Scale all game elements
    scaleGameElements(world, scale);
  }
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
  canvas.style.width = "";
  canvas.style.height = "";
  canvas.style.maxWidth = "";
  canvas.style.maxHeight = "";
  
  // Restore original groundY and game elements
  const world = window.world;
  if (world && world._originalGroundY !== undefined) {
    world.groundY = world._originalGroundY;
    
    // Restore all game elements before clearing original ground
    restoreGameElements(world);
    world._originalGroundY = undefined;
  }
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
  
  // Reposition character on ground
  if (world.character) {
    const wasOnGround =
      world.character.y + world.character.height >= originalGroundY - 1;
    
    if (world.character._originalGroundOffset === undefined) {
      world.character._originalGroundOffset = world.character.y - originalGroundY;
    }
    
    if (world.character.setGround) {
      world.character.setGround(newGroundY);
    }
    
    // If character was on ground, ensure it stays on ground after scaling
    if (wasOnGround) {
      world.character.placeOnGround?.();
      world.character.vy = 0;
      world.character.onGround = true;
    } else {
      world.character.y = newGroundY + world.character._originalGroundOffset * scale;
    }
  }
  
  // Scale coins - maintain relative position to groundY proportionally
  world.coins?.forEach((coin) => {
    // If this is the first time scaling, save the original offset
    if (coin._originalOffset === undefined) {
      coin._originalOffset = coin.y - originalGroundY;
    }
    
    // Keep fixed pixel offset from ground (coins are not height-scaled)
    coin.y = newGroundY + coin._originalOffset;
  });
  
  // Scale bottles - maintain relative position to groundY proportionally
  world.bottles?.forEach((bottle) => {
    // If this is the first time scaling, save the original offset
    if (bottle._originalOffset === undefined) {
      bottle._originalOffset = bottle.y - originalGroundY;
    }
    
    // Keep fixed pixel offset from ground (bottles are not height-scaled)
    bottle.y = newGroundY + bottle._originalOffset;
  });
  
  // Reposition opponents on ground
  world.opponents?.forEach((opponent) => {
    // Handle Endboss separately - ensure it stays off-screen to the right
    const isEndboss = opponent.constructor?.name === "Endboss" || opponent instanceof window.Endboss;
    if (isEndboss) {
      const canvasWidth = world.canvas?.width || 1920;
      const cameraRight = (world.cameraX || 0) + canvasWidth;
      const minX = cameraRight + 200; // Keep boss off-screen
      if (opponent.x < minX) {
        opponent.x = minX;
      }
    }
    
    if (opponent._originalGroundOffset === undefined) {
      opponent._originalGroundOffset = opponent.y - originalGroundY;
    }
    opponent.y = newGroundY + opponent._originalGroundOffset * scale;
    if (opponent.setGround) {
      opponent.setGround(newGroundY);
    }
  });
}

/**
 * Restores original positions of all game elements.
 * @param {Object} world
 */
function restoreGameElements(world) {
  if (!world || !world._originalGroundY) return;
  
  const originalGroundY = world._originalGroundY;
  
  // Restore character
  if (world.character && world.character._originalGroundOffset !== undefined) {
    world.character.y = originalGroundY + world.character._originalGroundOffset;
    world.character._originalGroundOffset = undefined;
    if (world.character.setGround) {
      world.character.setGround(originalGroundY);
    }
  }
  
  // Restore coins - use saved original offset
  world.coins?.forEach((coin) => {
    if (coin._originalOffset !== undefined) {
      // Restore using saved original offset
      coin.y = originalGroundY + coin._originalOffset;
      coin._originalOffset = undefined;
    } else {
      // Item was spawned during fullscreen - keep fixed pixel offset
      const currentGroundY = world.groundY;
      const currentOffset = coin.y - currentGroundY;
      coin.y = originalGroundY + currentOffset;
    }
  });
  
  // Restore bottles - use saved original offset
  world.bottles?.forEach((bottle) => {
    if (bottle._originalOffset !== undefined) {
      // Restore using saved original offset
      bottle.y = originalGroundY + bottle._originalOffset;
      bottle._originalOffset = undefined;
    } else {
      // Item was spawned during fullscreen - keep fixed pixel offset
      const currentGroundY = world.groundY;
      const currentOffset = bottle.y - currentGroundY;
      bottle.y = originalGroundY + currentOffset;
    }
  });
  
  // Restore opponents
  world.opponents?.forEach((opponent) => {
    if (opponent._originalGroundOffset !== undefined) {
      opponent.y = originalGroundY + opponent._originalGroundOffset;
      opponent._originalGroundOffset = undefined;
      if (opponent.setGround) {
        opponent.setGround(originalGroundY);
      }
    }
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
  
  // Reset background layer dimensions to adapt to new canvas size
  if (world.backgroundObjects) {
    world.backgroundObjects.forEach((bg) => {
      if (bg && typeof bg.resetDimensions === "function") {
        bg.resetDimensions();
      }
    });
  }
  
  // Also reset cloud layer dimensions if it's a separate array
  // Note: CloudLayer extends BackgroundObject, so it should be handled above
  // But we check all objects to be safe
}

/**
 * Adjusts canvas size for fullscreen mode.
 */
function adjustCanvasForFullscreen() {
  const canvas = document.getElementById("canvas");
  const gameContainer = document.getElementById("game");
  if (!canvas || !gameContainer) return;

  const useFullscreenLayout = shouldUseFullscreenLayout();
  setFullscreenLayoutActive(useFullscreenLayout);

  if (useFullscreenLayout) {
    saveOriginalCanvasSize(canvas);
    setCanvasToFullscreen(canvas, gameContainer);
    if (window.world) updateWorldCanvas(window.world, canvas);
  } else {
    gameContainer.style.position = "";
    gameContainer.style.left = "";
    gameContainer.style.top = "";
    gameContainer.style.width = "";
    gameContainer.style.height = "";
    gameContainer.style.maxWidth = "";
    gameContainer.style.maxHeight = "";
    restoreOriginalCanvasSize(canvas);
    if (window.world) updateWorldCanvas(window.world, canvas);
  }
}

/**
 * Updates the fullscreen button icon based on current state.
 */
function updateFullscreenIcon() {
  const btn = document.getElementById("btnFullscreen");
  if (!btn) return;

  if (isFullscreen()) {
    btn.textContent = "🗗";
    btn.title = "Vollbild beenden";
  } else {
    btn.textContent = "⛶";
    btn.title = "Vollbild";
  }
  adjustCanvasForFullscreen();
}

/**
 * Wires the fullscreen button and sets up event listeners.
 */
function wireFullscreen() {
  const btn = document.getElementById("btnFullscreen");
  if (!btn) return;

  // Check if fullscreen is supported
  if (!isFullscreenSupported()) {
    btn.style.display = "none";
    return;
  }

  // Toggle fullscreen on button click
  btn.addEventListener("click", async () => {
    const gameContainer = document.getElementById("game");
    if (gameContainer) {
      await toggleFullscreen(gameContainer);
    } else {
      await toggleFullscreen(document.body);
    }
  });

  // Update icon and canvas when fullscreen state changes
  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  events.forEach((event) => {
    document.addEventListener(event, () => {
      updateFullscreenIcon();
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          adjustCanvasForFullscreen();
        });
      });
    });
  });

  // Handle window resize in fullscreen
  window.addEventListener("resize", () => {
    adjustCanvasForFullscreen();
  });

  // Initial icon update
  updateFullscreenIcon();
}

window.wireFullscreen = wireFullscreen;
