/**
 * Loads all game sounds and initial images.
 */
window.addEventListener("DOMContentLoaded", async () => {
  applyDivBackground("img/5_background/desert-landscape.jpg");
  SFX.unlockOnGesture();
  await SFX.loadAll({
    start_screen: "audio/sounds/start-screen.wav",
    coin: "audio/sounds/coin-ca-ching.mp3",
    bottle_pick: "audio/sounds/bottle-pickup.wav",
    bottle_throw: "audio/sounds/bottle-throw.wav",
    bottle_hit: "audio/sounds/bottle-hit.wav",
    jump: "audio/sounds/jumpbounce.wav",
    hit: "audio/sounds/punch.wav",
    chicken: "audio/sounds/chickens.wav",
    rooster: "audio/sounds/rooster1.wav",
    lost: "audio/sounds/sadwhisle.wav",
    win: "audio/sounds/groovy-winner.wav",
    heal_chimes: "audio/sounds/heal-chimes.wav",
  }).catch(() => {});
  initStaticImages();
  armStartScreenSound();
  armMenuMusic();
  wireToolbar();
});

/**
 * Starts the start-screen loop when the start screen is visible.
 */
function startStartScreenLoop() {
  const scr = document.getElementById("startScreen");
  if (!scr || scr.classList.contains("hidden")) return;
  SFX.setMuted?.(false);
  SFX.loop?.("start_screen", "start_screen", { vol: 0.25 });
}

window.startStartScreenLoop = startStartScreenLoop;

let startSoundArmed = false;

/**
 * Arms the start-screen sound to start on first user interaction.
 */
function armStartScreenSound() {
  if (startSoundArmed) return;
  startSoundArmed = true;
  addEventListener("pointerdown", onStartSoundGesture, true);
  addEventListener("keydown", onStartSoundGesture, true);
}

/**
 * Starts start-screen sound after a gesture not on the Start button.
 * @param {Event} e
 */
async function onStartSoundGesture(e) {
  if (e?.target?.closest?.("#btnStartGame")) return;
  try { await SFX.ctx?.resume?.(); } catch {}
  startStartScreenLoop();
  removeEventListener("pointerdown", onStartSoundGesture, true);
  removeEventListener("keydown", onStartSoundGesture, true);
}

let endSoundPlayed = false;
window.endSoundPlayed = false;

/**
 * Plays end sound once based on reason.
 * @param {string} reason
 */
function playEndSound(reason) {
  if (window.endSoundPlayed) return;
  window.endSoundPlayed = true;
  const isWin = reason === "win" || reason === "won_boss";
  SFX.play?.(isWin ? "win" : "lost", { vol: 0.8 });
}

window.playEndSound = playEndSound;

/**
 * Loads static game over images.
 */
function initStaticImages() {
  const loadImg = (path) => {
    const i = new Image();
    i.src = path;
    return i;
  };
  window.IMG_GAME_OVER = loadImg("img/You won, you lost/Game Over.png");
  window.IMG_LOST_BOSS = loadImg("img/You won, you lost/You lost.png");
  window.IMG_WON_BOSS = loadImg("img/You won, you lost/You won A.png");
}

/**
 * Arms music to start on first interaction.
 */
function armMenuMusic() {
  let armed = true;
  const tryStart = (e) => {
    const scr = document.getElementById("startScreen");
    if (
      !armed ||
      !scr ||
      scr.classList.contains("hidden") ||
      e.target.closest("#btnStartGame")
    )
      return;
    armed = false;
    SFX.loop("bg", "menu", { vol: 0.2 });
    window.removeEventListener("pointerdown", tryStart, true);
    window.removeEventListener("keydown", tryStart, true);
  };
  window.addEventListener("pointerdown", tryStart, true);
  window.addEventListener("keydown", tryStart, true);
}

/**
 * Initializes volume slider + label and loads saved values.
 */
function setupVolumeControls() {
  const slider = document.getElementById("volSlider");
  const pct = document.getElementById("volPct");

  const savedMuted = localStorage.getItem("audio.muted") === "1";
  const savedVol = clampInt(localStorage.getItem("audio.vol"), 60, 0, 100);

  SFX.setVolume?.(savedVol / 100);
  if (savedMuted) SFX.setMuted?.(true);

  if (slider) slider.value = String(savedVol);
  if (pct) pct.textContent = `${savedVol}%`;

  slider?.addEventListener("input", onVolumeInput);
  slider?.addEventListener("wheel", onVolumeWheel, { passive: false });

  updateMuteIcon();
}

/**
 * Handles slider input.
 * @param {Event} e
 */
function onVolumeInput(e) {
  const val = parseInt(e.target.value, 10) || 0;
  applyVolume(val);
}

/**
 * Handles mouse wheel on slider.
 * @param {WheelEvent} e
 */
function onVolumeWheel(e) {
  e.preventDefault();
  const slider = document.getElementById("volSlider");
  if (!slider) return;

  const cur = parseInt(slider.value, 10) || 0;
  const step = e.deltaY > 0 ? -2 : 2;
  applyVolume(cur + step);
}

/**
 * Parses and clamps integer values.
 * @param {string|null} raw
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInt(raw, fallback, min, max) {
  const n = parseInt(raw ?? "", 10);
  const v = Number.isFinite(n) ? n : fallback;
  return Math.max(min, Math.min(max, v));
}

/**
 * Wires Toolbar buttons and volume slider.
 */
function wireToolbar() {
  setupVolumeControls();
  document.getElementById("btnMute")?.addEventListener("click", toggleMute);
  document.getElementById("btnPause")?.addEventListener("click", togglePauseUI);
  document
    .getElementById("btnStop")
    ?.addEventListener("click", () => window.world?.stop?.());
  document.getElementById("btnRestart")?.addEventListener("click", restartGame);
  addEventListener("keydown", handleToolbarKeys);
}

/**
 * Handles toolbar keyboard shortcuts.
 */
function handleToolbarKeys(e) {
  if (e.code === "KeyM") toggleMute();
  if (e.code === "KeyP") window.world?.pause?.();
  if (e.code === "Escape") window.world?.stop?.();
  if (e.code === "KeyR") document.getElementById("btnRestart")?.click();
}

function togglePauseUI() {
  const w = window.world;
  if (!w) return;
  w.pause?.();
  updatePauseBtn();
}

function resetPauseBtn() {
  const btn = document.getElementById("btnPause");
  if (!btn) return;
  btn.textContent = "⏸";
  btn.setAttribute("aria-pressed", "false");
}

function updatePauseBtn() {
  const btn = document.getElementById("btnPause");
  const paused = !!window.world?.paused;
  if (!btn) return;
  btn.textContent = paused ? "▶" : "⏸";
  btn.setAttribute("aria-pressed", paused ? "true" : "false");
}

/**
 * Logic for restarting the world.
 */
function restartGame() {
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = "flex";
  SFX.stopAll?.();
  window.world?.dispose?.();

  const canvas = document.getElementById("canvas");
  window.world = new World(canvas, window.keyboard, createLevel1());

  startHudRAF();
  resetPauseBtn();
  checkOrientation?.();

  window.endSoundPlayed = false;
}

/**
 * Toggles mute state and saves to local storage.
 */
function toggleMute() {
  SFX.toggleMute?.();
  localStorage.setItem("audio.muted", SFX.muted ? "1" : "0");
  updateMuteIcon();
}

/**
 * Helper to update the mute button icon.
 */
function updateMuteIcon() {
  const btn = document.getElementById("btnMute");
  const v = SFX.vol ?? 1;
  let icon =
    SFX.muted || v <= 0 ? "🔇" : v <= 0.33 ? "🔈" : v <= 0.66 ? "🔉" : "🔊";
  if (btn) btn.textContent = icon;
}

/**
 * Sets volume and updates UI.
 * @param {number} val - Volume 0-100.
 */
function applyVolume(val) {
  const v = Math.max(0, Math.min(100, val)) / 100;
  SFX.setVolume?.(v);
  if (SFX.muted && v > 0) SFX.setMuted?.(false);
  localStorage.setItem("audio.vol", String(Math.round(v * 100)));
  updateVolumeUI();
}

/**
 * Updates slider and percentage text.
 */
function updateVolumeUI() {
  const val = Math.round((SFX.vol ?? 1) * 100);
  const slider = document.getElementById("volSlider");
  if (slider) slider.value = String(val);
  if (document.getElementById("volPct"))
    document.getElementById("volPct").textContent = val + "%";
  updateMuteIcon();
}
