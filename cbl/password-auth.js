/* Simple browser-side gate for the static CBL dashboard. */
(function () {
  var accessKey = 'dd_cbl_password_access';
  var hasAccess = localStorage.getItem(accessKey) === '1' || sessionStorage.getItem(accessKey) === '1';
  if (hasAccess) return;

  var here = window.location.pathname + window.location.search + window.location.hash;
  localStorage.setItem('dd_return_to', here);
  window.location.replace('login.html');
})();
