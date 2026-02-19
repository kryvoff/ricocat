const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const msgEl = document.getElementById('message');
const restartBtn = document.getElementById('restart-btn');

// ---- Grid settings ----
let COLS = 10;
let ROWS = 10;
let CELL = canvas.width / COLS;
const WALL_W = 5;
const WALL_COLOR = '#4a4a4a';
const WALL_OUTER_COLOR = '#333';

// ---- Load images ----
const pauliImg = new Image();
pauliImg.src = 'assets/pauli.png';
const semiImg = new Image();
semiImg.src = 'assets/samy.png';
const jerryImg = new Image();
jerryImg.src = 'assets/jerry.png';

// ---- Audio (Web Audio API) ----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Separate gain nodes for music and SFX
const musicGainNode = audioCtx.createGain();
const sfxGainNode = audioCtx.createGain();
musicGainNode.connect(audioCtx.destination);
sfxGainNode.connect(audioCtx.destination);
musicGainNode.gain.value = 0.2;
sfxGainNode.gain.value = 0.3;

function playSlideSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(150, audioCtx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.08);
  osc.connect(gain).connect(sfxGainNode);
  osc.start(); osc.stop(audioCtx.currentTime + 0.08);
}

function playBumpSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  osc.frequency.linearRampToValueAtTime(60, audioCtx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.12);
  osc.connect(gain).connect(sfxGainNode);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}

function playNomSound() {
  // Fun "chomp" sound - descending pitch burst + noise
  const t = audioCtx.currentTime;
  // Chomp 1
  const o1 = audioCtx.createOscillator();
  const g1 = audioCtx.createGain();
  o1.type = 'sawtooth';
  o1.frequency.setValueAtTime(600, t);
  o1.frequency.linearRampToValueAtTime(200, t + 0.08);
  g1.gain.setValueAtTime(0.2, t);
  g1.gain.linearRampToValueAtTime(0, t + 0.1);
  o1.connect(g1).connect(sfxGainNode);
  o1.start(t); o1.stop(t + 0.1);
  // Chomp 2
  const o2 = audioCtx.createOscillator();
  const g2 = audioCtx.createGain();
  o2.type = 'sawtooth';
  o2.frequency.setValueAtTime(500, t + 0.12);
  o2.frequency.linearRampToValueAtTime(150, t + 0.2);
  g2.gain.setValueAtTime(0.2, t + 0.12);
  g2.gain.linearRampToValueAtTime(0, t + 0.22);
  o2.connect(g2).connect(sfxGainNode);
  o2.start(t + 0.12); o2.stop(t + 0.22);
  // Satisfied "mmm" hum
  const o3 = audioCtx.createOscillator();
  const g3 = audioCtx.createGain();
  o3.type = 'sine';
  o3.frequency.setValueAtTime(250, t + 0.25);
  o3.frequency.linearRampToValueAtTime(300, t + 0.5);
  g3.gain.setValueAtTime(0.12, t + 0.25);
  g3.gain.linearRampToValueAtTime(0, t + 0.55);
  o3.connect(g3).connect(sfxGainNode);
  o3.start(t + 0.25); o3.stop(t + 0.55);
}

function playWinSound() {
  // Triumphant fanfare
  const t = audioCtx.currentTime;
  const notes = [523, 523, 784, 784, 1047, 784, 1047];
  const times = [0, 0.12, 0.24, 0.36, 0.5, 0.65, 0.8];
  const durs  = [0.1, 0.1, 0.1, 0.12, 0.14, 0.12, 0.4];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, t + times[i]);
    gain.gain.linearRampToValueAtTime(0, t + times[i] + durs[i]);
    osc.connect(gain).connect(sfxGainNode);
    osc.start(t + times[i]); osc.stop(t + times[i] + durs[i] + 0.01);
  });
}

function playMeow() {
  const t = audioCtx.currentTime;
  const baseFreq = 600 + Math.random() * 300;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const vibrato = audioCtx.createOscillator();
  const vibGain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq * 0.7, t);
  osc.frequency.linearRampToValueAtTime(baseFreq, t + 0.15);
  osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, t + 0.45);
  vibrato.type = 'sine';
  vibrato.frequency.value = 6;
  vibGain.gain.value = 30;
  vibrato.connect(vibGain).connect(osc.frequency);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
  gain.gain.setValueAtTime(0.12, t + 0.15);
  gain.gain.linearRampToValueAtTime(0, t + 0.45);
  osc.connect(gain).connect(sfxGainNode);
  vibrato.start(t); vibrato.stop(t + 0.5);
  osc.start(t); osc.stop(t + 0.5);
}

function playTeleportSound() {
  const t = audioCtx.currentTime;
  // Silly boing + sparkle
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.1);
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.2);
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
  g.gain.setValueAtTime(0.15, t);
  g.gain.linearRampToValueAtTime(0, t + 0.35);
  osc.connect(g).connect(sfxGainNode);
  osc.start(t); osc.stop(t + 0.36);
  // Sparkle
  const sp = audioCtx.createOscillator();
  const sg = audioCtx.createGain();
  sp.type = 'sine';
  sp.frequency.setValueAtTime(2000, t + 0.1);
  sp.frequency.linearRampToValueAtTime(3000, t + 0.25);
  sg.gain.setValueAtTime(0.06, t + 0.1);
  sg.gain.linearRampToValueAtTime(0, t + 0.3);
  sp.connect(sg).connect(sfxGainNode);
  sp.start(t + 0.1); sp.stop(t + 0.31);
}

// ---- Background Music ----

const SCALE_CHILL = [261.6, 293.7, 329.6, 392.0, 440.0];
const SCALE_FAST  = [329.6, 392.0, 440.0, 523.3, 587.3];
const BASS_NOTES  = [130.8, 164.8, 196.0];

let musicTempo = 0.5;
let nextNoteTime = 0;
let musicBeat = 0;
let musicMelody = [];

function newMelody() {
  const scale = gameStarted ? SCALE_FAST : SCALE_CHILL;
  musicMelody = [];
  for (let i = 0; i < 8; i++) {
    musicMelody.push(scale[Math.floor(Math.random() * scale.length)]);
  }
}

function playMusicNote() {
  const t = nextNoteTime;
  const noteFreq = musicMelody[musicBeat % musicMelody.length];
  const dur = musicTempo * 0.7;

  const osc = audioCtx.createOscillator();
  const env = audioCtx.createGain();
  osc.type = gameStarted ? 'triangle' : 'sine';
  osc.frequency.value = noteFreq;
  env.gain.setValueAtTime(0.1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(env).connect(musicGainNode);
  osc.start(t); osc.stop(t + dur + 0.01);

  if (musicBeat % 4 === 0) {
    const bass = audioCtx.createOscillator();
    const bEnv = audioCtx.createGain();
    bass.type = 'sine';
    bass.frequency.value = BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)];
    bEnv.gain.setValueAtTime(0.12, t);
    bEnv.gain.exponentialRampToValueAtTime(0.001, t + musicTempo * 2);
    bass.connect(bEnv).connect(musicGainNode);
    bass.start(t); bass.stop(t + musicTempo * 2 + 0.01);
  }

  if (musicBeat % 16 === 15) newMelody();
  musicBeat++;
  nextNoteTime += musicTempo;
}

function updateMusic() {
  if (audioCtx.state === 'suspended') return;
  while (nextNoteTime < audioCtx.currentTime + 0.2) {
    playMusicNote();
  }
}

function startMusic() {
  newMelody();
  musicBeat = 0;
  nextNoteTime = audioCtx.currentTime + 0.1;
  musicTempo = 0.5;
}

function setMusicGameMode() {
  musicTempo = 0.22;
  newMelody();
}

function setMusicChillMode() {
  musicTempo = 0.5;
  newMelody();
}

function setMusicUrgentMode() {
  musicTempo = 0.12; // Very fast, urgent
  newMelody();
}

// Random meow timer
let meowTimer = 0;
function scheduleMeow() {
  meowTimer = 3 + Math.random() * 8;
}
scheduleMeow();

// ---- Wall data ----
let walls = [];

// ---- Game state ----
let pauli = { row: 0, col: 0, score: 0, color: '#f5a623', name: 'Pauli', img: pauliImg };
let semi  = { row: 0, col: 0, score: 0, color: '#64b4ff', name: 'Samy',  img: semiImg };
let mouse = { row: 0, col: 0 };
let gameOver = false;
let gameStarted = false;
const WIN_SCORE = 3;

// Per-player animation state
let pauliAnim = { active: false, shakeTime: 0, shakeDir: {dr:0, dc:0} };
let semiAnim  = { active: false, shakeTime: 0, shakeDir: {dr:0, dc:0} };

// Input queues
let pauliPending = null;
let semiPending  = null;

// Catch animation
let catchAnimation = null;

// Mouse relocate timer
let mouseRelocateTime = 8;
let mouseTimer = 8;
let mouseDisappearing = false;

// Urgency mode (after 5 seconds, switch to single-step movement)
let urgencyMode = false;
let urgencyModeTimer = 5;

// ---- Wall generation ----

function initWalls() {
  walls = [];
  for (let r = 0; r < ROWS; r++) {
    walls[r] = [];
    for (let c = 0; c < COLS; c++) {
      walls[r][c] = {
        top: r === 0,
        bottom: r === ROWS - 1,
        left: c === 0,
        right: c === COLS - 1
      };
    }
  }
}

function addWall(r, c, side) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  walls[r][c][side] = true;
  if (side === 'top' && r > 0)         walls[r-1][c].bottom = true;
  if (side === 'bottom' && r < ROWS-1) walls[r+1][c].top = true;
  if (side === 'left' && c > 0)        walls[r][c-1].right = true;
  if (side === 'right' && c < COLS-1)  walls[r][c+1].left = true;
}

function generateRandomWalls() {
  const combos = [
    ['top', 'right'], ['top', 'left'],
    ['bottom', 'right'], ['bottom', 'left'],
    ['right', 'top'], ['right', 'bottom'],
    ['left', 'top'], ['left', 'bottom']
  ];

  // Interior L-shaped wall pairs
  const numPairs = 12 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numPairs; i++) {
    const r = 1 + Math.floor(Math.random() * (ROWS - 2));
    const c = 1 + Math.floor(Math.random() * (COLS - 2));
    const combo = combos[Math.floor(Math.random() * combos.length)];
    addWall(r, c, combo[0]);
    addWall(r, c, combo[1]);
  }

  // Edge notch walls: dividers along the outer border so cats sliding
  // along the edge can stop at irregular intervals, making interior
  // cells reachable by a subsequent perpendicular slide.
  // Top/bottom rows: notches on left or right side of a border cell
  const notchH = 2 + Math.floor(COLS / 3);
  const usedTop = new Set(), usedBottom = new Set();
  for (let i = 0; i < notchH; i++) {
    let c = 1 + Math.floor(Math.random() * (COLS - 2));
    if (!usedTop.has(c)) { addWall(0, c, Math.random() < 0.5 ? 'right' : 'left'); usedTop.add(c); }
    c = 1 + Math.floor(Math.random() * (COLS - 2));
    if (!usedBottom.has(c)) { addWall(ROWS - 1, c, Math.random() < 0.5 ? 'right' : 'left'); usedBottom.add(c); }
  }
  // Left/right columns: notches on top or bottom side of a border cell
  const notchV = 2 + Math.floor(ROWS / 3);
  const usedLeft = new Set(), usedRight = new Set();
  for (let i = 0; i < notchV; i++) {
    let r = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (!usedLeft.has(r)) { addWall(r, 0, Math.random() < 0.5 ? 'top' : 'bottom'); usedLeft.add(r); }
    r = 1 + Math.floor(Math.random() * (ROWS - 2));
    if (!usedRight.has(r)) { addWall(r, COLS - 1, Math.random() < 0.5 ? 'top' : 'bottom'); usedRight.add(r); }
  }
}

// Generate walls and retry until ≥80% of non-center cells are reachable
// via ricochet from any corner. Guarantees the mouse always has good spots.
function generateWallsWithCoverage() {
  const cellKey = (r, c) => r * COLS + c;
  const cx = Math.floor(COLS / 2) - 1;
  const cy = Math.floor(ROWS / 2) - 1;
  const tempCenter = new Set([
    cellKey(cy, cx), cellKey(cy, cx + 1),
    cellKey(cy + 1, cx), cellKey(cy + 1, cx + 1)
  ]);
  const usable = ROWS * COLS - tempCenter.size;

  for (let attempt = 0; attempt < 25; attempt++) {
    initWalls();
    generateRandomWalls();

    // Measure reachability from two opposing corners
    const r1 = ricochetReachable(0, 0, -1, -1);
    const r2 = ricochetReachable(ROWS - 1, COLS - 1, -1, -1);
    const union = new Set([...r1, ...r2]);
    for (const k of tempCenter) union.delete(k);

    if (union.size / usable >= 0.80) return; // good board
  }
  // Fallback: accept whatever we have after final attempt
  initWalls();
  generateRandomWalls();
}

// ---- Ricochet slide computation (from a given cell) ----

function slideFrom(fromRow, fromCol, dRow, dCol, blockerRow, blockerCol) {
  let r = fromRow;
  let c = fromCol;
  while (true) {
    if (dRow === -1 && walls[r][c].top)    break;
    if (dRow ===  1 && walls[r][c].bottom) break;
    if (dCol === -1 && walls[r][c].left)   break;
    if (dCol ===  1 && walls[r][c].right)  break;
    const nr = r + dRow;
    const nc = c + dCol;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
    if (dRow === -1 && walls[nr][nc].bottom) break;
    if (dRow ===  1 && walls[nr][nc].top)    break;
    if (dCol === -1 && walls[nr][nc].right)  break;
    if (dCol ===  1 && walls[nr][nc].left)   break;
    if (nr === blockerRow && nc === blockerCol) break;
    r = nr; c = nc;
  }
  return { row: r, col: c };
}

// ---- Ricochet reachability (BFS over ricochet moves) ----

function ricochetReachable(startRow, startCol, blockerRow, blockerCol) {
  // Returns a Set of cell keys reachable by ricochet sliding
  const visited = new Set();
  const key = (r, c) => r * COLS + c;
  const queue = [{ row: startRow, col: startCol }];
  visited.add(key(startRow, startCol));
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const { row, col } = queue.shift();
    for (const [dRow, dCol] of dirs) {
      const dest = slideFrom(row, col, dRow, dCol, blockerRow, blockerCol);
      const k = key(dest.row, dest.col);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ row: dest.row, col: dest.col });
      }
    }
  }
  return visited;
}

// Full cooperative reachability: search the (posA, posB) state space
// so that the cats can move in turns to help each other reach new cells
function cooperativeReachable(pauliRow, pauliCol, semiRow, semiCol) {
  const stateKey = (pr, pc, sr, sc) => ((pr * COLS + pc) * ROWS + sr) * COLS + sc;
  const visited = new Set();
  const queue = [{ pr: pauliRow, pc: pauliCol, sr: semiRow, sc: semiCol }];
  visited.add(stateKey(pauliRow, pauliCol, semiRow, semiCol));

  const pauliCells = new Set();
  const semiCells = new Set();
  const cellKey = (r, c) => r * COLS + c;
  pauliCells.add(cellKey(pauliRow, pauliCol));
  semiCells.add(cellKey(semiRow, semiCol));

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const { pr, pc, sr, sc } = queue.shift();

    // Try moving Pauli in each direction (Semi is blocker)
    for (const [dRow, dCol] of dirs) {
      const dest = slideFrom(pr, pc, dRow, dCol, sr, sc);
      const sk = stateKey(dest.row, dest.col, sr, sc);
      if (!visited.has(sk)) {
        visited.add(sk);
        pauliCells.add(cellKey(dest.row, dest.col));
        queue.push({ pr: dest.row, pc: dest.col, sr: sr, sc: sc });
      }
    }

    // Try moving Semi in each direction (Pauli is blocker)
    for (const [dRow, dCol] of dirs) {
      const dest = slideFrom(sr, sc, dRow, dCol, pr, pc);
      const sk = stateKey(pr, pc, dest.row, dest.col);
      if (!visited.has(sk)) {
        visited.add(sk);
        semiCells.add(cellKey(dest.row, dest.col));
        queue.push({ pr: pr, pc: pc, sr: dest.row, sc: dest.col });
      }
    }
  }

  // Union: cells reachable by either cat
  const all = new Set(pauliCells);
  for (const k of semiCells) all.add(k);
  return all;
}

// ---- Placement ----

function randomEmptyCell(occupied) {
  let r, c;
  do {
    r = Math.floor(Math.random() * ROWS);
    c = Math.floor(Math.random() * COLS);
  } while (occupied.some(o => o.row === r && o.col === c));
  return { row: r, col: c };
}

const centerCells = new Set();

function placeMouse() {
  const cellKey = (r, c) => r * COLS + c;
  const reachable = cooperativeReachable(
    Math.round(pauli.row), Math.round(pauli.col),
    Math.round(semi.row), Math.round(semi.col)
  );

  const occupied = [
    { row: Math.round(pauli.row), col: Math.round(pauli.col) },
    { row: Math.round(semi.row), col: Math.round(semi.col) }
  ];

  const candidates = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (centerCells.has(cellKey(r, c))) continue;
      if (occupied.some(o => o.row === r && o.col === c)) continue;
      if (reachable.has(cellKey(r, c))) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  if (candidates.length === 0) {
    // Fallback: regenerate board
    initGame();
    return;
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  mouse.row = pick.row;
  mouse.col = pick.col;
  mouseTimer = mouseRelocateTime;
  mouseDisappearing = false;
  urgencyMode = false;
  urgencyModeTimer = 5;
  
  // Reset music to normal game mode
  if (gameStarted && !gameOver) {
    setMusicGameMode();
  }
}

// ---- Ricochet slide for gameplay ----

function computeSlide(player, dRow, dCol) {
  const other = player === pauli ? semi : pauli;
  return slideFrom(
    Math.round(player.row), Math.round(player.col),
    dRow, dCol,
    Math.round(other.row), Math.round(other.col)
  );
}

// ---- Start a slide animation ----

function startSlide(player, anim, dRow, dCol) {
  let target;
  
  // In urgency mode, move only one cell
  if (urgencyMode) {
    const pr = Math.round(player.row);
    const pc = Math.round(player.col);
    const nr = pr + dRow;
    const nc = pc + dCol;
    
    // Check if single step is valid
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    
    // Check for wall blocking
    if (dRow === -1 && walls[pr][pc].top) return;
    if (dRow === 1 && walls[pr][pc].bottom) return;
    if (dCol === -1 && walls[pr][pc].left) return;
    if (dCol === 1 && walls[pr][pc].right) return;
    
    // Check for other player blocking
    const other = (player === pauli) ? semi : pauli;
    const or = Math.round(other.row);
    const oc = Math.round(other.col);
    if (nr === or && nc === oc) return;
    
    target = { row: nr, col: nc };
  } else {
    target = computeSlide(player, dRow, dCol);
  }
  
  const pr = Math.round(player.row);
  const pc = Math.round(player.col);
  const dist = Math.abs(target.row - pr) + Math.abs(target.col - pc);
  if (dist === 0) return;

  playSlideSound();

  anim.active = true;
  anim.startRow = pr;
  anim.startCol = pc;
  anim.targetRow = target.row;
  anim.targetCol = target.col;
  anim.progress = 0;
  anim.totalDist = dist;
  anim.dRow = dRow;
  anim.dCol = dCol;
  anim.shakeTime = 0;

  // Snap to grid before starting
  player.row = pr;
  player.col = pc;
}

// ---- Animation update ----
const SLIDE_SPEED = 18;

function updateAnim(player, anim, dt) {
  if (!anim.active && anim.shakeTime <= 0) return;

  if (anim.shakeTime > 0) {
    anim.shakeTime -= dt;
    if (anim.shakeTime <= 0) anim.shakeTime = 0;
  }

  if (!anim.active) return;

  anim.progress += SLIDE_SPEED * dt;
  if (anim.progress >= anim.totalDist) {
    anim.progress = anim.totalDist;
    anim.active = false;

    player.row = anim.targetRow;
    player.col = anim.targetCol;

    playBumpSound();
    anim.shakeTime = 0.2;
    anim.shakeDir = { dr: anim.dRow, dc: anim.dCol };

    checkMouseCaught(player);

    const pending = player === pauli ? pauliPending : semiPending;
    if (pending && !gameOver) {
      if (player === pauli) pauliPending = null; else semiPending = null;
      startSlide(player, anim, pending.dRow, pending.dCol);
    }
  } else {
    const frac = anim.progress;
    player.row = anim.startRow + anim.dRow * frac;
    player.col = anim.startCol + anim.dCol * frac;
  }
}

// ---- Check round ----

function checkMouseCaught(player) {
  if (Math.round(player.row) === mouse.row && Math.round(player.col) === mouse.col) {
    player.score++;
    updateScoreboard();
    
    // Start catch animation
    startCatchAnimation(player);
    
    if (player.score >= WIN_SCORE) {
      gameOver = true;
      playWinSound();
      msgEl.textContent = `${player.name} wins the game! 🎉`;
    } else {
      playNomSound();
      msgEl.textContent = `${player.name} caught the mouse! (+1)`;
      setTimeout(() => {
        if (!gameOver) {
          placeMouse();
          msgEl.textContent = 'Chase the mouse!';
        }
      }, 1200);
    }
    return true;
  }
  return false;
}

// ---- Drawing ----

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  drawMouse();
  drawPlayer(pauli, pauliAnim);
  drawPlayer(semi, semiAnim);
  
  // Draw catch animation
  if (catchAnimation) {
    drawCatchAnimation();
  }
  
  // Draw urgency mode indicator
  if (urgencyMode) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
    ctx.strokeStyle = `rgba(255, 50, 50, ${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    
    // "URGENCY MODE" text
    ctx.save();
    ctx.fillStyle = `rgba(255, 50, 50, ${0.7 + pulse * 0.3})`;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('⚡ URGENCY MODE ⚡', canvas.width / 2, 15);
    ctx.restore();
  }
}

function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL;
      const y = r * CELL;
      ctx.fillStyle = (r + c) % 2 === 0 ? '#d8d3c8' : '#cec9bd';
      ctx.fillRect(x, y, CELL, CELL);
      const inset = 3;
      ctx.fillStyle = (r + c) % 2 === 0 ? '#e2ddd2' : '#d8d3c7';
      ctx.fillRect(x + inset, y + inset, CELL - inset * 2, CELL - inset * 2);
    }
  }

  // Center block
  const cx = Math.floor(COLS / 2) - 1;
  const cy = Math.floor(ROWS / 2) - 1;
  ctx.fillStyle = '#5a5a6a';
  ctx.fillRect(cx * CELL, cy * CELL, CELL * 2, CELL * 2);
  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(cx * CELL + 4, cy * CELL + 4, CELL * 2 - 8, CELL * 2 - 8);

  // Grid lines
  ctx.strokeStyle = '#b0aa9e';
  ctx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(canvas.width, r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, canvas.height); ctx.stroke();
  }

  // Internal walls
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * CELL;
      const y = r * CELL;
      const w = walls[r][c];
      const isOuter = (side) => {
        if (side === 'top' && r === 0) return true;
        if (side === 'bottom' && r === ROWS - 1) return true;
        if (side === 'left' && c === 0) return true;
        if (side === 'right' && c === COLS - 1) return true;
        return false;
      };
      ctx.lineCap = 'square';
      if (w.top && !isOuter('top'))       drawWallLine(x - 1, y, x + CELL + 1, y);
      if (w.bottom && !isOuter('bottom')) drawWallLine(x - 1, y + CELL, x + CELL + 1, y + CELL);
      if (w.left && !isOuter('left'))     drawWallLine(x, y - 1, x, y + CELL + 1);
      if (w.right && !isOuter('right'))   drawWallLine(x + CELL, y - 1, x + CELL, y + CELL + 1);
    }
  }

  // Outer border
  ctx.strokeStyle = WALL_OUTER_COLOR;
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawWallLine(x1, y1, x2, y2) {
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = WALL_W + 3;
  ctx.beginPath(); ctx.moveTo(x1 + 1, y1 + 1); ctx.lineTo(x2 + 1, y2 + 1); ctx.stroke();
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = WALL_W;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1 - 1, y1 - 1); ctx.lineTo(x2 - 1, y2 - 1); ctx.stroke();
}

function drawPlayer(player, anim) {
  let px = player.col * CELL + CELL / 2;
  let py = player.row * CELL + CELL / 2;

  if (anim.shakeTime > 0) {
    const intensity = anim.shakeTime / 0.2;
    const shake = Math.sin(anim.shakeTime * 60) * 4 * intensity;
    px += anim.shakeDir.dc * shake;
    py += anim.shakeDir.dr * shake;
  }

  let size = CELL * 0.8;
  
  // Catch animation zoom
  if (catchAnimation && catchAnimation.player === player) {
    const progress = catchAnimation.progress;
    if (progress < 0.3) {
      // Zoom in
      const zoomFactor = 1 + (progress / 0.3) * 0.5;
      size *= zoomFactor;
    } else if (progress > 0.7) {
      // Zoom out
      const zoomFactor = 1.5 - ((progress - 0.7) / 0.3) * 0.5;
      size *= zoomFactor;
    } else {
      size *= 1.5;
    }
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(px + 2, py + 3, size * 0.4, size * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (player.img.complete && player.img.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, size * 0.42, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(player.img, px - size * 0.42, py - size * 0.42, size * 0.84, size * 0.84);
    ctx.restore();
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.42, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(px, py, size * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#333';
  ctx.font = `bold ${CELL * 0.22}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(player.name, px, py + size * 0.42 + 1);
}

function drawMouse() {
  // Fade out during catch animation
  let alpha = 1;
  if (catchAnimation && catchAnimation.progress > 0.2) {
    alpha = Math.max(0, 1 - (catchAnimation.progress - 0.2) / 0.3);
  }
  
  // Disappearing animation for relocate
  if (mouseDisappearing) {
    const disappearProgress = (2 - mouseTimer) / 2;
    alpha = Math.max(0, 1 - disappearProgress * disappearProgress);
    
    // Swirl effect
    const swirlAngle = disappearProgress * Math.PI * 4;
    const swirlRadius = disappearProgress * CELL * 0.3;
    const swirlX = Math.cos(swirlAngle) * swirlRadius;
    const swirlY = Math.sin(swirlAngle) * swirlRadius;
  }
  
  if (alpha <= 0) return;
  
  const px = mouse.col * CELL + CELL / 2;
  const py = mouse.row * CELL + CELL / 2;
  const size = CELL * 0.5;

  ctx.globalAlpha = alpha;
  
  // Countdown indicator
  if (mouseTimer <= 3 && !mouseDisappearing && !catchAnimation) {
    const warningAlpha = 0.3 + Math.sin(mouseTimer * 8) * 0.2;
    ctx.globalAlpha = warningAlpha;
    ctx.strokeStyle = mouseTimer <= 1.5 ? '#ff4444' : '#ffaa00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, size * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }
  
  const grad = ctx.createRadialGradient(px, py, 0, px, py, size);
  grad.addColorStop(0, 'rgba(255, 220, 100, 0.3)');
  grad.addColorStop(1, 'rgba(255, 220, 100, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fill();

  if (jerryImg.complete && jerryImg.naturalWidth > 0) {
    const imgSize = CELL * 0.7;
    ctx.drawImage(jerryImg, px - imgSize / 2, py - imgSize / 2, imgSize, imgSize);
  } else {
    ctx.font = `${CELL * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐭', px, py);
  }
  
  // Timer text
  if (mouseTimer <= 3 && !mouseDisappearing && !catchAnimation) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = mouseTimer <= 1.5 ? '#ff4444' : '#ffaa00';
    ctx.font = `bold ${CELL * 0.35}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(mouseTimer), px, py - size * 1.8);
  }
  
  ctx.globalAlpha = 1;
}

function updateScoreboard() {
  document.getElementById('score-pauli').textContent = pauli.score;
  document.getElementById('score-semi').textContent = semi.score;
}

// ---- Input ----

document.addEventListener('keydown', (e) => {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // Enter = full reset (always available)
  if (e.key === 'Enter') {
    e.preventDefault();
    restartGame();
    return;
  }

  // Space = teleport mouse
  if (e.key === ' ') {
    e.preventDefault();
    if (!gameOver && !pauliAnim.active && !semiAnim.active) {
      playTeleportSound();
      placeMouse();
      msgEl.textContent = 'Jerry teleported! ✨';
    }
    return;
  }

  if (gameOver) return;

  let player = null;
  let anim = null;
  let dRow = 0, dCol = 0;

  switch (e.key) {
    case 'w': case 'W': player = pauli; anim = pauliAnim; dRow = -1; break;
    case 's': case 'S': player = pauli; anim = pauliAnim; dRow =  1; break;
    case 'a': case 'A': player = pauli; anim = pauliAnim; dCol = -1; break;
    case 'd': case 'D': player = pauli; anim = pauliAnim; dCol =  1; break;
    case 'ArrowUp':    player = semi; anim = semiAnim; dRow = -1; break;
    case 'ArrowDown':  player = semi; anim = semiAnim; dRow =  1; break;
    case 'ArrowLeft':  player = semi; anim = semiAnim; dCol = -1; break;
    case 'ArrowRight': player = semi; anim = semiAnim; dCol =  1; break;
  }

  if (!player) return;
  e.preventDefault();

  if (!gameStarted) {
    gameStarted = true;
    mouseTimer = mouseRelocateTime;
    mouseDisappearing = false;
    urgencyMode = false;
    urgencyModeTimer = 5;
    setMusicGameMode();
  }

  msgEl.textContent = 'Chase the mouse!';

  if (anim.active) {
    if (player === pauli) pauliPending = { dRow, dCol };
    else semiPending = { dRow, dCol };
  } else {
    startSlide(player, anim, dRow, dCol);
  }
});

// ---- Main game loop ----

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  updateAnim(pauli, pauliAnim, dt);
  updateAnim(semi, semiAnim, dt);
  updateMusic();
  
  // Update catch animation
  if (catchAnimation) {
    catchAnimation.progress += dt * 1.2;
    if (catchAnimation.progress >= 1) {
      catchAnimation = null;
    }
  }
  
  // Mouse relocate timer
  if (!gameOver && gameStarted && !catchAnimation) {
    mouseTimer -= dt;
    
    if (mouseTimer <= 2 && !mouseDisappearing) {
      mouseDisappearing = true;
    }
    
    if (mouseTimer <= 0) {
      playTeleportSound();
      placeMouse();
    }
  }
  
  // Urgency mode timer
  if (!gameOver && gameStarted && !catchAnimation && !urgencyMode) {
    urgencyModeTimer -= dt;
    
    if (urgencyModeTimer <= 0) {
      urgencyMode = true;
      setMusicUrgentMode();
    }
  }

  // Random meows
  if (!gameOver) {
    meowTimer -= dt;
    if (meowTimer <= 0) {
      playMeow();
      scheduleMeow();
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

// ---- Game init ----

function initGame() {
  gameOver = false;
  gameStarted = false;
  pauliAnim = { active: false, shakeTime: 0, shakeDir: {dr:0, dc:0} };
  semiAnim  = { active: false, shakeTime: 0, shakeDir: {dr:0, dc:0} };
  pauliPending = null;
  semiPending = null;
  pauli.score = 0;
  semi.score = 0;
  pauli.img = pauliImg;
  semi.img = semiImg;
  mouseTimer = mouseRelocateTime;
  mouseDisappearing = false;
  urgencyMode = false;
  urgencyModeTimer = 5;
  catchAnimation = null;
  updateScoreboard();
  msgEl.textContent = 'Press any key to start!';
  scheduleMeow();
  startMusic();

  generateWallsWithCoverage();

  // Block center 2x2
  const cx = Math.floor(COLS / 2) - 1;
  const cy = Math.floor(ROWS / 2) - 1;
  centerCells.clear();
  const cellKey = (r, c) => r * COLS + c;
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      addWall(cy + dr, cx + dc, 'top');
      addWall(cy + dr, cx + dc, 'bottom');
      addWall(cy + dr, cx + dc, 'left');
      addWall(cy + dr, cx + dc, 'right');
      centerCells.add(cellKey(cy + dr, cx + dc));
    }
  }

  // Place Pauli avoiding center
  const occupiedInit = [];
  for (let dr = 0; dr < 2; dr++)
    for (let dc = 0; dc < 2; dc++)
      occupiedInit.push({row: cy + dr, col: cx + dc});

  const p1 = randomEmptyCell(occupiedInit);
  pauli.row = p1.row; pauli.col = p1.col;

  // Place Semi reachable from Pauli via ricochet
  const pauliReach = ricochetReachable(pauli.row, pauli.col, -1, -1);
  const semiCandidates = [];
  const pauliKey = cellKey(pauli.row, pauli.col);
  for (const k of pauliReach) {
    if (k === pauliKey) continue;
    const r = Math.floor(k / COLS);
    const c = k % COLS;
    if (centerCells.has(k)) continue;
    semiCandidates.push({ row: r, col: c });
  }

  if (semiCandidates.length > 0) {
    const pick = semiCandidates[Math.floor(Math.random() * semiCandidates.length)];
    semi.row = pick.row; semi.col = pick.col;
  } else {
    // Board too fragmented, retry
    initGame(); return;
  }

  placeMouse();
}

function restartGame() {
  initGame();
}

// Volume control listeners
const musicVolumeSlider = document.getElementById('music-volume');
const musicValueSpan = document.getElementById('music-value');
const sfxVolumeSlider = document.getElementById('sfx-volume');
const sfxValueSpan = document.getElementById('sfx-value');

musicVolumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  musicGainNode.gain.value = value / 100;
  musicValueSpan.textContent = `${value}%`;
});

sfxVolumeSlider.addEventListener('input', (e) => {
  const value = e.target.value;
  sfxGainNode.gain.value = value / 100;
  sfxValueSpan.textContent = `${value}%`;
});

const boardSizeSlider = document.getElementById('board-size');
const boardValueSpan = document.getElementById('board-value');

boardSizeSlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  COLS = value;
  ROWS = value;
  CELL = canvas.width / COLS;
  boardValueSpan.textContent = `${value}×${value}`;
  initGame();
});

const relocateTimeInput = document.getElementById('relocate-time');

relocateTimeInput.addEventListener('change', (e) => {
  const value = parseInt(e.target.value);
  if (value >= 3 && value <= 30) {
    mouseRelocateTime = value;
    mouseTimer = value;
  } else {
    e.target.value = mouseRelocateTime;
  }
});

// Catch animation system
function startCatchAnimation(player) {
  const px = player.col * CELL + CELL / 2;
  const py = player.row * CELL + CELL / 2;
  
  const particles = [];
  const numParticles = 30;
  
  for (let i = 0; i < numParticles; i++) {
    const angle = (Math.PI * 2 * i) / numParticles;
    particles.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * (2 + Math.random() * 2),
      vy: Math.sin(angle) * (2 + Math.random() * 2),
      life: 1,
      color: player.color,
      size: 3 + Math.random() * 4
    });
  }
  
  catchAnimation = {
    player: player,
    particles: particles,
    progress: 0,
    centerX: px,
    centerY: py
  };
}

function drawCatchAnimation() {
  const anim = catchAnimation;
  const progress = anim.progress;
  
  // Draw particles
  anim.particles.forEach(p => {
    p.x += p.vx * 3;
    p.y += p.vy * 3;
    p.vy += 0.15; // gravity
    p.life -= 0.02;
    
    if (p.life > 0) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Sparkle trail
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Flash effect
  if (progress < 0.15) {
    const flashAlpha = (0.15 - progress) / 0.15 * 0.3;
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Star burst
  if (progress < 0.5) {
    const starAlpha = (0.5 - progress) / 0.5;
    ctx.globalAlpha = starAlpha * 0.6;
    ctx.strokeStyle = anim.player.color;
    ctx.lineWidth = 3;
    const numRays = 8;
    const innerRadius = CELL * 0.5;
    const outerRadius = CELL * 1.5 * (progress / 0.5);
    
    for (let i = 0; i < numRays; i++) {
      const angle = (Math.PI * 2 * i) / numRays;
      ctx.beginPath();
      ctx.moveTo(
        anim.centerX + Math.cos(angle) * innerRadius,
        anim.centerY + Math.sin(angle) * innerRadius
      );
      ctx.lineTo(
        anim.centerX + Math.cos(angle) * outerRadius,
        anim.centerY + Math.sin(angle) * outerRadius
      );
      ctx.stroke();
    }
  }
  
  ctx.globalAlpha = 1;
}

// Start
initGame();
requestAnimationFrame((ts) => { lastTime = ts; requestAnimationFrame(gameLoop); });

