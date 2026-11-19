const { loadApp } = require('./e2e/harness');
const assert = require('assert');

const app = loadApp();
const g = app.globals;

console.log('Testing interactive clicks across Error Hunter...');
assert.ok(g.ERROR_HUNTER_DATA && g.ERROR_HUNTER_DATA.length === 16, 'Must have 16 exercises');

for (let i = 0; i < 16; i++) {
  g.renderErrorHunter();
  const ex = g.ERROR_HUNTER_DATA[i];

  // 1. Click wrong token (first token that is not errorIndex)
  const wrongIdx = ex.errorIndex === 0 ? 1 : 0;
  g.checkErrorHunterToken(wrongIdx);
  const fbWrong = app.document.getElementById('errHunterFeedbackBox');
  assert.ok(fbWrong && !fbWrong.classList.contains('hidden'), `Feedback hidden on wrong token for ex ${i}`);
  assert.ok(fbWrong.innerHTML.includes('Nicht hier'), `Feedback did not indicate non-error for ex ${i}`);

  // 2. Click correct error token
  g.checkErrorHunterToken(ex.errorIndex);
  const fbCorrect = app.document.getElementById('errHunterFeedbackBox');
  assert.ok(fbCorrect && !fbCorrect.classList.contains('hidden'), `Feedback hidden on correct token for ex ${i}`);
  assert.ok(fbCorrect.innerHTML.includes('Fehler gefunden'), `Feedback did not indicate error spotted for ex ${i}`);
  assert.ok(fbCorrect.innerHTML.includes(ex.correction), `Feedback missing correction for ex ${i}`);

  // 3. Advance to next exercise
  g.nextErrorHunter();
}

console.log('Successfully verified all 16 exercises with wrong & correct clicks in Error Hunter!');
process.exit(0);
