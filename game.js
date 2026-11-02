// Narrow screens get fewer columns so the letters stay big enough to tap.
const COLS = window.innerWidth < 600 ? 16 : 24;
const ROWS = 9;
const LINE_WIDTH = COLS * 2 + 3;
const INNER_WIDTH = LINE_WIDTH - 4;
const BORDER = "+" + "-".repeat(LINE_WIDTH - 2) + "+";

const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const logEl = document.getElementById("log");

document.documentElement.style.setProperty("--chars", LINE_WIDTH);

// Wraps text in ASCII borders, padded to fill the line.
function frame(text) {
  return "| " + text.padEnd(INNER_WIDTH) + " |";
}

// Puts left and right text on one framed line, with spaces between them.
function frameSplit(left, right) {
  return frame(left + right.padStart(INNER_WIDTH - left.length));
}

const DICTIONARY = WORDS.flat();
const TIER_POINTS = [1, 3, 8, 20];
const WRONG_CLICK_PENALTY = 2;
const ROUND_SECONDS = 12;
const CLEAR_PAUSE_MS = 400;
const TIME_BAR_WIDTH = 10;

const state = { score: 0, combo: 0 };
let round = null;

function wordPoints(text) {
  const tier = WORDS.findIndex((tierWords) => tierWords.includes(text));
  return text.length * TIER_POINTS[tier];
}

// Spans are the only elements inside the grid, so a cell's position is its index.
function cellAt(row, col) {
  return gridEl.children[row * COLS + col];
}

// Each letter is a span so it can be clicked. It includes the space after it,
// which makes the click target wider on touch screens.
function renderGrid() {
  const lines = round.grid.letters.map((rowLetters, row) => {
    const cells = rowLetters.map((letter, col) => {
      const gap = col < COLS - 1 ? " " : "";
      return `<span class="cell" data-row="${row}" data-col="${col}">${letter}${gap}</span>`;
    });
    return "| " + cells.join("") + " |";
  });
  gridEl.innerHTML = lines.join("\n");
}

function timeBar() {
  const left = Math.max(0, round.endsAt - performance.now()) / (round.seconds * 1000);
  const filled = Math.ceil(left * TIME_BAR_WIDTH);
  return "[" + "#".repeat(filled) + ".".repeat(TIME_BAR_WIDTH - filled) + "]";
}

function renderStatus() {
  statusEl.textContent = [
    BORDER,
    frameSplit("CLICKIER", `SCORE: ${state.score}`),
    frameSplit(`TIME ${timeBar()}`, `COMBO: ${state.combo}`),
    BORDER,
  ].join("\n");
}

function log(message) {
  logEl.textContent = [BORDER, frame(("> " + message).slice(0, INNER_WIDTH)), BORDER].join("\n");
}

function newRound() {
  const wordList = [pick(WORDS[0]), pick(WORDS[0])];
  const seconds = ROUND_SECONDS;
  round = {
    grid: generateGrid(COLS, ROWS, wordList, 0.1, DICTIONARY),
    found: new Set(),
    seconds,
    endsAt: performance.now() + seconds * 1000,
    cleared: false,
  };
  renderGrid();
}

// Clearing a grid pays one point per second left, then holds it on screen briefly.
function clearRound() {
  const bonus = Math.ceil((round.endsAt - performance.now()) / 1000);
  state.score += bonus;
  log(`grid clear! +${bonus} time bonus`);
  round.cleared = true;
  round.endsAt = performance.now() + CLEAR_PAUSE_MS;
}

function tick() {
  if (performance.now() >= round.endsAt) {
    if (!round.cleared) {
      const missed = round.grid.words.filter((word, index) => !round.found.has(index));
      log("missed: " + missed.map((word) => word.text).join(", "));
      state.combo = 0;
    }
    newRound();
  }
  renderStatus();
}

function findWord(index) {
  if (round.found.has(index)) return;
  round.found.add(index);

  const { text, row, col } = round.grid.words[index];
  for (let i = 0; i < text.length; i++) {
    const cell = cellAt(row, col + i);
    cell.textContent = cell.textContent.toUpperCase();
    cell.classList.add("found");
  }

  const points = wordPoints(text);
  state.score += points;
  state.combo += 1;
  log(`+${points} ${text}`);

  if (round.found.size === round.grid.words.length) clearRound();
  renderStatus();
}

function wrongClick(cell) {
  state.score = Math.max(0, state.score - WRONG_CLICK_PENALTY);
  state.combo = 0;
  log(`-${WRONG_CLICK_PENALTY} not a word`);
  renderStatus();

  cell.classList.add("wrong");
  setTimeout(() => cell.classList.remove("wrong"), 300);
}

gridEl.addEventListener("click", (event) => {
  const cell = event.target.closest(".cell");
  if (!cell || round.cleared) return;

  const wordIndex = round.grid.owners[cell.dataset.row][cell.dataset.col];
  if (wordIndex === -1) wrongClick(cell);
  else findWord(wordIndex);
});

log("find the hidden words");
newRound();
renderStatus();
setInterval(tick, 100);
