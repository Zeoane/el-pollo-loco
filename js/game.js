// game.js
/* -----------------------
   Globals & Keyboard
----------------------- */
const KB = window.GameKeyboard ? new GameKeyboard() : {};
window.keyboard = KB;

const isGameKey = (code) =>
  code === "ArrowLeft" ||
  code === "ArrowRight" ||
  code === "ArrowUp" ||
  code === "ArrowDown" ||
  code === "Space" ||
  code === "KeyF" ||
  code === "KeyG" ||
  code === "KeyH";

addEventListener(
  "keydown",
  (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === "ArrowLeft") KB.LEFT = true;
    if (e.code === "ArrowRight") KB.RIGHT = true;
    if (e.code === "ArrowUp") KB.UP = true;
    if (e.code === "ArrowDown") KB.DOWN = true;
    if (e.code === "Space") KB.SPACE = true;
    if (e.code === "KeyF") KB.F = true;
    if (e.code === "KeyG") KB.G = true;
    if (e.code === "KeyH") KB.HEAL = true;
  },
  true
);

addEventListener(
  "keyup",
  (e) => {
    if (!isGameKey(e.code)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.code === "ArrowLeft") KB.LEFT = false;
    if (e.code === "ArrowRight") KB.RIGHT = false;
    if (e.code === "ArrowUp") KB.UP = false;
    if (e.code === "ArrowDown") KB.DOWN = false;
    if (e.code === "Space") KB.SPACE = false;
    if (e.code === "KeyF") KB.F = false;
    if (e.code === "KeyG") KB.G = false;
    if (e.code === "KeyH") KB.HEAL = false;
  },
  true
);

/* -----------------------
   Init (body onload)
----------------------- */
window.init = function () {
  console.log("[GAME] init() start");
  try {
    const canvas = document.getElementById("canvas");
    const level1 = createLevel1();
    window.world = new World(canvas, keyboard, level1);
    world.pause?.(true);
    startHudRAF();
    setupStartScreen();
    wireHowTo();
    console.log("[GAME] init() done");
  } catch (e) {
    console.error("[GAME] init() error:", e);
  }
};

/* -----------------------
   Audio + BG (DIV) + UI
----------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  applyDivBackground("img/5_background/desert-landscape.jpg");

  SFX.unlockOnGesture();
  await SFX.loadAll({
    coin: "audio/sounds/coin-ca-ching.mp3",
    bottle_pick: "audio/sounds/open-treasure-chest-8-bit.wav",
    bottle_throw: "audio/sounds/open_bottle_gas_1.wav",
    bottle_hit: "audio/sounds/bottle-hit-3.wav",
    jump: "audio/sounds/jump_extra-life-8-bit.wav",
    hit: "audio/sounds/punch.wav",
    chicken: "audio/sounds/chickens_wind_bird.wav",
    rooster: "audio/sounds/rooster1.wav",
  });

  armMenuMusic();
  wireToolbar();
});

function armMenuMusic() {
  let armed = true;

  const tryStart = (e) => {
    if (!armed) return;
    const scr = document.getElementById("startScreen");
    if (!scr || scr.classList.contains("hidden")) return;
    if (e?.target?.closest?.("#btnStartGame")) return;
    armed = false;
    SFX.loop("bg", "menu", { vol: 0.2 });

    window.removeEventListener("pointerdown", tryStart, true);
    window.removeEventListener("keydown", tryStart, true);
  };

  window.addEventListener("pointerdown", tryStart, true);
  window.addEventListener("keydown", tryStart, true);
}

/* -----------------------
   Toolbar (Mute/Pause/Stop/Restart)
----------------------- */
function wireToolbar() {
  const btnMute = document.getElementById("btnMute");
  const btnPause = document.getElementById("btnPause");
  const btnStop = document.getElementById("btnStop");
  const btnRestart = document.getElementById("btnRestart");
  const volSlider = document.getElementById("volSlider");
  const volPct = document.getElementById("volPct");

  const updateMuteIcon = () => {
    let icon = "🔊";
    const v = SFX.vol ?? 1;
    if (SFX.muted || v <= 0) icon = "🔇";
    else if (v <= 0.33) icon = "🔈";
    else if (v <= 0.66) icon = "🔉";
    if (btnMute) {
      btnMute.textContent = icon;
      btnMute.setAttribute("aria-pressed", SFX.muted ? "true" : "false");
      btnMute.title = (SFX.muted ? "Unmute" : "Mute") + " (M)";
    }
  };

  const setSliderFromVol = () => {
    const val = Math.round((SFX.vol ?? 1) * 100);
    if (volSlider) volSlider.value = String(val);
    if (volPct) volPct.textContent = val + "%";
  };

  const applyVolume = (val) => {
    const v = Math.max(0, Math.min(100, val)) / 100;
    SFX.setVolume?.(v);
    if (SFX.muted && v > 0) SFX.setMuted?.(false);
    localStorage.setItem("audio.vol", String(Math.round(v * 100)));
    setSliderFromVol();
    updateMuteIcon();
  };

  const toggleMute = () => {
    SFX.toggleMute?.();
    localStorage.setItem("audio.muted", SFX.muted ? "1" : "0");
    updateMuteIcon();
  };

  const savedMuted = localStorage.getItem("audio.muted") === "1";
  const savedVol = Math.max(
    0,
    Math.min(100, parseInt(localStorage.getItem("audio.vol") || "60", 10))
  );

  SFX.setVolume?.(savedVol / 100);
  if (savedMuted) SFX.setMuted(true);

  setSliderFromVol();
  updateMuteIcon();

  btnMute?.addEventListener("click", toggleMute);

  volSlider?.addEventListener("input", (e) => {
    applyVolume(parseInt(e.target.value, 10) || 0);
  });

  volSlider?.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const step = e.deltaY > 0 ? -2 : 2;
      const next = Math.max(
        0,
        Math.min(100, (parseInt(volSlider.value, 10) || 0) + step)
      );
      applyVolume(next);
    },
    { passive: false }
  );

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

  addEventListener("keydown", (e) => {
    if (e.code === "KeyM") {
      toggleMute();
      return;
    }
    if (e.code === "KeyP") world?.pause?.();
    if (e.code === "Escape") world?.stop?.();
    if (e.code === "KeyR") btnRestart?.click();
  });
}

function openHowTo() {
  document.getElementById("howtoModal")?.classList.remove("hidden");
}

function closeHowTo() {
  document.getElementById("howtoModal")?.classList.add("hidden");
}

function setHowToLang(lang) {
  const de = lang === "de";
  document.getElementById("howtoDECnt").hidden = !de;
  document.getElementById("howtoENCnt").hidden = de;
  document.getElementById("howtoDE")?.classList.toggle("active", de);
  document.getElementById("howtoEN")?.classList.toggle("active", !de);
}

async function enableSound() {
  try {
    await SFX.ctx?.resume?.();
  } catch {}
  SFX.setMuted(false);
  SFX.setVolume(0.2);
  SFX.loop("bg", "menu", { vol: 0.2 });
}

function setupStartScreen() {
  const scr = document.getElementById("startScreen");
  const btn = document.getElementById("btnStartGame");
  if (!scr || !btn) return;
  const btnEnable = document.getElementById("btnEnableSound");
  btnEnable?.addEventListener("click", enableSound);

  const startGame = () => {
    scr.classList.add("hidden");
    SFX.stop?.("menu");
    world?.pause?.(false);
  };

  btn.addEventListener("click", startGame);
  addEventListener(
    "keydown", (e) => {
      if (scr.classList.contains("hidden")) return;
      if (e.code === "Enter" || e.code === "Space") {
        e.preventDefault();
        startGame();
      }
    },
    { capture: true }
  );
}

function wireHowTo() {
  const h = (id) => document.getElementById(id);
  h("btnHowTo")?.addEventListener("click", openHowTo);
  h("howtoClose")?.addEventListener("click", closeHowTo);
  h("howtoClose2")?.addEventListener("click", closeHowTo);
  h("howtoDE")?.addEventListener("click", () => setHowToLang("de"));
  h("howtoEN")?.addEventListener("click", () => setHowToLang("en"));
  addEventListener("keydown", (e) => {
    if (e.code === "Escape") closeHowTo();
  });
  setHowToLang("de");
}

/* -----------------------
   DIV Background helper
----------------------- */
function applyDivBackground(url) {
  const bg = document.getElementById("bg");
  if (!bg) return;

  if (getComputedStyle(bg).pointerEvents === "none") {
    bg.style.pointerEvents = "auto";
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
  const v = Math.max(0, Math.min(100, pct | 0));
  el.style.setProperty("--p", `${v}%`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function syncDomHud() {
  const w = window.world;
  if (!w) return;
  const inv = w.inventory || {};
  const cfg = w.cfg || {};
  const hpPct = Math.max(0, Math.min(100, w.character?.hpPercent?.() ?? 100));

  const coinPct = ((inv.coins || 0) / (cfg.items?.coins || 10)) * 100;
  const bottlePct = ((inv.bottles || 0) / (cfg.items?.bottles || 5)) * 100;

  setFill("health", hpPct);
  setFill("coin", coinPct);
  setFill("bottle", bottlePct);

  setText("lbl-health", `${Math.round(hpPct)}%`);
  setText("lbl-coin", `×${inv.coins || 0}`);
  setText("lbl-bottle", `×${inv.bottles || 0}`);
}

function startHudRAF() {
  cancelAnimationFrame(_hudRAF);
  const loop = () => {
    syncDomHud();
    _hudRAF = requestAnimationFrame(loop);
  };
  loop();
}
