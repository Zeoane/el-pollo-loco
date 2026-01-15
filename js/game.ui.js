/**
 * Inserts HTML into the DOM once by element id.
 * @param {string} id
 * @param {string} html
 */
function insertOnce(id, html) {
  if (document.getElementById(id)) return;
  document.body.insertAdjacentHTML("beforeend", html);
}

/**
 * Injects all UI templates into the DOM.
 */
function injectTemplates() {
  insertOnce("startScreen", window.startScreenTemplate());
  insertOnce("howtoModal", window.howtoModalTemplate());
  insertOnce("endScreen", window.endScreenTemplate());
}

function setupStartScreen() {
  const scr = document.getElementById("startScreen");
  const btn = document.getElementById("btnStartGame");
  if (!scr || !btn) return;

  startStartScreenLoop(); 

  btn.addEventListener("click", () => startGame(scr));
}

/**
 * Opens the How-To modal.
 */
function openHowTo() {
  document.getElementById("howtoModal")?.classList.remove("hidden");
}

/**
 * Handles opening the How-To modal.
 * @param {Event} e
 */
function handleHowToOpen(e) {
  e.preventDefault();
  window.startStartScreenLoop?.();
  openHowTo();
}

/**
 * Closes the How-To modal.
 */
function closeHowTo() {
  document.getElementById("howtoModal")?.classList.add("hidden");
}

/**
 * Switches language inside the How-To modal.
 * @param {string} lang
 */
function setHowToLang(lang) {
  const de = lang === "de";
  document.getElementById("howtoDECnt").hidden = !de;
  document.getElementById("howtoENCnt").hidden = de;
  document.getElementById("howtoDE")?.classList.toggle("active", de);
  document.getElementById("howtoEN")?.classList.toggle("active", !de);
}

/**
 * Wires all How-To related event listeners.
 */
function wireHowTo() {
  bindHowToOpeners();
  bindHowToClosers();
  bindHowToLanguage();
  setHowToLang("de");
}

/**
 * Binds buttons that open the How-To modal.
 */
function bindHowToOpeners() {
  document.getElementById("btnHowTo")
    ?.addEventListener("click", handleHowToOpen);

  document.getElementById("btnHowToFab")
    ?.addEventListener("click", handleHowToOpen);
}

/**
 * Handles opening the How-To modal.
 * @param {Event} e
 */
function handleHowToOpen(e) {
  e.preventDefault();
  e.stopPropagation();
  openHowTo();
}

/**
 * Binds buttons that close the How-To modal.
 */
let howToKeysBound = false;

function bindHowToClosers() {
  document.getElementById("howtoClose")?.addEventListener("click", closeHowTo);
  document.getElementById("howtoClose2")?.addEventListener("click", closeHowTo);
  if (howToKeysBound) return;
  addEventListener("keydown", handleHowToEscape);
  howToKeysBound = true;
}

/**
 * Closes modal on Escape key.
 * @param {KeyboardEvent} e
 */
function handleHowToEscape(e) {
  if (e.code === "Escape") closeHowTo();
}

/**
 * Binds language switch buttons.
 */
function bindHowToLanguage() {
  document.getElementById("howtoDE")
    ?.addEventListener("click", () => setHowToLang("de"));

  document.getElementById("howtoEN")
    ?.addEventListener("click", () => setHowToLang("en"));
}

/**
 * Starts the game and hides start screen.
 * @param {HTMLElement} scr
 */
function startGame(scr) {
  SFX.stop?.("start_screen");
  scr.classList.add("hidden");
  window.world?.pause?.(false);
}


/**
 * Initializes the game.
 */
window.init = function () {
  injectTemplates();
  const canvas = document.getElementById("canvas");
  window.world = new World(canvas, window.keyboard, createLevel1());
  window.world.pause?.(true);
  startHudRAF();
  setupStartScreen();
  wireHowTo();
};

/**
 * Applies a background image to the BG div.
 * @param {string} url - Image path.
 */
function applyDivBackground(url) {
  const bg = document.getElementById("bg");
  if (!bg) return;
  const img = new Image();
  img.src = url;
  const apply = () => {
    bg.style.backgroundImage = `url("${url}")`;
    bg.style.backgroundSize = "cover";
    bg.style.backgroundPosition = "center";
  };
img.decode ? img.decode().then(apply).catch(apply) : (img.onload = apply);
}