const TOUCH_KEYS = ["LEFT", "RIGHT", "UP", "F", "HEAL"];

/**
 * Initialize touch controls if present and not yet bound.
 */
function setupTouchControls() {
  const root = getTouchControlsRoot();
  if (!root || isTouchBound(root)) return;
  markTouchBound(root);
  const kb = getKeyboard();
  showTouchControls(root);
  bindTouchButtons(root, kb);
  bindGlobalReset(kb);
}

/**
 * Return the touch controls root element.
 */
function getTouchControlsRoot() {
  return document.getElementById("touchControls");
}

/**
 * Check if touch controls are already bound.
 */
function isTouchBound(root) {
  return root.dataset.bound === "true";
}

/**
 * Mark touch controls as bound.
 */
function markTouchBound(root) {
  root.dataset.bound = "true";
}

/**
 * Get or create the global keyboard state.
 */
function getKeyboard() {
  return (window.keyboard = window.keyboard || {});
}

/**
 * Reveal touch controls for accessibility.
 */
function showTouchControls(root) {
  root.setAttribute("aria-hidden", "false");
}

/**
 * Bind all touch buttons in the control area.
 */
function bindTouchButtons(root, kb) {
  const buttons = root.querySelectorAll("[data-key]");
  for (const btn of buttons) {
    bindTouchButton(btn, kb);
  }
}

/**
 * Bind a single touch button by key type.
 */
function bindTouchButton(btn, kb) {
  const key = btn.dataset.key;
  if (!key) return;
  if (key === "PAUSE") {
    bindPauseButton(btn);
    return;
  }
  bindActionButton(btn, kb, key);
}

/**
 * Bind pause button handlers with debounce logic.
 */
function bindPauseButton(btn) {
  const pauseState = { lastTrigger: 0 };
  const triggerPause = handlePauseTrigger.bind(null, btn, pauseState);
  const releasePause = handlePauseRelease.bind(null, btn);
  const globalTouchFallback = handlePauseGlobalFallback.bind(
    null,
    btn,
    triggerPause,
  );
  addPauseListeners(btn, triggerPause, releasePause, globalTouchFallback);
}

/**
 * Handle pause button activation.
 */
function handlePauseTrigger(btn, pauseState, e) {
  stopEvent(e);
  if (isPauseDebounced(pauseState)) return;
  triggerPauseAction();
  flashButtonActive(btn);
}

/**
 * Check and update the pause debounce timer.
 */
function isPauseDebounced(pauseState) {
  const now = Date.now();
  if (now - pauseState.lastTrigger < 400) return true;
  pauseState.lastTrigger = now;
  return false;
}

/**
 * Trigger the pause action via available UI hooks.
 */
function triggerPauseAction() {
  const pauseBtn = document.getElementById("btnPause");
  if (pauseBtn) return pauseBtn.click();
  if (typeof togglePauseUI === "function") return togglePauseUI();
  window.world?.pause?.();
}

/**
 * Flash the active state briefly for feedback.
 */
function flashButtonActive(btn) {
  btn.classList.add("active");
  window.setTimeout(() => btn.classList.remove("active"), 140);
}

/**
 * Handle pause button release state.
 */
function handlePauseRelease(btn, e) {
  stopEvent(e);
  btn.classList.remove("active");
}

/**
 * Handle document touch fallback for pause button.
 */
function handlePauseGlobalFallback(btn, triggerPause, e) {
  if (btn.contains(e.target)) return;
  const touch = getTouchFromEvent(e);
  if (!isTouchOnButton(btn, touch)) return;
  triggerPause(e);
}

/**
 * Extract the primary touch from an event.
 */
function getTouchFromEvent(e) {
  return e.changedTouches?.[0] || e.touches?.[0];
}

/**
 * Check if a touch event targets the given button.
 */
function isTouchOnButton(btn, touch) {
  if (!touch) return false;
  const rect = btn.getBoundingClientRect();
  return (
    touch.clientX >= rect.left &&
    touch.clientX <= rect.right &&
    touch.clientY >= rect.top &&
    touch.clientY <= rect.bottom
  );
}

/**
 * Register all pause button listeners.
 */
function addPauseListeners(
  btn,
  triggerPause,
  releasePause,
  globalTouchFallback,
) {
  btn.addEventListener("pointerdown", triggerPause);
  btn.addEventListener("pointerup", releasePause);
  btn.addEventListener("pointerleave", releasePause);
  btn.addEventListener("pointercancel", releasePause);
  btn.addEventListener("touchstart", triggerPause, { passive: false });
  btn.addEventListener("touchend", releasePause, { passive: false });
  btn.addEventListener("touchcancel", releasePause, { passive: false });
  btn.addEventListener("click", triggerPause);
  document.addEventListener("touchstart", globalTouchFallback, {
    passive: false,
    capture: true,
  });
  btn.addEventListener("contextmenu", handleBlockContextMenu);
}

/**
 * Bind a non-pause action button.
 */
function bindActionButton(btn, kb, key) {
  const press = handleActionPress.bind(null, kb, key, btn);
  const release = handleActionRelease.bind(null, kb, key, btn);
  addActionListeners(btn, press, release);
}

/**
 * Handle action button press state.
 */
function handleActionPress(kb, key, btn, e) {
  stopEvent(e);
  kb[key] = true;
  btn.classList.add("active");
}

/**
 * Handle action button release state.
 */
function handleActionRelease(kb, key, btn, e) {
  stopEvent(e);
  kb[key] = false;
  btn.classList.remove("active");
}

/**
 * Register listeners for action buttons.
 */
function addActionListeners(btn, press, release) {
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointerleave", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("contextmenu", handleBlockContextMenu);
}

/**
 * Prevent default context menu actions.
 */
function handleBlockContextMenu(e) {
  stopEvent(e);
}

/**
 * Bind reset handlers for window focus changes.
 */
function bindGlobalReset(kb) {
  addEventListener("blur", handleBlur.bind(null, kb));
  addEventListener("visibilitychange", handleVisibilityChange.bind(null, kb));
}

/**
 * Reset touch keys when the window loses focus.
 */
function handleBlur(kb) {
  resetTouchKeys(kb);
}

/**
 * Reset touch keys when the document is hidden.
 */
function handleVisibilityChange(kb) {
  if (document.hidden) resetTouchKeys(kb);
}

/**
 * Stop default touch and pointer handling.
 */
function stopEvent(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Reset all tracked touch keys and active buttons.
 */
function resetTouchKeys(kb) {
  for (const key of TOUCH_KEYS) {
    kb[key] = false;
  }
  const buttons = document.querySelectorAll("#touchControls .touch-btn.active");
  for (const btn of buttons) {
    btn.classList.remove("active");
  }
}

window.setupTouchControls = setupTouchControls;
