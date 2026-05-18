// ============================================
// CONSTANTS
// ============================================
const NUM_PILLARS = 5;
const NUM_SLOTS = 4; // gaps between pillars

// ============================================
// LEVEL DEFINITIONS
// ============================================
// 5 pillars → 4 slots (0–3)
// initial/goal: arrays of 4 stacks (bottom→top)
// fixedSlot: null or ONE slot index that is locked
// With 1 locked you always have 3 free slots → always solvable

const LEVELS = [
  {
    description: "Warm Up",
    initial:  [[2, 1], [], [], []],
    goal:     [[], [], [], [2, 1]],
    fixedSlot: null,
    minMoves: 3
  },
  {
    description: "Three Bridges",
    initial:  [[3, 2, 1], [], [], []],
    goal:     [[], [], [], [3, 2, 1]],
    fixedSlot: null,
    minMoves: 7
  },
  {
    description: "Spread Out",
    initial:  [[3, 2, 1], [], [], []],
    goal:     [[3], [2], [1], []],
    fixedSlot: null,
    minMoves: 5
  },
  {
    description: "First Blockade",
    initial:  [[3, 2, 1], [], [], []],
    goal:     [[], [], [], [3, 2, 1]],
    fixedSlot: 1,
    minMoves: 9
  },
  {
    description: "Four Bridges",
    initial:  [[4, 3, 2, 1], [], [], []],
    goal:     [[], [], [], [4, 3, 2, 1]],
    fixedSlot: null,
    minMoves: 15
  },
  {
    description: "Blocked Center",
    initial:  [[4, 3, 2, 1], [], [], []],
    goal:     [[], [], [], [4, 3, 2, 1]],
    fixedSlot: 2,
    minMoves: 17
  },
  {
    description: "Rearrange",
    initial:  [[3, 1], [2], [], []],
    goal:     [[], [], [3, 2, 1], []],
    fixedSlot: null,
    minMoves: 5
  },
  {
    description: "Rearrange Blocked",
    initial:  [[3, 1], [2], [], []],
    goal:     [[], [], [], [3, 2, 1]],
    fixedSlot: 1,
    minMoves: 9
  },
  {
    description: "Five Bridges",
    initial:  [[5, 4, 3, 2, 1], [], [], []],
    goal:     [[], [], [], [5, 4, 3, 2, 1]],
    fixedSlot: null,
    minMoves: 31
  },
  {
    description: "Grand Finale",
    initial:  [[5, 4, 3, 2, 1], [], [], []],
    goal:     [[], [], [], [5, 4, 3, 2, 1]],
    fixedSlot: 1,
    minMoves: 49
  }
];

// ============================================
// GAME STATE
// ============================================
let currentLevel = 0;
let slots = [];
let moveCount = 0;
let timerInterval = null;
let startTime = null;
let elapsedSeconds = 0;
let levelLog = [];
let fullGameLog = [];
let levelResults = [];

// ============================================
// DOM REFS
// ============================================
const $ = id => document.getElementById(id);

const titleScreen   = $('title-screen');
const gameScreen    = $('game-screen');
const startBtn      = $('start-btn');
const resetBtn      = $('reset-btn');
const logBtn        = $('log-btn');
const menuBtn       = $('menu-btn');
const levelNameEl   = $('level-name');
const moveCountEl   = $('move-count');
const minMovesEl    = $('min-moves');
const timerEl       = $('timer');
const goalArea      = $('goal-area');
const gameArea      = $('game-area');
const feedbackEl    = $('feedback');
const levelCompleteEl = $('level-complete');
const resultMoves   = $('result-moves');
const resultMin     = $('result-min');
const resultTime    = $('result-time');
const resultRating  = $('result-rating');
const nextLevelBtn  = $('next-level-btn');
const gameCompleteEl = $('game-complete');
const finalSummary  = $('final-summary');
const exportBtn     = $('export-btn');
const restartBtn    = $('restart-btn');
const logModal      = $('log-modal');
const logContent    = $('log-content');
const closeLogBtn   = $('close-log-btn');

// ============================================
// EVENTS
// ============================================
startBtn.addEventListener('click', () => {
  titleScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  currentLevel = 0;
  levelResults = [];
  fullGameLog = [];
  loadLevel(currentLevel);
});

resetBtn.addEventListener('click', () => loadLevel(currentLevel));

menuBtn.addEventListener('click', () => {
  stopTimer();
  gameScreen.classList.add('hidden');
  titleScreen.classList.remove('hidden');
});

nextLevelBtn.addEventListener('click', () => {
  levelCompleteEl.classList.add('hidden');
  currentLevel++;
  if (currentLevel < LEVELS.length) {
    loadLevel(currentLevel);
  } else {
    showGameComplete();
  }
});

logBtn.addEventListener('click', showLog);
closeLogBtn.addEventListener('click', () => logModal.classList.add('hidden'));
exportBtn.addEventListener('click', exportLog);

restartBtn.addEventListener('click', () => {
  gameCompleteEl.classList.add('hidden');
  currentLevel = 0;
  levelResults = [];
  fullGameLog = [];
  loadLevel(currentLevel);
});

// ============================================
// LOAD LEVEL
// ============================================
function loadLevel(index) {
  const level = LEVELS[index];
  slots = level.initial.map(s => [...s]);

  moveCount = 0;
  levelLog = [];
  elapsedSeconds = 0;

  levelNameEl.textContent = `Level ${index + 1} — ${level.description}`;
  moveCountEl.textContent = 0;
  minMovesEl.textContent = level.minMoves;
  timerEl.textContent = '00:00';
  feedbackEl.classList.add('hidden');
  levelCompleteEl.classList.add('hidden');

  addLog('LEVEL_START', {
    level: index + 1,
    description: level.description,
    initial: JSON.parse(JSON.stringify(level.initial)),
    goal: JSON.parse(JSON.stringify(level.goal)),
    fixedSlot: level.fixedSlot,
    minMoves: level.minMoves
  });

  renderGoal(level);
  renderGame();
  startTimer();
}

// ============================================
// RENDER GOAL
// ============================================
function renderGoal(level) {
  goalArea.innerHTML = '';

  for (let p = 0; p < NUM_PILLARS; p++) {
    const pillar = document.createElement('div');
    pillar.classList.add('goal-pillar');
    goalArea.appendChild(pillar);

    if (p < NUM_SLOTS) {
      const slotEl = document.createElement('div');
      slotEl.classList.add('goal-slot');

      if (level.fixedSlot === p) {
        const fb = document.createElement('div');
        fb.classList.add('goal-bridge', 'fixed-goal');
        slotEl.appendChild(fb);
      }

      (level.goal[p] || []).forEach(w => {
        const b = document.createElement('div');
        b.classList.add('goal-bridge');
        b.dataset.weight = w;
        slotEl.appendChild(b);
      });

      goalArea.appendChild(slotEl);
    }
  }
}

// ============================================
// RENDER GAME
// ============================================
function renderGame() {
  const level = LEVELS[currentLevel];
  gameArea.innerHTML = '';

  for (let p = 0; p < NUM_PILLARS; p++) {
    // Pillar
    const pillar = document.createElement('div');
    pillar.classList.add('platform-pillar');

    const cap = document.createElement('div');
    cap.classList.add('pillar-cap');
    pillar.appendChild(cap);

    const lbl = document.createElement('div');
    lbl.classList.add('pillar-label');
    lbl.textContent = `P${p + 1}`;
    pillar.appendChild(lbl);

    gameArea.appendChild(pillar);

    // Slot
    if (p < NUM_SLOTS) {
      const slotEl = document.createElement('div');
      slotEl.classList.add('bridge-slot');
      slotEl.dataset.slot = p;

      const slotLbl = document.createElement('div');
      slotLbl.classList.add('slot-label');
      slotLbl.textContent = `Slot ${p + 1}`;
      slotEl.appendChild(slotLbl);

      const isFixed = (level.fixedSlot === p);

      // Fixed bridge piece
      if (isFixed) {
        const fb = document.createElement('div');
        fb.classList.add('bridge-piece', 'fixed-bridge');
        fb.textContent = 'FIXED';
        fb.setAttribute('draggable', 'false');
        slotEl.appendChild(fb);
      }

      // Movable pieces
      const stack = slots[p];
      stack.forEach((weight, idx) => {
        const piece = document.createElement('div');
        piece.classList.add('bridge-piece');
        piece.dataset.weight = weight;
        piece.dataset.slot = p;
        piece.dataset.stackIndex = idx;
        piece.textContent = `W${weight}`;

        const isTop = (idx === stack.length - 1);
        if (isTop) {
          piece.setAttribute('draggable', 'true');
          addPieceDragListeners(piece);
        } else {
          piece.classList.add('not-draggable');
          piece.setAttribute('draggable', 'false');
        }

        slotEl.appendChild(piece);
      });

      addSlotDropListeners(slotEl);
      gameArea.appendChild(slotEl);
    }
  }
}

// ============================================
// DRAG & DROP — MOUSE
// ============================================
let dragData = null;

function addPieceDragListeners(el) {
  el.addEventListener('dragstart', onDragStart);
  el.addEventListener('dragend', onDragEnd);
  el.addEventListener('touchstart', onTouchStart, { passive: false });
  el.addEventListener('touchmove', onTouchMove, { passive: false });
  el.addEventListener('touchend', onTouchEnd, { passive: false });
}

function onDragStart(e) {
  const slotIdx = parseInt(e.target.dataset.slot);
  const weight = parseInt(e.target.dataset.weight);
  const stack = slots[slotIdx];

  if (stack[stack.length - 1] !== weight) {
    e.preventDefault();
    return;
  }

  dragData = { slotIndex: slotIdx, weight };
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', '');

  const ghost = e.target.cloneNode(true);
  ghost.style.position = 'absolute';
  ghost.style.top = '-9999px';
  ghost.style.width = e.target.offsetWidth + 'px';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, 12);
  requestAnimationFrame(() => ghost.remove());
}

function onDragEnd(e) {
  e.target.classList.remove('dragging');
  clearHighlights();
  dragData = null;
}

function addSlotDropListeners(slotEl) {
  slotEl.addEventListener('dragover', onDragOver);
  slotEl.addEventListener('dragleave', onDragLeave);
  slotEl.addEventListener('drop', onDrop);
}

function onDragOver(e) {
  e.preventDefault();
  if (!dragData) return;

  const targetSlot = parseInt(e.currentTarget.dataset.slot);
  const valid = isValidMove(dragData.slotIndex, targetSlot, dragData.weight);

  clearHighlights();
  e.currentTarget.classList.add(valid ? 'drop-hover' : 'drop-invalid');
  e.dataTransfer.dropEffect = valid ? 'move' : 'none';
}

function onDragLeave(e) {
  e.currentTarget.classList.remove('drop-hover', 'drop-invalid');
}

function onDrop(e) {
  e.preventDefault();
  clearHighlights();
  if (!dragData) return;

  const targetSlot = parseInt(e.currentTarget.dataset.slot);
  attemptMove(dragData.slotIndex, targetSlot, dragData.weight);
  dragData = null;
}

function clearHighlights() {
  document.querySelectorAll('.bridge-slot').forEach(s => {
    s.classList.remove('drop-hover', 'drop-invalid');
  });
}

// ============================================
// TOUCH DRAG
// ============================================
let touchDragEl = null;
let touchGhost = null;

function onTouchStart(e) {
  const target = e.target.closest('.bridge-piece');
  if (!target || target.classList.contains('fixed-bridge') || target.classList.contains('not-draggable')) return;
  e.preventDefault();

  const slotIdx = parseInt(target.dataset.slot);
  const weight = parseInt(target.dataset.weight);
  const stack = slots[slotIdx];
  if (stack[stack.length - 1] !== weight) return;

  dragData = { slotIndex: slotIdx, weight };
  touchDragEl = target;
  target.classList.add('dragging');

  touchGhost = document.createElement('div');
  touchGhost.classList.add('drag-ghost');
  touchGhost.dataset.weight = weight;
  touchGhost.textContent = `W${weight}`;
  touchGhost.style.width = target.offsetWidth + 'px';
  touchGhost.style.background = getComputedStyle(target).background;
  document.body.appendChild(touchGhost);

  const touch = e.touches[0];
  touchGhost.style.left = touch.clientX + 'px';
  touchGhost.style.top = touch.clientY + 'px';
}

function onTouchMove(e) {
  if (!touchGhost) return;
  e.preventDefault();

  const touch = e.touches[0];
  touchGhost.style.left = touch.clientX + 'px';
  touchGhost.style.top = touch.clientY + 'px';

  clearHighlights();
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const slotEl = el ? el.closest('.bridge-slot') : null;
  if (slotEl && dragData) {
    const idx = parseInt(slotEl.dataset.slot);
    const valid = isValidMove(dragData.slotIndex, idx, dragData.weight);
    slotEl.classList.add(valid ? 'drop-hover' : 'drop-invalid');
  }
}

function onTouchEnd(e) {
  if (!touchGhost || !dragData) { cleanupTouch(); return; }

  const touch = e.changedTouches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const slotEl = el ? el.closest('.bridge-slot') : null;

  if (slotEl) {
    const idx = parseInt(slotEl.dataset.slot);
    attemptMove(dragData.slotIndex, idx, dragData.weight);
  }

  cleanupTouch();
}

function cleanupTouch() {
  if (touchDragEl) touchDragEl.classList.remove('dragging');
  if (touchGhost) touchGhost.remove();
  touchDragEl = null;
  touchGhost = null;
  dragData = null;
  clearHighlights();
}

// ============================================
// MOVE LOGIC
// ============================================
function isValidMove(fromSlot, toSlot, weight) {
  if (fromSlot === toSlot) return false;

  const level = LEVELS[currentLevel];
  if (level.fixedSlot === toSlot) return false;

  const targetStack = slots[toSlot];
  if (targetStack.length === 0) return true;

  return weight <= targetStack[targetStack.length - 1];
}

function attemptMove(fromSlot, toSlot, weight) {
  if (!isValidMove(fromSlot, toSlot, weight)) {
    showFeedback('❌ Invalid move!');
    addLog('INVALID_MOVE', {
      piece: weight,
      from: fromSlot + 1,
      to: toSlot + 1,
      reason: getInvalidReason(fromSlot, toSlot, weight)
    });
    return;
  }

  slots[fromSlot].pop();
  slots[toSlot].push(weight);
  moveCount++;
  moveCountEl.textContent = moveCount;

  addLog('MOVE', {
    moveNumber: moveCount,
    piece: weight,
    from: fromSlot + 1,
    to: toSlot + 1,
    state: JSON.parse(JSON.stringify(slots))
  });

  renderGame();

  if (checkWin()) {
    onLevelComplete();
  }
}

function getInvalidReason(fromSlot, toSlot, weight) {
  const level = LEVELS[currentLevel];
  if (level.fixedSlot === toSlot) return 'slot_blocked_by_fixed_bridge';
  const stack = slots[toSlot];
  if (stack.length > 0 && weight > stack[stack.length - 1]) return 'heavier_on_lighter';
  return 'same_slot';
}

function showFeedback(msg) {
  feedbackEl.textContent = msg;
  feedbackEl.classList.remove('hidden');
  feedbackEl.style.animation = 'none';
  void feedbackEl.offsetHeight;
  feedbackEl.style.animation = '';
  setTimeout(() => feedbackEl.classList.add('hidden'), 1500);
}

// ============================================
// WIN CHECK
// ============================================
function checkWin() {
  const goal = LEVELS[currentLevel].goal;
  for (let i = 0; i < NUM_SLOTS; i++) {
    const current = slots[i];
    const target = goal[i] || [];
    if (current.length !== target.length) return false;
    for (let j = 0; j < current.length; j++) {
      if (current[j] !== target[j]) return false;
    }
  }
  return true;
}

function onLevelComplete() {
  stopTimer();

  const level = LEVELS[currentLevel];
  const timeStr = formatTime(elapsedSeconds);
  const ratio = level.minMoves > 0 ? moveCount / level.minMoves : 1;

  let rating;
  if (ratio <= 1)        rating = '⭐⭐⭐';
  else if (ratio <= 1.5) rating = '⭐⭐';
  else if (ratio <= 2.5) rating = '⭐';
  else                    rating = '✔️';

  resultMoves.textContent = moveCount;
  resultMin.textContent = level.minMoves;
  resultTime.textContent = timeStr;
  resultRating.textContent = rating;

  const result = {
    level: currentLevel + 1,
    description: level.description,
    moves: moveCount,
    minMoves: level.minMoves,
    timeSec: elapsedSeconds,
    timeFormatted: timeStr,
    rating,
    invalidAttempts: levelLog.filter(e => e.type === 'INVALID_MOVE').length,
    log: [...levelLog]
  };

  levelResults.push(result);
  fullGameLog.push(...levelLog);

  addLog('LEVEL_COMPLETE', {
    level: currentLevel + 1,
    moves: moveCount,
    time: elapsedSeconds,
    rating
  });

  levelCompleteEl.classList.remove('hidden');
}

// ============================================
// TIMER
// ============================================
function startTimer() {
  stopTimer();
  startTime = Date.now();
  elapsedSeconds = 0;
  timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = formatTime(elapsedSeconds);
  }, 250);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ============================================
// LOGGING
// ============================================
function addLog(type, data = {}) {
  levelLog.push({
    timestamp: new Date().toISOString(),
    elapsed: elapsedSeconds,
    type,
    ...data
  });
}

function showLog() {
  const all = [...fullGameLog, ...levelLog];
  if (!all.length) {
    logContent.innerHTML = '<p style="color:#556">No entries yet.</p>';
  } else {
    logContent.innerHTML = all.map(e => {
      let detail = '';
      switch (e.type) {
        case 'MOVE':
          detail = `Piece W${e.piece}: Slot ${e.from} → Slot ${e.to} (move #${e.moveNumber})`;
          break;
        case 'INVALID_MOVE':
          detail = `⛔ W${e.piece}: Slot ${e.from} → Slot ${e.to} [${e.reason}]`;
          break;
        case 'LEVEL_START':
          detail = `━━ ${e.description} ━━ (fixed: ${e.fixedSlot !== null ? 'Slot ' + (e.fixedSlot + 1) : 'none'})`;
          break;
        case 'LEVEL_COMPLETE':
          detail = `✓ Level ${e.level}: ${e.moves} moves, ${formatTime(e.time)}, ${e.rating}`;
          break;
        default:
          detail = JSON.stringify(e);
      }
      return `<div class="log-entry">
        <span class="log-time">[${formatTime(e.elapsed)}]</span>
        <span class="log-type"> ${e.type} </span>
        <span class="log-detail">${detail}</span>
      </div>`;
    }).join('');
  }
  logModal.classList.remove('hidden');
}

function exportLog() {
  const payload = {
    exportDate: new Date().toISOString(),
    participantId: 'anonymous',
    gameVersion: '2.0',
    totalLevels: LEVELS.length,
    completedLevels: levelResults.length,
    summary: levelResults.map(r => ({
      level: r.level,
      description: r.description,
      moves: r.moves,
      minMoves: r.minMoves,
      efficiency: r.minMoves > 0 ? +(r.minMoves / r.moves).toFixed(3) : null,
      timeSec: r.timeSec,
      timeFormatted: r.timeFormatted,
      invalidAttempts: r.invalidAttempts,
      rating: r.rating
    })),
    fullLog: [...fullGameLog, ...levelLog]
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bridge-puzzle-log-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// GAME COMPLETE
// ============================================
function showGameComplete() {
  let html = `<table>
    <tr>
      <th>Lvl</th><th>Name</th><th>Moves</th><th>Opt</th>
      <th>Time</th><th>Errors</th><th>Rating</th>
    </tr>`;

  levelResults.forEach(r => {
    html += `<tr>
      <td>${r.level}</td>
      <td style="text-align:left;font-size:11px;">${r.description}</td>
      <td>${r.moves}</td>
      <td>${r.minMoves}</td>
      <td>${r.timeFormatted}</td>
      <td>${r.invalidAttempts}</td>
      <td>${r.rating}</td>
    </tr>`;
  });
  html += '</table>';

  const totMoves = levelResults.reduce((s, r) => s + r.moves, 0);
  const totOpt   = levelResults.reduce((s, r) => s + r.minMoves, 0);
  const totTime  = levelResults.reduce((s, r) => s + r.timeSec, 0);
  const totErr   = levelResults.reduce((s, r) => s + r.invalidAttempts, 0);
  const efficiency = totOpt > 0 ? ((totOpt / totMoves) * 100).toFixed(1) : 'N/A';

  html += `<p style="margin-top:14px;color:#889;font-size:13px;">
    Totals: ${totMoves} moves (optimal ${totOpt}, efficiency ${efficiency}%) · 
    ${formatTime(totTime)} · ${totErr} errors
  </p>`;

  finalSummary.innerHTML = html;
  gameCompleteEl.classList.remove('hidden');
}
