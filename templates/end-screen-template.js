/**
 * Static HTML for the end screen controls.
 * @type {string}
 */
const END_SCREEN_HTML = `
<div id="endScreen" class="end-controls hidden" role="group" aria-label="End screen actions">
  <button id="endRestart" class="btn primary" type="button">Restart</button>
  <button id="endHome" class="btn" type="button">Home</button>
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
