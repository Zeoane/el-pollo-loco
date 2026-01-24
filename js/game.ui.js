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
 * Toggles a body class while the start screen is visible.
 * @param {boolean} active
 */
function setStartScreenActive(active) {
  document.body?.classList.toggle("startscreen-active", active);
}

/**
 * Syncs the body class with the current start screen visibility.
 */
function syncStartScreenState() {
  const scr = document.getElementById("startScreen");
  if (!scr) return;
  setStartScreenActive(!scr.classList.contains("hidden"));
}

/**
 * Injects all UI templates into the DOM once.
 */
function injectTemplates() {
  if (!window.startScreenTemplate) return;
  if (!window.howtoModalTemplate) return;
  if (!window.impressumModalTemplate) return;
  if (!window.endScreenTemplate) return;

  insertOnce("startScreen", window.startScreenTemplate());
  insertOnce("howtoModal", window.howtoModalTemplate());
  insertOnce("impressumModal", window.impressumModalTemplate());
  insertOnce("endScreen", window.endScreenTemplate());
  if (window.touchControlsTemplate) {
    insertOnce("touchControls", window.touchControlsTemplate());
  }
  syncStartScreenState();
}

/**
 * Opens the How-To modal.
 */
function openHowTo() {
  document.getElementById("howtoModal")?.classList.remove("hidden");
}

/**
 * Closes the How-To modal.
 */
function closeHowTo() {
  document.getElementById("howtoModal")?.classList.add("hidden");
}

/**
 * Closes the How-To modal when clicking the backdrop.
 * @param {MouseEvent} e
 */
function closeHowToOnBackdrop(e) {
  if (e.target?.id === "howtoModal") closeHowTo();
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
 * Switches language inside the How-To modal.
 * @param {"de"|"en"} lang
 */
function setHowToLang(lang) {
  const isDE = lang === "de";
  document.getElementById("howtoDECnt").hidden = !isDE;
  document.getElementById("howtoENCnt").hidden = isDE;
  document.getElementById("howtoDE")?.classList.toggle("active", isDE);
  document.getElementById("howtoEN")?.classList.toggle("active", !isDE);
  try {
    localStorage.setItem("howto.lang", isDE ? "de" : "en");
  } catch (e) {}
}

/**
 * Adds a click listener to an element if it exists.
 * @param {string} id
 * @param {Function} handler
 */
function onClick(id, handler) {
  document.getElementById(id)?.addEventListener("click", handler);
}

/**
 * Binds buttons that open the How-To modal.
 */
function bindHowToOpeners() {
  onClick("btnHowTo", handleHowToOpen);
  onClick("btnHowToFab", handleHowToOpen);
}

let howToKeysBound = false;

/**
 * Closes modal on Escape key.
 * @param {KeyboardEvent} e
 */
function handleHowToEscape(e) {
  if (e.code === "Escape") closeHowTo();
}

/**
 * Binds buttons that close the How-To modal and Escape listener once.
 */
function bindHowToClosers() {
  if (howToKeysBound) return;

  onClick("howtoClose", closeHowTo);
  onClick("howtoClose2", closeHowTo);
  onClick("howtoModal", closeHowToOnBackdrop);

  addEventListener("keydown", handleHowToEscape);
  howToKeysBound = true;
}

function bindHowToLanguage() {
  onClick("howtoDE", () => setHowToLang("de"));
  onClick("howtoEN", () => setHowToLang("en"));
}

/**
 * Wires all How-To related event listeners.
 */
function wireHowTo() {
  bindHowToOpeners();
  bindHowToClosers();
  bindHowToLanguage();
  let initialLang = "de";
  try {
    const saved = localStorage.getItem("howto.lang");
    initialLang = saved === "en" ? "en" : "de";
  } catch (e) {}
  setHowToLang(initialLang);
}

/**
 * Opens the Impressum modal.
 */
function openImpressum() {
  closeHowTo();
  document.getElementById("impressumModal")?.classList.remove("hidden");
}

/**
 * Closes the Impressum modal.
 */
function closeImpressum() {
  document.getElementById("impressumModal")?.classList.add("hidden");
}

/**
 * Closes the Impressum modal when clicking the backdrop.
 * @param {MouseEvent} e
 */
function closeImpressumOnBackdrop(e) {
  if (e.target?.id === "impressumModal") closeImpressum();
}

/**
 * Handles opening the Impressum modal.
 * @param {Event} e
 */
function handleImpressumOpen(e) {
  e.preventDefault();
  e.stopPropagation();
  openImpressum();
}

/**
 * Binds buttons that open the Impressum modal.
 */
function bindImpressumOpeners() {
  onClick("impressumLinkStart", handleImpressumOpen);
  onClick("impressumLinkHowto", handleImpressumOpen);
}

let impressumKeysBound = false;

/**
 * Closes modal on Escape key.
 * @param {KeyboardEvent} e
 */
function handleImpressumEscape(e) {
  if (e.code === "Escape") closeImpressum();
}

/**
 * Binds buttons that close the Impressum modal and Escape listener once.
 */
function bindImpressumClosers() {
  if (impressumKeysBound) return;

  onClick("impressumClose", closeImpressum);
  onClick("impressumClose2", closeImpressum);
  onClick("impressumModal", closeImpressumOnBackdrop);

  addEventListener("keydown", handleImpressumEscape);
  impressumKeysBound = true;
}

/**
 * Wires all Impressum related event listeners.
 */
function wireImpressum() {
  bindImpressumOpeners();
  bindImpressumClosers();
}

/**
 * Starts the game and hides the start screen after assets are ready.
 * @param {HTMLElement} scr
 */
async function startGame(scr) {
  window.world?.pause?.(true);
  await window.ensureEssentialAssets?.();
  scr.classList.add("hidden");
  setStartScreenActive(false);
  window.world?.pause?.(false);
}

/**
 * Wires the start screen once it exists in the DOM.
 */
function setupStartScreen() {
  const scr = document.getElementById("startScreen");
  const btn = document.getElementById("btnStartGame");
  if (!scr || !btn) return;
  btn.addEventListener("click", () => startGame(scr));
}

let endControlsBound = false;

/**
 * Shows the end screen controls.
 */
function showEndControls() {
  document.getElementById("endScreen")?.classList.remove("hidden");
}

/**
 * Hides the end screen controls.
 */
function hideEndControls() {
  document.getElementById("endScreen")?.classList.add("hidden");
}

/**
 * Shows the start screen and pauses the game.
 */
function showStartScreen() {
  const scr = document.getElementById("startScreen");
  if (!scr) return;
  scr.classList.remove("hidden");
  setStartScreenActive(true);
  window.world?.pause?.(true);
}

/**
 * Restarts the game and returns to the start screen.
 */
function goHomeFromEndScreen() {
  hideEndControls();
  window.restartGame?.();
  showStartScreen();
}

/**
 * Restarts the game from the end screen.
 */
function restartFromEndScreen() {
  hideEndControls();
  window.restartGame?.();
}

/**
 * Wires the end screen buttons once it exists in the DOM.
 */
function setupEndControls() {
  if (endControlsBound) return;
  const scr = document.getElementById("endScreen");
  if (!scr) return;
  onClick("endRestart", restartFromEndScreen);
  onClick("endHome", goHomeFromEndScreen);
  endControlsBound = true;
}

/**
 * Applies a background image to the #bg element after it is ready.
 * @param {string} url
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

window.applyDivBackground = applyDivBackground;
window.showEndControls = showEndControls;
window.hideEndControls = hideEndControls;
window.setupEndControls = setupEndControls;
window.showStartScreen = showStartScreen;
