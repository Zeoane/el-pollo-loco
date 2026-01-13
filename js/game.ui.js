/**
 * Shows the How-To modal.
 */
function openHowTo() {
  document.getElementById("howtoModal")?.classList.remove("hidden");
}

/**
 * Hides the How-To modal.
 */
function closeHowTo() {
  document.getElementById("howtoModal")?.classList.add("hidden");
}

/**
 * Switches the language in the How-To modal.
 * @param {string} lang - 'de' or 'en'.
 */
function setHowToLang(lang) {
  const de = lang === "de";
  document.getElementById("howtoDECnt").hidden = !de;
  document.getElementById("howtoENCnt").hidden = de;
  document.getElementById("howtoDE")?.classList.toggle("active", de);
  document.getElementById("howtoEN")?.classList.toggle("active", !de);
}

/**
 * Sets up start screen event listeners.
 */
function setupStartScreen() {
  const scr = document.getElementById("startScreen");
  const btn = document.getElementById("btnStartGame");
  if (!scr || !btn) return;
  document.getElementById("btnEnableSound")?.addEventListener("click", enableSound);
  btn.addEventListener("click", () => startGame(scr));
  addEventListener("keydown", (e) => {
    if (!scr.classList.contains("hidden") && ["Enter", "Space"].includes(e.code)) {
      e.preventDefault();
      startGame(scr);
    }
  }, { capture: true });
}

/**
 * Transitions from start screen to game.
 * @param {HTMLElement} scr - Start screen element.
 */
function startGame(scr) {
  scr.classList.add("hidden");
  SFX.stop?.("menu");
  world?.pause?.(false);
}

/**
 * Wires How-To modal buttons.
 */
function wireHowTo() {
  const h = (id) => document.getElementById(id);
  h("btnHowTo")?.addEventListener("click", openHowTo);
  h("howtoClose")?.addEventListener("click", closeHowTo);
  h("howtoClose2")?.addEventListener("click", closeHowTo);
  h("howtoDE")?.addEventListener("click", () => setHowToLang("de"));
  h("howtoEN")?.addEventListener("click", () => setHowToLang("en"));
  addEventListener("keydown", (e) => e.code === "Escape" && closeHowTo());
  setHowToLang("de");
}

/**
 * Applies a background image to the BG div.
 * @param {string} url - Image path.
 */
function applyDivBackground(url) {
  const bg = document.getElementById("bg");
  if (!bg) return;
  bg.style.pointerEvents = "auto";
  const img = new Image();
  img.src = url;
  const apply = () => {
    bg.style.backgroundImage = `url("${url}")`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  };
  img.decode ? img.decode().then(apply).catch(apply) : (img.onload = apply);
}