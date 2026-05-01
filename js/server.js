/**
 * Data Diamond — Live Game Tracking Server
 * =========================================
 * Run this on your computer during a game:
 *   node server.js
 *
 * Place this file in the ROOT of your website folder
 * (same folder as index.html, tracker.html, etc.)
 *
 * Requirements:
 *   npm install express cors
 */

const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3747;

// ── Paths (relative to this file) ────────────────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const PBP_BAT_FILE  = path.join(DATA_DIR, 'pbp_batters.json');
const PBP_PIT_FILE  = path.join(DATA_DIR, 'pbp_pitchers.json');
const LIVE_FILE     = path.join(DATA_DIR, 'live_game.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // serve website files

// ── In-memory pitch store for current game ───────────────────────────────────
var currentGame = {
  gameId:   null,
  home:     '',
  away:     '',
  date:     '',
  pitches:  [],
  lineups:  { home: [], away: [] },
  pitchers: { home: {}, away: {} }
};

// ── Helper: compute stats from pitch array ────────────────────────────────────
function computeBatterStats(name, team, pitches) {
  var mine = pitches.filter(function(p) { return p.batter === name; });
  if (!mine.length) return null;

  var PA=0, AB=0, H=0, B1=0, B2=0, B3=0, HR=0, BB=0, IBB=0, HBP=0;
  var K=0, Ksw=0, Klk=0, SF=0, GB=0, FB=0, LO=0, PO=0, DP=0;
  var pitches_seen=0, swings=0, swing_str=0, called_str=0, fouls=0;
  var fp_swings=0, fp_strikes=0;
  var PA_ENDING = ['Single','Double','Triple','Home Run','Groundout','Flyout','Lineout','Popout',
    'Double Play','Sacrifice Fly','Sacrifice Bunt','Error','Walk','Intentional Walk','Hit By Pitch',
    'Strikeout Swinging','Strikeout Looking','Dropped Third Strike Swinging','Dropped Third Strike Looking','Truncated Out'];
  var NON_AB = ['Walk','Intentional Walk','Hit By Pitch','Sacrifice Fly','Sacrifice Bunt','Catcher Interference'];

  // Group into PAs
  var pas = [];
  var curPA = null;
  mine.forEach(function(p) {
    var key = p.inning + p.half_inning + p.batter;
    if (!curPA || curPA.key !== key) {
      curPA = { key: key, rows: [] };
      pas.push(curPA);
    }
    curPA.rows.push(p);
  });

  pas.forEach(function(pa) {
    var rows = pa.rows;
    var isPA = rows.some(function(r) { return PA_ENDING.includes(r.outcome); });
    if (!isPA && rows.length) isPA = true; // count ongoing PA
    if (isPA) PA++;

    var lastOut = rows.slice().reverse().find(function(r){ return PA_ENDING.includes(r.outcome); });
    var outcome = lastOut ? lastOut.outcome : '';

    if (outcome === 'Single')   { H++; B1++; }
    if (outcome === 'Double')   { H++; B2++; }
    if (outcome === 'Triple')   { H++; B3++; }
    if (outcome === 'Home Run') { H++; HR++; }
    if (outcome === 'Walk')     BB++;
    if (outcome === 'Intentional Walk') { BB++; IBB++; }
    if (outcome === 'Hit By Pitch') HBP++;
    if (outcome === 'Strikeout Swinging') { K++; Ksw++; }
    if (outcome === 'Strikeout Looking')  { K++; Klk++; }
    if (outcome === 'Sacrifice Fly')   SF++;
    if (outcome === 'Groundout' || outcome === 'Double Play') GB++;
    if (outcome === 'Double Play') DP++;
    if (outcome === 'Flyout')   FB++;
    if (outcome === 'Lineout')  LO++;
    if (outcome === 'Popout')   PO++;

    var isAB = isPA && !NON_AB.includes(outcome);
    if (isAB) AB++;

    rows.forEach(function(r, i) {
      pitches_seen++;
      var isSwing = ['Swinging Strike','Foul','Single','Double','Triple','Home Run',
        'Groundout','Flyout','Lineout','Popout','Double Play','Sacrifice Fly','Sacrifice Bunt',
        'Error','Strikeout Swinging','Dropped Third Strike Swinging'].includes(r.outcome);
      if (isSwing) swings++;
      if (r.outcome === 'Swinging Strike' || r.outcome === 'Strikeout Swinging') swing_str++;
      if (r.outcome === 'Called Strike'   || r.outcome === 'Strikeout Looking')  called_str++;
      if (r.outcome === 'Foul') fouls++;
      if (i === 0) {
        if (isSwing) fp_swings++;
        if (r.outcome === 'Called Strike' || isSwing) fp_strikes++;
      }
    });
    var bip = GB + FB + LO + PO;
  });

  var bip = GB + FB + LO + PO;
  var AVG   = AB > 0 ? round3(H / AB) : 0;
  var OBP   = (AB + BB + HBP + SF) > 0 ? round3((H + BB + HBP) / (AB + BB + HBP + SF)) : 0;
  var SLG   = AB > 0 ? round3((B1 + 2*B2 + 3*B3 + 4*HR) / AB) : 0;
  return {
    batter: name, batter_team: team,
    PA, AB, H, '1B':B1, '2B':B2, '3B':B3, HR, BB, IBB, HBP, K, K_sw:Ksw, K_lk:Klk, SF, GB, FB, LO, PO,
    pitches: pitches_seen,
    AVG, OBP, SLG,
    OPS:     round3(OBP + SLG),
    ISO:     round3(SLG - AVG),
    BABIP:   (AB - K - HR + SF) > 0 ? round3((H - HR) / (AB - K - HR + SF)) : 0,
    K_pct:   round1(PA > 0 ? K / PA * 100 : 0),
    BB_pct:  round1(PA > 0 ? BB / PA * 100 : 0),
    BB_K:    round2(K > 0 ? BB / K : 0),
    PS_PA:   round2(PA > 0 ? pitches_seen / PA : 0),
    SWING_pct:    round1(pitches_seen > 0 ? swings / pitches_seen * 100 : 0),
    WHIFF_pct:    round1(swings > 0 ? swing_str / swings * 100 : 0),
    CONTACT_pct:  round1(swings > 0 ? (1 - swing_str / swings) * 100 : 0),
    FP_SWING_pct: round1(PA > 0 ? fp_swings / PA * 100 : 0),
    GB_pct: round1(bip > 0 ? GB / bip * 100 : 0),
    FB_pct: round1(bip > 0 ? FB / bip * 100 : 0),
    LO_pct: round1(bip > 0 ? LO / bip * 100 : 0),
    PO_pct: round1(bip > 0 ? PO / bip * 100 : 0),
  };
}

function computePitcherStats(name, team, pitches) {
  var mine = pitches.filter(function(p) { return p.pitcher === name; });
  if (!mine.length) return null;

  var BF=0, AB_ag=0, H_ag=0, B2_ag=0, B3_ag=0, HR_ag=0, BB_ag=0, IBB_ag=0, HBP_ag=0;
  var K_tot=0, K_sw=0, K_lk=0, SF_ag=0, GB=0, FB=0, LO=0, PO=0;
  var pitches_n=0, swings=0, swing_str=0, called_str=0, fouls=0, fp_strikes=0;
  var total_outs=0, EA_count=0;

  var PA_ENDING = ['Single','Double','Triple','Home Run','Groundout','Flyout','Lineout','Popout',
    'Double Play','Sacrifice Fly','Sacrifice Bunt','Error','Walk','Intentional Walk','Hit By Pitch',
    'Strikeout Swinging','Strikeout Looking','Dropped Third Strike Swinging','Dropped Third Strike Looking','Truncated Out'];
  var NON_AB = ['Walk','Intentional Walk','Hit By Pitch','Sacrifice Fly','Sacrifice Bunt'];

  // Group into PAs faced
  var pas = [];
  var curPA = null;
  mine.forEach(function(p) {
    var key = p.inning + p.half_inning + p.batter;
    if (!curPA || curPA.key !== key) { curPA = { key:key, rows:[] }; pas.push(curPA); }
    curPA.rows.push(p);
  });

  pas.forEach(function(pa) {
    var rows = pa.rows;
    var last = rows.slice().reverse().find(function(r){ return PA_ENDING.includes(r.outcome); });
    if (!last) return;
    BF++;
    var o = last.outcome;
    if (['Single','Double','Triple','Home Run'].includes(o)) H_ag++;
    if (o==='Double')   B2_ag++;
    if (o==='Triple')   B3_ag++;
    if (o==='Home Run') HR_ag++;
    if (o==='Walk')     BB_ag++;
    if (o==='Intentional Walk') { BB_ag++; IBB_ag++; }
    if (o==='Hit By Pitch') HBP_ag++;
    if (o==='Strikeout Swinging') { K_tot++; K_sw++; }
    if (o==='Strikeout Looking')  { K_tot++; K_lk++; }
    if (o==='Sacrifice Fly') SF_ag++;
    if (o==='Groundout' || o==='Double Play') { GB++; total_outs++; }
    if (o==='Double Play') total_outs++;
    if (o==='Flyout')   { FB++; total_outs++; }
    if (o==='Lineout')  { LO++; total_outs++; }
    if (o==='Popout')   { PO++; total_outs++; }
    if (o==='Strikeout Swinging'||o==='Strikeout Looking'||o==='Dropped Third Strike Swinging'||o==='Dropped Third Strike Looking') total_outs++;
    if (o==='Sacrifice Fly'||o==='Sacrifice Bunt') total_outs++;
    if (!NON_AB.includes(o)) AB_ag++;

    // E+A: early (<=3 pitches) or ahead (got to 0-2 or 1-2)
    var gotAhead = rows.some(function(r){ return r.count==="'0-2"||r.count==="'1-2"; });
    var isEarly = rows.length <= 3 && !['Walk','Intentional Walk'].includes(o);
    if (gotAhead || isEarly) EA_count++;

    rows.forEach(function(r, i) {
      pitches_n++;
      var isSwing = ['Swinging Strike','Foul','Single','Double','Triple','Home Run',
        'Groundout','Flyout','Lineout','Popout','Double Play','Sacrifice Fly','Sacrifice Bunt',
        'Strikeout Swinging','Dropped Third Strike Swinging'].includes(r.outcome);
      if (isSwing) swings++;
      if (r.outcome==='Swinging Strike'||r.outcome==='Strikeout Swinging') swing_str++;
      if (r.outcome==='Called Strike'||r.outcome==='Strikeout Looking')    called_str++;
      if (r.outcome==='Foul') fouls++;
      if (i===0 && (r.outcome==='Called Strike'||isSwing)) fp_strikes++;
    });
  });

  var IP   = round1(total_outs / 3);
  var bip  = GB + FB + LO + PO;
  var str  = called_str + swing_str + fouls + K_tot;
  return {
    pitcher: name, pitcher_team: team,
    BF, AB_ag, H_ag, '2B_ag':B2_ag, '3B_ag':B3_ag, HR_ag, BB_ag, IBB_ag, HBP_ag,
    K_tot, K_sw, K_lk, SF_ag, GB, FB, LO, PO,
    pitches: pitches_n, swings, called_str, swing_str, fouls, fp_strikes, EA_count,
    total_outs, IP,
    ERA:         0, // can't calc without runs data in this pass
    WHIP:        round2(IP > 0 ? (BB_ag + H_ag) / IP : 0),
    BA_against:  round3(AB_ag > 0 ? H_ag / AB_ag : 0),
    BABIP:       round3((AB_ag - K_tot - HR_ag + SF_ag) > 0 ? (H_ag - HR_ag) / (AB_ag - K_tot - HR_ag + SF_ag) : 0),
    K_pct:       round1(BF > 0 ? K_tot / BF * 100 : 0),
    BB_pct:      round1(BF > 0 ? BB_ag / BF * 100 : 0),
    K_BB:        round2(BB_ag > 0 ? K_tot / BB_ag : 0),
    STR_pct:     round1(pitches_n > 0 ? str / pitches_n * 100 : 0),
    SWING_pct:   round1(pitches_n > 0 ? swings / pitches_n * 100 : 0),
    WHIFF_pct:   round1(swings > 0 ? swing_str / swings * 100 : 0),
    CONTACT_pct: round1(swings > 0 ? (1 - swing_str / swings) * 100 : 0),
    FP_STR_pct:  round1(BF > 0 ? fp_strikes / BF * 100 : 0),
    PUTAWAY_pct: round1((K_tot + H_ag) > 0 ? K_tot / (K_tot + H_ag) * 100 : 0),
    EA_pct:      round1(BF > 0 ? EA_count / BF * 100 : 0),
    GB_pct: round1(bip > 0 ? GB / bip * 100 : 0),
    FB_pct: round1(bip > 0 ? FB / bip * 100 : 0),
    LO_pct: round1(bip > 0 ? LO / bip * 100 : 0),
    PO_pct: round1(bip > 0 ? PO / bip * 100 : 0),
  };
}

function round1(v){ return Math.round(v*10)/10; }
function round2(v){ return Math.round(v*100)/100; }
function round3(v){ return Math.round(v*1000)/1000; }

// ── Rebuild and save JSON files ───────────────────────────────────────────────
function rebuildAndSave() {
  var pitches = currentGame.pitches;

  // Get unique batters and pitchers
  var batters  = {}, pitchers = {};
  pitches.forEach(function(p) {
    if (p.batter)  batters[p.batter]   = p.batter_team;
    if (p.pitcher) pitchers[p.pitcher] = p.pitcher_team;
  });

  // Load existing JSON files (from previous games)
  var existingBatters  = [];
  var existingPitchers = [];
  try { existingBatters  = JSON.parse(fs.readFileSync(PBP_BAT_FILE, 'utf8')); } catch(e){}
  try { existingPitchers = JSON.parse(fs.readFileSync(PBP_PIT_FILE, 'utf8')); } catch(e){}

  // Compute stats for everyone who appeared in this game
  var newBatterStats  = Object.entries(batters).map(function(e)  { return computeBatterStats(e[0],e[1],pitches); }).filter(Boolean);
  var newPitcherStats = Object.entries(pitchers).map(function(e) { return computePitcherStats(e[0],e[1],pitches); }).filter(Boolean);

  // Merge: replace existing entry if same batter/pitcher, otherwise keep
  function mergeArr(existing, fresh, keyField) {
    var freshNames = new Set(fresh.map(function(x){ return x[keyField]; }));
    var kept = existing.filter(function(x){ return !freshNames.has(x[keyField]); });
    return kept.concat(fresh);
  }

  var finalBatters  = mergeArr(existingBatters,  newBatterStats,  'batter');
  var finalPitchers = mergeArr(existingPitchers, newPitcherStats, 'pitcher');

  // Sort by PA / BF descending
  finalBatters.sort(function(a,b){ return (b.PA||0)-(a.PA||0); });
  finalPitchers.sort(function(a,b){ return (b.IP||0)-(a.IP||0); });

  fs.writeFileSync(PBP_BAT_FILE,  JSON.stringify(finalBatters,  null, 2));
  fs.writeFileSync(PBP_PIT_FILE,  JSON.stringify(finalPitchers, null, 2));

  // Also write live game state
  fs.writeFileSync(LIVE_FILE, JSON.stringify({
    gameId:   currentGame.gameId,
    home:     currentGame.home,
    away:     currentGame.away,
    date:     currentGame.date,
    pitches:  pitches.length,
    updated:  new Date().toISOString()
  }, null, 2));

  console.log('[' + new Date().toLocaleTimeString() + '] Updated — ' +
    finalBatters.length + ' batters, ' + finalPitchers.length + ' pitchers, ' +
    pitches.length + ' pitches this game');
}

// ── API Routes ────────────────────────────────────────────────────────────────

// Start a new game
app.post('/api/game/start', function(req, res) {
  var b = req.body;
  currentGame = {
    gameId:   b.home + '_vs_' + b.away + '_' + b.date,
    home:     b.home  || '',
    away:     b.away  || '',
    date:     b.date  || '',
    pitches:  [],
    lineups:  b.lineups  || { home:[], away:[] },
    pitchers: b.pitchers || { home:{}, away:{} }
  };
  console.log('[START] ' + currentGame.gameId);
  res.json({ ok: true, gameId: currentGame.gameId });
});

// Record a pitch — updates JSON immediately
app.post('/api/pitch', function(req, res) {
  var pitch = req.body;
  currentGame.pitches.push(pitch);
  rebuildAndSave();
  res.json({ ok: true, total: currentGame.pitches.length });
});

// Undo last pitch
app.post('/api/pitch/undo', function(req, res) {
  if (currentGame.pitches.length) {
    currentGame.pitches.pop();
    rebuildAndSave();
  }
  res.json({ ok: true, total: currentGame.pitches.length });
});

// Get current game state
app.get('/api/game', function(req, res) {
  res.json({ gameId: currentGame.gameId, pitches: currentGame.pitches.length });
});

// Health check
app.get('/api/ping', function(req, res) {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.listen(PORT, function() {
  console.log('');
  console.log('  ██████╗  █████╗ ████████╗ █████╗ ');
  console.log('  ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗');
  console.log('  ██║  ██║███████║   ██║   ███████║');
  console.log('  ██║  ██║██╔══██║   ██║   ██╔══██║');
  console.log('  ██████╔╝██║  ██║   ██║   ██║  ██║');
  console.log('  ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝');
  console.log('');
  console.log('  Data Diamond — Live Tracking Server');
  console.log('  Running at http://localhost:' + PORT);
  console.log('  Serving website files from: ' + __dirname);
  console.log('  Writing JSON to: ' + DATA_DIR);
  console.log('');
  console.log('  Open http://localhost:' + PORT + '/tracking.html to start');
  console.log('');
});
