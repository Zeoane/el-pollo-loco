/**
 * Static HTML for the How-To modal.
 * Keep markup here, wire events in your UI script.
 * @type {string}
 */
const HOWTO_MODAL_HTML = `
<div id="howtoModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="howtoTitle">
  <div class="modal">
    <header class="modal-h">
      <h2 id="howtoTitle">How to Play</h2>
      <div class="lang">
        <button id="howtoDE" class="chip active" type="button">DE</button>
        <button id="howtoEN" class="chip" type="button">EN</button>
      </div>
      <button id="howtoClose" class="x" aria-label="Close" type="button">✕</button>
    </header>

    <div class="modal-b">
      <div id="howtoDECnt" class="howto-pane">
        <h3>Kurz-Anleitung</h3>
        <ul>
          <li><b>Bewegen:</b> Pfeile ← →</li>
          <li><b>Springen:</b> ↑ oder Leertaste</li>
          <li><b>Flasche werfen:</b> F (halten = Power-Wurf)</li>
          <li><b>Heilen:</b> H (3 Münzen oder 3 Flaschen → +20% Leben)</li>
          <li>Phasen: Kleine Hühner → reguläre Hühner → Endboss</li>
          <li><b>Mute/Pause/Stop/Restart:</b> Buttons oben rechts oder M / P / Esc / R</li>
        </ul>
      </div>

      <div id="howtoENCnt" class="howto-pane" hidden>
        <h3>Quick Guide</h3>
        <ul>
          <li><b>Move:</b> Arrows ← →</li>
          <li><b>Jump:</b> ↑ or Space</li>
          <li><b>Throw bottle:</b> F (hold for power)</li>
          <li><b>Heal:</b> H (3 coins or 3 bottles → +20% HP)</li>
          <li>Phases: Small chickens → regular chickens → End boss</li>
          <li><b>Mute/Pause/Stop/Restart:</b> top-right buttons or M / P / Esc / R</li>
        </ul>
      </div>
    </div>

    <footer class="modal-f">
      <a href="impressum.html" target="_blank" rel="noopener" class="impressum-link">Impressum</a>
      <button id="howtoClose2" class="btn" type="button">OK</button>
    </footer>
  </div>
</div>
`;

/**
 * Returns the How-To modal HTML string.
 * @returns {string}
 */
function howtoModalTemplate() {
  return HOWTO_MODAL_HTML;
}

window.howtoModalTemplate = howtoModalTemplate;
