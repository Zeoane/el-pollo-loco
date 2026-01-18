// js/game.touch-controls.js
const TOUCH_KEYS = ["LEFT", "RIGHT", "UP", "F", "HEAL"];

function setupTouchControls() {
  const root = document.getElementById("touchControls");
  if (!root) return;

  const kb = (window.keyboard = window.keyboard || {});
  root.setAttribute("aria-hidden", "false");

  root.querySelectorAll("[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;

    const press = (e) => {
      e.preventDefault();
      e.stopPropagation();
      kb[key] = true;
      btn.classList.add("active");
    };

    const release = (e) => {
      e.preventDefault();
      e.stopPropagation();
      kb[key] = false;
      btn.classList.remove("active");
    };

    const blockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
    btn.addEventListener("contextmenu", blockContextMenu);
  });

  addEventListener("blur", () => resetTouchKeys(kb));
  addEventListener("visibilitychange", () => {
    if (document.hidden) resetTouchKeys(kb);
  });
}

function resetTouchKeys(kb) {
  TOUCH_KEYS.forEach((k) => (kb[k] = false));
  document
    .querySelectorAll("#touchControls .touch-btn.active")
    .forEach((b) => b.classList.remove("active"));
}

window.setupTouchControls = setupTouchControls;
