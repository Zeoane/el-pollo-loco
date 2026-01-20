// templates/touch-controls.template.js
window.touchControlsTemplate = function touchControlsTemplate() {
  return `
    <style>
      .touch-controls {
        position: fixed;
        inset: 0;
        z-index: 120;
        pointer-events: none;
        display: none;
      }

      .touch-controls-left,
      .touch-controls-right {
        position: absolute;
        bottom: max(0px, env(safe-area-inset-bottom, 0px));
        display: flex;
        gap: clamp(8px, 3vw, 16px);
        pointer-events: auto;
      }

      .touch-controls-left {
        left: max(4px, env(safe-area-inset-left, 0px));
      }

      .touch-controls-right {
        right: max(4px, env(safe-area-inset-right, 0px));
      }

      .touch-btn {
        width: clamp(52px, 14vw, 70px);
        height: clamp(52px, 14vw, 70px);
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(58, 203, 14, 0.33);
        color: #fff;
        font-size: clamp(20px, 6vw, 28px);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
        touch-action: none;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }


      @media (hover: none) and (pointer: coarse) {
        .touch-controls {
          display: block;
        }

        .touch-btn.active {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-3px);
        border-color: rgba(255, 255, 255, 0.4);
        }
      }

      @media (max-width: 600px), (max-height: 520px) {
        .touch-controls {
          display: block;
        }
      }
    </style>
    <div id="touchControls" class="touch-controls" aria-hidden="true">
      <div class="touch-controls-left">
        <button class="touch-btn touch-btn-pause" data-key="PAUSE" aria-label="Pause">⏸</button>
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
