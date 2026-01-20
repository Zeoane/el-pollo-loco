/**
 * Static HTML for the Impressum modal.
 * Keep markup here, wire events in your UI script.
 * @type {string}
 */
const IMPRESSUM_MODAL_HTML = `
<div id="impressumModal" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="impressumTitle">
  <div class="modal">
    <header class="modal-h">
      <h2 id="impressumTitle">Impressum</h2>
      <button id="impressumClose" class="x" aria-label="Close" type="button">✕</button>
    </header>

    <div class="modal-b impressum-content">
      <p>Angaben gemäß § 5 TMG:</p>

      <p><strong>Betreiber:</strong><br>
        c/o MDC Management#4069<br>
        Welserstraße 3<br>
        87463 Dietmannsried
      </p>

      <p><strong>Kontakt:</strong><br>
        E-Mail: kontakt-gl@outlook.de
      </p>

      <h3>Haftungsausschluss (Disclaimer)</h3>
      <p><strong>Haftung für Inhalte:</strong> Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
        die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>

      <p><strong>Urheberrecht:</strong> Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
        unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
        Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
        Autors bzw. Erstellers.</p>
    </div>

    <footer class="modal-f">
      <button id="impressumClose2" class="btn" type="button">OK</button>
    </footer>
  </div>
</div>
`;

/**
 * Returns the Impressum modal HTML string.
 * @returns {string}
 */
function impressumModalTemplate() {
  return IMPRESSUM_MODAL_HTML;
}

window.impressumModalTemplate = impressumModalTemplate;
