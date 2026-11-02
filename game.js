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

statusEl.textContent = [BORDER, frameSplit("CLICKIER", "SCORE: 0"), BORDER].join("\n");
gridEl.textContent = frame("loading letters...");
logEl.textContent = BORDER;
