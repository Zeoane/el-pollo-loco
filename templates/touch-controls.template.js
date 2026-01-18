// templates/touch-controls.template.js
window.touchControlsTemplate = function touchControlsTemplate() {
  return `
    <div id="touchControls" class="touch-controls" aria-hidden="true">
      <div class="touch-controls-left">
        <button class="touch-btn" data-key="LEFT" aria-label="Links">◀</button>
        <button class="touch-btn" data-key="RIGHT" aria-label="Rechts">▶</button>
      </div>
      <div class="touch-controls-right">
        <button class="touch-btn" data-key="UP" aria-label="Springen">▲</button>
        <button class="touch-btn touch-btn-throw" data-key="F" aria-label="Bottle werfen">🧪</button>
        <button class="touch-btn touch-btn-heal" data-key="HEAL" aria-label="Heilen">❤</button>
      </div>
    </div>
  `;
};
