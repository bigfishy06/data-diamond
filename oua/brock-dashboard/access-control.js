(function () {
  "use strict";

  function norm(value) { return String(value || "").trim().toLowerCase(); }
  function user() { try { return JSON.parse(localStorage.getItem("oua_dd_user") || "{}"); } catch (error) { return {}; } }

  var currentUser = user();
  if (window.OUA_PUBLIC_ACCESS || !currentUser.role || currentUser.role === "admin") return;

  var sources = { pitcher: [], batter: [] };
  var uiSources = { pitcher: [], batter: [] };
  // Access is scoped to Brock's roster, not to a historical team label that
  // may be stale in an imported season row.
  var ownTeam = "Brock Badgers";
  // Current Brock roster overrides preserve access even when older data carries a former team label.
  var BrockRosterOverrides = new Set(["tobey drennan"]);
  var enforcing = false;
  var teamOf = function (player) { return player.pitcher_team || player.batter_team || player.team || ""; };
  var nameOf = function (player) { return player.pitcher || player.batter || player.player || player.name || ""; };

  function canView(player, role) {
    var self = norm(nameOf(player)) === norm(currentUser.player);
    var teammate = BrockRosterOverrides.has(norm(nameOf(player))) || norm(teamOf(player)) === norm(ownTeam);
    if (self) return true;
    if (currentUser.role === "position_player") return !teammate;
    if (currentUser.role === "catcher") return !teammate || (teammate && role === "pitcher");
    return false;
  }

  function replaceOptions(select, options, selectedValue) {
    var signature = options.map(function (option) { return option.value + "\u0000" + option.label; }).join("\u0001");
    var renderedSignature = Array.from(select.options).map(function (option) { return option.value + "\u0000" + option.textContent; }).join("\u0001");
    // Role changes rebuild these selects outside this script. Do not trust a
    // stale stored signature when the visible options were replaced.
    if (select.dataset.accessSignature === signature && renderedSignature === signature) return;
    select.innerHTML = "";
    options.forEach(function (option) {
      var node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    });
    select.dataset.accessSignature = signature;
    if (options.some(function (option) { return option.value === selectedValue; })) select.value = selectedValue;
  }

  function enforceAccess() {
    if (enforcing || typeof state === "undefined" || typeof activeRole !== "function") return;
    enforcing = true;
    try {
      var role = activeRole();
      var teamSelect = document.getElementById("team");
      var playerSelect = document.getElementById("player");
      if (!teamSelect || !playerSelect) return;

      var allowed = sources[role].filter(function (player) { return canView(player, role); });
      var allowedNames = new Set(allowed.map(function (player) { return norm(nameOf(player)); }));
      var currentUi = Array.isArray(state.players) ? state.players : [];
      if (currentUi.length > uiSources[role].length) uiSources[role] = currentUi.slice();
      var seasonSelect = document.getElementById("season");
      var season = seasonSelect ? seasonSelect.value : "all";
      var inSelectedSeason = function (player) {
        return season === "all" || (Array.isArray(player.scatter) && player.scatter.some(function (pitch) { return String(pitch.date || "").slice(0, 4) === season; }));
      };
      var permittedUi = uiSources[role].filter(function (player) { return allowedNames.has(norm(nameOf(player))) && inSelectedSeason(player); });
      var priorTeam = teamSelect.value;
      var teams = Array.from(new Set(permittedUi.map(teamOf).filter(Boolean))).sort();
      var teamOptions = [{ value: "all", label: "All teams" }].concat(teams.map(function (team) { return { value: team, label: team }; }));
      replaceOptions(teamSelect, teamOptions, priorTeam);
      if (!teamOptions.some(function (option) { return option.value === priorTeam; })) teamSelect.value = "all";

      var scoped = permittedUi.filter(function (player) { return teamSelect.value === "all" || teamOf(player) === teamSelect.value; });
      var priorPlayer = playerSelect.value;
      replaceOptions(playerSelect, scoped.map(function (player) {
        return { value: nameOf(player), label: nameOf(player) + " · " + (teamOf(player) || "Team unavailable") };
      }), priorPlayer);
      state.players = scoped;
      if (!scoped.length) {
        state.current = null;
        playerSelect.innerHTML = '<option value="">No permitted players</option>';
        return;
      }
      var selected = scoped.some(function (player) { return nameOf(player) === priorPlayer; }) ? priorPlayer : "";
      if (!selected && currentUser.role === "position_player") {
        var selfProfile = scoped.find(function (player) { return norm(nameOf(player)) === norm(currentUser.player); });
        if (selfProfile) selected = nameOf(selfProfile);
      }
      selected = selected || nameOf(scoped[0]);
      playerSelect.value = selected;
      if (!state.current || nameOf(state.current) !== selected || !canView(state.current, role)) selectPlayer(selected);
    } finally { enforcing = false; }
  }

  function enforceAfterRoleChange() {
    // The dashboard rebuilds the player list during a role switch. Reapply after
    // that rebuild completes so a restricted user never retains teammate profiles.
    [0, 30, 100, 250, 600, 1200].forEach(function (delay) { setTimeout(enforceAccess, delay); });
  }

  Promise.all([
    fetch("data/pitchers2026.json").then(function (response) { return response.json(); }),
    fetch("data/summary2026.json").then(function (response) { return response.json(); })
  ]).then(function (data) {
    sources.pitcher = data[0];
    sources.batter = data[1];
    ["player", "team", "season"].forEach(function (id) {
      var element = document.getElementById(id);
      if (element) element.addEventListener("change", function () { setTimeout(enforceAccess, 0); });
    });
    document.querySelectorAll("[data-role]").forEach(function (button) { button.addEventListener("click", enforceAfterRoleChange); });
    var playerSelect = document.getElementById("player");
    if (playerSelect) new MutationObserver(function () {
      var role = activeRole();
      if (!enforcing && Array.isArray(state.players) && state.players.some(function (player) { return !canView(player, role); })) enforceAfterRoleChange();
    }).observe(playerSelect, { childList: true });
    if (currentUser.role === "position_player") {
      var selfIsBatter = sources.batter.some(function (player) { return norm(nameOf(player)) === norm(currentUser.player); });
      var preferred = document.querySelector('[data-role="' + (selfIsBatter ? "batter" : "pitcher") + '"]');
      if (preferred && !preferred.classList.contains("active")) preferred.click();
    }
    // Every dashboard script eventually calls selectPlayer(). Guarding that
    // final hand-off prevents an asynchronous role/team rebuild from briefly
    // selecting a teammate before the option list is refreshed.
    var baseSelectPlayer = window.selectPlayer;
    if (typeof baseSelectPlayer === "function") {
      window.selectPlayer = function (requestedName) {
        var role = activeRole();
        var record = sources[role].find(function (player) { return norm(nameOf(player)) === norm(requestedName); });
        if (record && !canView(record, role)) {
          // Do not leave a forbidden profile mounted while the controls are
          // being rebuilt. This also blocks stale select/change handlers.
          state.current = null;
          enforceAccess();
          enforceAfterRoleChange();
          return;
        }
        return baseSelectPlayer.apply(this, arguments);
      };
    }
    enforceAccess();
  }).catch(function (error) { console.error("Could not apply OUA player access controls.", error); });
})();
