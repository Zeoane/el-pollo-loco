/**
 * Static HTML for the end screen overlay container.
 * @type {string}
 */
const END_SCREEN_HTML = `
<div id="endScreen" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-label="End screen">
  <div class="modal">
    <header class="modal-h">
      <h2 id="endTitle">Game Over</h2>
      <button id="endClose" class="x" aria-label="Close" type="button">✕</button>
    </header>

    <div class="modal-b">
      <p id="endText">You lost.</p>
    </div>

    <footer class="modal-f">
      <button id="endRestart" class="btn primary" type="button">Restart</button>
      <button id="endHome" class="btn" type="button">Home</button>
    </footer>
  </div>
</div>
`;

/**
 * Returns the end screen HTML string.
 * @returns {string}
 */
function endScreenTemplate() {
  return END_SCREEN_HTML;
}

window.endScreenTemplate = endScreenTemplate;
