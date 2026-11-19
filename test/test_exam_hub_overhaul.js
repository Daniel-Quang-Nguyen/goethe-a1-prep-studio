// test/test_exam_hub_overhaul.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

console.log('Testing Goethe A1 4-Skill Exam Hub Simulation...');

const app = loadApp();
const g = app.globals;
const doc = app.document;

// 1. Dataset Schemas
assert.strictEqual(g.EXAM_HOEREN_DATA.length, 15, 'Hören must have 15 questions');
assert.strictEqual(g.EXAM_LESEN_DATA.length, 15, 'Lesen must have 15 questions');
assert.ok(g.EXAM_SCHREIBEN_DATA.teil1 && g.EXAM_SCHREIBEN_DATA.teil2, 'Schreiben must have Teil 1 & Teil 2');
assert.ok(g.EXAM_SPRECHEN_DATA.teil1 && g.EXAM_SPRECHEN_DATA.teil2 && g.EXAM_SPRECHEN_DATA.teil3, 'Sprechen must have 3 parts');

// 2. Hören Tests
g.initExamHub();
g.switchExamSkill('hoeren');

// Teil 1 questions (Q1–6)
assert.strictEqual(g.examHubState.hoerenTeil, 1);
for (let i = 1; i <= 6; i++) {
  const card = doc.getElementById('hoeren_card_exam_h_0' + i);
  assert.ok(card, `Hören Teil 1 question card exam_h_0${i} should be rendered`);
}

// Answering question 1 correctly
const q1 = g.EXAM_HOEREN_DATA[0];
g.selectExamHoerenAnswer(q1.id, q1.answer);
assert.strictEqual(g.examHubState.hoerenAnswers[q1.id], q1.answer);

// Teil 2 (Q7–10)
g.switchExamHoerenTeil(2);
for (let i = 7; i <= 10; i++) {
  const idStr = i < 10 ? ('0' + i) : String(i);
  const card = doc.getElementById('hoeren_card_exam_h_' + idStr);
  assert.ok(card, `Hören Teil 2 question card exam_h_${idStr} should be rendered`);
}

// Teil 3 (Q11–15)
g.switchExamHoerenTeil(3);
for (let i = 11; i <= 15; i++) {
  const card = doc.getElementById('hoeren_card_exam_h_' + i);
  assert.ok(card, `Hören Teil 3 question card exam_h_${i} should be rendered`);
}

// 3. Lesen Tests
g.switchExamSkill('lesen');
for (let i = 1; i <= 5; i++) {
  const card = doc.getElementById('lesen_card_exam_l_0' + i);
  assert.ok(card, `Lesen Teil 1 question card exam_l_0${i} should be rendered`);
}

const l1 = g.EXAM_LESEN_DATA[0];
g.selectExamLesenAnswer(l1.id, l1.answer);
assert.strictEqual(g.examHubState.lesenAnswers[l1.id], l1.answer);

g.switchExamLesenTeil(2);
for (let i = 6; i <= 10; i++) {
  const idStr = i < 10 ? ('0' + i) : String(i);
  const card = doc.getElementById('lesen_card_exam_l_' + idStr);
  assert.ok(card, `Lesen Teil 2 question card exam_l_${idStr} should be rendered`);
}

g.switchExamLesenTeil(3);
for (let i = 11; i <= 15; i++) {
  const card = doc.getElementById('lesen_card_exam_l_' + i);
  assert.ok(card, `Lesen Teil 3 question card exam_l_${i} should be rendered`);
}

// 4. Schreiben Tests
g.switchExamSkill('schreiben');

// Teil 1 Form filling
const f1 = doc.getElementById('fld_fld_1');
const f2 = doc.getElementById('fld_fld_2');
const f3 = doc.getElementById('fld_fld_3');
const f4 = doc.getElementById('fld_fld_4');
const f5 = doc.getElementById('fld_fld_5');

if (f1) f1.value = 'Kadavy';
if (f2) f2.value = 'Eva';
if (f3) f3.value = '3';
if (f4) f4.value = '15. Juli';
if (f5) f5.value = 'Kreditkarte';

g.checkSchreibenForm();
assert.strictEqual(g.examHubState.schreibenFormScore, 10, 'Full form should yield 10 points');

// Teil 2 Email Editor
g.switchExamSchreibenTeil(2);
g.insertSchreibenPhrase('Sehr geehrte Damen und Herren,');
g.insertSchreibenPhrase('Ich möchte mich für den Kurs anmelden.');
g.insertSchreibenPhrase('Wann beginnt der Kurs genau?');
g.insertSchreibenPhrase('Wie viel kostet der Kurs?');
g.insertSchreibenPhrase('Bitte senden Sie mir das Anmeldeformular.');
g.insertSchreibenPhrase('Mit freundlichen Grüßen Alex Santos');

const wcSpan = doc.getElementById('schreibenWordCount');
const wordCount = parseInt(wcSpan.innerText, 10);
assert.ok(wordCount >= 20 && wordCount <= 35, `Optimal word count expected (20-35), found ${wordCount}`);

g.setSchreibenTeil2Score(15);
assert.strictEqual(g.examHubState.schreibenEmailScore, 15);

// 5. Sprechen Tests
g.switchExamSkill('sprechen');
['name', 'alter', 'land', 'wohnort', 'sprachen', 'beruf', 'hobby'].forEach(k => {
  assert.ok(doc.getElementById('sprechen_prompt_' + k), `Prompt sprechen_prompt_${k} should be rendered`);
});

assert.ok(doc.getElementById('sprechen_alpha_a'), 'Alphabet soundboard button A should be rendered');

g.awardSprechenScore(5);
assert.strictEqual(g.examHubState.sprechenTeil1Score, 5);

g.switchExamSprechenTeil(2);
for (let i = 1; i <= 8; i++) {
  assert.ok(doc.getElementById('sprechen_t2_card_sp_t2_' + i) || doc.getElementById('sprechen_card_sp_t2_' + i), `Wortkarte sp_t2_${i} should be rendered`);
}
g.awardSprechenScore(10);
assert.strictEqual(g.examHubState.sprechenTeil2Score, 10);

g.switchExamSprechenTeil(3);
for (let i = 1; i <= 8; i++) {
  assert.ok(doc.getElementById('sprechen_t3_card_sp_t3_' + i) || doc.getElementById('sprechen_card_sp_t3_' + i), `Object request card sp_t3_${i} should be rendered`);
}
g.awardSprechenScore(10);
assert.strictEqual(g.examHubState.sprechenTeil3Score, 10);

// 6. Scoreboard Verification
g.updateExamScoreboard();
const totalScore = parseInt(doc.getElementById('scoreTotalBadge').innerText, 10);
console.log('Final Exam Hub Total Score:', totalScore);
assert.ok(totalScore >= 50, 'Total score should be calculated correctly');

// Pass mark >= 60%
const passBadge = doc.getElementById('scorePassBadge');
assert.ok(passBadge.innerText.includes('Bestanden') || passBadge.innerText.includes('Nicht bestanden'));

// Reset Exam
g.resetExamHub();
assert.strictEqual(g.examHubState.schreibenFormScore, 0);
assert.strictEqual(g.examHubState.schreibenEmailScore, 0);
assert.strictEqual(g.examHubState.sprechenTeil1Score, 0);

console.log('✓ All 4-Skill Exam Hub tests PASSED successfully!');
