/**
 * test/e2e/tier4_scenarios.test.js
 * Tier 4: Real-World Application Workflows (10 tests)
 * Simulates end-to-end user journeys through Goethe A1 German Studio.
 * Zero external dependencies: uses Node.js core modules (assert, fs, path, vm).
 */
const assert = require('assert');
const { createHarness } = require('./harness');

async function runTier4Tests() {
  console.log('====================================================');
  console.log('STARTING TIER 4 REAL-WORLD APPLICATION WORKFLOWS (10 TESTS)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const grepArg = process.argv.find(a => a.startsWith('--grep='));
  const grepFilter = grepArg ? new RegExp(grepArg.slice('--grep='.length), 'i') : null;

  const scenarios = [
    {
      id: 'T4.01',
      name: 'Scenario 1: First-Time Learner Onboarding',
      fn: (harness) => {
        // Cold start with empty storage
        harness.storage.clear();

        // 1. App state must be initialized by index.html on load
        assert.ok(harness.window.appState, 'window.appState must be initialized on initial load');
        assert.strictEqual(harness.window.appState.score, 0, 'Initial score must be 0');
        assert.strictEqual(harness.window.appState.streak, 0, 'Initial streak must be 0');

        // 2. Default theme must be light (body does not have 'dark' class)
        assert.strictEqual(harness.document.body.classList.contains('dark'), false, 'Default theme on body must not be dark');

        // 3. Header score and streak displays must be wired to 0
        const headerScore = harness.document.getElementById('headerScore');
        const headerStreak = harness.document.getElementById('headerStreak');
        assert.ok(headerScore, '#headerScore element must exist in header');
        assert.ok(headerStreak, '#headerStreak element must exist in header');
        assert.strictEqual(headerScore.innerText.trim(), '0', 'Header score display must be 0');
        assert.strictEqual(headerStreak.innerText.trim(), '0', 'Header streak display must be 0');

        // 4. Today Dashboard Card must be present in the initial view
        const todayCard = harness.document.getElementById('todayCard') || harness.document.querySelector('.today-card');
        assert.ok(todayCard, 'Today dashboard card must be present on initial load');
      }
    },
    {
      id: 'T4.02',
      name: 'Scenario 2: Grammar Drill & Slot Validation Lifecycle',
      fn: (harness) => {
        // Navigate to Dativ topic in Grammar Studio
        harness.navigate('#/grammar/dativ');

        // 1. GRAMMAR_TOPICS must be loaded on window
        const topics = harness.window.GRAMMAR_TOPICS;
        assert.ok(topics, 'GRAMMAR_TOPICS must be loaded on window');

        // Locate Dativ topic
        const dativTopic = Array.isArray(topics) ? topics.find(t => t.id === 'dativ') : topics['dativ'];
        assert.ok(dativTopic, 'Dativ grammar topic must exist in GRAMMAR_TOPICS');

        const sentences = dativTopic.sentences || dativTopic.items || [];
        assert.ok(sentences.length >= 20, `Dativ topic must contain >= 20 sentences, found ${sentences.length}`);

        const sentence = sentences[0];
        assert.ok(sentence.template.includes('{0}'), 'Sentence template must contain slot token {0}');
        assert.ok(Array.isArray(sentence.options) && sentence.options.length >= 2, 'Sentence must provide options');

        // 2. checkSlotAnswer function must exist on window
        assert.strictEqual(typeof harness.window.checkSlotAnswer, 'function', 'checkSlotAnswer function must exist on window');

        // Step A: Submit wrong answer
        const wrongIdx = (sentence.answer + 1) % sentence.options.length;
        const wrongResult = harness.window.checkSlotAnswer(sentence.id, wrongIdx);
        assert.strictEqual(wrongResult.correct, false, 'Validation of wrong option must return correct: false');

        // Verify mistake was logged to application state
        assert.ok(harness.window.appState.mistakes && harness.window.appState.mistakes.some(m => m.id === sentence.id),
          'Mistake must be recorded in appState.mistakes on wrong answer');

        // Step B: Submit correct answer
        const initialScore = harness.window.appState.score || 0;
        const initialStreak = harness.window.appState.streak || 0;
        const correctResult = harness.window.checkSlotAnswer(sentence.id, sentence.answer);
        assert.strictEqual(correctResult.correct, true, 'Validation of correct option must return correct: true');
        assert.ok(correctResult.rule || sentence.rule, 'Rule spotlight must be provided on answer validation');
        assert.ok(harness.window.appState.score > initialScore, 'Score must increment on correct answer');
        assert.ok(harness.window.appState.streak > initialStreak, 'Streak must increment on correct answer');
      }
    },
    {
      id: 'T4.03',
      name: 'Scenario 3: Complete Preposition Matrix Exploration (Acc, Dat, Two-Way)',
      fn: (harness) => {
        harness.navigate('#/grammar');

        // 1. Verify Preposition Matrix container exists in DOM or HTML
        const prepContainer = harness.document.getElementById('prepMatrix') ||
                              harness.document.getElementById('prep-matrix') ||
                              harness.document.querySelector('.preposition-matrix');
        assert.ok(prepContainer || harness.htmlContent.includes('Wechselpräpositionen'),
          'Visual Preposition Matrix must exist in DOM or HTML content');

        // 2. Validate all 6 Accusative prepositions are displayed
        const accPreps = ['durch', 'für', 'gegen', 'ohne', 'um', 'bis'];
        for (const prep of accPreps) {
          assert.ok(harness.htmlContent.includes(prep), `Accusative preposition '${prep}' must exist in Preposition Matrix`);
        }

        // 3. Validate all 7 Dative prepositions are displayed
        const datPreps = ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu'];
        for (const prep of datPreps) {
          assert.ok(harness.htmlContent.includes(prep), `Dative preposition '${prep}' must exist in Preposition Matrix`);
        }

        // 4. Validate all 9 Two-Way prepositions (Wechselpräpositionen) are displayed
        const twoWayPreps = ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'];
        for (const prep of twoWayPreps) {
          assert.ok(harness.htmlContent.includes(prep), `Two-Way preposition '${prep}' must exist in Preposition Matrix`);
        }

        // 5. Verify Wo? (Dativ) vs Wohin? (Akkusativ) distinction rule is documented
        const content = harness.htmlContent;
        assert.ok(content.includes('Wo?') && content.includes('Wohin?'),
          'Preposition matrix must document the Wo? vs. Wohin? distinction');
        assert.ok(/Wo\?.*Dativ/i.test(content) || content.includes('Wo? &rarr; DATIV'),
          'Wo? (Location) must be associated with Dativ');
        assert.ok(/Wohin\?.*Akkusativ/i.test(content) || content.includes('Wohin? &rarr; AKKUSATIV'),
          'Wohin? (Direction) must be associated with Akkusativ');
      }
    },
    {
      id: 'T4.04',
      name: 'Scenario 4: Vocabulary Sayings Flashcards & Noun Gender Drill',
      fn: (harness) => {
        harness.navigate('#/vocab');

        // Part A: Sayings Flashcards
        assert.ok(Array.isArray(harness.window.FLASHCARD_DATA) && harness.window.FLASHCARD_DATA.length >= 250,
          'FLASHCARD_DATA must contain at least 250 everyday sayings');

        // Mount Flashcard Studio
        if (typeof harness.window.renderFlashcardStudio === 'function') {
          harness.window.renderFlashcardStudio();
        }

        const cardInner = harness.document.getElementById('studioCardInner');
        assert.ok(cardInner, '#studioCardInner element must exist in flashcard view');

        const initialFlipped = cardInner.classList.contains('flipped');
        assert.strictEqual(typeof harness.window.flipStudioCard, 'function', 'flipStudioCard function must exist on window');
        harness.window.flipStudioCard();
        assert.strictEqual(cardInner.classList.contains('flipped'), !initialFlipped,
          'Calling flipStudioCard must toggle .flipped class on #studioCardInner');

        // Translation text on back
        const backTranslation = harness.document.getElementById('fcBackTranslation');
        assert.ok(backTranslation, '#fcBackTranslation must exist');
        assert.ok(backTranslation.innerText.trim().length > 0, 'Back of card must display non-empty translation');

        // Audio trigger
        assert.strictEqual(typeof harness.window.speakCurrentFlashcardPhrase, 'function',
          'speakCurrentFlashcardPhrase must exist on window');
        harness.speech.clear();
        harness.window.speakCurrentFlashcardPhrase();
        assert.ok(harness.speech.spokenUtterances.length >= 1, 'Audio utterance must be queued to speechSynthesis');
        assert.strictEqual(harness.speech.spokenUtterances[0].lang, 'de-DE', 'Audio utterance language must be de-DE');

        // Part B: Noun Gender Drill
        assert.ok(Array.isArray(harness.window.ARTICLES_DATA) && harness.window.ARTICLES_DATA.length >= 150,
          'ARTICLES_DATA must contain at least 150 nouns with plurals');

        if (typeof harness.window.renderArticle === 'function') {
          harness.window.renderArticle();
        }

        const nounText = harness.document.getElementById('articleNounText');
        assert.ok(nounText && nounText.innerText.trim().length > 0, 'Noun drill must display German noun prompt');

        assert.strictEqual(typeof harness.window.checkArticle, 'function', 'checkArticle must be defined on window');
        const currentIdx = harness.window.appState.articleCurrentIndex || 0;
        const currentNoun = harness.window.ARTICLES_DATA[currentIdx];
        harness.window.checkArticle(currentNoun.gender);

        const feedbackBox = harness.document.getElementById('articleFeedbackBox');
        assert.ok(feedbackBox && (feedbackBox.innerHTML.includes('Richtig') || feedbackBox.innerHTML.includes('✓')),
          'Feedback box must confirm correct gender selection');
        assert.ok(feedbackBox.innerHTML.includes('die ') || (currentNoun.plural && feedbackBox.innerHTML.includes(currentNoun.plural)),
          'Feedback box must display plural form with die');
      }
    },
    {
      id: 'T4.05',
      name: 'Scenario 5: Full Timed Mock Exam Simulation with 60% Passing Mark',
      fn: (harness) => {
        harness.navigate('#/exam');

        // 1. 210 Question Bank
        assert.ok(Array.isArray(harness.window.QUIZ_DATA) && harness.window.QUIZ_DATA.length === 210,
          'QUIZ_DATA must contain exactly 210 questions for full mock exam');

        // 2. Exam Launch controls and methods
        assert.strictEqual(typeof harness.window.startMockExam, 'function',
          'startMockExam function must be defined on window');
        harness.window.startMockExam();
        assert.ok(harness.window.appState.mockExam && harness.window.appState.mockExam.active,
          'Mock exam state must be active after startMockExam');

        // 3. Exam evaluation: Passing threshold strictly 60%
        assert.strictEqual(typeof harness.window.submitMockExam, 'function',
          'submitMockExam function must be defined on window');

        // Test passing score: 130/210 = 61.9% (>= 60%)
        const passResult = harness.window.submitMockExam({ correctCount: 130, total: 210 });
        assert.strictEqual(passResult.passed, true, 'Score 61.9% must pass mock exam (>=60% threshold)');
        assert.strictEqual(passResult.status, 'Bestanden', 'Passed mock exam must have status Bestanden');

        // Test failing score: 120/210 = 57.1% (< 60%)
        const failResult = harness.window.submitMockExam({ correctCount: 120, total: 210 });
        assert.strictEqual(failResult.passed, false, 'Score 57.1% must fail mock exam (<60% threshold)');
        assert.strictEqual(failResult.status, 'Nicht bestanden', 'Failed mock exam must have status Nicht bestanden');

        // 4. Missed questions queued to SRS Box 0
        assert.ok(Array.isArray(harness.window.appState.srs) && harness.window.appState.srs.length >= 80,
          'All missed exam questions must be automatically scheduled into SRS Box 0');
      }
    },
    {
      id: 'T4.06',
      name: 'Scenario 6: 4-Skill Exam Hub Traversal (Hören, Lesen, Schreiben, Sprechen)',
      fn: (harness) => {
        harness.navigate('#/exam');

        // Verify Studio 3 container
        const studioExam = harness.document.getElementById('studioExam');
        assert.ok(studioExam, '#studioExam container must exist in DOM');

        // Skill 1: Hören (Listening)
        const hoerenTab = harness.document.getElementById('examTabHoeren') || harness.document.querySelector('[data-skill="hoeren"]');
        assert.ok(hoerenTab, 'Hören skill tab must exist in Exam Hub');
        assert.strictEqual(typeof harness.window.speakDialogue, 'function', 'speakDialogue function must be defined for Hören');
        harness.speech.clear();
        harness.window.speakDialogue('Guten Tag, wie kann ich Ihnen helfen?');
        assert.ok(harness.speech.spokenUtterances.length > 0, 'Hören audio dialogue must trigger speech utterance');

        // Skill 2: Lesen (Reading)
        const lesenTab = harness.document.getElementById('examTabLesen') || harness.document.querySelector('[data-skill="lesen"]');
        assert.ok(lesenTab, 'Lesen skill tab must exist in Exam Hub');
        const lesenContainer = harness.document.getElementById('lesenPassage') || harness.document.querySelector('.lesen-notice');
        assert.ok(lesenContainer, 'Lesen notices or reading passage container must exist');

        // Skill 3: Schreiben (Writing)
        const schreibenTab = harness.document.getElementById('examTabSchreiben') || harness.document.querySelector('[data-skill="schreiben"]');
        assert.ok(schreibenTab, 'Schreiben skill tab must exist in Exam Hub');
        const textarea = harness.document.getElementById('schreibenTextarea') || harness.document.querySelector('.schreiben-message');
        assert.ok(textarea, 'Schreiben message textarea must exist');

        // Write a 26-word German message
        textarea.value = 'Liebe Anna, danke fuer die Einladung zur Party am Samstag. Ich komme sehr gern um neunzehn Uhr und bringe einen leckeren Salat mit. Bis Samstag, Stefan.';
        if (typeof harness.window.updateSchreibenWordCount === 'function') {
          harness.window.updateSchreibenWordCount();
        } else {
          textarea.dispatchEvent({ type: 'input' });
        }
        const counterEl = harness.document.getElementById('schreibenWordCount') || harness.document.querySelector('.word-counter');
        assert.ok(counterEl, 'Word counter element must exist');
        assert.ok(counterEl.innerText.includes('26') || counterEl.innerText.toLowerCase().includes('optimal') || counterEl.innerText.toLowerCase().includes('valid'),
          'Word counter must validate 20-30 words optimal message length');

        // Skill 4: Sprechen (Speaking)
        const sprechenTab = harness.document.getElementById('examTabSprechen') || harness.document.querySelector('[data-skill="sprechen"]');
        assert.ok(sprechenTab, 'Sprechen skill tab must exist in Exam Hub');
        const checklist = harness.document.getElementById('sprechenChecklist') || harness.document.querySelector('.sprechen-intro-checklist');
        assert.ok(checklist, 'Sprechen self-intro checklist must exist in Exam Hub');
      }
    },
    {
      id: 'T4.07',
      name: 'Scenario 7: Mistake Bank Weakness Retry Flow',
      fn: (harness) => {
        // Exercise genuine mistake logging API
        assert.strictEqual(typeof harness.window.logMistake, 'function', 'logMistake function must exist on window');
        harness.window.logMistake({ id: 'gram_dativ_01', domain: 'dativ', userChoice: 'den', correctChoice: 'dem' });
        harness.window.logMistake({ id: 'gram_dativ_02', domain: 'dativ', userChoice: 'der', correctChoice: 'dem' });
        harness.window.logMistake({ id: 'gram_dativ_03', domain: 'dativ', userChoice: 'ihn', correctChoice: 'ihm' });
        harness.window.logMistake({ id: 'quiz_010', domain: 'modal', userChoice: 'kannst', correctChoice: 'können' });
        harness.window.logMistake({ id: 'quiz_011', domain: 'modal', userChoice: 'willst', correctChoice: 'wollen' });

        assert.strictEqual(harness.window.appState.mistakes.length, 5, 'Exactly 5 mistakes must be logged');

        // Navigate to Mistake Bank in Review Studio
        harness.navigate('#/review');
        const mistakeBank = harness.document.getElementById('mistakeBankContainer') || harness.document.getElementById('studioReview');
        assert.ok(mistakeBank, 'Mistake Bank UI container must exist');

        // Weakness analytics
        assert.strictEqual(typeof harness.window.getWeaknessAnalytics, 'function', 'getWeaknessAnalytics function must exist on window');
        const weakness = harness.window.getWeaknessAnalytics();
        assert.strictEqual(weakness.primaryWeakness, 'dativ', 'Dativ must be identified as primary weakness (3 errors)');

        // Retry & Resolve
        assert.strictEqual(typeof harness.window.resolveMistake, 'function', 'resolveMistake function must exist on window');
        harness.window.resolveMistake('gram_dativ_01');
        harness.window.resolveMistake('gram_dativ_02');
        assert.strictEqual(harness.window.appState.mistakes.length, 3, 'Mistake count must reduce to 3 after resolving 2 items');
      }
    },
    {
      id: 'T4.08',
      name: 'Scenario 8: Leitner Spaced Repetition Progression Over Simulated Time',
      fn: (harness) => {
        // Exercise actual Leitner Spaced Repetition engine
        const leitner = harness.window.leitnerEngine;
        assert.ok(leitner && typeof leitner.scheduleItem === 'function',
          'leitnerEngine with scheduleItem must exist on window');
        assert.deepStrictEqual(leitner.intervals, [0, 1, 3, 7, 14, 30],
          'Leitner intervals must strictly follow [0, 1, 3, 7, 14, 30] days');

        const t0 = 1700000000000;

        // Day 0: Miss schedules into Box 0
        leitner.scheduleItem('quiz_001', false, t0);
        let record = leitner.getItem('quiz_001');
        assert.strictEqual(record.box, 0, 'Failed item must be in Box 0');
        assert.strictEqual(record.interval, 0, 'Box 0 interval must be 0 days');

        // Correct review promotes to Box 1 (+1 day = 86400000 ms)
        leitner.scheduleItem('quiz_001', true, t0);
        record = leitner.getItem('quiz_001');
        assert.strictEqual(record.box, 1, 'Correct answer must promote item to Box 1');
        assert.strictEqual(record.interval, 1, 'Box 1 interval must be 1 day');
        assert.strictEqual(record.nextReview, t0 + 86400000, 'Next review must be exactly 24 hours later');

        // Advance +24h -> Item must be due
        let dueItems = leitner.getDueItems(t0 + 86400000 + 1000);
        assert.ok(dueItems.some(i => i.id === 'quiz_001'), 'Item must be due after 24 hours');

        // Correct review promotes to Box 2 (+3 days)
        const t1 = t0 + 86400000 + 1000;
        leitner.scheduleItem('quiz_001', true, t1);
        record = leitner.getItem('quiz_001');
        assert.strictEqual(record.box, 2, 'Correct answer must promote item to Box 2');
        assert.strictEqual(record.interval, 3, 'Box 2 interval must be 3 days');
        assert.strictEqual(record.nextReview, t1 + (3 * 86400000), 'Next review must be exactly 3 days later');

        // Advance +1 day -> NOT due yet
        dueItems = leitner.getDueItems(t1 + 86400000);
        assert.strictEqual(dueItems.some(i => i.id === 'quiz_001'), false, 'Box 2 item must NOT be due after only 1 day');

        // Advance +3 days -> DUE
        dueItems = leitner.getDueItems(t1 + (3 * 86400000) + 1000);
        assert.ok(dueItems.some(i => i.id === 'quiz_001'), 'Box 2 item must be due after 3 days');

        // Mistake during review demotes back to Box 0
        leitner.scheduleItem('quiz_001', false, t1 + (3 * 86400000) + 1000);
        record = leitner.getItem('quiz_001');
        assert.strictEqual(record.box, 0, 'Mistake on review must demote item back to Box 0');
      }
    },
    {
      id: 'T4.09',
      name: 'Scenario 9: State Persistence, Export, Wipe & Restoration',
      fn: (harness) => {
        // Step 1: Storage Resilience with throwing localStorage
        harness.storage.setThrowMode(true);
        try {
          const writeSuccess = harness.window.safeSetStorage('sandbox_resilience_test', { val: 'safe' });
          assert.strictEqual(writeSuccess, true, 'safeSetStorage must return true even under storage exception');
          const cachedVal = harness.window.safeGetStorage('sandbox_resilience_test', null);
          assert.deepStrictEqual(cachedVal, { val: 'safe' }, 'safeGetStorage must return value from memory cache fallback');
        } finally {
          harness.storage.setThrowMode(false);
        }

        // Step 2: Application Export / Import
        assert.strictEqual(typeof harness.window.exportProgressJSON, 'function',
          'exportProgressJSON function must exist on window');
        assert.strictEqual(typeof harness.window.importProgressJSON, 'function',
          'importProgressJSON function must exist on window');

        harness.window.appState.score = 350;
        harness.window.appState.streak = 14;

        const jsonDump = harness.window.exportProgressJSON();
        assert.ok(typeof jsonDump === 'string' && jsonDump.length > 20,
          'exportProgressJSON must produce a valid non-empty JSON string');
        const parsed = JSON.parse(jsonDump);
        assert.strictEqual(parsed.score, 350, 'Exported JSON must contain score 350');
        assert.strictEqual(parsed.streak, 14, 'Exported JSON must contain streak 14');

        // Wipe state
        assert.strictEqual(typeof harness.window.resetAllProgress, 'function',
          'resetAllProgress function must exist on window');
        harness.window.resetAllProgress();
        assert.strictEqual(harness.window.appState.score, 0, 'Score must reset to 0');
        assert.strictEqual(harness.window.appState.streak, 0, 'Streak must reset to 0');

        // Restore state
        harness.window.importProgressJSON(jsonDump);
        assert.strictEqual(harness.window.appState.score, 350, 'Import must restore score to 350');
        assert.strictEqual(harness.window.appState.streak, 14, 'Import must restore streak to 14');
      }
    },
    {
      id: 'T4.10',
      name: 'Scenario 10: Complete Dark Mode & Keyboard Accessibility Session',
      fn: (harness) => {
        // Step 1: Theme Toggle
        assert.strictEqual(typeof harness.window.toggleTheme, 'function', 'toggleTheme function must exist on window');
        const initialDark = harness.document.body.classList.contains('dark');
        harness.window.toggleTheme();
        assert.strictEqual(harness.document.body.classList.contains('dark'), !initialDark,
          'toggleTheme must toggle dark class on body');
        assert.strictEqual(harness.storage.getItem('goethe_a1_theme'), !initialDark ? 'dark' : 'light',
          'Theme state must be persisted to storage under goethe_a1_theme');
        harness.window.toggleTheme();
        assert.strictEqual(harness.document.body.classList.contains('dark'), initialDark,
          'Second toggleTheme must revert body class');

        // Step 2: Keyboard shortcuts dispatch via real KeyboardEvent
        harness.window.switchViewMode('quiz');
        const initialScore = harness.window.appState.score || 0;
        harness.dispatchKeydown('1');
        assert.ok(harness.window.appState.score > initialScore || harness.document.getElementById('quizFeedbackBox').innerHTML.length > 0,
          'Keydown 1 must trigger option selection in quiz view');

        // Step 3: Accessible aria-live status region
        const liveRegion = harness.document.getElementById('ariaLiveRegion') ||
                           harness.document.querySelector('[aria-live]');
        assert.ok(liveRegion, 'aria-live status region must exist in DOM for accessibility');
        assert.ok(liveRegion.getAttribute('aria-live') === 'polite' || liveRegion.getAttribute('aria-live') === 'assertive',
          'aria-live region must have polite or assertive attribute');
      }
    }
  ];

  for (const sc of scenarios) {
    if (grepFilter && !grepFilter.test(sc.id) && !grepFilter.test(sc.name)) {
      continue;
    }
    const harness = createHarness();
    try {
      sc.fn(harness);
      console.log(`  ✓ [PASS] ${sc.id}: ${sc.name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${sc.id}: ${sc.name}\n    Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`TIER 4 TEST EXECUTION SUMMARY:`);
  console.log(`  Total:   ${passed + failed}`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log('====================================================\n');

  // Enforce strict exit code 1 whenever any scenario fails
  if (failed > 0) {
    process.exit(1);
  }

  return { passed, failed, total: scenarios.length };
}

if (require.main === module) {
  runTier4Tests().catch(e => { console.error(e); process.exit(1); });
}

module.exports = { runTier4Tests };
