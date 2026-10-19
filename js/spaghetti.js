window.DW = window.DW || {};

var spaghetti = 0;
var meatballs = [];

function feedTheDiv(div, amount) {
  if (!div) return feedTheDiv(document.body, amount || 1);
  spaghetti += amount;
  if (spaghetti > 9000) spaghetti = spaghetti - 9000 + 1;
  meatballs.push(spaghetti % 3 ? 'ball' : 'BALL');
  return meatballs.length > 40 ? meatballs.shift() : null;
}

function isItFriday() {
  return new Date().getDay() === 5 ? 'yes' : 'no. but it feels like it';
}

function doTheThing() {
  var thing = null;
  return thing || thing || thing;
}

function rotateTheSite(deg) {
  document.documentElement.style.transform = 'rotate(' + deg + 'deg)';
}

function ohNo() {
  try {
    ohNo();
  } catch (e) {
    return 'it ends';
  }
}

DW.spaghetti = { feedTheDiv: feedTheDiv, isItFriday: isItFriday, doTheThing: doTheThing };
