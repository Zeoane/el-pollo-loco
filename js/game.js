// game.js
console.log("[GAME] game.js loaded");

// --- Globals ---
window.keyboard = new GameKeyboard();
window.world = null;

// --- Init for <body onload="init()"> ---
window.init = function () {
  console.log("[GAME] init() start");
  try {
    const canvas = document.getElementById("canvas");
    const level1 = createLevel1();
    window.world = new World(canvas, keyboard, level1);
    console.log("[GAME] init() done");
  } catch (e) {
    console.error("[GAME] init() error:", e);
  }
};

window.USERKEY = true;
try {
  localStorage.setItem("loggedInUserKey", "dev");
} catch {}

const isGameKey = (code) =>
  code === "ArrowLeft" ||
  code === "ArrowRight" ||
  code === "ArrowUp" ||
  code === "ArrowDown" ||
  code === "Space" ||
  code === "KeyF";

window.addEventListener(
  "keydown",
  (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === "ArrowLeft") keyboard.LEFT = true;
    if (e.code === "ArrowRight") keyboard.RIGHT = true;
    if (e.code === "ArrowUp") keyboard.UP = true;
    if (e.code === "ArrowDown") keyboard.DOWN = true;
    if (e.code === "Space") keyboard.SPACE = true;
    if (e.code === "KeyF") keyboard.F = true;
  },
  true
);

window.addEventListener(
  "keyup",
  (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === "ArrowLeft") keyboard.LEFT = false;
    if (e.code === "ArrowRight") keyboard.RIGHT = false;
    if (e.code === "ArrowUp") keyboard.UP = false;
    if (e.code === "ArrowDown") keyboard.DOWN = false;
    if (e.code === "Space") keyboard.SPACE = false;
    if (e.code === "KeyF") keyboard.F = false;
  },
  true
);

// --- Audio + BG-Canvas + Mute-UI ---
window.addEventListener("DOMContentLoaded", async () => {
  SFX.unlockOnGesture();

  await SFX.loadAll({
    bg: "audio/sounds/carnival-game-theme-loop.wav",
    coin: "audio/sounds/coin-ca-ching.mp3",
    bottle_pick: "audio/sounds/open-treasure-chest-8-bit.wav",
    bottle_throw: "audio/sounds/open_bottle_gas_1.wav",
    bottle_hit: "audio/sounds/bottle-hit-3.wav",
    jump: "audio/sounds/jump_extra-life-8-bit.wav",
    hit: "audio/sounds/death-song-8-bit.wav",
    chicken: "audio/sounds/chickens.wav",
    rooster: "audio/sounds/rooster1.wav",
  });

  // Musik erst nach User-Input starten (Key oder Pointer)
  const startBg = () => {
    SFX.loop("bg", "bg", { vol: 0.15 });
    window.removeEventListener("keydown", startBg);
    window.removeEventListener("pointerdown", startBg);
  };
  window.addEventListener("keydown", startBg);
  window.addEventListener("pointerdown", startBg);

  // --- Mute-Button ---
  const btn = document.getElementById("btnMute");
  const setMuteUI = (muted) => {
    if (!btn) return;
    btn.textContent = muted ? "🔇" : "🔊";
    btn.setAttribute("aria-pressed", muted ? "true" : "false");
    btn.title = (muted ? "Unmute" : "Mute") + " (M)";
  };
  const toggleMute = () => {
    SFX.toggleMute?.();
    localStorage.setItem("audio.muted", SFX.muted ? "1" : "0");
    setMuteUI(SFX.muted);
  };
  btn?.addEventListener("click", toggleMute);

  const savedMuted = localStorage.getItem("audio.muted") === "1";
  if (savedMuted) SFX.setMuted(true);
  setMuteUI(savedMuted);

const $ = (id)=>document.getElementById(id);
const btnPause   = $('btnPause');
const btnStop    = $('btnStop');
const btnRestart = $('btnRestart');

btnPause?.addEventListener('click', ()=> world?.pause());
btnStop?.addEventListener('click',  ()=> world?.stop());
btnRestart?.addEventListener('click', ()=>{
  world?.dispose?.();
  const canvas = document.getElementById('canvas');
  const level1 = createLevel1();
  world = new World(canvas, keyboard, level1);
});

// Tastenkürzel: P=Pause, Esc=Stop, R=Restart
window.addEventListener('keydown', (e)=>{
  if (e.code==='KeyP') world?.pause();
  if (e.code==='Escape') world?.stop();
  if (e.code==='KeyR') { 
    world?.dispose?.();
    const canvas = document.getElementById('canvas');
    const level1 = createLevel1();
    world = new World(canvas, keyboard, level1);
  }
});

  // --- Vollflächiger Hintergrund (DPR-scharf) ---
  const drawBg = () => {
    const c = document.getElementById("bg");
    if (!c) return;
    const r = window.devicePixelRatio || 1;
    const w = window.innerWidth,
      h = window.innerHeight;
    c.width = Math.floor(w * r);
    c.height = Math.floor(h * r);
    c.style.width = w + "px";
    c.style.height = h + "px";
    const g = c.getContext("2d");
    g.setTransform(r, 0, 0, r, 0, 0);
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h); // später Bild/Gradient
  };
  drawBg();
  window.addEventListener("resize", drawBg);
});
