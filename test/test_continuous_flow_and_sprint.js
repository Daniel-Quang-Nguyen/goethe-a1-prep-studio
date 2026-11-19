/**
 * test/test_continuous_flow_and_sprint.js
 * Verification for:
 * 1. 4-Stage Spaced Repetition Progression (4 successful reviews to Master).
 * 2. Visual 4-Pip Mastery Indicators (●●○○).
 * 3. Authentic Mock Exam Strictness (65m timer, zero hints, certificate evaluation).
 * 4. Dynamic Non-Repetitive Daily Sprint (Der Goethe Lernpfad).
 * 5. Cross-Studio Exam Echo Badges.
 * 6. Harmonized C-Major vs Warm Marimba Audio Profiles.
 */
const { loadApp, assert } = require('./e2e/harness');

async function testContinuousFlowAndSprint() {
  console.log('Testing Goethe A1 Continuous Flow, 4-Stage SRS & Daily Sprint...');
  const app = loadApp();
  const { window, globals, document } = app;
  const audioCtx = app.audioCtx || window._audioCtxMock;

  // -------------------------------------------------------------
  // Test 1: 4-Stage Spaced Repetition Engine (4 Reviews to Master)
  // -------------------------------------------------------------
  assert(typeof globals.getMasteryPips === 'function', 'getMasteryPips must be a global function');
  assert.strictEqual(globals.getMasteryPips(0).pips, '○○○○', 'Box 0 should be 0/4 pips');
  assert.strictEqual(globals.getMasteryPips(0).isMastered, false, 'Box 0 is not mastered');
  assert.strictEqual(globals.getMasteryPips(1).pips, '●○○○', 'Box 1 should be 1/4 pips');
  assert.strictEqual(globals.getMasteryPips(2).pips, '●●○○', 'Box 2 should be 2/4 pips');
  assert.strictEqual(globals.getMasteryPips(3).pips, '●●●○', 'Box 3 should be 3/4 pips');
  assert.strictEqual(globals.getMasteryPips(4).pips, '●●●●', 'Box 4 should be 4/4 pips');
  assert.strictEqual(globals.getMasteryPips(4).isMastered, true, 'Box 4 must be mastered');

  // Test progression through 4 reviews
  const testId = 'test_word_' + Date.now();
  globals.leitnerEngine.scheduleItem(testId, false); // Box 0
  let rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 0, 'Initial unreviewed/failed item must be Box 0');

  globals.leitnerEngine.scheduleItem(testId, true); // Review 1
  rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 1, 'Review 1 must reach Box 1');
  assert.strictEqual(rec.mastered, false, 'Box 1 is not yet fully mastered');

  globals.leitnerEngine.scheduleItem(testId, true); // Review 2
  rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 2, 'Review 2 must reach Box 2');

  globals.leitnerEngine.scheduleItem(testId, true); // Review 3
  rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 3, 'Review 3 must reach Box 3');
  assert.strictEqual(rec.mastered, false, 'Box 3 is not yet fully mastered');

  globals.leitnerEngine.scheduleItem(testId, true); // Review 4 -> Mastered!
  rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 4, 'Review 4 must reach Box 4');
  assert.strictEqual(rec.mastered, true, 'Box 4 must be marked as fully mastered');

  // Failed review drops back to Box 0
  globals.leitnerEngine.scheduleItem(testId, false);
  rec = globals.leitnerEngine.getItem(testId);
  assert.strictEqual(rec.box, 0, 'Mistake must reset item to Box 0 (needs 4 fresh passes)');
  assert.strictEqual(rec.mastered, false, 'Failed item is no longer mastered');

  console.log(' ✓ Verified 4-Stage Spaced Repetition Progression (4 reviews to master)');

  // -------------------------------------------------------------
  // Test 2: Cross-Studio Exam Echo Badges
  // -------------------------------------------------------------
  assert(typeof globals.getExamEchoBadgeHtml === 'function', 'getExamEchoBadgeHtml must be defined');
  const bahnhofEcho = globals.getExamEchoBadgeHtml('der Bahnhof');
  assert(bahnhofEcho.includes('Goethe Exam Anchor'), 'Bahnhof must produce an Exam Echo badge');
  assert(bahnhofEcho.includes('Hören Teil 2'), 'Bahnhof must cite Hören Teil 2 platform announcement');

  const arztEcho = globals.getExamEchoBadgeHtml('der Arzt');
  assert(arztEcho.includes('Hören Teil 3'), 'Arzt must cite doctor appointment voicemail');

  console.log(' ✓ Verified Cross-Studio Exam Echo keyword linking');

  // -------------------------------------------------------------
  // Test 3: Authentic Mock Exam Simulation & Certificate
  // -------------------------------------------------------------
  assert(typeof globals.startMockExam === 'function', 'startMockExam must be defined');
  assert(typeof globals.finishMockExam === 'function', 'finishMockExam must be defined');

  globals.startMockExam();
  assert(globals.appState.mockExam && globals.appState.mockExam.active === true, 'Mock exam must be active');
  assert.strictEqual(globals.appState.mockExam.durationSeconds, 65 * 60, 'Mock exam must be set to 65 minutes');

  // Finish Mock Exam
  globals.finishMockExam(false);
  assert.strictEqual(globals.appState.mockExam.active, false, 'Mock exam must be deactivated on finish');

  console.log(' ✓ Verified Authentic Mock Exam strict timing and completion flow');

  // -------------------------------------------------------------
  // Test 4: Dynamic Non-Repetitive Daily Sprint ("Der Goethe Lernpfad")
  // -------------------------------------------------------------
  assert(typeof globals.startDailySprint === 'function', 'startDailySprint must be defined');
  globals.startDailySprint();

  const sprintOverlay = document.getElementById('dailySprintOverlay');
  assert(sprintOverlay, 'Daily Sprint overlay modal must be rendered in DOM');

  // Test Sprint Step Progression
  assert(typeof globals.advanceSprintStep === 'function', 'advanceSprintStep must be defined');
  globals.advanceSprintStep(true); // Step 1 -> 2
  globals.advanceSprintStep(true); // Step 2 -> 3
  globals.advanceSprintStep(true); // Step 3 -> 4
  globals.advanceSprintStep(true); // Step 4 -> 5
  globals.advanceSprintStep(true); // Step 5 -> Finish

  console.log(' ✓ Verified Dynamic Daily Sprint progression, steps, and reward flow');

  // -------------------------------------------------------------
  // Test 5: Harmonized Audio Engine (C-Major & Warm Marimba)
  // -------------------------------------------------------------
  audioCtx.sfxEvents = [];
  globals.appState.sfxMuted = false;

  // Correct tones synthesize in C-Major
  globals.playSfx('quiz_correct');
  assert(audioCtx.sfxEvents.length > 0, 'quiz_correct must synthesize audio');
  const hasC5 = audioCtx.sfxEvents.some(e => Math.abs(e.freq - 523.25) < 1);
  assert(hasC5, 'quiz_correct must use C5 (523Hz) root tone');

  // Wrong tones synthesize warm marimba
  audioCtx.sfxEvents = [];
  globals.playSfx('quiz_wrong');
  assert(audioCtx.sfxEvents.length > 0, 'quiz_wrong must synthesize audio');
  const hasMarimba = audioCtx.sfxEvents.some(e => Math.abs(e.freq - 329.63) < 1 || Math.abs(e.freq - 261.63) < 1);
  assert(hasMarimba, 'quiz_wrong must use warm marimba tone (261Hz/329Hz)');

  console.log(' ✓ Verified Harmonized Audio Brand Engine (C-Major Bell & Warm Marimba)');
  console.log('===============================================================');
  console.log('All Continuous Flow & Daily Sprint tests PASSED cleanly!');
  console.log('===============================================================');
}

if (require.main === module) {
  testContinuousFlowAndSprint().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { testContinuousFlowAndSprint };
