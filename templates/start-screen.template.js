/**
 * Static HTML for the start screen.
 * @type {string}
 */
const START_SCREEN_HTML = `
<div id="startScreen" role="dialog" aria-modal="true" aria-label="Start screen">

  <style>
    #startScreen {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(4px);
    }

    #startScreen .impressum-link {
      position: absolute;
      bottom: 16px;
      right: 20px;
      font-size: 12px;
      color: rgb(242, 148, 6);
      text-decoration: none;
      opacity: 0.9;
      z-index: 1100;
    }

    #startScreen .impressum-link:hover {
      color: #e6a944;
      text-decoration: underline;
      opacity: 1;
    }
  </style>

  <div class="start-inner">
    <img class="start-art"
         src="img/9_intro_outro_screens/start/startscreen_1.png"
         alt="El Pollo Loco – Startbild" />

    <div class="start-actions">
      <button id="btnStartGame" class="btn primary" type="button">Start</button>
      <button id="btnHowTo" class="btn" type="button">How to Play</button>
    </div>
  </div>

  <a href="impressum.html"
     class="impressum-link"
     target="_blank"
     rel="noopener">
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
