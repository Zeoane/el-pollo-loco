/**
 * Shows/hides the rotate overlay.
 */
function isPortraitMode() {
  return window.matchMedia("(orientation: portrait)").matches;
}

function isMobileLike() {
  // iPhone/Android + Tablets – üblich für die Abgabe
  return Math.min(window.innerWidth, window.innerHeight) <= 820;
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

