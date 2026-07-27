(function () {
  function norm(value) {
    return String(value || "").trim().toLowerCase();
  }

  function sessionUser() {
    try {
      return JSON.parse(localStorage.getItem("dd_user") || "{}");
    } catch (error) {
      return {};
    }
  }

  var user = sessionUser();
  if (!user.role || user.role === "admin") return;

  var sources = { pitcher: [], batter: [] };
  var ownTeam = "Guelph Royals";
  var enforcing = false;

  function teamOf(player) {
    return player.pitcher_team || player.batter_team || "";
  }

  function nameOf(player) {
    return player.pitcher || player.batter || "";
  }

  function roleSource(role) {
    return sources[role] || [];
  }

  function canView(player, role) {
    var playerName = nameOf(player);
    var playerTeam = teamOf(player);
    var isSelf = norm(playerName) === norm(user.player);
    var isTeammate = norm(playerTeam) === norm(ownTeam);

    if (isSelf) return true;
    if (user.role === "position_player") return !isTeammate;
    if (user.role === "catcher") return isTeammate && role === "pitcher";
    return false;
  }

  function replaceOptions(select, options, selectedValue) {
    var signature = options.map(function (option) {
      return option.value + "\u0000" + option.label;
    }).join("\u0001");
    if (select.dataset.accessSignature === signature) return;
    select.innerHTML = "";
    options.forEach(function (option) {
      var node = document.createElement("option");
      node.value = option.value;
      node.textContent = option.label;
      select.appendChild(node);
    });
    select.dataset.accessSignature = signature;
    if (options.some(function (option) { return option.value === selectedValue; })) {
      select.value = selectedValue;
    }
  }

  function enforceAccess() {
    if (enforcing || typeof state === "undefined" || typeof activeRole !== "function") return;
    enforcing = true;
    try {
      var role = activeRole();
      var teamSelect = document.getElementById("team");
      var playerSelect = document.getElementById("player");
      if (!teamSelect || !playerSelect) return;

      var allowed = roleSource(role).filter(function (player) {
        return canView(player, role);
      });
      var teamNames = Array.from(new Set(allowed.map(teamOf).filter(Boolean))).sort();
      var priorTeam = teamSelect.value;
      var teamOptions = [{ value: "all", label: "All teams" }].concat(teamNames.map(function (team) {
        return { value: team, label: team };
      }));
      replaceOptions(teamSelect, teamOptions, priorTeam);
      if (!teamOptions.some(function (option) { return option.value === priorTeam; })) {
        teamSelect.value = "all";
      }

      var scoped = allowed.filter(function (player) {
        return teamSelect.value === "all" || teamOf(player) === teamSelect.value;
      });
      var priorPlayer = playerSelect.value;
      replaceOptions(playerSelect, scoped.map(function (player) {
        return {
          value: nameOf(player),
          label: nameOf(player) + " \u00b7 " + (teamOf(player) || "Team unavailable")
        };
      }), priorPlayer);

      state.players = scoped;
      if (scoped.length) {
        var selected = scoped.some(function (player) {
          return nameOf(player) === priorPlayer;
        }) ? priorPlayer : nameOf(scoped[0]);
        playerSelect.value = selected;
        if (!state.current || nameOf(state.current) !== selected || !canView(state.current, role)) {
          selectPlayer(selected);
        }
      } else {
        state.current = null;
        playerSelect.innerHTML = '<option value="">No permitted players</option>';
      }

      var teamReportButton = document.getElementById("createTeamScoutingReport");
      if (teamReportButton) teamReportButton.style.display = "none";
      var teamReportPicker = document.getElementById("teamReportPicker");
      if (teamReportPicker) teamReportPicker.hidden = true;
    } finally {
      enforcing = false;
    }
  }

  Promise.all([
    fetch("data/pitchers2026.json").then(function (response) { return response.json(); }),
    fetch("data/summary2026.json").then(function (response) { return response.json(); })
  ]).then(function (data) {
    sources.pitcher = data[0];
    sources.batter = data[1];
    var allPlayers = sources.pitcher.concat(sources.batter);
    var ownRecord = allPlayers.find(function (player) {
      return norm(nameOf(player)) === norm(user.player);
    });
    if (ownRecord && teamOf(ownRecord)) ownTeam = teamOf(ownRecord);

    ["player", "team"].forEach(function (id) {
      var element = document.getElementById(id);
      if (element) element.addEventListener("change", function () {
        setTimeout(enforceAccess, 0);
      });
    });
    document.querySelectorAll("[data-role]").forEach(function (button) {
      button.addEventListener("click", function () {
        setTimeout(enforceAccess, 0);
      });
    });
    enforceAccess();
  }).catch(function (error) {
    console.error("Could not apply player access controls.", error);
  });
})();
