const VOWELS = "aeiou";
const CONSONANTS = "bcdfghjklmnpqrstvwxyz";

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function pick(list) {
  return list[randomInt(list.length)];
}

// More vowels make the noise look more like real words, so words are harder to spot.
function randomLetter(vowelRatio) {
  return Math.random() < vowelRatio ? pick(VOWELS) : pick(CONSONANTS);
}

// Checks the word's cells plus one on each side, so two words never touch.
function fits(owners, row, col, length) {
  const cols = owners[row].length;
  for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + length); c++) {
    if (owners[row][c] !== -1) return false;
  }
  return true;
}

// Rerolls noise until the letters spell no dictionary word by accident,
// because clicking a real English word should never cost points.
function removeAccidentalWords(letters, owners, dictionary) {
  letters.forEach((rowLetters, row) => {
    for (let pass = 0; pass < 50; pass++) {
      const text = rowLetters.join("");
      let changed = false;
      for (const word of dictionary) {
        for (let at = text.indexOf(word); at !== -1; at = text.indexOf(word, at + 1)) {
          const noise = [];
          for (let c = at; c < at + word.length; c++) {
            if (owners[row][c] === -1) noise.push(c);
          }
          if (noise.length > 0) {
            rowLetters[pick(noise)] = pick(CONSONANTS);
            changed = true;
          }
        }
      }
      if (!changed) break;
    }
  });
}

// Hides words left to right in a grid of random letters.
// owners[row][col] is the index of the word using that cell, or -1 for noise.
function generateGrid(cols, rows, wordList, vowelRatio, dictionary) {
  const letters = Array.from({ length: rows }, () => Array(cols).fill(""));
  const owners = Array.from({ length: rows }, () => Array(cols).fill(-1));
  const words = [];

  for (const text of wordList) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const row = randomInt(rows);
      const col = randomInt(cols - text.length + 1);
      if (!fits(owners, row, col, text.length)) continue;

      for (let i = 0; i < text.length; i++) {
        letters[row][col + i] = text[i];
        owners[row][col + i] = words.length;
      }
      words.push({ text, row, col });
      break;
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (owners[row][col] === -1) letters[row][col] = randomLetter(vowelRatio);
    }
  }

  removeAccidentalWords(letters, owners, dictionary);
  return { letters, owners, words };
}
