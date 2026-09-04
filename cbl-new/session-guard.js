(function () {
  "use strict";
  var script = document.currentScript;
  var isLoginPage = script && script.dataset.authPage === "login";
  var home = script && script.dataset.authHome ? script.dataset.authHome : "/cbl-new/index.html";
  var login = "/cbl-new/login.html";
  function normal(value) { return String(value || "").trim().toLowerCase(); }
  function readSession() {
    try { return JSON.parse(localStorage.getItem("dd_user") || "null"); }
    catch (error) { return null; }
  }
  function clearSession(reason) {
    localStorage.removeItem("dd_user");
    if (reason) sessionStorage.setItem("dd_auth_notice", reason);
  }
  function showLoginNotice(message) {
    var show = function () { var error = document.getElementById("login-error"); if (error) error.textContent = message; };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show, { once: true });
    else show();
  }
  function redirectToLogin(reason) {
    clearSession(reason);
    if (isLoginPage) { showLoginNotice(reason); return; }
    localStorage.setItem("dd_return_to", window.location.pathname + window.location.search);
    window.location.replace(login + "?access=revoked");
  }
  window.DD_ACCESS_READY = (async function () {
    var session = readSession();
    if (!session || !normal(session.email)) {
      if (!isLoginPage) redirectToLogin("Please sign in to continue.");
      else {
        var notice = sessionStorage.getItem("dd_auth_notice");
        if (notice) {
          sessionStorage.removeItem("dd_auth_notice");
          showLoginNotice(notice);
        }
      }
      return false;
    }
    try {
      var response = await fetch("/cbl-new/allowed.json?_=" + Date.now(), { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) throw new Error("Access list request failed");
      var data = await response.json();
      var match = (Array.isArray(data.users) ? data.users : []).find(function (entry) { return normal(entry.email) === normal(session.email); });
      if (!match) { redirectToLogin("Your account no longer has access."); return false; }
      session.role = match.role || "admin";
      session.player = match.player || null;
      localStorage.setItem("dd_user", JSON.stringify(session));
      sessionStorage.removeItem("dd_auth_notice");
      if (isLoginPage) {
        var returnTo = localStorage.getItem("dd_return_to");
        localStorage.removeItem("dd_return_to");
        window.location.replace(returnTo && returnTo.charAt(0) === "/" ? returnTo : home);
      }
      return true;
    } catch (error) {
      redirectToLogin("Access could not be verified. Please sign in again.");
      return false;
    }
  })();
})();
