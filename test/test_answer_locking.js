/**
 * test/test_answer_locking.js
 * Verification of strict answer lock-in mechanics across all testing interfaces:
 * - Exam Hub (Hören & Lesen)
 * - Section Checkpoint Quiz
 * - Grammar Lab
 * - Noun Gender Drill
 * - Quiz Studio
 */
const { loadApp, assert } = require('./e2e/harness');

async function testAnswerLocking() {
  console.log('Testing Strict Answer Lock-in Mechanics across all testing interfaces...');
  const app = loadApp();
  const { globals, document } = app;

  // ------------------------------------------------------------------------
  // 1. Exam Hub Hören Strict Lock-in
  // ------------------------------------------------------------------------
  console.log('1. Testing Exam Hub Hören strict answer locking...');
  globals.switchExamSkill('hoeren');
  globals.switchExamHoerenTeil(1);
  const hoerenQ = globals.EXAM_HOEREN_DATA[0];
  assert(hoerenQ, 'First Exam Hoeren question must exist');

  // Initial state: not answered
  assert.strictEqual(globals.examHubState.hoerenAnswers[hoerenQ.id], undefined);

  // Student makes first selection (e.g. index 1)
  globals.selectExamHoerenAnswer(hoerenQ.id, 1);
  assert.strictEqual(globals.examHubState.hoerenAnswers[hoerenQ.id], 1, 'First answer must register');

  // Attempt to change answer to index 0 or index 2 (gaming/cycling)
  globals.selectExamHoerenAnswer(hoerenQ.id, 0);
  assert.strictEqual(globals.examHubState.hoerenAnswers[hoerenQ.id], 1, 'Subsequent click on option 0 must be IGNORED');

  globals.selectExamHoerenAnswer(hoerenQ.id, 2);
  assert.strictEqual(globals.examHubState.hoerenAnswers[hoerenQ.id], 1, 'Subsequent click on option 2 must be IGNORED');

  // Verify DOM buttons are disabled
  const hoerenCard = document.getElementById(`hoeren_card_${hoerenQ.id}`);
  assert(hoerenCard, `hoeren_card_${hoerenQ.id} element must exist`);
  const hoerenBtns = hoerenCard.querySelectorAll('button[data-opt-idx]');
  hoerenBtns.forEach(btn => {
    assert(btn.disabled === true, 'All Exam Hoeren option buttons must have disabled = true');
  });
  console.log(' ✓ Exam Hub Hören lock-in verified: single attempt enforced, buttons disabled');

  // ------------------------------------------------------------------------
  // 2. Exam Hub Lesen Strict Lock-in
  // ------------------------------------------------------------------------
  console.log('2. Testing Exam Hub Lesen strict answer locking...');
  globals.switchExamSkill('lesen');
  globals.switchExamLesenTeil(1);
  const lesenQ = globals.EXAM_LESEN_DATA[0];
  assert(lesenQ, 'First Exam Lesen question must exist');

  assert.strictEqual(globals.examHubState.lesenAnswers[lesenQ.id], undefined);

  // First selection: index 0
  globals.selectExamLesenAnswer(lesenQ.id, 0);
  assert.strictEqual(globals.examHubState.lesenAnswers[lesenQ.id], 0, 'First answer must register');

  // Attempt to change answer to index 1
  globals.selectExamLesenAnswer(lesenQ.id, 1);
  assert.strictEqual(globals.examHubState.lesenAnswers[lesenQ.id], 0, 'Subsequent click on option 1 must be IGNORED');

  const lesenCard = document.getElementById(`lesen_card_${lesenQ.id}`);
  assert(lesenCard, `lesen_card_${lesenQ.id} element must exist`);
  const lesenBtns = lesenCard.querySelectorAll('button[data-opt-idx]');
  lesenBtns.forEach(btn => {
    assert(btn.disabled === true, 'All Exam Lesen option buttons must have disabled = true');
  });
  console.log(' ✓ Exam Hub Lesen lock-in verified: single attempt enforced, buttons disabled');

  // ------------------------------------------------------------------------
  // 3. Noun Gender Drill Strict Lock-in
  // ------------------------------------------------------------------------
  console.log('3. Testing Noun Gender Drill answer lock-in...');
  globals.renderArticle();
  assert.strictEqual(globals.appState.articleAnswered, false, 'articleAnswered must start false');

  const btnDer = document.getElementById('btnDer');
  const btnDie = document.getElementById('btnDie');
  const btnDas = document.getElementById('btnDas');
  assert(btnDer && btnDie && btnDas, 'Gender buttons must exist in DOM');
  assert.strictEqual(btnDer.disabled, false);

  const initialScore = globals.appState.score;
  const currentNoun = globals.ARTICLES_DATA[globals.appState.articleCurrentIndex || 0];

  // Pick an intentionally wrong answer first
  const wrongGender = currentNoun.gender.toLowerCase() === 'der' ? 'die' : 'der';
  globals.checkArticle(wrongGender);

  assert.strictEqual(globals.appState.articleAnswered, true, 'articleAnswered must be true after choice');
  assert.strictEqual(btnDer.disabled, true, 'btnDer must be disabled');
  assert.strictEqual(btnDie.disabled, true, 'btnDie must be disabled');
  assert.strictEqual(btnDas.disabled, true, 'btnDas must be disabled');

  // Try to click the correct answer while locked
  globals.checkArticle(currentNoun.gender);
  assert.strictEqual(globals.appState.score, initialScore, 'Score must NOT increase on locked attempt');

  // Advance to next noun: buttons must unlock
  globals.nextArticle();
  assert.strictEqual(globals.appState.articleAnswered, false, 'articleAnswered must reset on nextArticle()');
  assert.strictEqual(btnDer.disabled, false, 'btnDer must re-enable on next noun');
  assert.strictEqual(btnDie.disabled, false, 'btnDie must re-enable on next noun');
  assert.strictEqual(btnDas.disabled, false, 'btnDas must re-enable on next noun');
  console.log(' ✓ Noun Gender Drill lock-in verified: buttons disable on click and re-enable on nextArticle');

  // ------------------------------------------------------------------------
  // 4. Section Checkpoint Quiz Lock-in
  // ------------------------------------------------------------------------
  console.log('4. Testing Section Checkpoint Quiz answer lock-in...');
  globals.renderModuleContent();
  const qOpts = document.getElementById('quizOptions');
  assert(qOpts, '#quizOptions must exist');
  const checkBtns = qOpts.querySelectorAll('button');
  assert(checkBtns.length > 0, 'Checkpoint quiz buttons must be rendered');

  // Verify initial buttons enabled
  assert.strictEqual(checkBtns[0].disabled, false);

  // Click first button
  checkBtns[0].onclick();

  // All buttons should now be disabled
  checkBtns.forEach(b => {
    assert.strictEqual(b.disabled, true, 'All checkpoint options must be disabled after click');
  });

  // Verify feedback contains "↻ Try Again" button
  const qFb = document.getElementById('quizFeedback');
  assert(qFb && !qFb.classList.contains('hidden'), 'Feedback must be displayed');
  assert(qFb.innerHTML.includes('↻ Try Again'), 'Feedback must contain Try Again button');
  console.log(' ✓ Section Checkpoint Quiz lock-in verified: options lock, Try Again button provided');

  // ------------------------------------------------------------------------
  // 5. Grammar Lab Lock-in
  // ------------------------------------------------------------------------
  console.log('5. Testing Grammar Lab answer lock-in...');
  globals.renderGrammarLab();
  const gramGrid = document.getElementById('gramOptionsGrid');
  assert(gramGrid, '#gramOptionsGrid must exist');
  const gramBtns = gramGrid.querySelectorAll('button');
  assert(gramBtns.length > 0, 'Grammar Lab buttons must be rendered');

  assert.strictEqual(gramBtns[0].disabled, false);

  // Click first button
  gramBtns[0].onclick();

  // All buttons should now be disabled
  gramBtns.forEach(b => {
    assert.strictEqual(b.disabled, true, 'All Grammar Lab buttons must be disabled after click');
  });

  const gramFb = document.getElementById('gramFeedbackBox');
  assert(gramFb && !gramFb.classList.contains('hidden'), 'Grammar Lab feedback must be displayed');
  assert(gramFb.innerHTML.includes('↻ Try Again'), 'Grammar Lab feedback must contain Try Again button');
  console.log(' ✓ Grammar Lab lock-in verified: options lock on choice, Try Again button provided');

  // ------------------------------------------------------------------------
  // 6. Quiz Studio Lock-in
  // ------------------------------------------------------------------------
  console.log('6. Testing Quiz Studio answer lock-in...');
  globals.renderQuestion();
  const opt0 = document.getElementById('studio_opt_0');
  const opt1 = document.getElementById('studio_opt_1');
  assert(opt0 && opt1, 'Quiz studio option buttons must exist');
  assert.strictEqual(opt0.disabled, false);

  globals.selectQuizOption(0);
  assert.strictEqual(opt0.disabled, true, 'studio_opt_0 must be disabled after selection');
  assert.strictEqual(opt1.disabled, true, 'studio_opt_1 must be disabled after selection');
  console.log(' ✓ Quiz Studio lock-in verified: options disabled upon answer selection');

  console.log('[PASS] All strict answer locking mechanics verified successfully.');
}

if (require.main === module) {
  testAnswerLocking().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { testAnswerLocking };
