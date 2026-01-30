const ESSENTIAL_IMAGE_PATHS = [
  "img/5_background/desert-landscape.jpg",
  "img/5_background/layers/air.png",
  "img/5_background/layers/4_clouds/1.png",
  "img/5_background/layers/4_clouds/2.png",
  "img/5_background/layers/4_clouds/full.png",
  "img/5_background/layers/3_third_layer/1.png",
  "img/5_background/layers/3_third_layer/2.png",
  "img/5_background/layers/3_third_layer/full.png",
  "img/5_background/layers/2_second_layer/1.png",
  "img/5_background/layers/2_second_layer/2.png",
  "img/5_background/layers/2_second_layer/full.png",
  "img/5_background/layers/1_first_layer/1.png",
  "img/5_background/layers/1_first_layer/2.png",
  "img/5_background/layers/1_first_layer/full.png",
  "img/2_character_pepe/1_idle/idle/I-1.png",
  "img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png",
  "img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png",
  "img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png",
  "img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png",
  "img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png",
];

let essentialAssetsPromise = null;

/**
 * Preloads images and resolves when they are decoded or loaded.
 * @param {string[]} paths
 * @returns {Promise<void>}
 */
function preloadImages(paths = []) {
  const unique = [...new Set(paths.filter(Boolean))];
  const load = (path) =>
    new Promise((resolve) => {
      const img = new Image();
      let settled = false;
      const done = () => (settled ? undefined : ((settled = true), resolve()));
      img.onload = done;
      img.onerror = done;
      img.src = path;
      img.decode?.().then(done).catch(done);
    });
  return Promise.all(unique.map(load)).then(() => {});
}

/**
 * Ensures essential images are preloaded once.
 * @returns {Promise<void>}
 */
function ensureEssentialAssets() {
  if (!essentialAssetsPromise) {
    essentialAssetsPromise = preloadImages(ESSENTIAL_IMAGE_PATHS);
  }
  return essentialAssetsPromise;
}

window.ensureEssentialAssets = ensureEssentialAssets;

/**
 * Loads all game sounds and initial images.
 */
window.addEventListener("DOMContentLoaded", async () => {
  applyDivBackground("img/5_background/desert-landscape.jpg");
  ensureEssentialAssets();
  SFX.unlockOnGesture();
  await SFX.loadAll({
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
    snoring: "audio/sounds/snoring.wav",
  }).catch(handleAudioLoadError);
  initStaticImages();
  armMenuMusic();
  wireToolbar();
});

window.endSoundPlayed = false;

const END_REASON_WIN = "win";
const END_REASON_WON_BOSS = "won_boss";

/**
 * Plays end sound once based on reason.
 * @param {string} reason
 */
function playEndSound(reason) {
  if (window.endSoundPlayed) return;
  window.endSoundPlayed = true;
  const isWin = reason === END_REASON_WIN || reason === END_REASON_WON_BOSS;
  SFX.play?.(isWin ? "win" : "lost", { vol: 0.8 });
}

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
 * Checks whether menu music may start.
 * @param {Event} e
 * @param {HTMLElement|null} scr
 * @param {boolean} armed
 * @returns {boolean}
 */
function canStartMenuMusic(e, scr, armed) {
  return (
    armed &&
    scr &&
    !scr.classList.contains("hidden") &&
    !e.target.closest("#btnStartGame")
  );
}

/**
 * Arms music to start on first interaction.
 */
function armMenuMusic() {
  let armed = true;

  const tryStart = (e) => {
    const scr = document.getElementById("startScreen");
    if (!canStartMenuMusic(e, scr, armed)) return;

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
 * Handles audio loading errors gracefully without console output.
 */
function handleAudioLoadError() {
  SFX.setMuted?.(true);
  localStorage.setItem("audio.muted", "1");
  updateMuteIcon?.();
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
 * Handles mouse wheel on volume slider only.
 * @param {WheelEvent} e
 */
function onVolumeWheel(e) {
  const slider =
    e.target === document.getElementById("volSlider") ? e.target : null;
  if (!slider) return;

  e.preventDefault();
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

let toolbarKeysBound = false;

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
  window.wireFullscreen?.();
  if (!toolbarKeysBound) {
    addEventListener("keydown", handleToolbarKeys);
    toolbarKeysBound = true;
  }
}

/**
 * Handles toolbar keyboard shortcuts.
 * @param {KeyboardEvent} e
 */
function handleToolbarKeys(e) {
  if (isUiBlockingInput()) return;

  if (e.code === "KeyM") toggleMute();
  if (e.code === "KeyP") window.world?.pause?.();
  if (e.code === "Escape") window.world?.stop?.();
  if (e.code === "KeyR") document.getElementById("btnRestart")?.click();
}

/**
 * Returns true if UI overlays should block game shortcuts.
 * @returns {boolean}
 */
function isUiBlockingInput() {
  return (
    document.getElementById("howtoModal")?.classList.contains("hidden") ===
      false ||
    document.getElementById("startScreen")?.classList.contains("hidden") ===
      false ||
    document.getElementById("endScreen")?.classList.contains("hidden") === false
  );
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
 * Restarts the game world without reloading the page.
 */
async function restartGame() {
  window.hideEndControls?.();
  showHud();
  stopAllAudio();
  disposeWorld();
  const assetsReady = window.ensureEssentialAssets?.();
  await assetsReady;
  recreateWorld();
  window.adjustCanvasForFullscreen?.();
  window.world?.pause?.(false);
  rearmHudAndUi();
  window.endSoundPlayed = false;
}

/**
 * Ensures the HUD is visible.
 */
function showHud() {
  const hud = document.getElementById("hud");
  if (hud) hud.style.display = "flex";
}

/**
 * Stops all currently playing sounds.
 */
function stopAllAudio() {
  SFX.stopAll?.();
}

/**
 * Disposes the current world instance if present.
 */
function disposeWorld() {
  window.world?.dispose?.();
}

/**
 * Creates a fresh world instance and stores it globally.
 */
function recreateWorld() {
  const canvas = document.getElementById("canvas");
  window.world = new World(canvas, window.keyboard, createLevel1());
}

/**
 * Restarts HUD updates and resets UI state after restart.
 */
function rearmHudAndUi() {
  startHudRAF();
  resetPauseBtn();
  checkOrientation?.();
}

/**
 * Toggles mute state and saves to local storage.
 */
function toggleMute() {
  SFX.toggleMute?.();
  if (SFX.muted) SFX.stopAll?.();
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
  const pct = document.getElementById("volPct");

  if (slider) slider.value = String(val);
  if (pct) pct.textContent = `${val}%`;

  updateMuteIcon();
}

window.playEndSound = playEndSound;
