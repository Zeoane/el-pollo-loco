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

    if (key === "PAUSE") {
      const pressPause = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pauseBtn = document.getElementById("btnPause");
        if (pauseBtn) {
          pauseBtn.click();
        } else if (typeof togglePauseUI === "function") {
          togglePauseUI();
        } else {
          window.world?.pause?.();
        }
        btn.classList.add("active");
      };

      const releasePause = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove("active");
      };

      const blockContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };

      btn.addEventListener("pointerdown", pressPause);
      btn.addEventListener("pointerup", releasePause);
      btn.addEventListener("pointerleave", releasePause);
      btn.addEventListener("pointercancel", releasePause);
      btn.addEventListener("contextmenu", blockContextMenu);
      return;
    }

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
