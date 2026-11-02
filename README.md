# Clickier

An ASCII word-spotting game. Find real English words hidden in a sea of random
letters, click them for points, and spend the points on upgrades.

## How to play

- Click any letter of a hidden word to score it. Longer, harder words pay more.
- Clicking a letter that isn't part of a word costs 2 points and resets your combo.
- Clear every word before time runs out for a bonus.
- Buy upgrades by clicking them or pressing keys 1-5.

## Run it locally

No install or build step is needed. From this folder, start a small web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Files

- `index.html`: the page
- `style.css`: the look
- `words.js`: the word list, grouped into four difficulty tiers
- `grid.js`: builds the letter grid and hides the words
- `game.js`: scoring, timer, shop and saving
