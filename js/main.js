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
    const saved = localStorage.getItem('dd_user');
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
    localStorage.setItem('dd_user', JSON.stringify(AUTH._user));
    window.location.href = getBase() + 'index.html';
  },

  signOut: function() {
    localStorage.removeItem('dd_user');
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
  { id: 'bar', name: 'Barrie Baycats',             abbreviation: 'BAR', primaryColor: '#002D62' },
  { id: 'bra', name: 'Brantford Red Sox',           abbreviation: 'BRA', primaryColor: '#BD3039' },
  { id: 'ckb', name: 'Chatham-Kent Barnstormers',   abbreviation: 'CKB', primaryColor: '#E87722' },
  { id: 'gue', name: 'Guelph Royals',               abbreviation: 'GUE', primaryColor: '#003DA5' },
  { id: 'ham', name: 'Hamilton Cardinals',           abbreviation: 'HAM', primaryColor: '#C8102E' },
  { id: 'kit', name: 'Kitchener Panthers',           abbreviation: 'KIT', primaryColor: '#F5A800' },
  { id: 'lon', name: 'London Majors',                abbreviation: 'LON', primaryColor: '#072B61' },
  { id: 'tor', name: 'Toronto Maple Leafs',          abbreviation: 'TOR', primaryColor: '#134A8E' },
  { id: 'wel', name: 'Welland Jackfish',             abbreviation: 'WEL', primaryColor: '#00703C' }
];

const ACTIVE_ROSTER_2025_CSV = `Player,Team
Adam Odd,Barrie Baycats
Adam Thuss,London Majors
Aden Ryan,Chatham-Kent Barnstormers
Aidan Armitage,Brantford Red Sox
AJ Karosas,Brantford Red Sox
Alex Lanigan,Toronto Maple Leafs
Alex Springer,London Majors
Alfred Vega,Guelph Royals
Anderson Feliz,Hamilton Cardinals
Andrew Case,Guelph Royals
Andrew Savage,Brantford Red Sox
Andy Groening,Chatham-Kent Barnstormers
Andy Leader,Guelph Royals
Angel Guerrero,Hamilton Cardinals
Anthony Porcellato,Brantford Red Sox
Anthony Porcellato,Welland Jackfish
Ashton Patterson,Guelph Royals
Axel Rosario,Brantford Red Sox
Bawin Colon,Kitchener Panthers
Ben Abram,Welland Jackfish
Ben Hewitt,Kitchener Panthers
Ben Scartz,Brantford Red Sox
Benjamin Sitarenios,Toronto Maple Leafs
Benjamin Sterritt,Toronto Maple Leafs
Brad Grieveson,Barrie Baycats
Braeden Pakkala,Barrie Baycats
Brandon Deans,Guelph Royals
Brandon Hernandez,Barrie Baycats
Brandon Hupe,Welland Jackfish
Brandon Nicoll,Hamilton Cardinals
Brandon Sekulovich,Brantford Red Sox
Branfy Infante,Barrie Baycats
Breidy Encarnacion,Barrie Baycats
Brendan Luther,Welland Jackfish
Brendon Daley,Barrie Baycats
Brett Reid,Kitchener Panthers
Brody Black,Brantford Red Sox
Bryce Arnold,Welland Jackfish
Caleb Cassie,London Majors
Caleb Seroski,Hamilton Cardinals
Cam Bauer,Kitchener Panthers
Canice Ejoh,Barrie Baycats
Carlos Dominguez,Hamilton Cardinals
Carlos Sano,Barrie Baycats
Carson Barker,Barrie Baycats
Carson Burns,Guelph Royals
Carson Johnson,Welland Jackfish
Casey Bouillere-Howard,Hamilton Cardinals
Cassidy Watt,Brantford Red Sox
Catalin Morin,Chatham-Kent Barnstormers
Cesilio Pimentel,London Majors
Charlie Towers,Kitchener Panthers
Chris Boatto,Hamilton Cardinals
Chris Lazar,Guelph Royals
Clayton Keyes,Barrie Baycats
Cleveland Brownlee,London Majors
Colbey Klepper,Brantford Red Sox
Conner Morro,Guelph Royals
Connor Cory,Hamilton Cardinals
Connor Irvine,Brantford Red Sox
Cooper Tomkinson,Toronto Maple Leafs
Cory Lawson,Kitchener Panthers
Dakota Parsons,Chatham-Kent Barnstormers
Damon Topolie,Guelph Royals
Danny Garcia,Hamilton Cardinals
Danny Howat,Welland Jackfish
Darlin German,Hamilton Cardinals
David Draayers,London Majors
Deivis Nadal,Guelph Royals
Deivy Mendez,Welland Jackfish
Dennis Dei Baning,Toronto Maple Leafs
Drew Donaldson,Guelph Royals
Drew Howard,Toronto Maple Leafs
Dustin Davidson,London Majors
Edgar Figueroa,Barrie Baycats
Edgar Garcia,Guelph Royals
Eduardo De Oleo,London Majors
Elian Serrata,Kitchener Panthers
Elvin Liriano,Guelph Royals
Erasmo Pinales,London Majors
Eric Pettipiece,Chatham-Kent Barnstormers
Ethan Mann,Welland Jackfish
Ethan Paulos,Brantford Red Sox
Euclides Leyer,Welland Jackfish
Evan Elliott,Kitchener Panthers
Evan Magill,Hamilton Cardinals
Evan Morrison,Chatham-Kent Barnstormers
Francisco Hernandez,Barrie Baycats
Francisco Martinez,Brantford Red Sox
Frank Garces,Barrie Baycats
Frankie Gulko,Toronto Maple Leafs
Freisis Adames,Hamilton Cardinals
Garret Day,Chatham-Kent Barnstormers
Garrett Takamatsu,Guelph Royals
Gavin McLean,Kitchener Panthers
Gianfranco Morello,Welland Jackfish
Graham Tebbit,Brantford Red Sox
Greg Marco,Welland Jackfish
Greg Rapp,Brantford Red Sox
Greyson Barrett,Chatham-Kent Barnstormers
Hayden Jaco,Barrie Baycats
Hector Yan,Hamilton Cardinals
J.D. Williams,Guelph Royals
Jacob Bonzon,Toronto Maple Leafs
Jacob Gajic,Hamilton Cardinals
Jacob Kush,Guelph Royals
Jacob Liberta,Kitchener Panthers
Jaden Babiuk,London Majors
Jaden Brown,Hamilton Cardinals
Jake Sanford,Guelph Royals
Jakob Cantor,Brantford Red Sox
James Smibert,Welland Jackfish
Jamie Cabral,Kitchener Panthers
Jarrett Burney,London Majors
Jeremie Veilleux,Hamilton Cardinals
Jhon Javier,Toronto Maple Leafs
Jonah Weisner,Welland Jackfish
Jordis Ramos,Brantford Red Sox
Jorge De La Cruz,Brantford Red Sox
Jose Arias,Brantford Red Sox
Joshua Williams,Kitchener Panthers
Juan Benitez,Barrie Baycats
Juan Mejia,Barrie Baycats
Julien Monks,Chatham-Kent Barnstormers
Justin Gideon,Welland Jackfish
Justin Groves,Barrie Baycats
Kade Douglas,London Majors
Kade Kozak,Brantford Red Sox
Kevin Escorcia,Guelph Royals
Kian Johnston,Chatham-Kent Barnstormers
Kirk Gibson,Toronto Maple Leafs
Kristyan Puyol-Genossar,Barrie Baycats
Kyle Kush,Guelph Royals
Kyle Maves,London Majors
Kyle Poapst,Toronto Maple Leafs
Leandro Mejia,Brantford Red Sox
Lee Kucera,Chatham-Kent Barnstormers
Liam Wilson,Guelph Royals
Logan Warkentin,Hamilton Cardinals
Luca Boscarino,Guelph Royals
Lucas Bateman,Brantford Red Sox
Lucas Lefebvre,Brantford Red Sox
Luis Florentino,Toronto Maple Leafs
Luis Jean,London Majors
Luis Perez,London Majors
Luis Ramirez,Hamilton Cardinals
Maikol Escotto,London Majors
Malik Williams,Kitchener Panthers
Marcos Castillo,Guelph Royals
Marcus Knecht,Toronto Maple Leafs
Marek Deska,Guelph Royals
Mateo Zeppieri,Kitchener Panthers
Matt Brandt,Toronto Maple Leafs
Matthew Fabian,Toronto Maple Leafs
Matthew Ward,Guelph Royals
Miguel Hiraldo,Guelph Royals
Mike Cecchetto,Toronto Maple Leafs
Mitsuki Fukuda,Chatham-Kent Barnstormers
Mizuki Akatsuka,Chatham-Kent Barnstormers
Moises Brito,Chatham-Kent Barnstormers
Myles Martinez,Welland Jackfish
Nick Iannantone,Brantford Red Sox
Nick Veselinovic,Toronto Maple Leafs
Noah Hull,Barrie Baycats
Noah Law,Brantford Red Sox
Noel McGarry Doyle,Barrie Baycats
Nolan Machibroda,Barrie Baycats
Oscar Moreta,Barrie Baycats
Owen Boon,Hamilton Cardinals
Owen Constantineau,Chatham-Kent Barnstormers
Owen MacNeil,Kitchener Panthers
Owen Ozanich,Welland Jackfish
Pedro De Los Santos,Welland Jackfish
Petey Kiefer,Kitchener Panthers
Rafael Gross,Kitchener Panthers
Reinaldo De Paula,Toronto Maple Leafs
Reyny Reyes,Hamilton Cardinals
Robert Mackie,Chatham-Kent Barnstormers
Robert Mullen,Welland Jackfish
Roberto Caro,London Majors
Ryan Capuano,Toronto Maple Leafs
Ryan Dos Santos,Guelph Royals
Ryan Rijo,Barrie Baycats
Ryder Hancock,London Majors
Samuel Quintana,Kitchener Panthers
Samuele Bruno,Kitchener Panthers
Saul Vasquez,Barrie Baycats
Scott Gillespie,Welland Jackfish
Skylar Janisse,London Majors
Spencer Morin,Chatham-Kent Barnstormers
Spenser Ross,Toronto Maple Leafs
Steven Hospital,Hamilton Cardinals
Tanner Rempel,Hamilton Cardinals
Teodoro Ortega,Welland Jackfish
Thibault Mercadier,Chatham-Kent Barnstormers
Thomas Green,Chatham-Kent Barnstormers
Tim Holyk,Brantford Red Sox
Travis Keys,London Majors
Trent Lawson,Kitchener Panthers
Trent Lenihan,London Majors
Tucker Zdunich,London Majors
Tyler Duncan,Hamilton Cardinals
Tyler Plumpton,Barrie Baycats
Tyson Gomm,Welland Jackfish
Vasilios Kaloudis,Toronto Maple Leafs
Victor Payano,London Majors
Wandy Ciprian,Barrie Baycats
Wilgenis Alvarado,Toronto Maple Leafs
Xavier Whittle,London Majors
Yadian Martinez,Toronto Maple Leafs
Yasiel Puig,Toronto Maple Leafs
Yolki Pena,Hamilton Cardinals
Yordan Manduley,Toronto Maple Leafs
Yosuke Fujie,Kitchener Panthers
Yosvani Penalver,Kitchener Panthers
Yunior Ibarra,Kitchener Panthers
Yuri Yokoyama,Chatham-Kent Barnstormers
Yushin Ohta,Chatham-Kent Barnstormers
Zachary Laird,London Majors
Zane Skansi,Kitchener Panthers`;

const ACTIVE_ROSTER_2025 = ACTIVE_ROSTER_2025_CSV.trim().split(/\r?\n/).slice(1).map(function(line) {
  var ix = line.lastIndexOf(',');
  return { player: line.slice(0, ix).trim(), team: line.slice(ix + 1).trim() };
});

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

const PLAYER_NAME_ALIASES = {
  'braedan pakkala': 'Braeden Pakkala',
  'braeden pakkala': 'Braeden Pakkala',
  'andy groening': 'Andrew Groening',
  'spencer-thompson': 'Antonino Spencer-Thompson',
  'leliis beltran': 'Lelis Beltran',
  'osafa jones': 'Asafa Jones',
  'evan elliot': 'Evan Elliott',
  'evan elliott': 'Evan Elliott',
  'koki takashi': 'Koki Togashi',
  'koki togashi': 'Koki Togashi',
  'ricardo alvarez delugo': 'Ricardo Alvarez de Lugo',
  'ricardo de lugo': 'Ricardo Alvarez de Lugo',
  'ricardo alvarez de lugo': 'Ricardo Alvarez de Lugo',
  'teo ortega': 'Teodoro Ortega',
  'teodoro ortega': 'Teodoro Ortega',
  'yuri yikoyama': 'Yuri Yokoyama',
  'yuri yokoyama': 'Yuri Yokoyama'
};

function basePlayerNameKey(name) {
  return (name || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function canonicalPlayerName(name) {
  var raw = (name || '').replace(/\s+/g, ' ').trim();
  var key = raw.toLowerCase();
  return PLAYER_NAME_ALIASES[key] || raw;
}

function normPlayerName(name) {
  return canonicalPlayerName(name).toLowerCase();
}

function findByPlayerName(arr, field, name) {
  var k = normPlayerName(name);
  return (arr || []).find(function(row) { return normPlayerName(row[field]) === k; }) || null;
}

function getIblRowsForPlayer(name) {
  var direct = DATA.iblHistory[name];
  if (direct) return direct;
  var k = normPlayerName(name);
  var rows = [];
  Object.keys(DATA.iblHistory || {}).forEach(function(key) {
    if (normPlayerName(key) === k) rows = rows.concat(DATA.iblHistory[key] || []);
  });
  return rows;
}

function getIblSeasonForPlayer(name, year, test) {
  return (getIblRowsForPlayer(name) || []).find(function(row) {
    return (row.season || '').indexOf(year) !== -1 && (!test || test(row));
  }) || null;
}

function getActiveRosterRows2025(teamId) {
  var seen = {};
  return ACTIVE_ROSTER_2025.filter(function(row) {
    var team = resolveTeam(row.team);
    if (teamId && !(team && team.id === teamId)) return false;
    var key = normPlayerName(row.player) + '|' + (team ? team.id : row.team);
    if (seen[key]) return false;
      seen[key] = true;
      return true;
  }).map(function(row) { return Object.assign({}, row, { player: canonicalPlayerName(row.player) }); });
}

function getActiveRosterTeam2025(name) {
  var k = normPlayerName(name);
  var row = ACTIVE_ROSTER_2025.find(function(r) { return normPlayerName(r.player) === k; });
  return row ? resolveTeam(row.team) : null;
}

function isOnActiveRoster2025(name) {
  return !!getActiveRosterTeam2025(name);
}

function displayTeamForPlayer(name, fallbackTeam) {
  if (_activeSeason === 'year:2025') {
    var fallback = resolveTeam(fallbackTeam);
    if (fallback && ACTIVE_ROSTER_2025.some(function(row) {
      var rowTeam = resolveTeam(row.team);
      return normPlayerName(row.player) === normPlayerName(name) && rowTeam && rowTeam.id === fallback.id;
    })) return fallback.abbreviation;
    var activeTeam = getActiveRosterTeam2025(name);
    if (activeTeam) return activeTeam.abbreviation;
  }
  var t = resolveTeam(fallbackTeam);
  return t ? t.abbreviation : (fallbackTeam || '—');
}

function playerHasSeasonData(name, type, year) {
  var k = normPlayerName(name);
  if (year === '2026') {
    if (type === 'pitcher') {
      return DATA.pitchers2026.some(function(p) { return normPlayerName(p.pitcher) === k && ((p.IP || 0) > 0 || (p.BF || 0) > 0 || (p.total_pitches || 0) > 0); }) ||
        DATA.pitches2026.some(function(bp) { return bp.scatter && bp.scatter.some(function(s) { return normPlayerName(s.pitcher) === k; }); });
    }
    return DATA.summary2026.some(function(p) { return normPlayerName(p.batter) === k && ((p.PA || 0) > 0 || (p.AB || 0) > 0); }) ||
      DATA.pitches2026.some(function(bp) { return normPlayerName(bp.batter) === k && bp.scatter && bp.scatter.length; });
  }
  var summary25 = DATA._summary25 || DATA.summary;
  var pitches25 = DATA._pitches25 || DATA.pitches;
  var pitchers25 = DATA._pitchers25 || DATA.pitchers;
  var pbpBatters25 = DATA._pbpBatters25 || DATA.pbpBatters;
  var pbpPitchers25 = DATA._pbpPitchers25 || DATA.pbpPitchers;
  if (type === 'pitcher') {
    return !!getIblSeasonForPlayer(name, '2025', function(s) { return (s.IP || 0) > 0 || s.pos === 'P'; }) ||
      pbpPitchers25.some(function(p) { return normPlayerName(p.pitcher) === k && (p.BF || 0) > 0; }) ||
      pitchers25.some(function(p) { return normPlayerName(p.pitcher) === k; }) ||
      pitches25.some(function(bp) { return bp.scatter && bp.scatter.some(function(s) { return normPlayerName(s.pitcher) === k; }); });
  }
  return !!getIblSeasonForPlayer(name, '2025', function(s) { return (s.AB || 0) > 0 || (s.PA || 0) > 0; }) ||
    pbpBatters25.some(function(p) { return normPlayerName(p.batter) === k && ((p.PA || 0) > 0 || (p.AB || 0) > 0); }) ||
    summary25.some(function(p) { return normPlayerName(p.batter) === k && ((p.PA || 0) > 0 || (p.AB || 0) > 0); }) ||
    pitches25.some(function(bp) { return normPlayerName(bp.batter) === k && bp.scatter && bp.scatter.length; });
}

// ── Data normalization ───────────────────────────────────────────────────────
function normalizeDataDiamondBatterRow(p) {
  if (!p) return;
  if (p.SWING_pct == null && p.Swing_pct != null) p.SWING_pct = p.Swing_pct;
  if (p.WHIFF_pct == null && p.Whiff_pct != null) p.WHIFF_pct = p.Whiff_pct;
  if (p.CONTACT_pct == null && p.WHIFF_pct != null) p.CONTACT_pct = 100 - p.WHIFF_pct;
  if (p.FP_SWING_pct == null && p.FP_Swing_pct != null) p.FP_SWING_pct = p.FP_Swing_pct;
  if (p.PS_PA == null && p.pitches_seen != null && p.PA > 0) p.PS_PA = p.pitches_seen / p.PA;
  if (p.ISO == null && p.SLG != null && p.AVG != null) p.ISO = p.SLG - p.AVG;

  var bip = (p.Groundout || 0) + (p.DP || 0) + (p.TP || 0) + (p.Flyout || 0) +
    (p.SF || 0) + (p.SF_DP || 0) + (p.Lineout || 0) + (p.Popout || 0);
  if (bip > 0) {
    if (p.GB_pct == null) p.GB_pct = ((p.Groundout || 0) + (p.DP || 0) + (p.TP || 0)) / bip * 100;
    if (p.FB_pct == null) p.FB_pct = ((p.Flyout || 0) + (p.SF || 0) + (p.SF_DP || 0)) / bip * 100;
    if (p.LO_pct == null) p.LO_pct = (p.Lineout || 0) / bip * 100;
    if (p.PO_pct == null) p.PO_pct = (p.Popout || 0) / bip * 100;
  }
}

function normalizeDataDiamondPitcherRow(p) {
  if (!p) return;
  if (p.SWING_pct == null && p.Swing_pct != null) p.SWING_pct = p.Swing_pct;
  if (p.WHIFF_pct == null && p.Whiff_pct != null) p.WHIFF_pct = p.Whiff_pct;
  if (p.CONTACT_pct == null && p.WHIFF_pct != null) p.CONTACT_pct = 100 - p.WHIFF_pct;
  if (p.FP_STR_pct == null && p.FPS_pct != null) p.FP_STR_pct = p.FPS_pct;
  if (p.PUTAWAY_pct == null && p.Putaway_pct != null) p.PUTAWAY_pct = p.Putaway_pct;
  if (p.BA_against == null && p.BAA != null) p.BA_against = p.BAA;
  if (p.LO_pct == null && p.LD_pct != null) p.LO_pct = p.LD_pct;
  if (p.pitches == null && p.total_pitches != null) p.pitches = p.total_pitches;
}

// ── Data store — all years kept separately, never merged ─────────────────────
let DATA = {
  summary: [], pitches: [], pitchers: [], iblHistory: {},
  pbpBatters: [], pbpPitchers: [],
  summary2026: [], pitches2026: [], pitchers2026: []
};

// ── Global season tracker (set by season filter buttons) ──────────────────────
var _activeSeason = 'year:2026'; // default to current datadiamond season

// ── swapSeasonData: swap DATA.summary/pitches/pitchers to the selected year ───
function swapSeasonData(yr) {
  _activeSeason = yr;
  if (yr === 'year:2026') {
    DATA.summary     = DATA.summary2026;
    DATA.pitches     = DATA.pitches2026;
    DATA.pitchers    = DATA.pitchers2026;
    DATA.pbpBatters  = [];
    DATA.pbpPitchers = [];
  } else {
    // Restore from stored 2025 copies
    DATA.summary     = DATA._summary25;
    DATA.pitches     = DATA._pitches25;
    DATA.pitchers    = DATA._pitchers25;
    DATA.pbpBatters  = DATA._pbpBatters25;
    DATA.pbpPitchers = DATA._pbpPitchers25;
  }
}

function getSeasonData() {
  return {
    summary:     DATA.summary,
    pitches:     DATA.pitches,
    pitchers:    DATA.pitchers,
    pbpBatters:  DATA.pbpBatters,
    pbpPitchers: DATA.pbpPitchers,
    iblHistory:  DATA.iblHistory
  };
}

// ── ACCESS CONTROL ─────────────────────────────────
const ACCESS = {
  GUELPH_NAMES: ['Guelph Royals', 'guelph royals', 'GUE', 'gue'],

  getUser: function() {
    try { return JSON.parse(localStorage.getItem('dd_user') || '{}'); } catch(e) { return {}; }
  },

  isGuelph: function(teamName) {
    if (!teamName) return false;
    var t = teamName.toLowerCase();
    return t.includes('guelph') || t === 'gue';
  },

  // Can this user view this player page?
  canViewPlayer: function(playerName, playerType, playerTeamName) {
    var u = this.getUser();
    var role = u.role || 'admin';
    if (role === 'admin') return true;

    var ownPlayer = (u.player || '').toLowerCase().trim();
    var isOwnPlayer = ownPlayer && playerName.toLowerCase().trim() === ownPlayer;
    if (isOwnPlayer) return true;

    var isGuelphPlayer = this.isGuelph(playerTeamName);

    if (role === 'catcher') {
      // Own player + all Guelph pitchers + all non-Guelph players
      if (!isGuelphPlayer) return true;
      if (playerType === 'pitcher' && isGuelphPlayer) return true;
      return false; // Guelph batter that isn't them
    }

    if (role === 'position_player') {
      // Own player + all non-Guelph players
      if (!isGuelphPlayer) return true;
      return false; // any other Guelph player
    }

    return false;
  },

  // Can this user view/generate scouting for this team?
  canScoutTeam: function(teamName) {
    var u = this.getUser();
    var role = u.role || 'admin';
    if (role === 'admin') return true;
    return !this.isGuelph(teamName);
  },

  // Restricted message HTML
  restrictedHTML: function(playerName) {
    return '<div style="display:flex;align-items:center;justify-content:center;min-height:300px">' +
      '<div style="text-align:center;max-width:420px;padding:40px">' +
      '<div style="font-family:var(--font-display),sans-serif;font-size:32px;letter-spacing:0.1em;color:#f87171;margin-bottom:12px">ACCESS RESTRICTED</div>' +
      '<div style="font-family:var(--font-mono),monospace;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.7">' +
      'You do not have permission to view <strong style="color:rgba(255,255,255,0.7)">' + (playerName||'this player') + '</strong>.<br>' +
      'Access to teammate data is restricted for security and competitive reasons.<br><br>' +
      'Contact your administrator if you believe this is an error.' +
      '</div></div></div>';
  }
};


// ── INIT ──────────────────────────────────────────
async function init() {
  // Auth gate: stop here if user is not signed in
  if (!AUTH.init()) return;

  await loadAll();
  buildTicker();
  initGlobalSearch();

  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '')  initHomePage();
  if (path === 'league.html')                initTeamsPage();
  if (path === 'players.html')               initPlayersPage();
  if (path === 'scouting.html')              { if (typeof initScoutingPage === 'function') initScoutingPage(); }
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

    // Load 2025 and 2026 files in parallel — each year is independent, no crossover
    const [
      sumRes, pitRes, pitcherRes, iblRes, pbpBRes, pbpPRes,
      sum26Res, pit26Res, pitcher26Res
    ] = await Promise.all([
      fetch(base + 'data/summary.json'),
      fetch(base + 'data/pitches.json'),
      fetch(base + 'data/pitchers.json'),
      fetch(base + 'data/ibl_history.json'),
      fetch(base + 'data/pbp_batters.json'),
      fetch(base + 'data/pbp_pitchers.json'),
      fetch(base + 'data/summary2026.json'),
      fetch(base + 'data/pitches2026.json'),
      fetch(base + 'data/pitchers2026.json'),
    ]);

    // 2025 data — stored separately, never merged with 2026
    if (sumRes.ok)     DATA.summary     = await sumRes.json();
    if (pitRes.ok)     DATA.pitches     = await pitRes.json();
    if (pitcherRes.ok) DATA.pitchers    = await pitcherRes.json();
    if (iblRes.ok)     DATA.iblHistory  = await iblRes.json();
    if (pbpBRes.ok)    DATA.pbpBatters  = await pbpBRes.json();
    if (pbpPRes.ok)    DATA.pbpPitchers = await pbpPRes.json();

    // 2026 data — stored separately, no pbp (ERA/RBI from ibl_history.json)
    // If 2026 file missing, stays empty — no fallback to 2025
    DATA.summary2026   = sum26Res.ok     ? await sum26Res.json()     : [];
    DATA.pitches2026   = pit26Res.ok     ? await pit26Res.json()     : [];
    DATA.pitchers2026  = pitcher26Res.ok ? await pitcher26Res.json() : [];

    DATA.summary.forEach(normalizeDataDiamondBatterRow);
    DATA.pitchers.forEach(normalizeDataDiamondPitcherRow);
    DATA.summary2026.forEach(normalizeDataDiamondBatterRow);
    DATA.pitchers2026.forEach(normalizeDataDiamondPitcherRow);

    // Store 2025 originals so swapSeasonData can restore them
    DATA._summary25     = DATA.summary;
    DATA._pitches25     = DATA.pitches;
    DATA._pitchers25    = DATA.pitchers;
    DATA._pbpBatters25  = DATA.pbpBatters;
    DATA._pbpPitchers25 = DATA.pbpPitchers;

    // Default players/player cards to 2026. 2025 remains available via season filter.
    swapSeasonData('year:2026');

    console.log('2025 summary:', DATA.summary.length, '| 2026 summary:', DATA.summary2026.length);
    console.log('2025 pitches:', DATA.pitches.length, '| 2026 pitches:', DATA.pitches2026.length);
    console.log('2025 pitchers:', DATA.pitchers.length, '| 2026 pitchers:', DATA.pitchers2026.length);
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
function ddMissing() {
  return '--';
}
function fmt3OrDash(v) {
  return (v == null || isNaN(v)) ? ddMissing() : fmt3(v);
}
function fmt2OrDash(v) {
  return (v == null || isNaN(v)) ? ddMissing() : fmt2(v);
}
function fmtNOrDash(v) {
  return (v == null || isNaN(v)) ? ddMissing() : fmtN(v);
}
function fmtIPOrDash(v) {
  return (v == null || isNaN(v)) ? ddMissing() : fmtIP(v);
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
  // No pbp for 2026 — returns null, callers fall back to summary/scatter
  if (_activeSeason === 'year:2026') return null;
  return DATA.pbpBatters.find(function(p) { return p.batter === name; }) || null;
}
function getPbpPitcher(name) {
  if (_activeSeason === 'year:2026') return null;
  return DATA.pbpPitchers.find(function(p) { return p.pitcher === name; }) || null;
}
function _iblForYear(name, field) {
  // Return the iblHistory entry for the active season year
  var yr = _activeSeason.replace('year:', '');
  var entries = DATA.iblHistory[name] || [];
  var match = entries.find(function(s){ return (s.season||'').indexOf(yr) !== -1; });
  if (!match) match = entries[0]; // fallback to most recent
  return (match && match[field] != null) ? match[field] : null;
}
function getSeasonERA(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].ERA != null ? entries[0].ERA : null;
}
function getSeasonIP(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].IP != null ? entries[0].IP : null;
}
function getSeasonWHIP(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].WHIP != null ? entries[0].WHIP : null;
}
function getSeasonHR(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].HR != null ? entries[0].HR : null;
}
function getSeasonRBI(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].RBI != null ? entries[0].RBI : null;
}
function getSeasonAVG(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].AVG != null ? entries[0].AVG : null;
}
function getSeasonOBP(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].OBP != null ? entries[0].OBP : null;
}
function getSeasonSLG(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].SLG != null ? entries[0].SLG : null;
}
function getSeasonOPS(name) {
  var yr = _activeSeason.replace('year:','');
  var entries = (DATA.iblHistory[name] || []).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(yr) !== -1; });
  return entries.length && entries[0].OPS != null ? entries[0].OPS : null;
}
function getPitcherDataRow(name) {
  return DATA.pitchers.find(function(p) { return p.pitcher === name; }) || null;
}
function getPitcherScatterHits(name, row) {
  var k = normPlayerName(name);
  var h = 0;
  if (row && row.scatter && row.scatter.length) {
    row.scatter.forEach(function(s) {
      if (['Single','Double','Triple','Home Run'].includes(s.outcome)) h++;
    });
    return h;
  }
  DATA.pitches.forEach(function(bp) {
    (bp.scatter || []).forEach(function(s) {
      if (normPlayerName(s.pitcher) === k && ['Single','Double','Triple','Home Run'].includes(s.outcome)) h++;
    });
  });
  return h;
}
function getPitcherWhipFromData(name) {
  var pd = getPitcherDataRow(name);
  if (pd && pd.WHIP != null && !isNaN(pd.WHIP)) return pd.WHIP;
  var ip = pd && pd.IP != null ? parseFloat(pd.IP) : null;
  if (!(ip > 0)) return null;
  var bb = pd && pd.BB != null ? Number(pd.BB) : 0;
  // Prefer H_allowed from pitchers2026 (counts all hits, not just x/y ones)
  var h  = pd && pd.H_allowed != null ? Number(pd.H_allowed) : null;
  if (h === null) h = pd && pd.H != null ? Number(pd.H) : null;
  if (h === null) h = getPitcherScatterHits(name, pd);
  return (bb + h) / ip;
}
function getPitchPlayer(name) {
  var k = normPlayerName(name);
  return DATA.pitches.find(function(p) { return normPlayerName(p.batter) === k; }) || null;
}
function getSummaryPlayer(name) {
  return DATA.summary.find(function(p) { return p.batter === name; }) || null;
}
function getPitcherScatter(name) {
  var pts = [];
  var k = normPlayerName(name);
  DATA.pitches.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === k) pts.push(s); });
  });
  return pts;
}
function getAllBatters() {
  function normName(n) { return (n || '').replace(/\s+/g, ' ').trim(); }
  var canonical = {};
  function addName(raw) {
    var n = normName(raw);
    if (!n) return;
    var key = n.toLowerCase();
    if (!canonical[key]) canonical[key] = n;
  }

  DATA.summary.forEach(function(p) { addName(p.batter); });
  DATA.pitches.forEach(function(p) { addName(p.batter); });
  DATA.pbpBatters.forEach(function(p) { addName(p.batter); });
  if (_activeSeason !== 'year:2026') {
    // Include anyone with IBL history in 2025 who has AB > 0 (batter)
    Object.keys(DATA.iblHistory).forEach(function(name) {
      var seasons = DATA.iblHistory[name];
      var has2025 = seasons.some(function(s) { return (s.season||'').indexOf('2025') !== -1 && (s.AB||0) > 0; });
      if (has2025) addName(name);
    });
  }
  return Object.values(canonical).sort(function(a,b){ return a.localeCompare(b); });
}

function getAllPitchers() {
  // Normalise helper — trim + collapse internal whitespace to prevent duplicates
  // caused by a trailing space or double-space in one data source vs another.
  function normName(n) { return (n || '').replace(/\s+/g, ' ').trim(); }

  // Use a canonical-name map so we always keep the cleanest form of each name.
  var canonical = {};  // lower -> display
  function addName(raw) {
    var n = normName(raw);
    if (!n) return;
    var key = n.toLowerCase();
    if (!canonical[key]) canonical[key] = n;
  }

  DATA.pitchers.forEach(function(p) { addName(p.pitcher); });
  DATA.pitches.forEach(function(p) {
    if (p.scatter) p.scatter.forEach(function(s) { addName(s.pitcher); });
  });
  DATA.pbpPitchers.forEach(function(p) { addName(p.pitcher); });

  if (_activeSeason !== 'year:2026') {
    // Include IBL history 2025 pitchers only if they also have DataDiamond pitch data.
    // This prevents IBL-only names from appearing with no stats.
    Object.keys(DATA.iblHistory).forEach(function(name) {
      var seasons = DATA.iblHistory[name];
      var has2025 = seasons.some(function(s) { return (s.season||'').indexOf('2025') !== -1 && (s.IP||0) > 0; });
      if (!has2025) return;
      var nLow = normName(name).toLowerCase();
      var hasDD = Object.keys(canonical).some(function(k){ return k === nLow; });
      if (hasDD) addName(name);
    });
  }

  return Object.values(canonical).sort(function(a,b){ return a.localeCompare(b); });
}

// ── TICKER ────────────────────────────────────────
function makeRosterBatterRecord2025(name, teamName) {
  // Use year-fixed 2025 stores — DATA.pbpBatters/summary/pitches swap with season selection
  var pbpBatters25 = DATA._pbpBatters25 || [];
  var summary25    = DATA._summary25    || [];
  var pitches25    = DATA._pitches25    || [];
  var pbp   = findByPlayerName(pbpBatters25, 'batter', name);
  var sum   = findByPlayerName(summary25,    'batter', name);
  var ibl   = getIblSeasonForPlayer(name, '2025', function(s) { return s.pos !== 'P' && ((s.AB || 0) > 0 || (s.PA || 0) > 0); });
  var pitch = pitches25.find(function(bp) { return normPlayerName(bp.batter) === normPlayerName(name) && bp.scatter && bp.scatter.length; });
  var hasBatterData = !!(pbp || sum || ibl || pitch);
  if (!hasBatterData && playerHasSeasonData(name, 'pitcher', '2025')) return null;
  return Object.assign({}, ibl || {}, sum || {}, pbp || {}, { batter: name, batter_team: teamName });
}

function makeRosterPitcherName2025(name) {
  return playerHasSeasonData(name, 'pitcher', '2025') ? name : null;
}

function getActiveBatterRecords2025(teamId) {
  return getActiveRosterRows2025(teamId).map(function(row) {
    return makeRosterBatterRecord2025(row.player, row.team);
  }).filter(Boolean).sort(function(a, b) { return a.batter.localeCompare(b.batter); });
}

function getActivePitcherNames2025(teamId) {
  var seen = {};
  return getActiveRosterRows2025(teamId).map(function(row) {
    return makeRosterPitcherName2025(row.player);
  }).filter(Boolean).filter(function(name) {
    var k = normPlayerName(name);
    if (seen[k]) return false;
    seen[k] = true;
    return true;
  }).sort(function(a, b) { return a.localeCompare(b); });
}

function getInferredBatterRecords2025(teamId) {
  // Use year-fixed 2025 stores — DATA.pbpBatters/summary/pitches swap with season selection
  var pbpBatters25 = DATA._pbpBatters25 || [];
  var summary25    = DATA._summary25    || [];
  var pitches25    = DATA._pitches25    || [];
  var seen = {};
  var players = [];
  function add(row, rawTeam) {
    var name = canonicalPlayerName(row.batter);
    if (!name) return;
    var key = normPlayerName(name);
    if (seen[key] || isOnActiveRoster2025(name)) return;
    var team = resolveTeam(rawTeam || row.batter_team || row.team);
    if (teamId && !(team && team.id === teamId)) return;
    seen[key] = true;
    players.push(Object.assign({}, row, { batter: name, batter_team: rawTeam || row.batter_team || row.team }));
  }
  (pbpBatters25.length ? pbpBatters25 : summary25).forEach(function(p) { add(p, p.batter_team || p.team); });
  Object.keys(DATA.iblHistory).forEach(function(name) {
    var s2025 = getIblSeasonForPlayer(name, '2025', function(s) { return s.pos !== 'P' && ((s.AB || 0) > 0 || (s.PA || 0) > 0); });
    if (s2025) add(Object.assign({ batter: name }, s2025), s2025.team);
  });
  pitches25.forEach(function(bp) {
    if (!bp.batter) return;
    var hit = (bp.scatter || []).find(function(s) { return s.batter_team; });
    add({ batter: bp.batter }, bp.batter_team || bp.team || (hit && hit.batter_team));
  });
  return players.sort(function(a, b) { return a.batter.localeCompare(b.batter); });
}

function getInferredPitcherNames2025(teamId) {
  // Use year-fixed 2025 stores — DATA.pbpPitchers/pitches swap with season selection
  var pbpPitchers25 = DATA._pbpPitchers25 || [];
  var pitches25     = DATA._pitches25     || [];
  var seen = {};
  function add(raw, rawTeam) {
    var name = canonicalPlayerName(raw);
    if (!name || isOnActiveRoster2025(name)) return;
    var team = resolveTeam(rawTeam);
    if (teamId && !(team && team.id === teamId)) return;
    seen[normPlayerName(name)] = name;
  }
  pbpPitchers25.forEach(function(p) { add(p.pitcher, p.pitcher_team); });
  pitches25.forEach(function(bp) {
    (bp.scatter || []).forEach(function(s) { add(s.pitcher, s.pitcher_team); });
  });
  Object.keys(DATA.iblHistory).forEach(function(name) {
    var s2025 = getIblSeasonForPlayer(name, '2025', function(s) { return s.pos === 'P' || (s.IP || 0) > 0; });
    if (s2025 && playerHasSeasonData(name, 'pitcher', '2025')) add(name, s2025.team);
  });
  return Object.values(seen).sort(function(a, b) { return a.localeCompare(b); });
}

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
        navigate('players.html?player=' + encodeURIComponent(el.dataset.name) + '&type=' + el.dataset.type + '&season=' + _activeSeason.replace('year:', ''));
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
    // Use same roster as players page for accurate count
    const playerCount = getTeamBatters(team.id).length + getTeamPitchers(team.id).length;
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
    card.addEventListener('click', function() { navigate('league.html?team=' + team.id); });
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
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=batter&season=' + _activeSeason.replace('year:', ''));
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
        navigate('players.html?player=' + encodeURIComponent(row.dataset.name) + '&type=pitcher&season=' + _activeSeason.replace('year:', ''));
      });
    });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ══════════════════════════════════════════════════
// TEAMS PAGE
// ══════════════════════════════════════════════════
// ── Shared team roster helpers (match players page exactly) ────────────────
function getTeamBatters(teamId) {
  if (_activeSeason === 'year:2025') {
    return getActiveBatterRecords2025(teamId).concat(getInferredBatterRecords2025(teamId)).map(function(p) {
      return { batter: p.batter, pbp: p, summary: p, ibl: getIblSeasonForPlayer(p.batter, '2025') };
    });
  }
  var seen = new Set();
  var result = [];
  // Primary: pbpBatters AB>=5 with matching team
  var base = DATA.pbpBatters.length
    ? DATA.pbpBatters.filter(function(p){ return p.AB >= 5; })
    : DATA.summary.filter(function(p){ return p.AB > 0; });
  base.forEach(function(p) {
    var t = resolveTeam(p.batter_team || p.team);
    if (t && t.id === teamId && !seen.has(p.batter)) {
      seen.add(p.batter);
      var sum = DATA.summary.find(function(s){ return s.batter === p.batter; }) || p;
      result.push({ batter: p.batter, pbp: p, summary: sum });
    }
  });
  // Supplement: DATA.pitches top-level batter field (same as getAllBatters)
  DATA.pitches.forEach(function(bp) {
    if (!bp.batter || seen.has(bp.batter)) return;
    var t = resolveTeam(bp.team);
    if (t && t.id === teamId) {
      seen.add(bp.batter);
      var sum = DATA.summary.find(function(sm){ return sm.batter === bp.batter; }) || { batter: bp.batter };
      result.push({ batter: bp.batter, pbp: null, summary: sum });
    }
  });
  result.sort(function(a,b){ return a.batter.localeCompare(b.batter); });
  return result;
}

function getTeamPitchers(teamId) {
  if (_activeSeason === 'year:2025') {
    return getActivePitcherNames2025(teamId).concat(getInferredPitcherNames2025(teamId)).map(function(name) {
      var pd = findByPlayerName(DATA.pitchers, 'pitcher', name) || {};
      var pbp = findByPlayerName(DATA.pbpPitchers, 'pitcher', name);
      return { pitcher: name, pbp: pbp, pd: pd };
    });
  }
  var seen = new Set();
  var result = [];
  // Primary: pbpPitchers BF>=5 with matching team
  if (DATA.pbpPitchers && DATA.pbpPitchers.length) {
    DATA.pbpPitchers.filter(function(p){ return p.BF >= 5; }).forEach(function(p) {
      var t = resolveTeam(p.pitcher_team);
      if (t && t.id === teamId && !seen.has(p.pitcher)) {
        seen.add(p.pitcher);
        var pd = DATA.pitchers.find(function(d){ return d.pitcher === p.pitcher; }) || {};
        result.push({ pitcher: p.pitcher, pbp: p, pd: pd });
      }
    });
  }
  // Supplement: scatter-only pitchers
  DATA.pitches.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) {
      if (!s.pitcher || seen.has(s.pitcher)) return;
      var pt = resolveTeam(s.pitcher_team);
      if (pt && pt.id === teamId) seen.add(s.pitcher);
    });
  });
  seen.forEach(function(name) {
    if (result.some(function(r){ return r.pitcher === name; })) return;
    var pd = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
    result.push({ pitcher: name, pbp: null, pd: pd });
  });
  result.sort(function(a,b){ return a.pitcher.localeCompare(b.pitcher); });
  return result;
}

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

  // ── COLUMN DEFINITIONS ─────────────────────────────────────────────────────
  // Every stat derivable from datadiamond2026 sources:
  //   pitchers2026: pitcher, pitcher_team, IP, total_pitches,
  //                 K_pct, BB_pct, STR_pct, EA_pct, K_BB, Early_pct, Ahead_pct,
  //                 WHIFF_pct, SWING_pct, GB_pct, FB_pct, LO_pct, PO_pct,
  //                 FP_STR_pct, PUTAWAY_pct, BA_against, BABIP, BF
  //   pitches2026 scatter: BB+H counts → WHIP; Ks, outs → computed fields
  //   summary2026: batter, batter_team, AB, H, AVG, OBP, SLG, OPS, HR, BB, K,
  //                2B, 3B, HBP, SF, PA, R, SB, CS, ISO, BABIP, BB_K, wOBA

  var pct1 = function(v){ return v != null ? fmt1(v)+'%' : '—'; };
  var pct1raw = function(v){ return v != null ? parseFloat(v).toFixed(1) : ''; };

  // Raw (unformatted) extractors for CSV — parallel to fmt functions
  function rawV(v, decimals) {
    if (v == null || isNaN(parseFloat(v))) return '';
    return decimals != null ? parseFloat(v).toFixed(decimals) : String(v);
  }
  function rawIP(v) {
    if (v == null || isNaN(v)) return '';
    var totalOuts = Math.round(parseFloat(v) * 3);
    return Math.floor(totalOuts/3) + '.' + (totalOuts%3);
  }

  // ── PITCHER COLUMNS ─────────────────────────────────────────────────────────
  var PITCH_COLS = [
    // Identity
    { key:'pitcher',      label:'Pitcher',   group:'Identity',  align:'left',  fmt:null,          raw:function(r){ return r.pitcher||''; },                        desc:false, link:true  },
    { key:'_team',        label:'Team',      group:'Identity',  align:'left',  fmt:null,          raw:function(r){ return r._team||''; },                          desc:false             },
    // Workload
    { key:'total_pitches',label:'Pitches',   group:'Workload',  align:'right', fmt:fmtN,          raw:function(r){ return rawV(r.total_pitches,0); },              desc:true              },
    { key:'BF',           label:'BF',        group:'Workload',  align:'right', fmt:fmtN,          raw:function(r){ return rawV(r.BF,0); },                         desc:true              },
    { key:'IP',           label:'IP',        group:'Workload',  align:'right', fmt:fmtIP,         raw:function(r){ return rawIP(r.IP); },                          desc:true              },
    // Results
    { key:'WHIP',         label:'WHIP',      group:'Results',   align:'right', fmt:fmt2,          raw:function(r){ return rawV(r.WHIP,2); },                       desc:false             },
    { key:'ERA',          label:'ERA',       group:'Results',   align:'right', fmt:fmt2,          raw:function(r){ return rawV(r.ERA,2); },                         desc:false             },
    { key:'BAA',          label:'BAA',       group:'Results',   align:'right', fmt:fmt3,          raw:function(r){ return rawV(r.BAA,3); },                        desc:false             },
    { key:'BABIP',        label:'BABIP',     group:'Results',   align:'right', fmt:fmt3,          raw:function(r){ return rawV(r.BABIP,3); },                      desc:false             },
    // Command
    { key:'FPS_pct',      label:'FPS%',      group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.FPS_pct); },                   desc:true              },
    { key:'Early_pct',    label:'EARLY%',    group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.Early_pct); },                 desc:true              },
    { key:'Ahead_pct',    label:'AHEAD%',    group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.Ahead_pct); },                 desc:true              },
    { key:'EA_pct',       label:'E+A%',      group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.EA_pct); },                    desc:true              },
    { key:'STR_pct',      label:'STR%',      group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.STR_pct); },                   desc:true              },
    { key:'BB_pct',       label:'BB%',       group:'Command',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.BB_pct); },                    desc:false             },
    // Swing / Whiff
    { key:'K_pct',        label:'K%',        group:'SwingWhiff',align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.K_pct); },                     desc:true              },
    { key:'K_BB',         label:'K/BB',      group:'SwingWhiff',align:'right', fmt:fmt2,          raw:function(r){ return rawV(r.K_BB,2); },                       desc:true              },
    { key:'Swing_pct',    label:'SWING%',    group:'SwingWhiff',align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.Swing_pct); },                 desc:true              },
    { key:'Whiff_pct',    label:'WHIFF%',    group:'SwingWhiff',align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.Whiff_pct); },                 desc:true              },
    { key:'Putaway_pct',  label:'PUTAWAY%',  group:'SwingWhiff',align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.Putaway_pct); },               desc:true              },
    // Contact Type
    { key:'GB_pct',       label:'GB%',       group:'Contact',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.GB_pct); },                    desc:true              },
    { key:'FB_pct',       label:'FB%',       group:'Contact',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.FB_pct); },                    desc:false             },
    { key:'LD_pct',       label:'LD%',       group:'Contact',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.LD_pct); },                    desc:true              },
    { key:'PO_pct',       label:'PU%',       group:'Contact',   align:'right', fmt:pct1,          raw:function(r){ return pct1raw(r.PO_pct); },                    desc:false             }
  ];

  // ── BATTER COLUMNS ──────────────────────────────────────────────────────────
  var HIT_COLS = [
    // Identity
    { key:'batter',  label:'Batter',  group:'Identity', align:'left',  fmt:null,   raw:function(r){ return r.batter||''; },              desc:false, link:true  },
    { key:'_team',   label:'Team',    group:'Identity', align:'left',  fmt:null,   raw:function(r){ return r._team||''; },               desc:false             },
    // Counting
    { key:'PA',      label:'PA',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.PA,0); },              desc:true              },
    { key:'AB',      label:'AB',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.AB,0); },              desc:true              },
    { key:'H',       label:'H',       group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.H,0); },               desc:true              },
    { key:'2B',      label:'2B',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r['2B'],0); },           desc:true              },
    { key:'3B',      label:'3B',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r['3B'],0); },           desc:true              },
    { key:'HR',      label:'HR',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.HR,0); },              desc:true              },
    { key:'RBI',     label:'RBI',     group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.RBI,0); },             desc:true              },
    { key:'BB',      label:'BB',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.BB,0); },              desc:true              },
    { key:'K',       label:'K',       group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.K,0); },               desc:false             },
    { key:'HBP',     label:'HBP',     group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.HBP,0); },             desc:true              },
    { key:'SF',      label:'SF',      group:'Counting', align:'right', fmt:fmtN,   raw:function(r){ return rawV(r.SF,0); },              desc:true              },
    // Rate
    { key:'AVG',     label:'AVG',     group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.AVG,3); },             desc:true              },
    { key:'OBP',     label:'OBP',     group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.OBP,3); },             desc:true              },
    { key:'SLG',     label:'SLG',     group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.SLG,3); },             desc:true              },
    { key:'OPS',     label:'OPS',     group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.OPS,3); },             desc:true              },
    { key:'_babip',  label:'BABIP',   group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r._babip,3); },          desc:true              },
    { key:'ISO',     label:'ISO',     group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.ISO,3); },              desc:true              },
    { key:'wOBA',    label:'wOBA',    group:'Rate',     align:'right', fmt:fmt3,   raw:function(r){ return rawV(r.wOBA,3); },             desc:true              },
    // Discipline
    { key:'_kpct',   label:'K%',      group:'Discipline',align:'right',fmt:pct1,   raw:function(r){ var p=r.PA||r.AB; return p>0?pct1raw((r.K||0)/p*100):''; }, desc:false },
    { key:'_bbpct',  label:'BB%',     group:'Discipline',align:'right',fmt:pct1,   raw:function(r){ var p=r.PA||r.AB; return p>0?pct1raw((r.BB||0)/p*100):''; }, desc:true  }
  ];

  // ── GROUP LABELS (for filter UI) ────────────────────────────────────────────
  var PITCH_GROUPS = ['Identity','Workload','Results','Command','SwingWhiff','Contact'];
  var HIT_GROUPS   = ['Identity','Counting','Rate','Discipline'];

  // ── PAGE HTML ───────────────────────────────────────────────────────────────
  content.innerHTML =
    '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League · 2026</p>' +
    '<h1 class="hero-title">LEAGUE<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +

    // Tabs
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-ltab="pitching">Pitching</button>' +
    '<button class="tab-btn" data-ltab="hitting">Hitting</button>' +
    '</div></div>' +

    // Filter panel
    '<div id="ls-filter-panel" style="margin:18px 0 0;background:rgba(255,255,255,0.025);' +
      'border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:18px 20px">' +

      // Row 1: search + team + min AB/IP + export
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px">' +
        '<input id="ls-search" placeholder="Search player…" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;font-size:12px;font-family:var(--font-mono);padding:6px 11px;outline:none;width:160px"/>' +
        '<select id="ls-team" style="background:#0e1525;border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:rgba(255,255,255,0.7);font-size:12px;font-family:var(--font-mono);padding:6px 10px;cursor:pointer;outline:none">' +
          '<option value="">All Teams</option>' +
          TEAMS.map(function(t){ return '<option value="'+t.id+'">'+t.abbreviation+' – '+t.name+'</option>'; }).join('') +
        '</select>' +
        '<label style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.4);display:flex;align-items:center;gap:6px;white-space:nowrap">' +
          '<span id="ls-min-label">Min IP</span>' +
          '<input id="ls-min" type="number" min="0" value="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:4px;color:#fff;font-size:12px;font-family:var(--font-mono);padding:5px 8px;outline:none;width:60px"/>' +
        '</label>' +
        '<span id="ls-row-count" style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.3);margin-left:auto;white-space:nowrap"></span>' +
        '<button id="ls-export" style="background:rgba(255,184,28,0.1);border:1px solid rgba(255,184,28,0.35);color:#FFB81C;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;padding:6px 14px;border-radius:4px;cursor:pointer;white-space:nowrap;transition:background .15s">⬇ CSV</button>' +
      '</div>' +

      // Row 2: column group toggles
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.25);text-transform:uppercase;white-space:nowrap;margin-right:4px">Columns</span>' +
        '<div id="ls-group-btns" style="display:flex;gap:6px;flex-wrap:wrap"></div>' +
      '</div>' +
    '</div>' +

    // Table
    '<div id="ls-table-wrap" style="margin-top:14px"></div>' +
    '</div>';

  // ── STATE ────────────────────────────────────────────────────────────────────
  var _lsTab      = 'pitching';
  var _lsSearch   = '';
  var _lsTeam     = '';
  var _lsMin      = 0;           // min IP (pitching) or min AB (hitting)
  var _lsSortCol  = -1;
  var _lsSortAsc  = true;
  // Which column groups are visible; start with a sensible default set
  var _visGroups  = {
    pitching: { Identity:true, Workload:true, Results:true, Command:true, SwingWhiff:true, Contact:false },
    hitting:  { Identity:true, Counting:true, Rate:true, Discipline:false }
  };

  // ── COMPUTED FIELDS on batter rows ──────────────────────────────────────────
  function enrichBatter(p) {
    var pa = p.PA || (p.AB + (p.BB||0) + (p.HBP||0) + (p.SF||0)) || 0;
    // BABIP: prefer JSON value (from R), fall back to computed
    var babip = p.BABIP != null ? p.BABIP : (function() {
      var num = (p.H||0) - (p.HR||0);
      var den = (p.AB||0) - (p.K||0) - (p.HR||0) + (p.SF||0);
      return den > 0 ? num / den : null;
    })();
    return Object.assign({}, p, {
      _kpct:  pa > 0 ? (p.K||0)  / pa * 100 : null,
      _bbpct: pa > 0 ? (p.BB||0) / pa * 100 : null,
      _babip: babip,
      PA: p.PA || pa
    });
  }

  // ── BUILD ROW DATA ───────────────────────────────────────────────────────────
  function buildPitcherRows() {
    // Pre-compute per-pitcher stats from pitches2026 scatter
    var scMap = {};
    DATA.pitches2026.forEach(function(bp) {
      (bp.scatter || []).forEach(function(s) {
        if (!s.pitcher) return;
        if (!scMap[s.pitcher]) scMap[s.pitcher] = { bb:0, h:0, tot:0, swings:0, whiffs:0, outs:0, gb:0, fb:0, ld:0, po:0 };
        var m = scMap[s.pitcher];
        m.tot++;
        var o = s.outcome || '';
        // WHIP components
        if (o === 'Walk' || o === 'Intentional Walk') m.bb++;
        if (['Single','Double','Triple','Home Run'].includes(o)) m.h++;
        // Swing/Whiff
        var isInPlay = ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(o);
        var isSwing  = isInPlay || o === 'Swinging Strike' || o === 'Foul' || o === 'Strikeout Swinging';
        if (isSwing) m.swings++;
        if (o === 'Swinging Strike' || o === 'Strikeout Swinging') m.whiffs++;
        // Two-strike putaway: Strikeout Swinging on 2-strike counts (approximate via outcome)
        if (o === 'Strikeout Swinging' || o === 'Strikeout Looking') m.outs++;
        // Contact type (batted balls)
        if (isInPlay) {
          var c = s.contact || '';
          if      (c === 'Ground Ball' || o === 'Groundout' || o === 'Double Play') m.gb++;
          else if (c === 'Fly Ball'    || o === 'Flyout'    || o === 'Home Run' || o === 'Sacrifice Fly') m.fb++;
          else if (c === 'Line Drive'  || o === 'Lineout')  m.ld++;
          else if (c === 'Pop Up'      || o === 'Popout')   m.po++;
          else if (c === 'Ground Ball') m.gb++;
        }
      });
    });
    return DATA.pitchers2026.filter(function(pd){ return pd.pitcher !== 'Pitcher'; }).map(function(pd) {
      var teamObj = resolveTeam(pd.pitcher_team || pd.team);
      var m = scMap[pd.pitcher] || {};
      // Use pd.H_allowed (from R script) if available — scatter misses hits on no-x/y pitches.
      // Fall back to scatter hits when H_allowed absent. Show null if neither available.
      var _whipH  = pd.H_allowed != null ? pd.H_allowed : (m.tot ? m.h : null);
      var _whipBB = pd.BB        != null ? pd.BB        : (m.tot ? m.bb : 0);
      var whip    = (pd.IP > 0 && _whipH !== null) ? (_whipBB + _whipH) / pd.IP : null;
      var swingPct = m.tot   > 0 ? m.swings / m.tot   * 100 : null;
      var whiffPct = m.swings > 0 ? m.whiffs / m.swings * 100 : null;
      var bip     = m.gb + m.fb + m.ld + m.po;
      var gbPct   = bip > 0 ? m.gb / bip * 100 : null;
      var fbPct   = bip > 0 ? m.fb / bip * 100 : null;
      var ldPct   = bip > 0 ? m.ld / bip * 100 : null;
      var poPct   = bip > 0 ? m.po / bip * 100 : null;
      // Putaway%: Ks as % of total pitches (proxy for two-strike dominance)
      var putawayPct = m.tot > 0 ? m.outs / m.tot * 100 : null;
      // ERA from iblHistory Summer 2026 entry (IP > 0, season contains '2026')
      var iblEntry = (DATA.iblHistory[pd.pitcher] || []).find(function(s) {
        return s.IP > 0 && (s.season || '').indexOf('2026') !== -1;
      });
      var era = iblEntry && iblEntry.ERA != null ? iblEntry.ERA : null;
      return Object.assign({}, pd, {
        WHIP:    whip,
        ERA:     era,
        _team:   teamObj ? teamObj.abbreviation : '—',
        _teamId: teamObj ? teamObj.id           : null
      });
    });
  }

  function buildHitterRows() {
    return DATA.summary2026.filter(function(p){ return p.AB > 0 && p.batter !== 'Batter'; }).map(function(p) {
      var teamObj = resolveTeam(p.batter_team || p.team);
      var r = enrichBatter(p);
      r._team   = teamObj ? teamObj.abbreviation : '—';
      r._teamId = teamObj ? teamObj.id           : null;
      // RBI from iblHistory Summer 2026 entry (AB > 0, season contains '2026')
      var iblEntry = (DATA.iblHistory[p.batter] || []).find(function(s) {
        return s.AB > 0 && (s.season || '').indexOf('2026') !== -1;
      });
      r.RBI = iblEntry && iblEntry.RBI != null ? iblEntry.RBI : null;
      return r;
    });
  }

  // ── VISIBLE COLS FOR CURRENT TAB ─────────────────────────────────────────────
  function visibleCols() {
    var allCols   = _lsTab === 'pitching' ? PITCH_COLS : HIT_COLS;
    var groupVis  = _visGroups[_lsTab];
    return allCols.filter(function(c){ return groupVis[c.group]; });
  }

  // ── RENDER GROUP BUTTONS ─────────────────────────────────────────────────────
  function renderGroupBtns() {
    var groups    = _lsTab === 'pitching' ? PITCH_GROUPS : HIT_GROUPS;
    var groupVis  = _visGroups[_lsTab];
    var groupLabels = {
      Identity:'Identity', Workload:'Workload', Results:'Results',
      Command:'Command', SwingWhiff:'Swing/Whiff', Contact:'Contact Type',
      Counting:'Counting', Rate:'Rate', Discipline:'Discipline'
    };
    var container = document.getElementById('ls-group-btns');
    if (!container) return;
    container.innerHTML = groups.map(function(g) {
      var on = groupVis[g];
      return '<button data-grp="'+g+'" style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.07em;' +
        'padding:4px 12px;border-radius:4px;cursor:pointer;transition:all .15s;' +
        'border:1px solid '+(on?'#FFB81C':'rgba(255,255,255,0.12)')+';' +
        'background:'+(on?'rgba(255,184,28,0.12)':'rgba(255,255,255,0.03)')+';' +
        'color:'+(on?'#FFB81C':'rgba(255,255,255,0.35)')+'">'+groupLabels[g]+'</button>';
    }).join('');
    container.querySelectorAll('[data-grp]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var g = btn.dataset.grp;
        // Always keep Identity visible
        if (g === 'Identity') return;
        _visGroups[_lsTab][g] = !_visGroups[_lsTab][g];
        // Reset sort if sorted col is now hidden
        var cols = visibleCols();
        if (_lsSortCol >= cols.length) { _lsSortCol = -1; }
        renderGroupBtns();
        renderTable();
      });
    });
  }

  // ── MAIN RENDER ──────────────────────────────────────────────────────────────
  function renderTable() {
    var cols    = visibleCols();
    var nameKey = _lsTab === 'pitching' ? 'pitcher' : 'batter';
    var type    = _lsTab === 'pitching' ? 'pitcher'  : 'batter';
    var minKey  = _lsTab === 'pitching' ? 'IP'       : 'AB';
    var rows    = _lsTab === 'pitching' ? buildPitcherRows() : buildHitterRows();

    // Filter
    var filtered = rows.filter(function(r) {
      if (_lsSearch && !(r[nameKey]||'').toLowerCase().includes(_lsSearch)) return false;
      if (_lsTeam   && r._teamId !== _lsTeam) return false;
      var minVal = parseFloat(r[minKey]);
      if (_lsMin > 0 && (isNaN(minVal) || minVal < _lsMin)) return false;
      return true;
    });

    // Sort
    if (_lsSortCol >= 0 && _lsSortCol < cols.length) {
      var scol = cols[_lsSortCol];
      var asc  = _lsSortAsc;
      filtered.sort(function(a, b) {
        var av = a[scol.key], bv = b[scol.key];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        var an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
        return asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }

    // Row count
    var countEl = document.getElementById('ls-row-count');
    if (countEl) countEl.textContent = filtered.length + ' players';

    // Update min label
    var minLbl = document.getElementById('ls-min-label');
    if (minLbl) minLbl.textContent = _lsTab === 'pitching' ? 'Min IP' : 'Min AB';

    // thead — group headers
    var groupSpans = {};
    cols.forEach(function(c){
      groupSpans[c.group] = (groupSpans[c.group]||0) + 1;
    });
    var seenGroups = {};
    var thGroupRow = '<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">' +
      cols.map(function(c) {
        if (seenGroups[c.group]) return '';
        seenGroups[c.group] = true;
        var groupLabels = {
          Identity:'', Workload:'Workload', Results:'Results',
          Command:'Command', SwingWhiff:'Swing / Whiff', Contact:'Contact Type',
          Counting:'Counting', Rate:'Rate Stats', Discipline:'Discipline'
        };
        return '<th colspan="'+groupSpans[c.group]+'" style="text-align:center;' +
          'font-family:var(--font-mono);font-size:9px;letter-spacing:0.12em;text-transform:uppercase;' +
          'color:rgba(255,255,255,0.2);padding:6px 4px 3px;border-right:1px solid rgba(255,255,255,0.06)">'+
          groupLabels[c.group]+'</th>';
      }).join('') + '</tr>';

    var thHTML = '<tr style="border-bottom:2px solid rgba(255,255,255,0.1)">' +
      cols.map(function(col, i) {
        var arrow = (_lsSortCol === i) ? (_lsSortAsc ? ' ▲' : ' ▼') : '';
        return '<th style="text-align:'+col.align+';white-space:nowrap;cursor:pointer;' +
          'padding:8px 10px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.08em;' +
          'color:'+(_lsSortCol===i?'#FFB81C':'rgba(255,255,255,0.45)')+';' +
          'border-bottom:1px solid rgba(255,255,255,0.06);user-select:none;' +
          'border-right:1px solid rgba(255,255,255,0.03)" data-ci="'+i+'">'+
          col.label+arrow+'</th>';
      }).join('') + '</tr>';

    // tbody
    var tbHTML = filtered.map(function(r) {
      return '<tr style="border-bottom:1px solid rgba(255,255,255,0.035);transition:background .12s" ' +
        'onmouseover="this.style.background=\'rgba(255,255,255,0.03)\'" ' +
        'onmouseout="this.style.background=\'\'">' +
        cols.map(function(col) {
          var val  = r[col.key];
          var disp = (val == null) ? '—' : (col.fmt ? col.fmt(val) : String(val));
          var style = 'padding:8px 10px;font-family:var(--font-mono);font-size:11px;' +
            'text-align:'+col.align+';white-space:nowrap;' +
            'border-right:1px solid rgba(255,255,255,0.02);';
          if (col.link) {
            return '<td style="'+style+'position:sticky;left:0;background:#0e1525;z-index:2;min-width:130px;"><a class="ls-player-link" data-name="'+r[nameKey]+'" data-type="'+type+'" ' +
              'style="cursor:pointer;color:#fff;text-decoration:none;white-space:nowrap">'+disp+'</a></td>';
          }
          // Highlight key stats
          var isKey = (col.key==='AVG'||col.key==='OPS'||col.key==='ERA'||col.key==='WHIP'||col.key==='K_pct');
          return '<td style="'+style+'color:'+(isKey?'rgba(255,255,255,0.92)':'rgba(255,255,255,0.68)')+'">'+disp+'</td>';
        }).join('') + '</tr>';
    }).join('') ||
      '<tr><td colspan="'+cols.length+'" style="text-align:center;padding:48px;font-family:var(--font-mono);font-size:12px;color:rgba(255,255,255,0.2)">No results</td></tr>';

    var wrap = document.getElementById('ls-table-wrap');
    if (!wrap) return;
    wrap.innerHTML =
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;min-width:500px">' +
      '<thead>'+thGroupRow+thHTML+'</thead>' +
      '<tbody>'+tbHTML+'</tbody>' +
      '</table></div>';

    // Sort click
    wrap.querySelectorAll('th[data-ci]').forEach(function(th) {
      th.addEventListener('click', function() {
        var ci = parseInt(th.getAttribute('data-ci'));
        if (_lsSortCol === ci) { _lsSortAsc = !_lsSortAsc; }
        else { _lsSortCol = ci; _lsSortAsc = cols[ci].desc ? false : true; }
        renderTable();
      });
    });

    // Player links
    wrap.querySelectorAll('.ls-player-link').forEach(function(el) {
      var pName = el.dataset.name;
      var pType = el.dataset.type;
      var _s = DATA.summary2026.find(function(p){ return p.batter === pName; });
      var _p = DATA.pitchers2026.find(function(p){ return p.pitcher === pName; });
      var _t = _s ? (_s.batter_team||_s.team) : (_p ? (_p.pitcher_team||_p.team) : null);
      if (!ACCESS.canViewPlayer(pName, pType, _t)) {
        el.style.opacity='0.4'; el.style.cursor='not-allowed'; el.title='Access restricted';
        el.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); });
      } else {
        el.addEventListener('click', function() {
          navigate('players.html?player='+encodeURIComponent(pName)+'&type='+pType+'&season=2026');
        });
      }
    });

    // Stash filtered for CSV export
    _lastFiltered = filtered;
  }

  // ── CSV EXPORT ───────────────────────────────────────────────────────────────
  var _lastFiltered = [];

  function exportCSV() {
    var cols    = visibleCols();
    var nameKey = _lsTab === 'pitching' ? 'pitcher' : 'batter';
    var header  = cols.map(function(c){ return c.label; }).join(',');
    var rows    = _lastFiltered.map(function(r) {
      return cols.map(function(c) {
        var val = c.raw ? c.raw(r) : (r[c.key] != null ? String(r[c.key]) : '');
        // Escape commas / quotes
        if (val.indexOf(',') !== -1 || val.indexOf('"') !== -1) val = '"' + val.replace(/"/g,'""') + '"';
        return val;
      }).join(',');
    });
    var csv  = header + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type:'text/csv' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url;
    a.download = 'datadiamond_2026_' + _lsTab + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── WIRE CONTROLS ────────────────────────────────────────────────────────────
  // Tabs
  content.querySelectorAll('.tab-btn[data-ltab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      content.querySelectorAll('.tab-btn[data-ltab]').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      _lsTab = btn.dataset.ltab;
      _lsSortCol = -1; _lsSortAsc = true;
      _lsMin = 0;
      var minEl = document.getElementById('ls-min');
      if (minEl) minEl.value = 0;
      renderGroupBtns();
      renderTable();
    });
  });

  // Search
  var searchEl = document.getElementById('ls-search');
  if (searchEl) searchEl.addEventListener('input', function(){ _lsSearch = searchEl.value.toLowerCase().trim(); renderTable(); });

  // Team filter
  var teamEl = document.getElementById('ls-team');
  if (teamEl) teamEl.addEventListener('change', function(){ _lsTeam = teamEl.value; renderTable(); });

  // Min qualifier
  var minEl = document.getElementById('ls-min');
  if (minEl) minEl.addEventListener('input', function(){ _lsMin = parseFloat(minEl.value)||0; renderTable(); });

  // Export
  var exportBtn = document.getElementById('ls-export');
  if (exportBtn) exportBtn.addEventListener('click', exportCSV);

  // Initial render
  renderGroupBtns();
  _lsSortCol = 2; _lsSortAsc = false; // Pitches desc
  renderTable();
}

function renderTeamDetail(teamId, content) {
  const team = TEAMS.find(function(t) { return t.id === teamId; });
  if (!team) { content.innerHTML = '<div class="container"><div class="empty-state"><h3>Team not found</h3></div></div>'; return; }

  // Use same roster as players page
  const teamBattersRaw = getTeamBatters(teamId);
  const teamPitchersRaw = getTeamPitchers(teamId);
  // players array in summary shape for backward compat with buildHittingTable
  const players = teamBattersRaw.map(function(b){ return b.pbp || b.summary; }).filter(Boolean);
  // teamPitchers in pd shape for buildTeamPitcherTable (prefer pbp data)
  const teamPitchers = teamPitchersRaw.map(function(p){
    var src = p.pbp || p.pd || {};
    return Object.assign({ pitcher: p.pitcher }, p.pd || {}, p.pbp ? {
      K_pct:   p.pbp.K_pct,
      BB_pct:  p.pbp.BB_pct,
      STR_pct: p.pbp.STR_pct,
      EA_pct:  p.pbp.EA_pct,
      K_BB:    p.pbp.K_BB,
      IP:      p.pbp.IP || (p.pd||{}).IP,
      total_pitches: p.pbp.pitches || (p.pd||{}).total_pitches
    } : {});
  });

  content.innerHTML =
    '<section class="player-hero" style="position:relative;padding:48px 0 40px;overflow:hidden">' +
    '<div class="player-hero-bg" style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 20% 50%,' + hexToRgba(team.primaryColor, 0.15) + ' 0%,transparent 70%)"></div>' +
    '<div class="container">' +
    '<div class="breadcrumb"><a href="league.html">Teams</a><span>/</span><span>' + team.name + '</span></div>' +
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

      // Aggregate from same roster as players page (pbp preferred, summary fallback)
      var totAB=0,totH=0,tot2B=0,tot3B=0,totHR=0,totBB=0,totK=0,totHBP=0,totSF=0;
      teamBattersRaw.forEach(function(b) {
        var src = b.pbp || b.summary || {};
        totAB  += src.AB  || 0;
        totH   += src.H   || 0;
        tot2B  += src['2B'] || 0;
        tot3B  += src['3B'] || 0;
        totHR  += src.HR  || 0;
        totBB  += src.BB  || 0;
        totK   += src.K   || 0;
        totHBP += src.HBP || 0;
        totSF  += src.SF  || 0;
      });
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
        '<span class="stat-card-subtitle">' + teamBattersRaw.length + ' players · ' + totAB + ' AB</span></div>' +
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

      // Aggregate from same roster as players page (pbp preferred, pd fallback)
      var pitchWithData = teamPitchers.filter(function(p){ return p.K_pct != null || p.STR_pct != null; });
      const totPitches = teamPitchers.reduce(function(s,p){ return s+(p.total_pitches||0); },0);
      const totIP      = teamPitchers.reduce(function(s,p){ return s+(p.IP||0); },0);
      const avgSTR = pitchWithData.length > 0
        ? pitchWithData.reduce(function(s,p){ return s+(p.STR_pct||0); },0) / pitchWithData.length : null;
      const avgK   = pitchWithData.length > 0
        ? pitchWithData.reduce(function(s,p){ return s+(p.K_pct||0); },0) / pitchWithData.length : null;
      const avgBB  = pitchWithData.length > 0
        ? pitchWithData.reduce(function(s,p){ return s+(p.BB_pct||0); },0) / pitchWithData.length : null;
      const avgEA  = pitchWithData.length > 0
        ? pitchWithData.filter(function(p){ return p.EA_pct!=null; }).reduce(function(s,p){ return s+(p.EA_pct||0); },0) /
          (pitchWithData.filter(function(p){ return p.EA_pct!=null; }).length||1) : null;

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
    const team = resolveTeam(pd.pitcher_team);
    var teamDisplay = team ? team.abbreviation : (function() {
      var yr = _activeSeason.replace('year:', '');
      var iblS = (DATA.iblHistory[pd.pitcher] || []).find(function(s){ return (s.season||'').indexOf(yr)!==-1; });
      if (iblS && iblS.team) { var t2 = resolveTeam(iblS.team); return t2 ? t2.abbreviation : iblS.team; }
      return '—';
    })();
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + pd.pitcher + '" data-type="pitcher">' + pd.pitcher + '</a></td>' +
      '<td>' + teamDisplay + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Team</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

// ══════════════════════════════════════════════════
// PLAYERS PAGE
// ══════════════════════════════════════════════════
function initPlayersPage() {
  const params     = new URLSearchParams(window.location.search);
  const playerName = params.get('player');
  const playerType = params.get('type') || 'batter';
  const seasonParam = params.get('season');
  const content    = document.getElementById('page-content');
  if (seasonParam === '2026' || seasonParam === '2025') {
    swapSeasonData('year:' + seasonParam);
  }

  if (playerName) {
    var decodedName = decodeURIComponent(playerName);
    // Resolve team for access check
    var _sum = DATA.summary.find(function(p){ return p.batter === decodedName; });
    var _pit = DATA.pitchers.find(function(p){ return p.pitcher === decodedName; });
    var _teamName = _sum ? _sum.batter_team : (_pit ? (_pit.pitcher_team || _pit.team) : null);
    if (!_teamName) {
      // Try from scatter
      DATA.pitches.forEach(function(bp) {
        if (!bp.scatter) return;
        var hit = bp.scatter.find(function(s){ return (s.pitcher===decodedName||s.batter===decodedName); });
        if (hit && !_teamName) _teamName = hit.pitcher_team || hit.batter_team;
      });
    }
    if (!ACCESS.canViewPlayer(decodedName, playerType, _teamName)) {
      content.innerHTML = ACCESS.restrictedHTML(decodedName);
    } else {
      renderPlayerDetail(decodedName, playerType, content);
    }
  } else {
    renderPlayerList(content);
  }
}

function renderPlayerList(content) {
  content.innerHTML =
    '<section class="page-hero"><div class="hero-bg"></div><div class="container">' +
    '<p class="hero-eyebrow">Canadian Baseball League</p>' +
    '<h1 class="hero-title">PLAYER<br><span>STATS</span></h1></div></section>' +
    '<div class="container" style="padding-top:40px;padding-bottom:80px">' +
    '<div id="players-season-filter" style="display:flex;align-items:center;gap:10px;margin-bottom:18px">' +
    '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.35);text-transform:uppercase;white-space:nowrap">Season</span>' +
    '<div style="display:flex;gap:6px">' +
    '<button class="zone-filter-btn" data-season="year:2026">2026</button>' +
    '<button class="zone-filter-btn" data-season="year:2025">2025</button>' +
    '</div></div>' +
    '<div class="tabs-bar"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="batters">Batters</button>' +
    '<button class="tab-btn" data-tab="pitchers">Pitchers</button>' +
    '</div></div>' +
    '<div id="player-list-content"></div></div>';

  const listContent = document.getElementById('player-list-content');
  const tabs = content.querySelectorAll('.tab-btn');
  const seasonBtns = content.querySelectorAll('#players-season-filter [data-season]');
  var activeListTab = 'batters';

  function renderList(type) {
    activeListTab = type;
    tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === type); });
    seasonBtns.forEach(function(b) { b.classList.toggle('active', b.dataset.season === _activeSeason); });
    listContent.innerHTML = '';

    function applyRosterSearch(q, sourceInput) {
      q = (q || '').toLowerCase();
      listContent.querySelectorAll('.roster-search').forEach(function(input) {
        if (input !== sourceInput) input.value = q;
      });
      listContent.querySelectorAll('tbody tr').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    }

    if (type === 'batters') {
      function renderBatterCard(title, players, searchId) {
        const card = document.createElement('div');
        card.className = 'stat-card fade-up';
        card.style.marginTop = listContent.children.length ? '20px' : '';
        card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">'+title+'</span>' +
          '<span class="stat-card-subtitle">' + players.length + ' players</span></div>' +
          '<div style="padding:16px 24px 0">' +
          '<input class="roster-search" id="'+searchId+'" placeholder="Search batters..." /></div>' +
          buildHittingTable(players);
        listContent.appendChild(card);
        initTableSort(card.querySelector('table'));
        initPlayerLinks(card, 'batter');
        document.getElementById(searchId).addEventListener('input', function(e) {
          applyRosterSearch(e.target.value, e.target);
        });
      }

      if (_activeSeason === 'year:2025') {
        renderBatterCard('Active Roster Batters', getActiveBatterRecords2025(), 'player-search-active');
        var inactiveBatters = getInferredBatterRecords2025();
        if (inactiveBatters.length) renderBatterCard('Inactive Batters', inactiveBatters, 'player-search-inactive');
      } else {
        var players = DATA.pbpBatters.length
          ? DATA.pbpBatters.filter(function(p) { return p.AB >= 5; })
          : DATA.summary.filter(function(p) { return p.AB > 0; });
        players = players.map(function(p){ return Object.assign({}, p, { batter: (p.batter||'').trim() }); });
        var existingNames = new Set(players.map(function(p){ return (p.batter||'').toLowerCase(); }));
        DATA.pitches.forEach(function(bp) {
          var bname = (bp.batter||'').trim();
          if (!bname || existingNames.has(bname.toLowerCase())) return;
          existingNames.add(bname.toLowerCase());
          var sum = DATA.summary.find(function(s){ return (s.batter||'').trim() === bname; }) || { batter: bname };
          players = players.concat([Object.assign({}, sum, { batter: bname })]);
        });
        renderBatterCard('All Batters', players, 'player-search');
      }
    } else {
      function renderPitcherCard(title, names, searchId) {
        const card  = document.createElement('div');
        card.className = 'stat-card fade-up';
        card.style.marginTop = listContent.children.length ? '20px' : '';
        card.innerHTML = '<div class="stat-card-header"><span class="stat-card-title">'+title+'</span>' +
          '<span class="stat-card-subtitle">' + names.length + ' pitchers</span></div>' +
          '<div style="padding:16px 24px 0">' +
          '<input class="roster-search" id="'+searchId+'" placeholder="Search pitchers..." /></div>' +
          buildPitcherListTable(names);
        listContent.appendChild(card);
        initPlayerLinks(card, 'pitcher');
        document.getElementById(searchId).addEventListener('input', function(e) {
          applyRosterSearch(e.target.value, e.target);
        });
      }

      if (_activeSeason === 'year:2025') {
        renderPitcherCard('Active Roster Pitchers', getActivePitcherNames2025(), 'pitcher-search-active');
        var inactivePitchers = getInferredPitcherNames2025();
        if (inactivePitchers.length) renderPitcherCard('Inactive Pitchers', inactivePitchers, 'pitcher-search-inactive');
      } else {
        renderPitcherCard('All Pitchers', getAllPitchers(), 'pitcher-search');
      }
    }
  }

  tabs.forEach(function(t) { t.addEventListener('click', function() { renderList(t.dataset.tab); }); });
  seasonBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      swapSeasonData(btn.dataset.season);
      renderList(activeListTab);
    });
  });
  renderList('batters');
}

function renderPlayerDetail(name, type, content) {
  var requestedSeasonYear = _activeSeason.replace('year:', '');
  if (!playerHasSeasonData(name, type, requestedSeasonYear)) {
    content.innerHTML =
      '<div class="container" style="padding-top:80px;padding-bottom:80px">' +
      '<div class="empty-state"><div class="empty-state-icon">&#128202;</div>' +
      '<h3>No ' + requestedSeasonYear + ' data available</h3></div></div>';
    return;
  }
  const sum   = getSummaryPlayer(name);
  const pitch = getPitchPlayer(name);

  let pitchData = pitch;
  if (type === 'pitcher') {
    const pts = [];
    var _detailNameKey = normPlayerName(name);
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === _detailNameKey) pts.push(s); });
    });
    pitchData = pts.length ? { batter: name, scatter: pts } : null;
  }

  let team = sum ? resolveTeam(sum.batter_team) : null;
  if (!team && type === 'pitcher' && pitchData && pitchData.scatter && pitchData.scatter.length) {
    const pt = pitchData.scatter[0].pitcher_team;
    if (pt) team = resolveTeam(pt);
  }
  // Fallback: resolve team from IBL history
  if (!team) {
    var _iblTeamSearch = (DATA.iblHistory[name] || []);
    for (var _ti = 0; _ti < _iblTeamSearch.length; _ti++) {
      var _ts = _iblTeamSearch[_ti];
      if (_ts.team) { team = resolveTeam(_ts.team); if (team) break; }
    }
  }
  if (_activeSeason === 'year:2025') {
    var rosterTeam = getActiveRosterTeam2025(name);
    if (rosterTeam) team = rosterTeam;
  }

  document.title = name + ' — Data Diamond';

  // ── Collect player bio details (used in hero + overview) ──────────────────────
  var _iblAll  = DATA.iblHistory[name] || [];
  var _ibl     = _iblAll.length ? _iblAll[0] : null;

  // Derive bats/throws from scatter data (Batter_Side / Pitcher_Side columns).
  // If a player appears with more than one distinct side value they are Switch.
  function deriveHand(scatter, field) {
    var counts = {};
    var total = 0;
    scatter.forEach(function(s) {
      var v = s[field];
      if (v) { counts[v] = (counts[v] || 0) + 1; total++; }
    });
    if (total === 0) return null;
    // If one side is used 50%+ of the time, use that side
    var sides = Object.keys(counts);
    if (sides.length === 1) return sides[0];
    var dominant = sides.reduce(function(a, b) { return counts[a] >= counts[b] ? a : b; });
    if (counts[dominant] / total >= 0.5) return dominant;
    return 'S';
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
    (team ? '<a href="league.html?team=' + team.id + '">' + team.abbreviation + '</a><span>/</span>' : '') +
    '<span>' + name + '</span></div>' +
    '<div class="player-badges">' +
    '<span class="badge badge-pos">' + playerInfo.pos + '</span>' +
    (team ? '<span class="badge badge-team">' + team.abbreviation + '</span>' : '') +
    '</div>' +
    '<h1 class="player-name-hero" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">' + name.toUpperCase() + '<span id="player-note-badge" style="font-size:0;line-height:1"></span></h1>' +
    '<div class="headline-stats" id="headline-stats"></div>' +
    '</div></section>' +
    '<div class="tabs-bar" style="margin-top:0"><div class="container"><div class="tabs">' +
    '<button class="tab-btn active" data-tab="overview">Overview</button>' +
    '<button class="tab-btn" data-tab="percentile">Percentile Stats</button>' +
    '<button class="tab-btn" data-tab="zone">Strike Zone</button>' +
    '<button class="tab-btn" data-tab="splits">Splits</button>' +
    '<button class="tab-btn" data-tab="usage">Game Log</button>' +
    '<button class="tab-btn" data-tab="season">Season Stats</button>' +
    '<button class="tab-btn" data-tab="notes">Notes</button>' +
    '</div></div></div>' +

    '<div class="container" style="padding-top:32px;padding-bottom:80px"><div id="season-filter-bar"></div><div id="player-tab-content"></div></div>';

  if (team) {
    document.getElementById('player-hero-bg').style.background =
      'radial-gradient(ellipse 80% 60% at 20% 50%, ' + hexToRgba(team.primaryColor, 0.18) + ' 0%, transparent 70%)';
  }

  loadNoteBadge(name);

  const hl = document.getElementById('headline-stats');
  function renderHeadlineStats() {
    hl.innerHTML = '';
    var sum = getSummaryPlayer(name);
    var pitchData = pitch;
    if (type === 'pitcher') {
      var ptsHL = [];
      var _hlNameKey = normPlayerName(name);
      DATA.pitches.forEach(function(bp) {
        if (!bp.scatter) return;
        bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === _hlNameKey) ptsHL.push(s); });
      });
      pitchData = ptsHL.length ? { batter: name, scatter: ptsHL } : null;
    }
  if (type === 'batter') {
    var pbpB = getPbpBatter(name);
    var is2026 = _activeSeason === 'year:2026';
    // AVG: datadiamond (summary) for 2026, iblHistory for 2025
    var dispAVG = is2026
      ? fmt3OrDash(sum && sum.AVG)
      : (getSeasonAVG(name) != null ? fmt3(getSeasonAVG(name)) : (pbpB ? fmt3(pbpB.AVG) : (sum && sum.AVG != null ? fmt3(sum.AVG) : ddMissing())));
    // HR: datadiamond (summary) for 2026, iblHistory for 2025
    var dispHR  = is2026
      ? fmtNOrDash(sum && sum.HR)
      : (getSeasonHR(name) != null ? fmtN(getSeasonHR(name)) : (pbpB ? fmtN(pbpB.HR) : (sum && sum.HR != null ? fmtN(sum.HR) : ddMissing())));
    // RBI: always from iblHistory
    var dispRBI = getSeasonRBI(name) != null ? fmtN(getSeasonRBI(name)) : ddMissing();
    [['AVG', dispAVG], ['HR', dispHR], ['RBI', dispRBI]].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  } else if (type === 'pitcher') {
    const sc  = (pitchData && pitchData.scatter) ? pitchData.scatter : [];
    const tot = sc.filter(function(s) { return s.outcome && s.outcome !== ''; }).length;
    const ks  = sc.filter(function(s) { return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    const bbs = sc.filter(function(s) { return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    const strPct = tot > 0 ? Math.round(sc.filter(function(s) { return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length / tot * 100) : 0;
    const pd = DATA.pitchers.find(function(p) { return p.pitcher === name; }) || {};
    var pbpPHL = getPbpPitcher(name);
    var _iblPitHL = ((DATA.iblHistory[name]||[]).filter(function(s){return s.IP>0&&(s.season||'').indexOf(_activeSeason.replace('year:',''))!==-1;}))[0]||null;
    var is2026pit = _activeSeason === 'year:2026';
    // IP: datadiamond (pitchers) for 2026, iblHistory for 2025
    const hlIP   = is2026pit
      ? fmtIPOrDash(pd.IP)
      : (_iblPitHL && _iblPitHL.IP   != null ? fmtIP(_iblPitHL.IP)   : (pbpPHL && pbpPHL.IP   != null ? fmtIP(pbpPHL.IP)   : ddMissing()));
    // ERA: always from iblHistory
    const hlERA  = _iblPitHL && _iblPitHL.ERA  != null ? fmt2(_iblPitHL.ERA)  : ddMissing();
    // WHIP: datadiamond (pitchers) for 2026, iblHistory for 2025
    const hlWHIP = is2026pit
      ? fmt2OrDash(getPitcherWhipFromData(name))
      : (_iblPitHL && _iblPitHL.WHIP != null ? fmt2(_iblPitHL.WHIP) : (pbpPHL && pbpPHL.WHIP != null ? fmt2(pbpPHL.WHIP) : ddMissing()));
    [['IP', hlIP], ['ERA', hlERA], ['WHIP', hlWHIP]].forEach(function(s) {
      hl.innerHTML += '<div class="hs-stat"><span class="hs-val">' + s[1] + '</span><span class="hs-lbl">' + s[0] + '</span></div>';
    });
  }
  }
  renderHeadlineStats();

  const tabContent = document.getElementById('player-tab-content');
  const tabs = content.querySelectorAll('.tab-btn');

  function activateTab(t) {
    // Re-fetch data for the active season in case season was switched
    var currentSum       = getSummaryPlayer(name);
    var currentPitchData;
    if (type === 'pitcher') {
      var pts2 = [];
      var _tabNameKey = normPlayerName(name);
      DATA.pitches.forEach(function(bp) {
        if (!bp.scatter) return;
        bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === _tabNameKey) pts2.push(s); });
      });
      currentPitchData = pts2.length ? { batter: name, scatter: pts2 } : null;
    } else {
      currentPitchData = getPitchPlayer(name);
    }
    tabs.forEach(function(tb) { tb.classList.toggle('active', tb.dataset.tab === t); });
    tabContent.innerHTML = '';
    var panel = document.createElement('div');
    panel.className = 'fade-up';
    if (t === 'overview')   panel.innerHTML = renderOverview(name, type, currentSum, currentPitchData, playerInfo, activeSeasonFilter);
    if (t === 'percentile') panel.innerHTML = renderPercentileStats(name, type, currentSum, currentPitchData, activeSeasonFilter);
    if (t === 'season')   panel.innerHTML = renderSeasonStats(name, type, currentSum, currentPitchData);
    if (t === 'splits') {
      panel.innerHTML = renderSplits(name, type, currentPitchData, activeSeasonFilter);
      var allPoints = [];
      if (type === 'batter' && currentPitchData && currentPitchData.scatter) {
        allPoints = currentPitchData.scatter;
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
    if (t === 'zone')     renderZone(name, type, currentPitchData, panel, activeSeasonFilter);
    if (t === 'usage') {
      if (type === 'pitcher') {
        panel.innerHTML = renderGameLog(name, currentPitchData);
      } else {
        panel.innerHTML = renderBatterGameLog(name, currentPitchData);
        setTimeout(function() { initBatterGameLog(name, currentPitchData); }, 0);
      }
    }
    if (t === 'notes')    renderNotes(name, panel);
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

  // Fallback: if no scatter dates, pull years from iblHistory — but only show 2025
  if (!_allSeasonOpts.length) {
    var has2025ibl = (DATA.iblHistory[name] || []).some(function(s) {
      return (s.season||'').indexOf('2025') !== -1 && (type === 'pitcher' ? s.IP > 0 : s.AB > 0);
    });
    if (has2025ibl && !_seenYears['2025']) {
      _seenYears['2025'] = true;
      _allSeasonOpts.push({ label: '2025', year: '2025' });
    }
  }

  _allSeasonOpts = ['2026', '2025'].map(function(yr) {
    return { label: yr, year: yr, available: playerHasSeasonData(name, type, yr) };
  });

  var activeSeasonFilter = _activeSeason;
  if (!_allSeasonOpts.some(function(opt) { return opt.available && activeSeasonFilter === 'year:' + opt.year; })) {
    var firstAvailableSeason = _allSeasonOpts.find(function(opt) { return opt.available; });
    if (firstAvailableSeason) {
      activeSeasonFilter = 'year:' + firstAvailableSeason.year;
      swapSeasonData(activeSeasonFilter);
    }
  }
  var currentTab = 'overview';

  function renderSeasonFilterBar(activeTab) {
    var _filterBar = document.getElementById('season-filter-bar');
    if (!_filterBar) return;
    if (!_allSeasonOpts.length) { _filterBar.innerHTML = ''; return; }
    var SEASON_TABS = ['overview', 'percentile', 'zone', 'splits'];
    if (!SEASON_TABS.includes(activeTab)) { _filterBar.innerHTML = ''; return; }

    function btnStyle(active, unavailable) {
      return 'font-family:var(--font-mono);font-size:10px;letter-spacing:0.1em;' +
             'padding:5px 14px;border-radius:4px;transition:all .15s;' +
             'cursor:' + (unavailable ? 'not-allowed' : 'pointer') + ';' +
             'border:1px solid ' + (active ? '#FFB81C' : 'rgba(255,255,255,0.1)') + ';' +
             'background:' + (active ? 'rgba(255,184,28,0.12)' : 'rgba(255,255,255,0.03)') + ';' +
             'color:' + (unavailable ? 'rgba(255,255,255,0.18)' : (active ? '#FFB81C' : 'rgba(255,255,255,0.4)')) + ';' +
             'opacity:' + (unavailable ? '.55' : '1') + ';';
    }
    var btns = _allSeasonOpts.map(function(opt) {
      return '<button style="' + btnStyle(activeSeasonFilter === 'year:' + opt.year, !opt.available) + '" data-sf="year:' + opt.year + '" ' + (!opt.available ? 'disabled title="No '+opt.year+' data for this player"' : '') + '>' + opt.year + '</button>';
    }).join('');

    _filterBar.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:8px 0 14px;border-bottom:1px solid rgba(255,255,255,0.05)">' +
      '<span style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.15em;color:rgba(255,255,255,0.25);text-transform:uppercase;white-space:nowrap">Season</span>' +
      '<div style="display:flex;gap:6px">' + btns + '</div></div>';

    _filterBar.querySelectorAll('[data-sf]').forEach(function(btn) {
      if (btn.disabled) return;
      btn.addEventListener('click', function() {
        activeSeasonFilter = btn.dataset.sf;
        swapSeasonData(btn.dataset.sf);
        renderHeadlineStats();
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
  var seasonYear = seasonFilter.replace('year:', ''); // strip 'year:' prefix
  var pi  = playerInfo || {};
  var pbpB = getPbpBatter(name);
  // Filter scatter by season
  var _scRaw = (pitch && pitch.scatter) ? pitch.scatter : [];
  var sc = (seasonFilter === 'all' || !seasonYear) ? _scRaw : _scRaw.filter(function(s){
    if (!s.date) return true;
    // Handle YYYY-MM-DD format
    if (s.date.length === 10 && s.date[4] === '-') return s.date.slice(0,4) === seasonYear;
    // Handle DD-Mon-YY format e.g. "01-Jun-25"
    var parts = s.date.split('-');
    if (parts.length === 3 && parts[2].length === 2) {
      return ('20' + parts[2]) === seasonYear;
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
    var inZoneFn  = function(s){ return s.in_zone === true; };
    var oozFn     = function(s){ return s.in_zone === false; };

    // ── PBP-based stats (preferred) ───────────────
    var d = (_activeSeason === 'year:2026' && sum) ? sum : pbpB;  // 2026 DataDiamond row, 2025 PBP row
    var lgB = buildPbpBatterLeague();

    // ── Compute from scatter if no pbpB or sum ────
    var scComputed = null;
    if (!d && (!sum || !sum.AVG) && sc.length >= 5) {
      var cPA=0,cAB=0,cH=0,c1B=0,c2B=0,c3B=0,cHR=0,cBB=0,cHBP=0,cK=0,cSF=0;
      var cSwing=0,cWhiff=0,cPitches=sc.length;
      var NON_AB_OUT=['Walk','Intentional Walk','Hit By Pitch','Sacrifice Fly','Sacrifice Bunt','Catcher Interference'];
      var PA_END=['Single','Double','Triple','Home Run','Groundout','Flyout','Lineout','Popout','Double Play','Triple Play','Sacrifice Fly','Sacrifice Bunt','Error','Walk','Intentional Walk','Hit By Pitch','Strikeout Swinging','Strikeout Looking','Dropped Third Strike Swinging','Dropped Third Strike Looking','Truncated Out','Pickoff','Caught Stealing','Additional Out','Batter Interference','Catcher Interference'];
      // Group into PAs
      var cPAs=[],cCur=null;
      sc.forEach(function(p){
        var key=p.inning+'|'+p.half_inning+'|'+p.batter;
        if(!cCur||cCur.key!==key){cCur={key:key,rows:[]};cPAs.push(cCur);}
        cCur.rows.push(p);
        var isSwing=['Swinging Strike','Foul','Single','Double','Triple','Home Run','Groundout','Flyout','Lineout','Popout','Double Play','Sacrifice Fly','Sacrifice Bunt','Error','Strikeout Swinging','Dropped Third Strike Swinging'].includes(p.outcome);
        if(isSwing)cSwing++;
        if(p.outcome==='Swinging Strike'||p.outcome==='Strikeout Swinging')cWhiff++;
      });
      cPAs.forEach(function(pa){
        var last=pa.rows.slice().reverse().find(function(r){return PA_END.includes(r.outcome);});
        if(!last)return;
        cPA++;
        var o=last.outcome;
        if(o==='Single'){cH++;c1B++;}
        if(o==='Double'){cH++;c2B++;}
        if(o==='Triple'){cH++;c3B++;}
        if(o==='Home Run'){cH++;cHR++;}
        if(o==='Walk'||o==='Intentional Walk')cBB++;
        if(o==='Hit By Pitch')cHBP++;
        if(o==='Strikeout Swinging'||o==='Strikeout Looking')cK++;
        if(o==='Sacrifice Fly')cSF++;
        if(!NON_AB_OUT.includes(o))cAB++;
      });
      if(cAB>0){
        var cAVG=cH/cAB;
        var cOBP=(cAB+cBB+cHBP+cSF)>0?(cH+cBB+cHBP)/(cAB+cBB+cHBP+cSF):0;
        var cSLG=(c1B+2*c2B+3*c3B+4*cHR)/cAB;
        scComputed={AVG:cAVG,OBP:cOBP,SLG:cSLG,OPS:cOBP+cSLG,HR:cHR,K:cK,BB:cBB,HBP:cHBP,PA:cPA,AB:cAB,H:cH,SF:cSF,
          K_pct:cPA>0?cK/cPA*100:0, BB_pct:cPA>0?cBB/cPA*100:0,
          SWING_pct:cPitches>0?cSwing/cPitches*100:0,
          WHIFF_pct:cSwing>0?cWhiff/cSwing*100:0,
          CONTACT_pct:cSwing>0?(1-cWhiff/cSwing)*100:0,
          PS_PA:cPA>0?cPitches/cPA:0};
      }
    }
    // Use scComputed as fallback for d and sum
    if (!d && scComputed) d = scComputed;
    if (!sum && scComputed) sum = scComputed;

    function pctRankB(val, arr) {
      if (!arr || !arr.length || val == null) return null;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    // Slash line — 2026: datadiamond (sum/pbp) for AVG/OBP/SLG/OPS/HR, iblHistory for RBI
    //            2025: iblHistory for all, then pbpB fallback
    var _is26batter = _activeSeason === 'year:2026';
    var srcAVG = _is26batter ? (sum ? sum.AVG : null)                  : (getSeasonAVG(name) != null ? getSeasonAVG(name) : (d ? d.AVG : (sum ? sum.AVG : null)));
    var srcOBP = _is26batter ? (sum ? sum.OBP : null)                  : (getSeasonOBP(name) != null ? getSeasonOBP(name) : (d ? d.OBP : (sum ? sum.OBP : null)));
    var srcSLG = _is26batter ? (sum ? sum.SLG : null)                  : (getSeasonSLG(name) != null ? getSeasonSLG(name) : (d ? d.SLG : (sum ? sum.SLG : null)));
    var srcOPS = _is26batter ? (sum ? sum.OPS : null)                  : (getSeasonOPS(name) != null ? getSeasonOPS(name) : (d ? d.OPS : (sum ? sum.OPS : null)));
    var srcHR  = _is26batter ? (sum ? sum.HR  : null)                  : (getSeasonHR(name)  != null ? getSeasonHR(name)  : (d ? d.HR  : (sum ? sum.HR  : null)));
    var srcRBI = getSeasonRBI(name) != null ? getSeasonRBI(name) : null; // always iblHistory

    // League arrays for slash line from iblHistory
    var lgAvg = Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.AB>0;}); return s.length&&s[0].AVG!=null?s[0].AVG:null; }).filter(function(v){return v!=null;});
    var lgObp = Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.AB>0;}); return s.length&&s[0].OBP!=null?s[0].OBP:null; }).filter(function(v){return v!=null;});
    var lgSlg = Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.AB>0;}); return s.length&&s[0].SLG!=null?s[0].SLG:null; }).filter(function(v){return v!=null;});
    var lgOps = Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.AB>0;}); return s.length&&s[0].OPS!=null?s[0].OPS:null; }).filter(function(v){return v!=null;});
    if(!lgAvg.length) lgAvg = DATA.summary.filter(function(p){return p.AB>=5;}).map(function(p){return p.AVG||0;});
    if(!lgObp.length) lgObp = DATA.summary.filter(function(p){return p.AB>=5;}).map(function(p){return p.OBP||0;});
    if(!lgSlg.length) lgSlg = DATA.summary.filter(function(p){return p.AB>=5;}).map(function(p){return p.SLG||0;});
    if(!lgOps.length) lgOps = DATA.summary.filter(function(p){return p.AB>=5;}).map(function(p){return p.OPS||0;});
    var lgHr   = DATA.pbpBatters.filter(function(p){ return p.AB>=5; }).map(function(p){ return p.HR||0; });
    var lgRbi  = DATA.iblHistory ? Object.values(DATA.iblHistory).map(function(seasons){
      var s = (seasons||[]).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(_activeSeason.replace('year:','')) !== -1; });
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

    // ── Discipline stats from PBP or scatter ─────────────────
    if (d) {
      // Build scatter-based league arrays as fallback when pbpBatters is empty
      var _lgSwing=lgB.swing.length?lgB.swing.map(function(v){return v;}):[];
      var _lgWhiff=lgB.whiff.length?lgB.whiff.map(function(v){return v;}):[];
      var _lgK=lgB.kpct.length?lgB.kpct.map(function(v){return v;}):[];
      var _lgBB=lgB.bbpct.length?lgB.bbpct.map(function(v){return v;}):[];
      if(!_lgSwing.length||!_lgWhiff.length||!_lgK.length||!_lgBB.length){
        DATA.pitches.forEach(function(bp){
          var s2=bp.scatter||[]; var t2=s2.filter(function(s){return s.outcome&&s.outcome!=='';}).length; if(!t2)return;
          var sw2=s2.filter(function(s){return s.outcome==='Swinging Strike';}).length;
          var fo2=s2.filter(function(s){return s.outcome==='Foul';}).length;
          var ip2=s2.filter(function(s){return IN_PLAY.includes(s.outcome);}).length;
          var sw2t=sw2+fo2+ip2;
          if(!_lgSwing.length) _lgSwing.push(t2>0?sw2t/t2*100:0);
          if(!_lgWhiff.length&&sw2t>0) _lgWhiff.push(sw2/sw2t*100);
        });
        DATA.summary.forEach(function(p){
          if(!p.AB||p.AB<5)return;
          var pPA=p.PA||(p.AB+(p.BB||0)+(p.HBP||0)+(p.SF||0))||1;
          if(!_lgK.length) _lgK.push((p.K||0)/pPA*100);
          if(!_lgBB.length) _lgBB.push((p.BB||0)/pPA*100);
        });
      }
      evalStat('SWING%',    d.SWING_pct   != null ? fmt1(d.SWING_pct)+'%'   : '—', pctRankB(d.SWING_pct,   _lgSwing),   false,
        { weak:'Passive approach — below-average swing rate, letting a lot of pitches go.', poor:'One of the lowest swing rates in the league — very selective, rarely offers.' });
      evalStat('WHIFF%',    d.WHIFF_pct   != null ? fmt1(d.WHIFF_pct)+'%'   : '—', d.WHIFF_pct != null ? 1-pctRankB(d.WHIFF_pct, _lgWhiff) : null, true,
        { elite:'Excellent bat-to-ball skills — one of the lowest whiff rates in the league.', strong:'Above-average contact rate on swings.',
          weak:'High whiff rate — misses on a significant portion of swings.', poor:'One of the highest whiff rates in the league — struggles to make bat-on-ball contact.' });
      evalStat('K%',        d.K_pct       != null ? fmt1(d.K_pct)+'%'       : '—', d.K_pct != null ? 1-pctRankB(d.K_pct, _lgK) : null, true,
        { elite:'Exceptional strikeout avoidance — one of the hardest to put away in the league.', strong:'Below-average strikeout rate — makes consistent contact.',
          weak:'Strikeout rate is elevated — pitchers are regularly putting this hitter away.', poor:'One of the highest strikeout rates in the league — a major vulnerability.' });
      evalStat('BB%',       d.BB_pct      != null ? fmt1(d.BB_pct)+'%'      : '—', pctRankB(d.BB_pct, _lgBB), true,
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
      evalStat('FB%',       d.FB_pct      != null ? fmt1(d.FB_pct)+'%'      : '—', pctRankB(d.FB_pct, lgB.fb), true,
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

    // In-zone / chase from x/y coordinates (datadiamond)
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
      var iz2=s2.filter(function(s){return s.in_zone===true;});
      var izSw2=iz2.filter(function(s){return['Swinging Strike','Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var izCon2=iz2.filter(function(s){return['Foul'].concat(IN_PLAY).includes(s.outcome);}).length;
      var ooz2=s2.filter(function(s){return s.in_zone===false;});
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
    var scTot = sc.filter(function(s){ return s.outcome && s.outcome !== ''; }).length;
    // Fall back to pd.total_pitches for no-x/y pitchers so rate stats compute correctly
    var tot  = scTot > 0 ? scTot : (pd.total_pitches != null ? pd.total_pitches : 0);
    var ks   = sc.filter(function(s){ return s.outcome === 'Strikeout Swinging' || s.outcome === 'Strikeout Looking'; }).length;
    var bbs  = sc.filter(function(s){ return s.outcome === 'Walk' || s.outcome === 'Intentional Walk'; }).length;
    var str  = sc.filter(function(s){ return ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome); }).length;
    var swS  = sc.filter(function(s){ return s.outcome === 'Swinging Strike'; }).length;
    var ipO  = sc.filter(function(s){ return IN_PLAY.includes(s.outcome); }).length;
    var fo   = sc.filter(function(s){ return s.outcome === 'Foul'; }).length;
    var swings = swS + fo + ipO;
    var pdH  = sc.filter(function(s){ return HITS.includes(s.outcome); }).length;

    // Prefer pbpPO (pbpPitchers) as primary source; fall back to scatter computation
    var _is26pit = _activeSeason === 'year:2026';
    // For 2026: use scatter/pitchers2026 data; pbpPO is null (no pbp for 2026)
    var myStr   = _is26pit ? (pd.STR_pct   != null ? pd.STR_pct   / 100 : (tot > 0 ? str / tot    : null))
                           : (pbpPO.STR_pct   != null ? pbpPO.STR_pct   / 100 : (tot > 0    ? str / tot    : (pd.STR_pct != null ? pd.STR_pct / 100 : null)));
    var mySwing = _is26pit ? (pd.SWING_pct != null ? pd.SWING_pct / 100 : (tot > 0 ? swings / tot : null))
                           : (pbpPO.SWING_pct != null ? pbpPO.SWING_pct / 100 : (tot > 0    ? swings / tot : null));
    var myWhiff = _is26pit ? (pd.WHIFF_pct != null ? pd.WHIFF_pct / 100 : (swings > 0 ? swS / swings : null))
                           : (pbpPO.WHIFF_pct != null ? pbpPO.WHIFF_pct / 100 : (swings > 0 ? swS / swings : null));
    var myK     = _is26pit ? (pd.K_pct     != null ? pd.K_pct     / 100 : (tot > 0 ? ks / tot     : null))
                           : (pbpPO.K_pct     != null ? pbpPO.K_pct     / 100 : (tot > 0    ? ks / tot     : (pd.K_pct   != null ? pd.K_pct   / 100 : null)));
    var myBB    = _is26pit ? (pd.BB_pct     != null ? pd.BB_pct     / 100 : (tot > 0 ? bbs / tot    : null))
                           : (pbpPO.BB_pct    != null ? pbpPO.BB_pct    / 100 : (tot > 0    ? bbs / tot    : (pd.BB_pct  != null ? pd.BB_pct  / 100 : null)));
    var myEA    = _is26pit ? (pd.EA_pct     != null ? pd.EA_pct     : null)
                           : (pbpPO.EA_pct    != null ? pbpPO.EA_pct    : (pd.EA_pct  != null ? pd.EA_pct : null));
    var myKBB   = _is26pit ? (pd.K_BB       != null ? pd.K_BB       : null)
                           : (pbpPO.K_BB      != null ? pbpPO.K_BB      : (pd.K_BB    != null ? pd.K_BB   : null));

    var era    = getSeasonERA(name); // always from iblHistory
    var whip   = _is26pit ? getPitcherWhipFromData(name)
                          : (pbpPO.WHIP != null ? pbpPO.WHIP : (pd.WHIP != null ? pd.WHIP : (pd.IP > 0 ? (bbs + pdH) / pd.IP : null)));
    var baAgst = _is26pit ? (pd.BA_against != null ? pd.BA_against : null) : (pbpPO.BA_against != null ? pbpPO.BA_against : (function(){
      var ab=sc.filter(function(s){return IN_PLAY.concat(KS).includes(s.outcome);}).length;
      var h=sc.filter(function(s){return HITS.includes(s.outcome);}).length;
      return ab>=5?h/ab:null;
    })());

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

    // Supplement lgP with DATA.pitchers when scatter-based arrays are thin
    if(lgP.k.length < 5 || lgP.bb.length < 5 || lgP.str.length < 5) {
      DATA.pitchers.forEach(function(p){
        if(!p.BF||p.BF<5) return;
        if(p.K_pct!=null)  lgP.k.push(p.K_pct/100);
        if(p.BB_pct!=null) lgP.bb.push(p.BB_pct/100);
        if(p.STR_pct!=null)lgP.str.push(p.STR_pct/100);
        if(p.K_BB!=null)   lgP.kbb.push(p.K_BB);
        if(p.IP>0)         lgP.ip.push(p.IP);
        if(p.WHIP!=null)   lgP.whip.push(p.WHIP);
      });
      // Also pull ERA from iblHistory
      Object.entries(DATA.iblHistory||{}).forEach(function(e){
        var iblP=(e[1]||[]).filter(function(s){return s.IP>0;});
        if(iblP.length&&iblP[0].ERA!=null) lgP.era.push(iblP[0].ERA);
      });
    }

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
    var ipVal = _is26pit ? pd.IP : getSeasonIP(name);
    evalStat('IP',       ipVal>0      ?fmtIP(ipVal)          :'—', pctRank(ipVal||0,lgP.ip),  true,
      { elite:'Elite innings pitched — a true workhorse, going deep into games and saving the bullpen.', strong:'Above-average innings total — consistently pitching deep into games.',
        weak:'Below-average innings total — often pitching in shorter stints.', poor:'One of the lowest innings pitched — limited workload this season.' });



    // Zone / pitch-type approach
    var pitchTypes=[];
    scP.forEach(function(s){if(s.pitch_type&&!pitchTypes.includes(s.pitch_type))pitchTypes.push(s.pitch_type);});
    // x = vertical (0=bottom, 1=top), y = horizontal (-1=left, 1=right catcher view)
    var inZoneFn=function(s){return s.in_zone===true;};
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
  if (type === 'batter' && pi.bats) bioItems.push({ label: 'Bats', val: fmtHand(pi.bats) });
  if (type === 'pitcher' && pi.throws) bioItems.push({ label: 'Throws', val: fmtHand(pi.throws) });
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


  var donutHTML = '';
  var pitcherOverviewHTML = '';

  if (type === 'batter') {
    var gb = 0, fb = 0, lo = 0, po = 0;
    // Prefer pbpBatters GB/FB/LO/PO percentages; fall back to scatter contact field
    if(d && d.GB_pct!=null && d.FB_pct!=null){
      gb=d.GB_pct; fb=d.FB_pct; lo=d.LO_pct||0; po=d.PO_pct||0;
    } else {
      var batted = sc.filter(function(s){
        return ['Groundout','Flyout','Single','Double','Triple','Home Run',
                'Lineout','Popout','Error','Double Play','Sacrifice Fly'].includes(s.outcome);
      });
      function contactKind(s) {
        if (s.contact === 'Ground Ball') return 'GB';
        if (s.contact === 'Fly Ball') return 'FB';
        if (s.contact === 'Line Drive') return 'LO';
        if (s.contact === 'Pop Up') return 'PO';
        if (s.outcome === 'Groundout' || s.outcome === 'Double Play') return 'GB';
        if (s.outcome === 'Flyout' || s.outcome === 'Sacrifice Fly' || s.outcome === 'Home Run') return 'FB';
        if (s.outcome === 'Lineout' || ['Single','Double','Triple'].includes(s.outcome)) return 'LO';
        if (s.outcome === 'Popout') return 'PO';
        return null;
      }
      var gbC=batted.filter(function(s){return contactKind(s)==='GB';}).length;
      var fbC=batted.filter(function(s){return contactKind(s)==='FB';}).length;
      var loC=batted.filter(function(s){return contactKind(s)==='LO';}).length;
      var poC=batted.filter(function(s){return contactKind(s)==='PO';}).length;
      var bipTot=gbC+fbC+loC+poC;
      var minBipForDonut = _activeSeason === 'year:2026' ? 1 : 5;
      if(bipTot>=minBipForDonut){
        gb=Math.round(gbC/bipTot*1000)/10; fb=Math.round(fbC/bipTot*1000)/10;
        lo=Math.round(loC/bipTot*1000)/10; po=Math.round(poC/bipTot*1000)/10;
      }
    }
    var bipTot = (gb+fb+lo+po) > 0 ? 10 : 0; // sentinel for donut gate

    var batted2=sc.filter(function(s){
      return ['Groundout','Flyout','Single','Double','Triple','Home Run',
              'Lineout','Popout','Error','Double Play','Sacrifice Fly'].includes(s.outcome) && s.spray;
    });
    var pullC=batted2.filter(function(s){return s.spray==='Pull';}).length;
    var strC =batted2.filter(function(s){return s.spray==='Straightaway';}).length;
    var oppC =batted2.filter(function(s){return s.spray==='Opposite Field';}).length;
    var sprayTot=pullC+strC+oppC;

    function buildDonut(segs, cx, cy, R, r, centerLines) {
      var paths='', startA=-Math.PI/2;
      segs.forEach(function(seg){
        var sweep=(seg.pct/100)*2*Math.PI, endA=startA+sweep;
        var x1o=cx+R*Math.cos(startA),y1o=cy+R*Math.sin(startA);
        var x2o=cx+R*Math.cos(endA),  y2o=cy+R*Math.sin(endA);
        var x1i=cx+r*Math.cos(endA),  y1i=cy+r*Math.sin(endA);
        var x2i=cx+r*Math.cos(startA),y2i=cy+r*Math.sin(startA);
        var la=sweep>Math.PI?1:0;
        paths+='<path d="M '+x1o.toFixed(2)+' '+y1o.toFixed(2)+' A '+R+' '+R+' 0 '+la+' 1 '+x2o.toFixed(2)+' '+y2o.toFixed(2)+' L '+x1i.toFixed(2)+' '+y1i.toFixed(2)+' A '+r+' '+r+' 0 '+la+' 0 '+x2i.toFixed(2)+' '+y2i.toFixed(2)+' Z" fill="'+seg.color+'" opacity="0.9"/>';
        var midA=startA+sweep/2, lRm=(R+r)/2;
        var lx=cx+lRm*Math.cos(midA), ly=cy+lRm*Math.sin(midA);
        if(seg.pct>=8) paths+='<text x="'+lx.toFixed(1)+'" y="'+(ly+1).toFixed(1)+'" text-anchor="middle" dominant-baseline="middle" font-size="7" font-family="monospace" font-weight="bold" fill="#0e1525">'+Math.round(seg.pct)+'%</text>';
        startA=endA;
      });
      centerLines.forEach(function(line,i){
        paths+='<text x="'+cx+'" y="'+(cy+(i===0?-5:7))+'" text-anchor="middle" font-size="'+(i===0?8:7)+'" font-family="monospace" fill="rgba(255,255,255,'+(i===0?'0.4':'0.25')+')">'+line+'</text>';
      });
      return '<svg width="120" height="120" viewBox="0 0 120 120" style="flex-shrink:0">'+paths+'</svg>';
    }

    function buildLegend(segs) {
      return segs.map(function(seg){
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
          '<div style="width:10px;height:10px;border-radius:2px;background:'+seg.color+';flex-shrink:0"></div>'+
          '<div style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;width:36px">'+seg.label+'</div>'+
          '<div style="font-family:var(--font-mono);font-size:13px;color:#fff;font-weight:600">'+seg.pct.toFixed(1)+'%</div>'+
        '</div>';
      }).join('');
    }

    var bbSegs=[{label:'GB%',pct:gb,color:'#fb923c'},{label:'FB%',pct:fb,color:'#60a5fa'},{label:'LO%',pct:lo,color:'#34d399'},{label:'PU%',pct:po,color:'#a78bfa'}].filter(function(s){return s.pct>0;});
    var bbSVG   = bipTot>=5 ? buildDonut(bbSegs, 60,60,48,30, []) : '';
    var bbLegend= bipTot>=5 ? buildLegend(bbSegs) : '';

    var spraySVG='', sprayLegend='', shiftHTML='';
    var minSprayForDonut = _activeSeason === 'year:2026' ? 1 : 3;
    if(sprayTot>=minSprayForDonut){
      var pullPct=Math.round(pullC/sprayTot*1000)/10;
      var strPct2=Math.round(strC /sprayTot*1000)/10;
      var oppPct =Math.round(oppC /sprayTot*1000)/10;
      var spSegs=[{label:'Pull',pct:pullPct,color:'#f87171'},{label:'Str',pct:strPct2,color:'#FFB81C'},{label:'Oppo',pct:oppPct,color:'#60a5fa'}].filter(function(s){return s.pct>0;});
      spraySVG   = buildDonut(spSegs, 60,60,48,30, []);
      sprayLegend= buildLegend(spSegs);
      var sLabel,sDesc,sColor;
      if(pullPct>=50){sLabel='PULL';sDesc='Pull hitter — shift infield to pull side.';sColor='#f87171';}
      else if(oppPct>=40){sLabel='OPPO';sDesc='Goes opposite often — shade that way.';sColor='#60a5fa';}
      else if(strPct2>=50){sLabel='STRAIGHT';sDesc='Hits up the middle — play standard alignment.';sColor='#FFB81C';}
      else{sLabel='NONE';sDesc='Balanced — no shift needed.';sColor='rgba(255,255,255,0.4)';}
      shiftHTML=
        '<div style="width:1px;align-self:stretch;background:rgba(255,255,255,0.07)"></div>'+
        '<div style="min-width:140px">'+
          '<div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:8px">Shift Recommendation</div>'+
          '<div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+sColor+';letter-spacing:0.05em;margin-bottom:6px">'+sLabel+'</div>'+
          '<div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5">'+sDesc+'</div>'+
        '</div>';
    }

    if(bbSVG || spraySVG){
      var leftSection = bbSVG ?
        '<div>'+
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px">Batted Ball Profile</div>'+
          '<div style="display:flex;align-items:center;gap:16px">'+bbSVG+'<div>'+bbLegend+'</div></div>'+
        '</div>' : '';
      var divider=(bbSVG&&spraySVG)?'<div style="width:1px;align-self:stretch;background:rgba(255,255,255,0.07)"></div>':'';
      var rightSection = spraySVG ?
        '<div>'+
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:10px">Spray Direction</div>'+
          '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">'+spraySVG+'<div>'+sprayLegend+'</div>'+shiftHTML+'</div>'+
        '</div>' : '';
      donutHTML=
        '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px 24px;margin-bottom:16px">'+
        '<div style="display:flex;align-items:flex-start;gap:28px;flex-wrap:wrap">'+
          leftSection+divider+rightSection+
        '</div>'+
        '</div>';
    }
  }


  var pitcherGaugeHTML = '';
  if (type === 'pitcher') {
    var pdG = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
    var ttp = pdG.avg_time_to_plate != null ? pdG.avg_time_to_plate : null;

    if (ttp != null) {
      // Scale: 1.0s (fast) → 1.8s (slow). Midpoint = 1.35s
      var minT = 1.0, maxT = 1.8;
      var midT = 1.35;

      // Two zones: <1.35 = quick (green/good for pitcher), >=1.35 = slow (red/bad for pitcher)
      var gaugeColor, riskLabel, riskDesc;
      if (ttp < 1.35) {
        gaugeColor = '#34d399'; // green — quick delivery, hard to steal
        riskLabel  = 'QUICK DELIVERY';
        riskDesc   = 'Delivers quickly — base runners have a very difficult time stealing.';
      } else {
        gaugeColor = '#f87171'; // red — slow delivery, steal risk
        riskLabel  = 'SLOW DELIVERY';
        riskDesc   = 'Slow to the plate — base runners can steal freely. Alert your catcher.';
      }

      // Build SVG gauge (semicircle)
      var gR = 54, gCx = 70, gCy = 74;

      // Needle angle: map ttp to 180°→0° (left=fast, right=slow)
      var clampedT  = Math.max(minT, Math.min(maxT, ttp));
      var needlePct = (clampedT - minT) / (maxT - minT);
      var needleDeg = 180 - needlePct * 180;
      var needleRad = needleDeg * Math.PI / 180;
      var nLen = gR - 6;
      var nx   = gCx + nLen * Math.cos(needleRad);
      var ny   = gCy - nLen * Math.sin(needleRad);

      var ir = gR - 12;

      // Helper: build a donut arc segment between two angles (in radians)
      function makeArc(a1Rad, a2Rad) {
        var ax1 = gCx + gR * Math.cos(a1Rad), ay1 = gCy - gR * Math.sin(a1Rad);
        var ax2 = gCx + gR * Math.cos(a2Rad), ay2 = gCy - gR * Math.sin(a2Rad);
        var ix1 = gCx + ir * Math.cos(a2Rad), iy1 = gCy - ir * Math.sin(a2Rad);
        var ix2 = gCx + ir * Math.cos(a1Rad), iy2 = gCy - ir * Math.sin(a1Rad);
        return 'M ' + ax1.toFixed(1) + ' ' + ay1.toFixed(1) +
          ' A ' + gR + ' ' + gR + ' 0 0 1 ' + ax2.toFixed(1) + ' ' + ay2.toFixed(1) +
          ' L ' + ix1.toFixed(1) + ' ' + iy1.toFixed(1) +
          ' A ' + ir + ' ' + ir + ' 0 0 0 ' + ix2.toFixed(1) + ' ' + iy2.toFixed(1) + ' Z';
      }

      // Two zone boundary angles (180°=left/fast, 0°=right/slow)
      var gsRad  = Math.PI;
      var midPct = (midT - minT) / (maxT - minT);
      var midDeg = 180 - midPct * 180;
      var midRad = midDeg * Math.PI / 180;
      var mx1 = gCx + (gR - 2) * Math.cos(midRad);
      var my1 = gCy - (gR - 2) * Math.sin(midRad);
      var mx2 = gCx + (gR + 6) * Math.cos(midRad);
      var my2 = gCy - (gR + 6) * Math.sin(midRad);

      var greenArc = makeArc(gsRad, midRad);
      var redArc   = makeArc(midRad, 0);

      pitcherGaugeHTML =
        '<div style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:20px 24px;margin-bottom:16px">' +
          '<div style="font-family:var(--font-mono);font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:14px">Time to Plate</div>' +
          '<div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap">' +
            '<div style="flex-shrink:0;text-align:center">' +
              '<svg width="140" height="90" viewBox="0 0 140 90">' +
                '<path d="M ' + (gCx - gR) + ' ' + gCy + ' A ' + gR + ' ' + gR + ' 0 0 1 ' + (gCx + gR) + ' ' + gCy +
                      ' L ' + (gCx + ir) + ' ' + gCy + ' A ' + ir + ' ' + ir + ' 0 0 0 ' + (gCx - ir) + ' ' + gCy + ' Z"' +
                      ' fill="rgba(255,255,255,0.06)"/>' +
                '<path d="' + greenArc + '" fill="rgba(52,211,153,0.25)"/>' +
                '<path d="' + redArc   + '" fill="rgba(248,113,113,0.25)"/>' +
                '<line x1="' + mx1.toFixed(1) + '" y1="' + my1.toFixed(1) + '" x2="' + mx2.toFixed(1) + '" y2="' + my2.toFixed(1) + '"' +
                      ' stroke="#FFB81C" stroke-width="2" stroke-dasharray="2,2"/>' +
                '<text x="' + (mx2 + 2).toFixed(1) + '" y="' + (my2 - 2).toFixed(1) + '"' +
                      ' font-size="5.5" font-family="monospace" fill="#FFB81C">1.35s</text>' +
                '<line x1="' + gCx + '" y1="' + gCy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '"' +
                      ' stroke="' + gaugeColor + '" stroke-width="2.5" stroke-linecap="round"/>' +
                '<circle cx="' + gCx + '" cy="' + gCy + '" r="4" fill="' + gaugeColor + '"/>' +
                '<text x="' + gCx + '" y="' + (gCy + 14) + '"' +
                      ' text-anchor="middle" font-size="13" font-family="monospace" font-weight="bold" fill="' + gaugeColor + '">' + ttp.toFixed(2) + 's</text>' +
                '<text x="' + (gCx - gR - 2) + '" y="' + (gCy + 3) + '" font-size="6" font-family="monospace" fill="rgba(255,255,255,0.3)" text-anchor="end">1.0s</text>' +
                '<text x="' + (gCx + gR + 2) + '" y="' + (gCy + 3) + '" font-size="6" font-family="monospace" fill="rgba(255,255,255,0.3)">1.8s</text>' +
                '<text x="' + gCx + '" y="' + (gCy + 20) + '" text-anchor="middle" font-size="5" font-family="monospace" fill="rgba(255,255,255,0.25)">threshold: 1.35s</text>' +
              '</svg>' +
            '</div>' +
            '<div style="flex:1;min-width:140px">' +
              '<div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:' + gaugeColor + ';letter-spacing:0.05em;margin-bottom:6px">' + riskLabel + '</div>' +
              '<div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;margin-bottom:10px">' + riskDesc + '</div>' +
              '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:6px;padding:8px 12px">' +
                '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;margin-bottom:2px">STEAL THRESHOLD</div>' +
                '<div style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.7)">At or above <span style="color:#f87171;font-weight:600">1.35s</span> = runners can steal freely</div>' +
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
  var rows = DATA.pbpBatters.length ? DATA.pbpBatters : DATA.summary;
  rows.forEach(function(p) {
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
            whiff:[], contact:[], fpStr:[], putaway:[], ea:[], early:[], ahead:[], gb:[], fb:[], lo:[], po:[] };
  // ERA league array from iblHistory (same source as getSeasonERA) — season-filtered
  var _pbpPitLgYr = _activeSeason.replace('year:', '');
  Object.keys(DATA.iblHistory).forEach(function(name) {
    var ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0 && (s.season||'').indexOf(_pbpPitLgYr) !== -1; });
    if (!ibl.length) ibl = (DATA.iblHistory[name] || []).filter(function(s){ return s.IP > 0; });
    if (ibl.length && ibl[0].ERA != null) o.era.push(ibl[0].ERA);
  });
  var rows = DATA.pbpPitchers.length ? DATA.pbpPitchers : DATA.pitchers;
  rows.forEach(function(p) {
    if ((p.BF != null && p.BF < 5) || (p.BF == null && !(p.IP > 0))) return;
    // ERA already built from iblHistory above
    if (p.WHIP != null) {
      o.whip.push(p.WHIP);
    } else if (p.IP > 0 && p.BB != null && (p.H_allowed != null || p.H != null)) {
      o.whip.push((Number(p.BB) + Number(p.H_allowed != null ? p.H_allowed : p.H)) / parseFloat(p.IP));
    } else if (p.IP > 0 && p.BB != null) {
      o.whip.push((Number(p.BB) + getPitcherScatterHits(p.pitcher, p)) / parseFloat(p.IP));
    }
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
    if (p.Early_pct  != null) o.early.push(p.Early_pct);
    if (p.Ahead_pct  != null) o.ahead.push(p.Ahead_pct);
    if (p.GB_pct     != null) o.gb.push(p.GB_pct);
    if (p.FB_pct     != null) o.fb.push(p.FB_pct);
    if (p.LO_pct     != null) o.lo.push(p.LO_pct);
    if (p.PO_pct     != null) o.po.push(p.PO_pct);
  });
  return o;
}

function renderPercentileStats(name, type, sum, pitch, seasonFilter) {
  seasonFilter = seasonFilter || 'all';
  var seasonYear = seasonFilter.replace('year:', '');

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
    var pctDisplay = b.pct != null ? Math.round(p * 100) : '--';
    var lw       = labelWidth || 100;
    return '<div class="sbr-row" data-stat="' + b.lbl + '" style="align-items:center;margin-bottom:12px;display:flex">' +
      '<div class="sbr-label" style="width:' + lw + 'px;flex-shrink:0;font-family:var(--font-mono);font-size:11px;color:var(--text-mid)">' + b.lbl + '</div>' +
      '<div style="flex:1;position:relative;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;margin:0 8px">' +
        '<div class="sbr-fill" style="position:absolute;left:0;top:0;height:10px;width:0%;background:' + color + ';border-radius:5px;transition:width 0.8s cubic-bezier(0.4,0,0.2,1)" data-width="' + widthPct + '%"></div>' +
        '<div class="savant-bubble" style="position:absolute;top:50%;transform:translate(-50%,-50%);left:0%;width:28px;height:28px;border-radius:50%;background:' + color + ';display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;font-family:var(--font-mono);z-index:2;transition:left 0.8s cubic-bezier(0.4,0,0.2,1);box-shadow:0 1px 4px rgba(0,0,0,0.4);white-space:nowrap" data-left="' + widthPct + '">' + pctDisplay + '</div>' +
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
    var inZonePts    = sc.filter(function(s){ return s.in_zone === true; });
    var inZoneSwings = inZonePts.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var inZoneContact= inZonePts.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
    var oozPts       = sc.filter(function(s){ return s.in_zone === false; });
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
        var inZ2    = sc2.filter(function(s){ return s.in_zone === true; });
        var izSw2   = inZ2.filter(function(s){ return s.outcome === 'Swinging Strike' || s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var izCon2  = inZ2.filter(function(s){ return s.outcome === 'Foul' || ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
        var ooz2    = sc2.filter(function(s){ return s.in_zone === false; });
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
        var fpSw2   = fp2.filter(function(s){ return ['Swinging Strike','Foul','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome); }).length;
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
        var _pbpBatLgYr = _activeSeason.replace('year:', '');
      var iblR = (DATA.iblHistory[p.batter]||[]).filter(function(s){ return s.AB > 0 && (s.season||'').indexOf(_pbpBatLgYr) !== -1; });
      if (!iblR.length) iblR = (DATA.iblHistory[p.batter]||[]).filter(function(s){ return s.AB > 0; });
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

    var pitchCount = totPitches;
    var _iblYrB = _activeSeason.replace('year:','');
    var _iblB2 = (DATA.iblHistory[name]||[]).filter(function(s){ return s.AB>0&&(s.season||'').indexOf(_iblYrB)!==-1; });
    var _iblS2 = _iblB2.length ? _iblB2[0] : null;
    var _myRBI = getSeasonRBI(name);
    var _lgRbi = Object.values(DATA.iblHistory||{}).map(function(seasons){
      var s=(seasons||[]).filter(function(s){return s.AB>0&&(s.season||'').indexOf(_iblYrB)!==-1;});
      return s.length&&s[0].RBI!=null?s[0].RBI:null;
    }).filter(function(v){return v!=null;});

    function _lpRank(val, arr) {
      if (!arr||!arr.length||val==null) return null;
      var below=arr.filter(function(v){return v<val;}).length;
      var equal=arr.filter(function(v){return v===val;}).length;
      return (below+equal*0.5)/arr.length;
    }

    var allBars = [];

    if (_activeSeason === 'year:2026') {
      // 2026: All stats from datadiamond (DATA.summary); RBI from IBL History; no PBP
      if (!sum || !sum.AB) {
        return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
      }
      var lg26 = (function() {
        var o = { avg:[],obp:[],slg:[],ops:[],woba:[],hr:[],iso:[],babip:[],
                  swing:[],whiff:[],contact:[],k:[],bb:[],bbk:[],pspa:[],fpSwing:[],
                  pull:[],oppo:[],str:[],zone:[],gb:[],fb:[],lo:[],po:[] };
        DATA.summary.forEach(function(p) {
          if (!((p.PA || 0) > 0 || (p.AB || 0) > 0)) return;
          if (p.AVG !=null) o.avg.push(p.AVG);
          if (p.OBP !=null) o.obp.push(p.OBP);
          if (p.SLG !=null) o.slg.push(p.SLG);
          if (p.OPS !=null) o.ops.push(p.OPS);
          if (p.wOBA!=null) o.woba.push(p.wOBA);
          if (p.HR  !=null) o.hr.push(p.HR);
          if (p.ISO != null) o.iso.push(p.ISO);
          else if (p.SLG!=null&&p.AVG!=null) o.iso.push(p.SLG-p.AVG);
          var bNum=(p.H||0)-(p.HR||0),bDen=(p.AB||0)-(p.K||0)-(p.HR||0)+(p.SF||0);
          if (p.BABIP != null) o.babip.push(p.BABIP);
          else if (bDen>=5) o.babip.push(bNum/bDen);
          if (p.SWING_pct   !=null) o.swing.push(p.SWING_pct);
          if (p.WHIFF_pct   !=null) o.whiff.push(p.WHIFF_pct);
          if (p.CONTACT_pct !=null) o.contact.push(p.CONTACT_pct);
          if (p.K_pct       !=null) o.k.push(p.K_pct);
          if (p.BB_pct      !=null) o.bb.push(p.BB_pct);
          if (p.K > 0) o.bbk.push((p.BB||0)/p.K);
          if (p.PS_PA       !=null) o.pspa.push(p.PS_PA);
          if (p.FP_SWING_pct!=null) o.fpSwing.push(p.FP_SWING_pct);
          if (p.Pull_pct    !=null) o.pull.push(p.Pull_pct);
          if (p.Oppo_pct    !=null) o.oppo.push(p.Oppo_pct);
          if (p.Str_pct     !=null) o.str.push(p.Str_pct);
          if (p.zone_pct    !=null) o.zone.push(p.zone_pct);
          if (p.GB_pct !=null) o.gb.push(p.GB_pct);
          if (p.FB_pct !=null) o.fb.push(p.FB_pct);
          if (p.LO_pct !=null) o.lo.push(p.LO_pct);
          if (p.PO_pct !=null) o.po.push(p.PO_pct);
        });
        return o;
      })();
      var p26iso   = sum.ISO!=null ? sum.ISO : ((sum.SLG!=null&&sum.AVG!=null)?sum.SLG-sum.AVG:null);
      var p26bNum  = (sum.H||0)-(sum.HR||0), p26bDen=(sum.AB||0)-(sum.K||0)-(sum.HR||0)+(sum.SF||0);
      var p26babip = sum.BABIP!=null ? sum.BABIP : (p26bDen>=5?p26bNum/p26bDen:null);
      var p26BBK   = (sum.K||0) > 0 ? (sum.BB||0)/(sum.K||0) : null;
      var IN_PLAY  = ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'];
      var lg26iz=(function(){
        var izSw=[],izCon=[],ch=[];
        DATA.pitches.forEach(function(bp){
          var sc2=bp.scatter||[];
          var inZ2=sc2.filter(function(s){return s.in_zone===true;});
          var izSw2=inZ2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul'||IN_PLAY.includes(s.outcome);}).length;
          var izCon2=inZ2.filter(function(s){return s.outcome==='Foul'||IN_PLAY.includes(s.outcome);}).length;
          var ooz2=sc2.filter(function(s){return s.in_zone===false;});
          var ch2=ooz2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul';}).length;
          if(inZ2.length>0) izSw.push(izSw2/inZ2.length);
          if(izSw2>0) izCon.push(izCon2/izSw2);
          if(ooz2.length>0) ch.push(ch2/ooz2.length);
        });
        return {izSwing:izSw,izContact:izCon,chase:ch};
      })();
      var p26IzSwing  =inZonePts.length>0?inZoneSwings/inZonePts.length:null;
      var p26IzContact=inZoneSwings>0?inZoneContact/inZoneSwings:null;
      var p26Chase    =oozPts.length>0?chases/oozPts.length:null;
      allBars=[
        {lbl:'BA',         val:sum.AVG!=null?fmt3(sum.AVG):null,                        pct:_lpRank(sum.AVG,lg26.avg),                                     good:true},
        {lbl:'OBP',        val:sum.OBP!=null?fmt3(sum.OBP):null,                        pct:_lpRank(sum.OBP,lg26.obp),                                     good:true},
        {lbl:'SLG',        val:sum.SLG!=null?fmt3(sum.SLG):null,                        pct:_lpRank(sum.SLG,lg26.slg),                                     good:true},
        {lbl:'OPS',        val:sum.OPS!=null?fmt3(sum.OPS):null,                        pct:_lpRank(sum.OPS,lg26.ops),                                     good:true},
        {lbl:'wOBA',       val:sum.wOBA!=null?fmt3(sum.wOBA):null,                      pct:_lpRank(sum.wOBA,lg26.woba),                                  good:true},
        {lbl:'HR',         val:sum.HR!=null?fmtN(sum.HR):null,                          pct:_lpRank(sum.HR,lg26.hr),                                       good:true},
        {lbl:'RBI',        val:_myRBI!=null?fmtN(_myRBI):null,                          pct:_lpRank(_myRBI,_lgRbi),                                        good:true},
        {lbl:'ISO',        val:p26iso!=null?fmt3(p26iso):null,                          pct:_lpRank(p26iso,lg26.iso),                                      good:true},
        {lbl:'BABIP',      val:p26babip!=null?fmt3(p26babip):null,                      pct:_lpRank(p26babip,lg26.babip),                                  good:true},
        {lbl:'PS/PA',      val:sum.PS_PA!=null?fmt2(sum.PS_PA):null,                    pct:_lpRank(sum.PS_PA,lg26.pspa),                                  good:true},
        {lbl:'FP SWING%',  val:sum.FP_SWING_pct!=null?fmt1(sum.FP_SWING_pct)+'%':null,  pct:sum.FP_SWING_pct!=null?1-_lpRank(sum.FP_SWING_pct,lg26.fpSwing):null,good:true},
        {lbl:'IZ SWING%',  val:p26IzSwing!=null?fmt1(p26IzSwing*100)+'%':null,         pct:_lpRank(p26IzSwing,lg26iz.izSwing),                            good:true},
        {lbl:'IZ CONTACT%',val:p26IzContact!=null?fmt1(p26IzContact*100)+'%':null,     pct:_lpRank(p26IzContact,lg26iz.izContact),                        good:true},
        {lbl:'CHASE%',     val:p26Chase!=null?fmt1(p26Chase*100)+'%':null,              pct:p26Chase!=null?1-_lpRank(p26Chase,lg26iz.chase):null,           good:true},
        {lbl:'ZONE%',      val:sum.zone_pct!=null?fmt1(sum.zone_pct)+'%':null,           pct:_lpRank(sum.zone_pct,lg26.zone),                               good:true},
        {lbl:'SWING%',     val:sum.SWING_pct!=null?fmt1(sum.SWING_pct)+'%':null,        pct:sum.SWING_pct!=null?1-_lpRank(sum.SWING_pct,lg26.swing):null,   good:true},
        {lbl:'WHIFF%',     val:sum.WHIFF_pct!=null?fmt1(sum.WHIFF_pct)+'%':null,        pct:sum.WHIFF_pct!=null?1-_lpRank(sum.WHIFF_pct,lg26.whiff):null,   good:true},
        {lbl:'CONTACT%',   val:sum.CONTACT_pct!=null?fmt1(sum.CONTACT_pct)+'%':null,    pct:_lpRank(sum.CONTACT_pct,lg26.contact),                         good:true},
        {lbl:'K%',         val:sum.K_pct!=null?fmt1(sum.K_pct)+'%':null,                pct:sum.K_pct!=null?1-_lpRank(sum.K_pct,lg26.k):null,               good:true},
        {lbl:'BB%',        val:sum.BB_pct!=null?fmt1(sum.BB_pct)+'%':null,              pct:_lpRank(sum.BB_pct,lg26.bb),                                   good:true},
        {lbl:'BB/K',       val:p26BBK!=null?fmt2(p26BBK):null,                          pct:_lpRank(p26BBK,lg26.bbk),                                     good:true},
        {lbl:'2K BA',      val:my2KBA!=null?fmt3(my2KBA):null,                           pct:_lpRank(my2KBA,leagueDisc.twoKba),                             good:true},
        {lbl:'BA RISP',    val:myBARISP!=null?fmt3(myBARISP):null,                       pct:_lpRank(myBARISP,leagueDisc.baRisp),                           good:true},
        {lbl:'PULL%',      val:sum.Pull_pct!=null?fmt1(sum.Pull_pct)+'%':null,           pct:_lpRank(sum.Pull_pct,lg26.pull),                               good:true},
        {lbl:'OPPO%',      val:sum.Oppo_pct!=null?fmt1(sum.Oppo_pct)+'%':null,           pct:_lpRank(sum.Oppo_pct,lg26.oppo),                               good:true},
        {lbl:'GB%',        val:sum.GB_pct!=null?fmt1(sum.GB_pct)+'%':null,              pct:sum.GB_pct!=null?1-_lpRank(sum.GB_pct,lg26.gb):null,            good:true},
        {lbl:'FB%',        val:sum.FB_pct!=null?fmt1(sum.FB_pct)+'%':null,              pct:_lpRank(sum.FB_pct,lg26.fb),                                   good:true},
        {lbl:'LO%',        val:sum.LO_pct!=null?fmt1(sum.LO_pct)+'%':null,              pct:_lpRank(sum.LO_pct,lg26.lo),                                   good:true},
        {lbl:'PU%',        val:sum.PO_pct!=null?fmt1(sum.PO_pct)+'%':null,              pct:sum.PO_pct!=null?1-_lpRank(sum.PO_pct,lg26.po):null,            good:true},
      ].filter(function(b){return b.val!=null&&b.pct!=null;});

    } else {
      // 2025: BA/OBP/SLG/OPS/HR/RBI from IBL History; discipline from PBP only; IZ/Chase from scatter
      var lgIblAvg25=Object.values(DATA.iblHistory||{}).map(function(ss){var s=(ss||[]).filter(function(r){return r.AB>0&&(r.season||'').indexOf(_iblYrB)!==-1;});return s.length&&s[0].AVG!=null?s[0].AVG:null;}).filter(function(v){return v!=null;});
      var lgIblObp25=Object.values(DATA.iblHistory||{}).map(function(ss){var s=(ss||[]).filter(function(r){return r.AB>0&&(r.season||'').indexOf(_iblYrB)!==-1;});return s.length&&s[0].OBP!=null?s[0].OBP:null;}).filter(function(v){return v!=null;});
      var lgIblSlg25=Object.values(DATA.iblHistory||{}).map(function(ss){var s=(ss||[]).filter(function(r){return r.AB>0&&(r.season||'').indexOf(_iblYrB)!==-1;});return s.length&&s[0].SLG!=null?s[0].SLG:null;}).filter(function(v){return v!=null;});
      var lgIblOps25=Object.values(DATA.iblHistory||{}).map(function(ss){var s=(ss||[]).filter(function(r){return r.AB>0&&(r.season||'').indexOf(_iblYrB)!==-1;});return s.length&&s[0].OPS!=null?s[0].OPS:null;}).filter(function(v){return v!=null;});
      var lgIblHr25 =Object.values(DATA.iblHistory||{}).map(function(ss){var s=(ss||[]).filter(function(r){return r.AB>0&&(r.season||'').indexOf(_iblYrB)!==-1;});return s.length&&s[0].HR!=null?s[0].HR:null;}).filter(function(v){return v!=null;});
      var iblBars25=[
        {lbl:'BA', val:_iblS2&&_iblS2.AVG!=null?fmt3(_iblS2.AVG):null, pct:_lpRank(_iblS2&&_iblS2.AVG,lgIblAvg25), good:true},
        {lbl:'OBP',val:_iblS2&&_iblS2.OBP!=null?fmt3(_iblS2.OBP):null, pct:_lpRank(_iblS2&&_iblS2.OBP,lgIblObp25), good:true},
        {lbl:'SLG',val:_iblS2&&_iblS2.SLG!=null?fmt3(_iblS2.SLG):null, pct:_lpRank(_iblS2&&_iblS2.SLG,lgIblSlg25), good:true},
        {lbl:'OPS',val:_iblS2&&_iblS2.OPS!=null?fmt3(_iblS2.OPS):null, pct:_lpRank(_iblS2&&_iblS2.OPS,lgIblOps25), good:true},
        {lbl:'HR', val:_iblS2&&_iblS2.HR!=null?fmtN(_iblS2.HR):null,   pct:_lpRank(_iblS2&&_iblS2.HR, lgIblHr25),  good:true},
        {lbl:'RBI',val:_myRBI!=null?fmtN(_myRBI):null,                  pct:_lpRank(_myRBI,_lgRbi),                 good:true},
      ].filter(function(b){return b.val!=null&&b.pct!=null;});
      var pbpBars25=[];
      var pbp25=getPbpBatter(name);
      if (pbp25) {
        var lgB25=buildPbpBatterLeague();
        var d25=pbp25;
        pbpBars25=[
          {lbl:'ISO',      val:d25.ISO!=null?fmt3(d25.ISO):null,                       pct:_lpRank(d25.ISO,lgB25.iso),                                    good:true},
          {lbl:'BABIP',    val:d25.BABIP!=null?fmt3(d25.BABIP):null,                   pct:_lpRank(d25.BABIP,lgB25.babip),                                good:true},
          {lbl:'PS/PA',    val:d25.PS_PA!=null?fmt2(d25.PS_PA):null,                   pct:_lpRank(d25.PS_PA,lgB25.pspa),                                 good:true},
          {lbl:'FP SWING%',val:d25.FP_SWING_pct!=null?fmt1(d25.FP_SWING_pct)+'%':null, pct:d25.FP_SWING_pct!=null?1-_lpRank(d25.FP_SWING_pct,lgB25.fpSwing):null,good:true},
          {lbl:'SWING%',   val:d25.SWING_pct!=null?fmt1(d25.SWING_pct)+'%':null,       pct:d25.SWING_pct!=null?1-_lpRank(d25.SWING_pct,lgB25.swing):null,  good:true},
          {lbl:'WHIFF%',   val:d25.WHIFF_pct!=null?fmt1(d25.WHIFF_pct)+'%':null,       pct:d25.WHIFF_pct!=null?1-_lpRank(d25.WHIFF_pct,lgB25.whiff):null,  good:true},
          {lbl:'CONTACT%', val:d25.CONTACT_pct!=null?fmt1(d25.CONTACT_pct)+'%':null,   pct:_lpRank(d25.CONTACT_pct,lgB25.contact),                        good:true},
          {lbl:'K%',       val:d25.K_pct!=null?fmt1(d25.K_pct)+'%':null,               pct:d25.K_pct!=null?1-_lpRank(d25.K_pct,lgB25.kpct):null,           good:true},
          {lbl:'BB%',      val:d25.BB_pct!=null?fmt1(d25.BB_pct)+'%':null,             pct:_lpRank(d25.BB_pct,lgB25.bbpct),                               good:true},
          {lbl:'BB/K',     val:d25.BB_K!=null?fmt2(d25.BB_K):null,                     pct:_lpRank(d25.BB_K,lgB25.bbk),                                   good:true},
          {lbl:'GB%',      val:d25.GB_pct!=null?fmt1(d25.GB_pct)+'%':null,             pct:d25.GB_pct!=null?1-_lpRank(d25.GB_pct,lgB25.gb):null,           good:true},
          {lbl:'FB%',      val:d25.FB_pct!=null?fmt1(d25.FB_pct)+'%':null,             pct:_lpRank(d25.FB_pct,lgB25.fb),                                  good:true},
          {lbl:'LO%',      val:d25.LO_pct!=null?fmt1(d25.LO_pct)+'%':null,             pct:_lpRank(d25.LO_pct,lgB25.lo),                                  good:true},
          {lbl:'PU%',      val:d25.PO_pct!=null?fmt1(d25.PO_pct)+'%':null,             pct:d25.PO_pct!=null?1-_lpRank(d25.PO_pct,lgB25.po):null,           good:true},
        ].filter(function(b){return b.val!=null&&b.pct!=null;});
      }
      var IN_PLAY25=['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'];
      var izBars25=[];
      if (sc.length) {
        var lgIzSw25=[],lgIzCon25=[],lgCh25=[];
        DATA.pitches.forEach(function(bp){
          var sc2=bp.scatter||[];
          var inZ2=sc2.filter(function(s){return s.in_zone===true;});
          var izSw2=inZ2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul'||IN_PLAY25.includes(s.outcome);}).length;
          var izCon2=inZ2.filter(function(s){return s.outcome==='Foul'||IN_PLAY25.includes(s.outcome);}).length;
          var ooz2=sc2.filter(function(s){return s.in_zone===false;});
          var ch2=ooz2.filter(function(s){return s.outcome==='Swinging Strike'||s.outcome==='Foul';}).length;
          if(inZ2.length>0) lgIzSw25.push(izSw2/inZ2.length);
          if(izSw2>0) lgIzCon25.push(izCon2/izSw2);
          if(ooz2.length>0) lgCh25.push(ch2/ooz2.length);
        });
        var _izRk;
        if(myIzSwing!=null&&(_izRk=_lpRank(myIzSwing,lgIzSw25))!=null)     izBars25.push({lbl:'IZ SWING%',   val:fmt1(myIzSwing*100)+'%',  pct:_izRk,     good:true});
        if(myIzContact!=null&&(_izRk=_lpRank(myIzContact,lgIzCon25))!=null) izBars25.push({lbl:'IZ CONTACT%', val:fmt1(myIzContact*100)+'%',pct:_izRk,     good:true});
        if(myChase!=null&&(_izRk=_lpRank(myChase,lgCh25))!=null)            izBars25.push({lbl:'CHASE%',       val:fmt1(myChase*100)+'%',    pct:1-_izRk,   good:true});
      }
      allBars=iblBars25.concat(pbpBars25).concat(izBars25);
    }

    if (!allBars.length) {
      return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
    }
    return buildFilteredCard('pct-batter', 'Percentile Stats', pitchCount + ' pitches seen', allBars, 110, null, null);
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
      var _cbYr  = _activeSeason.replace('year:', '');
      var iblSP  = (DATA.iblHistory[name]||[]).filter(function(s){ return s.IP > 0 && (s.season||'').indexOf(_cbYr) !== -1; });
      if (!iblSP.length) iblSP = (DATA.iblHistory[name]||[]).filter(function(s){ return s.IP > 0; });
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
          { lbl: 'FPS%',     val: fpStrikePct!=null ? fmt1(fpStrikePct*100)+'%':'—', pct: fpStrikePct!=null ? lp(fpStrikePct, lgP.fpStrike) : 0, good: true },
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
          { lbl: 'PU%',      val: bip>0          ? fmt1(po/bip*100)+'%'  :'—', pct: bip>0          ? 1-lp(po/bip,      lgP.po)      : 0, good: true },
          // First pitch & 2-strike
          { lbl: 'PUTAWAY%', val: twoKKpct!=null    ? fmt1(twoKKpct*100)+'%'   :'—', pct: twoKKpct!=null    ? lp(twoKKpct,   lgP.twoKK)   : 0, good: true },
        ].filter(function(b){ return b.val !== '—'; })
      };
    }
    var sc     = pitch ? pitch.scatter : [];
    var m      = sc && sc.length ? calcBars(sc) : { bars: [], tot: 0 };
    var tot    = m.tot;
    var lgPpbp = buildPbpPitcherLeague();

    function lpP(val, arr) {
      if (!arr || !arr.length || val == null) return null;
      var below = arr.filter(function(v){ return v < val; }).length;
      var equal = arr.filter(function(v){ return v === val; }).length;
      return (below + equal * 0.5) / arr.length;
    }

    var allBars;

    if (_activeSeason === 'year:2026') {
      // 2026: All from datadiamond (DATA.pitchers); ERA from IBL History; no PBP
      var dp26 = getPitcherDataRow(name);
      var era26 = getSeasonERA(name);
      var _yr26 = _activeSeason.replace('year:','');
      var lgEra26 = Object.values(DATA.iblHistory||{}).map(function(ss){
        var s=(ss||[]).filter(function(r){return r.IP>0&&(r.season||'').indexOf(_yr26)!==-1;});
        return s.length&&s[0].ERA!=null?s[0].ERA:null;
      }).filter(function(v){return v!=null;});
      var dpWhip26 = getPitcherWhipFromData(name);
      var dpIp26   = dp26 ? dp26.IP : null;
      var ipLg26   = DATA.pitchers.filter(function(p){ return p.IP>0; }).map(function(p){ return p.IP; });
      if (!dp26 && era26 == null) {
        return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
      }
      var dp = dp26 || {};
      allBars=[
        {lbl:'ERA',      val:era26!=null?fmt2(era26):null,                            pct:era26!=null?1-lpP(era26,lgEra26):null,                 good:true},
        {lbl:'IP',       val:dpIp26!=null?fmtIP(dpIp26):null,                        pct:lpP(dpIp26,ipLg26),                                    good:true},
        {lbl:'WHIP',     val:dpWhip26!=null?fmt2(dpWhip26):null,                     pct:dpWhip26!=null?1-lpP(dpWhip26,lgPpbp.whip):null,       good:true},
        {lbl:'BA AGNST', val:dp.BA_against!=null?fmt3(dp.BA_against):null,           pct:dp.BA_against!=null?1-lpP(dp.BA_against,lgPpbp.baAgst):null,good:true},
        {lbl:'BABIP',    val:dp.BABIP!=null?fmt3(dp.BABIP):null,                     pct:dp.BABIP!=null?1-lpP(dp.BABIP,lgPpbp.babip):null,      good:true},
        {lbl:'FPS%',     val:dp.FP_STR_pct!=null?fmt1(dp.FP_STR_pct)+'%':null,       pct:lpP(dp.FP_STR_pct,lgPpbp.fpStr),                       good:true},
        {lbl:'EARLY%',   val:dp.Early_pct!=null?fmt1(dp.Early_pct)+'%':null,         pct:lpP(dp.Early_pct,lgPpbp.early),                        good:true},
        {lbl:'AHEAD%',   val:dp.Ahead_pct!=null?fmt1(dp.Ahead_pct)+'%':null,         pct:lpP(dp.Ahead_pct,lgPpbp.ahead),                        good:true},
        {lbl:'E+A%',     val:dp.EA_pct!=null?fmt1(dp.EA_pct)+'%':null,               pct:lpP(dp.EA_pct,lgPpbp.ea),                              good:true},
        {lbl:'K/BB',     val:dp.K_BB!=null?fmt2(dp.K_BB):null,                       pct:lpP(dp.K_BB,lgPpbp.kbb),                               good:true},
        {lbl:'SWING%',   val:dp.SWING_pct!=null?fmt1(dp.SWING_pct)+'%':null,         pct:lpP(dp.SWING_pct,lgPpbp.swing),                        good:true},
        {lbl:'WHIFF%',   val:dp.WHIFF_pct!=null?fmt1(dp.WHIFF_pct)+'%':null,         pct:lpP(dp.WHIFF_pct,lgPpbp.whiff),                        good:true},
        {lbl:'CONTACT%', val:dp.CONTACT_pct!=null?fmt1(dp.CONTACT_pct)+'%':null,     pct:dp.CONTACT_pct!=null?1-lpP(dp.CONTACT_pct,lgPpbp.contact):null,good:true},
        {lbl:'K%',       val:dp.K_pct!=null?fmt1(dp.K_pct)+'%':null,                 pct:lpP(dp.K_pct,lgPpbp.kpct),                             good:true},
        {lbl:'BB%',      val:dp.BB_pct!=null?fmt1(dp.BB_pct)+'%':null,               pct:dp.BB_pct!=null?1-lpP(dp.BB_pct,lgPpbp.bbpct):null,    good:true},
        {lbl:'PUTAWAY%', val:dp.PUTAWAY_pct!=null?fmt1(dp.PUTAWAY_pct)+'%':null,      pct:lpP(dp.PUTAWAY_pct,lgPpbp.putaway),                    good:true},
        {lbl:'GB%',      val:dp.GB_pct!=null?fmt1(dp.GB_pct)+'%':null,               pct:lpP(dp.GB_pct,lgPpbp.gb),                              good:true},
        {lbl:'FB%',      val:dp.FB_pct!=null?fmt1(dp.FB_pct)+'%':null,               pct:dp.FB_pct!=null?1-lpP(dp.FB_pct,lgPpbp.fb):null,       good:true},
        {lbl:'LO%',      val:dp.LO_pct!=null?fmt1(dp.LO_pct)+'%':null,               pct:lpP(dp.LO_pct,lgPpbp.lo),                              good:true},
        {lbl:'PU%',      val:dp.PO_pct!=null?fmt1(dp.PO_pct)+'%':null,               pct:dp.PO_pct!=null?1-lpP(dp.PO_pct,lgPpbp.po):null,       good:true},
      ].filter(function(b){return b.val!=null&&b.pct!=null;});

    } else {
      // 2025: ERA/WHIP/IP/BA from IBL History; discipline from PBP; scatter for season filter
      var pbpPitData = getPbpPitcher(name);
      if (pbpPitData) {
        var dp25 = pbpPitData;
        var dpWhip25 = getSeasonWHIP(name);
        if (dpWhip25 == null && dp25.WHIP != null) dpWhip25 = dp25.WHIP;
        var dpIp25   = getSeasonIP(name);
        var ipLg25   = Object.values(DATA.iblHistory).map(function(ss){
          var r=(ss||[]).filter(function(s){return s.IP>0;});return r.length?r[0].IP:null;
        }).filter(function(v){return v!=null;});
        allBars=[
          {lbl:'ERA',      val:getSeasonERA(name)!=null?fmt2(getSeasonERA(name)):null, pct:getSeasonERA(name)!=null?1-lpP(getSeasonERA(name),lgPpbp.era):null,good:true},
          {lbl:'IP',       val:dpIp25!=null?fmtIP(dpIp25):null,                       pct:lpP(dpIp25,ipLg25),                                              good:true},
          {lbl:'WHIP',     val:dpWhip25!=null?fmt2(dpWhip25):null,                    pct:dpWhip25!=null?1-lpP(dpWhip25,lgPpbp.whip):null,                 good:true},
          {lbl:'BA AGNST', val:dp25.BA_against!=null?fmt3(dp25.BA_against):null,      pct:dp25.BA_against!=null?1-lpP(dp25.BA_against,lgPpbp.baAgst):null, good:true},
          {lbl:'BABIP',    val:dp25.BABIP!=null?fmt3(dp25.BABIP):null,                pct:dp25.BABIP!=null?1-lpP(dp25.BABIP,lgPpbp.babip):null,            good:true},
          {lbl:'FPS%',     val:dp25.FP_STR_pct!=null?fmt1(dp25.FP_STR_pct)+'%':null,  pct:lpP(dp25.FP_STR_pct,lgPpbp.fpStr),                              good:true},
          {lbl:'EARLY%',   val:dp25.Early_pct!=null?fmt1(dp25.Early_pct)+'%':null,    pct:lpP(dp25.Early_pct,lgPpbp.early),                               good:true},
          {lbl:'AHEAD%',   val:dp25.Ahead_pct!=null?fmt1(dp25.Ahead_pct)+'%':null,    pct:lpP(dp25.Ahead_pct,lgPpbp.ahead),                               good:true},
          {lbl:'E+A%',     val:dp25.EA_pct!=null?fmt1(dp25.EA_pct)+'%':null,          pct:lpP(dp25.EA_pct,lgPpbp.ea),                                     good:true},
          {lbl:'K/BB',     val:dp25.K_BB!=null?fmt2(dp25.K_BB):null,                  pct:lpP(dp25.K_BB,lgPpbp.kbb),                                      good:true},
          {lbl:'SWING%',   val:dp25.SWING_pct!=null?fmt1(dp25.SWING_pct)+'%':null,    pct:lpP(dp25.SWING_pct,lgPpbp.swing),                               good:true},
          {lbl:'WHIFF%',   val:dp25.WHIFF_pct!=null?fmt1(dp25.WHIFF_pct)+'%':null,    pct:lpP(dp25.WHIFF_pct,lgPpbp.whiff),                               good:true},
          {lbl:'CONTACT%', val:dp25.CONTACT_pct!=null?fmt1(dp25.CONTACT_pct)+'%':null,pct:dp25.CONTACT_pct!=null?1-lpP(dp25.CONTACT_pct,lgPpbp.contact):null,good:true},
          {lbl:'K%',       val:dp25.K_pct!=null?fmt1(dp25.K_pct)+'%':null,            pct:lpP(dp25.K_pct,lgPpbp.kpct),                                    good:true},
          {lbl:'BB%',      val:dp25.BB_pct!=null?fmt1(dp25.BB_pct)+'%':null,          pct:dp25.BB_pct!=null?1-lpP(dp25.BB_pct,lgPpbp.bbpct):null,          good:true},
          {lbl:'PUTAWAY%', val:dp25.PUTAWAY_pct!=null?fmt1(dp25.PUTAWAY_pct)+'%':null, pct:lpP(dp25.PUTAWAY_pct,lgPpbp.putaway),                           good:true},
          {lbl:'GB%',      val:dp25.GB_pct!=null?fmt1(dp25.GB_pct)+'%':null,          pct:lpP(dp25.GB_pct,lgPpbp.gb),                                     good:true},
          {lbl:'FB%',      val:dp25.FB_pct!=null?fmt1(dp25.FB_pct)+'%':null,          pct:dp25.FB_pct!=null?1-lpP(dp25.FB_pct,lgPpbp.fb):null,             good:true},
          {lbl:'LO%',      val:dp25.LO_pct!=null?fmt1(dp25.LO_pct)+'%':null,          pct:lpP(dp25.LO_pct,lgPpbp.lo),                                     good:true},
          {lbl:'PU%',      val:dp25.PO_pct!=null?fmt1(dp25.PO_pct)+'%':null,          pct:dp25.PO_pct!=null?1-lpP(dp25.PO_pct,lgPpbp.po):null,             good:true},
        ].filter(function(b){return b.val!=null&&b.pct!=null;});
      } else if (m.bars.length) {
        // Scatter-only fallback (no PBP): use calcBars result, but IBL for ERA/IP/WHIP
        allBars = m.bars.filter(function(b){return b.val!==null&&b.val!=='—';});
      } else {
        allBars = [];
      }
    }

    // IBL-only pitcher fallback for any season with no other data
    if (!allBars || !allBars.length) {
      var _iblYrP = _activeSeason.replace('year:','');
      var _iblPit = ((DATA.iblHistory[name]||[]).filter(function(s){
        return s.IP>0&&(s.season||'').indexOf(_iblYrP)!==-1;
      }))[0]||null;
      if (_iblPit) {
        var lgEraFb = Object.values(DATA.iblHistory||{}).map(function(ss){
          var s=(ss||[]).filter(function(r){return r.IP>0&&(r.season||'').indexOf(_iblYrP)!==-1;});
          return s.length&&s[0].ERA!=null?s[0].ERA:null;
        }).filter(function(v){return v!=null;});
        var lgWhipFb= Object.values(DATA.iblHistory||{}).map(function(ss){
          var s=(ss||[]).filter(function(r){return r.IP>0;});
          return s.length&&s[0].WHIP!=null?s[0].WHIP:null;
        }).filter(function(v){return v!=null;});
        function _lpFb(val,arr,inv){
          if(!arr.length||val==null) return null;
          var below=arr.filter(function(v){return v<val;}).length;
          var p=(below+0.5)/arr.length; return inv?1-p:p;
        }
        allBars=[
          {lbl:'ERA', val:_iblPit.ERA!=null?fmt2(_iblPit.ERA):null,   pct:_lpFb(_iblPit.ERA,lgEraFb,true),   good:true},
          {lbl:'WHIP',val:_iblPit.WHIP!=null?fmt2(_iblPit.WHIP):null, pct:_lpFb(_iblPit.WHIP,lgWhipFb,true), good:true},
          {lbl:'IP',  val:_iblPit.IP!=null?fmtIP(_iblPit.IP):null,    pct:0.5,                               good:true},
        ].filter(function(b){return b.val!=null&&b.pct!=null;});
      }
    }

    if (!allBars || !allBars.length) {
      return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
    }

    var html = buildFilteredCard('pct-pitcher', 'Percentile Stats', (tot || 0) + ' batters faced', allBars, 80, null, null);

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

  // IBL-only pitcher fallback
  var _iblYr = _activeSeason.replace('year:','');
  var _iblPitPct = ((DATA.iblHistory[name]||[]).filter(function(s){ return s.IP>0&&(s.season||'').indexOf(_iblYr)!==-1; }))[0]||null;
  if (_iblPitPct) {
    var lgEra2 = Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.IP>0&&(r.season||'').indexOf(_iblYr)!==-1;}); return s.length&&s[0].ERA!=null?s[0].ERA:null; }).filter(function(v){return v!=null;});
    var lgWhip2= Object.values(DATA.iblHistory||{}).map(function(ss){ var s=(ss||[]).filter(function(r){return r.IP>0;}); return s.length&&s[0].WHIP!=null?s[0].WHIP:null; }).filter(function(v){return v!=null;});
    function lpIbl2(val,arr,invert){ if(!arr.length||val==null) return 0; var below=arr.filter(function(v){return v<val;}).length; var p=(below+0.5)/arr.length; return invert?1-p:p; }
    var iblBars = [
      { lbl:'ERA',  val:_iblPitPct.ERA !=null?fmt2(_iblPitPct.ERA) :'—', pct:lpIbl2(_iblPitPct.ERA, lgEra2, true), good:true },
      { lbl:'WHIP', val:_iblPitPct.WHIP!=null?fmt2(_iblPitPct.WHIP):'—', pct:lpIbl2(_iblPitPct.WHIP,lgWhip2,true), good:true },
      { lbl:'IP',   val:_iblPitPct.IP  !=null?fmtIP(_iblPitPct.IP) :'—', pct:0.5, good:true },
    ].filter(function(b){return b.val!=='—';});
    if (iblBars.length) {
      return buildFilteredCard('pct-pitcher','Percentile Stats',
        (_iblPitPct.IP||0)+' IP', iblBars, 80, null, null);
    }
  }

  return '<div class="empty-state"><div class="empty-state-icon">\ud83d\udcca</div><h3>No data available</h3></div>';
}


// -- PITCH USAGE TAB ----------------------------------------
function renderGameLog(name, pitch) {
  // Collect pitcher's pitches — both seasons
  var _nameKey = normPlayerName(name);
  var sc = [];
  var srcData = (_activeSeason === 'year:2026') ? DATA.pitches2026 : DATA.pitches;
  srcData.forEach(function(bp) {
    if (!bp.scatter) return;
    bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === _nameKey) sc.push(s); });
  });
  if (!sc.length && pitch && pitch.scatter) sc = pitch.scatter;

  if (!sc.length) {
    return '<div class="empty-state"><div class="empty-state-icon">&#128203;</div><h3>No game data available</h3></div>';
  }

  // Group by date
  var gameMap = {};
  sc.forEach(function(s) {
    var dt = (s.date || '').slice(0, 10); if (!dt) return;
    if (!gameMap[dt]) gameMap[dt] = []; gameMap[dt].push(s);
  });
  var gameDates = Object.keys(gameMap).sort();

  var PITCH_COLORS = {
    'Fastball':'#f87171','Breaking Ball':'#60a5fa','Offspeed':'#a78bfa',
    'Changeup':'#34d399','Curveball':'#fb923c','Slider':'#facc15',
    'Cutter':'#f472b6','Sinker':'#22d3ee'
  };
  var FALLBACK_COLORS = ['#f87171','#60a5fa','#a78bfa','#34d399','#fb923c','#facc15','#f472b6','#22d3ee'];

  // Season-level pitch type color map
  var allTypeCounts = {};
  sc.forEach(function(s) { var t=s.pitch_type||'Unknown'; allTypeCounts[t]=(allTypeCounts[t]||0)+1; });
  var allTypeSet = Object.keys(allTypeCounts).sort(function(a,b){return allTypeCounts[b]-allTypeCounts[a];});
  var typeColorMap = {};
  allTypeSet.forEach(function(t,i){ typeColorMap[t]=PITCH_COLORS[t]||FALLBACK_COLORS[i%FALLBACK_COLORS.length]; });

  var html =
    '<div class="stat-card">' +
      '<div class="stat-card-header"><span class="stat-card-title">Game Log</span>' +
      '<span class="stat-card-subtitle">'+gameDates.length+' outing'+(gameDates.length!==1?'s':'')+'</span></div>' +
      '<div class="table-wrap"><table class="stat-table" id="gl-table"><thead><tr>' +
      '<th style="text-align:left;width:24px"></th>' +
      '<th style="text-align:left">Date</th><th style="text-align:left">Opp</th>' +
      '<th>P</th><th>FPS%</th><th>STR%</th><th>WHIFF%</th><th>Rest</th>' +
      '</tr></thead><tbody id="gl-tbody"></tbody></table></div>' +
    '</div>';

  // Render rows after DOM is ready
  setTimeout(function() {
    var tbody = document.getElementById('gl-tbody');
    if (!tbody) return;

    // Most recent game expanded by default
    var expandedDate = gameDates.length ? gameDates[gameDates.length - 1] : null;

    function buildRows() {
      tbody.innerHTML = '';
      var today = new Date(); today.setHours(0,0,0,0);
      gameDates.slice().reverse().forEach(function(dt, revIdx) {
        var gsc = gameMap[dt], gTot = gsc.length;
        var gStr = gsc.filter(function(s){return['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome);}).length;
        var gSwS = gsc.filter(function(s){return s.outcome==='Swinging Strike';}).length;
        var gFo  = gsc.filter(function(s){return s.outcome==='Foul';}).length;
        var gIP  = gsc.filter(function(s){return['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome);}).length;
        var gSw  = gSwS + gFo + gIP;
        var gFP  = gsc.filter(function(s){return (s.count||'').replace(/^'/,'')==='0-0';}).length;
        var gFPS = gsc.filter(function(s){
          return (s.count||'').replace(/^'/,'')==='0-0' &&
            ['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome);
        }).length;

        // Opponent: try batter_team on any pitch in this game, resolve to abbreviation
        var oppLabel = '--';
        for (var pi=0; pi<gsc.length; pi++) {
          var bt = gsc[pi].batter_team;
          if (bt && bt.trim()) {
            var resolved = resolveTeam(bt);
            oppLabel = resolved ? resolved.abbreviation : bt.trim().slice(0,3).toUpperCase();
            break;
          }
        }

        // Rest = days since game date to TODAY (not prior game)
        var gameDate = new Date(dt + 'T12:00:00');
        var restDays = Math.floor((today - gameDate) / 86400000);
        var restStr = restDays === 0 ? 'Today' : restDays === 1 ? '1d' : restDays + 'd';

        var dObj = new Date(dt+'T12:00:00');
        var dateLabel = dObj.toLocaleDateString('en-CA',{month:'short',day:'numeric'}).toUpperCase();
        var isOpen = dt === expandedDate;

        var summaryRow = document.createElement('tr');
        summaryRow.style.cssText = 'cursor:pointer;' + (isOpen ? 'background:rgba(255,184,28,0.06);' : '');
        summaryRow.dataset.date = dt;
        summaryRow.innerHTML =
          '<td style="padding-left:12px;color:rgba(255,184,28,0.7);font-size:14px">' + (isOpen ? '▾' : '▸') + '</td>' +
          '<td style="white-space:nowrap;font-family:var(--font-mono);font-size:11px">' + dateLabel + '</td>' +
          '<td><span style="font-family:var(--font-mono);font-size:11px;font-weight:600">' + oppLabel + '</span></td>' +
          '<td>' + gTot + '</td>' +
          '<td>' + (gFP>0  ? fmt1(gFPS/gFP*100)+'%'  : '--') + '</td>' +
          '<td>' + (gTot>0 ? fmt1(gStr/gTot*100)+'%' : '--') + '</td>' +
          '<td>' + (gSw>0  ? fmt1(gSwS/gSw*100)+'%'  : '--') + '</td>' +
          '<td style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.5)">' + restStr + '</td>';
        tbody.appendChild(summaryRow);

        // Detail row
        var detailRow = document.createElement('tr');
        detailRow.id = 'gl-detail-' + dt.replace(/-/g,'');
        detailRow.style.display = isOpen ? '' : 'none';
        var detailCell = document.createElement('td');
        detailCell.colSpan = 11;
        detailCell.style.cssText = 'padding:0;background:rgba(10,14,30,0.6);border-top:none';
        detailCell.innerHTML = buildGameDetail(dt, gsc, typeColorMap);
        detailRow.appendChild(detailCell);
        tbody.appendChild(detailRow);

        summaryRow.addEventListener('click', function() {
          var wasOpen = expandedDate === dt;
          expandedDate = wasOpen ? null : dt;
          buildRows();
          if (!wasOpen) {
            // Draw canvas after DOM update
            setTimeout(function() { drawGameCanvas(dt, gsc, typeColorMap); }, 30);
          }
        });

        if (isOpen) {
          setTimeout(function() { drawGameCanvas(dt, gsc, typeColorMap); }, 60);
        }
      });
    }

    function buildGameDetail(dt, gsc, tcMap) {
      var gTot = gsc.length;
      var typeCounts = {};
      gsc.forEach(function(s){ var t=s.pitch_type||'Unknown'; typeCounts[t]=(typeCounts[t]||0)+1; });
      var typeSet = Object.keys(typeCounts).sort(function(a,b){return typeCounts[b]-typeCounts[a];});

      // Pitch type filter buttons
      var filterBtns = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">' +
        '<button class="gl-pt-btn active" data-type="all" data-dt="'+dt+'" style="'+glBtnStyle(true)+'">All</button>' +
        typeSet.map(function(t){
          var c = tcMap[t]||'#888';
          return '<button class="gl-pt-btn" data-type="'+t+'" data-dt="'+dt+'" style="'+glBtnStyle(false)+';border-color:'+c+'">' +
            '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+c+';margin-right:5px"></span>' +
            t+' <span style="opacity:0.5">'+fmt1(typeCounts[t]/gTot*100)+'%</span></button>';
        }).join('') +
      '</div>' +
      // Batter handedness filter
      '<div style="display:flex;gap:6px;margin-bottom:12px">' +
        '<span style="font-family:var(--font-mono);font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:0.08em;align-self:center">BATTER</span>' +
        '<button class="gl-hand-btn active" data-hand="all" data-dt="'+dt+'" style="'+glBtnStyle(true)+'">All</button>' +
        '<button class="gl-hand-btn" data-hand="R" data-dt="'+dt+'" style="'+glBtnStyle(false)+'">RHB</button>' +
        '<button class="gl-hand-btn" data-hand="L" data-dt="'+dt+'" style="'+glBtnStyle(false)+'">LHB</button>' +
      '</div>';

      var canvasId = 'gl-canvas-' + dt.replace(/-/g,'');
      var viewToggle =
        '<div style="display:flex;gap:6px;margin-bottom:12px">' +
          '<button class="gl-view-btn active zone-filter-btn" data-view="scatter" data-dt="'+dt+'" style="font-size:10px;padding:4px 12px">Scatter</button>' +
          '<button class="gl-view-btn zone-filter-btn" data-view="heatmap" data-dt="'+dt+'" style="font-size:10px;padding:4px 12px">Heat Map</button>' +
        '</div>';
      return '<div style="padding:16px 24px">' +
        // Filter buttons full-width on top
        filterBtns +
        '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">' +
        '<div style="flex-shrink:0">' +
          viewToggle +
          '<canvas id="'+canvasId+'" width="480" height="660" style="width:300px;height:413px;display:block"></canvas>' +
        '</div>' +
        // Per-pitch type breakdown table
        '<div style="flex:1;min-width:200px">' +
          '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">By Pitch Type</div>' +
          '<table class="stat-table" style="margin-bottom:20px"><thead><tr>' +
          '<th style="text-align:left">Type</th><th>#</th><th>%</th><th>STR%</th><th>WHIFF%</th><th>Chase%</th>' +
          '</tr></thead><tbody>' +
          typeSet.map(function(t){
            var pts = gsc.filter(function(s){return (s.pitch_type||'Unknown')===t;});
            var n = pts.length;
            var str = pts.filter(function(s){return['Called Strike','Swinging Strike','Foul','Strikeout Swinging','Strikeout Looking'].includes(s.outcome);}).length;
            var swS = pts.filter(function(s){return s.outcome==='Swinging Strike';}).length;
            var fo  = pts.filter(function(s){return s.outcome==='Foul';}).length;
            var ip  = pts.filter(function(s){return['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Truncated Out','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome);}).length;
            var sw  = swS+fo+ip;
            var oozP = pts.filter(function(s){return s.in_zone===false||s.in_zone==='false';});
            var chaseSwP = oozP.filter(function(s){return['Swinging Strike','Foul','Strikeout Swinging','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Error','Sacrifice Fly','Sacrifice Bunt'].includes(s.outcome);}).length;
            var chaseP = oozP.length>=2 ? fmt1(chaseSwP/oozP.length*100)+'%' : '--';
            var dot = tcMap[t]||'#888';
            return '<tr>' +
              '<td style="text-align:left"><span style="display:inline-flex;align-items:center;gap:6px">' +
                '<span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex-shrink:0"></span>' +
                '<span style="color:var(--text)">'+t+'</span></span></td>' +
              '<td>'+n+'</td>' +
              '<td class="highlight-val">'+fmt1(n/gTot*100)+'%</td>' +
              '<td>'+(n>0?fmt1(str/n*100)+'%':'--')+'</td>' +
              '<td>'+(sw>0?fmt1(swS/sw*100)+'%':'--')+'</td>' +
              '<td>'+chaseP+'</td>' +
              '</tr>';
          }).join('') +
          '</tbody></table>' +
          // PA-level outcomes
          '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Outcomes</div>' +
          buildOutcomeList(gsc) +
        '</div>' +
      '</div>' +
      '</div>';
    }

    function buildOutcomeList(gsc) {
      var counts = {};
      gsc.forEach(function(s){ var o=s.outcome||'Unknown'; counts[o]=(counts[o]||0)+1; });
      var entries = Object.entries(counts).sort(function(a,b){return b[1]-a[1];}).slice(0,10);
      return '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        entries.map(function(e){
          return '<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.05);border-radius:4px">' +
            '<span style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.7)">'+e[0]+'</span>' +
            '<span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#FFB81C">'+e[1]+'</span>' +
            '</div>';
        }).join('') +
      '</div>';
    }

    // Per-game view state: scatter or heatmap
    var glViewMode = {};   // keyed by dt

    function drawGameCanvas(dt, gsc, tcMap) {
      var canvasId = 'gl-canvas-' + dt.replace(/-/g,'');
      var canvas = document.getElementById(canvasId);
      if (!canvas) return;
      var allPts = gsc.filter(function(s){ return s.x!=null && s.y!=null; });
      if (!allPts.length) return;

      var mode = glViewMode[dt] || 'scatter';

      // Canvas sizing — match Strike Zone section exactly
      var DPR = window.devicePixelRatio || 1;
      var CSS_W = 300, CSS_H = 413;
      canvas.width  = CSS_W * DPR;
      canvas.height = CSS_H * DPR;
      canvas.style.width  = CSS_W + 'px';
      canvas.style.height = CSS_H + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(DPR, DPR);
      ctx.clearRect(0, 0, CSS_W, CSS_H);

      var W = CSS_W, H = CSS_H;
      var PAD_L=32, PAD_R=12, PAD_T=12, PAD_B=32;
      var PW = W-PAD_L-PAD_R, PH = H-PAD_T-PAD_B;

      // Fixed bounds — same for both scatter and heatmap so zone never jumps
      var X_MIN=-2.5, X_MAX=2.5, Y_MIN=-0.8, Y_MAX=2.2;

      function toCx(x){ return PAD_L+((x-X_MIN)/(X_MAX-X_MIN))*PW; }
      function toCy(y){ return PAD_T+PH-((y-Y_MIN)/(Y_MAX-Y_MIN))*PH; }

      var zx1=toCx(-1),zx2=toCx(1),zy1=toCy(1),zy2=toCy(0);

      // POV label
      ctx.save();
      ctx.font='bold 9px DM Mono,monospace';
      ctx.fillStyle='rgba(255,184,28,0.75)';
      ctx.textAlign='center';
      ctx.fillText("FROM A PITCHER'S POV",(zx1+zx2)/2,zy1-6);
      ctx.restore();

      if (mode==='heatmap') {
        // KDE heatmap — identical to Strike Zone section
        drawKdeHeatmap(ctx, allPts, W, H, PAD_L, PAD_R, PAD_T, PAD_B, X_MIN, X_MAX, Y_MIN, Y_MAX);
      } else {
        // Scatter dots — solid color by pitch type, no symbols
        allPts.forEach(function(s) {
          var t=s.pitch_type||'Unknown', color=tcMap[t]||'#888';
          var cx=toCx(s.x), cy=toCy(s.y);
          ctx.beginPath(); ctx.arc(cx,cy,5,0,Math.PI*2);
          ctx.fillStyle=color+'cc'; ctx.fill();
          ctx.strokeStyle=color; ctx.lineWidth=1; ctx.stroke();
        });
      }

      // Zone fill + border + grid — always drawn on top
      ctx.fillStyle='rgba(255,184,28,0.03)';
      ctx.fillRect(zx1,zy1,zx2-zx1,zy2-zy1);
      ctx.strokeStyle='rgba(255,184,28,0.85)'; ctx.lineWidth=2;
      ctx.strokeRect(zx1,zy1,zx2-zx1,zy2-zy1);
      var cw=(zx2-zx1)/3, ch=(zy2-zy1)/3;
      ctx.strokeStyle='rgba(255,184,28,0.25)'; ctx.lineWidth=0.8;
      for(var i=1;i<3;i++){
        ctx.beginPath();ctx.moveTo(zx1+cw*i,zy1);ctx.lineTo(zx1+cw*i,zy2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(zx1,zy1+ch*i);ctx.lineTo(zx2,zy1+ch*i);ctx.stroke();
      }
    }

    function glBtnStyle(active) {
      return 'font-family:var(--font-mono);font-size:10px;padding:4px 10px;border-radius:4px;cursor:pointer;' +
             'border:1px solid rgba(255,255,255,0.2);background:' + (active ? 'rgba(255,184,28,0.15)' : 'rgba(255,255,255,0.05)') +
             ';color:' + (active ? '#FFB81C' : 'rgba(255,255,255,0.6)') + ';transition:all 0.15s';
    }

    // Wire pitch type filter + scatter/heatmap toggle — delegated
    document.addEventListener('click', function glFilter(e) {
      // Pitch type filter
      var ptBtn = e.target.closest('.gl-pt-btn');
      if (ptBtn) {
        var dt2 = ptBtn.dataset.dt, type2 = ptBtn.dataset.type;
        var gsc2 = gameMap[dt2]; if (!gsc2) return;
        document.querySelectorAll('.gl-pt-btn[data-dt="'+dt2+'"]').forEach(function(b) {
          b.style.background='rgba(255,255,255,0.05)'; b.style.color='rgba(255,255,255,0.6)'; b.classList.remove('active');
        });
        ptBtn.style.background='rgba(255,184,28,0.15)'; ptBtn.style.color='#FFB81C'; ptBtn.classList.add('active');
        var activeHand2 = document.querySelector('.gl-hand-btn.active[data-dt="'+dt2+'"]');
        var handF2 = activeHand2 ? activeHand2.dataset.hand : 'all';
        var filtered = gsc2;
        if (handF2 !== 'all') filtered = filtered.filter(function(s){ return s.batter_side === handF2; });
        if (type2 !== 'all') filtered = filtered.filter(function(s){ return (s.pitch_type||'Unknown')===type2; });
        drawGameCanvas(dt2, filtered, typeColorMap);
        return;
      }
      // Batter hand filter
      var hBtn = e.target.closest('.gl-hand-btn');
      if (hBtn) {
        var dt4 = hBtn.dataset.dt, hand4 = hBtn.dataset.hand;
        var gsc4 = gameMap[dt4]; if (!gsc4) return;
        document.querySelectorAll('.gl-hand-btn[data-dt="'+dt4+'"]').forEach(function(b){
          b.style.background='rgba(255,255,255,0.05)'; b.style.color='rgba(255,255,255,0.6)'; b.classList.remove('active');
        });
        hBtn.style.background='rgba(255,184,28,0.15)'; hBtn.style.color='#FFB81C'; hBtn.classList.add('active');
        var activePT4 = document.querySelector('.gl-pt-btn.active[data-dt="'+dt4+'"]');
        var ptType4 = activePT4 ? activePT4.dataset.type : 'all';
        var filtered4 = gsc4;
        if (hand4 !== 'all') filtered4 = filtered4.filter(function(s){ return s.batter_side === hand4; });
        if (ptType4 !== 'all') filtered4 = filtered4.filter(function(s){ return (s.pitch_type||'Unknown')===ptType4; });
        drawGameCanvas(dt4, filtered4, typeColorMap);
        return;
      }
      // Scatter / Heat Map toggle
      var vBtn = e.target.closest('.gl-view-btn');
      if (vBtn) {
        var dt3 = vBtn.dataset.dt, view3 = vBtn.dataset.view;
        var gsc3 = gameMap[dt3]; if (!gsc3) return;
        document.querySelectorAll('.gl-view-btn[data-dt="'+dt3+'"]').forEach(function(b){ b.classList.remove('active'); });
        vBtn.classList.add('active');
        glViewMode[dt3] = view3;
        // Get currently active pitch type + hand filters
        var activePT = document.querySelector('.gl-pt-btn.active[data-dt="'+dt3+'"]');
        var ptType = activePT ? activePT.dataset.type : 'all';
        var activeH = document.querySelector('.gl-hand-btn.active[data-dt="'+dt3+'"]');
        var handF = activeH ? activeH.dataset.hand : 'all';
        var filtered3 = gsc3;
        if (handF !== 'all') filtered3 = filtered3.filter(function(s){ return s.batter_side === handF; });
        if (ptType !== 'all') filtered3 = filtered3.filter(function(s){ return (s.pitch_type||'Unknown')===ptType; });
        drawGameCanvas(dt3, filtered3, typeColorMap);
        return;
      }
    });

    buildRows();
  }, 0);

  return html;
}


function renderBatterGameLog(name, pitch) {
  var sc = pitch && pitch.scatter ? pitch.scatter : [];
  if (!sc.length) return '<div class="stat-card"><div class="stat-card-header"><span class="stat-card-title">Game Log</span></div><div style="padding:20px;color:rgba(255,255,255,0.4);font-family:var(--font-mono);font-size:12px">No pitch data available.</div></div>';

  // Group by date
  var gameMap = {};
  sc.forEach(function(s) {
    var dt = (s.date || '').slice(0, 10); if (!dt) return;
    if (!gameMap[dt]) gameMap[dt] = []; gameMap[dt].push(s);
  });
  var gameDates = Object.keys(gameMap).sort();

  return '<div class="stat-card">' +
    '<div class="stat-card-header"><span class="stat-card-title">Game Log</span>' +
    '<span class="stat-card-subtitle">'+gameDates.length+' game'+(gameDates.length!==1?'s':'')+'</span></div>' +
    '<div class="table-wrap"><table class="stat-table" id="bgl-table"><thead><tr>' +
    '<th style="text-align:left;width:24px"></th>' +
    '<th style="text-align:left">Date</th><th style="text-align:left">Opp</th>' +
    '<th>P</th><th>PA</th><th>AVG</th><th>WHIFF%</th><th>Chase%</th>' +
    '</tr></thead><tbody id="bgl-tbody"></tbody></table></div>' +
  '</div>';
}

function initBatterGameLog(name, pitch) {
  var tbody = document.getElementById('bgl-tbody');
  if (!tbody) return;
  var sc = pitch && pitch.scatter ? pitch.scatter : [];
  if (!sc.length) return;

  var gameMap = {};
  sc.forEach(function(s) {
    var dt = (s.date || '').slice(0, 10); if (!dt) return;
    if (!gameMap[dt]) gameMap[dt] = []; gameMap[dt].push(s);
  });
  var gameDates = Object.keys(gameMap).sort();

  // Heatmap modes
  var HM_MODES = [
    { id:'pitches', label:'Pitches',  color:'#60a5fa', fn: function(s){ return true; } },
    { id:'whiffs',  label:'Whiffs',   color:'#f87171', fn: function(s){ return s.outcome==='Swinging Strike'; } },
    { id:'contact', label:'Contact',  color:'#34d399', fn: function(s){ return ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Sacrifice Fly','Sacrifice Bunt','Truncated Out'].includes(s.outcome); } },
    { id:'hits',    label:'Hits',     color:'#FFB81C', fn: function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); } }
  ];

  var CONTACT_OUTCOMES = ['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Triple Play','Error','Sacrifice Fly','Sacrifice Bunt','Truncated Out'];
  var HIT_OUTCOMES     = ['Single','Double','Triple','Home Run'];
  var SWING_OUTCOMES   = ['Swinging Strike','Foul','Strikeout Swinging'].concat(CONTACT_OUTCOMES);
  var OOZ              = function(s){ return s.in_zone===false||s.in_zone==='false'; };

  var expandedDate = gameDates.length ? gameDates[gameDates.length-1] : null;
  var activeMode = 'pitches';

  function buildBglRows() {
    tbody.innerHTML = '';
    var today = new Date(); today.setHours(0,0,0,0);
    gameDates.slice().reverse().forEach(function(dt) {
      var gsc = gameMap[dt], gTot = gsc.length;
      // PA = pitches that start a new count (0-0) roughly = PAs faced, or count unique at-bats
      var paSet = {}; gsc.forEach(function(s){ var ab=s.at_bat_id||s.ab_id||(s.batter+'_'+dt+'_'+(s.count||'')); paSet[ab]=1; });
      var paCount = Object.keys(paSet).length || gsc.filter(function(s){ return (s.count||'').replace(/^'/,'')===('0-0'); }).length;
      // Hits and AB for AVG
      var hits = gsc.filter(function(s){ return HIT_OUTCOMES.includes(s.outcome); }).length;
      var ab   = gsc.filter(function(s){ return CONTACT_OUTCOMES.concat(['Strikeout Swinging','Strikeout Looking']).includes(s.outcome); }).length;
      var avgStr = ab>0 ? (hits/ab).toFixed(3).replace('0.','.') : '--';
      // Whiff%
      var swings = gsc.filter(function(s){ return SWING_OUTCOMES.includes(s.outcome); }).length;
      var swStr  = gsc.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
      var whiffStr = swings>0 ? fmt1(swStr/swings*100)+'%' : '--';
      // Chase%
      var ooz = gsc.filter(OOZ);
      var chaseSwings = ooz.filter(function(s){ return SWING_OUTCOMES.includes(s.outcome); }).length;
      var chaseStr = ooz.length>=3 ? fmt1(chaseSwings/ooz.length*100)+'%' : '--';
      // Opponent
      var oppLabel = '--';
      for (var pi=0; pi<gsc.length; pi++) {
        var bt = gsc[pi].pitcher_team || gsc[pi].team;
        if (bt && bt.trim()) { var res=resolveTeam(bt); oppLabel=res?res.abbreviation:bt.trim().slice(0,3).toUpperCase(); break; }
      }
      var gameDate = new Date(dt+'T12:00:00');
      var restDays = Math.floor((today-gameDate)/86400000);
      var dateLabel = gameDate.toLocaleDateString('en-CA',{month:'short',day:'numeric'}).toUpperCase();
      var isOpen = dt===expandedDate;

      var summaryRow = document.createElement('tr');
      summaryRow.style.cssText = 'cursor:pointer;'+(isOpen?'background:rgba(255,184,28,0.06);':'');
      summaryRow.innerHTML =
        '<td style="padding-left:12px;color:rgba(255,184,28,0.7);font-size:14px">'+(isOpen?'▾':'▸')+'</td>'+
        '<td style="white-space:nowrap;font-family:var(--font-mono);font-size:11px">'+dateLabel+'</td>'+
        '<td><span style="font-family:var(--font-mono);font-size:11px;font-weight:600">'+oppLabel+'</span></td>'+
        '<td>'+gTot+'</td><td>'+paCount+'</td><td class="highlight-val">'+avgStr+'</td>'+
        '<td>'+whiffStr+'</td><td>'+chaseStr+'</td>';
      tbody.appendChild(summaryRow);

      // Detail row with heatmaps
      var detailRow = document.createElement('tr');
      detailRow.id = 'bgl-detail-'+dt.replace(/-/g,'');
      detailRow.style.display = isOpen ? '' : 'none';
      var detailCell = document.createElement('td');
      detailCell.colSpan = 8;
      detailCell.style.cssText = 'padding:0;background:rgba(10,14,30,0.6);border-top:none';
      detailCell.innerHTML = buildBatterDetail(dt, gsc);
      detailRow.appendChild(detailCell);
      tbody.appendChild(detailRow);

      summaryRow.addEventListener('click', function() {
        var wasOpen = expandedDate === dt;
        expandedDate = wasOpen ? null : dt;
        buildBglRows();
        if (!wasOpen) setTimeout(function(){ drawAllHeatmaps(dt, gsc); }, 30);
      });
      if (isOpen) setTimeout(function(){ drawAllHeatmaps(dt, gsc); }, 60);
    });
  }

  var bglViewMode = {};  // 'scatter' or 'heatmap' per date

  function hexToRgb(hex) {
    var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
    return r+','+g+','+b;
  }

  function bglBtnStyle(active, color) {
    return 'font-family:var(--font-mono);font-size:10px;padding:4px 10px;border-radius:4px;cursor:pointer;' +
      'border:1px solid ' + (active ? (color||'rgba(255,184,28,0.8)') : 'rgba(255,255,255,0.2)') + ';' +
      'background:' + (active ? ('rgba('+hexToRgb(color||'#FFB81C')+',0.15)') : 'rgba(255,255,255,0.05)') + ';' +
      'color:' + (active ? (color||'#FFB81C') : 'rgba(255,255,255,0.6)') + ';transition:all 0.15s';
  }

  function buildBatterDetail(dt, gsc) {
    var gTot = gsc.length;
    // Outcome breakdown
    var outcomeCounts = {};
    gsc.forEach(function(s){ var o=s.outcome||'Unknown'; outcomeCounts[o]=(outcomeCounts[o]||0)+1; });
    var outcomeEntries = Object.entries(outcomeCounts).sort(function(a,b){return b[1]-a[1];}).slice(0,10);

    // Pitch type breakdown
    var typeCounts2 = {};
    gsc.forEach(function(s){ var t=s.pitch_type||'Unknown'; typeCounts2[t]=(typeCounts2[t]||0)+1; });
    var typeSet2 = Object.keys(typeCounts2).sort(function(a,b){return typeCounts2[b]-typeCounts2[a];});
    var BATTER_PITCH_COLORS = {'Fastball':'#f87171','Breaking Ball':'#60a5fa','Offspeed':'#a78bfa','Changeup':'#34d399','Curveball':'#fb923c','Slider':'#facc15','Cutter':'#f472b6','Sinker':'#22d3ee'};
    var FB_COLORS2 = ['#f87171','#60a5fa','#a78bfa','#34d399','#fb923c','#facc15','#f472b6','#22d3ee'];
    var typeColorMap2 = {};
    typeSet2.forEach(function(t,i){ typeColorMap2[t]=BATTER_PITCH_COLORS[t]||FB_COLORS2[i%FB_COLORS2.length]; });

    var modeBtns = HM_MODES.map(function(m, i){
      var active = i===0;
      return '<button class="bgl-mode-btn '+(active?'active':'')+'" data-mode="'+m.id+'" data-dt="'+dt+'" '+
        'style="'+bglBtnStyle(active, m.color)+'">'+m.label+'</button>';
    }).join('');

    // Pitch type filter buttons — same style as pitcher game log
    var ptFilterBtns =
      '<button class="bgl-pt-btn active" data-type="all" data-dt="'+dt+'" style="'+bglBtnStyle(true,'#FFB81C')+'">All</button>' +
      typeSet2.map(function(t){
        var c = typeColorMap2[t]||'#888';
        return '<button class="bgl-pt-btn" data-type="'+t+'" data-dt="'+dt+'" style="'+bglBtnStyle(false,c)+';border-color:'+c+'">' +
          '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+c+';margin-right:5px"></span>' +
          t+'</button>';
      }).join('');

    var viewToggle =
      '<button class="bgl-view-btn active zone-filter-btn" data-view="scatter" data-dt="'+dt+'" style="font-size:10px;padding:4px 12px;margin-right:6px">Scatter</button>' +
      '<button class="bgl-view-btn zone-filter-btn" data-view="heatmap" data-dt="'+dt+'" style="font-size:10px;padding:4px 12px">Heat Map</button>';

    var canvasId = 'bgl-hm-'+dt.replace(/-/g,'');

    var OOZ_FN = function(s){ return s.in_zone===false||s.in_zone==='false'; };
    var SWING_OUTS2 = ['Swinging Strike','Foul','Strikeout Swinging','Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Error','Sacrifice Fly'];
    var pitchTypeRows = typeSet2.map(function(t){
      var pts2 = gsc.filter(function(s){return (s.pitch_type||'Unknown')===t;});
      var n = pts2.length;
      var swS = pts2.filter(function(s){return s.outcome==='Swinging Strike';}).length;
      var fo  = pts2.filter(function(s){return s.outcome==='Foul';}).length;
      var ip  = pts2.filter(function(s){return['Single','Double','Triple','Home Run','Groundout','Flyout','Popout','Lineout','Double Play','Error','Sacrifice Fly'].includes(s.outcome);}).length;
      var sw  = swS+fo+ip;
      var ooz = pts2.filter(OOZ_FN);
      var chaseSw = ooz.filter(function(s){return SWING_OUTS2.includes(s.outcome);}).length;
      var chaseStr = ooz.length>=2 ? fmt1(chaseSw/ooz.length*100)+'%' : '--';
      var dot = typeColorMap2[t]||'#888';
      return '<tr>' +
        '<td style="text-align:left"><span style="display:inline-flex;align-items:center;gap:6px">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex-shrink:0"></span>' +
          '<span>'+t+'</span></span></td>' +
        '<td>'+n+'</td>' +
        '<td class="highlight-val">'+fmt1(n/gTot*100)+'%</td>' +
        '<td>'+(sw>0?fmt1(swS/sw*100)+'%':'--')+'</td>' +
        '<td>'+chaseStr+'</td>' +
        '</tr>';
    }).join('');

    return '<div style="padding:20px 24px">' +
      // Mode filter buttons full-width on top
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap">' +
        modeBtns +
      '</div>' +
      // Pitch type filter buttons
      '<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;flex-wrap:wrap">' +
        ptFilterBtns +
      '</div>' +
      '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">' +
      // Left: scatter/heatmap toggle + canvas
      '<div style="flex-shrink:0">' +
        '<div style="margin-bottom:10px">' + viewToggle + '</div>' +
        '<canvas id="'+canvasId+'" width="480" height="660" style="width:300px;height:413px;display:block;border-radius:4px"></canvas>' +
      '</div>' +
      // Right: stats
      '<div style="flex:1;min-width:200px">' +
        '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">By Pitch Type</div>' +
        '<table class="stat-table" style="margin-bottom:20px"><thead><tr>' +
          '<th style="text-align:left">Type</th><th>#</th><th>%</th><th>WHIFF%</th><th>Chase%</th>' +
        '</tr></thead><tbody>' + pitchTypeRows + '</tbody></table>' +
        '<div style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Outcomes</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
          outcomeEntries.map(function(e){
            return '<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.05);border-radius:4px">' +
              '<span style="font-family:var(--font-mono);font-size:11px;color:rgba(255,255,255,0.7)">'+e[0]+'</span>' +
              '<span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#FFB81C">'+e[1]+'</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '</div>' +
    '</div>';
  }

  function drawAllHeatmaps(dt, gsc) {
    var view = bglViewMode[dt] || 'scatter';
    // Draw single canvas with active mode
    var activeModId = (document.querySelector('.bgl-mode-btn.active[data-dt="'+dt+'"]')||{dataset:{mode:'pitches'}}).dataset.mode;
    var activeM = HM_MODES.find(function(x){ return x.id===activeModId; }) || HM_MODES[0];
    drawBatterCanvas(dt, gsc, activeM, view);
    // Helper: get current filtered gsc (pitch type filter)
    function getBglFiltered() {
      var activePT = document.querySelector('.bgl-pt-btn.active[data-dt="'+dt+'"]');
      var ptType = activePT ? activePT.dataset.type : 'all';
      return ptType === 'all' ? gsc : gsc.filter(function(s){ return (s.pitch_type||'Unknown') === ptType; });
    }
    // Wire pitch type filter buttons
    document.querySelectorAll('.bgl-pt-btn[data-dt="'+dt+'"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bgl-pt-btn[data-dt="'+dt+'"]').forEach(function(b){
          b.classList.remove('active');
          b.style.background='rgba(255,255,255,0.05)'; b.style.color='rgba(255,255,255,0.6)';
        });
        btn.classList.add('active');
        btn.style.background='rgba(255,184,28,0.15)'; btn.style.color='#FFB81C';
        var m = HM_MODES.find(function(x){ return x.id===(document.querySelector('.bgl-mode-btn.active[data-dt="'+dt+'"]')||{dataset:{mode:'pitches'}}).dataset.mode; }) || HM_MODES[0];
        drawBatterCanvas(dt, getBglFiltered(), m, bglViewMode[dt]||'scatter');
      });
    });
    // Wire mode buttons
    document.querySelectorAll('.bgl-mode-btn[data-dt="'+dt+'"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bgl-mode-btn[data-dt="'+dt+'"]').forEach(function(b){
          b.style.background='rgba(255,255,255,0.05)'; b.style.color='rgba(255,255,255,0.55)';
          b.style.borderColor='rgba(255,255,255,0.2)'; b.classList.remove('active');
        });
        var m = HM_MODES.find(function(x){ return x.id===btn.dataset.mode; });
        if (m) {
          btn.style.background='rgba('+hexToRgb(m.color)+',0.15)';
          btn.style.color=m.color; btn.style.borderColor=m.color; btn.classList.add('active');
        }
        var v = bglViewMode[dt] || 'scatter';
        if (m) drawBatterCanvas(dt, getBglFiltered(), m, v);
      });
    });
    // Wire view toggle
    document.querySelectorAll('.bgl-view-btn[data-dt="'+dt+'"]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bgl-view-btn[data-dt="'+dt+'"]').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        bglViewMode[dt] = btn.dataset.view;
        var v = btn.dataset.view;
        var aM2 = HM_MODES.find(function(x){ return x.id===(document.querySelector('.bgl-mode-btn.active[data-dt="'+dt+'"]')||{dataset:{mode:'pitches'}}).dataset.mode; }) || HM_MODES[0];
        drawBatterCanvas(dt, getBglFiltered(), aM2, v);
      });
    });
  }

  function drawBatterCanvas(dt, gsc, mode, view) {
    var canvasId = 'bgl-hm-'+dt.replace(/-/g,'');
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;

    var DPR = window.devicePixelRatio || 1;
    var CSS_W = 300, CSS_H = 413;
    canvas.width  = CSS_W * DPR;
    canvas.height = CSS_H * DPR;
    canvas.style.width  = CSS_W+'px';
    canvas.style.height = CSS_H+'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, CSS_W, CSS_H);

    var W = CSS_W, H = CSS_H;
    var PAD_L=32, PAD_R=12, PAD_T=12, PAD_B=32;
    var PW=W-PAD_L-PAD_R, PH=H-PAD_T-PAD_B;

    // Fixed bounds — same for both scatter and heatmap so zone never jumps
    var X_MIN=-2.5, X_MAX=2.5, Y_MIN=-0.8, Y_MAX=2.2;

    function toCx(x){ return PAD_L+((x-X_MIN)/(X_MAX-X_MIN))*PW; }
    function toCy(y){ return PAD_T+PH-((y-Y_MIN)/(Y_MAX-Y_MIN))*PH; }

    var zx1=toCx(-1),zx2=toCx(1),zy1=toCy(1),zy2=toCy(0);

    // Filter pitches for this mode
    var pts = gsc.filter(function(s){ return s.x!=null&&s.y!=null&&mode.fn(s); });

    // POV label
    ctx.save();
    ctx.font='bold 9px DM Mono,monospace';
    ctx.fillStyle='rgba(255,184,28,0.75)';
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    ctx.fillText("FROM A PITCHER'S POV",(zx1+zx2)/2,zy1-4);
    ctx.restore();

    if (view==='heatmap') {
      // Full KDE heatmap — identical to Strike Zone section
      if (pts.length) drawKdeHeatmap(ctx, pts, W, H, PAD_L, PAD_R, PAD_T, PAD_B, X_MIN, X_MAX, Y_MIN, Y_MAX);
    } else {
      // Scatter — colour dots by mode colour
      var rgb = hexToRgb(mode.color);
      pts.forEach(function(s){
        var cx=toCx(s.x), cy=toCy(s.y);
        ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2);
        ctx.fillStyle='rgba('+rgb+',0.7)'; ctx.fill();
        ctx.strokeStyle='rgba('+rgb+',0.9)'; ctx.lineWidth=0.8; ctx.stroke();
      });
    }

    // Zone border + grid — always on top, gold like Strike Zone
    ctx.fillStyle='rgba(255,184,28,0.03)';
    ctx.fillRect(zx1,zy1,zx2-zx1,zy2-zy1);
    ctx.strokeStyle='rgba(255,184,28,0.85)'; ctx.lineWidth=1.5;
    ctx.strokeRect(zx1,zy1,zx2-zx1,zy2-zy1);
    var cw=(zx2-zx1)/3, ch=(zy2-zy1)/3;
    ctx.strokeStyle='rgba(255,184,28,0.25)'; ctx.lineWidth=0.6;
    for(var i=1;i<3;i++){
      ctx.beginPath();ctx.moveTo(zx1+cw*i,zy1);ctx.lineTo(zx1+cw*i,zy2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(zx1,zy1+ch*i);ctx.lineTo(zx2,zy1+ch*i);ctx.stroke();
    }
  }

  buildBglRows();
}



  // Shared KDE heatmap renderer — identical colour ramp and sigma to Strike Zone section
  function drawKdeHeatmap(ctx, pts, W, H, PAD_L, PAD_R, PAD_T, PAD_B, X_MIN, X_MAX, Y_MIN, Y_MAX) {
    var PW = W - PAD_L - PAD_R, PH = H - PAD_T - PAD_B;
    var GW = 200, GH = 200;
    var density = new Float32Array(GW * GH);
    var SIGMA = Math.max(6, Math.min(14, 120 / Math.sqrt(pts.length + 1)));
    pts.forEach(function(s) {
      var gx = ((s.x - X_MIN) / (X_MAX - X_MIN)) * GW;
      var gy = GH - ((s.y - Y_MIN) / (Y_MAX - Y_MIN)) * GH;
      var radius = Math.ceil(SIGMA * 3);
      for (var dy = -radius; dy <= radius; dy++) {
        for (var dx = -radius; dx <= radius; dx++) {
          var px = Math.round(gx + dx), py = Math.round(gy + dy);
          if (px<0||px>=GW||py<0||py>=GH) continue;
          density[py*GW+px] += Math.exp(-(dx*dx+dy*dy)/(2*SIGMA*SIGMA));
        }
      }
    });
    var vals = [];
    for (var i=0;i<density.length;i++){ if(density[i]>0) vals.push(density[i]); }
    if (!vals.length) return;
    vals.sort(function(a,b){return a-b;});
    var maxD = vals[Math.floor(vals.length*0.97)] || vals[vals.length-1];
    if (!maxD) return;
    var offscreen = document.createElement('canvas');
    offscreen.width=GW; offscreen.height=GH;
    var octx=offscreen.getContext('2d');
    var imgData=octx.createImageData(GW,GH);
    for (var py=0;py<GH;py++) {
      for (var px=0;px<GW;px++) {
        var val=Math.min(density[py*GW+px]/maxD,1.0);
        if(val<0.01) continue;
        var r,g,b,a,t;
        if      (val<0.2){t=val/0.2;             r=Math.round(8  +t*(30 -8));  g=Math.round(16 +t*(100-16)); b=Math.round(48 +t*(200-48));}
        else if (val<0.4){t=(val-0.2)/0.2;        r=Math.round(30 +t*(0  -30)); g=Math.round(100+t*(200-100));b=Math.round(200+t*(200-200));}
        else if (val<0.6){t=(val-0.4)/0.2;        r=Math.round(0  +t*(80 -0));  g=Math.round(200+t*(220-200));b=Math.round(200+t*(50 -200));}
        else if (val<0.8){t=(val-0.6)/0.2;        r=Math.round(80 +t*(240-80)); g=Math.round(220+t*(210-220));b=Math.round(50 +t*(0  -50));}
        else             {t=(val-0.8)/0.2;         r=Math.round(240+t*(220-240));g=Math.round(210+t*(20 -210));b=0;}
        a=Math.round(Math.pow(val,0.5)*230);
        var idx=(py*GW+px)*4;
        imgData.data[idx]=r; imgData.data[idx+1]=g; imgData.data[idx+2]=b; imgData.data[idx+3]=a;
      }
    }
    octx.putImageData(imgData,0,0);
    ctx.save();
    ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
    ctx.drawImage(offscreen, PAD_L, PAD_T, PW, PH);
    ctx.restore();
    // Colour scale legend
    var scaleX=PAD_L+PW+4, scaleH=PH*0.6, scaleY=PAD_T+PH*0.2;
    var grad=ctx.createLinearGradient(0,scaleY,0,scaleY+scaleH);
    grad.addColorStop(0,'rgb(220,20,0)'); grad.addColorStop(0.25,'rgb(240,210,0)');
    grad.addColorStop(0.5,'rgb(80,220,50)'); grad.addColorStop(0.75,'rgb(0,200,200)');
    grad.addColorStop(1,'rgb(8,16,48)');
    ctx.fillStyle=grad; ctx.fillRect(scaleX,scaleY,7,scaleH);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=0.5;
    ctx.strokeRect(scaleX,scaleY,7,scaleH);
    ctx.fillStyle='rgba(255,255,255,0.45)'; ctx.font='8px DM Mono,monospace'; ctx.textAlign='left';
    ctx.fillText('HI',scaleX+10,scaleY+8); ctx.fillText('LO',scaleX+10,scaleY+scaleH);
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
    var _zoneNameKey = normPlayerName(name);
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) {
        if (normPlayerName(s.pitcher) === _zoneNameKey && s.x != null && s.y != null) points.push(s);
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
  var typeCounts = {};
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  var typeSet = Object.keys(typeCounts).sort(function(a, b) { return typeCounts[b] - typeCounts[a]; });
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
    { lbl: 'Whiffs',     val: 'whiff'     },
    { lbl: 'Strikeouts', val: 'strikeout' },
    { lbl: 'Hits',       val: 'hit'       },
    { lbl: 'XBH',        val: 'xbh'       }
  ];
  function resultMatch(s, filter) {
    if (filter === 'all') return true;
    var o = s.outcome || '';
    if (filter === 'whiff')      return o === 'Swinging Strike';
    if (filter === 'hit')        return ['Single','Double','Triple','Home Run'].includes(o);
    if (filter === 'xbh')        return ['Double','Triple','Home Run'].includes(o);
    if (filter === 'strikeout')  return o === 'Strikeout Swinging' || o === 'Strikeout Looking';
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
  var inZone   = points.filter(function(s){ return s.in_zone===true; }).length;
  var ks       = points.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
  var hits     = points.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
  var swStr    = points.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
  var chases   = points.filter(function(s){ return s.in_zone===false&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;

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
  var activeSeasonFilter = seasonFilter || 'all';

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
    var iz   = f.filter(function(s){ return s.in_zone === true; }).length;
    var fks  = f.filter(function(s){ return s.outcome==='Strikeout Swinging'||s.outcome==='Strikeout Looking'; }).length;
    var fh   = f.filter(function(s){ return ['Single','Double','Triple','Home Run'].includes(s.outcome); }).length;
    var fsw  = f.filter(function(s){ return s.outcome==='Swinging Strike'; }).length;
    var fch  = f.filter(function(s){ return s.in_zone===false&&(s.outcome==='Swinging Strike'||s.outcome==='Foul'); }).length;
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
        if (activeSeasonFilter !== 'all' && s.date && !s.date.startsWith(activeSeasonFilter.replace('year:', ''))) return false;
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
        if (activeSeasonFilter !== 'all' && s.date && !s.date.startsWith(activeSeasonFilter.replace('year:', ''))) return false;
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

}


// ── SPLITS TAB ────────────────────────────────────
function renderSplits(name, type, pitch, seasonFilter) {
  seasonFilter = seasonFilter || 'all';
  var points = [];
  if (type === 'batter' && pitch && pitch.scatter) {
    points = pitch.scatter;
  } else if (type === 'pitcher') {
    var _splitsNameKey = normPlayerName(name);
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (normPlayerName(s.pitcher) === _splitsNameKey) points.push(s); });
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

  var typeCounts = {};
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  var typeSet = Object.keys(typeCounts).sort(function(a, b) { return typeCounts[b] - typeCounts[a]; });

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

  var typeCounts = {};
  points.forEach(function(s) {
    var t = s.pitch_type || s.type || 'Unknown';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  var typeSet = Object.keys(typeCounts).sort(function(a, b) { return typeCounts[b] - typeCounts[a]; });

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

  var sortedTypeEntries = Object.entries(typeMap).sort(function(a, b) { return b[1].total - a[1].total; });

  var pitchMixHTML =
    '<div class="stat-card" style="margin-bottom:20px">' +
    '<div class="stat-card-header"><span class="stat-card-title">Pitch Mix</span></div>' +
    '<div class="pitch-mix-grid">' +
    sortedTypeEntries.map(function(e) {
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
    sortedTypeEntries.map(function(e) {
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

  return pitchMixHTML + countTableHTML;
}

// ── TABLE BUILDERS ────────────────────────────────
function buildHittingTable(players) {
  const sorted = players.slice().sort(function(a,b){ return a.batter.localeCompare(b.batter); });
  const rows = sorted.map(function(p) {
    const team = resolveTeam(p.batter_team || p.team);
    // Also try IBL history for team if still not found
    var teamDisplay = (_activeSeason === 'year:2025' && isOnActiveRoster2025(p.batter))
      ? displayTeamForPlayer(p.batter, p.batter_team || p.team)
      : (team ? team.abbreviation : (function() {
      var yr = _activeSeason.replace('year:', '');
      var iblS = (DATA.iblHistory[p.batter] || []).find(function(s){ return (s.season||'').indexOf(yr)!==-1; });
      if (iblS && iblS.team) { var t2 = resolveTeam(iblS.team); return t2 ? t2.abbreviation : iblS.team; }
      return '—';
    })());
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.batter + '" data-type="batter">' + p.batter + '</a></td>' +
      '<td>' + teamDisplay + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Player</th><th>Team</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function buildPbpPitcherTable(pitchers) {
  const sorted = pitchers.slice().sort(function(a,b){ return a.pitcher.localeCompare(b.pitcher); });
  const rows = sorted.map(function(p) {
    const team = resolveTeam(p.pitcher_team);
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + p.pitcher + '" data-type="pitcher">' + p.pitcher + '</a></td>' +
      '<td>' + (team ? team.abbreviation : '—') + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Team</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function buildPitcherListTable(names) {
  const sorted = names.slice().sort(function(a,b){ return a.localeCompare(b); });
  const rows = sorted.map(function(name) {
    const pts = [];
    DATA.pitches.forEach(function(bp) {
      if (!bp.scatter) return;
      bp.scatter.forEach(function(s) { if (s.pitcher === name) pts.push(s); });
    });
    var pd = DATA.pitchers.find(function(p){ return p.pitcher === name; }) || {};
    const team = pts.length ? resolveTeam(pts[0].pitcher_team) : resolveTeam(pd.pitcher_team || pd.team);
    var teamDisplay = (_activeSeason === 'year:2025' && isOnActiveRoster2025(name))
      ? displayTeamForPlayer(name, pd.pitcher_team || pd.team)
      : (team ? team.abbreviation : (function() {
      var yr = _activeSeason.replace('year:', '');
      var iblS = (DATA.iblHistory[name] || []).find(function(s){ return (s.season||'').indexOf(yr)!==-1; });
      if (iblS && iblS.team) { var t2 = resolveTeam(iblS.team); return t2 ? t2.abbreviation : iblS.team; }
      return '—';
    })());
    return '<tr>' +
      '<td><a class="player-name-cell" data-name="' + name + '" data-type="pitcher">' + name + '</a></td>' +
      '<td>' + teamDisplay + '</td>' +
      '</tr>';
  }).join('');
  return '<div class="table-wrap"><table class="stat-table"><thead><tr>' +
    '<th style="text-align:left">Pitcher</th><th>Team</th>' +
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
    var pName = el.dataset.name;
    var pType = el.dataset.type || type;
    // Resolve team
    var _s = DATA.summary.find(function(p){ return p.batter === pName; });
    var _p = DATA.pitchers.find(function(p){ return p.pitcher === pName; });
    var _t = _s ? _s.batter_team : (_p ? (_p.pitcher_team || _p.team) : null);
    if (_activeSeason === 'year:2025') {
      var _rt = getActiveRosterTeam2025(pName);
      if (_rt) _t = _rt.name;
    }
    if (!ACCESS.canViewPlayer(pName, pType, _t)) {
      el.style.cursor = 'not-allowed';
      el.style.opacity = '0.4';
      el.title = 'Access restricted';
      el.addEventListener('click', function(e) { e.stopPropagation(); e.preventDefault(); });
    } else {
      el.addEventListener('click', function() {
        navigate('players.html?player=' + encodeURIComponent(pName) + '&type=' + pType + '&season=' + _activeSeason.replace('year:', ''));
      });
    }
  });
}

// ── NOTES TAB ─────────────────────────────────────
function renderNotes(playerName, container) {
  var user = AUTH._user || {};
  var storageKey = 'notes:' + playerName.toLowerCase().replace(/\s+/g, '_');

  function loadNotes(cb) {
    if (window.storage) {
      window.storage.get(storageKey, true).then(function(res) {
        cb(res ? JSON.parse(res.value) : []);
      }).catch(function() { cb([]); });
    } else {
      try { cb(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
      catch(e) { cb([]); }
    }
  }

  function saveNotes(notes, cb) {
    if (window.storage) {
      window.storage.set(storageKey, JSON.stringify(notes), true).then(cb).catch(cb);
    } else {
      try { localStorage.setItem(storageKey, JSON.stringify(notes)); } catch(e) {}
      if (cb) cb();
    }
  }

  function renderList(notes) {
    if (!notes.length) {
      return '<div style="font-family:var(--font-mono);font-size:12px;color:rgba(255,255,255,0.25);text-align:center;padding:32px 0">No notes yet.</div>';
    }
    return notes.map(function(n, i) {
      return '<div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:12px;align-items:flex-start">' +
        '<div style="flex:1">' +
          '<div style="font-size:14px;color:rgba(255,255,255,0.85);line-height:1.6;white-space:pre-wrap">' + n.text.replace(/</g,'&lt;') + '</div>' +
          '<div style="margin-top:6px;display:flex;gap:12px;align-items:center">' +
            '<span style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.3)">' + n.author + '</span>' +
            '<span style="font-family:var(--font-mono);font-size:10px;color:rgba(255,255,255,0.2)">' + n.date + '</span>' +
          '</div>' +
        '</div>' +
        (n.author === (user.name || user.email)
          ? '<button data-idx="' + i + '" class="note-delete-btn" style="background:transparent;border:none;color:rgba(220,80,80,0.5);font-size:16px;cursor:pointer;padding:0 4px;line-height:1;flex-shrink:0" title="Delete">×</button>'
          : '') +
      '</div>';
    }).join('');
  }

  container.innerHTML =
    '<div class="stat-card">' +
      '<div class="stat-card-header"><span class="stat-card-title">Scout Notes</span><span class="stat-card-subtitle" id="notes-count"></span></div>' +
      '<div style="padding:16px 24px 0" id="notes-list"></div>' +
      '<div style="padding:16px 24px 20px;border-top:1px solid rgba(255,255,255,0.06);margin-top:8px">' +
        '<textarea id="note-input" placeholder="Add a note..." style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.12);border-radius:6px;color:#fff;font-size:13px;font-family:inherit;padding:10px 12px;resize:vertical;min-height:80px;outline:none;transition:border-color .2s"></textarea>' +
        '<div style="display:flex;justify-content:flex-end;margin-top:8px">' +
          '<button id="note-submit" style="background:rgba(255,184,28,0.15);border:1px solid rgba(255,184,28,0.4);color:#FFB81C;font-family:var(--font-mono);font-size:11px;letter-spacing:0.08em;padding:8px 18px;border-radius:4px;cursor:pointer;transition:all .2s">ADD NOTE</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  var listEl  = container.querySelector('#notes-list');
  var countEl = container.querySelector('#notes-count');

  function refresh() {
    loadNotes(function(notes) {
      listEl.innerHTML = renderList(notes);
      countEl.textContent = notes.length + ' note' + (notes.length !== 1 ? 's' : '');
      refreshBadge(playerName, notes);
      // Wire delete buttons
      listEl.querySelectorAll('.note-delete-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var idx = parseInt(btn.dataset.idx);
          loadNotes(function(latest) {
            latest.splice(idx, 1);
            saveNotes(latest, function() { refresh(); });
          });
        });
      });
    });
  }

  container.querySelector('#note-submit').addEventListener('click', function() {
    var text = container.querySelector('#note-input').value.trim();
    if (!text) return;
    loadNotes(function(notes) {
      notes.unshift({
        text: text,
        author: user.name || user.email || 'unknown',
        date: new Date().toLocaleDateString('en-CA', { year:'numeric', month:'short', day:'numeric' })
      });
      saveNotes(notes, function() {
        container.querySelector('#note-input').value = '';
        refresh();
      });
    });
  });

  refresh();
}

function refreshBadge(playerName, notes) {
  var badge = document.getElementById('player-note-badge');
  if (!badge) return;
  if (notes && notes.length) {
    badge.style.fontSize = '';
    badge.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;' +
      'background:rgba(255,184,28,0.2);border:1px solid rgba(255,184,28,0.45);border-radius:12px;' +
      'font-family:var(--font-mono);font-size:11px;color:#FFB81C;padding:4px 12px;' +
      'letter-spacing:0.05em;cursor:pointer;white-space:nowrap" id="note-badge-pill">' +
      notes.length + ' note' + (notes.length !== 1 ? 's' : '') + '</span>';
    var pill = document.getElementById('note-badge-pill');
    if (pill) {
      pill.addEventListener('click', function() {
        var btn = document.querySelector('.tab-btn[data-tab="notes"]');
        if (btn) btn.click();
      });
    }
  } else {
    badge.style.fontSize = '0';
    badge.innerHTML = '';
  }
}

function loadNoteBadge(playerName) {
  var storageKey = 'notes:' + playerName.toLowerCase().replace(/\s+/g, '_');
  if (window.storage) {
    window.storage.get(storageKey, true).then(function(res) {
      var notes = res ? JSON.parse(res.value) : [];
      refreshBadge(playerName, notes);
    }).catch(function() {});
  } else {
    try {
      var notes = JSON.parse(localStorage.getItem(storageKey) || '[]');
      refreshBadge(playerName, notes);
    } catch(e) {}
  }
}

init();
