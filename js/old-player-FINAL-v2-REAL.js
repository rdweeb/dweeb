(function () {
  var duck = null;
  var presses = 0;

  function quack() {
    presses++;
    if (!duck) duck = new Audio('audio/duck-final-REAL-use-this-one.mp3');
    duck.currentTime = 0;
    duck.play();
    if (presses === 69) alert('nice');
  }

  function init() {
    var b = document.getElementById('the-only-button');
    if (!b) return;
    b.addEventListener('click', quack);
  }

})();
