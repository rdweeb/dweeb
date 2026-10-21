// short links
(function () {
  var DW = window.DW || {}, map = DW.links || {};
  var path = decodeURIComponent(location.pathname).toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\.html?$/, '');
  var to = Object.prototype.hasOwnProperty.call(map, path) ? String(map[path]) : '';
  if (!/^(https?:\/\/|mailto:)/i.test(to)) return;
  var msg = document.getElementById('msg');
  if (msg) msg.textContent = 'taking you there...';
  var h = document.getElementById('hold');
  if (h) h.hidden = true;
  location.replace(to);
})();
