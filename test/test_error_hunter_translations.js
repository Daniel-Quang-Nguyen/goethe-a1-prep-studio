const { loadApp } = require('./e2e/harness');
const assert = require('assert');

const app = loadApp();
const g = app.globals;

console.log('=== Checking Error Hunter English sentence translations ===');
assert.ok(g.ERROR_HUNTER_DATA && g.ERROR_HUNTER_DATA.length === 16, 'Must have 16 exercises');

let missingCount = 0;
g.ERROR_HUNTER_DATA.forEach((ex, idx) => {
  if (!ex.translation || typeof ex.translation !== 'string' || !ex.translation.trim()) {
    console.error(`Item ${ex.id} missing translation`);
    missingCount++;
  } else {
    console.log(`[${ex.id}] "${ex.correctSentence}" -> "${ex.translation}"`);
  }
});

assert.strictEqual(missingCount, 0, 'All 16 exercises must have non-empty translations');

// Verify DOM rendering
for (let i = 0; i < 16; i++) {
  g.renderErrorHunter();
  const ex = g.ERROR_HUNTER_DATA[i];
  const el = app.document.getElementById('errHunterTranslationText');
  assert.ok(el, 'Element #errHunterTranslationText must exist in DOM');
  assert.ok(el.innerText.includes(ex.translation), `Translation mismatch for exercise ${i}`);
  g.nextErrorHunter();
}

console.log('All 16 Error Hunter exercises verified with translations cleanly rendered in DOM!');
process.exit(0);
