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

let round = null;

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
  statusEl.textContent = [BORDER, frameSplit("CLICKIER", "SCORE: 0"), BORDER].join("\n");
}

function newRound() {
  const wordList = [pick(WORDS[0]), pick(WORDS[0])];
  round = { grid: generateGrid(COLS, ROWS, wordList, 0.1, DICTIONARY) };
  renderGrid();
}

renderStatus();
logEl.textContent = BORDER;
newRound();
