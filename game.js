// Narrow screens get fewer columns so the letters stay big enough to tap.
const COLS = window.innerWidth < 600 ? 16 : 24;
const ROWS = 9;
const LINE_WIDTH = COLS * 2 + 3;
const INNER_WIDTH = LINE_WIDTH - 4;
const BORDER = "+" + "-".repeat(LINE_WIDTH - 2) + "+";

const statusEl = document.getElementById("status");
const gridEl = document.getElementById("grid");
const logEl = document.getElementById("log");
const shopEl = document.getElementById("shop");

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
const BASE_WORDS = 2;
const TOP_TIER_CHANCE = 0.6;
const HINT_MS = 1000;
const SAVE_KEY = "clickier.save.v1";

const UPGRADES = [
  { key: "vocabulary", name: "Vocabulary", info: "harder words, more points", baseCost: 40, growth: 5, max: 3 },
  { key: "clock", name: "Clock speed", info: "+2s on every grid", baseCost: 15, growth: 1.6, max: 8 },
  { key: "density", name: "Density", info: "+1 word on every grid", baseCost: 25, growth: 2, max: 6 },
  { key: "highlighter", name: "Highlighter", info: "flashes a letter of a word", baseCost: 30, growth: 2, max: 5 },
  { key: "combo", name: "Combo", info: "streaks multiply points", baseCost: 50, growth: 2.2, max: 5 },
];

const state = {
  score: 0,
  combo: 0,
  upgrades: Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.key, 0])),
};
let round = null;

function upgradeCost(upgrade) {
  return Math.round(upgrade.baseCost * upgrade.growth ** state.upgrades[upgrade.key]);
}

// Each Combo level adds 10% per word in the streak, counting up to 10 words.
function comboMultiplier() {
  return 1 + state.upgrades.combo * 0.1 * Math.min(state.combo, 10);
}

function wordPoints(text) {
  const tier = WORDS.findIndex((tierWords) => tierWords.includes(text));
  return Math.round(text.length * TIER_POINTS[tier] * comboMultiplier());
}

// Mostly picks from the newest tier, so upgrades are felt right away.
function chooseWords() {
  const topTier = state.upgrades.vocabulary;
  const chosen = new Set();
  while (chosen.size < BASE_WORDS + state.upgrades.density) {
    const tier = Math.random() < TOP_TIER_CHANCE ? topTier : randomInt(topTier + 1);
    chosen.add(pick(WORDS[tier]));
  }
  return [...chosen];
}

function hintSeconds() {
  return 8 - state.upgrades.highlighter;
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

const shopButtons = UPGRADES.map((upgrade) => {
  const button = document.createElement("button");
  button.addEventListener("click", () => buy(upgrade));
  return button;
});

function renderShop() {
  UPGRADES.forEach((upgrade, index) => {
    const level = state.upgrades[upgrade.key];
    const maxed = level >= upgrade.max;
    const cost = upgradeCost(upgrade);
    const left = `[${index + 1}] ${upgrade.name} ${level}/${upgrade.max}`;
    const right = maxed ? "MAX" : `${cost}p`;
    const dots = ".".repeat(Math.max(0, INNER_WIDTH - left.length - right.length - 2));

    const button = shopButtons[index];
    button.textContent = frame(`${left} ${dots} ${right}`) + "\n" + frame("    " + upgrade.info);
    button.disabled = maxed || state.score < cost;
  });
}

// Browsers can block storage, for example in private windows.
// The game still works then, it just won't remember progress.
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ score: state.score, upgrades: state.upgrades }));
  } catch {}
}

function savedCount(value) {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function load() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(SAVE_KEY));
  } catch {}
  if (!saved) return;

  state.score = savedCount(saved.score);
  for (const upgrade of UPGRADES) {
    state.upgrades[upgrade.key] = Math.min(upgrade.max, savedCount(saved.upgrades?.[upgrade.key]));
  }
}

function resetProgress() {
  if (!window.confirm("Erase your score and upgrades?")) return;

  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
  state.score = 0;
  state.combo = 0;
  for (const upgrade of UPGRADES) state.upgrades[upgrade.key] = 0;
  log("progress erased");
  newRound();
  renderShop();
  renderStatus();
}

function changeScore(amount) {
  state.score = Math.max(0, state.score + amount);
  renderShop();
  save();
}

function buy(upgrade) {
  const cost = upgradeCost(upgrade);
  if (state.upgrades[upgrade.key] >= upgrade.max || state.score < cost) return;

  state.upgrades[upgrade.key] += 1;
  changeScore(-cost);
  log(`${upgrade.name} up! applies next grid`);
  renderStatus();
}

function newRound() {
  const seconds = ROUND_SECONDS + state.upgrades.clock * 2;
  const vowelRatio = 0.1 + state.upgrades.vocabulary * 0.08;
  round = {
    grid: generateGrid(COLS, ROWS, chooseWords(), vowelRatio, DICTIONARY),
    found: new Set(),
    seconds,
    endsAt: performance.now() + seconds * 1000,
    nextHintAt: performance.now() + hintSeconds() * 1000,
    cleared: false,
  };
  renderGrid();
}

function showHint() {
  const hidden = round.grid.words.filter((word, index) => !round.found.has(index));
  const word = pick(hidden);
  const cell = cellAt(word.row, word.col);
  cell.classList.add("hint");
  setTimeout(() => cell.classList.remove("hint"), HINT_MS);
  round.nextHintAt = performance.now() + hintSeconds() * 1000;
}

// Clearing a grid pays one point per second left, then holds it on screen briefly.
function clearRound() {
  const bonus = Math.ceil((round.endsAt - performance.now()) / 1000);
  changeScore(bonus);
  log(`grid clear! +${bonus} time bonus`);
  round.cleared = true;
  round.endsAt = performance.now() + CLEAR_PAUSE_MS;
}

function tick() {
  const hintsOn = state.upgrades.highlighter > 0 && !round.cleared;
  if (hintsOn && performance.now() >= round.nextHintAt) showHint();

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
  const multiplier = comboMultiplier();
  changeScore(points);
  state.combo += 1;
  log(`+${points} ${text}` + (multiplier > 1 ? ` x${multiplier.toFixed(1)}` : ""));

  if (round.found.size === round.grid.words.length) clearRound();
  renderStatus();
}

function wrongClick(cell) {
  changeScore(-WRONG_CLICK_PENALTY);
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

// Number keys buy upgrades. Modifiers are skipped so browser shortcuts still work.
document.addEventListener("keydown", (event) => {
  if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  const upgrade = UPGRADES[Number(event.key) - 1];
  if (upgrade) buy(upgrade);
});

const shopTitle = document.createElement("pre");
shopTitle.textContent = frame("SHOP - click or press 1-5");
const shopEnd = document.createElement("pre");
shopEnd.textContent = BORDER;
const resetButton = document.createElement("button");
resetButton.textContent = frame("[x] erase progress");
resetButton.addEventListener("click", resetProgress);
shopEl.append(shopTitle, ...shopButtons, resetButton, shopEnd);

load();
log("find the hidden words");
newRound();
renderShop();
renderStatus();
setInterval(tick, 100);
