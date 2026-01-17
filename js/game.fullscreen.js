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
  const fullscreenEl = document.fullscreenElement || 
    document.webkitFullscreenElement || 
    document.mozFullScreenElement || 
    document.msFullscreenElement;
  
  const container = fullscreenEl || gameContainer || document.documentElement;
  const w = Math.max(
    container.clientWidth || 0,
    window.innerWidth || 0,
    screen.width || 0
  );
  const h = Math.max(
    container.clientHeight || 0,
    window.innerHeight || 0,
    screen.height || 0
  );
  
  canvas.width = w || 1920;
  canvas.height = h || 1080;
  
  // Scale groundY and all game elements proportionally to new canvas height
  const world = window.world;
  if (world && canvas._originalHeight) {
    const originalH = canvas._originalHeight;
    const scale = h / originalH;
    
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

  const world = window.world;
  if (!world) return;

  if (isFullscreen()) {
    saveOriginalCanvasSize(canvas);
    setCanvasToFullscreen(canvas, gameContainer);
    updateWorldCanvas(world, canvas);
  } else {
    restoreOriginalCanvasSize(canvas);
    updateWorldCanvas(world, canvas);
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
    if (isFullscreen()) {
      adjustCanvasForFullscreen();
    }
  });

  // Initial icon update
  updateFullscreenIcon();
}

window.wireFullscreen = wireFullscreen;
