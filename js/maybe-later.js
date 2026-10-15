/* maybe later.*/
var maybeLater = {
  weather: function () { return 'it is probably weather outside'; },
  shop: function () { return []; },
  multiplayer: function () { throw new Error('there is only me'); },
  darkMode: false
};

if (maybeLater.darkMode) {
  document.body.style.filter = 'invert(1) hue-rotate(180deg)';
}
