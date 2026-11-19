const { loadApp } = require('./e2e/harness');
const assert = require('assert');

const app = loadApp();
const g = app.globals;

console.log('Testing interactive clicks across V2 Satzklammer (PUZZLES_DATA)...');
assert.ok(g.PUZZLES_DATA && g.PUZZLES_DATA.length === 20, 'Must have 20 puzzles');

for (let i = 0; i < 20; i++) {
  g.renderPuzzle();
  const p = g.PUZZLES_DATA[i];

  // 1. Add scrambled words
  p.scrambled.forEach(w => g.addPuzzleWord(w));
  assert.strictEqual(g.puzzleConstructed.length, p.scrambled.length, `Drop zone word count mismatch on puzzle ${i}`);

  // 2. Clear puzzle
  g.clearPuzzle();
  assert.strictEqual(g.puzzleConstructed.length, 0, `Clear did not empty constructed array on puzzle ${i}`);

  // 3. Add correct words
  p.correct.forEach(w => g.addPuzzleWord(w));
  g.checkPuzzle();
  const fb = app.document.getElementById('puzzleFeedbackBox');
  assert.ok(fb && !fb.classList.contains('hidden'), `Feedback hidden on puzzle ${i}`);
  assert.ok(fb.innerHTML.includes('Excellent'), `Correct construction did not trigger success on puzzle ${i}`);

  // 4. Advance
  g.nextPuzzle();
}

console.log('Successfully verified all 20 sentence puzzles with construction, clear, and check!');
process.exit(0);
