// js/game.touch-controls.js
const TOUCH_KEYS = ["LEFT", "RIGHT", "UP", "F", "HEAL"];

function setupTouchControls() {
  const root = document.getElementById("touchControls");
  if (!root) return;
  if (root.dataset.bound === "true") return;
  root.dataset.bound = "true";

  const kb = (window.keyboard = window.keyboard || {});
  root.setAttribute("aria-hidden", "false");

  root.querySelectorAll("[data-key]").forEach((btn) => {
    const key = btn.dataset.key;
    if (!key) return;

    if (key === "PAUSE") {
      let lastPauseTrigger = 0;

      const triggerPause = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastPauseTrigger < 400) return;
        lastPauseTrigger = now;

        const pauseBtn = document.getElementById("btnPause");
        if (pauseBtn) {
          pauseBtn.click();
        } else if (typeof togglePauseUI === "function") {
          togglePauseUI();
        } else {
          window.world?.pause?.();
        }

        btn.classList.add("active");
        window.setTimeout(() => btn.classList.remove("active"), 140);
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

      const isTouchOnPause = (touch) => {
        if (!touch) return false;
        const rect = btn.getBoundingClientRect();
        return (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        );
      };

      const globalTouchFallback = (e) => {
        if (btn.contains(e.target)) return;
        const touch = e.changedTouches?.[0] || e.touches?.[0];
        if (!isTouchOnPause(touch)) return;
        triggerPause(e);
      };

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
