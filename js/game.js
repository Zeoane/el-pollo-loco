// game.js
console.log("[GAME] game.js loaded");

/* -----------------------
   Globals & Keyboard
----------------------- */
const KB = (window.GameKeyboard ? new GameKeyboard() : {});
window.keyboard = KB;
window.world = null;

const isGameKey = (code) =>
  code === "ArrowLeft" || code === "ArrowRight" ||
  code === "ArrowUp"   || code === "ArrowDown" ||
  code === "Space"     || code === "KeyF";

addEventListener("keydown", (e) => {
  if (!isGameKey(e.code)) return;
  e.preventDefault(); e.stopPropagation();
  if (e.code === "ArrowLeft")  KB.LEFT  = true;
  if (e.code === "ArrowRight") KB.RIGHT = true;
  if (e.code === "ArrowUp")    KB.UP    = true;
  if (e.code === "ArrowDown")  KB.DOWN  = true;
  if (e.code === "Space")      KB.SPACE = true;
  if (e.code === "KeyF")       KB.F     = true;
}, true);

addEventListener("keyup", (e) => {
  if (!isGameKey(e.code)) return;
  e.preventDefault(); e.stopPropagation();
  if (e.code === "ArrowLeft")  KB.LEFT  = false;
  if (e.code === "ArrowRight") KB.RIGHT = false;
  if (e.code === "ArrowUp")    KB.UP    = false;
  if (e.code === "ArrowDown")  KB.DOWN  = false;
  if (e.code === "Space")      KB.SPACE = false;
  if (e.code === "KeyF")       KB.F     = false;
}, true);

/* -----------------------
   Init (body onload)
----------------------- */
window.init = function () {
  console.log("[GAME] init() start");
  try {
    const canvas = document.getElementById("canvas");
    const level1 = createLevel1();
    window.world = new World(canvas, keyboard, level1);

    startHudRAF();

    console.log("[GAME] init() done");
  } catch (e) {
    console.error("[GAME] init() error:", e);
  }
};

/* -----------------------
   Audio + BG (DIV) + UI
----------------------- */
window.addEventListener("DOMContentLoaded", async () => {

  applyDivBackground('img/5_background/desert-landscape.jpg');

  // Audio vorbereiten
  SFX.unlockOnGesture();
  await SFX.loadAll({
    bg:           "audio/sounds/carnival-game-theme-loop.wav",
    coin:         "audio/sounds/coin-ca-ching.mp3",
    bottle_pick:  "audio/sounds/open-treasure-chest-8-bit.wav",
    bottle_throw: "audio/sounds/open_bottle_gas_1.wav",
    bottle_hit:   "audio/sounds/bottle-hit-3.wav",
    jump:         "audio/sounds/jump_extra-life-8-bit.wav",
    hit:          "audio/sounds/death-song-8-bit.wav",
    chicken:      "audio/sounds/chickens.wav",
    rooster:      "audio/sounds/rooster1.wav",
  });

  // Musik erst nach User-Input
  const startBg = () => {
    SFX.loop("bg", "bg", { vol: 0.15 });
    removeEventListener("keydown", startBg);
    removeEventListener("pointerdown", startBg);
  };
  addEventListener("keydown", startBg);
  addEventListener("pointerdown", startBg);

  wireToolbar();
});

/* -----------------------
   Toolbar (Mute/Pause/Stop/Restart)
----------------------- */
function wireToolbar() {
  const btnMute    = document.getElementById("btnMute");
  const btnPause   = document.getElementById("btnPause");
  const btnStop    = document.getElementById("btnStop");
  const btnRestart = document.getElementById("btnRestart");

  const setMuteUI = (muted) => {
    if (!btnMute) return;
    btnMute.textContent = muted ? "🔇" : "🔊";
    btnMute.setAttribute("aria-pressed", muted ? "true" : "false");
    btnMute.title = (muted ? "Unmute" : "Mute") + " (M)";
  };

  const toggleMute = () => {
    SFX.toggleMute?.();
    localStorage.setItem("audio.muted", SFX.muted ? "1" : "0");
    setMuteUI(SFX.muted);
  };

  // Restore mute state
  const savedMuted = localStorage.getItem("audio.muted") === "1";
  if (savedMuted) SFX.setMuted(true);
  setMuteUI(savedMuted);

  btnMute?.addEventListener("click", toggleMute);

  // Pause/Stop/Restart – nutzt world-Methoden
  btnPause?.addEventListener("click", () => {
    if (!world) return;
    world.pause?.(); 
    const paused = !!world.paused;
    btnPause.textContent = paused ? "▶" : "⏸";
    btnPause.setAttribute("aria-pressed", paused ? "true" : "false");
  });

  btnStop?.addEventListener("click", () => world?.stop?.());

  btnRestart?.addEventListener("click", () => {
    world?.dispose?.();
    const canvas = document.getElementById("canvas");
    const level1 = createLevel1();
    world = new World(canvas, keyboard, level1);
    startHudRAF(); 
    if (btnPause) {
      btnPause.textContent = "⏸";
      btnPause.setAttribute("aria-pressed", "false");
    }
  });

  // Shortcuts: M / P / Esc / R
  addEventListener("keydown", (e) => {
    if (e.code === "KeyM") { toggleMute(); return; }
    if (e.code === "KeyP") world?.pause?.();
    if (e.code === "Escape") world?.stop?.();
    if (e.code === "KeyR") btnRestart?.click();
  });
}

/* -----------------------
   DIV Background helper
----------------------- */
function applyDivBackground(url) {
  const bg = document.getElementById("bg");
  if (!bg) return;

  if (getComputedStyle(bg).pointerEvents === 'none') {
    bg.style.pointerEvents = 'auto';
  }

  const img = new Image();
  img.src = url;

  const apply = () => {
    bg.style.backgroundImage = `url("${url}")`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
    bg.style.backgroundRepeat = "no-repeat";
  };

  if (img.decode) {
    img.decode().then(apply).catch(apply);
  } else {
    img.onload = apply;
    img.onerror = apply;
  }
}

/* -----------------------
   DOM-HUD Sync Loop
----------------------- */
let _hudRAF = 0;

function setFill(kind, pct) {
  const el = document.querySelector(`.hud-row[data-kind="${kind}"] .fill`);
  if (!el) return;
  const v = Math.max(0, Math.min(100, pct|0));
  el.style.setProperty('--p', `${v}%`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function syncDomHud() {
  const w = window.world; if (!w) return;
  const inv = w.inventory || {};
  const cfg = w.cfg || {};
  const hpPct = Math.max(0, Math.min(100, w.character?.hpPercent?.() ?? 100));

  const coinPct   = ((inv.coins   || 0) / ((cfg.items?.coins)   || 10)) * 100;
  const bottlePct = ((inv.bottles || 0) / ((cfg.items?.bottles) || 5 )) * 100;

  setFill('health',  hpPct);
  setFill('coin',    coinPct);
  setFill('bottle',  bottlePct);

  setText('lbl-health', `${Math.round(hpPct)}%`);
  setText('lbl-coin',   `×${inv.coins||0}`);
  setText('lbl-bottle', `×${inv.bottles||0}`);
}

function startHudRAF() {
  cancelAnimationFrame(_hudRAF);
  const loop = () => { syncDomHud(); _hudRAF = requestAnimationFrame(loop); };
  loop();
}


