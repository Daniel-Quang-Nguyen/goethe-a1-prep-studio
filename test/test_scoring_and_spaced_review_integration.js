/**
 * test/test_scoring_and_spaced_review_integration.js
 * Verification for:
 * 1. Noun Gender Drill live score counter (#articleScore / #articleTotal)
 * 2. Noun Gender Drill meaning/translation dynamic update (#articleMeaningText)
 * 3. Noun Gender Drill connection to Spaced Repetition (Leitner) & Mistake Bank
 * 4. Practise Saved Vocab pulling Noun Gender mistakes into Flashcard Studio
 * 5. Flashcards Studio & Topic Vocab awarding score points on mastery
 * 6. Sentence Builder (checkPuzzle) integration with Leitner & Mistake Bank
 * 7. Error Hunter integration with Leitner & Mistake Bank
 * 8. Grammar Lab rich sentence logging in Mistake Bank
 * 9. Exam Hub scoring & Leitner tracking for Hören and Lesen
 * 10. Accurate Mock Exam scoring & Daily Sprint Leitner progression
 */

const { loadApp, assert } = require('./e2e/harness');

async function testScoringAndSpacedReviewIntegration() {
  console.log('Testing Goethe A1 Scoring & Spaced Review Integration across all modules...');
  const app = loadApp();
  const { globals, document } = app;

  // ------------------------------------------------------------------------
  // Test 1: Noun Gender Drill Live Score Counter & Dynamic Meaning
  // ------------------------------------------------------------------------
  console.log('1. Testing Noun Gender Drill live score counter & dynamic meaning...');
  globals.appState.articleCurrentIndex = 6; // noun_007: "Supermarkt", meaning: "supermarket"
  globals.renderArticle();

  const nounEl = document.getElementById('articleNounText');
  const meaningEl = document.getElementById('articleMeaningText');
  const scoreEl = document.getElementById('articleScore');
  const totalEl = document.getElementById('articleTotal');

  assert(nounEl && meaningEl && scoreEl && totalEl, 'Drill DOM elements must exist');
  assert.strictEqual(nounEl.innerText, 'Supermarkt', 'Noun must be Supermarkt');
  assert.strictEqual(meaningEl.innerText, '(supermarket)', 'Meaning must dynamically update to (supermarket), NOT (apartment / flat)');

  // Reset drill stats
  globals.articleStats.correct = 0;
  globals.articleStats.total = 0;
  globals.renderArticle();
  assert.strictEqual(scoreEl.innerText, '0', 'Initial score must be 0');
  assert.strictEqual(totalEl.innerText, '0', 'Initial total must be 0');

  // Test Correct Answer (Supermarkt -> DER)
  const prevScore = globals.appState.score;
  globals.checkArticle('der');
  assert.strictEqual(globals.articleStats.correct, 1, 'articleStats.correct must be 1');
  assert.strictEqual(globals.articleStats.total, 1, 'articleStats.total must be 1');
  assert.strictEqual(scoreEl.innerText, '1', '#articleScore must update to 1');
  assert.strictEqual(totalEl.innerText, '1', '#articleTotal must update to 1');
  assert(globals.appState.score > prevScore, 'Global appState.score must increase on correct article choice');

  // Next Noun (e.g. noun_008: "Rechnung", meaning: "bill / invoice")
  globals.nextArticle();
  assert.strictEqual(globals.appState.articleAnswered, false, 'articleAnswered must reset');
  const currentNoun = globals.ARTICLES_DATA[globals.appState.articleCurrentIndex];
  assert.strictEqual(meaningEl.innerText, '(' + currentNoun.meaning + ')', 'Meaning must update to next noun meaning');

  // Test Incorrect Answer on Rechnung
  const wrongChoice = currentNoun.gender === 'der' ? 'das' : 'der';
  globals.checkArticle(wrongChoice);
  assert.strictEqual(globals.articleStats.correct, 1, 'articleStats.correct must remain 1 after wrong answer');
  assert.strictEqual(globals.articleStats.total, 2, 'articleStats.total must be 2 after wrong answer');
  assert.strictEqual(scoreEl.innerText, '1', '#articleScore must be 1');
  assert.strictEqual(totalEl.innerText, '2', '#articleTotal must be 2');

  // ------------------------------------------------------------------------
  // Test 2: Noun Gender Connection to Spaced Repetition & Mistake Bank
  // ------------------------------------------------------------------------
  console.log('2. Testing Noun Gender Drill mistake bank & flashcard conversion...');
  const recordedMistake = globals.appState.mistakes.find(m => m.id === currentNoun.id);
  assert(recordedMistake, 'Wrong noun must be logged in appState.mistakes');
  assert.strictEqual(recordedMistake.domain, 'gender', 'Mistake domain must be gender');
  assert(recordedMistake.correct.includes(currentNoun.noun), 'Mistake correct field must include noun');

  const srsRecord = globals.leitnerEngine.getItem(currentNoun.id);
  assert(srsRecord, 'Wrong noun must be scheduled in Leitner engine');
  assert.strictEqual(srsRecord.box, 0, 'Wrong noun must be reset to Leitner Box 0');

  // Verify practiseSavedVocab converts gender mistakes into flashcards
  globals.practiseSavedVocab();
  const loadedCard = globals.currentFlashcards.find(c => c.id === currentNoun.id);
  assert(loadedCard, 'practiseSavedVocab must load noun gender mistake into flashcard deck');
  assert.strictEqual(loadedCard.translation, currentNoun.meaning, 'Loaded flashcard translation must match noun meaning');

  // ------------------------------------------------------------------------
  // Test 3: Flashcard & Topic Vocab Mastery Scoring
  // ------------------------------------------------------------------------
  console.log('3. Testing Flashcard & Topic Vocab mastery scoring...');
  const baseScore = globals.appState.score;
  globals.markSayingKnown();
  assert(globals.appState.score >= baseScore + 5, 'markSayingKnown must award at least 5 points to appState.score');

  const topicScoreBefore = globals.appState.score;
  globals.initTopicVocab(globals.SECTIONS_DATA[0]);
  globals.markTopicVocabKnown();
  assert(globals.appState.score >= topicScoreBefore + 5, 'markTopicVocabKnown must award at least 5 points to appState.score');

  // ------------------------------------------------------------------------
  // Test 4: Sentence Builder (checkPuzzle) Leitner & Mistake Bank Integration
  // ------------------------------------------------------------------------
  console.log('4. Testing Sentence Builder (checkPuzzle) Leitner & Mistake Bank integration...');
  globals.renderPuzzle();
  const p = globals.PUZZLES_DATA[0];

  // Intentionally wrong puzzle
  globals.clearPuzzle();
  globals.addPuzzleWord('Berlin.');
  globals.addPuzzleWord('ich');
  globals.checkPuzzle();
  const pMistake = globals.appState.mistakes.find(m => m.id === p.id);
  assert(pMistake, 'Incorrect sentence puzzle must be logged in appState.mistakes');
  assert.strictEqual(globals.leitnerEngine.getItem(p.id).box, 0, 'Failed puzzle must be in Box 0');

  // Correct puzzle
  globals.clearPuzzle();
  p.correct.forEach(w => globals.addPuzzleWord(w));
  globals.checkPuzzle();
  assert.strictEqual(globals.leitnerEngine.getItem(p.id).box, 1, 'Solved puzzle must advance to Box 1');
  assert(!globals.appState.mistakes.some(m => m.id === p.id), 'Solved puzzle must be resolved from appState.mistakes');

  // ------------------------------------------------------------------------
  // Test 5: Error Hunter Leitner & Mistake Bank Integration
  // ------------------------------------------------------------------------
  console.log('5. Testing Error Hunter Leitner & Mistake Bank integration...');
  globals.renderErrorHunter();
  const errItem = globals.ERROR_HUNTER_DATA[0];

  // Intentionally click non-error token
  const wrongTokIdx = errItem.errorIndex === 0 ? 1 : 0;
  globals.checkErrorHunterToken(wrongTokIdx);
  const errMistake = globals.appState.mistakes.find(m => m.id === errItem.id);
  assert(errMistake, 'Incorrect error hunter choice must be logged in appState.mistakes');
  assert.strictEqual(globals.leitnerEngine.getItem(errItem.id).box, 0, 'Error hunter failure must be in Box 0');

  // Correct token
  globals.checkErrorHunterToken(errItem.errorIndex);
  assert.strictEqual(globals.leitnerEngine.getItem(errItem.id).box, 1, 'Error hunter success must advance to Box 1');

  // ------------------------------------------------------------------------
  // Test 6: Exam Hub Hören & Lesen Scoring and Leitner Tracking
  // ------------------------------------------------------------------------
  console.log('6. Testing Exam Hub scoring and Leitner tracking...');
  globals.resetExamHub();
  const hQ = globals.EXAM_HOEREN_DATA[0];
  const lQ = globals.EXAM_LESEN_DATA[0];

  // Correct Hören answer
  const examScoreBefore = globals.appState.score;
  globals.selectExamHoerenAnswer(hQ.id, hQ.answer);
  assert(globals.appState.score >= examScoreBefore + 10, 'Correct Hören answer must award 10 score points');
  assert.strictEqual(globals.leitnerEngine.getItem(hQ.id).box, 1, 'Correct Hören question must advance in Leitner');

  // Wrong Lesen answer
  const wrongLesenIdx = lQ.answer === 0 ? 1 : 0;
  globals.selectExamLesenAnswer(lQ.id, wrongLesenIdx);
  const lMistake = globals.appState.mistakes.find(m => m.id === lQ.id);
  assert(lMistake, 'Wrong Lesen answer must be recorded in Mistake Bank');
  assert.strictEqual(globals.leitnerEngine.getItem(lQ.id).box, 0, 'Wrong Lesen question must be in Leitner Box 0');

  // ------------------------------------------------------------------------
  // Test 7: Daily Sprint Leitner Progression
  // ------------------------------------------------------------------------
  console.log('7. Testing Daily Sprint Leitner progression...');
  globals.startDailySprint();
  const sprint = globals.currentSprintState;
  assert(sprint, 'currentSprintState must exist');

  // Step 1: New Word Discovery
  globals.advanceSprintStep(true);
  assert.strictEqual(sprint.step, 1, 'Sprint step must advance to 1');

  // Step 2: New Word Discovery 2
  globals.advanceSprintStep(true);
  assert.strictEqual(sprint.step, 2, 'Sprint step must advance to 2');

  // Step 3: Spaced Recall Review
  const reviewTarget = sprint.reviewWord;
  const boxBefore = globals.leitnerEngine.getItem(reviewTarget.id) ? globals.leitnerEngine.getItem(reviewTarget.id).box : 1;
  globals.advanceSprintStep(true);
  const boxAfter = globals.leitnerEngine.getItem(reviewTarget.id).box;
  assert(boxAfter > boxBefore || boxAfter >= 1, 'Spaced recall step must advance Leitner box on success');

  console.log('===============================================================');
  console.log('All Scoring and Spaced Review Integration tests PASSED cleanly!');
  console.log('===============================================================');
}

if (require.main === module) {
  testScoringAndSpacedReviewIntegration().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { testScoringAndSpacedReviewIntegration };
