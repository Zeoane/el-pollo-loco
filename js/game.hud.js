/**
 * Global HUD Loop reference.
 */
let _hudRAF = 0;

/**
 * Sets the fill level of a HUD bar.
 * @param {string} kind - The data-kind attribute.
 * @param {number} pct - Percentage 0-100.
 */
function setFill(kind, pct) {
  const el = document.querySelector(`.hud-row[data-kind="${kind}"] .fill`);
  if (!el) return;
  el.style.setProperty("--p", `${Math.max(0, Math.min(100, pct | 0))}%`);
}

/**
 * Sets text content for an ID.
 * @param {string} id - Element ID.
 * @param {string} text - Text content.
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * Syncs the DOM elements with current world data.
 */
function syncDomHud() {
  const w = window.world;
  if (!w) return;
  const inv = w.inventory || {};
  const cfg = w.cfg || {};
  const hpPct = Math.max(0, w.character?.hpPercent?.() ?? 100);
  updateBars(hpPct, inv, cfg);
}

/**
 * Updates specific HUD bars and labels.
 */
function updateBars(hpPct, inv, cfg) {
  setFill("health", hpPct);
  setFill("coin", ((inv.coins || 0) / (cfg.items?.coins || 10)) * 100);
  setFill("bottle", ((inv.bottles || 0) / (cfg.items?.bottles || 5)) * 100);
  setText("lbl-health", `${Math.round(hpPct)}%`);
  setText("lbl-coin", `×${inv.coins || 0}`);
  setText("lbl-bottle", `×${inv.bottles || 0}`);
}

/**
 * Starts the RequestAnimationFrame loop for HUD sync.
 */
function startHudRAF() {
  cancelAnimationFrame(_hudRAF);
  const loop = () => {
    syncDomHud();
    _hudRAF = requestAnimationFrame(loop);
  };
  loop();
}
