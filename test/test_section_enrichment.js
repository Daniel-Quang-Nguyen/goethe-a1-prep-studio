// test/test_section_enrichment.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

console.log('Testing Section Content Enrichment (Blueprints & Survival Phrases)...');

const app = loadApp();
const g = app.globals;
const doc = app.document;

assert.ok(Array.isArray(g.SECTIONS_DATA), 'SECTIONS_DATA must be an array');
assert.strictEqual(g.SECTIONS_DATA.length, 9, 'SECTIONS_DATA must have exactly 9 sections');

let totalSurvivalPhrases = 0;

g.SECTIONS_DATA.forEach((sec, idx) => {
  assert.ok(sec.grammarSpotlight, `Section ${sec.id} missing grammarSpotlight`);
  assert.ok(typeof sec.grammarSpotlight.topic === 'string' && sec.grammarSpotlight.topic.length > 0, `Section ${sec.id} invalid topic`);
  assert.ok(typeof sec.grammarSpotlight.pattern === 'string' && sec.grammarSpotlight.pattern.length > 0, `Section ${sec.id} invalid pattern`);
  assert.ok(typeof sec.grammarSpotlight.rule === 'string' && sec.grammarSpotlight.rule.length > 0, `Section ${sec.id} invalid rule`);
  assert.ok(Array.isArray(sec.grammarSpotlight.examples) && sec.grammarSpotlight.examples.length >= 3, `Section ${sec.id} must have >= 3 examples`);

  assert.ok(Array.isArray(sec.survivalPhrases), `Section ${sec.id} missing survivalPhrases`);
  assert.strictEqual(sec.survivalPhrases.length, 6, `Section ${sec.id} must have exactly 6 survival phrases`);
  totalSurvivalPhrases += sec.survivalPhrases.length;

  sec.survivalPhrases.forEach((sp, spi) => {
    assert.ok(typeof sp.de === 'string' && sp.de.length > 0, `Section ${sec.id} phrase ${spi} invalid de`);
    assert.ok(typeof sp.en === 'string' && sp.en.length > 0, `Section ${sec.id} phrase ${spi} invalid en`);
  });
});

assert.strictEqual(totalSurvivalPhrases, 54, 'Expected exactly 54 survival phrases (9 sections x 6 phrases)');
console.log(`✓ 9/9 sections verified with Grammar Blueprints & 54 Survival Phrases`);

// Test DOM Rendering in renderModuleContent
g.appState.activeSection = 'sec_001';
g.renderModuleContent();

const blueprintTitle = doc.getElementById('moduleGrammarTopic');
assert.ok(blueprintTitle && blueprintTitle.innerText.includes('Personal Pronouns'), 'Blueprint title should match sec_001');

const blueprintPattern = doc.getElementById('moduleGrammarPattern');
assert.ok(blueprintPattern && blueprintPattern.innerText.includes('W-Fragewort'), 'Pattern should match sec_001');

const survivalGrid = doc.getElementById('moduleSurvivalGrid');
assert.ok(survivalGrid, 'moduleSurvivalGrid must exist in DOM');

// Verify all 6 survival phrase cards are rendered
for (let i = 1; i <= 6; i++) {
  const card = doc.getElementById('surv_card_surv_001_' + i);
  assert.ok(card, `Card surv_card_surv_001_${i} should be rendered in DOM`);
}

// Test Section 2 rendering
g.appState.activeSection = 'sec_002';
g.renderModuleContent();
assert.ok(blueprintTitle.innerText.includes('Telling Time'), 'Blueprint title should match sec_002 topic');
for (let i = 1; i <= 6; i++) {
  const card = doc.getElementById('surv_card_surv_002_' + i);
  assert.ok(card, `Section 2 Card surv_card_surv_002_${i} should be rendered in DOM`);
}

console.log('✓ All Section Content Enrichment tests PASSED successfully!');
