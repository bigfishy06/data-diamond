/* ================================================
   DATA DIAMOND — main.js v6
   Powered by summary.json + pitches.json
================================================ */

function getBase() { return '/'; }

// ── GOOGLE AUTH ───────────────────────────────────
const AUTH = {
  CLIENT_ID: '348783711243-h0tiqjvdpjclh8t4cj5imqobpskr0c50.apps.googleusercontent.com',

  // ✅ Add every email address that is allowed to access the site
  ALLOWED_EMAILS: [
    'christiansturgeon06@gmail.com'
  ],

  // Internal state
  _user: null,

  init: function() {
    // Load the saved session (survives page refreshes)
    const saved = sessionStorage.getItem('dd_user');
    if (saved) {
      try { AUTH._user = JSON.parse(saved); } catch(e) {}
    }

    const path = window.location.pathname.split('/').pop() || 'index.html';
    const onLoginPage = path === 'login.html';

    if (!AUTH._user) {
      // Not signed in — send to login page (unless already there)
      if (!onLoginPage) { window.location.href = getBase() + 'login.html'; return false; }
      return false;
    }

    if (onLoginPage) {
      // Already signed in — bounce to home
      window.location.href = getBase() + 'index.html';
      return false;
    }

    AUTH._renderUserUI();
    return true;
  },

  handleCredentialResponse: function(response) {
    // Decode the JWT Google sends back
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    const email   = (payload.email || '').toLowerCase();

    if (!AUTH.ALLOWED_EMAILS.map(function(e){ return e.toLowerCase(); }).includes(email)) {
      document.getElementById('login-error').textContent =
        '⛔ ' + email + ' is not authorised to access this site.';
      return;
    }

    AUTH._user = { name: payload.given_name || payload.name, email: email, picture: payload.picture };
    sessionStorage.setItem('dd_user', JSON.stringify(AUTH._user));
    window.location.href = getBase() + 'index.html';
  },

  signOut: function() {
    sessionStorage.removeItem('dd_user');
    AUTH._user = null;
    if (typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
    window.location.href = getBase() + 'login.html';
  },

  _renderUserUI: function() {
    // Find or create the user widget in the nav
    let widget = document.getElementById('auth-widget');
    if (!widget) {
      // Try to append into whatever header/nav exists
      const nav = document.querySelector('nav, header, .nav-inner, .header-inner') || document.body;
      widget = document.createElement('div');
      widget.id = 'auth-widget';
      nav.appendChild(widget);
    }

    const u = AUTH._user;
    widget.innerHTML =
      '<span id="auth-greeting">Hi, ' + u.name + '!</span>' +
      (u.picture ? '<img id="auth-avatar" src="' + u.picture + '" alt="' + u.name + '">' : '') +
      '<button id="auth-signout">Sign out</button>';

    widget.querySelector('#auth-signout').addEventListener('click', AUTH.signOut);

    // Inject minimal styles once
    if (!document.getElementById('auth-styles')) {
      var s = document.createElement('style');
      s.id = 'auth-styles';
      s.textContent =
        '#auth-widget{display:flex;align-items:center;gap:10px;margin-left:auto;padding:0 16px;}' +
        '#auth-greeting{color:#FFB81C;font-family:var(--font-mono,monospace);font-size:13px;white-space:nowrap;}' +
        '#auth-avatar{width:30px;height:30px;border-radius:50%;border:2px solid #FFB81C;object-fit:cover;}' +
        '#auth-signout{background:transparent;border:1px solid rgba(255,184,28,0.4);color:#FFB81C;' +
        'padding:4px 10px;border-radius:4px;cursor:pointer;font-size:12px;transition:all .2s;}' +
        '#auth-signout:hover{background:rgba(255,184,28,0.15);}';
      document.head.appendChild(s);
    }
  }
};

const TEAMS = [
  { id: 'bar', name: 'Barrie Baycats',             abbreviation: 'BAR', primaryColor: '#C8102E' },
  { id: 'bra', name: 'Brantford Red Sox',           abbreviation: 'BRA', primaryColor: '#BD3039' },
  { id: 'ckb', name: 'Chatham-Kent Barnstormers',   abbreviation: 'CKB', primaryColor: '#E87722' },
  { id: 'gue', name: 'Guelph Royals',               abbreviation: 'GUE', primaryColor: '#003DA5' },
  { id: 'ham', name: 'Hamilton Cardinals',           abbreviation: 'HAM', primaryColor: '#C8102E' },
  { id: 'kit', name: 'Kitchener Panthers',           abbreviation: 'KIT', primaryColor: '#000000' },
  { id: 'lon', name: 'London Majors',                abbreviation: 'LON', primaryColor: '#003DA5' },
  { id: 'tor', name: 'Toronto Maple Leafs',          abbreviation: 'TOR', primaryColor: '#134A8E' },
  { id: 'wel', name: 'Welland Jackfish',             abbreviation: 'WEL', primaryColor: '#00703C' }
];

function resolveTeam(rawName) {
  if (!rawName) return null;
  const s = rawName.trim().toLowerCase();
  return TEAMS.find(function(t) {
    return t.name.toLowerCase() === s ||
           t.abbreviation.toLowerCase() === s ||
           t.id === s ||
           t.name.toLowerCase().includes(s.split(' ')[0]);
  }) || null;
}

let DATA = { summary: [], pitches: [], pitchers: [], iblHistory: {}, pbpBatters: [], pbpPitchers: [] };

// ── INIT ──────────────────────────────────────────
async function init() {
  // Auth gate: stop here if user is not signed in
  if (!AUTH.init()) return;

  await loadAll();
  buildTicker();
  initGlobalSearch();

  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '')  initHomePage();
  if (path === 'league.html')                initLeaguePage();
  if (path === 'teams.html')                 initTeamsPage();
  if (path === 'players.html')               initPlayersPage();
}

async function loadAll() {
  // Inject dropdown theme styles once
  if (!document.getElementById('dd-select-style')) {
    var s = document.createElement('style');
    s.id = 'dd-select-style';
    s.textContent = 'select option { background:#0e1525; color:#FFB81C; }' +
      'select:focus { border-color:rgba(255,184,28,0.7); }';
    document.head.appendChild(s);
  }

  try {
    const base = getBase();
    const [sumRes, pitRes, pitcherRes, iblRes] = await Promise.all([
      fetch(base + 'data/summary.json'),
      fetch(base + 'data/pitches.json'),
      fetch(base + 'data/pitchers.json'),
      fetch(base + 'data/ibl_history.json'),
    ]);
    if (sumRes.ok)     DATA.summary     = await sumRes.json();
    if (pitRes.ok)     DATA.pitches     = await pitRes.json();
    if (pitcherRes.ok) DATA.pitchers    = await pitcherRes.json();
    if (iblRes.ok)     DATA.iblHistory  = await iblRes.json();
    DATA.pbpBatters  = [];
    DATA.pbpPitchers = [];
    console.log('summary players:', DATA.summary.length);
    console.log('pitches players:', DATA.pitches.length);
    console.log('pitchers:', DATA.pitchers.length);
  } catch(e) {
    console.error('loadAll failed:', e.message);
  }
}

// ── HELPERS ───────────────────────────────────────
function fmt3(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(3).replace('0.', '.');
}
function fmt2(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(2);
}
function fmt1(v) {
  if (v == null || isNaN(v)) return '—';
  return parseFloat(v).toFixed(1);
}
function fmtN(v) {
  if (v == null || isNaN(v)) return '—';
  return Math.round(v);
}
function fmtIP(v) {
  if (v == null || isNaN(v)) return '—';
  const totalOuts = Math.round(parseFloat(v) * 3);
  const innings = Math.floor(totalOuts / 3);
  const outs = totalOuts % 3;
  return innings + '.' + outs;
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function navigate(url) { window.location.href = getBase() + url; }

function getPbpBatter(name) {
  return DATA.pbpBatters.find(function(p) { return p.batter === name; }) || null;
}
function getPbpPitcher(name) {
  return DATA.pbpPitchers.find(function(p) { return p.pitcher === name; }) || null;
}
function getSeasonERA(name) {
  var ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
  return ibl.length && ibl[0].ERA != null ? ibl[0].ERA : null;
}
function getSeasonWHIP(name) {
  var ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
  return ibl.length && ibl[0].WHIP != null ? ibl[0].WHIP : null;
}
function getSeasonHR(name) {
  var ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0; });
  return ibl.length && ibl[0].HR != null ? ibl[0].HR : null;
}
function getSeasonRBI(name) {
  var ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0; });
  return ibl.length && ibl[0].RBI != null ? ibl[0].RBI : null;
}
function getPitchPlayer(name) {
  return DATA.pitches.find(function(p) { return p.batter === name; }) || null;
}
function getSummaryPlayer(name) {
  return DATA.summary.find(function(p) { return p.batter === name; }) || null;
}
function getPitcherScatter(name) {
  var pts = [];
  DATA.pitches.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
  });
  return pts;
}
function getAllBatters() {
  const names = new Set();
  DATA.summary.forEach(function(p) { names.add(p.batter); });
  DATA.pitches.forEach(function(p) { names.add(p.batter); });
  DATA.pbpBatters.forEach(function(p) { names.add(p.batter); });
  return Array.from(names).sort();
}
function getAllPitchers() {
  const names = new Set();
  DATA.pitches.forEach(function(p) {
    if (p.scatter) p.scatter.forEach(function(s) { if (s.pitcher) names.add(s.pitcher); });
  });
  DATA.pbpPitchers.forEach(function(p) { names.add(p.pitcher); });
  return Array.from(names).sort();
}

// ── TICKER ────────────────────────────────────────
function buildTicker() {
  const track = document.getElementById('stat-ticker');
  if (!track) return;
  const items = [];
  DATA.summary.slice(0, 20).forEach(function(p) {
    items.push({ name: p.batter, stat: fmt3(p.AVG),  lbl: 'AVG'  });
    items.push({ name: p.batter, stat: fmtN(p.HR),   lbl: 'HR'   });
    items.push({ name: p.batter, stat: fmt3(p.OPS),  lbl: 'OPS'  });
  });
  if (!items.length) { track.parentElement.style.display = 'none'; return; }
  const all = items.concat(items);
  track.innerHTML = all.map(function(i) {
    return '<div class="ticker-item">' +
      '<span class="ticker-name">' + i.name + '</span>' +
      '<span class="ticker-stat">' + i.stat + '</span>' +
      '<span class="ticker-label">' + i.lbl + '</span>' +
      '</div>';
  }).join('');
}

// ── GLOBAL SEARCH ─────────────────────────────────
function initGlobalSearch() {
  const input    = document.getElementById('global-search');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;
  input.addEventListener('input', function() {
    const q = input.value.toLowerCase().trim();
    if (!q || q.length < 1) { dropdown.classList.add('hidden'); return; }
    const batters  = getAllBatters().filter(function(n) { return n.toLowerCase().includes(q); });
    const pitchers = getAllPitchers().filter(function(n) { return n.toLowerCase().includes(q); });
    const results  = [
      ...batters.map(function(n)  { return { name: n, type: 'batter'  }; }),
      ...pitchers.map(function(n) { return { name: n, type: 'pitcher' }; })
    ].slice(0, 8);
    if (!results.length) { dropdown.classList.add('hidden'); return; }
    dropdown.classList.remove('hidden');
    dropdown.innerHTML = results.map(function(r) {
      const sum  = getSummaryPlayer(r.name);
      const team = sum ? resolveTeam(sum.batter_team) : null;
      return '<div class="search-result-item" data-name="' + r.name + '" data-type="' + r.type + '">' +
        '<span class="sri-badge">' + (r.type === 'pitcher' ? 'P' : 'H') + '</span>' +
        '<div><div class="sri-name">' + r.name + '</div>' +
        '<div class="sri-team">' + (team ? team.name : r.type) + '</div></div></div>';
    }).join('');
    dropdown.querySelectorAll('.search-result-item').forEach(function(el) {
      el.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(el.dataset.name) + '&type=' + el.dataset.type);
      });
    });
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.header-search')) dropdown.classList.add('hidden');
  });
}

// ══════════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════════
function initHomePage() {
  buildHomeTeamsGrid();
}

function buildHomeTeamsGrid() {
  const grid = document.getElementById('teams-grid');
  if (!grid) return;
  TEAMS.forEach(function(team, i) {
    const batterCount = DATA.summary.filter(function(p) {
      const t = resolveTeam(p.batter_team);
      return t && t.id === team.id;
    }).length;
    const pitcherNames = new Set();
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) {
        if (!s.pitcher) return;
        const pt = resolveTeam(s.pitcher_team);
        if (pt && pt.id === team.id) pitcherNames.add(s.pitcher);
      });
    });
    const playerCount = batterCount + pitcherNames.size;
    const card = document.createElement('div');
    card.className = 'team-card fade-up';
    card.style.setProperty('--team-color', team.primaryColor);
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML =
      '<div class="team-abbr">' + team.abbreviation + '</div>' +
      '<div class="team-name">' + team.name + '</div>' +
      '<div class="team-footer">' +
      '<span class="team-player-count">' + playerCount + ' player' + (playerCount !== 1 ? 's' : '') + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-dim)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</div>';
    card.addEventListener('click', function() { navigate('teams.html?team=' + team.id); });
    grid.appendChild(card);
  });

  const filterBtns = document.querySelectorAll('#team-filters .zone-filter-btn');
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });
}

// ══════════════════════════════════════════════════
// LEAGUE PAGE
// ══════════════════════════════════════════════════
function initLeaguePage() {
  const content = document.getElementById('tab-content');
  const tabs    = document.querySelectorAll('.tab-btn');

  function renderTab(tab) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tab); });
    content.innerHTML = '';
    if (tab === 'hitting') renderHittingLeaderboards(content);
    else                   renderPitchingLeaderboards(content);
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderTab(t.dataset.tab); }); });
  renderTab('hitting');
}

function renderHittingLeaderboards(container) {
  const players = DATA.summary.filter(function(p) { return p.AB > 0; });
  if (!players.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No data yet</h3></div>';
    return;
  }

  // Enrich players with RBI from ibl_history
  const enriched = players.map(function(p) {
    const ibl = (DATA.iblHistory[p.batter] || []).filter(function(s){ return s.AB > 0; });
    const rbi = ibl.length && ibl[0].RBI != null ? ibl[0].RBI : null;
    return Object.assign({}, p, { RBI: rbi });
  });

  const boards = [
    { title: 'AVG',  key: 'AVG',  fmt: fmt3, desc: true  },
    { title: 'OPS',  key: 'OPS',  fmt: fmt3, desc: true  },
    { title: 'OBP',  key: 'OBP',  fmt: fmt3, desc: true  },
    { title: 'SLG',  key: 'SLG',  fmt: fmt3, desc: true  },
    { title: 'HR',   key: 'HR',   fmt: fmtN, desc: true  },
    { title: 'RBI',  key: 'RBI',  fmt: fmtN, desc: true  },
    { title: 'H',    key: 'H',    fmt: fmtN, desc: true  },
    { title: 'BB',   key: 'BB',   fmt: fmtN, desc: true  },
    { title: 'K',    key: 'K',    fmt: fmtN, desc: false }
  ];

  const grid = document.createElement('div');
  grid.className = 'leaderboard-grid fade-up';

  boards.forEach(function(board) {
    const sorted = enriched.slice().sort(function(a, b) {
      const av = a[board.key] != null ? a[board.key] : (board.desc ? -Infinity : Infinity);
      const bv = b[board.key] != null ? b[board.key] : (board.desc ? -Infinity : Infinity);
      return board.desc ? bv - av : av - bv;
    }).slice(0, 5);

    const card = document.createElement('div');
    card.className = 'leader-card';
    card.innerHTML = '<div class="leader-card-header">' + board.title + '</div>' +
      sorted.map(function(p, i) {
        const team = resolveTeam(p.batter_team);
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const val = p[board.key] != null ? board.fmt(p[board.key]) : '—';
        return '<div class="leader-row" data-name="' + p.batter + '" data-type="batter">' +
          '<span class="leader-rank ' + rankClass + '">' + (i+1) + '</span>' +
          '<span class="leader-name">' + p.batter + '</span>' +
          '<span class="leader-team">' + (team ? team.abbreviation : '') + '</span>' +
          '<span class="leader-val">' + val + '</span>' +
          '</div>';
      }).join('');
    card.querySelectorAll('.leader-row').forEach(function(row) {
      row.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=batter');
      });
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);

  const tableCard = document.createElement('div');
  tableCard.className = 'stat-card fade-up';
  tableCard.style.marginTop = '20px';
  tableCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Hitters</span>' +
    '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
    buildHittingTable(players);
  container.appendChild(tableCard);
  initTableSort(tableCard.querySelector('table'));
  initPlayerLinks(tableCard, 'batter');
}

function renderPitchingLeaderboards(container) {
  const pitchers = DATA.pitchers;

  if (!pitchers.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No pitcher data</h3></div>';
    return;
  }

  // Enrich pitchers with ERA from ibl_history and WHIP calculated from scatter
  const enriched = pitchers.map(function(pd) {
    const name = pd.pitcher;
    // ERA from most recent IBL season with IP
    const ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
    const era = ibl.length && ibl[0].ERA != null ? ibl[0].ERA : null;
    // WHIP from datadiamond scatter
    var bb = 0, h = 0;
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) {
        if (s.pitcher !== name) return;
        if (s.outcome === 'Walk' || s.outcome === 'Intentional Walk') bb++;
        if (['Single','Double','Triple','Home Run'].includes(s.outcome)) h++;
      });
    });
    const whip = pd.IP > 0 ? (bb + h) / pd.IP : null;
    return Object.assign({}, pd, { ERA: era, WHIP: whip });
  });

  const boards = [
    { title: 'ERA',     key: 'ERA',       fmt: function(v) { return fmt2(v); },       desc: false },
    { title: 'WHIP',    key: 'WHIP',      fmt: function(v) { return fmt2(v); },       desc: false },
    { title: 'K%',      key: 'K_pct',     fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'K/BB',    key: 'K_BB',      fmt: function(v) { return fmt2(v); },       desc: true  },
    { title: 'STR%',    key: 'STR_pct',   fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'BB%',     key: 'BB_pct',    fmt: function(v) { return fmt1(v) + '%'; }, desc: false },
    { title: 'E+A%',    key: 'EA_pct',    fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'EARLY%',  key: 'Early_pct', fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'AHEAD%',  key: 'Ahead_pct', fmt: function(v) { return fmt1(v) + '%'; }, desc: true  },
    { title: 'PITCHES', key: 'total_pitches', fmt: fmtN, desc: true }
  ];

  const grid = document.createElement('div');
  grid.className = 'leaderboard-grid fade-up';

  boards.forEach(function(board) {
    const sorted = enriched.filter(function(p) { return p[board.key] != null; })
      .slice().sort(function(a,b) {
        return board.desc ? b[board.key] - a[board.key] : a[board.key] - b[board.key];
      }).slice(0, 5);

    const card = document.createElement('div');
    card.className = 'leader-card';
    card.innerHTML = '<div class="leader-card-header">' + board.title + '</div>' +
      sorted.map(function(p, i) {
        const team = resolveTeam(p.pitcher_team);
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const val = p[board.key] != null ? board.fmt(p[board.key]) : '—';
        return '<div class="leader-row" data-name="' + p.pitcher + '" data-type="pitcher">' +
          '<span class="leader-rank ' + rankClass + '">' + (i+1) + '</span>' +
          '<span class="leader-name">' + p.pitcher + '</span>' +
          '<span class="leader-team">' + (team ? team.abbreviation : '') + '</span>' +
          '<span class="leader-val">' + val + '</span>' +
          '</div>';
      }).join('');
    card.querySelectorAll('.leader-row').forEach(function(row) {
      row.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=pitcher');
      });
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ══════════════════════════════════════════════════
// TEAMS PAGE
// ══════════════════════════════════════════════════
function initTeamsPage() {
  const params = new URLSearchParams(window.location.search);
  const teamId = params.get('team');
  const content = document.getElementById('page-content');

  if (teamId) {
    renderTeamDetail(teamId, content);
  } else {
    renderTeamGrid(content);
  }
}

function renderTeamGrid(content) {
  content.innerHTML = '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League</p>' +
    '<h1 class="hero-title">TEAM<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +
    '<div class="teams-grid" id="teams-grid"></div></div>';

  const grid = document.getElementById('teams-grid');
  TEAMS.forEach(function(team, i) {
    const teamPlayers = DATA.summary.filter(function(p) {
      const t = resolveTeam(p.batter_team);
      return t && t.id === team.id;
    });
    // Aggregate team AVG and OPS for the card preview
    const qualified = teamPlayers.filter(function(p) { return p.AB > 0; });
    const totalAB = qualified.reduce(function(s,p){ return s + (p.AB||0); }, 0);
    const totalH  = qualified.reduce(function(s,p){ return s + (p.H||0);  }, 0);
    const teamAVG = totalAB > 0 ? fmt3(totalH / totalAB) : '—';
    const teamOPS = qualified.length > 0
      ? fmt3(qualified.reduce(function(s,p){ return s + (p.OPS||0); }, 0) / qualified.length)
      : '—';

    const card = document.createElement('div');
    card.className = 'team-card fade-up';
    card.style.setProperty('--team-color', team.primaryColor);
    card.style.animationDelay = (i * 0.04) + 's';
    card.innerHTML =
      '<div class="team-abbr">' + team.abbreviation + '</div>' +
      '<div class="team-name">' + team.name + '</div>' +
      '<div class="team-meta" style="display:flex;gap:16px;margin-top:6px">' +
      '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">AVG <span style="color:var(--text)">' + teamAVG + '</span></span>' +
      '<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">OPS <span style="color:var(--text)">' + teamOPS + '</span></span>' +
      '</div>' +
      '<div class="team-footer">' +
      '<span class="team-player-count">' + teamPlayers.length + ' player' + (teamPlayers.length !== 1 ? 's' : '') + '</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--text-dim)"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</div>';
    card.addEventListener('click', function() { navigate('teams.html?team=' + team.id); });
    grid.appendChild(card);
  });
}

function renderTeamDetail(teamId, content) {
  const team = TEAMS.find(function(t) { return t.id === teamId; });
  if (!team) { content.innerHTML = '<div class="container"><div class="empty-state"><h3>Team not found</h3></div></div>'; return; }

  const players = DATA.summary.filter(function(p) {
    const t = resolveTeam(p.batter_team);
    return t && t.id === teamId;
  });

  // Collect all pitchers for this team from pitchers array
  const teamPitchers = DATA.pitchers.filter(function(pd) {
    const t = resolveTeam(pd.pitcher_team);
    return t && t.id === teamId;
  });

  content.innerHTML =
    '<section class="player-hero" style="position:relative;padding:48px 0 40px;overflow:hidden">' +
    '<div class="player-hero-bg" style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,' + hexToRgba(team.primaryColor, 0.15) + ' 0%,transparent 70%)"></div>' +
    '<div class="container">' +
    '<div class="breadcrumb"><a href="teams.html">Teams</a><span>/</span><span>' + team.name + '</span></div>' +
    '<div style="font-family:var(--font-display);font-size:72px;letter-spacing:4px;color:' + team.primaryColor + ';line-height:1;filter:drop-shadow(0 0 16px ' + hexToRgba(team.primaryColor, 0.4) + ')">' + team.abbreviation + '</div>' +
    '<h1 style="font-family:var(--font-display);font-size:clamp(36px,6vw,72px);letter-spacing:4px;color:var(--text);margin-top:8px">' + team.name.toUpperCase() + '</h1>' +
    '</div></section>' +
    '<div class="container" style="padding-top:32px;padding-bottom:80px">' +
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="hitting">Hitting</button>' +
    '<button class="tab-btn" data-tab="pitching">Pitching</button>' +
    '</div></div>' +
    '<div id="team-stats-content"></div></div>';

  const statsContent = document.getElementById('team-stats-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function renderTeamStats(type) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === type); });
    statsContent.innerHTML = '';

    if (type === 'hitting') {
      if (!players.length) {
        statsContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No hitting data</h3></div>';
        return;
      }

      // Aggregate team hitting totals
      const qual = players.filter(function(p) { return p.AB > 0; });
      const totAB = qual.reduce(function(s,p){ return s+(p.AB||0); },0);
      const totH  = qual.reduce(function(s,p){ return s+(p.H||0);  },0);
      const tot2B = qual.reduce(function(s,p){ return s+(p['2B']||0); },0);
      const tot3B = qual.reduce(function(s,p){ return s+(p['3B']||0); },0);
      const totHR = qual.reduce(function(s,p){ return s+(p.HR||0); },0);
      const totBB = qual.reduce(function(s,p){ return s+(p.BB||0); },0);
      const totK  = qual.reduce(function(s,p){ return s+(p.K||0);  },0);
      const totHBP= qual.reduce(function(s,p){ return s+(p.HBP||0); },0);
      const totSF = qual.reduce(function(s,p){ return s+(p.SF||0);  },0);
      const teamAVG = totAB > 0 ? totH / totAB : null;
      const teamOBP = (totAB + totBB + totHBP + totSF) > 0
        ? (totH + totBB + totHBP) / (totAB + totBB + totHBP + totSF) : null;
      const tb = totH + tot2B + (tot3B*2) + (totHR*3);
      const teamSLG = totAB > 0 ? tb / totAB : null;
      const teamOPS = teamOBP != null && teamSLG != null ? teamOBP + teamSLG : null;

      // Summary stat boxes
      const summaryHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:24px">' +
        statBox('AVG', teamAVG != null ? fmt3(teamAVG) : '—', team.primaryColor) +
        statBox('OBP', teamOBP != null ? fmt3(teamOBP) : '—', team.primaryColor) +
        statBox('SLG', teamSLG != null ? fmt3(teamSLG) : '—', team.primaryColor) +
        statBox('OPS', teamOPS != null ? fmt3(teamOPS) : '—', team.primaryColor) +
        statBox('HR',  fmtN(totHR), team.primaryColor) +
        statBox('BB',  fmtN(totBB), team.primaryColor) +
        statBox('K',   fmtN(totK),  team.primaryColor) +
        '</div>';

      const summaryCard = document.createElement('div');
      summaryCard.className = 'stat-card fade-up';
      summaryCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Team Hitting</span>' +
        '<span class="stat-card-subtitle">' + qual.length + ' players · ' + totAB + ' AB</span></div>' +
        summaryHTML;
      statsContent.appendChild(summaryCard);

      // Full player hitting table
      const tableCard = document.createElement('div');
      tableCard.className = 'stat-card fade-up';
      tableCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Player Breakdown</span></div>' +
        buildHittingTable(players);
      statsContent.appendChild(tableCard);
      initTableSort(tableCard.querySelector('table'));
      initPlayerLinks(tableCard, 'batter');

    } else {
      // PITCHING
      if (!teamPitchers.length) {
        statsContent.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚾</div><h3>No pitching data</h3></div>';
        return;
      }

      // Aggregate team pitching totals
      const totPitches = teamPitchers.reduce(function(s,p){ return s+(p.total_pitches||0); },0);
      const totIP      = teamPitchers.reduce(function(s,p){ return s+(p.IP||0); },0);
      const totKs      = teamPitchers.reduce(function(s,p){ return s+Math.round((p.K_pct||0)/100*(p.total_pitches||0)); },0);
      const totBBs     = teamPitchers.reduce(function(s,p){ return s+Math.round((p.BB_pct||0)/100*(p.total_pitches||0)); },0);
      const avgSTR     = teamPitchers.length > 0
        ? teamPitchers.reduce(function(s,p){ return s+(p.STR_pct||0); },0) / teamPitchers.length : null;
      const avgK       = teamPitchers.length > 0
        ? teamPitchers.reduce(function(s,p){ return s+(p.K_pct||0); },0) / teamPitchers.length : null;
      const avgBB      = teamPitchers.length > 0
        ? teamPitchers.reduce(function(s,p){ return s+(p.BB_pct||0); },0) / teamPitchers.length : null;
      const avgEA      = teamPitchers.length > 0
        ? teamPitchers.reduce(function(s,p){ return s+(p.EA_pct||0); },0) / teamPitchers.length : null;

      // ERA from ibl_history
      var eraSum = 0, eraCount = 0;
      teamPitchers.forEach(function(pd) {
        const ibl = (DATA.iblHistory[pd.pitcher] || []).filter(function(s){ return s.IP > 0; });
        if (ibl.length && ibl[0].ERA != null) { eraSum += ibl[0].ERA; eraCount++; }
      });
      const teamERA = eraCount > 0 ? eraSum / eraCount : null;

      const summaryHTML =
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:24px">' +
        statBox('ERA',    teamERA  != null ? fmt2(teamERA)  : '—', team.primaryColor) +
        statBox('IP',     fmt1(totIP),   team.primaryColor) +
        statBox('Pitches',fmtN(totPitches), team.primaryColor) +
        statBox('K%',     avgK    != null ? fmt1(avgK)+'%'  : '—', team.primaryColor) +
        statBox('BB%',    avgBB   != null ? fmt1(avgBB)+'%' : '—', team.primaryColor) +
        statBox('STR%',   avgSTR  != null ? fmt1(avgSTR)+'%': '—', team.primaryColor) +
        statBox('E+A%',   avgEA   != null ? fmt1(avgEA)+'%' : '—', team.primaryColor) +
        '</div>';

      const summaryCard = document.createElement('div');
      summaryCard.className = 'stat-card fade-up';
      summaryCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Team Pitching</span>' +
        '<span class="stat-card-subtitle">' + teamPitchers.length + ' pitchers</span></div>' +
        summaryHTML;
      statsContent.appendChild(summaryCard);

      // Full pitcher table
      const tableCard = document.createElement('div');
      tableCard.className = 'stat-card fade-up';
      tableCard.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">Pitcher Breakdown</span></div>' +
        buildTeamPitcherTable(teamPitchers);
      statsContent.appendChild(tableCard);
      initTableSort(tableCard.querySelector('table'));
      initPlayerLinks(tableCard, 'pitcher');
    }
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderTeamStats(t.dataset.tab); }); });
  renderTeamStats('hitting');
}

function statBox(label, value, color) {
  return '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:4px;padding:16px;text-align:center">' +
    '<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);letter-spacing:0.08em;margin-bottom:6px">' + label + '</div>' +
    '<div style="font-family:var(--font-display);font-size:28px;color:' + (color || 'var(--accent)') + ';letter-spacing:1px">' + value + '</div>' +
    '</div>';
}

function buildTeamPitcherTable(pitchers) {
  const rows = pitchers.map(function(pd) {
    const ibl = (DATA.iblHistory[pd.pitcher] || []).filter(function(s){ return s.IP > 0; });
    const era = ibl.length && ibl[0].ERA != null ? fmt2(ibl[0].ERA) : '—';
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + pd.pitcher + '" data-type="pitcher">' + pd.pitcher + '</a></td>' +
      '<td>' + fmt1(pd.IP||0) + '</td>' +
      '<td>' + fmtN(pd.total_pitches||0) + '</td>' +
      '<td class="highlight-val">' + era + '</td>' +
      '<td>' + (pd.K_pct   != null ? fmt1(pd.K_pct)+'%'   : '—') + '</td>' +
      '<td>' + (pd.BB_pct  != null ? fmt1(pd.BB_pct)+'%'  : '—') + '</td>' +
      '<td>' + (pd.STR_pct != null ? fmt1(pd.STR_pct)+'%' : '—') + '</td>' +
      '<td>' + (pd.EA_pct  != null ? fmt1(pd.EA_pct)+'%'  : '—') + '</td>' +
      '<td>' + (pd.K_BB    != null ? fmt2(pd.K_BB)        : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>IP</th><th>Pitches</th><th>ERA</th>' +
    '<th>K%</th><th>BB%</th><th>STR%</th><th>E+A%</th><th>K/BB</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ══════════════════════════════════════════════════
// PLAYERS PAGE
// ══════════════════════════════════════════════════
function initPlayersPage() {
  const params     = new URLSearchParams(window.location.search);
  const playerName = params.get('player');
  const playerType = params.get('type') || 'batter';
  const content    = document.getElementById('page-content');

  if (playerName) {
    renderPlayerDetail(decodeURIComponent(playerName), playerType, content);
  } else {
    renderPlayerList(content);
  }
}

function renderPlayerList(content) {
  const batters  = getAllBatters();
  const pitchers = getAllPitchers();

  content.innerHTML =
    '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League</p>' +
    '<h1 class="hero-title">PLAYER<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="batters">Batters</button>' +
    '<button class="tab-btn" data-tab="pitchers">Pitchers</button>' +
    '</div></div>' +
    '<div id="player-list-content"></div></div>';

  const listContent = document.getElementById('player-list-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function renderList(type) {
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === type); });
    listContent.innerHTML = '';

    if (type === 'batters') {
      const players = DATA.pbpBatters.length
        ? DATA.pbpBatters.filter(function(p) { return p.AB >= 5; })
        : DATA.summary.filter(function(p) { return p.AB > 0; });
      const card = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Batters</span>' +
        '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
        '<div style="padding:16px 24px 0">' +
        '<input class="roster-search" id="player-search" placeholder="Search batters..." /></div>' +
        buildHittingTable(players);
      listContent.appendChild(card);
      initTableSort(card.querySelector('table'));
      initPlayerLinks(card, 'batter');
      document.getElementById('player-search').addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        card.querySelectorAll('tbody tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    } else {
      const card  = document.createElement('div');
      card.className = 'stat-card fade-up';
      var pitcherHTML = DATA.pbpPitchers.length
        ? buildPbpPitcherTable(DATA.pbpPitchers.filter(function(p){ return p.BF >= 5; }))
        : buildPitcherListTable(getAllPitchers());
      var pitcherCount = DATA.pbpPitchers.length
        ? DATA.pbpPitchers.filter(function(p){ return p.BF >= 5; }).length
        : getAllPitchers().length;
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Pitchers</span>' +
        '<span class="stat-card-subtitle">' + pitcherCount + ' pitchers</span></div>' +
        '<div style="padding:16px 24px 0">' +
        '<input class="roster-search" id="pitcher-search" placeholder="Search pitchers..." /></div>' +
        pitcherHTML;
      listContent.appendChild(card);
      initPlayerLinks(card, 'pitcher');
      document.getElementById('pitcher-search').addEventListener('input', function(e) {
        const q = e.target.value.toLowerCase();
        card.querySelectorAll('tbody tr').forEach(function(row) {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
      });
    }
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderList(t.dataset.tab); }); });
  renderList('batters');
}

function renderPlayerDetail(name, type, content) {
  const sum   = getSummaryPlayer(name);
  const pitch = getPitchPlayer(name);

  let pitchData = pitch;
  if (type === 'pitcher') {
    const pts = [];
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
    });
    pitchData = pts.length ? { batter: name, scatter: pts } : null;
  }

  let team = sum ? resolveTeam(sum.batter_team) : null;
  if (!team && type === 'pitcher' && pitchData && pitchData.scatter && pitchData.scatter.length) {
    const pt = pitchData.scatter[0].pitcher_team;
    if (pt) team = resolveTeam(pt);
  }

  document.title = name + ' — Data Diamond';

  // ── Collect player bio details (used in hero + overview) ──────────────────────
  var _iblAll  = DATA.iblHistory[name] || [];
  var _ibl     = _iblAll.length ? _iblAll[0] : null;

  // Derive bats/throws from scatter data (Batter_Side / Pitcher_Side columns).
  // If a player appears with more than one distinct side value they are Switch.
  function deriveHand(scatter, field) {
    var sides = new Set();
    scatter.forEach(function(s) { if (s[field]) sides.add(s[field]); });
    if (sides.size === 0) return null;
    if (sides.size > 1)  return 'S';
    return sides.values().next().value;
  }

  var _batterScatter = (pitch && pitch.scatter) ? pitch.scatter : [];
  var _pitcherScatter = (type === 'pitcher' && pitchData && pitchData.scatter) ? pitchData.scatter : [];

  var _bats   = deriveHand(_batterScatter,  'batter_side');
  var _throws = deriveHand(_pitcherScatter, 'pitcher_side');

  var playerInfo = {
    pos:      _ibl && _ibl.pos    ? _ibl.pos    : (type === 'pitcher' ? 'P' : '—'),
    bats:     _bats   || (_ibl && _ibl.bats   ? _ibl.bats   : null),
    throws:   _throws || (_ibl && _ibl.throws ? _ibl.throws : null),
    height:   _ibl && _ibl.height ? _ibl.height : null,
    weight:   _ibl && _ibl.weight ? _ibl.weight : null,
    teamName: team ? team.name : (_ibl && _ibl.team ? _ibl.team : null),
    teamColor: team ? team.primaryColor : null
  };

  content.innerHTML =
    '<section class="player-hero">' +
    '<div class="player-hero-bg" id="player-hero-bg"></div>' +
    '<div class="container">' +
    '<div class="breadcrumb">' +
    '<a href="players.html">Players</a><span>/</span>' +
    (team ? '<a href="teams.html?team=' + team.id + '">' + team.abbreviation + '</a><span>/</span>' : '') +
    '<span>' + name + '</span></div>' +
    '<div class="player-badges">' +
    '<span class="badge badge-pos">' + playerInfo.pos + '</span>' +
    (team ? '<span class="badge badge-team">' + team.abbreviation + '</span>' : '') +
    '</div>' +
    '<h1 class="player-name-hero">' + name.toUpperCase() + '</h1>' +
    '<div class="headline-stats" id="headline-stats"></div>' +
    '</div></section>' +
    '<div class="tabs-bar" style="margin-top:0"><div class="container"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="overview">Overview</button>' +
    '<button class="tab-btn" data-tab="percentile">Percentile Stats</button>' +
    '<button class="tab-btn" data-tab="season">Season Stats</button>' +
    '<button class="tab-btn" data-tab="zone">Strike Zone</button>' +
    '<button class="tab-btn" data-tab="splits">Splits</button>' +
    (type === 'pitcher' ? '<button class="tab-btn" data-tab="usage">Pitch Usage</button>' : '') +
    '</div></div></div>' +

    '<div class="container" style="padding-top:32px;padding-bottom:80px"><div id="season-filter-bar"></div><div id="player-tab-content"></div></div>';

  if (team) {
    document.getElementById('player-hero-bg').style.background =
      'radial-gradient(ellipse 80% 60% at 20% 50%, ' + hexToRgba(team.primaryColor, 0.18) + ' 0%, transparent 70%)';
  }

  const hl = document.getElementById('headline-stats');
  if (type === 'batter') {
    var pbpB = getPbpBatter(name);
    var _iblBat = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0; });
    var _iblBatS = _iblBat.length ? _iblBat[0] : null;
    var dispAVG = _iblBatS && _iblBatS.AVG != null ? fmt3(_iblBatS.AVG) : (pbpB ? fmt3(pbpB.AVG) : (sum ? fmt3(sum.AVG) : '—'));
    var dispOPS = _iblBatS && _iblBatS.OPS != null ? fmt3(_iblBatS.OPS) : (pbpB ? fmt3(pbpB.OPS) : (sum ? fmt3(sum.OPS) : '—'));
    var dispHR  = getSeasonHR(name)  != null ? fmtN(getSeasonHR(name))  : (pbpB ? fmtN(pbpB.HR)  : (sum ? fmtN(sum.HR)  : '—'));
    var dispRBI = getSeasonRBI(name) != null ? fmtN(getSeasonRBI(name)) : '—';
    [['AVG', dispAVG], ['OPS', dispOPS], ['HR', dispHR], ['RBI', dispRBI]].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  } else if (type === 'pitcher' && pitchData && pitchData.scatter) {
    const sc  = pitchData.scatter;
    const tot = sc.filter(function(s) { return s.outcome && s.outcome !== ''; }).length;
    const ks  = sc.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = sc.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    const strPct = tot > 0 ? Math.round(sc.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length / tot * 100) : 0;
    const pd = DATA.pitchers.find(function(p) { return p.pitcher === name; }) || {};
    // ERA from IBL history (most recent season with IP)
    const iblP = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
    var pbpP = getPbpPitcher(name);
    var _iblPit = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
    var _iblPitS = _iblPit.length ? _iblPit[0] : null;
    const hlIP   = _iblPitS && _iblPitS.IP   != null ? fmtIP(_iblPitS.IP) : (pbpP ? fmtIP(pbpP.IP) : (pd.IP != null ? fmtIP(pd.IP) : '—'));
    const hlERA  = _iblPitS && _iblPitS.ERA  != null ? fmt2(_iblPitS.ERA)  : (pbpP ? fmt2(pbpP.ERA)  : '—');
    const hlWHIP = _iblPitS && _iblPitS.WHIP != null ? fmt2(_iblPitS.WHIP) : (pbpP ? fmt2(pbpP.WHIP) : '—');
    const hlKpct = pbpP ? fmt1(pbpP.K_pct)+'%' : '—';
    [['IP', hlIP], ['ERA', hlERA], ['WHIP', hlWHIP], ['K%', hlKpct]].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  }

  const tabContent = document.getElementById('player-tab-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function activateTab(t) {
    tabs.forEach(function(tb) { tb.classList.toggle('active', tb.dataset.tab === t); });
    tabContent.innerHTML = '';
    var panel = document.createElement('div');
    panel.className = 'fade-up';
    if (t === 'overview')   panel.innerHTML = renderOverview(name, type, sum, pitchData, playerInfo, activeSeasonFilter);
    if (t === 'percentile') panel.innerHTML = renderPercentileStats(name, type, sum, pitchData, activeSeasonFilter);
    if (t === 'season')   panel.innerHTML = renderSeasonStats(name, type, sum, pitchData);
    if (t === 'splits') {
      panel.innerHTML = renderSplits(name, type, pitchData, activeSeasonFilter);
      var allPoints = [];
      if (type === 'batter' && pitchData && pitchData.scatter) {
        allPoints = pitchData.scatter;
      } else if (type === 'pitcher') {
        DATA.pitches.forEach(function(bp) {
          if (!bp.scatter) return;
          bp.scatter.forEach(function(s) { if (s.pitcher === name) allPoints.push(s); });
        });
      }
      panel.querySelectorAll('.splits-hand-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          panel.querySelectorAll('.splits-hand-btn').forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          var hand = btn.dataset.hand;
          var filtered = hand === 'all' ? allPoints : allPoints.filter(function(s) {
            var field = type === 'batter' ? (s.pitcher_side || '') : (s.batter_side || s.side || '');
            return field === hand;
          });
          panel.querySelector('#splits-tables').innerHTML = buildSplitsTables(filtered);
        });
      });
    }
    tabContent.appendChild(panel);
    if (t === 'zone')     renderZone(name, type, pitchData, panel, activeSeasonFilter);
    if (t === 'usage')    panel.innerHTML = renderPitchUsage(name, pitchData);
    setTimeout(function() {
      panel.querySelectorAll('.sbr-fill').forEach(function(el) {
        if (el.dataset.width) el.style.width = el.dataset.width;
      });
      panel.querySelectorAll('.savant-bubble').forEach(function(el) {
        if (el.dataset.left) el.style.left = el.dataset.left;
      });
    }, 60);
  }

  tabs.forEach(function(tb) { tb.addEventListener('click', function() { activateTab(tb.dataset.tab); }); });

  // ── Season filter — years from datadiamond scatter dates ─────────────────────
  var _seenYears = {};
  var _allSeasonOpts = [];

  // Collect scatter points
  var _ddScatter = [];
  if (pitchData && pitchData.scatter) {
    _ddScatter = pitchData.scatter;
  }
  if (type === 'pitcher') {
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) _ddScatter.push(s); });
    });
  }

  // Extract years from scatter dates
  _ddScatter.forEach(function(s) {
    var d = s.date || s.Date || s.game_date || '';
    if (!d) return;
    var yr;
    d = String(d);
    // Handle YYYY-MM-DD
    if (d.length === 10 && d[4] === '-') {
      yr = d.slice(0, 4);
    // Handle DD-Mon-YY e.g. "01-Jun-25"
    } else {
      var parts = d.split('-');
      if (parts.length === 3 && parts[2].length === 2) yr = '20' + parts[2];
    }
    if (!yr || !/^\d{4}$/.test(yr) || _seenYears[yr]) return;
    _seenYears[yr] = true;
    _allSeasonOpts.push({ label: yr, year: yr });
  });

  // Fallback: if no scatter dates, pull years from iblHistory
  if (!_allSeasonOpts.length) {
    (DATA.iblHistory[name] || []).forEach(function(s) {
      if (!s.season) return;
      var m = s.season.match(/(\d{4})/);
      if (!m) return;
      var yr = m[1];
      var hasData = type === 'pitcher' ? s.IP > 0 : s.AB > 0;
      if (!hasData || _seenYears[yr]) return;
      _seenYears[yr] = true;
      _allSeasonOpts.push({ label: yr, year: yr });
    });
  }

  _allSeasonOpts.sort(function(a, b) { return parseInt(b.year) - parseInt(a.year); });

  // Always ensure 2025 is present
  if (!_allSeasonOpts.find(function(o){ return o.year === '2025'; })) {
    _allSeasonOpts.push({ label: '2025', year: '2025' });
    _allSeasonOpts.sort(function(a, b) { return parseInt(b.year) - parseInt(a.year); });
  }

  // Default to 2025
  var activeSeasonFilter = '2025';
  var currentTab = 'overview';

  function renderSeasonFilterBar(activeTab) {
    var _filterBar = document.getElementById('season-filter-bar');
    if (!_filterBar) return;
    if (!_allSeasonOpts.length) { _filterBar.innerHTML = ''; return; }
    var SEASON_TABS = ['overview', 'percentile', 'zone', 'splits'];
    if (!SEASON_TABS.includes(activeTab)) { _filterBar.innerHTML = ''; return; }

    function btnStyle(active) {
      return 'font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;' +
             'padding:5px 14px;border-radius:4px;cursor:pointer;transition:all .15s;' +
             'border:1px solid ' + (active ? '#FFB81C' : 'rgba(255,255,255,0.1)') + ';' +
             'background:' + (active ? 'rgba(255,184,28,0.12)' : 'rgba(255,255,255,0.03)') + ';' +
             'color:' + (active ? '#FFB81C' : 'rgba(255,255,255,0.4)') + ';';
    }
    var btns = _allSeasonOpts.map(function(opt) {
      return '<button style="' + btnStyle(activeSeasonFilter === opt.year) + '" data-sf="' + opt.year + '">' + opt.year + '</button>';
    }).join('');

    _filterBar.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 0 14px;border-bottom:1px solid rgba(255,255,255,0.05)">' +
      '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.25);text-transform:uppercase;white-space:nowrap">Season</span>' +
      '<div style="display:flex;gap:6px">' + btns + '</div></div>';

    _filterBar.querySelectorAll('[data-sf]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        activeSeasonFilter = btn.dataset.sf;
        activateTab(currentTab);
      });
    });
  }

  var _origActivate = activateTab;
  activateTab = function(t) {
    currentTab = t;
    renderSeasonFilterBar(t);
    _origActivate(t);
  };

  // Render the filter bar (only show for tabs that use it)
  activateTab('overview');
}

// ── OVERVIEW TAB ──────────────────────────────────
function renderOverview(name, type, sum, pitch, playerInfo, seasonFilter) {
  seasonFilter = seasonFilter || 'all';
  var pi  = playerInfo || {};
  var pbpB = getPbpBatter(name);
  // Filter scatter by season
  var _scRaw = (pitch && pitch.scatter) ? pitch.scatter : [];
  var sc = seasonFilter === 'all' ? _scRaw : _scRaw.filter(function(s){
    if (!s.date) return true;
    // Handle YYYY-MM-DD format
    if (s.date.length === 10 && s.date[4] === '-') return s.date.slice(0,4) === seasonFilter;
    // Handle DD-Mon-YY format e.g. "01-Jun-25"
    var parts = s.date.split('-');
    if (parts.length === 3 && parts[2].length === 2) {
      return ('20' + parts[2]) === seasonFilter;
    }
    return true;
  });
  // For overview, also pick the right iblHistory season row
  var _ovIblAll = DATA.iblHistory[name] || [];
  var _ovIblSeason = seasonFilter === 'all'
    ? (_ovIblAll.filter(function(s){ return (type==='batter'?s.AB:s.IP) > 0; })[0] || null)
    : (_ovIblAll.find(function(s){ return s.season && s.season.indexOf(seasonFilter) !== -1; }) || null);
  var pbpP = getPbpPitcher(name);

  // ── Shared percentile helper ───────────────────
  function pctRank(val, arr) {
    if (!arr.length || val == null) return null;
    var below = arr.filter(function(v){ return v < val; }).length;
    var equal = arr.filter(function(v){ return v === val; }).length;
    return (below + equal * 0.5) / arr.length;
  }

  // ── Zone / pitch-type helpers ──────────────────
  var IN_PLAY = ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'];
  var HITS    = ['Single','Double','Triple','Home Run'];
  var KS      = ['Strikeout Swinging','Strikeout Looking'];

  function zoneWhiff(pts) {
    var swings = pts.filter(function(s){ return ['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome); }).length;
    var whiffs  = pts.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
    return swings >= 5 ? whiffs / swings : null;
  }
  function zoneBA(pts) {
    var ab = pts.filter(function(s){ return IN_PLAY.concat(KS).includes(s.outcome); }).length;
    var h  = pts.filter(function(s){ return HITS.includes(s.outcome); }).length;
    return ab >= 5 ? h / ab : null;
  }
  function lgArr(filterFn, metricFn) {
    var arr = [];
    DATA.pitches.forEach(function(bp) {
      var pts = (bp.scatter || []).filter(function(s){ return s.x != null && s.y != null && filterFn(s); });
      var v = metricFn(pts);
      if (v != null) arr.push(v);
    });
    return arr;
  }

  // ── Tier classifier ────────────────────────────
  function tier(pct, higherIsBetter) {
    if (pct == null) return null;
    var p = higherIsBetter ? pct : (1 - pct);
    if (p >= 0.90) return 'elite';
    if (p >= 0.80) return 'strong';
    if (p <= 0.10) return 'poor';
    if (p <= 0.20) return 'weak';
    return null;
  }

  // ── Collect all findings ───────────────────────
  var positives = [];   // elite / strong
  var negatives = [];   // poor / weak
  var approach  = [];   // location / pitch-type notes (any tier)

  function addInsight(bucket, label, value, note) {
    bucket.push({ label: label, value: value, note: note });
  }

  function evalStat(label, val, pct, hi, notes, bucket_override) {
    if (val === '\u2014' || pct == null) return;
    var t = tier(pct, hi);
    if (!t || !notes[t]) return;
    var note = notes[t];
    var bucket = bucket_override ||
      (t === 'elite' || t === 'strong' ? positives : negatives);
    addInsight(bucket, label, val, note);
  }

  function evalZone(label, val, pct, hi, goodNote, badNote) {
    if (val === '\u2014' || pct == null) return;
    var t = tier(pct, hi);
    if (!t) return;
    var note = (t === 'elite' || t === 'strong') ? goodNote : badNote;
    if (!note) return;
    addInsight(approach, label, val, note);
  }

  // ══════════════════════════════
  // BATTER DATA
  // ══════════════════════════════
  if (type === 'batter') {
    var scB = sc.filter(function(s){ return s.x != null && s.y != null; });
    var side = scB.length ? (scB[0].batter_side || 'R') : 'R';
    var insideFn  = side === 'R' ? function(s){ return s.y < -0.1; } : function(s){ return s.y > 0.1; };
    var outsideFn = side === 'R' ? function(s){ return s.y >  0.1; } : function(s){ return s.y < -0.1; };
    var highFn    = function(s){ return s.x > 0.6; };
    var lowFn     = function(s){ return s.x < 0.35; };
    var inZoneFn  = function(s){ return s.y >= -1 && s.y <= 1 && s.x >= 0 && s.x <= 1; };
    var oozFn     = function(s){ return !inZoneFn(s); };

    // ── PBP-based stats (preferred) ───────────────
    var d = pbpB;  // getPbpBatter(name) — set at top of renderOverview
    var lgB = buildPbpBatterLeague();

    function pctRankB(val, arr) {
      if (!arr || !arr.length || val == null) return null;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    // Slash line — use pbpB if available, else sum
    var srcAVG = d ? d.AVG  : (sum ? sum.AVG  : null);
    var srcOBP = d ? d.OBP  : (sum ? sum.OBP  : null);
    var srcSLG = d ? d.SLG  : (sum ? sum.SLG  : null);
    var srcOPS = d ? d.OPS  : (sum ? sum.OPS  : null);
    var srcHR  = getSeasonHR(name)  != null ? getSeasonHR(name)  : (d ? d.HR  : (sum ? sum.HR  : null));
    var srcRBI = getSeasonRBI(name) != null ? getSeasonRBI(name) : null;

    var lgAvg  = d ? lgB.avg  : []; var lgObp = d ? lgB.obp  : [];
    var lgSlg  = d ? lgB.slg  : []; var lgOps = d ? lgB.ops  : [];
    var lgHr   = DATA.pbpBatters.filter(function(p){ return p.AB>=5; }).map(function(p){ return p.HR||0; });
    var lgRbi  = DATA.iblHistory ? Object.values(DATA.iblHistory).map(function(seasons){
      var s = (seasons||[]).filter(function(s){ return s.AB > 0; });
      return s.length && s[0].RBI != null ? s[0].RBI : null;
    }).filter(function(v){ return v != null; }) : [];

    evalStat('AVG', srcAVG != null ? fmt3(srcAVG) : '—', pctRankB(srcAVG, lgAvg), true,
      { elite:'Hitting at an outstanding rate — one of the best averages in the league.', strong:'Solid contact rate, well above the league average.',
        weak:'Below-average batting average — contact consistency is a concern.', poor:'Struggling to make consistent contact, one of the lowest averages in the league.' });
    evalStat('OBP', srcOBP != null ? fmt3(srcOBP) : '—', pctRankB(srcOBP, lgObp), true,
      { elite:'Gets on base at an elite rate — rarely makes an easy out.', strong:'Consistently reaches base above the league average.',
        weak:'On-base percentage is below average — makes outs at a high rate.', poor:'Very low on-base percentage, one of the worst in the league.' });
    evalStat('SLG', srcSLG != null ? fmt3(srcSLG) : '—', pctRankB(srcSLG, lgSlg), true,
      { elite:'Exceptional power numbers — driving the ball with elite authority.', strong:'Above-average slugger with real extra-base pop.',
        weak:'Below-average slugging — lacks extra-base hit production.', poor:'Very low slugging percentage, struggles to drive the ball with power.' });
    evalStat('OPS', srcOPS != null ? fmt3(srcOPS) : '—', pctRankB(srcOPS, lgOps), true,
      { elite:'Elite overall offensive production — top-tier combination of on-base and power.', strong:'Above-average run producer combining OBP and slugging effectively.',
        weak:'Below-average overall offensive output.', poor:'Among the lowest OPS in the league — struggles getting on base and driving the ball.' });
    evalStat('HR',  srcHR  != null ? fmtN(srcHR)  : '—', pctRankB(srcHR,  lgHr),  true,
      { elite:'Among the league leaders in home runs — a genuine power threat.', strong:'Above-average home run production.', weak:null, poor:null });
    if (srcRBI != null) evalStat('RBI', fmtN(srcRBI), pctRankB(srcRBI, lgRbi), true,
      { elite:'Among the league leaders in RBI — a true run producer.', strong:'Above-average RBI production — driving in runs consistently.',
        weak:'Below-average RBI total — struggling to drive in runners.', poor:'One of the lowest RBI totals in the league.' });

    // ── Discipline stats from PBP ─────────────────
    if (d) {
      evalStat('SWING%',    d.SWING_pct   != null ? fmt1(d.SWING_pct)+'%'   : '—', pctRankB(d.SWING_pct,   lgB.swing),   false,
        { weak:'Passive approach — below-average swing rate, letting a lot of pitches go.', poor:'One of the lowest swing rates in the league — very selective, rarely offers.' });
      evalStat('WHIFF%',    d.WHIFF_pct   != null ? fmt1(d.WHIFF_pct)+'%'   : '—', d.WHIFF_pct != null ? 1-pctRankB(d.WHIFF_pct, lgB.whiff) : null, true,
        { elite:'Excellent bat-to-ball skills — one of the lowest whiff rates in the league.', strong:'Above-average contact rate on swings.',
          weak:'High whiff rate — misses on a significant portion of swings.', poor:'One of the highest whiff rates in the league — struggles to make bat-on-ball contact.' });
      evalStat('K%',        d.K_pct       != null ? fmt1(d.K_pct)+'%'       : '—', d.K_pct != null ? 1-pctRankB(d.K_pct, lgB.kpct) : null, true,
        { elite:'Exceptional strikeout avoidance — one of the hardest to put away in the league.', strong:'Below-average strikeout rate — makes consistent contact.',
          weak:'Strikeout rate is elevated — pitchers are regularly putting this hitter away.', poor:'One of the highest strikeout rates in the league — a major vulnerability.' });
      evalStat('BB%',       d.BB_pct      != null ? fmt1(d.BB_pct)+'%'      : '—', pctRankB(d.BB_pct,      lgB.bbpct),   true,
        { elite:'Outstanding plate discipline — draws walks at an elite rate.', strong:'Above-average walk rate, shows good patience at the plate.',
          weak:'Low walk rate — rarely works counts or forces free passes.', poor:'Almost never walks — an aggressive approach that pitchers can exploit.' });
      evalStat('PS/PA',     d.PS_PA       != null ? fmt2(d.PS_PA)           : '—', pctRankB(d.PS_PA,       lgB.pspa),    true,
        { elite:'Sees an elite number of pitches per PA — works counts to exhaustion.', strong:'Above-average pitch count per PA — runs up counts and tires pitchers.',
          weak:'Below-average pitches per PA — tends to swing early in counts.', poor:'One of the lowest PS/PA in the league — very first-pitch aggressive.' });
      evalStat('CONTACT%',  d.CONTACT_pct != null ? fmt1(d.CONTACT_pct)+'%' : '—', pctRankB(d.CONTACT_pct, lgB.contact), true,
        { elite:'Elite bat-to-ball ability — makes contact at one of the highest rates in the league.', strong:'Above-average contact rate — consistently puts the ball in play.',
          weak:'Below-average contact rate — missing more often than most hitters.', poor:'Struggles to make contact on swings — one of the lowest contact rates in the league.' });
      evalStat('GB%',       d.GB_pct      != null ? fmt1(d.GB_pct)+'%'      : '—', d.GB_pct != null ? 1-pctRankB(d.GB_pct, lgB.gb) : null, true,
        { elite:'Excellent ground ball avoidance — hits the ball in the air consistently.', strong:'Above-average tendency to avoid ground balls.',
          weak:'Heavy ground ball hitter — limiting extra-base potential.', poor:'One of the highest ground ball rates — nearly everything stays on the ground.' });
      evalStat('FB%',       d.FB_pct      != null ? fmt1(d.FB_pct)+'%'      : '—', pctRankB(d.FB_pct,      lgB.fb),      true,
        { elite:'Elite fly ball rate — generates air contact at a top-tier rate.', strong:'Above-average fly ball rate — good power profile.',
          weak:null, poor:null });
      evalStat('FP SWING%', d.FP_SWING_pct!= null ? fmt1(d.FP_SWING_pct)+'%': '—', d.FP_SWING_pct != null ? 1-pctRankB(d.FP_SWING_pct, lgB.fpSwing) : null, true,
        { elite:'Takes first pitches at an elite rate — forces pitchers to throw strikes.', strong:'Patient on first pitches — works deeper into counts.',
          weak:'Swings at first pitches frequently — pitchers can get ahead cheaply.', poor:'One of the most aggressive first-pitch hitters — almost always offers.' });
    } else {
      // Fallback to scatter-based stats if no PBP data
      var totP = sc.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
      var swStr = sc.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
      var fouls = sc.filter(function(s){ return s.outcome === 'Foul'; }).length;
      var ipAll = sc.filter(function(s){ return IN_PLAY.includes(s.outcome); }).length;
      var swings = swStr + fouls + ipAll;
      var ks  = sc.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
      var bbs = sc.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
      var pa  = sum ? (sum.PA || (sum.AB + (sum.BB||0) + (sum.HBP||0) + (sum.SF||0)) || 1) : 1;
      var mySwing = totP > 0 ? swings/totP : null;
      var myWhiff = swings > 0 ? swStr/swings : null;
      var myK  = pa > 0 ? ks/pa : null;
      var myBB = pa > 0 ? bbs/pa : null;
      var lgSwing=[]; var lgWhiff=[]; var lgK=[]; var lgBB=[];
      DATA.pitches.forEach(function(bp){
        var s2=bp.scatter||[]; var t2=s2.filter(function(s){return s.outcome&&s.outcome!=='';}).length; if(!t2)return;
        var sw2=s2.filter(function(s){return s.outcome==='Swinging Strike';}).length;
        var fo2=s2.filter(function(s){return s.outcome==='Foul';}).length;
        var ip2=s2.filter(function(s){return IN_PLAY.includes(s.outcome);}).length;
        var sw2t=sw2+fo2+ip2;
        lgSwing.push(t2>0?sw2t/t2:0);
        if(sw2t>0) lgWhiff.push(sw2/sw2t);
      });
      DATA.summary.forEach(function(p){
        if(!p.AB||p.AB<5)return;
        var pPA=p.PA||(p.AB+(p.BB||0)+(p.HBP||0)+(p.SF||0))||1;
        lgK.push((p.K||0)/pPA); lgBB.push((p.BB||0)/pPA);
      });
      evalStat('SWING%', mySwing!=null?fmt1(mySwing*100)+'%':'—', pctRank(mySwing,lgSwing), true,
        { elite:'Attacks pitches at an elite rate.', strong:'Above-average swing rate.',
          weak:'Passive approach — below-average swing rate.', poor:'One of the lowest swing rates in the league.' });
      evalStat('WHIFF%', myWhiff!=null?fmt1(myWhiff*100)+'%':'—', pctRank(myWhiff,lgWhiff), false,
        { weak:'High whiff rate — misses on a significant portion of swings.', poor:'One of the highest whiff rates — struggles to make contact.' });
      evalStat('K%',     myK!=null?fmt1(myK*100)+'%':'—',         pctRank(myK,lgK),         false,
        { weak:'Strikeout rate is elevated.', poor:'One of the highest strikeout rates in the league.' });
      evalStat('BB%',    myBB!=null?fmt1(myBB*100)+'%':'—',        pctRank(myBB,lgBB),       true,
        { elite:'Outstanding plate discipline.', strong:'Above-average walk rate.',
          weak:'Low walk rate.', poor:'Almost never walks.' });
    }

    // In-zone / chase from scatter (datadiamond only — needs x/y coords)
    var inZonePts    = scB.filter(inZoneFn);
    var inZoneSwings = inZonePts.filter(function(s){ return ['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome); }).length;
    var inZoneCon    = inZonePts.filter(function(s){ return ['Foul'].concat(IN_PLAY).includes(s.outcome); }).length;
    var oozPts  = scB.filter(oozFn);
    var chases  = oozPts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;
    var myIzSwing = inZonePts.length  ? inZoneSwings / inZonePts.length : null;
    var myIzCon   = inZoneSwings > 0  ? inZoneCon    / inZoneSwings     : null;
    var myChase   = oozPts.length > 0 ? chases        / oozPts.length   : null;
    var lgIzSwing=[]; var lgIzCon=[]; var lgChase=[];
    DATA.pitches.forEach(function(bp){
      var s2=bp.scatter||[];
      var iz2=s2.filter(function(s){return s.y!=null&&s.x!=null&&s.y>=-1&&s.y<=1&&s.x>=0&&s.x<=1;});
      var izSw2=iz2.filter(function(s){return['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var izCon2=iz2.filter(function(s){return['Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var ooz2=s2.filter(function(s){return s.y!=null&&s.x!=null&&(s.y<-1||s.y>1||s.x<0||s.x>1);});
      var ch2=ooz2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul';}).length;
      if(iz2.length>0)  lgIzSwing.push(izSw2/iz2.length);
      if(izSw2>0)       lgIzCon.push(izCon2/izSw2);
      if(ooz2.length>0) lgChase.push(ch2/ooz2.length);
    });
    evalStat('IZ SWING%',   myIzSwing!=null?fmt1(myIzSwing*100)+'%':'—', pctRank(myIzSwing,lgIzSwing), true,
      { elite:'Attacks pitches in the zone at an elite rate.', strong:'Above-average zone swing rate — recognizes and attacks strikes.',
        weak:'Below-average zone swing rate — taking more strikes than most hitters.', poor:'One of the lowest in-zone swing rates — frequently lets hittable pitches pass.' });
    evalStat('IZ CONTACT%', myIzCon!=null?fmt1(myIzCon*100)+'%':'—',     pctRank(myIzCon,lgIzCon),   true,
      { elite:'Exceptional in-zone contact — rarely misses a pitch in the strike zone.', strong:'Above-average contact rate on pitches in the zone.',
        weak:'Below-average in-zone contact — missing strikes more often than most.', poor:'Struggles significantly to make contact on pitches in the strike zone.' });
    evalStat('CHASE%',      myChase!=null?fmt1(myChase*100)+'%':'—',      pctRank(myChase,lgChase),   false,
      { weak:'Chases pitches out of the zone at an above-average rate.', poor:'One of the highest chase rates in the league — easily baited outside the strike zone.' });

    // Zone / pitch-type approach checks
    var ZONE_CHECKS = [
      { label:'Inside', fn:insideFn }, { label:'Away', fn:outsideFn },
      { label:'Up in Zone', fn:highFn }, { label:'Low in Zone', fn:lowFn },
      { label:'Out of Zone', fn:oozFn }
    ];
    ZONE_CHECKS.forEach(function(zc) {
      var pts=scB.filter(zc.fn), myW=zoneWhiff(pts), myBA=zoneBA(pts);
      var lgW=lgArr(zc.fn,zoneWhiff), lgBA=lgArr(zc.fn,zoneBA);
      evalZone(zc.label+' WHIFF%', myW!=null?fmt1(myW*100)+'%':'—', pctRank(myW,lgW), false,
        null, 'Whiffs at an above-average rate on pitches '+zc.label.toLowerCase()+' — a location pitchers are exploiting.');
      evalZone(zc.label+' AVG', myBA!=null?fmt3(myBA):'—', pctRank(myBA,lgBA), true,
        'Strong production on pitches '+zc.label.toLowerCase()+' — a clear hitting strength.',
        'Struggles to produce on pitches '+zc.label.toLowerCase()+' — a notable weakness.');
    });
    var pitchTypes=[];
    scB.forEach(function(s){ if(s.pitch_type&&!pitchTypes.includes(s.pitch_type))pitchTypes.push(s.pitch_type); });
    pitchTypes.forEach(function(pt) {
      var ptFn=function(s){return s.pitch_type===pt;};
      var pts=scB.filter(ptFn); if(pts.length<6)return;
      var myW=zoneWhiff(pts), myBA=zoneBA(pts), lgW=lgArr(ptFn,zoneWhiff), lgBA=lgArr(ptFn,zoneBA);
      evalZone(pt+' WHIFF%', myW!=null?fmt1(myW*100)+'%':'—', pctRank(myW,lgW), false,
        null, 'Whiffs at an above-average rate against the '+pt+' — pitchers are using it to their advantage.');
      evalZone(pt+' AVG', myBA!=null?fmt3(myBA):'—', pctRank(myBA,lgBA), true,
        'Above-average production against the '+pt+' — handles it well.',
        'Struggles against the '+pt+' — a hole in the swing pitchers can attack.');
      var COMBOS=[
        {label:'Inside & Up',fn:function(s){return insideFn(s)&&highFn(s);}},
        {label:'Inside & Low',fn:function(s){return insideFn(s)&&lowFn(s);}},
        {label:'Away & Up',fn:function(s){return outsideFn(s)&&highFn(s);}},
        {label:'Away & Low',fn:function(s){return outsideFn(s)&&lowFn(s);}}
      ];
      COMBOS.forEach(function(cz) {
        var fn=function(s){return s.pitch_type===pt&&cz.fn(s);};
        var cpts=scB.filter(fn); if(cpts.length<5)return;
        var cW=zoneWhiff(cpts), cBA=zoneBA(cpts), lcW=lgArr(fn,zoneWhiff), lcBA=lgArr(fn,zoneBA);
        evalZone(pt+' · '+cz.label+' WHIFF%', cW!=null?fmt1(cW*100)+'%':'—', pctRank(cW,lcW), false,
          null, 'Extremely high whiff rate on '+pt+' '+cz.label.toLowerCase()+' — a reliable put-away spot for pitchers.');
        evalZone(pt+' · '+cz.label+' AVG', cBA!=null?fmt3(cBA):'—', pctRank(cBA,lcBA), true,
          'Exceptional production on '+pt+' '+cz.label.toLowerCase()+' — a true damage zone.',
          'Near-zero production on '+pt+' '+cz.label.toLowerCase()+' — pitchers should go here.');
      });
    });
  }

  // ══════════════════════════════
  // PITCHER DATA
  // ══════════════════════════════
  if (type === 'pitcher') {
    var scP  = sc.filter(function(s){ return s.x != null && s.y != null; });
    var pd   = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
    var pbpPO = getPbpPitcher(name) || {};
    var tot  = sc.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
    var ks   = sc.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    var bbs  = sc.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    var str  = sc.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    var swS  = sc.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
    var ipO  = sc.filter(function(s){ return IN_PLAY.includes(s.outcome); }).length;
    var fo   = sc.filter(function(s){ return s.outcome === 'Foul'; }).length;
    var swings = swS + fo + ipO;
    var pdH  = sc.filter(function(s){ return HITS.includes(s.outcome); }).length;

    var myStr   = tot > 0    ? str / tot    : null;
    var mySwing = tot > 0    ? swings / tot : null;
    var myWhiff = swings > 0 ? swS / swings : null;
    var myK     = tot > 0    ? ks / tot     : null;
    var myBB    = tot > 0    ? bbs / tot    : null;
    var myEA    = pbpPO.EA_pct != null ? pbpPO.EA_pct : (pd.EA_pct  != null ? pd.EA_pct : null);
    var myKBB   = pbpPO.K_BB   != null ? pbpPO.K_BB   : (pd.K_BB    != null ? pd.K_BB   : null);

    var era    = getSeasonERA(name);
    var whip   = pd.IP > 0 ? (bbs + pdH) / pd.IP : null;
    var baAgst = (function(){
      var ab=sc.filter(function(s){return IN_PLAY.concat(KS).includes(s.outcome);}).length;
      var h=sc.filter(function(s){return HITS.includes(s.outcome);}).length;
      return ab>=5?h/ab:null;
    })();

    var lgP = { str:[], swing:[], whiff:[], k:[], bb:[], ea:[], kbb:[], era:[], whip:[], baAgst:[], ip:[] };
    DATA.pitches.forEach(function(bp){
      var sc2=bp.scatter||[]; var t2=sc2.filter(function(s){return s.outcome&&s.outcome!=='';}).length; if(!t2)return;
      var ks2=sc2.filter(function(s){return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking';}).length;
      var bbs2=sc2.filter(function(s){return s.outcome==='Walk'||s.outcome==='Intentional Walk';}).length;
      var str2=sc2.filter(function(s){return['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome);}).length;
      var sw2=sc2.filter(function(s){return s.outcome==='Swinging Strike';}).length;
      var ip2=sc2.filter(function(s){return IN_PLAY.includes(s.outcome);}).length;
      var fo2=sc2.filter(function(s){return s.outcome==='Foul';}).length;
      var sw2t=sw2+fo2+ip2;
      var h2=sc2.filter(function(s){return HITS.includes(s.outcome);}).length;
      var ab2=sc2.filter(function(s){return IN_PLAY.concat(KS).includes(s.outcome);}).length;
      var pname2=sc2[0]&&sc2[0].pitcher;
      var pd2=pname2?(DATA.pitchers.find(function(p){return p.pitcher===pname2;})||{}):{}; 
      lgP.str.push(str2/t2); lgP.swing.push(sw2t/t2);
      if(sw2t>0)lgP.whiff.push(sw2/sw2t);
      lgP.k.push(ks2/t2); lgP.bb.push(bbs2/t2);
      if(pd2.EA_pct!=null)lgP.ea.push(pd2.EA_pct);
      if(pd2.K_BB!=null)lgP.kbb.push(pd2.K_BB);
      if(ab2>=5)lgP.baAgst.push(h2/ab2);
      if(pd2.IP>0)lgP.whip.push((bbs2+h2)/pd2.IP);
      if(pd2.IP>0)lgP.ip.push(pd2.IP);
      var ibl2=(DATA.iblHistory[pname2]||[]).filter(function(s){return s.IP>0;});
      if(ibl2.length&&ibl2[0].ERA!=null)lgP.era.push(ibl2[0].ERA);
    });

    evalStat('STR%',     myStr!=null  ?fmt1(myStr*100)+'%'  :'—', pctRank(myStr,lgP.str),    true,
      { elite:'OUTSTANDING strike thrower — working ahead and in the zone at an elite rate. The foundation of good pitching.', strong:'Above-average strike rate — commanding the zone and putting hitters on the defensive.',
        weak:'CONCERN: Below-average strike rate — falling behind in counts too often. Must improve strike-throwing or walks will follow.', poor:'RED FLAG: Very low strike rate — one of the least accurate pitchers in the league. Walks and long counts are destroying effectiveness.' });
    evalStat('SWING%',   mySwing!=null?fmt1(mySwing*100)+'%':'—', pctRank(mySwing,lgP.swing), true,
      { elite:'Induces swings at an elite rate — hitters cannot lay off.', strong:'Above-average induced swing rate — forcing hitters to offer.',
        weak:'Below-average induced swing rate — hitters comfortable taking pitches.', poor:'One of the lowest induced swing rates — hitters lay off consistently.' });
    evalStat('WHIFF%',   myWhiff!=null?fmt1(myWhiff*100)+'%':'—', pctRank(myWhiff,lgP.whiff), true,
      { elite:'Elite swing-and-miss stuff — one of the most unhittable pitchers in the league.', strong:'Above-average whiff rate — pitches hitters struggle to square up.',
        weak:'Below-average whiff rate — hitters squaring up swings too often.', poor:'Very few whiffs generated — hitters putting the ball in play on nearly every swing.' });
    evalStat('K%',       myK!=null    ?fmt1(myK*100)+'%'    :'—', pctRank(myK,lgP.k),        true,
      { elite:'Elite strikeout rate — one of the most dominant put-away pitchers in the league.', strong:'Above-average ability to finish hitters with strikeouts.',
        weak:'Below-average strikeout rate — needs better put-away pitches to finish hitters.', poor:'Very low strikeout rate — struggles to put hitters away once ahead in the count.' });
    evalStat('BB%',      myBB!=null   ?fmt1(myBB*100)+'%'   :'—', myBB!=null ? 1-pctRank(myBB,lgP.bb) : null, true,
      { elite:'Elite command — walks almost nobody. The mark of a true strike thrower.', strong:'Low walk rate — rarely giving free passes, staying ahead and in control.',
        weak:'RED FLAG: Walk rate is elevated — free passes are killing innings. Must throw strikes and challenge hitters.', poor:'CRITICAL ISSUE: One of the highest walk rates in the league. Walks are unacceptable — must attack the zone.' });
    evalStat('E+A%',     myEA!=null   ?fmt1(myEA)+'%'       :'—', pctRank(myEA,lgP.ea),      true,
      { elite:'Works ahead in counts at an elite rate — dictates every at-bat from pitch one.', strong:'Consistently gets into advantageous counts early — a sign of excellent command.',
        weak:'Falls behind in counts too often — hitters dictate the at-bat. Must throw more first-pitch strikes.', poor:'Rarely gets ahead — almost never in the drivers seat. First-pitch strikes must be the priority.' });
    evalStat('K/BB',     myKBB!=null  ?fmt2(myKBB)          :'—', pctRank(myKBB,lgP.kbb),    true,
      { elite:'Outstanding K/BB ratio — strikes out hitters at a much higher rate than walking them. The ideal profile.', strong:'Good K/BB — strikeouts outpacing walks, a sign of quality command and stuff.',
        weak:'Low K/BB — walks are nearly cancelling out strikeouts. Must cut walks to let stuff play up.', poor:'Very poor K/BB — walks are undermining everything. Cannot allow free bases at this rate.' });
    evalStat('ERA',      era!=null    ?fmt2(era)             :'—', pctRank(era,lgP.era),      false,
      { weak:'ERA is above average — runs scoring at a higher-than-ideal rate.', poor:'One of the highest ERAs in the league — struggling to prevent runs consistently.' });
    evalStat('WHIP',     whip!=null   ?fmt2(whip)            :'—', pctRank(whip,lgP.whip),    false,
      { weak:'Elevated WHIP — too many baserunners per inning, often from walks.', poor:'One of the highest WHIPs in the league — walks and hits creating constant traffic on the bases.' });
    evalStat('BA AGNST', baAgst!=null ?fmt3(baAgst)          :'—', pctRank(baAgst,lgP.baAgst),false,
      { weak:'Hitters batting above average against this pitcher — making too much contact.', poor:'One of the highest batting averages against in the league — hitters consistently squaring the ball up.' });
    evalStat('IP',       pd.IP>0      ?fmtIP(pd.IP)          :'—', pctRank(pd.IP||0,lgP.ip),  true,
      { elite:'Elite innings pitched — a true workhorse, going deep into games and saving the bullpen.', strong:'Above-average innings total — consistently pitching deep into games.',
        weak:'Below-average innings total — often pitching in shorter stints.', poor:'One of the lowest innings pitched — limited workload this season.' });



    // Zone / pitch-type approach
    var pitchTypes=[];
    scP.forEach(function(s){if(s.pitch_type&&!pitchTypes.includes(s.pitch_type))pitchTypes.push(s.pitch_type);});
    // x = vertical (0=bottom, 1=top), y = horizontal (-1=left, 1=right catcher view)
    var inZoneFn=function(s){return s.y>=-1&&s.y<=1&&s.x>=0&&s.x<=1;};
    var PZONES=[
      {label:'Up in Zone',fn:function(s){return inZoneFn(s)&&s.x>0.6;}},
      {label:'Low in Zone',fn:function(s){return inZoneFn(s)&&s.x<0.35;}},
      {label:'Inside Edge',fn:function(s){return inZoneFn(s)&&s.y<-0.5;}},
      {label:'Outside Edge',fn:function(s){return inZoneFn(s)&&s.y>0.5;}},
      {label:'Out of Zone',fn:function(s){return!inZoneFn(s);}}
    ];
    pitchTypes.forEach(function(pt){
      var ptFn=function(s){return s.pitch_type===pt;};
      var pts=scP.filter(ptFn); if(pts.length<6)return;
      var myW=zoneWhiff(pts), myBA=zoneBA(pts), lgW=lgArr(ptFn,zoneWhiff), lgBA=lgArr(ptFn,zoneBA);
      evalZone(pt+' WHIFF%', myW!=null?fmt1(myW*100)+'%':'—', pctRank(myW,lgW), true,
        'The '+pt+' is generating elite whiffs — a true out-pitch.',
        'Hitters are squaring up the '+pt+' consistently — limited swing-and-miss.');
      evalZone(pt+' AVG AGNST', myBA!=null?fmt3(myBA):'—', pctRank(myBA,lgBA), false,
        null, 'Hitters are posting an above-average average against the '+pt+'.');
      PZONES.forEach(function(pz){
        var fn=function(s){return s.pitch_type===pt&&pz.fn(s);};
        var cpts=scP.filter(fn); if(cpts.length<5)return;
        var cW=zoneWhiff(cpts), lcW=lgArr(fn,zoneWhiff);
        evalZone(pt+' · '+pz.label, cW!=null?fmt1(cW*100)+'%':'—', pctRank(cW,lcW), true,
          pt+' '+pz.label.toLowerCase()+' is an elite weapon — hitters almost never make contact.',
          'Hitters handle the '+pt+' '+pz.label.toLowerCase()+' well — a spot to limit.');
      });
    });
  }

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════

  // ── Player identity card ───────────────────────
  var accentColor = pi.teamColor || '#FFB81C';
  var bioItems = [];
  if (pi.teamName) bioItems.push({ label: 'Team', val: pi.teamName });
  if (pi.pos && pi.pos !== '\u2014') bioItems.push({ label: 'Position', val: pi.pos });
  function fmtHand(h) { return h || '?'; }
  if (pi.bats || pi.throws) bioItems.push({ label: 'Bats / Throws', val: fmtHand(pi.bats)+' / '+fmtHand(pi.throws) });
  if (pi.height) bioItems.push({ label: 'Height', val: pi.height });
  if (pi.weight) bioItems.push({ label: 'Weight', val: pi.weight + ' lbs' });

  var identityCard = bioItems.length
    ? '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-top:2px solid ' + accentColor + ';border-radius:8px;padding:24px 28px;margin-bottom:24px;display:flex;flex-wrap:wrap;justify-content:center;gap:32px;align-items:center">' +
        bioItems.map(function(b) {
          return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px">' +
            '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase">' + b.label + '</div>' +
            '<div style="font-family:var(--font-mono);font-size:14px;color:#fff;font-weight:500;letter-spacing:0.04em">' + b.val + '</div>' +
          '</div>';
        }).join('<div style="width:1px;height:32px;background:rgba(255,255,255,0.08)"></div>') +
      '</div>'
    : '';

  // ── Section builder ────────────────────────────
  function makeSection(title, items, accentCol, emptyMsg) {
    var colorsMap = {
      green:  { bg: 'rgba(80,200,120,0.07)',  border: 'rgba(80,200,120,0.25)',  dot: '#50C878', label: 'rgba(80,200,120,0.9)'  },
      red:    { bg: 'rgba(220,50,50,0.07)',   border: 'rgba(220,50,50,0.25)',   dot: '#DC3232', label: 'rgba(220,80,80,0.9)'   },
      blue:   { bg: 'rgba(96,165,250,0.07)',  border: 'rgba(96,165,250,0.25)',  dot: '#60a5fa', label: 'rgba(130,185,255,0.9)' }
    };
    var C = colorsMap[accentCol] || colorsMap.blue;
    var inner = items.length
      ? items.map(function(item) {
          return '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.04)">' +
            '<div style="width:6px;height:6px;border-radius:50%;background:' + C.dot + ';margin-top:6px;flex-shrink:0;box-shadow:0 0 4px '+ C.dot +'"></div>' +
            '<div style="flex:1">' +
              '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:3px">' +
                '<span style="font-family:var(--font-display);font-size:18px;color:' + C.label + ';letter-spacing:0.5px">' + item.value + '</span>' +
                '<span style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.08em;text-transform:uppercase">' + item.label + '</span>' +
              '</div>' +
              '<div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5">' + item.note + '</div>' +
            '</div>' +
          '</div>';
        }).join('')
      : '<div style="padding:16px 0;font-family:var(--font-mono);font-size:12px;color:rgba(255,255,255,0.25);text-align:center">' + emptyMsg + '</div>';

    return '<div style="background:' + C.bg + ';border:1px solid ' + C.border + ';border-radius:8px;padding:20px 24px">' +
      '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:' + C.label + ';margin-bottom:4px">' + title + '</div>' +
      inner +
    '</div>';
  }

  // ── Batted ball donut + spray direction (batter only) ──────────────────────
  var donutHTML = '';
  if (type === 'batter') {
    var pbpBD = pbpB || DATA.pbpBatters.find(function(p){
      return p.batter.toLowerCase() === name.toLowerCase();
    }) || null;

    var gb = 0, fb = 0, lo = 0, po = 0;
    if (pbpBD && (pbpBD.GB_pct != null || pbpBD.FB_pct != null)) {
      gb = pbpBD.GB_pct || 0; fb = pbpBD.FB_pct || 0;
      lo = pbpBD.LO_pct || 0; po = pbpBD.PO_pct || 0;
    } else if (sc.length) {
      var batted = sc.filter(function(s){
        return ['Groundout','Flyout','Single','Double','Triple','Home Run',
                'Lineout','Popout','Error','Double Play','Sacrifice Fly'].includes(s.outcome);
      });
      var gbC=batted.filter(function(s){return s.contact==='Ground Ball';}).length;
      var fbC=batted.filter(function(s){return s.contact==='Fly Ball';}).length;
      var loC=batted.filter(function(s){return s.contact==='Line Drive';}).length;
      var poC=batted.filter(function(s){return s.contact==='Pop Up';}).length;
      var tot=gbC+fbC+loC+poC;
      if(tot>=5){
        gb=Math.round(gbC/tot*1000)/10; fb=Math.round(fbC/tot*1000)/10;
        lo=Math.round(loC/tot*1000)/10; po=Math.round(poC/tot*1000)/10;
      }
    }

    function buildDonut(segments, total, cx, cy, R, r, centerLines) {
      var paths='', startA=-Math.PI/2;
      segments.forEach(function(seg){
        var sweep=(seg.pct/100)*2*Math.PI, endA=startA+sweep;
        var x1o=cx+R*Math.cos(startA),y1o=cy+R*Math.sin(startA);
        var x2o=cx+R*Math.cos(endA),  y2o=cy+R*Math.sin(endA);
        var x1i=cx+r*Math.cos(endA),  y1i=cy+r*Math.sin(endA);
        var x2i=cx+r*Math.cos(startA),y2i=cy+r*Math.sin(startA);
        var la=sweep>Math.PI?1:0;
        paths+='<path d="M '+x1o.toFixed(2)+' '+y1o.toFixed(2)+
               ' A '+R+' '+R+' 0 '+la+' 1 '+x2o.toFixed(2)+' '+y2o.toFixed(2)+
               ' L '+x1i.toFixed(2)+' '+y1i.toFixed(2)+
               ' A '+r+' '+r+' 0 '+la+' 0 '+x2i.toFixed(2)+' '+y2i.toFixed(2)+
               ' Z" fill="'+seg.color+'" opacity="0.9"/>';
        var midA=startA+sweep/2, lRm=(R+r)/2;
        var lx=cx+lRm*Math.cos(midA), ly=cy+lRm*Math.sin(midA);
        if(seg.pct>=8) paths+='<text x="'+lx.toFixed(1)+'" y="'+(ly+1).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="7" font-family="monospace" font-weight="bold" fill="#0e1525">'+Math.round(seg.pct)+'%</text>';
        startA=endA;
      });
      centerLines.forEach(function(line, i){
        paths+='<text x="'+cx+'" y="'+(cy+(i===0?-5:7))+'" text-anchor="middle" font-size="'+(i===0?8:7)+'" font-family="monospace" fill="rgba(255,255,255,'+(i===0?'0.4':'0.25')+')">'+line+'</text>';
      });
      return '<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0">'+paths+'</svg>';
    }

    function buildLegend(segments) {
      return segments.map(function(seg){
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
          '<div style="width:10px;height:10px;border-radius:2px;background:'+seg.color+';flex-shrink:0"></div>'+
          '<div style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;width:36px">'+seg.label+'</div>'+
          '<div style="font-family:var(--font-mono);font-size:13px;color:#fff;font-weight:600">'+seg.pct.toFixed(1)+'%</div>'+
          '</div>';
      }).join('');
    }

    // ── Batted ball donut ────────────────────────────────────────────────────
    var bbSegs = [{label:'GB%',pct:gb,color:'#fb923c'},{label:'FB%',pct:fb,color:'#60a5fa'},
                  {label:'LO%',pct:lo,color:'#34d399'},{label:'PO%',pct:po,color:'#a78bfa'}]
                  .filter(function(s){return s.pct>0;});
    var bbTotal = gb+fb+lo+po;
    var bbSVG = bbTotal > 0 ? buildDonut(bbSegs, bbTotal, 60, 60, 48, 30, [Math.round(bbTotal)+'% BIP','tracked']) : '';
    var bbLegend = bbTotal > 0 ? buildLegend(bbSegs) : '';

    // ── Spray donut ──────────────────────────────────────────────────────────
    var spraySVG = '', sprayLegendHTML = '', shiftHTML = '';
    var batted2 = sc.filter(function(s){
      return ['Groundout','Flyout','Single','Double','Triple','Home Run',
              'Lineout','Popout','Error','Double Play','Sacrifice Fly'].includes(s.outcome) && s.spray;
    });
    var pullC=batted2.filter(function(s){return s.spray==='Pull';}).length;
    var strC =batted2.filter(function(s){return s.spray==='Straightaway';}).length;
    var oppC =batted2.filter(function(s){return s.spray==='Opposite Field';}).length;
    var sprayTot=pullC+strC+oppC;
    if(sprayTot>=3){
      var pullPct=Math.round(pullC/sprayTot*1000)/10;
      var strPct =Math.round(strC /sprayTot*1000)/10;
      var oppPct =Math.round(oppC /sprayTot*1000)/10;
      var spraySegs=[{label:'Pull',pct:pullPct,color:'#f87171'},{label:'Str',pct:strPct,color:'#FFB81C'},{label:'Oppo',pct:oppPct,color:'#60a5fa'}].filter(function(s){return s.pct>0;});
      spraySVG = buildDonut(spraySegs, 100, 60, 60, 48, 30, []);
      sprayLegendHTML = buildLegend(spraySegs);
      var sLabel,sDesc,sColor;
      if(pullPct>=55){sLabel='STANDARD SHIFT';sDesc='Heavy pull hitter — shift defenders toward the pull side.';sColor='#f87171';}
      else if(pullPct>=45){sLabel='SLIGHT SHIFT';sDesc='Moderate pull tendency — consider a shaded alignment.';sColor='#FFB81C';}
      else if(oppPct>=40){sLabel='NO SHIFT';sDesc='Hits well to the opposite field — play straight up.';sColor='#34d399';}
      else{sLabel='STRAIGHT UP';sDesc='Balanced spray — standard alignment recommended.';sColor='#60a5fa';}
      shiftHTML =
        '<div style="width:1px;align-self:stretch;background:rgba(255,255,255,0.07)"></div>'+
        '<div style="min-width:140px">'+
          '<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px">Shift Recommendation</div>'+
          '<div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+sColor+';letter-spacing:0.05em;margin-bottom:6px">'+sLabel+'</div>'+
          '<div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">'+sDesc+'</div>'+
        '</div>';
    }

    // ── Combined card ────────────────────────────────────────────────────────
    if (bbTotal > 0 || spraySVG) {
      var leftSection = bbTotal > 0 ?
        '<div>'+
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px">Batted Ball Profile</div>'+
          '<div style="display:flex;align-items:center;gap:16px">'+bbSVG+'<div>'+bbLegend+'</div></div>'+
        '</div>' : '';
      var divider = (bbTotal > 0 && spraySVG) ? '<div style="width:1px;align-self:stretch;background:rgba(255,255,255,0.07)"></div>' : '';
      var rightSection = spraySVG ?
        '<div>'+
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px">Spray Direction</div>'+
          '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'+spraySVG+'<div>'+sprayLegendHTML+'</div>'+shiftHTML+'</div>'+
        '</div>' : '';
      donutHTML =
        '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px 24px;margin-bottom:16px">'+
        '<div style="display:flex;align-items:flex-start;gap:28px;flex-wrap:wrap">'+
          leftSection + divider + rightSection +
        '</div>'+
        '</div>';
    }
  } // end batter

  // ── Pitcher time-to-plate gauge ──────────────────────────────────────────────
  var pitcherGaugeHTML = '';
  if (type === 'pitcher') {
    // Get avg_time_to_plate from DATA.pitchers (datadiamond)
    var pdG = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
    var ttp = pdG.avg_time_to_plate != null ? pdG.avg_time_to_plate : null;

    if (ttp != null) {
      // Scale: 0.8s (fast) → 2.1s (slow). Steal threshold = 1.3s
      var minT = 0.8, maxT = 2.1, stealThresh = 1.3;

      // Color: green if <= 1.1 (very fast), yellow if 1.1-1.3, red if > 1.3
      var gaugeColor, riskLabel, riskDesc;
      if (ttp <= 1.1) {
        gaugeColor = '#34d399'; // green
        riskLabel  = 'QUICK DELIVERY';
        riskDesc   = 'Delivers quickly — base runners have a very difficult time stealing.';
      } else if (ttp <= 1.3) {
        gaugeColor = '#FFB81C'; // gold
        riskLabel  = 'AVERAGE DELIVERY';
        riskDesc   = 'Near the steal threshold — runners may attempt with a good jump.';
      } else {
        gaugeColor = '#f87171'; // red
        riskLabel  = 'SLOW DELIVERY';
        riskDesc   = 'Slow to the plate — base runners can steal freely. Alert your catcher.';
      }

      // Build SVG gauge (semicircle)
      var gR = 54, gCx = 70, gCy = 74;
      var startDeg = 180, endDeg = 0; // left to right semicircle

      // Needle angle: map ttp to 180°→0° (left=fast, right=slow)
      var clampedT  = Math.max(minT, Math.min(maxT, ttp));
      var needlePct = (clampedT - minT) / (maxT - minT);
      var needleDeg = 180 - needlePct * 180; // 180=left, 0=right
      var needleRad = needleDeg * Math.PI / 180;
      var nLen = gR - 6;
      var nx   = gCx + nLen * Math.cos(needleRad);
      var ny   = gCy - nLen * Math.sin(needleRad);

      // Steal threshold marker
      var stealPct = (stealThresh - minT) / (maxT - minT);
      var stealDeg = 180 - stealPct * 180;
      var stealRad = stealDeg * Math.PI / 180;
      var sx1 = gCx + (gR - 2) * Math.cos(stealRad);
      var sy1 = gCy - (gR - 2) * Math.sin(stealRad);
      var sx2 = gCx + (gR + 6) * Math.cos(stealRad);
      var sy2 = gCy - (gR + 6) * Math.sin(stealRad);

      // Arc segments: green (fast) → gold → red (slow)
      // Green arc: 180° → stealThreshold angle
      var greenEnd = stealDeg * Math.PI / 180;
      var gx1 = gCx + gR * Math.cos(Math.PI);
      var gy1 = gCy - gR * Math.sin(Math.PI);
      var gx2 = gCx + gR * Math.cos(greenEnd);
      var gy2 = gCy - gR * Math.sin(greenEnd);
      var ir = gR - 12;
      var gix1 = gCx + ir * Math.cos(greenEnd);
      var giy1 = gCy - ir * Math.sin(greenEnd);
      var gix2 = gCx + ir * Math.cos(Math.PI);
      var giy2 = gCy - ir * Math.sin(Math.PI);

      var greenArc = 'M ' + gx1.toFixed(1) + ' ' + gy1.toFixed(1) +
        ' A ' + gR + ' ' + gR + ' 0 0 1 ' + gx2.toFixed(1) + ' ' + gy2.toFixed(1) +
        ' L ' + gix1.toFixed(1) + ' ' + giy1.toFixed(1) +
        ' A ' + ir + ' ' + ir + ' 0 0 0 ' + gix2.toFixed(1) + ' ' + giy2.toFixed(1) + ' Z';

      // Red arc: stealThreshold → 0°
      var rx1 = gx2, ry1 = gy2;
      var rx2 = gCx + gR; var ry2 = gCy;
      var rix1 = gCx + ir; var riy1 = gCy;
      var rix2 = gix1; var riy2 = giy1;

      var redArc = 'M ' + rx1.toFixed(1) + ' ' + ry1.toFixed(1) +
        ' A ' + gR + ' ' + gR + ' 0 0 1 ' + rx2.toFixed(1) + ' ' + ry2.toFixed(1) +
        ' L ' + rix1.toFixed(1) + ' ' + riy1.toFixed(1) +
        ' A ' + ir + ' ' + ir + ' 0 0 0 ' + rix2.toFixed(1) + ' ' + riy2.toFixed(1) + ' Z';

      pitcherGaugeHTML =
        '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px 24px;margin-bottom:16px">' +
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:14px">Time to Plate</div>' +
          '<div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">' +
            // SVG gauge
            '<div style="flex-shrink:0;text-align:center">' +
              '<svg width="140" height="90" viewBox="0 0 140 90">' +
                // Background track
                '<path d="M ' + (gCx - gR) + ' ' + gCy + ' A ' + gR + ' ' + gR + ' 0 0 1 ' + (gCx + gR) + ' ' + gCy +
                      ' L ' + (gCx + ir) + ' ' + gCy + ' A ' + ir + ' ' + ir + ' 0 0 0 ' + (gCx - ir) + ' ' + gCy + ' Z"' +
                      ' fill="rgba(255,255,255,0.06)"/>' +
                // Green zone (fast)
                '<path d="' + greenArc + '" fill="rgba(52,211,153,0.25)"/>' +
                // Red zone (slow / steal risk)
                '<path d="' + redArc + '" fill="rgba(248,113,113,0.25)"/>' +
                // Steal threshold marker
                '<line x1="' + sx1.toFixed(1) + '" y1="' + sy1.toFixed(1) + '" x2="' + sx2.toFixed(1) + '" y2="' + sy2.toFixed(1) + '"' +
                      ' stroke="#FFB81C" stroke-width="2" stroke-dasharray="2,2"/>' +
                '<text x="' + (sx2 + 2).toFixed(1) + '" y="' + (sy2 - 2).toFixed(1) + '"' +
                      ' font-size="5.5" font-family="monospace" fill="#FFB81C">1.3s</text>' +
                // Needle
                '<line x1="' + gCx + '" y1="' + gCy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '"' +
                      ' stroke="' + gaugeColor + '" stroke-width="2.5" stroke-linecap="round"/>' +
                '<circle cx="' + gCx + '" cy="' + gCy + '" r="4" fill="' + gaugeColor + '"/>' +
                // Value label
                '<text x="' + gCx + '" y="' + (gCy + 14) + '"' +
                      ' text-anchor="middle" font-size="13" font-family="monospace" font-weight="bold" fill="' + gaugeColor + '">' + ttp.toFixed(2) + 's</text>' +
                // Scale labels
                '<text x="' + (gCx - gR - 2) + '" y="' + (gCy + 3) + '" font-size="6" font-family="monospace" fill="rgba(255,255,255,0.3)" text-anchor="end">0.8s</text>' +
                '<text x="' + (gCx + gR + 2) + '" y="' + (gCy + 3) + '" font-size="6" font-family="monospace" fill="rgba(255,255,255,0.3)">2.1s</text>' +
              '</svg>' +
            '</div>' +
            // Text info
            '<div style="flex:1;min-width:140px">' +
              '<div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + gaugeColor + ';letter-spacing:0.05em;margin-bottom:6px">' + riskLabel + '</div>' +
              '<div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;margin-bottom:10px">' + riskDesc + '</div>' +
              '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:8px 12px">' +
                '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:2px">STEAL THRESHOLD</div>' +
                '<div style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.7)">Above <span style="color:#FFB81C;font-weight:600">1.30s</span> = runners can steal freely</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
  }

  var cols =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">' +
    makeSection('Positives', positives, 'green', 'No standout strengths yet.') +
    makeSection('Negatives', negatives, 'red',   'No major concerns found.') +
    makeSection('Approach',  approach,  'blue',  'Not enough pitch location data yet.') +
    '</div>';

  return identityCard + donutHTML + pitcherGaugeHTML + cols;
}

// ── PBP-based league percentile arrays ────────────────────────────────────
function buildPbpBatterLeague() {
  var o = { avg:[], obp:[], slg:[], ops:[], iso:[], babip:[], kpct:[], bbpct:[], bbk:[], pspa:[],
            swing:[], whiff:[], contact:[], fpSwing:[], gb:[], fb:[], lo:[], po:[] };
  DATA.pbpBatters.forEach(function(p) {
    if (!p.AB || p.AB < 5) return;
    if (p.AVG   != null) o.avg.push(p.AVG);
    if (p.OBP   != null) o.obp.push(p.OBP);
    if (p.SLG   != null) o.slg.push(p.SLG);
    if (p.OPS   != null) o.ops.push(p.OPS);
    if (p.ISO   != null) o.iso.push(p.ISO);
    if (p.BABIP != null) o.babip.push(p.BABIP);
    if (p.K_pct != null) o.kpct.push(p.K_pct);
    if (p.BB_pct!= null) o.bbpct.push(p.BB_pct);
    if (p.BB_K  != null) o.bbk.push(p.BB_K);
    if (p.PS_PA != null) o.pspa.push(p.PS_PA);
    if (p.SWING_pct   != null) o.swing.push(p.SWING_pct);
    if (p.WHIFF_pct   != null) o.whiff.push(p.WHIFF_pct);
    if (p.CONTACT_pct != null) o.contact.push(p.CONTACT_pct);
    if (p.FP_SWING_pct!= null) o.fpSwing.push(p.FP_SWING_pct);
    if (p.GB_pct != null) o.gb.push(p.GB_pct);
    if (p.FB_pct != null) o.fb.push(p.FB_pct);
    if (p.LO_pct != null) o.lo.push(p.LO_pct);
    if (p.PO_pct != null) o.po.push(p.PO_pct);
  });
  return o;
}

function buildPbpPitcherLeague() {
  var o = { era:[], whip:[], baAgst:[], babip:[], kpct:[], bbpct:[], kbb:[], str:[], swing:[],
            whiff:[], contact:[], fpStr:[], putaway:[], ea:[], gb:[], fb:[], lo:[], po:[] };
  DATA.pbpPitchers.forEach(function(p) {
    if (!p.BF || p.BF < 5) return;
    if (p.ERA        != null) o.era.push(p.ERA);
    if (p.WHIP       != null) o.whip.push(p.WHIP);
    if (p.BA_against != null) o.baAgst.push(p.BA_against);
    if (p.BABIP      != null) o.babip.push(p.BABIP);
    if (p.K_pct      != null) o.kpct.push(p.K_pct);
    if (p.BB_pct     != null) o.bbpct.push(p.BB_pct);
    if (p.K_BB       != null) o.kbb.push(p.K_BB);
    if (p.STR_pct    != null) o.str.push(p.STR_pct);
    if (p.SWING_pct  != null) o.swing.push(p.SWING_pct);
    if (p.WHIFF_pct  != null) o.whiff.push(p.WHIFF_pct);
    if (p.CONTACT_pct!= null) o.contact.push(p.CONTACT_pct);
    if (p.FP_STR_pct != null) o.fpStr.push(p.FP_STR_pct);
    if (p.PUTAWAY_pct!= null) o.putaway.push(p.PUTAWAY_pct);
    if (p.EA_pct     != null) o.ea.push(p.EA_pct);
    if (p.GB_pct     != null) o.gb.push(p.GB_pct);
    if (p.FB_pct     != null) o.fb.push(p.FB_pct);
    if (p.LO_pct     != null) o.lo.push(p.LO_pct);
    if (p.PO_pct     != null) o.po.push(p.PO_pct);
  });
  return o;
}

function renderPercentileStats(name, type, sum, pitch, seasonFilter) {
  seasonFilter = seasonFilter || 'all';

  // ── Shared bar renderer ───────────────────────
  function makeSavantBar(b, labelWidth) {
    var p      = Math.max(0, Math.min(1, b.pct || 0));
    var colorP = Math.max(0, Math.min(1, b.good ? p : (1 - p)));
    var r, g, bl;
    if (colorP <= 0.5) {
      var t = colorP * 2;
      r = Math.round(58  + t * (160 - 58));
      g = Math.round(130 + t * (160 - 130));
      bl= Math.round(210 + t * (160 - 210));
    } else {
      var t = (colorP - 0.5) * 2;
      r = Math.round(160 + t * (210 - 160));
      g = Math.round(160 + t * (50  - 160));
      bl= Math.round(160 + t * (50  - 160));
    }
    var color    = 'rgb(' + r + ',' + g + ',' + bl + ')';
    var widthPct = (p * 100).toFixed(1);
    var lw       = labelWidth || 100;
    return '<div class="sbr-row" data-stat="' + b.lbl + '" style="align-items:center;margin-bottom:12px;display:flex">' +
      '<div class="sbr-label" style="width:' + lw + 'px;flex-shrink:0;font-family:var(--font-mono);font-size:11px;color:var(--text-mid)">' + b.lbl + '</div>' +
      '<div style="flex:1;position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;margin:0 8px">' +
        '<div class="sbr-fill" style="position:absolute;left:0;top:0;height:10px;width:0%;background:' + color + ';border-radius:5px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)" data-width="' + widthPct + '%"></div>' +
        '<div class="savant-bubble" style="position:absolute;top:50%;transform:translate(-50%,-50%);left:0%;width:26px;height:26px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:var(--font-mono);z-index:2;transition:left 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.4)" data-left="' + widthPct + '">&#9679;</div>' +
      '</div>' +
      '<div style="width:64px;text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + color + ';flex-shrink:0">' + b.val + '</div>' +
    '</div>';
  }

  // ── Checkbox filter card builder ──────────────
  // defaultStats: array of lbl strings shown by default. All others hidden until checked.
  // extraHeaderHTML: injected between header and checkbox panel (e.g. season selector).
  function buildFilteredCard(cardId, title, subtitle, allBars, labelWidth, extraHeaderHTML, defaultStats) {
    var cbPanelId = cardId + '-cbpanel';
    var barsId    = cardId + '-bars';
    var defaults  = defaultStats || allBars.map(function(b){ return b.lbl; });

    // Build initial bar HTML — only render bars that are in defaults
    var barsHTML = allBars.map(function(b) {
      var visible = defaults.indexOf(b.lbl) !== -1;
      var barHtml = makeSavantBar(b, labelWidth);
      // Inject display:none for non-defaults
      if (!visible) barHtml = barHtml.replace('display:flex', 'display:none');
      return barHtml;
    }).join('');

    // Checkbox panel HTML — two-column grid of checkboxes
    var cbHTML = allBars.map(function(b) {
      var checked = defaults.indexOf(b.lbl) !== -1;
      var gold    = '#FFB81C';
      var dim     = 'rgba(255,255,255,0.35)';
      return '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;' +
             'font-family:var(--font-mono);font-size:11px;letter-spacing:0.05em;' +
             'color:' + (checked ? gold : dim) + ';white-space:nowrap;' +
             'padding:5px 0;transition:color 0.15s;user-select:none">' +
        '<input type="checkbox" data-stat="' + b.lbl + '"' + (checked ? ' checked' : '') + ' style="' +
          'appearance:none;-webkit-appearance:none;width:15px;height:15px;flex-shrink:0;' +
          'border-radius:3px;border:1.5px solid ' + (checked ? gold : 'rgba(255,255,255,0.2)') + ';' +
          'background:' + (checked ? gold : 'transparent') + ';' +
          'cursor:pointer;transition:all 0.15s">' +
        b.lbl +
      '</label>';
    }).join('');

    // Toolbar: season left (if present) + checkboxes in a responsive grid right
    var cbGridStyle = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:0 8px;width:100%';

    var html =
      '<div class="stat-card">' +
        '<div class="stat-card-header">' +
          '<span class="stat-card-title">' + title + '</span>' +
          '<span class="stat-card-subtitle" id="' + cardId + '-count">' + subtitle + '</span>' +
        '</div>' +
        '<div style="padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.06)">' +
          (extraHeaderHTML
            ? '<div style="margin-bottom:16px">' + extraHeaderHTML + '</div>'
            : '') +
          '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);' +
               'letter-spacing:0.1em;text-transform:uppercase;margin-bottom:10px">Visible Stats</div>' +
          '<div id="' + cbPanelId + '" style="' + cbGridStyle + '">' +
            cbHTML +
          '</div>' +
        '</div>' +
        '<div style="padding:20px 24px 8px" id="' + barsId + '">' + barsHTML + '</div>' +
      '</div>';

    // Wire checkbox interactions
    setTimeout(function() {
      var cbPanel    = document.getElementById(cbPanelId);
      var barsWrap   = document.getElementById(barsId);
      if (!cbPanel || !barsWrap) return;

      // Animate visible bars
      barsWrap.querySelectorAll('.sbr-fill').forEach(function(el){ if(el.dataset.width) el.style.width = el.dataset.width; });
      barsWrap.querySelectorAll('.savant-bubble').forEach(function(el){ if(el.dataset.left) el.style.left = el.dataset.left; });

      // Checkbox tick mark via pseudo-element workaround (inject via JS)
      function styleCheckbox(input) {
        var checked = input.checked;
        input.style.background   = checked ? '#FFB81C' : 'rgba(255,255,255,0.04)';
        input.style.borderColor  = checked ? '#FFB81C' : 'rgba(255,255,255,0.2)';
        input.parentElement.style.color = checked ? '#FFB81C' : 'rgba(255,255,255,0.4)';
        // Draw tick
        // Checkmark via inline unicode char overlay on the input
        input.style.backgroundImage    = 'none';
        if (checked) {
          input.style.boxShadow = 'inset 0 0 0 2px #080c12';
          input.setAttribute('data-checked', '1');
        } else {
          input.style.boxShadow = 'none';
          input.removeAttribute('data-checked');
        }
      }

      // Init tick marks
      cbPanel.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { styleCheckbox(cb); });

      cbPanel.addEventListener('change', function(e) {
        var cb   = e.target;
        if (cb.type !== 'checkbox') return;
        var stat = cb.dataset.stat;
        styleCheckbox(cb);
        barsWrap.querySelectorAll('.sbr-row').forEach(function(row) {
          if (row.dataset.stat === stat) row.style.display = cb.checked ? 'flex' : 'none';
        });
      });
    }, 60);

    return html;
  }

  // ══════════════════════════════════════════════
  // BATTER
  // ══════════════════════════════════════════════
  if (type === 'batter' && sum) {
    var sc = (pitch && pitch.scatter) ? pitch.scatter : [];
    var ZX1 = -1, ZX2 = 1, ZY1 = 0, ZY2 = 1;
    var totPitches   = sc.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
    var swStr        = sc.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
    var fouls        = sc.filter(function(s){ return s.outcome === 'Foul'; }).length;
    var inPlayOuts   = sc.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var swings       = swStr + fouls + inPlayOuts;
    var ks           = sc.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    var bbs          = sc.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    var pa           = sum.PA || (sum.AB + (sum.BB||0) + (sum.HBP||0) + (sum.SF||0)) || 1;
    var psPerPA      = pa > 0 ? totPitches / pa : 0;
    // x=vertical(0=bot,1=top), y=horizontal(-1=left,1=right)
    var inZonePts    = sc.filter(function(s){ return s.y != null && s.y >= -1 && s.y <= 1 && s.x != null && s.x >= 0 && s.x <= 1; });
    var inZoneSwings = inZonePts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var inZoneContact= inZonePts.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var oozPts       = sc.filter(function(s){ return s.y != null && s.x != null && (s.y < -1 || s.y > 1 || s.x < 0 || s.x > 1); });
    var chases       = oozPts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;

    // runners = 3-char string: pos0=1st, pos1=2nd, pos2=3rd. '1' = occupied.
    // RISP = runner on 2nd (pos1) or 3rd (pos2)
    function hasRISP(s) {
      var r = String(s.runners || '000');
      return r[1] === '1' || r[2] === '1';
    }
    // ── RISP (runner on 2nd pos1 or 3rd pos2 of '000' string) ──────────────────
    var rispPts  = sc.filter(function(s){ return hasRISP(s); });
    var rispAB   = rispPts.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    var rispHits = rispPts.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var myBARISP = rispAB >= 5 ? rispHits / rispAB : null;

    // RBI from IBL history
    var myRBI = null;
    var _iblB = (DATA.iblHistory[name]||[]).filter(function(s){ return s.AB > 0; });
    if (_iblB.length && _iblB[0].RBI != null) myRBI = _iblB[0].RBI;

    // ── Contact type from outcomes ────────────────────────────────────────────
    var gbB    = sc.filter(function(s){ return s.outcome === 'Groundout' || s.outcome === 'Double Play' || s.outcome === 'Triple Play'; }).length;
    var fbB    = sc.filter(function(s){ return s.outcome === 'Flyout' || s.outcome === 'Sacrifice Fly' || s.outcome === 'Sac Fly Double Play'; }).length;
    var loB    = sc.filter(function(s){ return s.outcome === 'Lineout'; }).length;
    var poB    = sc.filter(function(s){ return s.outcome === 'Popout'; }).length;
    var bipB   = gbB + fbB + loB + poB; // balls in play (outs only, for contact type %)

    // BABIP: (H - HR) / (AB - K - HR + SF)
    var babipNum = (sum.H||0) - (sum.HR||0);
    var babipDen = (sum.AB||0) - (sum.K||0) - (sum.HR||0) + (sum.SF||0);
    var myBABIP  = babipDen >= 5 ? babipNum / babipDen : null;

    // ISO: SLG - AVG
    var myISO = (sum.SLG != null && sum.AVG != null) ? sum.SLG - sum.AVG : null;

    // BB/K ratio
    var myBBK = (sum.K||0) > 0 ? (sum.BB||0) / (sum.K||0) : null;

    // Contact% = (swings - whiffs) / swings
    var myContact = swings > 0 ? (swings - swStr) / swings : null;

    // First Pitch Swing% and First Pitch Strike%
    var fp    = sc.filter(function(s){ return (s.count||'').replace(/^'/,'') === '0-0'; });
    var fpSw  = fp.filter(function(s){ return ['Swinging Strike','Foul'].concat(['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt']).includes(s.outcome); }).length;
    var fpStr = fp.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome) || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var myFPSwing  = fp.length >= 5 ? fpSw  / fp.length : null;
    var myFPStrike = fp.length >= 5 ? fpStr / fp.length : null;

    // 2-Strike BA
    var twoK    = sc.filter(function(s){ var c=(s.count||'').replace(/^'/,''); return c.endsWith('-2') && c !== '0-2' && ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); });
    var twoKH   = twoK.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var my2KBA  = twoK.length >= 5 ? twoKH / twoK.length : null;

    // League arrays
    var leagueDisc = (function() {
      var o = { swing:[], whiff:[], contact:[], k:[], bb:[], bbk:[], pspa:[],
                izSwing:[], izContact:[], chase:[],
                avg:[], obp:[], ops:[], slg:[], iso:[], babip:[],
                rbi:[], baRisp:[], fpSwing:[], fpStrike:[], twoKba:[],
                gb:[], fb:[], lo:[], po:[] };
      DATA.pitches.forEach(function(bp) {
        var sc2  = bp.scatter || [];
        var tot2 = sc2.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
        if (!tot2) return;
        var sw2     = sc2.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
        var fo2     = sc2.filter(function(s){ return s.outcome === 'Foul'; }).length;
        var ip2     = sc2.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var swings2 = sw2 + fo2 + ip2;
        var ks2     = sc2.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
        var bbs2    = sc2.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
        var bSum2   = getSummaryPlayer(bp.batter);
        var pa2     = bSum2 ? (bSum2.PA || (bSum2.AB + (bSum2.BB||0) + (bSum2.HBP||0) + (bSum2.SF||0)) || 1) : 1;
        var inZ2    = sc2.filter(function(s){ return s.y != null && s.y >= -1 && s.y <= 1 && s.x != null && s.x >= 0 && s.x <= 1; });
        var izSw2   = inZ2.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ip2; }).length;
        var izCon2  = inZ2.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var ooz2    = sc2.filter(function(s){ return s.y != null && s.x != null && (s.y < -1 || s.y > 1 || s.x < 0 || s.x > 1); });
        var ch2     = ooz2.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;
        var risp2   = sc2.filter(function(s){ return hasRISP(s); });
        var rAB2    = risp2.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
        var rH2     = risp2.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
        var gb2     = sc2.filter(function(s){ return s.outcome === 'Groundout' || s.outcome === 'Double Play' || s.outcome === 'Triple Play'; }).length;
        var fb2     = sc2.filter(function(s){ return s.outcome === 'Flyout' || s.outcome === 'Sacrifice Fly' || s.outcome === 'Sac Fly Double Play'; }).length;
        var lo2     = sc2.filter(function(s){ return s.outcome === 'Lineout'; }).length;
        var po2     = sc2.filter(function(s){ return s.outcome === 'Popout'; }).length;
        var bip2    = gb2 + fb2 + lo2 + po2;
        var fp2     = sc2.filter(function(s){ return (s.count||'').replace(/^'/,'') === '0-0'; });
        var fpSw2   = fp2.filter(function(s){ return ['Swinging Strike','Foul'].concat(ip2 > 0 ? ['Single'] : []).length > 0 && ['Swinging Strike','Foul','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var fpStr2  = fp2.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var twoK2   = sc2.filter(function(s){ var c=(s.count||'').replace(/^'/,''); return c.endsWith('-2') && c !== '0-2' && ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); });
        var twoKH2  = twoK2.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
        o.swing.push(tot2 > 0 ? swings2/tot2 : 0);
        o.whiff.push(swings2 > 0 ? sw2/swings2 : 0);
        o.contact.push(swings2 > 0 ? (swings2-sw2)/swings2 : 0);
        o.k.push(tot2 > 0 ? ks2/tot2 : 0);
        o.bb.push(tot2 > 0 ? bbs2/tot2 : 0);
        if (ks2 > 0) o.bbk.push(bbs2/ks2);
        o.pspa.push(tot2 / pa2);
        o.izSwing.push(inZ2.length > 0 ? izSw2/inZ2.length : 0);
        o.izContact.push(izSw2 > 0 ? izCon2/izSw2 : 0);
        o.chase.push(ooz2.length > 0 ? ch2/ooz2.length : 0);
        if (rAB2 >= 5) o.baRisp.push(rH2/rAB2);
        if (bip2 > 0) { o.gb.push(gb2/bip2); o.fb.push(fb2/bip2); o.lo.push(lo2/bip2); o.po.push(po2/bip2); }
        if (fp2.length >= 5) { o.fpSwing.push(fpSw2/fp2.length); o.fpStrike.push(fpStr2/fp2.length); }
        if (twoK2.length >= 5) o.twoKba.push(twoKH2/twoK2.length);
      });
      DATA.summary.forEach(function(p) {
        if (!p.AB || p.AB < 5) return;
        o.avg.push(p.AVG||0); o.obp.push(p.OBP||0); o.ops.push(p.OPS||0); o.slg.push(p.SLG||0);
        var iso2 = (p.SLG||0) - (p.AVG||0); o.iso.push(iso2);
        var bNum = (p.H||0)-(p.HR||0); var bDen = (p.AB||0)-(p.K||0)-(p.HR||0)+(p.SF||0);
        if (bDen >= 5) o.babip.push(bNum/bDen);
        if ((p.K||0) > 0) o.bbk.push((p.BB||0)/(p.K||0));
        var iblR = (DATA.iblHistory[p.batter]||[]).filter(function(s){ return s.AB > 0; });
        if (iblR.length && iblR[0].RBI != null) o.rbi.push(iblR[0].RBI);
      });
      return o;
    })();

    function leaguePct(val, arr) {
      if (!arr.length || val == null) return 0;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    var mySwing     = totPitches > 0   ? swings/totPitches               : null;
    var myWhiff     = swings > 0       ? swStr/swings                    : null;
    var myK         = totPitches > 0   ? ks/totPitches                   : null;
    var myBB        = totPitches > 0   ? bbs/totPitches                  : null;
    var myPspa      = pa > 0           ? psPerPA                         : null;
    var myIzSwing   = inZonePts.length ? inZoneSwings/inZonePts.length   : null;
    var myIzContact = inZoneSwings > 0 ? inZoneContact/inZoneSwings      : null;
    var myChase     = oozPts.length    ? chases/oozPts.length            : null;

    function lp(v, a) { return leaguePct(v, a); }

    // Use pbpBatters data if available, fall back to scatter-derived
    var pbpBatterData = getPbpBatter(name);
    var lgB = buildPbpBatterLeague();

    function lpB(val, arr) {
      if (!arr || !arr.length || val == null) return 0;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    var pitchCount = pbpBatterData ? pbpBatterData.pitches : totPitches;
    var lgHr2  = DATA.pbpBatters.filter(function(p){ return p.AB>=5; }).map(function(p){ return p.HR||0; });
    var lgRbi2 = Object.values(DATA.iblHistory||{}).map(function(seasons){
      var s=(seasons||[]).filter(function(s){return s.AB>0;});
      return s.length&&s[0].RBI!=null?s[0].RBI:null;
    }).filter(function(v){return v!=null;});

    var allBars = [];
    if (pbpBatterData) {
      // ── PBP-derived bars ──
      var d = pbpBatterData;
      allBars = [
        { lbl: 'BA',         val: d.AVG   != null ? fmt3(d.AVG)           : '—', pct: lpB(d.AVG,           lgB.avg),     good: true  },
        { lbl: 'HR',         val: getSeasonHR(name)  != null ? fmtN(getSeasonHR(name))  : (d.HR  != null ? fmtN(d.HR)  : '—'), pct: pctRankB(getSeasonHR(name) != null ? getSeasonHR(name) : d.HR, lgHr2), good: true },
        { lbl: 'RBI',        val: getSeasonRBI(name) != null ? fmtN(getSeasonRBI(name)) : '—', pct: pctRankB(getSeasonRBI(name), lgRbi2), good: true },
        { lbl: 'OBP',        val: d.OBP   != null ? fmt3(d.OBP)           : '—', pct: lpB(d.OBP,           lgB.obp),     good: true  },
        { lbl: 'SLG',        val: d.SLG   != null ? fmt3(d.SLG)           : '—', pct: lpB(d.SLG,           lgB.slg),     good: true  },
        { lbl: 'OPS',        val: d.OPS   != null ? fmt3(d.OPS)           : '—', pct: lpB(d.OPS,           lgB.ops),     good: true  },
        { lbl: 'ISO',        val: d.ISO   != null ? fmt3(d.ISO)           : '—', pct: lpB(d.ISO,           lgB.iso),     good: true  },
        { lbl: 'BABIP',      val: d.BABIP != null ? fmt3(d.BABIP)         : '—', pct: lpB(d.BABIP,         lgB.babip),   good: true  },
        { lbl: 'SWING%',     val: d.SWING_pct   != null ? fmt1(d.SWING_pct)+'%'   : '—', pct: lpB(d.SWING_pct,   lgB.swing),   good: false },
        { lbl: 'WHIFF%',     val: d.WHIFF_pct   != null ? fmt1(d.WHIFF_pct)+'%'   : '—', pct: 1-lpB(d.WHIFF_pct, lgB.whiff),   good: true  },
        { lbl: 'CONTACT%',   val: d.CONTACT_pct != null ? fmt1(d.CONTACT_pct)+'%' : '—', pct: lpB(d.CONTACT_pct, lgB.contact), good: true  },
        { lbl: 'K%',         val: d.K_pct  != null ? fmt1(d.K_pct)+'%'   : '—', pct: 1-lpB(d.K_pct,       lgB.kpct),    good: true  },
        { lbl: 'BB%',        val: d.BB_pct != null ? fmt1(d.BB_pct)+'%'  : '—', pct: lpB(d.BB_pct,        lgB.bbpct),   good: true  },
        { lbl: 'BB/K',       val: d.BB_K  != null ? fmt2(d.BB_K)         : '—', pct: lpB(d.BB_K,          lgB.bbk),     good: true  },
        { lbl: 'PS/PA',      val: d.PS_PA != null ? fmt2(d.PS_PA)        : '—', pct: lpB(d.PS_PA,         lgB.pspa),    good: true  },
        { lbl: 'IZ SWING%',  val: myIzSwing  != null ? fmt1(myIzSwing*100)+'%'  : '—', pct: myIzSwing  != null ? lp(myIzSwing,  leagueDisc.izSwing)  : 0, good: true },
        { lbl: 'IZ CONTACT%',val: myIzContact!= null ? fmt1(myIzContact*100)+'%': '—', pct: myIzContact!= null ? lp(myIzContact,leagueDisc.izContact) : 0, good: true },
        { lbl: 'CHASE%',     val: myChase    != null ? fmt1(myChase*100)+'%'    : '—', pct: myChase    != null ? 1-lp(myChase,   leagueDisc.chase)    : 0, good: true },
        { lbl: 'FP SWING%',  val: d.FP_SWING_pct != null ? fmt1(d.FP_SWING_pct)+'%' : '—', pct: lpB(d.FP_SWING_pct, lgB.fpSwing), good: false },
        { lbl: 'GB%',        val: d.GB_pct != null ? fmt1(d.GB_pct)+'%'  : '—', pct: 1-lpB(d.GB_pct,     lgB.gb),      good: true  },
        { lbl: 'FB%',        val: d.FB_pct != null ? fmt1(d.FB_pct)+'%'  : '—', pct: lpB(d.FB_pct,       lgB.fb),      good: true  },
        { lbl: 'LO%',        val: d.LO_pct != null ? fmt1(d.LO_pct)+'%'  : '—', pct: lpB(d.LO_pct,       lgB.lo),      good: true  },
        { lbl: 'PO%',        val: d.PO_pct != null ? fmt1(d.PO_pct)+'%'  : '—', pct: 1-lpB(d.PO_pct,     lgB.po),      good: true  },
      ].filter(function(b){ return b.val !== '—'; });
    } else if (sc.length) {
      // Fall back to scatter-derived bars
      allBars = [
        { lbl: 'BA',         val: sum && sum.AVG  != null ? fmt3(sum.AVG)         : '—', pct: lp(sum && sum.AVG,  leagueDisc.avg),  good: true  },
        { lbl: 'OBP',        val: sum && sum.OBP  != null ? fmt3(sum.OBP)         : '—', pct: lp(sum && sum.OBP,  leagueDisc.obp),  good: true  },
        { lbl: 'SLG',        val: sum && sum.SLG  != null ? fmt3(sum.SLG)         : '—', pct: lp(sum && sum.SLG,  leagueDisc.slg),  good: true  },
        { lbl: 'OPS',        val: sum && sum.OPS  != null ? fmt3(sum.OPS)         : '—', pct: lp(sum && sum.OPS,  leagueDisc.ops),  good: true  },
        { lbl: 'SWING%',     val: mySwing    != null ? fmt1(mySwing*100)+'%'    : '—', pct: mySwing    != null ? 1-lp(mySwing,    leagueDisc.swing)    : 0, good: true },
        { lbl: 'WHIFF%',     val: myWhiff    != null ? fmt1(myWhiff*100)+'%'    : '—', pct: myWhiff    != null ? 1-lp(myWhiff,    leagueDisc.whiff)    : 0, good: true },
        { lbl: 'K%',         val: myK        != null ? fmt1(myK*100)+'%'        : '—', pct: myK        != null ? 1-lp(myK,        leagueDisc.k)        : 0, good: true },
        { lbl: 'BB%',        val: myBB       != null ? fmt1(myBB*100)+'%'       : '—', pct: myBB       != null ? lp(myBB,         leagueDisc.bb)       : 0, good: true },
        { lbl: 'IZ SWING%',  val: myIzSwing  != null ? fmt1(myIzSwing*100)+'%' : '—', pct: myIzSwing  != null ? lp(myIzSwing,    leagueDisc.izSwing)  : 0, good: true },
        { lbl: 'IZ CONTACT%',val: myIzContact!= null ? fmt1(myIzContact*100)+'%': '—', pct: myIzContact!= null ? lp(myIzContact, leagueDisc.izContact) : 0, good: true },
        { lbl: 'CHASE%',     val: myChase    != null ? fmt1(myChase*100)+'%'    : '—', pct: myChase    != null ? 1-lp(myChase,    leagueDisc.chase)    : 0, good: true },
      ].filter(function(b){ return b.val !== '—'; });
    }

    if (!allBars.length) {
      return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
    }

    return buildFilteredCard('pct-batter', 'Percentile Stats', pitchCount + ' pitches seen', allBars, 110, null,
      ['BA','OBP','SLG','OPS','SWING%','WHIFF%','CONTACT%','K%','BB%','BB/K','PS/PA','FP SWING%','GB%','FB%']);
  }

  // ══════════════════════════════════════════════
  // PITCHER
  // ══════════════════════════════════════════════
  if (type === 'pitcher' && pitch && pitch.scatter) {
    var pmDates = new Set();
    var pmYears = new Set();
    pitch.scatter.forEach(function(s) {
      if (s.date) { pmDates.add(s.date); pmYears.add(s.date.slice(0,4)); }
    });
    pmDates = Array.from(pmDates).sort();
    pmYears = Array.from(pmYears).sort();
    var pmDateFilter = 'season';

    var lgP = (function() {
      var o = { str:[], swing:[], whiff:[], contact:[], k:[], bb:[], ea:[], kbb:[], era:[], whip:[], baAgst:[], babip:[],
                gb:[], fb:[], lo:[], po:[], fpSwing:[], fpStrike:[], twoKK:[], csw:[] };
      DATA.pitches.forEach(function(bp) {
        var sc2 = bp.scatter || [];
        var t2  = sc2.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
        if (!t2) return;
        var ks2  = sc2.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
        var bbs2 = sc2.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
        var str2 = sc2.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
        var sw2  = sc2.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
        var ip2  = sc2.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var fo2  = sc2.filter(function(s){ return s.outcome === 'Foul'; }).length;
        var h2   = sc2.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
        var hr2  = sc2.filter(function(s){ return s.outcome === 'Home Run'; }).length;
        var ab2  = sc2.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
        var sw2t = sw2 + fo2 + ip2;
        var gb2  = sc2.filter(function(s){ return s.outcome === 'Groundout' || s.outcome === 'Double Play' || s.outcome === 'Triple Play'; }).length;
        var fb2  = sc2.filter(function(s){ return s.outcome === 'Flyout' || s.outcome === 'Sacrifice Fly' || s.outcome === 'Sac Fly Double Play'; }).length;
        var lo2  = sc2.filter(function(s){ return s.outcome === 'Lineout'; }).length;
        var po2  = sc2.filter(function(s){ return s.outcome === 'Popout'; }).length;
        var bip2 = gb2 + fb2 + lo2 + po2;
        var fp2  = sc2.filter(function(s){ return (s.count||'').replace(/^'/,'') === '0-0'; });
        var fpStr2 = fp2.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var fpSw2  = fp2.filter(function(s){ return ['Swinging Strike','Foul','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var twoK2  = sc2.filter(function(s){ var c=(s.count||'').replace(/^'/,''); return c.endsWith('-2') && ['Strikeout Swinging','Strikeout Looking','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error'].includes(s.outcome); });
        var twoKK2 = twoK2.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
        var pname2 = sc2[0] && sc2[0].pitcher;
        var pd2 = pname2 ? (DATA.pitchers.find(function(p){ return p.pitcher === pname2; }) || {}) : {};
        // Babip against: (H-HR)/(AB-K-HR)
        var bNum2 = h2-hr2; var bDen2 = ab2-ks2-hr2;
        o.str.push(str2/t2);
        o.swing.push(sw2t/t2);
        o.whiff.push(sw2t > 0 ? sw2/sw2t : 0);
        o.contact.push(sw2t > 0 ? (sw2t-sw2)/sw2t : 0);
        o.k.push(ks2/t2);
        o.bb.push(bbs2/t2);
        var pbpPD2 = DATA.pbpPitchers.find(function(pp){ return pp.pitcher === pname2; }) || {};
        if (pbpPD2.EA_pct != null) o.ea.push(pbpPD2.EA_pct);
        else if (pd2.EA_pct != null) o.ea.push(pd2.EA_pct);
        if (pbpPD2.K_BB   != null) o.kbb.push(pbpPD2.K_BB);
        else if (pd2.K_BB  != null) o.kbb.push(pd2.K_BB);
        if (pbpPD2.WHIP   != null) o.whip.push(pbpPD2.WHIP);
        else if (pd2.IP > 0) o.whip.push((bbs2+h2)/pd2.IP);
        if (ab2 >= 5)   o.baAgst.push(h2/ab2);
        if (bDen2 >= 5) o.babip.push(bNum2/bDen2);
        if (bip2 > 0)   { o.gb.push(gb2/bip2); o.fb.push(fb2/bip2); o.lo.push(lo2/bip2); o.po.push(po2/bip2); }
        if (fp2.length >= 5) { o.fpStrike.push(fpStr2/fp2.length); o.fpSwing.push(fpSw2/fp2.length); }
        if (twoK2.length >= 5) o.twoKK.push(twoKK2/twoK2.length);
        // CSW = (Called Strikes + Swinging Strikes) / total pitches seen
        var csw2 = sc2.filter(function(s){ return s.outcome === 'Called Strike' || s.outcome === 'Swinging Strike'; }).length;
        if (t2 > 0) o.csw.push(csw2/t2);
        var ibl2 = (DATA.iblHistory[pname2]||[]).filter(function(s){ return s.IP > 0; });
        if (ibl2.length && ibl2[0].ERA != null) o.era.push(ibl2[0].ERA);
      });
      return o;
    })();

    function lp(val, arr) {
      if (!arr.length || val == null) return 0;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    function calcBars(scIn) {
      var tot    = scIn.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
      var ks     = scIn.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
      var bbs    = scIn.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
      var str    = scIn.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
      var swStr  = scIn.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
      var inPlay = scIn.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
      var fouls  = scIn.filter(function(s){ return s.outcome === 'Foul'; }).length;
      var swings = swStr + fouls + inPlay;
      var hits   = scIn.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
      var hrs    = scIn.filter(function(s){ return s.outcome === 'Home Run'; }).length;
      var abF    = scIn.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
      var gb     = scIn.filter(function(s){ return s.outcome === 'Groundout' || s.outcome === 'Double Play' || s.outcome === 'Triple Play'; }).length;
      var fb     = scIn.filter(function(s){ return s.outcome === 'Flyout' || s.outcome === 'Sacrifice Fly' || s.outcome === 'Sac Fly Double Play'; }).length;
      var lo     = scIn.filter(function(s){ return s.outcome === 'Lineout'; }).length;
      var po     = scIn.filter(function(s){ return s.outcome === 'Popout'; }).length;
      var bip    = gb + fb + lo + po;
      var fp     = scIn.filter(function(s){ return (s.count||'').replace(/^'/,'') === '0-0'; });
      var fpStr2 = fp.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
      var fpSw2  = fp.filter(function(s){ return ['Swinging Strike','Foul','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
      var twoK   = scIn.filter(function(s){ var c=(s.count||'').replace(/^'/,''); return c.endsWith('-2') && ['Strikeout Swinging','Strikeout Looking','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error'].includes(s.outcome); });
      var twoKK  = twoK.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
      var pd     = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
      var iblSP  = (DATA.iblHistory[name]||[]).filter(function(s){ return s.IP > 0; });
      var era    = iblSP.length && iblSP[0].ERA != null ? iblSP[0].ERA : null;
      var whip   = pd.IP > 0 ? (bbs + hits) / pd.IP : null;
      var baAgst = abF >= 5 ? hits / abF : null;
      var bNumP  = hits - hrs; var bDenP = abF - ks - hrs;
      var babip  = bDenP >= 5 ? bNumP / bDenP : null;
      var fpStrikePct = fp.length >= 5 ? fpStr2 / fp.length : null;
      var fpSwingPct  = fp.length >= 5 ? fpSw2  / fp.length : null;
      var twoKKpct    = twoK.length >= 5 ? twoKK / twoK.length : null;
      var cswCount = scIn.filter(function(s){ return s.outcome === 'Called Strike' || s.outcome === 'Swinging Strike'; }).length;
      var cswPct   = tot > 0 ? cswCount / tot : null;
      return {
        tot: tot,
        bars: [
          // Outcome stats
          { lbl: 'ERA',  val: era  != null ? fmt2(era)  : '—', pct: era  != null ? 1-lp(era,  lgP.era)  : 0, good: true },
          { lbl: 'WHIP', val: whip != null ? fmt2(whip) : '—', pct: whip != null ? 1-lp(whip, lgP.whip) : 0, good: true },
          { lbl: 'BA AGNST', val: baAgst!=null   ? fmt3(baAgst)           :'—', pct: baAgst!=null   ? 1-lp(baAgst,      lgP.baAgst)  : 0, good: true },
          { lbl: 'BABIP',    val: babip!=null    ? fmt3(babip)            :'—', pct: babip!=null    ? 1-lp(babip,       lgP.babip)   : 0, good: true },
          // Rate stats
          { lbl: 'STR%',     val: tot>0          ? fmt1(str/tot*100)+'%'  :'—', pct: tot>0          ? lp(str/tot,       lgP.str)     : 0, good: true },
          { lbl: 'SWING%',   val: tot>0          ? fmt1(swings/tot*100)+'%':'—', pct: tot>0         ? lp(swings/tot,    lgP.swing)   : 0, good: true },
          { lbl: 'WHIFF%',   val: swings>0       ? fmt1(swStr/swings*100)+'%':'—', pct: swings>0    ? lp(swStr/swings,  lgP.whiff)   : 0, good: true },
          { lbl: 'CONTACT%', val: swings>0       ? fmt1((swings-swStr)/swings*100)+'%':'—', pct: swings>0 ? 1-lp((swings-swStr)/swings, lgP.contact) : 0, good: true },
          { lbl: 'K%',       val: tot>0          ? fmt1(ks/tot*100)+'%'   :'—', pct: tot>0          ? lp(ks/tot,        lgP.k)       : 0, good: true },
          { lbl: 'BB%',      val: tot>0          ? fmt1(bbs/tot*100)+'%'  :'—', pct: tot>0          ? 1-lp(bbs/tot,     lgP.bb)      : 0, good: true },
          { lbl: 'E+A%',     val: pd.EA_pct!=null? fmt1(pd.EA_pct)+'%'   :'—', pct: lp(pd.EA_pct,  lgP.ea),  good: true },
          { lbl: 'K/BB',     val: pd.K_BB!=null  ? fmt2(pd.K_BB)         :'—', pct: lp(pd.K_BB,    lgP.kbb), good: true },
          // Contact type
          { lbl: 'GB%',      val: bip>0          ? fmt1(gb/bip*100)+'%'  :'—', pct: bip>0          ? lp(gb/bip,        lgP.gb)      : 0, good: true },
          { lbl: 'FB%',      val: bip>0          ? fmt1(fb/bip*100)+'%'  :'—', pct: bip>0          ? 1-lp(fb/bip,      lgP.fb)      : 0, good: true },
          { lbl: 'LO%',      val: bip>0          ? fmt1(lo/bip*100)+'%'  :'—', pct: bip>0          ? lp(lo/bip,        lgP.lo)      : 0, good: true },
          { lbl: 'PO%',      val: bip>0          ? fmt1(po/bip*100)+'%'  :'—', pct: bip>0          ? 1-lp(po/bip,      lgP.po)      : 0, good: true },
          // First pitch & 2-strike
          { lbl: 'FP STR%',  val: fpStrikePct!=null ? fmt1(fpStrikePct*100)+'%':'—', pct: fpStrikePct!=null ? lp(fpStrikePct, lgP.fpStrike) : 0, good: true },
          { lbl: 'PUTAWAY%', val: twoKKpct!=null    ? fmt1(twoKKpct*100)+'%'   :'—', pct: twoKKpct!=null    ? lp(twoKKpct,   lgP.twoKK)   : 0, good: true },
        ].filter(function(b){ return b.val !== '—'; })
      };
    }
    var sc     = pitch ? pitch.scatter : [];
    var m      = sc && sc.length ? calcBars(sc) : { bars: [], tot: 0 };
    var tot    = m.tot;
    var pbpPitData = getPbpPitcher(name);
    var lgPpbp = buildPbpPitcherLeague();

    function lpP(val, arr) {
      if (!arr || !arr.length || val == null) return 0;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    var allBars;
    if (pbpPitData) {
      var dp = pbpPitData;
      allBars = [
        { lbl: 'ERA',  val: getSeasonERA(name)  != null ? fmt2(getSeasonERA(name))  : (dp.ERA  != null ? fmt2(dp.ERA)  : '—'),
                   pct: getSeasonERA(name)  != null ? 1-lpP(getSeasonERA(name),  lgPpbp.era)  : (dp.ERA  != null ? 1-lpP(dp.ERA,  lgPpbp.era)  : 0), good: true },
        { lbl: 'WHIP', val: getSeasonWHIP(name) != null ? fmt2(getSeasonWHIP(name)) : (dp.WHIP != null ? fmt2(dp.WHIP) : '—'),
                   pct: getSeasonWHIP(name) != null ? 1-lpP(getSeasonWHIP(name), lgPpbp.whip) : (dp.WHIP != null ? 1-lpP(dp.WHIP, lgPpbp.whip) : 0), good: true },
        { lbl: 'BA AGNST', val: dp.BA_against != null ? fmt3(dp.BA_against)       : '—', pct: dp.BA_against != null ? 1-lpP(dp.BA_against, lgPpbp.baAgst)  : 0, good: true },
        { lbl: 'BABIP',    val: dp.BABIP      != null ? fmt3(dp.BABIP)            : '—', pct: dp.BABIP      != null ? 1-lpP(dp.BABIP,      lgPpbp.babip)   : 0, good: true },
        { lbl: 'STR%',     val: dp.STR_pct    != null ? fmt1(dp.STR_pct)+'%'     : '—', pct: lpP(dp.STR_pct,    lgPpbp.str),     good: true },
        { lbl: 'SWING%',   val: dp.SWING_pct  != null ? fmt1(dp.SWING_pct)+'%'   : '—', pct: lpP(dp.SWING_pct,  lgPpbp.swing),   good: true },
        { lbl: 'WHIFF%',   val: dp.WHIFF_pct  != null ? fmt1(dp.WHIFF_pct)+'%'   : '—', pct: lpP(dp.WHIFF_pct,  lgPpbp.whiff),   good: true },
        { lbl: 'CONTACT%', val: dp.CONTACT_pct!= null ? fmt1(dp.CONTACT_pct)+'%' : '—', pct: dp.CONTACT_pct!= null ? 1-lpP(dp.CONTACT_pct, lgPpbp.contact) : 0, good: true },
        { lbl: 'K%',       val: dp.K_pct      != null ? fmt1(dp.K_pct)+'%'       : '—', pct: lpP(dp.K_pct,      lgPpbp.kpct),    good: true },
        { lbl: 'BB%',      val: dp.BB_pct     != null ? fmt1(dp.BB_pct)+'%'      : '—', pct: dp.BB_pct     != null ? 1-lpP(dp.BB_pct,     lgPpbp.bbpct)   : 0, good: true },
        { lbl: 'E+A%',     val: dp.EA_pct     != null ? fmt1(dp.EA_pct)+'%'      : '—', pct: lpP(dp.EA_pct,     lgPpbp.ea),      good: true },
        { lbl: 'K/BB',     val: dp.K_BB       != null ? fmt2(dp.K_BB)            : '—', pct: lpP(dp.K_BB,       lgPpbp.kbb),     good: true },
        { lbl: 'GB%',      val: dp.GB_pct     != null ? fmt1(dp.GB_pct)+'%'      : '—', pct: lpP(dp.GB_pct,     lgPpbp.gb),      good: true },
        { lbl: 'FB%',      val: dp.FB_pct     != null ? fmt1(dp.FB_pct)+'%'      : '—', pct: dp.FB_pct     != null ? 1-lpP(dp.FB_pct,     lgPpbp.fb)      : 0, good: true },
        { lbl: 'LO%',      val: dp.LO_pct     != null ? fmt1(dp.LO_pct)+'%'      : '—', pct: lpP(dp.LO_pct,     lgPpbp.lo),      good: true },
        { lbl: 'PO%',      val: dp.PO_pct     != null ? fmt1(dp.PO_pct)+'%'      : '—', pct: dp.PO_pct     != null ? 1-lpP(dp.PO_pct,     lgPpbp.po)      : 0, good: true },
        { lbl: 'FP STR%',  val: dp.FP_STR_pct != null ? fmt1(dp.FP_STR_pct)+'%' : '—', pct: lpP(dp.FP_STR_pct, lgPpbp.fpStr),   good: true },
        { lbl: 'PUTAWAY%', val: dp.PUTAWAY_pct!= null ? fmt1(dp.PUTAWAY_pct)+'%' : '—', pct: lpP(dp.PUTAWAY_pct,lgPpbp.putaway), good: true },
      ].filter(function(b){ return b.val !== '—'; });
      tot = dp.pitches || tot;
    } else {
      allBars = m.bars;
    }

    // Season selector HTML (injected as extraHeaderHTML)
    var seasonSelectHTML = pmYears.length
      ? '<div>' +
          '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px">Season</div>' +
          '<select id="pm-season-select" style="background:#0e1525;border:1.5px solid rgba(255,184,28,0.35);border-radius:6px;color:#FFB81C;font-family:var(--font-mono);font-size:11px;padding:8px 12px;cursor:pointer;outline:none;letter-spacing:0.5px">' +
            '<option value="season">All</option>' +
            pmYears.map(function(y){ return '<option value="'+y+'">Summer '+y+'</option>'; }).join('') +
          '</select>' +
        '</div>'
      : '';

    var html = buildFilteredCard('pct-pitcher', 'Percentile Stats', (tot || (pbpPitData && pbpPitData.BF) || 0) + ' batters faced', allBars, 80, seasonSelectHTML,
      ['ERA','WHIP','STR%','SWING%','WHIFF%','CONTACT%','K%','BB%','E+A%','K/BB','GB%','FB%']);

    // Wire season dropdown — updates pitch count subtitle and re-renders bars
    setTimeout(function() {
      var sel = document.getElementById('pm-season-select');
      if (!sel) return;
      sel.addEventListener('change', function() {
        pmDateFilter = this.value;
        var filtered = pmDateFilter === 'season'
          ? pitch.scatter
          : pitch.scatter.filter(function(s){ return s.date && s.date.startsWith(pmDateFilter); });
        var m2 = calcBars(filtered);
        var countEl = document.getElementById('pct-pitcher-count');
        if (countEl) countEl.textContent = m2.tot + ' pitches';
        // Rebuild only the bar rows, preserving pill toggle state
        var barsWrap = document.getElementById('pct-pitcher-bars');
        if (!barsWrap) return;
        // Track which stats are currently hidden
        var hidden = {};
        barsWrap.querySelectorAll('.sbr-row').forEach(function(row){
          if (row.style.display === 'none') hidden[row.dataset.stat] = true;
        });
        barsWrap.innerHTML = m2.bars.map(function(b){ return makeSavantBar(b, 80); }).join('');
        // Restore hidden state
        barsWrap.querySelectorAll('.sbr-row').forEach(function(row){
          if (hidden[row.dataset.stat]) row.style.display = 'none';
        });
        // Animate
        barsWrap.querySelectorAll('.sbr-fill').forEach(function(el){ if(el.dataset.width) el.style.width=el.dataset.width; });
        barsWrap.querySelectorAll('.savant-bubble').forEach(function(el){ if(el.dataset.left) el.style.left=el.dataset.left; });
      });
    }, 80);

    return html;
  }

  return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
}


// -- PITCH USAGE TAB ----------------------------------------
function renderPitchUsage(name, pitch) {
  var sc = (pitch && pitch.scatter) ? pitch.scatter : [];
  if (!sc.length) {
    return '<div class="empty-state"><div class="empty-state-icon">&#128203;</div><h3>No pitch data available</h3></div>';
  }
  var gameMap = {};
  sc.forEach(function(s) {
    var dt = (s.date || '').slice(0, 10); if (!dt) return;
    if (!gameMap[dt]) gameMap[dt] = []; gameMap[dt].push(s);
  });
  var gameDates = Object.keys(gameMap).sort();
  var today    = new Date(); today.setHours(0,0,0,0);
  var lastDate = gameDates.length ? new Date(gameDates[gameDates.length-1] + 'T12:00:00') : null;
  var daysRest = lastDate ? Math.floor((today - lastDate) / 86400000) : 99;
  var lastCount= lastDate ? gameMap[gameDates[gameDates.length-1]].length : 0;
  var avail, availBg, availText;
  if      (daysRest <= 1)                    { avail='UNAVAILABLE'; availBg='rgba(220,50,50,0.15)'; availText='#DC3232'; }
  else if (daysRest === 2 && lastCount >= 20){ avail='QUESTIONABLE'; availBg='rgba(255,140,0,0.15)'; availText='#FF8C00'; }
  else                                       { avail='AVAILABLE';    availBg='rgba(50,200,100,0.15)'; availText='#32C864'; }
  var restNote = daysRest===99 ? 'No recent appearances' :
                 daysRest===0  ? 'Pitched today' :
                 daysRest===1  ? 'Pitched yesterday - '+lastCount+' pitches' :
                 daysRest+' days rest - last outing: '+lastCount+' pitches';
  var html =
    '<div class="stat-card" style="margin-bottom:16px">' +
      '<div style="padding:20px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap">' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 28px;background:'+availBg+';border:1px solid '+availText+';border-radius:6px;flex-shrink:0">' +
          '<div style="font-family:var(--font-display);font-size:20px;letter-spacing:2px;color:'+availText+'">'+avail+'</div>' +
          '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.05em;margin-top:2px">CURRENT STATUS</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-family:var(--font-mono);font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:6px">'+restNote+'</div>' +
          '<div style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.35)">'+gameDates.length+' appearance'+(gameDates.length!==1?'s':'')+' this season</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Season Log</span>' +
    '<span class="stat-card-subtitle">'+gameDates.length+' outing'+(gameDates.length!==1?'s':'')+'</span></div>' +
    '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Date</th><th style="text-align:left">Opp</th>' +
    '<th>Pitches</th><th>K</th><th>BB</th><th>STR%</th><th>WHIFF%</th><th>Rest</th><th>Status</th>' +
    '</tr></thead><tbody>';
  gameDates.forEach(function(dt, idx) {
    var gsc=gameMap[dt], gTot=gsc.length;
    var gK   =gsc.filter(function(s){return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking';}).length;
    var gBB  =gsc.filter(function(s){return s.outcome==='Walk'||s.outcome==='Intentional Walk';}).length;
    var gStr =gsc.filter(function(s){return['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome);}).length;
    var gSwS =gsc.filter(function(s){return s.outcome==='Swinging Strike';}).length;
    var gFo  =gsc.filter(function(s){return s.outcome==='Foul';}).length;
    var gIP  =gsc.filter(function(s){return['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome);}).length;
    var gSw  =gSwS+gFo+gIP;
    var oppLabel='--';
    if(gsc[0]&&gsc[0].batter_team){ var bt=resolveTeam(gsc[0].batter_team); oppLabel=bt?bt.abbreviation:gsc[0].batter_team.slice(0,3).toUpperCase(); }
    var restDays=null, restStr='--';
    if(idx>0){ var prev=new Date(gameDates[idx-1]+'T12:00:00'),curr=new Date(dt+'T12:00:00'); restDays=Math.floor((curr-prev)/86400000); restStr=restDays+'d'; }
    var rowStatus,rowColor;
    if(restDays===null)                      {rowStatus='DEBUT';      rowColor='rgba(255,255,255,0.3)';}
    else if(restDays<=1)                     {rowStatus='B2B';        rowColor='#DC3232';}
    else if(restDays===2&&gTot>=20)          {rowStatus='SHORT REST'; rowColor='#FF8C00';}
    else                                     {rowStatus='NORMAL';     rowColor='#32C864';}
    var dObj=new Date(dt+'T12:00:00');
    var dateLabel=dObj.toLocaleDateString('en-CA',{month:'short',day:'numeric'}).toUpperCase();
    html+=
      '<tr>'+
      '<td style="white-space:nowrap;font-family:var(--font-mono);font-size:11px">'+dateLabel+'</td>'+
      '<td><span style="font-family:var(--font-mono);font-size:11px;font-weight:600">'+oppLabel+'</span></td>'+
      '<td>'+gTot+'</td><td>'+gK+'</td><td>'+gBB+'</td>'+
      '<td>'+(gTot>0?fmt1(gStr/gTot*100)+'%':'--')+'</td>'+
      '<td>'+(gSw>0?fmt1(gSwS/gSw*100)+'%':'--')+'</td>'+
      '<td style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.5)">'+restStr+'</td>'+
      '<td><span style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;color:'+rowColor+'">'+rowStatus+'</span></td>'+
      '</tr>';
  });
  html+='</tbody></table></div></div>';
  return html;
}

function renderSeasonStats(name, type, sum, pitch) {
  var allSeasons = DATA.iblHistory[name] || [];

  var seasons = allSeasons.filter(function(s) {
    return type === 'pitcher'
      ? (s.IP != null && s.IP > 0)
      : (s.AB != null && s.AB > 0);
  });

  if (!seasons.length) {
    return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No historical data available</h3></div>';
  }

  var html = '<div class="stat-card"><div class="stat-card-header">' +
    '<span class="stat-card-title">Full Season Stats</span>' +
    '<span class="stat-card-subtitle">' + seasons.length + ' season' + (seasons.length !== 1 ? 's' : '') + '</span>' +
    '</div><div class="table-wrap"><table class="stat-table"><thead><tr>';

  if (type === 'pitcher') {
    html += '<th>Season</th><th>Team</th>' +
      '<th>W</th><th>L</th><th>ERA</th><th>G</th><th>GS</th><th>SV</th>' +
      '<th>IP</th><th>H</th><th>ER</th><th>BB</th><th>K</th><th>WP</th>';
  } else {
    html += '<th>Season</th><th>Team</th><th>Pos</th>' +
      '<th>G</th><th>AB</th><th>R</th><th>H</th>' +
      '<th>2B</th><th>3B</th><th>HR</th><th>RBI</th>' +
      '<th>SB</th><th>BB</th><th>SO</th>' +
      '<th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>';
  }

  html += '</tr></thead><tbody>';

  seasons.forEach(function(s) {
    html += '<tr>';
    html += '<td style="color:var(--text-dim);white-space:nowrap">' + s.season + '</td>';
    html += '<td style="white-space:nowrap">' + (s.team || '—') + '</td>';

    if (type === 'pitcher') {
      html +=
        '<td>' + (s.W   != null ? s.W   : '—') + '</td>' +
        '<td>' + (s.L   != null ? s.L   : '—') + '</td>' +
        '<td class="highlight-val">' + (s.ERA != null ? fmt2(s.ERA) : '—') + '</td>' +
        '<td>' + (s.G   != null ? s.G   : '—') + '</td>' +
        '<td>' + (s.GS  != null ? s.GS  : '—') + '</td>' +
        '<td>' + (s.SV  != null ? s.SV  : '—') + '</td>' +
        '<td>' + (s.IP  != null ? fmtIP(s.IP) : '—') + '</td>' +
        '<td>' + (s.HA  != null ? s.HA  : '—') + '</td>' +
        '<td>' + (s.ER  != null ? s.ER  : '—') + '</td>' +
        '<td>' + (s.BBA != null ? s.BBA : '—') + '</td>' +
        '<td class="highlight-val">' + (s.KP  != null ? s.KP  : '—') + '</td>' +
        '<td>' + (s.WP  != null ? s.WP  : '—') + '</td>';
    } else {
      html +=
        '<td>' + (s.pos  != null ? s.pos  : '—') + '</td>' +
        '<td>' + (s.G    != null ? s.G    : '—') + '</td>' +
        '<td>' + (s.AB   != null ? s.AB   : '—') + '</td>' +
        '<td>' + (s.R    != null ? s.R    : '—') + '</td>' +
        '<td>' + (s.H    != null ? s.H    : '—') + '</td>' +
        '<td>' + (s['2B']!= null ? s['2B']: '—') + '</td>' +
        '<td>' + (s['3B']!= null ? s['3B']: '—') + '</td>' +
        '<td>' + (s.HR   != null ? s.HR   : '—') + '</td>' +
        '<td>' + (s.RBI  != null ? s.RBI  : '—') + '</td>' +
        '<td>' + (s.SB   != null ? s.SB   : '—') + '</td>' +
        '<td>' + (s.BB   != null ? s.BB   : '—') + '</td>' +
        '<td>' + (s.SO   != null ? s.SO   : '—') + '</td>' +
        '<td class="highlight-val">' + (s.AVG != null ? fmt3(s.AVG) : '—') + '</td>' +
        '<td>' + (s.OBP  != null ? fmt3(s.OBP) : '—') + '</td>' +
        '<td>' + (s.SLG  != null ? fmt3(s.SLG) : '—') + '</td>' +
        '<td class="highlight-val">' + (s.OPS  != null ? fmt3(s.OPS) : '—') + '</td>';
    }

    html += '</tr>';
  });

  html += '</tbody></table></div></div>';
  return html;
}
// ── STRIKE ZONE TAB ───────────────────────────────
function renderZone(name, type, pitch, container, seasonFilter) {
  seasonFilter = seasonFilter || 'all';
  var points = [];
  if (type === 'batter' && pitch && pitch.scatter) {
    points = pitch.scatter.filter(function(s) { return s.x != null && s.y != null; });
  } else if (type === 'pitcher') {
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) {
        if (s.pitcher === name && s.x != null && s.y != null) points.push(s);
      });
    });
  }

  if (!points.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#127919;</div><h3>No pitch location data</h3></div>';
    return;
  }

  var PITCH_COLORS = {
    'Fastball':     '#f87171',
    'Breaking Ball':'#60a5fa',
    'Offspeed':     '#a78bfa',
    'Changeup':     '#34d399',
    'Curveball':    '#fb923c',
    'Slider':       '#facc15',
    'Cutter':       '#f472b6',
    'Sinker':       '#22d3ee'
  };
  var FALLBACK_COLORS = ['#f87171','#60a5fa','#a78bfa','#34d399','#fb923c','#facc15','#f472b6','#22d3ee'];
  var typeSet = [];
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    if (!typeSet.includes(t)) typeSet.push(t);
  });
  typeSet.sort();
  var typeColorMap = {};
  typeSet.forEach(function(t, i) {
    typeColorMap[t] = PITCH_COLORS[t] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  });
  function dotColor(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    return typeColorMap[t] || '#6b7a9a';
  }

  var RESULT_FILTERS = [
    { lbl: 'All',        val: 'all'       },
    { lbl: 'Hits',       val: 'hit'       },
    { lbl: 'Outs',       val: 'out'       },
    { lbl: 'Strikeouts', val: 'strikeout' },
    { lbl: 'Walks',      val: 'walk'      },
    { lbl: 'Balls',      val: 'ball'      },
    { lbl: 'Strikes',    val: 'strike'    }
  ];
  function resultMatch(s, filter) {
    if (filter === 'all') return true;
    var o = s.outcome || '';
    if (filter === 'hit')       return ['Single','Double','Triple','Home Run'].includes(o);
    if (filter === 'strikeout') return o === 'Strikeout Swinging' || o === 'Strikeout Looking';
    if (filter === 'ball')      return o === 'Ball';
    if (filter === 'walk')      return o === 'Walk' || o === 'Intentional Walk' || o === 'Hit By Pitch';
    if (filter === 'strike')    return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(o);
    if (filter === 'out')       return ['Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Caught Stealing','Sacrifice Fly','Sacrifice Bunt'].includes(o);
    return true;
  }

  // ── ZONE DIMENSIONS ──────────────────────────────
  // Strike zone: x from -1 to 1 (width = 2 units)
  // Strike zone: y from 0 to 1.5 (height = 1.5 units) — taller/slimmer shape
  // x = vertical (0=bottom of zone, 1=top), y = horizontal (-1=left, 0=middle, 1=right catcher view)
  // Canvas toCanvasX maps x→screen-x and toCanvasY maps y→screen-y, so for rendering:
  // screen horizontal = x data axis, screen vertical = y data axis (canvas already handles this correctly via toCanvasX/toCanvasY)
  // Zone boundaries: x (horiz on screen) -1..1, y (vert on screen) 0..1
  // BUT actual data: x=vertical, y=horizontal. We keep ZONE constants for canvas rendering unchanged,
  // but all in-zone/ooz logic for stats uses corrected axes below.
  var ZONE_X1 = -1, ZONE_X2 = 1;
  var ZONE_Y1 = 0,  ZONE_Y2 = 1;

  var totalPts = points.length;
  // Stats: x=vertical(0=bot,1=top), y=horizontal(-1=left,1=right)
  var inZone   = points.filter(function(s){ return s.y >= -1 && s.y <= 1 && s.x >= 0 && s.x <= 1; }).length;
  var ks       = points.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
  var hits     = points.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
  var swStr    = points.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
  var chases   = points.filter(function(s){ return (s.y < -1 || s.y > 1 || s.x < 0 || s.x > 1)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;

  var legendHTML = typeSet.map(function(t) {
    return '<div class="legend-item"><div class="legend-dot" style="background:' + typeColorMap[t] + '"></div>' + t + '</div>';
  }).join('');

  // Build date controls for pitcher zone
  var allDates = [];
  var allYears = [];
  if (type === 'pitcher') {
    var dateSet = new Set();
    var yearSet = new Set();
    points.forEach(function(s) {
      if (s.date) { dateSet.add(s.date); yearSet.add(s.date.slice(0,4)); }
    });
    allDates = Array.from(dateSet).sort();
    allYears = Array.from(yearSet).sort();
  }

  var dateFilterHTML = '';
  if (type === 'pitcher' && allDates.length > 1) {
    // Season options: one per unique year e.g. "Summer 2025"
    var seasonOptions = '<option value="all">All</option>' +
      allYears.map(function(y) { return '<option value="year:'+y+'">Summer '+y+'</option>'; }).join('');

    // Game date options
    var dateOptions = '<option value="all">All</option>' +
      allDates.map(function(d) { return '<option value="'+d+'">'+d+'</option>'; }).join('');

    dateFilterHTML =
      '<div style="margin-bottom:16px;display:flex;gap:20px;flex-wrap:wrap">' +

      '<div>' +
      '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Date Filter</div>' +
      '<select id="zone-season-select" style="background:#0e1525;border:1.5px solid rgba(255,184,28,0.35);border-radius:6px;color:#FFB81C;font-family:var(--font-mono);font-size:11px;padding:8px 12px;cursor:pointer;outline:none;letter-spacing:0.5px;">' + seasonOptions + '</select>' +
      '</div>' +

      '<div>' +
      '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Game Date</div>' +
      '<select id="zone-date-select" style="background:#0e1525;border:1.5px solid rgba(255,184,28,0.35);border-radius:6px;color:#FFB81C;font-family:var(--font-mono);font-size:11px;padding:8px 12px;cursor:pointer;outline:none;letter-spacing:0.5px;">' + dateOptions + '</select>' +
      '</div>' +

      '</div>';
  }

  container.innerHTML =
    '<div class="stat-card">' +
    '<div class="stat-card-header"><span class="stat-card-title">Strike Zone</span>' +
    '<span class="stat-card-subtitle" id="zone-pitch-count">' + totalPts + ' pitches plotted</span></div>' +
    '<div class="zone-container">' +

    dateFilterHTML +

    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">View</div>' +
    '<div class="zone-controls" id="zone-view-btns">' +
    '<button class="zone-filter-btn active" data-view="scatter">Scatter</button>' +
    '<button class="zone-filter-btn" data-view="grid">Zone Grid</button>' +
    '<button class="zone-filter-btn" data-view="heatmap">Heat Map</button>' +
    '</div></div>' +

    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Filter by Outcome</div>' +
    '<div class="zone-controls" id="zone-result-filters">' +
    RESULT_FILTERS.map(function(r) {
      return '<button class="zone-filter-btn' + (r.val==='all'?' active':'') + '" data-result="' + r.val + '">' + r.lbl + '</button>';
    }).join('') + '</div></div>' +

    '<div style="margin-bottom:16px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Filter by Pitch Type</div>' +
    '<div class="zone-controls" id="zone-type-filters">' +
    '<button class="zone-filter-btn active" data-ptype="all">All</button>' +
    typeSet.map(function(t) {
      return '<button class="zone-filter-btn" data-ptype="' + t + '">' + t + '</button>';
    }).join('') + '</div></div>' +

    '<div style="margin-bottom:20px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">' + (type === 'batter' ? 'Filter by Pitcher Hand' : 'Filter by Batter Hand') + '</div>' +
    '<div class="zone-controls" id="zone-hand-filters">' +
    '<button class="zone-filter-btn active" data-hand="all">All</button>' +
    (type === 'batter'
      ? '<button class="zone-filter-btn" data-hand="R">RHP</button><button class="zone-filter-btn" data-hand="L">LHP</button>'
      : '<button class="zone-filter-btn" data-hand="R">Right (R)</button><button class="zone-filter-btn" data-hand="L">Left (L)</button>') +
    '</div></div>' +

    '<div class="zone-wrap">' +
    '<div class="zone-canvas-wrap" style="position:relative">' +
    '<canvas id="zone-canvas" width="480" height="660" style="width:300px;height:413px"></canvas>' +
    '<div id="zone-tooltip" class="zone-tooltip hidden"></div>' +
    '</div>' +
    '<div style="flex:1;min-width:160px">' +
    '<div class="zone-legend" id="zone-legend" style="margin-bottom:20px">' +
    '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Pitch Type</div>' +
    legendHTML + '</div>' +
    '<div class="zone-stats-grid">' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-pitches">' + totalPts + '</div><div class="zone-stat-lbl">Pitches</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-zone">' + fmt1(inZone/totalPts*100) + '%</div><div class="zone-stat-lbl">Zone%</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-ks">' + ks + '</div><div class="zone-stat-lbl">Strikeouts</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-hits">' + hits + '</div><div class="zone-stat-lbl">Hits</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-swk">' + swStr + '</div><div class="zone-stat-lbl">Swinging K</div></div>' +
    '<div class="zone-stat-box"><div class="zone-stat-val" id="zs-chases">' + chases + '</div><div class="zone-stat-lbl">Chases</div></div>' +
    '</div></div></div></div></div>';

  // ── Canvas setup ──────────────────────────────
  var activeResult   = 'all';
  var activeView     = 'scatter';
  var activeType     = 'all';
  var activeHand     = 'all';
  var activeZoneDate = 'all';

  // SCATTER_BOUNDS: wide view for scatter plot
  // CLEAN_BOUNDS: zoomed view for grid/heatmap — ratio matches zone aspect (wider than tall in data space)
  var SCATTER_BOUNDS = { xMin:-2.5, xMax:2.5,  yMin:-0.8, yMax:2.2  };
  var CLEAN_BOUNDS   = { xMin:-1.85, xMax:1.85, yMin:-0.85, yMax:1.85 };
  var X_MIN = CLEAN_BOUNDS.xMin, X_MAX = CLEAN_BOUNDS.xMax;
  var Y_MIN = CLEAN_BOUNDS.yMin, Y_MAX = CLEAN_BOUNDS.yMax;

  var canvas = document.getElementById('zone-canvas');
  var ctx    = canvas.getContext('2d');

  var DPR = window.devicePixelRatio || 1;
  var CSS_W = 300, CSS_H = 413;
  canvas.width  = CSS_W * DPR;
  canvas.height = CSS_H * DPR;
  canvas.style.width  = CSS_W + 'px';
  canvas.style.height = CSS_H + 'px';
  ctx.scale(DPR, DPR);

  var W = CSS_W, H = CSS_H;
  var PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 32;
  var PW = W - PAD_L - PAD_R;
  var PH = H - PAD_T - PAD_B;

  function setBounds(xMin, xMax, yMin, yMax) {
    X_MIN = xMin; X_MAX = xMax; Y_MIN = yMin; Y_MAX = yMax;
  }

  function toCanvasX(x) { return PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * PW; }
  function toCanvasY(y) { return PAD_T + PH - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * PH; }
  function fromCanvasX(cx) { return X_MIN + ((cx - PAD_L) / PW) * (X_MAX - X_MIN); }
  function fromCanvasY(cy) { return Y_MIN + (PH - (cy - PAD_T)) / PH * (Y_MAX - Y_MIN); }

  // ── Shared background ─────────────────────────
  function drawBatterSilhouette(facingRight) {
    // Traces the reference silhouette: batter in load/stride position
    // facing toward the zone. Front foot lifted, back foot planted,
    // knees bent, torso coiled, hands up near ear, bat angled back over shoulder.
    //
    // All coords in canvas-pixel space, built from unit scale then transformed.
    // Unit batter fits in a 1x2 box; we scale to ~55px wide, ~160px tall.
    // Origin = back foot (planted foot, away from zone).

    var scale  = Math.abs(toCanvasX(0) - toCanvasX(1.1)); // ~130px per unit
    var dir    = facingRight ? 1 : -1;

    // Anchor: back foot bottom, placed just outside the zone edge
    var ax = toCanvasX(facingRight ? -1.52 : 1.52);
    var ay = toCanvasY(-0.12);

    // Helper: place a point relative to anchor in batter's local space
    // lx = lateral (positive = toward zone), ly = vertical (positive = up)
    function p(lx, ly) {
      return { x: ax + dir * lx * scale, y: ay - ly * scale };
    }

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle   = '#FFB81C';
    ctx.strokeStyle = '#FFB81C';
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    // ── Full body silhouette as one filled shape ────
    // Traced in CCW order from back foot, matching reference image pose:
    // back foot planted, front foot lifted/striding toward zone,
    // knees bent deeply, butt out, torso upright-ish, hands at ear, bat back.
    ctx.beginPath();

    // Back foot / heel (origin area)
    ctx.moveTo(p(-0.04, 0.00).x, p(-0.04, 0.00).y);
    ctx.lineTo(p( 0.10, 0.00).x, p( 0.10, 0.00).y);  // toe of back foot

    // Back leg up to knee (bent, knee pushed back/out)
    ctx.quadraticCurveTo(
      p( 0.12, 0.12).x, p( 0.12, 0.12).y,
      p( 0.05, 0.28).x, p( 0.05, 0.28).y   // back knee
    );

    // Thigh up to hip/butt (butt sticking out away from zone)
    ctx.quadraticCurveTo(
      p( 0.02, 0.38).x, p( 0.02, 0.38).y,
      p(-0.08, 0.42).x, p(-0.08, 0.42).y   // back hip/butt
    );

    // Butt curve to front hip
    ctx.quadraticCurveTo(
      p(-0.05, 0.48).x, p(-0.05, 0.48).y,
      p( 0.12, 0.50).x, p( 0.12, 0.50).y   // front hip
    );

    // Front thigh down (front leg bent, foot lifted)
    ctx.quadraticCurveTo(
      p( 0.18, 0.38).x, p( 0.18, 0.38).y,
      p( 0.22, 0.26).x, p( 0.22, 0.26).y   // front knee
    );

    // Front shin angled forward (stride leg)
    ctx.quadraticCurveTo(
      p( 0.28, 0.16).x, p( 0.28, 0.16).y,
      p( 0.32, 0.08).x, p( 0.32, 0.08).y   // front ankle
    );

    // Front foot (toe up, heel down, striding toward zone)
    ctx.lineTo(p( 0.40, 0.06).x, p( 0.40, 0.06).y);
    ctx.lineTo(p( 0.40, 0.00).x, p( 0.40, 0.00).y);
    ctx.lineTo(p( 0.28, 0.00).x, p( 0.28, 0.00).y);  // front heel

    // Front shin back up inside
    ctx.quadraticCurveTo(
      p( 0.24, 0.14).x, p( 0.24, 0.14).y,
      p( 0.18, 0.24).x, p( 0.18, 0.24).y   // front knee inside
    );

    // Inside front thigh up to crotch
    ctx.quadraticCurveTo(
      p( 0.14, 0.36).x, p( 0.14, 0.36).y,
      p( 0.08, 0.46).x, p( 0.08, 0.46).y   // crotch
    );

    // Inside back thigh down to back knee inside
    ctx.quadraticCurveTo(
      p( 0.04, 0.36).x, p( 0.04, 0.36).y,
      p( 0.06, 0.26).x, p( 0.06, 0.26).y   // back knee inside
    );

    // Back of back shin down to heel
    ctx.quadraticCurveTo(
      p( 0.06, 0.12).x, p( 0.06, 0.12).y,
      p(-0.04, 0.00).x, p(-0.04, 0.00).y   // back heel
    );

    ctx.fill();

    // ── Torso / upper body ─────────────────────────
    ctx.beginPath();
    // Waist left (away from zone side)
    ctx.moveTo(p(-0.06, 0.48).x, p(-0.06, 0.48).y);
    // Left side of torso up to back shoulder
    ctx.quadraticCurveTo(
      p(-0.10, 0.62).x, p(-0.10, 0.62).y,
      p(-0.04, 0.76).x, p(-0.04, 0.76).y   // back shoulder
    );
    // Neck
    ctx.lineTo(p( 0.02, 0.82).x, p( 0.02, 0.82).y);
    // Front shoulder (toward zone, slightly lower — coiled)
    ctx.lineTo(p( 0.14, 0.78).x, p( 0.14, 0.78).y);
    // Right side of torso down to waist right
    ctx.quadraticCurveTo(
      p( 0.16, 0.64).x, p( 0.16, 0.64).y,
      p( 0.12, 0.50).x, p( 0.12, 0.50).y   // front waist
    );
    // Waist back
    ctx.quadraticCurveTo(
      p( 0.02, 0.47).x, p( 0.02, 0.47).y,
      p(-0.06, 0.48).x, p(-0.06, 0.48).y
    );
    ctx.fill();

    // ── Head ───────────────────────────────────────
    var headCx = p( 0.02, 0.90).x;
    var headCy = p( 0.02, 0.90).y;
    var hr2 = scale * 0.085;
    ctx.beginPath();
    ctx.arc(headCx, headCy, hr2, 0, Math.PI*2);
    ctx.fill();

    // Helmet cap (flat top, brim toward zone)
    ctx.beginPath();
    ctx.arc(headCx, headCy - hr2*0.1, hr2*1.05, Math.PI, 0);  // dome
    ctx.lineTo(headCx + dir*hr2*1.6, headCy + hr2*0.1);         // brim tip
    ctx.lineTo(headCx + dir*hr2*0.2, headCy + hr2*0.1);
    ctx.closePath();
    ctx.fill();

    // ── Arms — both hands up near ear, elbow bent ──
    // Hands position: above/behind back shoulder, near ear
    var handX = p(-0.02, 0.98).x;
    var handY = p(-0.02, 0.98).y;
    var armW  = scale * 0.065;
    ctx.lineWidth = armW;

    // Back arm (elbow up, forearm to hands)
    ctx.beginPath();
    ctx.moveTo(p(-0.04, 0.76).x, p(-0.04, 0.76).y);  // back shoulder
    ctx.quadraticCurveTo(
      p(-0.14, 0.90).x, p(-0.14, 0.90).y,              // elbow out/up
      handX, handY
    );
    ctx.stroke();

    // Front arm (wraps around, elbow tucked in)
    ctx.beginPath();
    ctx.moveTo(p( 0.14, 0.78).x, p( 0.14, 0.78).y);  // front shoulder
    ctx.quadraticCurveTo(
      p( 0.08, 0.90).x, p( 0.08, 0.90).y,              // elbow tucked
      handX, handY
    );
    ctx.stroke();

    // ── Bat — from hands, angled back over shoulder ─
    var batLen = scale * 0.62;
    var batW   = scale * 0.03;
    ctx.lineWidth = batW;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    // Bat goes up and back (away from zone), ~50deg from vertical
    ctx.lineTo(
      handX - dir * batLen * 0.55,
      handY - batLen * 0.82
    );
    ctx.stroke();

    ctx.restore();
  }

  function drawBackground(opts) {
    opts = opts || {};
    ctx.fillStyle = '#0e1525';
    ctx.fillRect(0, 0, W, H);

    if (!opts.clean) {
      ctx.strokeStyle = 'rgba(255,184,28,0.05)';
      ctx.lineWidth = 1;
      [-2,-1,0,1,2].forEach(function(xv) {
        var cx = toCanvasX(xv);
        ctx.beginPath(); ctx.moveTo(cx, PAD_T); ctx.lineTo(cx, PAD_T+PH); ctx.stroke();
      });
      [-0.5,0,0.5,1.0,1.5].forEach(function(yv) {
        var cy = toCanvasY(yv);
        ctx.beginPath(); ctx.moveTo(PAD_L, cy); ctx.lineTo(PAD_L+PW, cy); ctx.stroke();
      });

      var plateCx = toCanvasX(0), plateY = toCanvasY(Y_MIN+0.05);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.moveTo(plateCx, plateY-4);
      ctx.lineTo(plateCx-8, plateY+4);
      ctx.lineTo(plateCx+8, plateY+4);
      ctx.closePath(); ctx.fill();
    }
  }

  // ── Strike zone box — uses current active bounds so dots and box align ──
  function drawStrikeZone() {
    function czx(x) { return toCanvasX(x); }
    function czy(y) { return toCanvasY(y); }
    var zx1=czx(ZONE_X1), zx2=czx(ZONE_X2);
    var zy1=czy(ZONE_Y2), zy2=czy(ZONE_Y1);   // zy1=top of zone, zy2=bottom
    // Label: From a Pitcher's POV
    ctx.save();
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = 'rgba(255,184,28,0.75)';
    ctx.textAlign = 'center';
    ctx.fillText("FROM A PITCHER'S POV", (zx1+zx2)/2, zy1 - 8);
    ctx.restore();

    ctx.fillStyle = 'rgba(255,184,28,0.03)';
    ctx.fillRect(zx1, zy1, zx2-zx1, zy2-zy1);
    ctx.strokeStyle = 'rgba(255,184,28,0.85)';
    ctx.lineWidth = 2;
    ctx.strokeRect(zx1, zy1, zx2-zx1, zy2-zy1);
    // Inner 3x3 dividers
    ctx.strokeStyle = 'rgba(255,184,28,0.25)';
    ctx.lineWidth = 0.8;
    for (var i=1; i<3; i++) {
      var xi=zx1+(i/3)*(zx2-zx1), yi=zy1+(i/3)*(zy2-zy1);
      ctx.beginPath(); ctx.moveTo(xi,zy1); ctx.lineTo(xi,zy2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(zx1,yi); ctx.lineTo(zx2,yi); ctx.stroke();
    }
  }

  // ── Scatter draw ───────────────────────────────
  function drawScatter(filtered) {
    filtered.forEach(function(s) {
      var cx=toCanvasX(s.x), cy=toCanvasY(s.y), color=dotColor(s);
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI*2);
      ctx.fillStyle = color+'bb';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    });
  }

  // ── Zone Grid: Savant-style 13 zones ─────────────────────────────
  function drawGrid(filtered) {
    var total = filtered.length;

    var ZX1=ZONE_X1, ZX2=ZONE_X2, ZY1=ZONE_Y1, ZY2=ZONE_Y2;
    var cW = (ZX2-ZX1)/3, cH = (ZY2-ZY1)/3; // canvas grid: x horiz -1..1 cols, y vert 0..1 rows

    // 9 inner cells (3x3 grid), row 0 = top
    var inner = [];
    for (var row=0; row<3; row++) {
      for (var col=0; col<3; col++) {
        inner.push({
          x1: ZX1+col*cW,     x2: ZX1+(col+1)*cW,
          y1: ZY2-(row+1)*cH, y2: ZY2-row*cH
        });
      }
    }

    inner.forEach(function(z) {
      z.count = 0;
      filtered.forEach(function(s) {
        if (s.y >= z.x1 && s.y < z.x2 && s.x >= z.y1 && s.x < z.y2) z.count++; // data-y=horiz(x-cell), data-x=vert(y-cell)
      });
      z.pct = total > 0 ? z.count/total*100 : 0;
    });

    // 4 outer shadow zones — Statcast style
    // TL: above zone + left of zone (top-left quadrant outside)
    // TR: above zone + right of zone (top-right corner)
    // BL: below zone + left (bottom-left corner)
    // BR: below zone + right (bottom-right quadrant outside)
    var outer = [
      { label:'TL', x1:-99, x2:0,    y1:ZY2, y2:99,  count:0 },  // top-left outside
      { label:'TR', x1:0,   x2:99,   y1:ZY2, y2:99,  count:0 },  // top-right outside
      { label:'BL', x1:-99, x2:0,    y1:-99, y2:ZY1, count:0 },  // bottom-left outside
      { label:'BR', x1:0,   x2:99,   y1:-99, y2:ZY1, count:0 },  // bottom-right outside
    ];

    // Also catch pitches beside the zone (left/right of zone, within y bounds)
    var sideL = { count:0 };  // left of zone, within zone height
    var sideR = { count:0 };  // right of zone, within zone height

    filtered.forEach(function(s) {
      var inInner = inner.some(function(z) {
        return s.y >= z.x1 && s.y < z.x2 && s.x >= z.y1 && s.x < z.y2;
      });
      if (inInner) return;
      // Assign to outer quadrant
      // x=vertical(0=bot,1=top)=canvas-y axis; y=horizontal(-1..1)=canvas-x axis
      var inZoneY = s.x >= ZY1 && s.x < ZY2;   // data-x is vert, maps to canvas-y (ZY range)
      var inZoneX = s.y >= ZX1 && s.y < ZX2;   // data-y is horiz, maps to canvas-x (ZX range)
      if (!inZoneY && s.y < 0)  outer[0].count += (s.x >= ZY2) ? 1 : 0;
      if (!inZoneY && s.y < 0)  outer[2].count += (s.x < ZY1)  ? 1 : 0;
      if (!inZoneY && s.y >= 0) outer[1].count += (s.x >= ZY2) ? 1 : 0;
      if (!inZoneY && s.y >= 0) outer[3].count += (s.x < ZY1)  ? 1 : 0;
      // above/below zone (data-x is vertical), within horizontal bounds
      if (inZoneX && s.x >= ZY2) { outer[0].count++; outer[1].count++; } // split above
      if (inZoneX && s.x < ZY1)  { outer[2].count++; outer[3].count++; } // split below
      // beside zone (data-y is horizontal), within vertical bounds
      if (inZoneY && s.y < ZX1)  { outer[0].count++; outer[2].count++; }
      if (inZoneY && s.y >= ZX2) { outer[1].count++; outer[3].count++; }
    });

    // Simpler: just count by quadrant outside inner zone
    outer.forEach(function(z) { z.count = 0; });
    filtered.forEach(function(s) {
      var inInner = inner.some(function(z) {
        return s.y >= z.x1 && s.y < z.x2 && s.x >= z.y1 && s.x < z.y2;
      });
      if (inInner) return;
      var isLeft = s.y < (ZX1+ZX2)/2;   // data-y is horizontal
      var isTop  = s.x >= (ZY1+ZY2)/2;  // data-x is vertical
      if ( isLeft &&  isTop) outer[0].count++;
      if (!isLeft &&  isTop) outer[1].count++;
      if ( isLeft && !isTop) outer[2].count++;
      if (!isLeft && !isTop) outer[3].count++;
    });
    outer.forEach(function(z) { z.pct = total > 0 ? z.count/total*100 : 0; });

    var maxInner = 0, maxOuter = 0;
    inner.forEach(function(z) { if (z.count > maxInner) maxInner = z.count; });
    outer.forEach(function(z) { if (z.count > maxOuter) maxOuter = z.count; });
    outer.forEach(function(z) { z.intensity = maxOuter > 0 ? z.count/maxOuter : 0; });

    // Canvas coords for zone box
    var SX1 = toCanvasX(ZX1), SX2 = toCanvasX(ZX2);
    var SY1 = toCanvasY(ZY2), SY2 = toCanvasY(ZY1);
    var zoneW = SX2 - SX1;
    var zoneH = SY2 - SY1;
    var sqW = zoneW / 3;
    var sqH = zoneH / 3;

    // Outer cell positions — Statcast 13-zone layout:
    // TL: top-left, spans 2/3 of zone width, sits above zone
    // TR: top-right corner only (1/3 wide), sits above zone
    // BL: bottom-left corner only (1/3 wide), sits below zone
    // BR: bottom-right, spans 2/3 of zone width, sits below zone
    outer[0].px = { x:SX1,        y:SY1-sqH, w:sqW*2, h:sqH };  // TL — wide, above-left
    outer[1].px = { x:SX1+sqW*2,  y:SY1-sqH, w:sqW,   h:sqH };  // TR — narrow, above-right
    outer[2].px = { x:SX1,        y:SY2,     w:sqW,   h:sqH };  // BL — narrow, below-left
    outer[3].px = { x:SX1+sqW,    y:SY2,     w:sqW*2, h:sqH };  // BR — wide, below-right

    // Draw outer cells
    outer.forEach(function(z) {
      var p = z.px;
      if (!p || p.w <= 0 || p.h <= 0) return;
      ctx.fillStyle = z.count === 0
        ? 'rgba(96,165,250,0.12)'
        : 'rgba(96,165,250,'+(0.1+0.55*z.intensity)+')';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(96,165,250,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.save();
      ctx.beginPath(); ctx.rect(p.x+1, p.y+1, p.w-2, p.h-2); ctx.clip();
      ctx.fillStyle = z.intensity > 0.55 ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 12px DM Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.pct.toFixed(1)+'%', p.x+p.w/2, p.y+p.h/2);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });

    // Draw inner 3x3
    inner.forEach(function(z) {
      var cx1=toCanvasX(z.x1), cx2=toCanvasX(z.x2);
      var cy1=toCanvasY(z.y2), cy2=toCanvasY(z.y1);
      var cw=cx2-cx1, ch=cy2-cy1;
      var intensity = maxInner > 0 ? z.count/maxInner : 0;
      if (z.count === 0) {
        ctx.fillStyle = 'rgba(255,184,28,0.05)';
      } else {
        var r=Math.round(96+(255-96)*intensity);
        var g=Math.round(165+(184-165)*intensity);
        var b=Math.round(250+(28-250)*intensity);
        ctx.fillStyle = 'rgba('+r+','+g+','+b+','+(0.3+0.65*intensity)+')';
      }
      ctx.fillRect(cx1, cy1, cw, ch);
      ctx.strokeStyle = 'rgba(255,184,28,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx1, cy1, cw, ch);
      ctx.save();
      ctx.beginPath(); ctx.rect(cx1+1, cy1+1, cw-2, ch-2); ctx.clip();
      ctx.fillStyle = intensity > 0.55 ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.font = 'bold 13px DM Mono, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(z.pct.toFixed(1)+'%', cx1+cw/2, cy1+ch/2);
      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    });
  }

  // ── Heat map draw ────────────────────────────────
  function drawHeatmap(filtered) {
    if (!filtered.length) return;

    var GW = 200, GH = 200;
    var density = new Float32Array(GW * GH);
    var SIGMA = Math.max(6, Math.min(14, 120 / Math.sqrt(filtered.length + 1)));

    filtered.forEach(function(s) {
      var gx = ((s.x - X_MIN) / (X_MAX - X_MIN)) * GW;
      var gy = GH - ((s.y - Y_MIN) / (Y_MAX - Y_MIN)) * GH;
      var radius = Math.ceil(SIGMA * 3);
      for (var dy = -radius; dy <= radius; dy++) {
        for (var dx = -radius; dx <= radius; dx++) {
          var px = Math.round(gx + dx);
          var py = Math.round(gy + dy);
          if (px < 0 || px >= GW || py < 0 || py >= GH) continue;
          density[py * GW + px] += Math.exp(-(dx*dx + dy*dy) / (2*SIGMA*SIGMA));
        }
      }
    });

    var vals = [];
    for (var i = 0; i < density.length; i++) { if (density[i] > 0) vals.push(density[i]); }
    if (!vals.length) return;
    vals.sort(function(a,b){ return a-b; });
    var maxD = vals[Math.floor(vals.length * 0.97)] || vals[vals.length-1];
    if (maxD === 0) return;

    var offscreen = document.createElement('canvas');
    offscreen.width  = GW;
    offscreen.height = GH;
    var octx = offscreen.getContext('2d');
    var imgData = octx.createImageData(GW, GH);

    for (var py = 0; py < GH; py++) {
      for (var px = 0; px < GW; px++) {
        var val = Math.min(density[py * GW + px] / maxD, 1.0);
        if (val < 0.01) continue;
        var r, g, b, a;
        if (val < 0.2) {
          var t = val / 0.2;
          r = Math.round(8   + t * (30  - 8));
          g = Math.round(16  + t * (100 - 16));
          b = Math.round(48  + t * (200 - 48));
        } else if (val < 0.4) {
          var t = (val - 0.2) / 0.2;
          r = Math.round(30  + t * (0   - 30));
          g = Math.round(100 + t * (200 - 100));
          b = Math.round(200 + t * (200 - 200));
        } else if (val < 0.6) {
          var t = (val - 0.4) / 0.2;
          r = Math.round(0   + t * (80  - 0));
          g = Math.round(200 + t * (220 - 200));
          b = Math.round(200 + t * (50  - 200));
        } else if (val < 0.8) {
          var t = (val - 0.6) / 0.2;
          r = Math.round(80  + t * (240 - 80));
          g = Math.round(220 + t * (210 - 220));
          b = Math.round(50  + t * (0   - 50));
        } else {
          var t = (val - 0.8) / 0.2;
          r = Math.round(240 + t * (220 - 240));
          g = Math.round(210 + t * (20  - 210));
          b = 0;
        }
        a = Math.round(Math.pow(val, 0.5) * 230);
        var idx = (py * GW + px) * 4;
        imgData.data[idx]   = r;
        imgData.data[idx+1] = g;
        imgData.data[idx+2] = b;
        imgData.data[idx+3] = a;
      }
    }
    octx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(offscreen, 0, 0, W, H);
    ctx.restore();

    var scaleX=PAD_L+PW+4, scaleH=PH*0.6, scaleY=PAD_T+PH*0.2;
    var grad=ctx.createLinearGradient(0,scaleY,0,scaleY+scaleH);
    grad.addColorStop(0,   'rgb(220,20,0)');
    grad.addColorStop(0.25,'rgb(240,210,0)');
    grad.addColorStop(0.5, 'rgb(80,220,50)');
    grad.addColorStop(0.75,'rgb(0,200,200)');
    grad.addColorStop(1,   'rgb(8,16,48)');
    ctx.fillStyle=grad; ctx.fillRect(scaleX,scaleY,7,scaleH);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=0.5;
    ctx.strokeRect(scaleX,scaleY,7,scaleH);
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='8px DM Mono,monospace';
    ctx.textAlign='left';
    ctx.fillText('HI',scaleX+10,scaleY+8);
    ctx.fillText('LO',scaleX+10,scaleY+scaleH);
  }

  // ── Update reactive stat boxes ─────────────────
  function updateStats(f) {
    var n    = f.length;
    var iz   = f.filter(function(s){ return s.y >= -1 && s.y <= 1 && s.x >= 0 && s.x <= 1; }).length;
    var fks  = f.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
    var fh   = f.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var fsw  = f.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
    var fch  = f.filter(function(s){ return (s.y < -1 || s.y > 1 || s.x < 0 || s.x > 1)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;
    var el;
    if ((el=document.getElementById('zs-pitches'))) el.textContent = n;
    if ((el=document.getElementById('zs-zone')))    el.textContent = n>0 ? fmt1(iz/n*100)+'%' : '—';
    if ((el=document.getElementById('zs-ks')))      el.textContent = fks;
    if ((el=document.getElementById('zs-hits')))    el.textContent = fh;
    if ((el=document.getElementById('zs-swk')))     el.textContent = fsw;
    if ((el=document.getElementById('zs-chases')))  el.textContent = fch;
    var sub = document.querySelector('.stat-card-subtitle');
    if (sub) sub.textContent = n + ' pitches plotted';
  }

  // ── Main draw ──────────────────────────────────
  function drawZone() {
    ctx.clearRect(0, 0, W * DPR, H * DPR);
    var clean = (activeView === 'grid' || activeView === 'heatmap');

    // All views use the same bounds so the strike zone is identical across scatter/grid/heatmap
    setBounds(CLEAN_BOUNDS.xMin, CLEAN_BOUNDS.xMax, CLEAN_BOUNDS.yMin, CLEAN_BOUNDS.yMax);

    drawBackground(clean ? {clean:true} : {});

    var filtered = points.filter(function(s) {
      if (!resultMatch(s, activeResult)) return false;
      if (activeType !== 'all' && (s.pitch_type || s.type || 'Unknown') !== activeType) return false;
      if (activeHand !== 'all' && (type === 'batter' ? (s.pitcher_side || '') : (s.batter_side || s.side || '')) !== activeHand) return false;
      if (allDates.length > 1) {
        if (activeSeasonFilter !== 'all' && s.date && !s.date.startsWith(activeSeasonFilter.replace('year:',''))) return false;
        if (activeZoneDate !== 'all' && s.date !== activeZoneDate) return false;
      }
      return true;
    });

    // Update pitch count label
    var countEl = document.getElementById('zone-pitch-count');
    if (countEl) countEl.textContent = filtered.length + ' pitches plotted';

    updateStats(filtered);

    if      (activeView === 'scatter') drawScatter(filtered);
    else if (activeView === 'grid')    drawGrid(filtered);
    else if (activeView === 'heatmap') drawHeatmap(filtered);

    drawStrikeZone();

    var legend = document.getElementById('zone-legend');
    if (legend) legend.style.display = activeView === 'scatter' ? '' : 'none';
  }

  requestAnimationFrame(function() { drawZone(); });

  // ── Tooltip (scatter only) ─────────────────────
  var tooltip = document.getElementById('zone-tooltip');

  canvas.addEventListener('mousemove', function(e) {
    if (activeView !== 'scatter') { tooltip.classList.add('hidden'); return; }
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (CSS_W / rect.width);
    var my = (e.clientY - rect.top)  * (CSS_H / rect.height);

    var best = null, bestDist = Infinity;
    var filtered = points.filter(function(s) {
      if (!resultMatch(s, activeResult)) return false;
      if (activeType !== 'all' && (s.pitch_type || s.type || 'Unknown') !== activeType) return false;
      if (activeHand !== 'all' && (type === 'batter' ? (s.pitcher_side || '') : (s.batter_side || s.side || '')) !== activeHand) return false;
      if (allDates.length > 1) {
        if (activeSeasonFilter !== 'all' && s.date && !s.date.startsWith(activeSeasonFilter.replace('year:',''))) return false;
        if (activeZoneDate !== 'all' && s.date !== activeZoneDate) return false;
      }
      return true;
    });
    filtered.forEach(function(s) {
      var px=toCanvasX(s.x), py=toCanvasY(s.y);
      var dist = Math.sqrt((mx-px)*(mx-px)+(my-py)*(my-py));
      if (dist < bestDist && dist < 14) { bestDist = dist; best = s; }
    });

    if (best) {
      canvas.style.cursor = 'pointer';
      var ttx=toCanvasX(best.x), tty=toCanvasY(best.y);
      var offX = ttx > W*0.65 ? -180 : 12;
      var offY = tty > H*0.65 ? -110 : 8;
      tooltip.style.left = (ttx+offX)+'px';
      tooltip.style.top  = (tty+offY)+'px';
      var t = best.pitch_type || best.type || 'Unknown';
      var dotStyle = 'display:inline-block;width:10px;height:10px;border-radius:50%;background:'+typeColorMap[t]+';margin-right:6px;vertical-align:middle';
      tooltip.innerHTML =
        '<div class="zt-pitch"><span style="'+dotStyle+'"></span>'+t+'</div>'+
        '<div class="zt-row"><span>Outcome</span><span>'+(best.outcome||'—')+'</span></div>'+
        '<div class="zt-row"><span>Count</span><span>'+(best.count||'—')+'</span></div>'+
        '<div class="zt-row"><span>Pitcher</span><span>'+(best.pitcher||'—')+'</span></div>'+
        (best.contact ? '<div class="zt-row"><span>Contact</span><span>'+best.contact+'</span></div>' : '')+
        (best.spray   ? '<div class="zt-row"><span>Spray</span><span>'+best.spray+'</span></div>' : '')+
        '<div class="zt-coords">x: '+(best.x!=null?best.x.toFixed(3):'—')+'  y: '+(best.y!=null?best.y.toFixed(3):'—')+'</div>';
      tooltip.classList.remove('hidden');
    } else {
      canvas.style.cursor = 'default';
      tooltip.classList.add('hidden');
    }
  });

  canvas.addEventListener('mouseleave', function() {
    tooltip.classList.add('hidden');
    canvas.style.cursor = 'default';
  });

  // ── Filter buttons ─────────────────────────────
  container.querySelectorAll('#zone-view-btns .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-view-btns .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeView = btn.dataset.view;
      tooltip.classList.add('hidden');
      drawZone();
    });
  });

  container.querySelectorAll('#zone-result-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-result-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeResult = btn.dataset.result;
      drawZone();
    });
  });

  container.querySelectorAll('#zone-type-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-type-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeType = btn.dataset.ptype;
      drawZone();
    });
  });

  container.querySelectorAll('#zone-hand-filters .zone-filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      container.querySelectorAll('#zone-hand-filters .zone-filter-btn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      activeHand = btn.dataset.hand;
      drawZone();
    });
  });

  // ── Date filters (pitcher only) ───────────────
  if (type === 'pitcher' && allDates.length > 1) {
    var activeSeasonFilter = 'all';

    var zoneDateSel = document.getElementById('zone-date-select');
    if (zoneDateSel) {
      zoneDateSel.addEventListener('change', function() {
        activeZoneDate = this.value;
        drawZone();
      });
    }

    var zoneSeasonSel = document.getElementById('zone-season-select');
    if (zoneSeasonSel) {
      zoneSeasonSel.addEventListener('change', function() {
        activeSeasonFilter = this.value;
        // Reset game date to all when season changes
        if (zoneDateSel) { zoneDateSel.value = 'all'; activeZoneDate = 'all'; }
        drawZone();
      });
    }
  }
}


// ── SPLITS TAB ────────────────────────────────────
function renderSplits(name, type, pitch, seasonFilter) {
  seasonFilter = seasonFilter || 'all';
  var points = [];
  if (type === 'batter' && pitch && pitch.scatter) {
    points = pitch.scatter;
  } else if (type === 'pitcher') {
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) points.push(s); });
    });
  }

  if (!points.length) {
    return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No split data</h3></div>';
  }

  var total = points.length;

  var COUNT_GROUPS = [
    { key: 'all',     label: 'All Counts',      test: function()  { return true; } },
    { key: 'early',   label: 'Early Count',      test: function(c) { return ["'0-0","'1-0","'0-1",'0-0','1-0','0-1'].includes(c); } },
    { key: 'ahead',   label: 'Pitcher Ahead',    test: function(c) { return ["'0-1","'0-2","'1-2",'0-1','0-2','1-2'].includes(c); } },
    { key: 'behind',  label: 'Pitcher Behind',   test: function(c) { return ["'1-0","'2-0","'3-0","'2-1","'3-1",'1-0','2-0','3-0','2-1','3-1'].includes(c); } },
    { key: 'pre2k',   label: 'Pre-2K',           test: function(c) { return ["'0-0","'1-0","'2-0","'3-0","'1-1","'2-1","'3-1",'0-0','1-0','2-0','3-0','1-1','2-1','3-1'].includes(c); } }
  ];

  var typeSet = [];
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    if (!typeSet.includes(t)) typeSet.push(t);
  });
  typeSet.sort();

  var splitsHTML =
    '<div style="margin-bottom:16px;display:flex;align-items:center;gap:10px">' +
    (type === 'batter'
      ? '<span style="font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase">Pitcher Hand</span>' +
        '<button class="zone-filter-btn splits-hand-btn active" data-hand="all">All</button>' +
        '<button class="zone-filter-btn splits-hand-btn" data-hand="R">RHP</button>' +
        '<button class="zone-filter-btn splits-hand-btn" data-hand="L">LHP</button>'
      : '<span style="font-family:var(--font-mono);font-size:11px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase">Batter Hand</span>' +
        '<button class="zone-filter-btn splits-hand-btn active" data-hand="all">All</button>' +
        '<button class="zone-filter-btn splits-hand-btn" data-hand="R">RHB</button>' +
        '<button class="zone-filter-btn splits-hand-btn" data-hand="L">LHB</button>') +
    '</div>' +
    '<div id="splits-tables">' + buildSplitsTables(points) + '</div>';

  return splitsHTML;
}

function buildSplitsTables(points) {
  var total = points.length;
  if (!total) return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No data for this filter</h3></div>';

  var COUNT_GROUPS = [
    { key: 'all',    label: 'All Counts',    test: function()     { return true; } },
    { key: 'early',  label: 'Early Count',   test: function(c) { c=c.replace(/^'/,''); return ['0-0','1-0','0-1'].includes(c); } },
    { key: 'ahead',  label: 'Pitcher Ahead', test: function(c) { c=c.replace(/^'/,''); return ['0-1','0-2','1-2'].includes(c); } },
    { key: 'behind', label: 'Pitcher Behind',test: function(c) { c=c.replace(/^'/,''); return ['1-0','2-0','3-0','2-1','3-1'].includes(c); } },
    { key: 'pre2k',  label: 'Pre-2K',        test: function(c) { c=c.replace(/^'/,''); return ['0-0','1-0','2-0','3-0','1-1','2-1','3-1'].includes(c); } }
  ];

  var typeSet = [];
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    if (!typeSet.includes(t)) typeSet.push(t);
  });
  typeSet.sort();

  var countTableHTML =
    '<div class="stat-card" style="margin-bottom:20px">' +
    '<div class="stat-card-header"><span class="stat-card-title">Pitch Usage by Count</span></div>' +
    '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Situation</th>' +
    typeSet.map(function(t) { return '<th>' + t + '</th>'; }).join('') +
    '<th>#</th>' +
    '</tr></thead><tbody>' +
    COUNT_GROUPS.map(function(grp) {
      var subset = points.filter(function(s) { return grp.test(s.count || ''); });
      var n = subset.length;
      if (!n) {
        return '<tr><td style="text-align:left;color:var(--text-mid)">' + grp.label + '</td>' +
          typeSet.map(function() { return '<td style="color:var(--text-dim)">—</td>'; }).join('') +
          '<td>0</td></tr>';
      }
      var tc = {};
      typeSet.forEach(function(t) { tc[t] = 0; });
      subset.forEach(function(s) { var t = s.pitch_type || s.type || 'Unknown'; if (tc[t]!==undefined) tc[t]++; });
      return '<tr>' +
        '<td style="text-align:left;color:var(--text)">' + grp.label + '</td>' +
        typeSet.map(function(t) { return '<td class="highlight-val">' + fmt1(tc[t]/n*100) + '%</td>'; }).join('') +
        '<td>' + n + '</td></tr>';
    }).join('') +
    '</tbody></table></div></div>';

  var typeMap = {};
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    if (!typeMap[t]) typeMap[t] = { total:0, k:0, hit:0, ball:0, strike:0 };
    typeMap[t].total++;
    if (s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking') typeMap[t].k++;
    if (['Single','Double','Triple','Home Run'].includes(s.outcome)) typeMap[t].hit++;
    if (s.outcome === 'Ball') typeMap[t].ball++;
    if (['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome)) typeMap[t].strike++;
  });

  var pitchMixHTML =
    '<div class="stat-card" style="margin-bottom:20px">' +
    '<div class="stat-card-header"><span class="stat-card-title">Pitch Mix</span></div>' +
    '<div class="pitch-mix-grid">' +
    Object.entries(typeMap).map(function(e) {
      return '<div class="pitch-mix-item">' +
        '<div class="pitch-mix-pct">' + fmt1(e[1].total/total*100) + '%</div>' +
        '<div class="pitch-mix-type">' + e[0] + '</div>' +
        '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px">' + e[1].total + ' pitches</div>' +
        '</div>';
    }).join('') + '</div></div>' +
    '<div class="stat-card" style="margin-bottom:20px">' +
    '<div class="stat-card-header"><span class="stat-card-title">By Pitch Type</span></div>' +
    '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Type</th><th>#</th><th>%</th><th>K</th><th>HIT</th><th>STR%</th><th>BALL%</th>' +
    '</tr></thead><tbody>' +
    Object.entries(typeMap).map(function(e) {
      var d = e[1];
      return '<tr>' +
        '<td style="text-align:left;color:var(--text)">' + e[0] + '</td>' +
        '<td>' + d.total + '</td>' +
        '<td class="highlight-val">' + fmt1(d.total/total*100) + '%</td>' +
        '<td>' + d.k + '</td>' +
        '<td>' + d.hit + '</td>' +
        '<td>' + fmt1(d.strike/d.total*100) + '%</td>' +
        '<td>' + fmt1(d.ball/d.total*100) + '%</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table></div></div>';

  return countTableHTML + pitchMixHTML;
}

// ── TABLE BUILDERS ────────────────────────────────
function buildHittingTable(players) {
  const rows = players.map(function(p) {
    const teamField = p.batter_team;
    const team = resolveTeam(teamField);
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.batter + '" data-type="batter">' + p.batter + '</a></td>' +
      '<td>' + (team ? team.abbreviation : '—') + '</td>' +
      '<td>' + fmtN(p.PA || p.AB) + '</td>' +
      '<td>' + fmtN(p.AB) + '</td>' +
      '<td class="highlight-val">' + fmt3(p.AVG) + '</td>' +
      '<td>' + fmt3(p.OBP) + '</td>' +
      '<td>' + fmt3(p.SLG) + '</td>' +
      '<td class="highlight-val">' + fmt3(p.OPS) + '</td>' +
      '<td>' + fmtN(p.H) + '</td>' +
      '<td>' + fmtN(p['2B']) + '</td>' +
      '<td>' + fmtN(p['3B']) + '</td>' +
      '<td>' + fmtN(p.HR) + '</td>' +
      '<td>' + fmtN(p.BB) + '</td>' +
      '<td>' + fmtN(p.K) + '</td>' +
      '<td>' + (p.K_pct != null ? fmt1(p.K_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.BB_pct != null ? fmt1(p.BB_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.SWING_pct != null ? fmt1(p.SWING_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.WHIFF_pct != null ? fmt1(p.WHIFF_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.GB_pct != null ? fmt1(p.GB_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.FB_pct != null ? fmt1(p.FB_pct)+'%' : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Player</th><th>Team</th><th>PA</th><th>AB</th>' +
    '<th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>' +
    '<th>H</th><th>2B</th><th>3B</th><th>HR</th><th>BB</th><th>K</th>' +
    '<th>K%</th><th>BB%</th><th>SWING%</th><th>WHIFF%</th><th>GB%</th><th>FB%</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function buildPbpPitcherTable(pitchers) {
  const rows = pitchers.map(function(p) {
    const team = resolveTeam(p.pitcher_team);
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.pitcher + '" data-type="pitcher">' + p.pitcher + '</a></td>' +
      '<td>' + (team ? team.abbreviation : '—') + '</td>' +
      '<td>' + fmtIP(p.IP || 0) + '</td>' +
      '<td>' + fmtN(p.BF) + '</td>' +
      '<td class="highlight-val">' + (getSeasonERA(p.pitcher)  != null ? fmt2(getSeasonERA(p.pitcher))  : (p.ERA  != null ? fmt2(p.ERA)  : '—')) + '</td>' +
      '<td>' +                              (getSeasonWHIP(p.pitcher) != null ? fmt2(getSeasonWHIP(p.pitcher)) : (p.WHIP != null ? fmt2(p.WHIP) : '—')) + '</td>' +
      '<td>' + (p.BA_against != null ? fmt3(p.BA_against) : '—') + '</td>' +
      '<td class="highlight-val">' + (p.K_pct != null ? fmt1(p.K_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.BB_pct != null ? fmt1(p.BB_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.K_BB != null ? fmt2(p.K_BB) : '—') + '</td>' +
      '<td>' + (p.STR_pct != null ? fmt1(p.STR_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.SWING_pct != null ? fmt1(p.SWING_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.WHIFF_pct != null ? fmt1(p.WHIFF_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.EA_pct != null ? fmt1(p.EA_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.GB_pct != null ? fmt1(p.GB_pct)+'%' : '—') + '</td>' +
      '<td>' + (p.FB_pct != null ? fmt1(p.FB_pct)+'%' : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Team</th><th>IP</th><th>BF</th>' +
    '<th>ERA</th><th>WHIP</th><th>BA AGN</th><th>K%</th><th>BB%</th><th>K/BB</th>' +
    '<th>STR%</th><th>SWING%</th><th>WHIFF%</th><th>E+A%</th><th>GB%</th><th>FB%</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function buildPitcherListTable(names) {
  const rows = names.map(function(name) {
    const pts = [];
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
    });
    const tot = pts.filter(function(s) { return s.outcome && s.outcome !== ''; }).length;
    const ks  = pts.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = pts.filter(function(s) { return s.outcome === 'Walk'; }).length;
    const str = pts.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + name + '" data-type="pitcher">' + name + '</a></td>' +
      '<td>' + tot + '</td>' +
      '<td class="highlight-val">' + ks + '</td>' +
      '<td>' + bbs + '</td>' +
      '<td class="highlight-val">' + (tot > 0 ? fmt1(ks/tot*100) + '%' : '—') + '</td>' +
      '<td>' + (tot > 0 ? fmt1(str/tot*100) + '%' : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Pitches</th><th>K</th><th>BB</th><th>K%</th><th>STR%</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ── SORT + LINKS ──────────────────────────────────
function initTableSort(table) {
  if (!table) return;
  const headers = table.querySelectorAll('th');
  let sortCol = -1, sortAsc = true;
  headers.forEach(function(th, i) {
    th.addEventListener('click', function() {
      const tbody = table.querySelector('tbody');
      const rows  = Array.from(tbody.querySelectorAll('tr'));
      const asc   = sortCol === i ? !sortAsc : true;
      rows.sort(function(a, b) {
        const av = ((a.cells[i]||{}).textContent||'').replace(/[^0-9.\-]/g,'');
        const bv = ((b.cells[i]||{}).textContent||'').replace(/[^0-9.\-]/g,'');
        const an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return asc ? an-bn : bn-an;
        return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
      rows.forEach(function(r) { tbody.appendChild(r); });
      headers.forEach(function(h) { h.classList.remove('sorted'); });
      th.classList.add('sorted'); sortCol = i; sortAsc = asc;
    });
  });
}

function initPlayerLinks(container, type) {
  container.querySelectorAll('[data-name]').forEach(function(el) {
    el.addEventListener('click', function() {
      navigate('players.html?player=' + encodeURIComponent(el.dataset.name) + '&type=' + (el.dataset.type || type));
    });
  });
}

init();
