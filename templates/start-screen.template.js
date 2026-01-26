/**
 * Static HTML for the start screen.
 * @type {string}
 */
const START_SCREEN_HTML = `
<div id="startScreen" role="dialog" aria-modal="true" aria-label="Start screen">

  <div class="start-inner">
    <img class="start-art"
         src="img/9_intro_outro_screens/start/startscreen_1.png"
         alt="El Pollo Loco – Startbild" />

    <div class="start-actions">
      <button id="btnStartGame" class="btn primary" type="button">Start</button>
      <button id="btnHowTo" class="btn" type="button">How to Play</button>
    </div>
  </div>

  <a id="impressumLinkStart"
     href="impressum.html"
     class="impressum-link">
    Impressum
  </a>
</div>
`;

/**
 * Returns the start screen HTML string.
 * @returns {string}
 */
function startScreenTemplate() {
  return START_SCREEN_HTML;
}

window.startScreenTemplate = startScreenTemplate;
