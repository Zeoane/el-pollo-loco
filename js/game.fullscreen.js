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
    isMobileViewport() ||
    (isViewportFullscreen() && !isCoarsePointer() && isLargeScreen())
  );
}

/**
 * Returns true on touch-first devices.
 * @returns {boolean}
 */
function isCoarsePointer() {
  return !!window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
}

/**
 * Returns true for larger screens.
 * @returns {boolean}
 */
function isLargeScreen() {
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  return Math.max(vw, vh) >= 900;
}

/**
 * Returns true for touch-first mobile/tablet viewports.
 * @returns {boolean}
 */
function isMobileViewport() {
  const minSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
  const maxSide = Math.max(window.innerWidth || 0, window.innerHeight || 0);
  const isSmallViewport = minSide <= 768 || maxSide <= 900;
  const isTabletViewport = minSide <= 1024 && maxSide <= 1366;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  const hasTouchEvent = "ontouchstart" in window;
  const isTouchCapable = isCoarsePointer() || hasTouchPoints || hasTouchEvent;
  return isTouchCapable && (isSmallViewport || isTabletViewport);
}

/**
 * Returns true when auto fullscreen should be attempted on mobile.
 * @returns {boolean}
 */
function shouldAutoFullscreenOnMobile() {
  return false;
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
 * Returns the first available requestFullscreen method.
 * @param {HTMLElement} element
 * @returns {Function|undefined}
 */
function getFullscreenRequestMethod(element) {
  return (
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||
    element.mozRequestFullScreen ||
    element.msRequestFullscreen
  );
}

/**
 * Returns the first available exitFullscreen method.
 * @returns {Function|undefined}
 */
function getFullscreenExitMethod() {
  return (
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen
  );
}

/**
 * Logs a warning when fullscreen is not supported.
 */
function warnFullscreenUnsupported() {
  console.warn("Fullscreen is not supported in this browser");
}

/**
 * Enters fullscreen mode for the specified element.
 * @param {HTMLElement} [element=document.body]
 * @returns {Promise<void>}
 */
async function enterFullscreen(element = document.body) {
  if (fullscreenPermissionDenied) return;
  if (!isFullscreenSupported()) return warnFullscreenUnsupported();
  const request = getFullscreenRequestMethod(element);
  if (!request) return;
  try {
    await request.call(element);
  } catch (error) {
    handleFullscreenPermissionError(error);
  }
}

/**
 * Exits fullscreen mode.
 * @returns {Promise<void>}
 */
async function exitFullscreen() {
  if (!isFullscreen()) return;
  const exitMethod = getFullscreenExitMethod();
  if (!exitMethod) return;
  try {
    await exitMethod.call(document);
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
  if (isFullscreen()) return exitFullscreen();
  return enterFullscreen(element);
}

/**
 * Applies fullscreen sizing and world updates.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement} gameContainer
 */
function applyFullscreenCanvas(canvas, gameContainer) {
  saveOriginalCanvasSize(canvas);
  setCanvasToFullscreen(canvas, gameContainer);
  if (window.world) updateWorldCanvas(window.world, canvas);
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
  if (useFullscreenLayout) return applyFullscreenCanvas(canvas, gameContainer);
  resetContainerStyles(gameContainer);
  restoreOriginalCanvasSize(canvas);
  if (window.world) updateWorldCanvas(window.world, canvas);
}

/**
 * Updates the fullscreen button icon based on current state.
 */
function updateFullscreenIcon() {
  const btn = document.getElementById("btnFullscreen");
  if (btn) {
    btn.textContent = isFullscreen() ? "🗗" : "⛶";
    btn.title = isFullscreen() ? "Vollbild beenden" : "Vollbild";
  }
  adjustCanvasForFullscreen();
}

/**
 * Hides the fullscreen button.
 * @param {HTMLElement} btn
 */
function hideFullscreenButton(btn) {
  btn.style.display = "none";
}

/**
 * Returns the element to toggle fullscreen on.
 * @returns {HTMLElement}
 */
function getFullscreenTarget() {
  return document.getElementById("game") || document.body;
}

/**
 * Handles fullscreen button clicks.
 * @returns {Promise<void>}
 */
async function handleFullscreenClick() {
  if (fullscreenPermissionDenied) return adjustCanvasForFullscreen();
  await toggleFullscreen(getFullscreenTarget());
}

/**
 * Returns the fullscreen change event names.
 * @returns {string[]}
 */
function getFullscreenEvents() {
  return [
    "fullscreenchange",
    "webkitfullscreenchange",
    "mozfullscreenchange",
    "MSFullscreenChange",
  ];
}

/**
 * Schedules a fullscreen canvas adjustment.
 */
function scheduleFullscreenAdjust() {
  requestAnimationFrame(() => requestAnimationFrame(adjustCanvasForFullscreen));
}

/**
 * Handles fullscreen change events.
 */
function handleFullscreenChange() {
  updateFullscreenIcon();
  scheduleFullscreenAdjust();
}

/**
 * Binds fullscreen change events.
 */
function bindFullscreenEvents() {
  getFullscreenEvents().forEach((event) => {
    document.addEventListener(event, handleFullscreenChange);
  });
}

/**
 * Binds the resize handler for fullscreen.
 */
function bindFullscreenResize() {
  window.addEventListener("resize", adjustCanvasForFullscreen);
}

/**
 * Binds the fullscreen button click handler.
 * @param {HTMLElement} btn
 */
function bindFullscreenClick(btn) {
  btn.addEventListener("click", handleFullscreenClick);
}

let autoFullscreenBound = false;
let fullscreenPermissionDenied = false;
let fullscreenAutoBlocked = false;

/**
 * Handles fullscreen permission errors and disables further attempts.
 * @param {any} error
 */
function handleFullscreenPermissionError(error) {
  const msg = String(error?.message || "");
  const name = String(error?.name || "");
  const isGestureError =
    /user gesture/i.test(msg) ||
    /initiated by a user gesture/i.test(msg) ||
    /gesture/i.test(msg);
  const isDenied =
    name === "NotAllowedError" ||
    name === "SecurityError" ||
    /permission|denied|not allowed/i.test(msg);
  if (isGestureError) {
    fullscreenAutoBlocked = true;
    adjustCanvasForFullscreen();
    return;
  }
  if (isDenied) {
    fullscreenPermissionDenied = true;
    adjustCanvasForFullscreen();
    return;
  }
  console.error("Error entering fullscreen:", error);
}

/**
 * Attempts to enter fullscreen on first user interaction (mobile/tablet).
 */
function bindAutoFullscreenOnFirstInteraction() {
  if (autoFullscreenBound) return;
  if (!isMobileViewport()) return;
  if (!shouldAutoFullscreenOnMobile()) return;
  if (!isFullscreenSupported()) return;
  autoFullscreenBound = true;
  const target = getFullscreenTarget();
  const attempt = () => {
    if (fullscreenAutoBlocked) return;
    if (isFullscreen()) return;
    enterFullscreen(target);
  };
  const opts = { passive: true, once: true };
  document.addEventListener("touchstart", attempt, opts);
  document.addEventListener("pointerdown", attempt, opts);
  document.addEventListener("click", attempt, opts);
}

/**
 * Wires the fullscreen button and sets up event listeners.
 */
function wireFullscreen() {
  const btn = document.getElementById("btnFullscreen");
  if (!btn) return;
  if (!isFullscreenSupported()) {
    hideFullscreenButton(btn);
  } else {
    bindFullscreenClick(btn);
    bindFullscreenEvents();
  }
  bindFullscreenResize();
  updateFullscreenIcon();
  bindAutoFullscreenOnFirstInteraction();
}

window.wireFullscreen = wireFullscreen;
window.adjustCanvasForFullscreen = adjustCanvasForFullscreen;
