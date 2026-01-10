/**
 * Erzeugt das HTML für den Startbildschirm.
 * Basierend auf der aktuellen Struktur in index.html.
 */
function getStartScreenTemplate() {
    return /*html*/ `
        <div id="startScreen" role="dialog" aria-modal="true" aria-label="Start screen">
            <div class="start-inner">
                <img class="start-art" src="img/9_intro_outro_screens/start/startscreen_1.png" alt="El Pollo Loco – Startbild" />
                <div class="start-actions">
                    <button id="btnStartGame" class="btn primary">Start</button>
                    <button id="btnHowTo" class="btn">How to Play</button>
                    <a href="impressum.html" class="impressum-link">Impressum</a>
                </div>
            </div>
        </div>
    `;
}

/**
 * Erzeugt das HTML für das How-to-Play Modal.
 * Unterstützt die Sprachen DE und EN.
 */
function getHowToModalTemplate() {
    return /*html*/ `
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
                        </ul>
                    </div>

                    <div id="howtoENCnt" class="howto-pane" hidden>
                        <h3>Quick Guide</h3>
                        <ul>
                            <li><b>Move:</b> Arrows ← →</li>
                            <li><b>Jump:</b> ↑ or Space</li>
                            <li><b>Throw bottle:</b> F (hold for power)</li>
                            <li><b>Heal:</b> H (3 coins or 3 bottles → +20% HP)</li>
                        </ul>
                    </div>
                </div>

                <footer class="modal-f">
                    <button id="howtoClose2" class="btn" type="button">OK</button>
                </footer>
            </div>
        </div>
    `;
}