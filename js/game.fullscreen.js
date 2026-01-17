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

  // Update icon when fullscreen state changes
  const events = [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];

  events.forEach((event) => {
    document.addEventListener(event, updateFullscreenIcon);
  });

  // Initial icon update
  updateFullscreenIcon();
}

window.wireFullscreen = wireFullscreen;
