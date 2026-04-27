/* ================================================
   DATA DIAMOND — main.js v6
   Powered by summary.json + pitches.json
================================================ */

function getBase() { return '/'; }

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

let DATA = { summary: [], pitches: [], pitchers: [], iblHistory: {} };

// ── INIT ──────────────────────────────────────────
async function init() {
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
      fetch(base + 'data/ibl_history.json')
    ]);
    if (sumRes.ok)     DATA.summary    = await sumRes.json();
    if (pitRes.ok)     DATA.pitches    = await pitRes.json();
    if (pitcherRes.ok) DATA.pitchers   = await pitcherRes.json();
    if (iblRes.ok)     DATA.iblHistory = await iblRes.json();
    console.log('summary players:', DATA.summary.length);
    console.log('pitches players:', DATA.pitches.length);
    console.log('pitchers:', DATA.pitchers.length);
    console.log('ibl history players:', Object.keys(DATA.iblHistory).length);
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
  return Array.from(names).sort();
}
function getAllPitchers() {
  const names = new Set();
  DATA.pitches.forEach(function(p) {
    if (p.scatter) p.scatter.forEach(function(s) { if (s.pitcher) names.add(s.pitcher); });
  });
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
      const players = DATA.summary.filter(function(p) { return p.AB > 0; });
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
      const names = getAllPitchers();
      const card  = document.createElement('div');
      card.className = 'stat-card fade-up';
      card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">All Pitchers</span>' +
        '<span class="stat-card-subtitle">' + names.length + ' pitchers</span></div>' +
        '<div style="padding:16px 24px 0">' +
        '<input class="roster-search" id="pitcher-search" placeholder="Search pitchers..." /></div>' +
        buildPitcherListTable(names);
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
  var playerInfo = {
    pos:      _ibl && _ibl.pos    ? _ibl.pos    : (type === 'pitcher' ? 'P' : '—'),
    bats:     _ibl && _ibl.bats   ? _ibl.bats   : null,
    throws:   _ibl && _ibl.throws ? _ibl.throws : null,
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
    '</div></div></div>' +
    '<div class="container" style="padding-top:32px;padding-bottom:80px"><div id="player-tab-content"></div></div>';

  if (team) {
    document.getElementById('player-hero-bg').style.background =
      'radial-gradient(ellipse 80% 60% at 20% 50%, ' + hexToRgba(team.primaryColor, 0.18) + ' 0%, transparent 70%)';
  }

  const hl = document.getElementById('headline-stats');
  if (type === 'batter' && sum) {
    // RBI from IBL history (most recent season with AB)
    const iblB = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0; });
    const iblBSeason = iblB.length ? iblB[0] : null;
    const hlRBI = iblBSeason && iblBSeason.RBI != null ? fmtN(iblBSeason.RBI) : '—';
    [['AVG', fmt3(sum.AVG)], ['OPS', fmt3(sum.OPS)], ['HR', fmtN(sum.HR)], ['RBI', hlRBI]].forEach(function(s) {
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
    const iblPSeason = iblP.length ? iblP[0] : null;
    const hlIP   = pd.IP   != null ? fmtIP(pd.IP) : '—';
    const hlERA  = iblPSeason && iblPSeason.ERA != null ? fmt2(iblPSeason.ERA) : '—';
    // WHIP calculated from datadiamond scatter: (BB + H) / IP
    const scAll  = pitchData && pitchData.scatter ? pitchData.scatter : [];
    const pdBB   = scAll.filter(function(s){ return s.outcome==='Walk'||s.outcome==='Intentional Walk'; }).length;
    const pdH    = scAll.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    const hlWHIP = pd.IP > 0 ? fmt2((pdBB + pdH) / pd.IP) : '—';
    const hlKBB  = pd.K_BB != null ? fmt2(pd.K_BB) : '—';
    [['IP', hlIP], ['ERA', hlERA], ['WHIP', hlWHIP]].forEach(function(s) {
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
    if (t === 'overview')   panel.innerHTML = renderOverview(name, type, sum, pitchData, playerInfo);
    if (t === 'percentile') panel.innerHTML = renderPercentileStats(name, type, sum, pitchData);
    if (t === 'season')   panel.innerHTML = renderSeasonStats(name, type, sum, pitchData);
    if (t === 'splits') {
      panel.innerHTML = renderSplits(name, type, pitchData);
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
    if (t === 'zone')     renderZone(name, type, pitchData, panel);
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
  activateTab('overview');
}

// ── OVERVIEW TAB ──────────────────────────────────
function renderOverview(name, type, sum, pitch, playerInfo) {
  var sc  = (pitch && pitch.scatter) ? pitch.scatter : [];
  var pi  = playerInfo || {};

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
  if (type === 'batter' && sum) {
    var scB = sc.filter(function(s){ return s.x != null && s.y != null; });
    var side = scB.length ? (scB[0].batter_side || 'R') : 'R';
    var insideFn  = side === 'R' ? function(s){ return s.x < -0.1; } : function(s){ return s.x > 0.1; };
    var outsideFn = side === 'R' ? function(s){ return s.x >  0.1; } : function(s){ return s.x < -0.1; };
    var highFn    = function(s){ return s.y > 0.6; };
    var lowFn     = function(s){ return s.y < 0.35; };
    var inZoneFn  = function(s){ return s.x >= -1 && s.x <= 1 && s.y >= 0 && s.y <= 1; };
    var oozFn     = function(s){ return !inZoneFn(s); };

    var totP    = sc.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
    var swStr   = sc.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
    var fouls   = sc.filter(function(s){ return s.outcome === 'Foul'; }).length;
    var ipAll   = sc.filter(function(s){ return IN_PLAY.includes(s.outcome); }).length;
    var swings  = swStr + fouls + ipAll;
    var ks      = sc.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    var bbs     = sc.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    var pa      = sum.PA || (sum.AB + (sum.BB||0) + (sum.HBP||0) + (sum.SF||0)) || 1;
    var inZonePts    = scB.filter(inZoneFn);
    var inZoneSwings = inZonePts.filter(function(s){ return ['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome); }).length;
    var inZoneCon    = inZonePts.filter(function(s){ return ['Foul'].concat(IN_PLAY).includes(s.outcome); }).length;
    var oozPts  = scB.filter(oozFn);
    var chases  = oozPts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;

    var mySwing   = totP > 0           ? swings / totP                      : null;
    var myWhiff   = swings > 0         ? swStr / swings                     : null;
    var myK       = pa > 0             ? ks / pa                            : null;
    var myBB      = pa > 0             ? bbs / pa                           : null;
    var myPspa    = pa > 0             ? totP / pa                          : null;
    var myIzSwing = inZonePts.length   ? inZoneSwings / inZonePts.length    : null;
    var myIzCon   = inZoneSwings > 0   ? inZoneCon / inZoneSwings           : null;
    var myChase   = oozPts.length > 0  ? chases / oozPts.length             : null;

    // League arrays
    var lg = { avg:[], ops:[], obp:[], slg:[], hr:[], swing:[], whiff:[], kRate:[], bbRate:[], pspa:[], izSwing:[], izCon:[], chase:[] };
    DATA.summary.forEach(function(p) {
      if (!p.AB || p.AB < 5) return;
      lg.avg.push(p.AVG||0); lg.ops.push(p.OPS||0); lg.obp.push(p.OBP||0); lg.slg.push(p.SLG||0); lg.hr.push(p.HR||0);
      var pPA = p.PA||(p.AB+(p.BB||0)+(p.HBP||0)+(p.SF||0))||1;
      lg.kRate.push((p.K||0)/pPA); lg.bbRate.push((p.BB||0)/pPA);
    });
    DATA.pitches.forEach(function(bp) {
      var sc2=bp.scatter||[]; var t2=sc2.filter(function(s){return s.outcome&&s.outcome!=='';}).length; if(!t2)return;
      var sw2=sc2.filter(function(s){return s.outcome==='Swinging Strike';}).length;
      var fo2=sc2.filter(function(s){return s.outcome==='Foul';}).length;
      var ip2=sc2.filter(function(s){return IN_PLAY.includes(s.outcome);}).length;
      var sw2t=sw2+fo2+ip2;
      var bSum2=getSummaryPlayer(bp.batter);
      var pa2=bSum2?(bSum2.PA||(bSum2.AB+(bSum2.BB||0)+(bSum2.HBP||0)+(bSum2.SF||0))||1):1;
      var iz2=sc2.filter(function(s){return s.x!=null&&s.y!=null&&s.x>=-1&&s.x<=1&&s.y>=0&&s.y<=1;});
      var izSw2=iz2.filter(function(s){return['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var izCon2=iz2.filter(function(s){return['Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var ooz2=sc2.filter(function(s){return s.x!=null&&s.y!=null&&(s.x<-1||s.x>1||s.y<0||s.y>1);});
      var ch2=ooz2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul';}).length;
      lg.swing.push(t2>0?sw2t/t2:0);
      if(sw2t>0)       lg.whiff.push(sw2/sw2t);
      lg.pspa.push(t2/pa2);
      if(iz2.length>0)  lg.izSwing.push(izSw2/iz2.length);
      if(izSw2>0)       lg.izCon.push(izCon2/izSw2);
      if(ooz2.length>0) lg.chase.push(ch2/ooz2.length);
    });

    // Standard rate / average stats
    evalStat('AVG',  fmt3(sum.AVG), pctRank(sum.AVG,lg.avg), true,
      { elite:'Hitting at an outstanding rate — one of the best averages in the league.', strong:'Solid contact rate, well above the league average.',
        weak:'Below-average batting average — contact consistency is a concern.', poor:'Struggling to make consistent contact, one of the lowest averages in the league.' });
    evalStat('OBP',  fmt3(sum.OBP), pctRank(sum.OBP,lg.obp), true,
      { elite:'Gets on base at an elite rate — rarely makes an easy out.', strong:'Consistently reaches base above the league average.',
        weak:'On-base percentage is below average — makes outs at a high rate.', poor:'Very low on-base percentage, one of the worst in the league.' });
    evalStat('SLG',  fmt3(sum.SLG), pctRank(sum.SLG,lg.slg), true,
      { elite:'Exceptional power numbers — driving the ball with elite authority.', strong:'Above-average slugger with real extra-base pop.',
        weak:'Below-average slugging — lacks extra-base hit production.', poor:'Very low slugging percentage, struggles to drive the ball with power.' });
    evalStat('OPS',  fmt3(sum.OPS), pctRank(sum.OPS,lg.ops), true,
      { elite:'Elite overall offensive production — top-tier combination of on-base and power.', strong:'Above-average run producer combining OBP and slugging effectively.',
        weak:'Below-average overall offensive output.', poor:'Among the lowest OPS in the league — struggles getting on base and driving the ball.' });
    evalStat('HR',   fmtN(sum.HR),  pctRank(sum.HR,lg.hr),   true,
      { elite:'Among the league leaders in home runs — a genuine power threat.', strong:'Above-average home run production.', weak:null, poor:null });

    // Pitch-tracking discipline rates
    evalStat('SWING%',      mySwing!=null  ? fmt1(mySwing*100)+'%'   : '—', pctRank(mySwing,lg.swing),     true,
      { elite:'Attacks pitches at an elite rate — an extremely aggressive, committed hitter.', strong:'Above-average swing rate — an active, attacking bat.',
        weak:'Passive approach — below-average swing rate, letting a lot of pitches go.', poor:'One of the lowest swing rates in the league — very selective, rarely offers.' });
    evalStat('WHIFF%',      myWhiff!=null  ? fmt1(myWhiff*100)+'%'   : '—', pctRank(myWhiff,lg.whiff),     false,
      { weak:'High whiff rate — misses on a significant portion of swings.', poor:'One of the highest whiff rates in the league — struggles to make bat-on-ball contact.' });
    evalStat('K%',          myK!=null      ? fmt1(myK*100)+'%'       : '—', pctRank(myK,lg.kRate),         false,
      { weak:'Strikeout rate is elevated — pitchers are regularly putting this hitter away.', poor:'One of the highest strikeout rates in the league — a major vulnerability.' });
    evalStat('BB%',         myBB!=null     ? fmt1(myBB*100)+'%'      : '—', pctRank(myBB,lg.bbRate),       true,
      { elite:'Outstanding plate discipline — draws walks at an elite rate.', strong:'Above-average walk rate, shows good patience at the plate.',
        weak:'Low walk rate — rarely works counts or forces free passes.', poor:'Almost never walks — an aggressive approach that pitchers can exploit.' });
    evalStat('PS/PA',       myPspa!=null   ? fmt2(myPspa)            : '—', pctRank(myPspa,lg.pspa),       true,
      { elite:'Sees an elite number of pitches per PA — works counts to exhaustion.', strong:'Above-average pitch count per PA — runs up counts and tires pitchers.',
        weak:'Below-average pitches per PA — tends to swing early in counts.', poor:'One of the lowest PS/PA in the league — very first-pitch aggressive.' });
    evalStat('IZ SWING%',   myIzSwing!=null? fmt1(myIzSwing*100)+'%' : '—', pctRank(myIzSwing,lg.izSwing), true,
      { elite:'Attacks pitches in the zone at an elite rate — rarely takes a hittable pitch.', strong:'Above-average zone swing rate — recognizes and attacks strikes.',
        weak:'Below-average zone swing rate — taking more strikes than most hitters.', poor:'One of the lowest in-zone swing rates — frequently lets hittable pitches pass.' });
    evalStat('IZ CONTACT%', myIzCon!=null  ? fmt1(myIzCon*100)+'%'  : '—', pctRank(myIzCon,lg.izCon),     true,
      { elite:'Exceptional in-zone contact — rarely misses a pitch in the strike zone.', strong:'Above-average contact rate on pitches in the zone.',
        weak:'Below-average in-zone contact — missing strikes more often than most.', poor:'Struggles significantly to make contact on pitches in the strike zone.' });
    evalStat('CHASE%',      myChase!=null  ? fmt1(myChase*100)+'%'   : '—', pctRank(myChase,lg.chase),     false,
      { weak:'Chases pitches out of the zone at an above-average rate.', poor:'One of the highest chase rates in the league — easily baited outside the strike zone.' });

    // RBI from IBL history
    var lg_rbi=[];
    DATA.summary.forEach(function(p){
      if(!p.AB||p.AB<5)return;
      var iblR=(DATA.iblHistory[p.batter]||[]).filter(function(s){return s.AB>0;});
      if(iblR.length&&iblR[0].RBI!=null) lg_rbi.push(iblR[0].RBI);
    });
    var myRBI=null;
    var _iblB2=(DATA.iblHistory[name]||[]).filter(function(s){return s.AB>0;});
    if(_iblB2.length&&_iblB2[0].RBI!=null) myRBI=_iblB2[0].RBI;
    if(myRBI!=null) evalStat('RBI', fmtN(myRBI), pctRank(myRBI,lg_rbi), true,
      { elite:'Among the league leaders in RBI — a true run producer.', strong:'Above-average RBI production.',
        weak:'Below-average RBI total.', poor:'One of the lowest RBI totals — struggling to drive in runs.' });

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
  if (type === 'pitcher' && pitch && pitch.scatter) {
    var scP  = sc.filter(function(s){ return s.x != null && s.y != null; });
    var pd   = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
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
    var myEA    = pd.EA_pct  != null ? pd.EA_pct : null;
    var myKBB   = pd.K_BB    != null ? pd.K_BB   : null;

    var iblP   = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
    var iblPRS = iblP.length ? iblP[0] : null;
    var era    = iblPRS && iblPRS.ERA  != null ? iblPRS.ERA  : null;
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
      { elite:'Exceptional strike-throwing — in the zone at an elite rate.', strong:'Above-average strike rate, commanding the zone effectively.',
        weak:'Below-average strike rate — falling behind in counts too often.', poor:'Very low strike rate — one of the least accurate pitchers in the league.' });
    evalStat('SWING%',   mySwing!=null?fmt1(mySwing*100)+'%':'—', pctRank(mySwing,lgP.swing), true,
      { elite:'Induces swings at an elite rate — hitters find the pitches difficult to lay off.', strong:'Above-average induced swing rate — forcing hitters to offer.',
        weak:'Below-average induced swing rate — hitters comfortable taking pitches.', poor:'One of the lowest induced swing rates — hitters lay off consistently.' });
    evalStat('WHIFF%',   myWhiff!=null?fmt1(myWhiff*100)+'%':'—', pctRank(myWhiff,lgP.whiff), true,
      { elite:'Elite swing-and-miss stuff — generates whiffs at a top-tier rate.', strong:'Above-average whiff rate — pitches hitters struggle to square up.',
        weak:'Below-average whiff rate — hitters squaring up swings too often.', poor:'Very few whiffs generated — hitters put the ball in play on nearly every swing.' });
    evalStat('K%',       myK!=null    ?fmt1(myK*100)+'%'    :'—', pctRank(myK,lgP.k),        true,
      { elite:'Elite strikeout rate — one of the most dominant strikeout pitchers in the league.', strong:'Above-average ability to put hitters away with strikeouts.',
        weak:'Below-average strikeout rate — hitters making contact more often than ideal.', poor:'Very low strikeout rate — struggles to finish hitters off.' });
    evalStat('BB%',      myBB!=null   ?fmt1(myBB*100)+'%'   :'—', pctRank(myBB,lgP.bb),      false,
      { weak:'Walk rate is elevated — command is an issue, giving hitters too many free passes.', poor:'One of the highest walk rates in the league — significant control problems.' });
    evalStat('E+A%',     myEA!=null   ?fmt1(myEA)+'%'       :'—', pctRank(myEA,lgP.ea),      true,
      { elite:'Works ahead in counts at an elite rate — dictates at-bats from the start.', strong:'Consistently gets into advantageous counts early.',
        weak:'Falls behind in counts more often than most — hitters dictate the at-bat.', poor:'Rarely gets ahead in counts, one of the worst early-count rates in the league.' });
    evalStat('K/BB',     myKBB!=null  ?fmt2(myKBB)          :'—', pctRank(myKBB,lgP.kbb),    true,
      { elite:'Outstanding K/BB ratio — strikes out hitters while rarely walking them.', strong:'Good command-to-stuff ratio.',
        weak:'Low K/BB — walks nearly as often as striking out.', poor:'Very poor K/BB — walks undermining an already-low strikeout rate.' });
    evalStat('ERA',      era!=null    ?fmt2(era)             :'—', pctRank(era,lgP.era),      false,
      { weak:'ERA is above average — runs scoring at a higher-than-ideal rate.', poor:'One of the highest ERAs in the league — struggling to prevent runs.' });
    evalStat('WHIP',     whip!=null   ?fmt2(whip)            :'—', pctRank(whip,lgP.whip),    false,
      { weak:'Elevated WHIP — giving up too many baserunners per inning.', poor:'One of the highest WHIPs in the league — runners on base constantly.' });
    evalStat('BA AGNST', baAgst!=null ?fmt3(baAgst)          :'—', pctRank(baAgst,lgP.baAgst),false,
      { weak:'Hitters are batting above average against this pitcher.', poor:'One of the highest batting averages against in the league — hitters making consistent contact.' });
    evalStat('IP',       pd.IP>0      ?fmtIP(pd.IP)          :'—', pctRank(pd.IP||0,lgP.ip),  true,
      { elite:'Elite innings pitched — a true workhorse on the mound.', strong:'Above-average innings total — consistently goes deep into games.',
        weak:'Below-average innings total — often pitching in shorter stints.', poor:'One of the lowest innings pitched — limited workload this season.' });



    // Zone / pitch-type approach
    var pitchTypes=[];
    scP.forEach(function(s){if(s.pitch_type&&!pitchTypes.includes(s.pitch_type))pitchTypes.push(s.pitch_type);});
    var inZoneFn=function(s){return s.x>=-1&&s.x<=1&&s.y>=0&&s.y<=1;};
    var PZONES=[
      {label:'Up in Zone',fn:function(s){return inZoneFn(s)&&s.y>0.6;}},
      {label:'Low in Zone',fn:function(s){return inZoneFn(s)&&s.y<0.35;}},
      {label:'Inside Edge',fn:function(s){return inZoneFn(s)&&s.x<-0.5;}},
      {label:'Outside Edge',fn:function(s){return inZoneFn(s)&&s.x>0.5;}},
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
  if (pi.bats || pi.throws) bioItems.push({ label: 'Bats / Throws', val: (pi.bats||'?')+' / '+(pi.throws||'?') });
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

  var cols =
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">' +
    makeSection('Positives', positives, 'green', 'No standout strengths yet.') +
    makeSection('Negatives', negatives, 'red',   'No major concerns found.') +
    makeSection('Approach',  approach,  'blue',  'Not enough pitch location data yet.') +
    '</div>';

  return identityCard + cols;
}

function renderPercentileStats(name, type, sum, pitch) {

  if (type === 'batter' && sum) {
    // Discipline stats from scatter
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
    var inZonePts    = sc.filter(function(s){ return s.x != null && s.x >= ZX1 && s.x <= ZX2 && s.y != null && s.y >= ZY1 && s.y <= ZY2; });
    var inZoneSwings = inZonePts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var inZoneContact= inZonePts.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var oozPts       = sc.filter(function(s){ return s.x != null && s.y != null && (s.x < ZX1 || s.x > ZX2 || s.y < ZY1 || s.y > ZY2); });
    var chases       = oozPts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;

    // Build league arrays for percentile ranking
    var leagueDisc = (function() {
      var o = { swing:[], whiff:[], k:[], bb:[], pspa:[], izSwing:[], izContact:[], chase:[] };
      DATA.pitches.forEach(function(bp) {
        var sc2 = bp.scatter || [];
        var tot2 = sc2.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
        if (!tot2) return;
        var sw2  = sc2.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
        var fo2  = sc2.filter(function(s){ return s.outcome === 'Foul'; }).length;
        var ip2  = sc2.filter(function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var swings2 = sw2 + fo2 + ip2;
        var ks2  = sc2.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
        var bbs2 = sc2.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
        var bSum2 = getSummaryPlayer(bp.batter);
        var pa2 = bSum2 ? (bSum2.PA || (bSum2.AB + (bSum2.BB||0) + (bSum2.HBP||0) + (bSum2.SF||0)) || 1) : 1;
        var inZ2 = sc2.filter(function(s){ return s.x != null && s.x >= ZX1 && s.x <= ZX2 && s.y != null && s.y >= ZY1 && s.y <= ZY2; });
        var izSw2 = inZ2.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var izCon2 = inZ2.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var ooz2 = sc2.filter(function(s){ return s.x != null && s.y != null && (s.x < ZX1 || s.x > ZX2 || s.y < ZY1 || s.y > ZY2); });
        var chases2 = ooz2.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul'; }).length;
        o.swing.push(tot2 > 0 ? swings2/tot2 : 0);
        o.whiff.push(swings2 > 0 ? sw2/swings2 : 0);
        o.k.push(tot2 > 0 ? ks2/tot2 : 0);
        o.bb.push(tot2 > 0 ? bbs2/tot2 : 0);
        o.pspa.push(tot2 / pa2);
        o.izSwing.push(inZ2.length > 0 ? izSw2/inZ2.length : 0);
        o.izContact.push(izSw2 > 0 ? izCon2/izSw2 : 0);
        o.chase.push(ooz2.length > 0 ? chases2/ooz2.length : 0);
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

    // good:true = higher percentile → red (better). good:false = lower is better, color is flipped
    var disciplineBars = sc.length ? [
      { lbl: 'SWING%',      val: mySwing     != null ? fmt1(mySwing*100)+'%'      : '—', pct: mySwing     != null ? 1 - leaguePct(mySwing,     leagueDisc.swing)     : 0, good: true },
      { lbl: 'WHIFF%',      val: myWhiff     != null ? fmt1(myWhiff*100)+'%'      : '—', pct: myWhiff     != null ? 1 - leaguePct(myWhiff,     leagueDisc.whiff)     : 0, good: true },
      { lbl: 'K%',          val: myK         != null ? fmt1(myK*100)+'%'          : '—', pct: myK         != null ? 1 - leaguePct(myK,         leagueDisc.k)         : 0, good: true },
      { lbl: 'BB%',         val: myBB        != null ? fmt1(myBB*100)+'%'         : '—', pct: myBB        != null ? leaguePct(myBB,        leagueDisc.bb)        : 0, good: true  },
      { lbl: 'PS/PA',       val: myPspa      != null ? fmt2(myPspa)               : '—', pct: myPspa      != null ? leaguePct(myPspa,      leagueDisc.pspa)      : 0, good: true  },
      { lbl: 'IZ SWING%',   val: myIzSwing   != null ? fmt1(myIzSwing*100)+'%'   : '—', pct: myIzSwing   != null ? leaguePct(myIzSwing,   leagueDisc.izSwing)   : 0, good: true  },
      { lbl: 'IZ CONTACT%', val: myIzContact != null ? fmt1(myIzContact*100)+'%' : '—', pct: myIzContact != null ? leaguePct(myIzContact, leagueDisc.izContact) : 0, good: true  },
      { lbl: 'CHASE%',      val: myChase     != null ? fmt1(myChase*100)+'%'      : '—', pct: myChase     != null ? 1 - leaguePct(myChase,     leagueDisc.chase)     : 0, good: true },
    ] : [];

    function makeSavantBar(b) {
      var p = Math.max(0, Math.min(1, b.pct || 0));
      var colorP = Math.max(0, Math.min(1, b.good ? p : (1 - p)));
      var r, g, bl;
      if (colorP <= 0.5) {
        var t = colorP * 2;
        r  = Math.round(58  + t * (160 - 58));
        g  = Math.round(130 + t * (160 - 130));
        bl = Math.round(210 + t * (160 - 210));
      } else {
        var t = (colorP - 0.5) * 2;
        r  = Math.round(160 + t * (210 - 160));
        g  = Math.round(160 + t * (50  - 160));
        bl = Math.round(160 + t * (50  - 160));
      }
      var color = 'rgb(' + r + ',' + g + ',' + bl + ')';
      var widthPct = (p * 100).toFixed(1);
      return '<div class="stat-bar-row" style="align-items:center;margin-bottom:10px">' +
        '<div class="sbr-label" style="width:90px;flex-shrink:0">' + b.lbl + '</div>' +
        '<div style="flex:1;position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;margin:0 8px">' +
          '<div class="sbr-fill" style="position:absolute;left:0;top:0;height:10px;width:0%;background:' + color + ';border-radius:5px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)" data-width="' + widthPct + '%"></div>' +
          '<div class="savant-bubble" style="position:absolute;top:50%;transform:translate(-50%,-50%);left:0%;width:26px;height:26px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:var(--font-mono);z-index:2;transition:left 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.4)" data-left="' + widthPct + '">●</div>' +
        '</div>' +
        '<div style="width:60px;text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + color + ';flex-shrink:0">' + b.val + '</div>' +
      '</div>';
    }

    return '<div class="overview-grid">' +
      '<div class="stat-card" style="grid-column:1/-1"><div class="stat-card-header"><span class="stat-card-title">Percentile Stats</span>' +
      '<span class="stat-card-subtitle">' + totPitches + ' pitches seen</span></div>' +
      '<div style="padding:16px 24px">' +
      (disciplineBars.length ? disciplineBars.map(makeSavantBar).join('') : '<p style="color:var(--text-dim);font-family:var(--font-mono);font-size:12px">No pitch data available.</p>') +
      '</div></div>' +
      '</div>';
  }

  if (type === 'pitcher' && pitch && pitch.scatter) {
    // Build date options for pitch metrics filter
    var pmDates = new Set();
    var pmYears = new Set();
    pitch.scatter.forEach(function(s) {
      if (s.date) { pmDates.add(s.date); pmYears.add(s.date.slice(0,4)); }
    });
    pmDates = Array.from(pmDates).sort();
    pmYears = Array.from(pmYears).sort();

    var pmDateFilter = 'season'; // default = all
    var pmSelectedDate = null;

    // League percentile arrays for pitchers
    var lgP = (function() {
      var o = { str:[], swing:[], whiff:[], contact:[], k:[], bb:[], ea:[], kbb:[] };
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
        var sw2t = sw2 + fo2 + ip2;
        var pname2 = sc2[0] && sc2[0].pitcher;
        var pd2 = pname2 ? (DATA.pitchers.find(function(p){ return p.pitcher === pname2; }) || {}) : {};
        o.str.push(str2/t2);
        o.swing.push(sw2t/t2);
        o.whiff.push(sw2t > 0 ? sw2/sw2t : 0);
        o.contact.push(sw2t > 0 ? (fo2+ip2)/sw2t : 0);
        o.k.push(ks2/t2);
        o.bb.push(bbs2/t2);
        if (pd2.EA_pct != null) o.ea.push(pd2.EA_pct);
        if (pd2.K_BB   != null) o.kbb.push(pd2.K_BB);
      });
      return o;
    })();

    function lp(val, arr) {
      if (!arr.length || val == null) return 0;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    function calcMetrics(scIn) {
      var tot    = scIn.filter(function(s) { return s.outcome && s.outcome !== ''; }).length;
      var ks     = scIn.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
      var bbs    = scIn.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
      var str    = scIn.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
      var swStr  = scIn.filter(function(s) { return s.outcome === 'Swinging Strike'; }).length;
      var inPlay = scIn.filter(function(s) { return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
      var fouls  = scIn.filter(function(s) { return s.outcome === 'Foul'; }).length;
      var swings = swStr + fouls + inPlay;
      var pd     = DATA.pitchers.find(function(p) { return p.pitcher === name; }) || {};
      return {
        tot: tot, ks: ks, bbs: bbs, str: str, swStr: swStr, inPlay: inPlay, fouls: fouls, swings: swings, pd: pd,
        bars: [
          { lbl: 'STR%',     val: tot > 0    ? fmt1(str/tot*100) + '%'             : '—', pct: tot > 0    ? lp(str/tot,               lgP.str)     : 0, good: true },
          { lbl: 'SWING%',   val: tot > 0    ? fmt1(swings/tot*100) + '%'          : '—', pct: tot > 0    ? lp(swings/tot,            lgP.swing)   : 0, good: true },
          { lbl: 'WHIFF%',   val: swings > 0 ? fmt1(swStr/swings*100) + '%'        : '—', pct: swings > 0 ? lp(swStr/swings,          lgP.whiff)   : 0, good: true },
          { lbl: 'K%',       val: tot > 0    ? fmt1(ks/tot*100) + '%'              : '—', pct: tot > 0    ? lp(ks/tot,                lgP.k)       : 0, good: true },
          { lbl: 'BB%',      val: tot > 0    ? fmt1(bbs/tot*100) + '%'             : '—', pct: tot > 0    ? 1 - lp(bbs/tot,           lgP.bb)      : 0, good: true },
          { lbl: 'E+A%',     val: pd.EA_pct != null ? fmt1(pd.EA_pct)+'%' : '—', pct: lp(pd.EA_pct, lgP.ea),  good: true },
          { lbl: 'K/BB',     val: pd.K_BB   != null ? fmt2(pd.K_BB)       : '—', pct: lp(pd.K_BB,   lgP.kbb), good: true }
        ]
      };
    }

    // Season dropdown for pitch metrics
    var seasonLabel = pmYears.length ? pmYears[0] + ' Summer' : 'Season';
    var pmDateFilterHTML = '<div style="margin-bottom:16px;padding:0 24px">' +
      '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Season</div>' +
      '<select id="pm-season-select" style="background:#0e1525;border:1.5px solid rgba(255,184,28,0.35);border-radius:6px;color:#FFB81C;font-family:var(--font-mono);font-size:11px;padding:8px 12px;cursor:pointer;outline:none;letter-spacing:0.5px;">' +
        '<option value="season">Season</option>' +
        (pmYears.length ? '<option value="'+pmYears[0]+'">Summer '+pmYears[0]+'</option>' : '') +
      '</select></div>';

    var sc = pitch.scatter;
    var m  = calcMetrics(sc);
    var bars = m.bars;
    var tot  = m.tot;

    var html = '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Pitch Metrics</span>' +
      '<span class="stat-card-subtitle" id="pm-pitch-count">' + tot + ' pitches</span></div>' +
      pmDateFilterHTML +
      '<div style="padding:16px 24px" id="pm-bars-wrap">' +
      bars.map(function(b) {
        var p = Math.max(0, Math.min(1, b.pct || 0));
        var colorP = Math.max(0, Math.min(1, b.good ? p : (1 - p)));
        var r, g, bl;
        if (colorP <= 0.5) {
          var t = colorP * 2;
          r  = Math.round(58  + t * (160 - 58));
          g  = Math.round(130 + t * (160 - 130));
          bl = Math.round(210 + t * (160 - 210));
        } else {
          var t = (colorP - 0.5) * 2;
          r  = Math.round(160 + t * (210 - 160));
          g  = Math.round(160 + t * (50  - 160));
          bl = Math.round(160 + t * (50  - 160));
        }
        var color = 'rgb(' + r + ',' + g + ',' + bl + ')';
        var widthPct = (p * 100).toFixed(1);
        return '<div class="stat-bar-row" style="align-items:center;margin-bottom:10px">' +
          '<div class="sbr-label" style="width:80px;flex-shrink:0">' + b.lbl + '</div>' +
          '<div style="flex:1;position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;margin:0 8px">' +
            '<div class="sbr-fill" style="position:absolute;left:0;top:0;height:10px;width:0%;background:' + color + ';border-radius:5px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)" data-width="' + widthPct + '%"></div>' +
            '<div class="savant-bubble" style="position:absolute;top:50%;transform:translate(-50%,-50%);left:0%;width:26px;height:26px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:var(--font-mono);z-index:2;transition:left 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.4)" data-left="' + widthPct + '">●</div>' +
          '</div>' +
          '<div style="width:60px;text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + color + ';flex-shrink:0">' + b.val + '</div>' +
        '</div>';
      }).join('') + '</div></div>';

    // Wire up season dropdown for pitch metrics
    setTimeout(function() {
      var sel = document.getElementById('pm-season-select');
      if (sel) {
        sel.addEventListener('change', function() {
          pmDateFilter = this.value;
          var filtered = pmDateFilter === 'season'
            ? pitch.scatter
            : pitch.scatter.filter(function(s){ return s.date && s.date.startsWith(pmDateFilter); });
            var m2 = calcMetrics(filtered);
            // Update pitch count
            var countEl = document.getElementById('pm-pitch-count');
            if (countEl) countEl.textContent = m2.tot + ' pitches';
            // Rebuild bars
            var wrap = document.getElementById('pm-bars-wrap');
            if (!wrap) return;
            wrap.innerHTML = m2.bars.map(function(b) {
              var p2 = Math.max(0, Math.min(1, b.pct || 0));
              var cp2 = Math.max(0, Math.min(1, b.good ? p2 : (1 - p2)));
              var r2, g2, bl2;
              if (cp2 <= 0.5) { var t2=cp2*2; r2=Math.round(58+t2*(180-58)); g2=Math.round(130+t2*(180-130)); bl2=Math.round(210+t2*(180-210)); }
              else { var t2=(cp2-0.5)*2; r2=Math.round(180+t2*(210-180)); g2=Math.round(180+t2*(50-180)); bl2=Math.round(180+t2*(50-180)); }
              var col2 = 'rgb('+r2+','+g2+','+bl2+')';
              var wp2 = (p2*100).toFixed(1);
              return '<div class="stat-bar-row" style="align-items:center;margin-bottom:10px">' +
                '<div class="sbr-label" style="width:80px;flex-shrink:0">'+b.lbl+'</div>' +
                '<div style="flex:1;position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;margin:0 8px">' +
                  '<div class="sbr-fill" style="position:absolute;left:0;top:0;height:10px;width:0%;background:'+col2+';border-radius:5px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)" data-width="'+wp2+'%"></div>' +
                  '<div class="savant-bubble" style="position:absolute;top:50%;transform:translate(-50%,-50%);left:0%;width:26px;height:26px;border-radius:50%;background:'+col2+';display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;font-family:var(--font-mono);z-index:2;transition:left 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.4)" data-left="'+wp2+'">●</div>' +
                '</div>' +
                '<div style="width:60px;text-align:right;font-family:var(--font-mono);font-size:13px;font-weight:600;color:'+col2+';flex-shrink:0">'+b.val+'</div>' +
              '</div>';
            }).join('');
            // Re-trigger bar animations
            wrap.querySelectorAll('.sbr-fill').forEach(function(el){ if(el.dataset.width) el.style.width=el.dataset.width; });
            wrap.querySelectorAll('.savant-bubble').forEach(function(el){ if(el.dataset.left) el.style.left=el.dataset.left; });
        });
      }
    }, 50);

    return html;
  }

  return '<div class="empty-state"><div class="empty-state-icon">📊</div><h3>No data available</h3></div>';
}

// ── SEASON STATS TAB ──────────────────────────────
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
function renderZone(name, type, pitch, container) {
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
  var ZONE_X1 = -1, ZONE_X2 = 1;
  var ZONE_Y1 = 0,  ZONE_Y2 = 1;

  var totalPts = points.length;
  var inZone   = points.filter(function(s){ return s.x >= ZONE_X1 && s.x <= ZONE_X2 && s.y >= ZONE_Y1 && s.y <= ZONE_Y2; }).length;
  var ks       = points.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
  var hits     = points.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
  var swStr    = points.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
  var chases   = points.filter(function(s){ return (s.x < ZONE_X1 || s.x > ZONE_X2 || s.y < ZONE_Y1 || s.y > ZONE_Y2)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;

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
    var cW = (ZX2-ZX1)/3, cH = (ZY2-ZY1)/3;

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
        if (s.x >= z.x1 && s.x < z.x2 && s.y >= z.y1 && s.y < z.y2) z.count++;
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
        return s.x >= z.x1 && s.x < z.x2 && s.y >= z.y1 && s.y < z.y2;
      });
      if (inInner) return;
      // Assign to outer quadrant
      var inZoneY = s.y >= ZY1 && s.y < ZY2;
      var inZoneX = s.x >= ZX1 && s.x < ZX2;
      if (!inZoneY && s.x < 0)  outer[0].count += (s.y >= ZY2) ? 1 : 0;
      if (!inZoneY && s.x < 0)  outer[2].count += (s.y < ZY1)  ? 1 : 0;
      if (!inZoneY && s.x >= 0) outer[1].count += (s.y >= ZY2) ? 1 : 0;
      if (!inZoneY && s.x >= 0) outer[3].count += (s.y < ZY1)  ? 1 : 0;
      // above/below zone, within x bounds
      if (inZoneX && s.y >= ZY2) { outer[0].count++; outer[1].count++; } // split above
      if (inZoneX && s.y < ZY1)  { outer[2].count++; outer[3].count++; } // split below
      // beside zone within y bounds — add to nearest corner
      if (inZoneY && s.x < ZX1)  { outer[0].count++; outer[2].count++; }
      if (inZoneY && s.x >= ZX2) { outer[1].count++; outer[3].count++; }
    });

    // Simpler: just count by quadrant outside inner zone
    outer.forEach(function(z) { z.count = 0; });
    filtered.forEach(function(s) {
      var inInner = inner.some(function(z) {
        return s.x >= z.x1 && s.x < z.x2 && s.y >= z.y1 && s.y < z.y2;
      });
      if (inInner) return;
      var isLeft = s.x < (ZX1+ZX2)/2;
      var isTop  = s.y >= (ZY1+ZY2)/2;
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
    var iz   = f.filter(function(s){ return s.x >= ZONE_X1 && s.x <= ZONE_X2 && s.y >= ZONE_Y1 && s.y <= ZONE_Y2; }).length;
    var fks  = f.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
    var fh   = f.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var fsw  = f.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
    var fch  = f.filter(function(s){ return (s.x < ZONE_X1 || s.x > ZONE_X2 || s.y < ZONE_Y1 || s.y > ZONE_Y2)&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;
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
function renderSplits(name, type, pitch) {
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
    const team = resolveTeam(p.batter_team);
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.batter + '" data-type="batter">' + p.batter + '</a></td>' +
      '<td>' + (team ? team.abbreviation : '—') + '</td>' +
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
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Player</th><th>Team</th><th>AB</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th>' +
    '<th>H</th><th>2B</th><th>3B</th><th>HR</th><th>BB</th><th>K</th>' +
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
