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

function renderStatus() {
  statusEl.textContent = [
    BORDER,
    frameSplit("CLICKIER", `SCORE: ${state.score}`),
    frameSplit("", `COMBO: ${state.combo}`),
    BORDER,
  ].join("\n");
}

function log(message) {
  logEl.textContent = [BORDER, frame(("> " + message).slice(0, INNER_WIDTH)), BORDER].join("\n");
}

function newRound() {
  const wordList = [pick(WORDS[0]), pick(WORDS[0])];
  round = { grid: generateGrid(COLS, ROWS, wordList, 0.1, DICTIONARY), found: new Set() };
  renderGrid();
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
  renderStatus();

  if (round.found.size === round.grid.words.length) newRound();
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
  if (!cell) return;

  const wordIndex = round.grid.owners[cell.dataset.row][cell.dataset.col];
  if (wordIndex === -1) wrongClick(cell);
  else findWord(wordIndex);
});

renderStatus();
log("find the hidden words");
newRound();
