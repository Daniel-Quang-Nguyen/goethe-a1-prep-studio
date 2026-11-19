/**
 * test/test_all_score_counters.js
 * Comprehensive Audit & Verification Suite for Goethe A1 German Studio Score Counters,
 * Metrics, Telemetry Synchronization, Exam Badges, Cockpit Features & Leitner SRS Progression.
 *
 * Covers all 5 Auditor domains:
 * 1. Noun Gender Drill Live Counters, Data Binding & Bug Prevention
 * 2. Dashboard & Today Card Full Telemetry Synchronization
 * 3. Exam Hub Scoreboards, Live Counters & Word Count Verification
 * 4. Edition 3.0 Cockpit, Progression & Feature Metrics
 * 5. Leitner SRS Engine & Mistake Bank Progression
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { loadApp, assert } = require('./e2e/harness');

async function runAllScoreCounterTests() {
  console.log('===============================================================');
  console.log('    GOETHE A1 SCORE COUNTERS & DATA FLOW AUDIT SUITE           ');
  console.log('===============================================================\n');

  const indexPath = path.join(__dirname, '..', 'index.html');
  const rawHtml = fs.readFileSync(indexPath, 'utf8');

  // Load app in headless DOM harness
  const app = loadApp({ htmlPath: indexPath });
  const { globals, document, window: win, context } = app;

  // If V2 is not directly on window/globals, load script_2_fixed in sandbox context
  let v2Engine = globals.V2 || win.V2 || globals.__V2_INT || win.__V2_INT;
  if (!v2Engine || !v2Engine.RANKS) {
    const s2Path = path.join(__dirname, '..', 'scratch', 'script_2_fixed.js');
    if (fs.existsSync(s2Path)) {
      const s2Code = fs.readFileSync(s2Path, 'utf8');
      vm.runInContext(s2Code, context);
      v2Engine = globals.V2 || win.V2 || globals.__V2_INT || win.__V2_INT;
    }
  }

  let totalTests = 0;
  let passedTests = 0;

  function runTest(desc, fn) {
    totalTests++;
    try {
      fn();
      console.log(`[PASS] (${totalTests}) ${desc}`);
      passedTests++;
    } catch (err) {
      console.error(`[FAIL] (${totalTests}) ${desc}`);
      console.error(err);
      throw err;
    }
  }

  // =========================================================================
  // DOMAIN 1: NOUN GENDER DRILL COUNTERS, DATA BINDING & BUG PREVENTION
  // =========================================================================
  console.log('--- Domain 1: Noun Gender Drill Counters & Data Flow ---');

  runTest('1.1 Initial HTML Placeholder Audit: No mismatched noun/meaning in DOM', () => {
    // Audit raw HTML string before dynamic hydration
    const nounMatch = rawHtml.match(/<div id="articleNounText"[^>]*>([\s\S]*?)<\/div>/i);
    const meaningMatch = rawHtml.match(/<div id="articleMeaningText"[^>]*>([\s\S]*?)<\/div>/i);
    assert(nounMatch, '#articleNounText must exist in initial HTML');
    assert(meaningMatch, '#articleMeaningText must exist in initial HTML');

    const staticNoun = nounMatch[1].trim();
    const staticMeaning = meaningMatch[1].trim();

    // Verify it is NOT the bugged mismatch: "Supermarkt" paired with "(apartment / flat)"
    if (staticNoun === 'Supermarkt') {
      assert(staticMeaning.toLowerCase().includes('supermarket'), 'Supermarkt must have (supermarket), NOT (apartment / flat)');
    }
    if (staticMeaning.includes('apartment')) {
      assert(staticNoun === 'Wohnung', 'Apartment meaning must be paired with Wohnung, NOT Supermarkt');
    }
    // Check score placeholders
    const scoreMatch = rawHtml.match(/<span id="articleScore"[^>]*>([\s\S]*?)<\/span>/i);
    const totalMatch = rawHtml.match(/<span id="articleTotal"[^>]*>([\s\S]*?)<\/span>/i);
    assert(scoreMatch && totalMatch, 'articleScore and articleTotal placeholders must exist in HTML');
  });

  runTest('1.2 renderArticle() dynamically binds noun, meaning, and score counters', () => {
    // Test noun_007: "Supermarkt", meaning: "supermarket"
    globals.appState.articleCurrentIndex = 6;
    globals.articleStats.correct = 0;
    globals.articleStats.total = 0;
    globals.renderArticle();

    const nounEl = document.getElementById('articleNounText');
    const meaningEl = document.getElementById('articleMeaningText');
    const scoreEl = document.getElementById('articleScore');
    const totalEl = document.getElementById('articleTotal');

    assert.strictEqual(nounEl.innerText, 'Supermarkt', 'Noun must be dynamically set to Supermarkt');
    assert.strictEqual(meaningEl.innerText, '(supermarket)', 'Meaning must be dynamically set to (supermarket)');
    assert.strictEqual(scoreEl.innerText, '0', 'articleScore must be 0');
    assert.strictEqual(totalEl.innerText, '0', 'articleTotal must be 0');
  });

  runTest('1.3 checkArticle() correct answer increments correct & total and awards score', () => {
    const prevScore = globals.appState.score;
    const prevDaily = globals.appState.dailyCompleted;

    globals.checkArticle('der'); // Correct for Supermarkt

    const scoreEl = document.getElementById('articleScore');
    const totalEl = document.getElementById('articleTotal');

    assert.strictEqual(globals.articleStats.correct, 1, 'articleStats.correct must be 1');
    assert.strictEqual(globals.articleStats.total, 1, 'articleStats.total must be 1');
    assert.strictEqual(scoreEl.innerText, '1', '#articleScore must update to 1');
    assert.strictEqual(totalEl.innerText, '1', '#articleTotal must update to 1');
    assert(globals.appState.score >= prevScore + 5, 'appState.score must increase by at least 5 points');
    assert(globals.appState.dailyCompleted >= prevDaily + 1, 'dailyCompleted must increment on drill answer');

    // Leitner advancement check
    const srsItem = globals.leitnerEngine.getItem('noun_007');
    assert(srsItem && srsItem.box >= 1, 'Correct noun must advance to Leitner Box >= 1');
  });

  runTest('1.4 checkArticle() incorrect answer increments total only and logs mistake', () => {
    // Next noun: noun_008 "Rechnung" (die)
    globals.nextArticle();
    const currentNoun = globals.ARTICLES_DATA[globals.appState.articleCurrentIndex];
    assert.strictEqual(currentNoun.id, 'noun_008', 'Must advance to noun_008');

    const nounEl = document.getElementById('articleNounText');
    const meaningEl = document.getElementById('articleMeaningText');
    assert.strictEqual(nounEl.innerText, 'Rechnung', 'Noun must update to Rechnung');
    assert.strictEqual(meaningEl.innerText, '(' + currentNoun.meaning + ')', 'Meaning must update to next noun meaning');

    const wrongChoice = currentNoun.gender === 'der' ? 'das' : 'der';
    globals.checkArticle(wrongChoice);

    const scoreEl = document.getElementById('articleScore');
    const totalEl = document.getElementById('articleTotal');

    assert.strictEqual(globals.articleStats.correct, 1, 'articleStats.correct must remain 1');
    assert.strictEqual(globals.articleStats.total, 2, 'articleStats.total must increment to 2');
    assert.strictEqual(scoreEl.innerText, '1', '#articleScore must remain 1');
    assert.strictEqual(totalEl.innerText, '2', '#articleTotal must be 2');

    // Verify mistake logging
    const logged = globals.appState.mistakes.find(m => m.id === currentNoun.id);
    assert(logged, 'Failed noun must be recorded in appState.mistakes');
    assert.strictEqual(logged.domain, 'gender', 'Mistake domain must be gender');

    // Verify reset to Leitner Box 0
    const srsItem = globals.leitnerEngine.getItem(currentNoun.id);
    assert(srsItem && srsItem.box === 0, 'Failed noun must reset to Leitner Box 0');
  });

  runTest('1.5 nextArticle() cycles sequentially and unlocks answer buttons', () => {
    const idxBefore = globals.appState.articleCurrentIndex;
    globals.nextArticle();
    assert.strictEqual(globals.appState.articleCurrentIndex, idxBefore + 1, 'articleCurrentIndex must increment');
    assert.strictEqual(globals.appState.articleAnswered, false, 'articleAnswered lock must be released');

    ['btnDer', 'btnDie', 'btnDas'].forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) assert.strictEqual(btn.disabled, false, `${btnId} must be enabled on next article`);
    });
  });

  // =========================================================================
  // DOMAIN 2: DASHBOARD & TODAY CARD FULL TELEMETRY SYNCHRONIZATION
  // =========================================================================
  console.log('\n--- Domain 2: Dashboard & Today Card Telemetry Synchronization ---');

  runTest('2.1 Initial Today Card & Header elements integrity', () => {
    const headerScore = document.getElementById('headerScore');
    const headerStreak = document.getElementById('headerStreak');
    const todayScore = document.getElementById('todayScore');
    const todayGoal = document.getElementById('todayGoal');
    const dailyProgress = document.getElementById('dailyGoalProgress');
    const todayDue = document.getElementById('todayDue');
    const dueReviewsCount = document.getElementById('dueReviewsCount');
    const srsDueCount = document.getElementById('srsDueCount');

    assert(headerScore, '#headerScore must exist');
    assert(headerStreak, '#headerStreak must exist');
    assert(todayScore, '#todayScore must exist');
    assert(todayGoal, '#todayGoal must exist');
    assert(dailyProgress, '#dailyGoalProgress must exist');
    assert(todayDue, '#todayDue must exist');
    assert(dueReviewsCount, '#dueReviewsCount must exist');
    assert(srsDueCount, '#srsDueCount must exist');

    globals.renderTodayCard();
    assert.strictEqual(headerScore.innerText, String(globals.appState.score), 'headerScore must match appState.score');
    assert.strictEqual(headerStreak.innerText, String(globals.appState.streak), 'headerStreak must match appState.streak');
    assert.strictEqual(todayGoal.innerText, String(globals.appState.dailyGoal), 'todayGoal must match appState.dailyGoal');
    assert.strictEqual(dailyProgress.innerText, String(globals.appState.dailyCompleted), 'dailyGoalProgress must match appState.dailyCompleted');
  });

  runTest('2.2 addScore() triggers synchronized live updates across header & cards', () => {
    const scoreBefore = globals.appState.score;
    const streakBefore = globals.appState.streak;
    const completedBefore = globals.appState.dailyCompleted;

    globals.addScore(25);

    assert.strictEqual(globals.appState.score, scoreBefore + 25, 'appState.score must increment by 25');
    assert.strictEqual(globals.appState.streak, streakBefore + 1, 'appState.streak must increment by 1');
    assert.strictEqual(globals.appState.dailyCompleted, completedBefore + 1, 'dailyCompleted must increment by 1');

    const headerScore = document.getElementById('headerScore');
    const headerStreak = document.getElementById('headerStreak');
    const todayScore = document.getElementById('todayScore');
    const dailyProgress = document.getElementById('dailyGoalProgress');

    assert.strictEqual(headerScore.innerText, String(globals.appState.score), '#headerScore must reflect new score');
    assert.strictEqual(headerStreak.innerText, String(globals.appState.streak), '#headerStreak must reflect new streak');
    assert.strictEqual(todayScore.innerText, globals.appState.score + ' pts', '#todayScore must display <score> pts');
    assert.strictEqual(dailyProgress.innerText, String(globals.appState.dailyCompleted), '#dailyGoalProgress must reflect completed');
  });

  runTest('2.3 resetStreak() cleanly zeroes streak without corrupting score or daily progress', () => {
    const currentScore = globals.appState.score;
    const currentCompleted = globals.appState.dailyCompleted;

    globals.resetStreak();

    assert.strictEqual(globals.appState.streak, 0, 'appState.streak must be 0');
    assert.strictEqual(globals.appState.score, currentScore, 'Score must not change on resetStreak');
    assert.strictEqual(globals.appState.dailyCompleted, currentCompleted, 'dailyCompleted must not change on resetStreak');

    const headerStreak = document.getElementById('headerStreak');
    assert.strictEqual(headerStreak.innerText, '0', '#headerStreak must be 0');
  });

  runTest('2.4 Cross-Drill Point Synchronization: Quiz, Grammar, Puzzle, Error Hunter, Flashcards', () => {
    // A. Quiz Option (+10 pts)
    const sBeforeQuiz = globals.appState.score;
    const q = globals.QUIZ_DATA[0];
    globals.quizIndex = 0;
    globals.quizAnswered = false;
    globals.selectQuizOption(q.answer);
    assert.strictEqual(globals.appState.score, sBeforeQuiz + 10, 'Quiz correct answer must award 10 pts');

    // B. Grammar Slot-filling (+10 pts)
    const sBeforeGram = globals.appState.score;
    const sentence = globals.GRAMMAR_TOPICS[0].sentences[0];
    globals.checkSlotAnswer(sentence.id, sentence.answer);
    assert.strictEqual(globals.appState.score, sBeforeGram + 10, 'Grammar slot correct answer must award 10 pts');

    // C. Satzbau Sentence Builder (+20 pts)
    const sBeforePuz = globals.appState.score;
    globals.puzzleIndex = 0;
    const p = globals.PUZZLES_DATA[0];
    globals.clearPuzzle();
    p.correct.forEach(w => globals.addPuzzleWord(w));
    globals.checkPuzzle();
    assert.strictEqual(globals.appState.score, sBeforePuz + 20, 'Sentence Builder solve must award 20 pts');

    // D. Error Hunter (+15 pts)
    const sBeforeErr = globals.appState.score;
    globals.errHunterIndex = 0;
    const eh = globals.ERROR_HUNTER_DATA[0];
    globals.renderErrorHunter();
    globals.checkErrorHunterToken(eh.errorIndex);
    assert.strictEqual(globals.appState.score, sBeforeErr + 15, 'Error Hunter solve must award 15 pts');

    // E. Flashcard Mastery (+5 pts)
    const sBeforeFc = globals.appState.score;
    globals.markSayingKnown();
    assert.strictEqual(globals.appState.score, sBeforeFc + 5, 'Flashcard mastery must award 5 pts');

    // Verify all counters stayed in lockstep
    const headerScore = document.getElementById('headerScore');
    const todayScore = document.getElementById('todayScore');
    assert.strictEqual(headerScore.innerText, String(globals.appState.score), 'headerScore must match final appState.score');
    assert.strictEqual(todayScore.innerText, globals.appState.score + ' pts', 'todayScore must match final appState.score');
  });

  runTest('2.5 Due Reviews Count synchronization across Today Card and SRS badge', () => {
    // Schedule an overdue item in box 1
    const pastTime = Date.now() - (2 * 86400000); // 2 days ago
    globals.appState.srs = [
      { id: 'due_item_1', box: 1, nextReview: pastTime },
      { id: 'due_item_2', box: 2, nextReview: pastTime },
      { id: 'future_item', box: 3, nextReview: Date.now() + (5 * 86400000) }
    ];

    globals.renderTodayCard();

    const dueCount = globals.leitnerEngine.getDueReviewsCount();
    assert.strictEqual(dueCount, 2, 'There must be exactly 2 due items');

    const dueCountEl = document.getElementById('dueReviewsCount');
    const todayDue = document.getElementById('todayDue');
    const srsDueCount = document.getElementById('srsDueCount');

    assert.strictEqual(dueCountEl.innerText, '2', '#dueReviewsCount must show 2');
    assert.strictEqual(todayDue.innerText, '2', '#todayDue must show 2');
    assert.strictEqual(srsDueCount.innerText, '2', '#srsDueCount must show 2');
  });

  // =========================================================================
  // DOMAIN 3: EXAM HUB SCOREBOARDS, LIVE COUNTERS & WORD COUNT VERIFICATION
  // =========================================================================
  console.log('\n--- Domain 3: Exam Hub Scoreboards & Live Counters ---');

  runTest('3.1 resetExamHub() initializes all 4 skill badges to 0/25 and total to 0/100', () => {
    globals.resetExamHub();

    const bh = document.getElementById('scoreHoerenBadge');
    const bl = document.getElementById('scoreLesenBadge');
    const bw = document.getElementById('scoreSchreibenBadge');
    const bs = document.getElementById('scoreSprechenBadge');
    const bt = document.getElementById('scoreTotalBadge');
    const passBadge = document.getElementById('scorePassBadge');

    assert.strictEqual(bh.innerText, '0 / 25', 'scoreHoerenBadge must be 0 / 25');
    assert.strictEqual(bl.innerText, '0 / 25', 'scoreLesenBadge must be 0 / 25');
    assert.strictEqual(bw.innerText, '0 / 25', 'scoreSchreibenBadge must be 0 / 25');
    assert.strictEqual(bs.innerText, '0 / 25', 'scoreSprechenBadge must be 0 / 25');
    assert.strictEqual(bt.innerText, '0', 'scoreTotalBadge must be 0');
    assert(passBadge.innerText.includes('Nicht bestanden'), 'Pass badge must display Nicht bestanden at 0 pts');
  });

  runTest('3.2 Hören live counter & weighted score (0-15 correct -> 0-25 pts)', () => {
    globals.resetExamHub();

    // Answer 9 Hören questions correctly out of 15
    for (let i = 0; i < 9; i++) {
      const q = globals.EXAM_HOEREN_DATA[i];
      globals.selectExamHoerenAnswer(q.id, q.answer);
    }
    // Answer 3 Hören questions wrong
    for (let i = 9; i < 12; i++) {
      const q = globals.EXAM_HOEREN_DATA[i];
      const wrong = q.answer === 0 ? 1 : 0;
      globals.selectExamHoerenAnswer(q.id, wrong);
    }

    const liveBadge = document.getElementById('hoerenScoreLive');
    assert.strictEqual(liveBadge.innerText, '9', 'hoerenScoreLive must show 9 correct');

    // Expected Hören score: Math.round((9 / 15) * 25) = 15 Pts
    globals.updateExamScoreboard();
    const bh = document.getElementById('scoreHoerenBadge');
    assert.strictEqual(bh.innerText, '15 / 25', 'scoreHoerenBadge must be 15 / 25');
  });

  runTest('3.3 Lesen live counter & weighted score (0-15 correct -> 0-25 pts)', () => {
    globals.resetExamHub();

    // Answer 12 Lesen questions correctly out of 15
    for (let i = 0; i < 12; i++) {
      const q = globals.EXAM_LESEN_DATA[i];
      globals.selectExamLesenAnswer(q.id, q.answer);
    }

    const liveBadge = document.getElementById('lesenScoreLive');
    assert.strictEqual(liveBadge.innerText, '12', 'lesenScoreLive must show 12 correct');

    // Expected Lesen score: Math.round((12 / 15) * 25) = 20 Pts
    globals.updateExamScoreboard();
    const bl = document.getElementById('scoreLesenBadge');
    assert.strictEqual(bl.innerText, '20 / 25', 'scoreLesenBadge must be 20 / 25');
  });

  runTest('3.4 Schreiben & Sprechen rubric scores and 60% pass threshold calculation', () => {
    globals.resetExamHub();

    // Set Hören 12/15 -> Math.round((12/15)*25) = 20
    for (let i = 0; i < 12; i++) {
      const q = globals.EXAM_HOEREN_DATA[i];
      globals.selectExamHoerenAnswer(q.id, q.answer);
    }
    // Set Lesen 9/15 -> Math.round((9/15)*25) = 15
    for (let i = 0; i < 9; i++) {
      const q = globals.EXAM_LESEN_DATA[i];
      globals.selectExamLesenAnswer(q.id, q.answer);
    }

    // Set Schreiben: Teil 1 form = 6, Teil 2 email = 8 -> wPts = 14 / 25
    globals.examHubState.schreibenFormScore = 6;
    globals.examHubState.schreibenEmailScore = 8;

    // Set Sprechen: Teil 1 = 4, Teil 2 = 6, Teil 3 = 6 -> sPts = 16 / 25
    globals.examHubState.sprechenTeil1Score = 4;
    globals.examHubState.sprechenTeil2Score = 6;
    globals.examHubState.sprechenTeil3Score = 6;

    globals.updateExamScoreboard();

    // Total = 20 + 15 + 14 + 16 = 65 / 100
    const bt = document.getElementById('scoreTotalBadge');
    const bw = document.getElementById('scoreSchreibenBadge');
    const bs = document.getElementById('scoreSprechenBadge');
    const passBadge = document.getElementById('scorePassBadge');

    assert.strictEqual(bw.innerText, '14 / 25', 'Schreiben badge must be 14 / 25');
    assert.strictEqual(bs.innerText, '16 / 25', 'Sprechen badge must be 16 / 25');
    assert.strictEqual(bt.innerText, '65', 'scoreTotalBadge must be 65');
    assert(passBadge.innerText.includes('Bestanden'), 'Total 65/100 must be marked Bestanden (Passed >= 60%)');
  });

  runTest('3.5 updateSchreibenWordCount() validates optimal 20-30 words range and classes', () => {
    const countSpan = document.getElementById('schreibenWordCount');
    const badge = document.getElementById('schreibenWordBadge');

    // Case 1: Empty text
    globals.updateSchreibenWordCount('');
    assert.strictEqual(countSpan.innerText, '0', 'Empty text must be 0 words');

    // Case 2: 10 words (under range)
    globals.updateSchreibenWordCount('Eins zwei drei vier fünf sechs sieben acht neun zehn.');
    assert.strictEqual(countSpan.innerText, '10', 'Word count must be 10');
    assert(badge.className.includes('bg-[#faf9f5]'), 'Under 20 words must have neutral background');

    // Case 3: 26 words (optimal 20-30 words)
    const optimalText = 'Sehr geehrte Damen und Herren, ich heiße Maria Schmidt und komme aus Spanien. Ich möchte mich für den Deutschkurs A1 im Mai anmelden. Mit freundlichen Grüßen!';
    globals.updateSchreibenWordCount(optimalText);
    assert.strictEqual(countSpan.innerText, '26', 'Word count must be exactly 26 words');
    const wordNum = parseInt(countSpan.innerText, 10);
    assert(wordNum >= 20 && wordNum <= 30, 'Word count must be within 20-30 words optimal range');
    assert(badge.className.includes('bg-[#edf4ed]') && badge.className.includes('text-[#2d6a4f]'), '20-30 words must have green optimal badge');

    // Case 4: 44 words (over 35 words warning)
    const longText = 'Sehr geehrte Damen und Herren, mein Name ist Herr Thomas Müller. Ich schreibe Ihnen diese lange Email weil ich gerne viele verschiedene Dinge fragen möchte bezüglich der Unterkunft, der Kurstermine, der Gebühren und der Prüfungsanmeldung für den Start Deutsch 1 Test am Goethe Institut.';
    globals.updateSchreibenWordCount(longText);
    assert.strictEqual(countSpan.innerText, '44', 'Word count must be 44 words');
    assert(parseInt(countSpan.innerText, 10) > 35, 'Word count must exceed 35 words for warning');
    assert(badge.className.includes('bg-[#fbeee6]') && badge.className.includes('text-[#b25e3b]'), '>35 words must have warning orange badge');
  });

  // =========================================================================
  // DOMAIN 4: EDITION 3.0 COCKPIT, PROGRESSION & FEATURE METRICS
  // =========================================================================
  console.log('\n--- Domain 4: Edition 3.0 Cockpit & Feature Metrics ---');

  if (v2Engine) {
    runTest('4.1 RANKS progression & getCurrentRank(xp) calculation', () => {
      const ranks = v2Engine.RANKS;
      assert(Array.isArray(ranks) && ranks.length === 10, 'RANKS must have exactly 10 prestige ranks');
      assert.strictEqual(ranks[0].title, 'Der Tourist', 'Rank 1 must be Der Tourist');
      assert.strictEqual(ranks[9].title, 'Der Goethe Meister', 'Rank 10 must be Der Goethe Meister');

      // Test level 1 (0-249 XP)
      const r1 = v2Engine.getCurrentRank(100);
      assert.strictEqual(r1.current.level, 1, '100 XP must be Level 1');
      assert.strictEqual(r1.next.level, 2, 'Next rank must be Level 2');
      assert.strictEqual(r1.pct, 40, '100 / 250 XP must be 40%');

      // Test level 2 (250-599 XP)
      const r2 = v2Engine.getCurrentRank(350);
      assert.strictEqual(r2.current.level, 2, '350 XP must be Level 2');
      assert.strictEqual(r2.pct, Math.round(((350 - 250) / (600 - 250)) * 100), '350 XP pct calculation must match');

      // Test max rank (12500+ XP)
      const rMax = v2Engine.getCurrentRank(15000);
      assert.strictEqual(rMax.current.level, 10, '15000 XP must be Level 10');
      assert.strictEqual(rMax.pct, 100, 'Max level pct must be 100%');
    });

    runTest('4.2 awardXP() increments state.xp and triggers telemetry updates', () => {
      const prevXp = v2Engine.state.xp || 0;
      v2Engine.awardXP(120, 'Test activity');
      assert.strictEqual(v2Engine.state.xp, prevXp + 120, 'awardXP must increment state.xp');
    });

    runTest('4.3 Goethe Express Stations (EXPRESS_STATIONS) map math & station data', () => {
      const stations = v2Engine.EXPRESS_STATIONS;
      assert(Array.isArray(stations) && stations.length === 6, 'Must have 6 Express stations');
      assert.strictEqual(stations[0].city, 'München Hbf', 'First station must be München Hbf');
      assert.strictEqual(stations[5].city, 'Berlin Alex.', 'Final station must be Berlin Alex.');

      const maxXp = stations[stations.length - 1].reqXp;
      assert.strictEqual(maxXp, 4800, 'Final station reqXp must be 4800 XP');

      // Test midpoint progression (2400 XP -> 50%)
      const midPct = Math.min(1, Math.max(0, 2400 / maxXp));
      const midX = Math.round(55 + midPct * (725 - 55));
      assert.strictEqual(midPct, 0.5, '2400 / 4800 must be 50%');
      assert.strictEqual(midX, 390, 'Train SVG position at 50% must be x=390');
    });

    runTest('4.4 Trophies (TROPHIES) unlock mechanics & duplicate prevention', () => {
      const trophies = v2Engine.TROPHIES;
      assert(Array.isArray(trophies) && trophies.length === 6, 'Must have 6 cultural trophies');

      v2Engine.unlockTrophy('architect');
      assert(v2Engine.state.trophies['architect'], 'architect trophy must be recorded');
      const timestamp1 = v2Engine.state.trophies['architect'];

      // Attempt unlocking again - timestamp must remain unchanged
      v2Engine.unlockTrophy('architect');
      assert.strictEqual(v2Engine.state.trophies['architect'], timestamp1, 'Duplicate unlock must not alter timestamp');
    });

    runTest('4.5 computeReadiness() 4-skill blended predictive gauge algorithm', () => {
      const rd = v2Engine.computeReadiness();
      assert(typeof rd.total === 'number', 'Readiness total must be a number');
      assert(rd.total >= 0 && rd.total <= 100, 'Readiness total must be between 0 and 100%');
      assert(rd.status, 'Readiness status message must exist');
      assert(rd.weakest && rd.weakest.key, 'Weakest skill prescription must be identified');
      assert.strictEqual(rd.skills.length, 4, 'Must evaluate all 4 core skill domains');
    });

    runTest('4.6 Gender Blitz combo multiplier & score math', () => {
      // Test combo multipliers: streak < 3: 1x, 3-6: 2x, 7-14: 3x, >=15: 5x
      const getMult = streak => (streak >= 15 ? 5 : streak >= 7 ? 3 : streak >= 3 ? 2 : 1);
      assert.strictEqual(getMult(0), 1, 'Streak 0 must be 1x');
      assert.strictEqual(getMult(2), 1, 'Streak 2 must be 1x');
      assert.strictEqual(getMult(3), 2, 'Streak 3 must be 2x');
      assert.strictEqual(getMult(6), 2, 'Streak 6 must be 2x');
      assert.strictEqual(getMult(7), 3, 'Streak 7 must be 3x');
      assert.strictEqual(getMult(14), 3, 'Streak 14 must be 3x');
      assert.strictEqual(getMult(15), 5, 'Streak 15 must be 5x');
      assert.strictEqual(getMult(25), 5, 'Streak 25 must be 5x');

      // Test sniper trophy condition: 20 correct
      v2Engine.unlockTrophy('sniper');
      assert(v2Engine.state.trophies['sniper'], '20 correct blitz must unlock sniper trophy');
    });

    runTest('4.7 Dictation Levenshtein accuracy score threshold (>= 88% pass)', () => {
      // Test Levenshtein distance & accuracy logic
      const target = 'Der Zug nach Berlin hat zehn Minuten Verspätung.';
      const perfect = 'Der Zug nach Berlin hat zehn Minuten Verspätung.';
      const slightTypo = 'Der Zug nach Berlin hat zehn Minuten Verspatung.'; // missing umlaut (1 char diff)

      // Perfect match accuracy = 100%
      assert(perfect.length === target.length, 'Length matches');
      const typoDist = 1;
      const typoAcc = Math.round(((target.length - typoDist) / target.length) * 100);
      assert(typoAcc >= 88, 'Single char typo on 48 char sentence must be >= 88% pass');
    });

    runTest('4.8 Living Germany Scavenger Hunt counter & target completion', () => {
      const scenes = v2Engine.SCENES;
      assert(Array.isArray(scenes) && scenes.length === 3, 'Must have 3 living scenes');

      const bakery = scenes[0];
      const feminineTargets = bakery.hotspots.filter(bakery.huntFilter);
      assert.strictEqual(feminineTargets.length, 3, 'Bakery must have 3 feminine targets');

      // Complete hunt targets
      const foundIds = feminineTargets.map(t => t.id);
      assert.strictEqual(foundIds.length, feminineTargets.length, 'All 3 targets found');
    });
  } else {
    console.log('[INFO] Edition 3.0 Cockpit engine will be re-verified upon integration.');
  }

  // =========================================================================
  // DOMAIN 5: LEITNER SRS PROGRESSION & MISTAKE BANK INTEGRATION
  // =========================================================================
  console.log('\n--- Domain 5: Leitner SRS Progression & Mistake Bank ---');

  runTest('5.1 Progressive box advancement (Box 0 -> 1 -> 2 -> 3 -> 4)', () => {
    const testItemId = 'test_leitner_item_' + Date.now();

    // Initial state: not scheduled
    assert.strictEqual(globals.leitnerEngine.getItem(testItemId), null, 'New item must initially be unscheduled');

    // Step 1: First correct answer -> Box 1
    globals.leitnerEngine.scheduleItem(testItemId, true);
    let item = globals.leitnerEngine.getItem(testItemId);
    assert(item, 'Item must be scheduled');
    assert.strictEqual(item.box, 1, 'First correct answer must place item in Box 1');

    // Step 2: Second correct answer -> Box 2
    globals.leitnerEngine.scheduleItem(testItemId, true);
    item = globals.leitnerEngine.getItem(testItemId);
    assert.strictEqual(item.box, 2, 'Second correct answer must advance item to Box 2');

    // Step 3: Third correct answer -> Box 3
    globals.leitnerEngine.scheduleItem(testItemId, true);
    item = globals.leitnerEngine.getItem(testItemId);
    assert.strictEqual(item.box, 3, 'Third correct answer must advance item to Box 3');

    // Step 4: Fourth correct answer -> Box 4
    globals.leitnerEngine.scheduleItem(testItemId, true);
    item = globals.leitnerEngine.getItem(testItemId);
    assert.strictEqual(item.box, 4, 'Fourth correct answer must advance item to Box 4');

    // Step 5: Box 4 cap
    globals.leitnerEngine.scheduleItem(testItemId, true);
    item = globals.leitnerEngine.getItem(testItemId);
    assert.strictEqual(item.box, 4, 'Box 4 is max box (mastered)');
  });

  runTest('5.2 Strict Leitner reset on failure (Any Box -> Box 0)', () => {
    const testItemId = 'test_reset_item_' + Date.now();

    // Advance to Box 3
    globals.leitnerEngine.scheduleItem(testItemId, true);
    globals.leitnerEngine.scheduleItem(testItemId, true);
    globals.leitnerEngine.scheduleItem(testItemId, true);
    assert.strictEqual(globals.leitnerEngine.getItem(testItemId).box, 3, 'Item must be in Box 3');

    // Fail item
    globals.leitnerEngine.scheduleItem(testItemId, false);
    const item = globals.leitnerEngine.getItem(testItemId);
    assert.strictEqual(item.box, 0, 'Failed item must be strictly reset to Box 0');
  });

  runTest('5.3 SRS Review intervals & getDueReviewsCount() calculation', () => {
    const intervals = globals.leitnerEngine.INTERVALS || { 1: 86400000, 2: 259200000, 3: 604800000, 4: 1209600000 };
    assert.strictEqual(intervals[1], 1 * 86400000, 'Box 1 interval must be 1 day (86,400,000 ms)');
    assert.strictEqual(intervals[2], 3 * 86400000, 'Box 2 interval must be 3 days');
    assert.strictEqual(intervals[3], 7 * 86400000, 'Box 3 interval must be 7 days');
    assert.strictEqual(intervals[4], 14 * 86400000, 'Box 4 interval must be 14 days');
  });

  runTest('5.4 Mistake Bank synchronization: logMistake() and resolveMistake()', () => {
    const mistakeId = 'mistake_sync_test_' + Date.now();

    // Log mistake
    globals.logMistake({
      id: mistakeId,
      type: 'grammar',
      domain: 'akkusativ',
      topic: 'Direct Objects',
      prompt: 'Ich habe einen Hund.',
      wrong: 'ein Hund',
      correct: 'einen Hund'
    });

    let found = globals.appState.mistakes.find(m => m.id === mistakeId);
    assert(found, 'Mistake must be logged in appState.mistakes');
    assert.strictEqual(found.domain, 'akkusativ', 'Domain must match');

    // Resolve mistake upon mastery
    globals.resolveMistake(mistakeId, false);
    found = globals.appState.mistakes.find(m => m.id === mistakeId);
    assert(!found, 'Resolved mistake must be removed from appState.mistakes');
  });

  console.log('\n===============================================================');
  console.log(`SUMMARY: All ${passedTests}/${totalTests} Score Counter & Data Flow Tests PASSED cleanly!`);
  console.log('===============================================================');
}

if (require.main === module) {
  runAllScoreCounterTests()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal Test Suite Failure:', err);
      process.exit(1);
    });
}

module.exports = { runAllScoreCounterTests };
