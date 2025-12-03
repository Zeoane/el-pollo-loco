// models/keyboard.class.js
(function (global) {
  if (global.GameKeyboard) return; // Guard gegen Doppelladen
  class GameKeyboard {
    constructor(){
      this.LEFT=false; this.RIGHT=false; this.UP=false; this.DOWN=false;
      this.SPACE=false; this.F=false;
    }
  }
  global.GameKeyboard = GameKeyboard;
})(window);

