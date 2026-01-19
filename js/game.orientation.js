/**
 * Shows/hides the rotate overlay.
 */
function isPortraitMode() {
  return window.matchMedia("(orientation: portrait)").matches;
}

function isMobileLike() {
  // Mobile/Tablet (Touch/Coarse Pointer) + typische kleinere Viewports
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  const hasTouchEvent = "ontouchstart" in window;
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const maxSide = Math.max(window.innerWidth, window.innerHeight);
  const isSmallViewport = minSide <= 768 || maxSide <= 900;
  const isTabletViewport = minSide <= 1024 && maxSide <= 1366;
  const isTouchCapable = isCoarsePointer || hasTouchPoints || hasTouchEvent;
  return (isSmallViewport || isTabletViewport) && isTouchCapable;
}

function toggleRotateOverlay(show) {
  const el = document.getElementById("rotateDeviceScreen");
  if (!el) return;
  el.classList.toggle("show", show);
}

/**
 * Enforces landscape play on mobile/tablet.
*/
function checkOrientation() {
  const mustRotate = isMobileLike() && isPortraitMode();
  toggleRotateOverlay(mustRotate);
  if (mustRotate) return window.world?.pause?.(true);
  resumeIfStarted();
}

function resumeIfStarted() {
  const started = document.getElementById("startScreen")
    ?.classList.contains("hidden");
  if (started) window.world?.pause?.(false);
}

addEventListener("resize", checkOrientation);
addEventListener("orientationchange", checkOrientation);
addEventListener("load", checkOrientation);

