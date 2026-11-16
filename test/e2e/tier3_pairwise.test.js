/**
 * test/e2e/tier3_pairwise.test.js
 * Tier 3: Cross-Feature Pairwise Combinations (20 tests)
 * Validates authentic cross-feature interactions across Goethe A1 German Studio.
 * Zero external dependencies: uses Node.js core modules (assert, fs, path, vm) via harness.js.
 */
const assert = require('assert');
const { createHarness } = require('./harness');

async function runTier3Tests() {
  console.log('====================================================');
  console.log('STARTING TIER 3 PAIRWISE CROSS-FEATURE SUITE (20 TESTS)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const grepArg = process.argv.find(a => a.startsWith('--grep='));
  const grepFilter = grepArg ? new RegExp(grepArg.slice('--grep='.length), 'i') : null;

  const testCases = [
    {
      id: 'T3.01',
      name: 'F14 (Mock Exam) + F15 (SRS): Mock Exam Failure Schedules into Leitner Box 0',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.recordMockExamMistake,
          'function',
          'window.recordMockExamMistake must be implemented by the application'
        );
        const missedQuestion = {
          id: 'quiz_001',
          type: 'exam',
          domain: 'praesens',
          userChoice: 0,
          answer: 1
        };
        window.recordMockExamMistake(missedQuestion);
        assert.ok(Array.isArray(window.appState && window.appState.srs), 'window.appState.srs must be an array');
        const srsItem = window.appState.srs.find(x => x.id === 'quiz_001');
        assert.ok(srsItem, 'Missed exam question must exist in SRS queue');
        assert.strictEqual(srsItem.box, 0, 'Missed question must be placed in Leitner Box 0');
        assert.strictEqual(srsItem.interval, 0, 'Initial review interval must be 0 days');
      }
    },
    {
      id: 'T3.02',
      name: 'F7 (Grammar Slot) + F16 (Mistake Bank): Grammar Error Logging and Retry Resolution',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.logMistake,
          'function',
          'window.logMistake must be implemented by the application'
        );
        assert.strictEqual(
          typeof window.resolveMistake,
          'function',
          'window.resolveMistake must be implemented by the application'
        );
        const mistake = {
          id: 'gram_dativ_01',
          type: 'grammar',
          topic: 'dativ',
          prompt: 'Ich helfe {0} Mann',
          wrong: 'den',
          correct: 'dem'
        };
        window.logMistake(mistake);
        assert.ok(Array.isArray(window.appState && window.appState.mistakes), 'window.appState.mistakes must be an array');
        assert.ok(window.appState.mistakes.some(m => m.id === 'gram_dativ_01'), 'Mistake must be recorded in Mistake Bank');

        window.resolveMistake('gram_dativ_01');
        assert.strictEqual(
          window.appState.mistakes.filter(m => m.id === 'gram_dativ_01').length,
          0,
          'Mistake must be resolved and cleared on correct retry'
        );
      }
    },
    {
      id: 'T3.03',
      name: 'F2 (Theme Tokens) + F4 (Storage Fallback): Theme Toggle Survives Storage Quota / SecurityError',
      fn: (harness) => {
        const { window, document, storage } = harness;
        assert.strictEqual(typeof window.toggleTheme, 'function', 'window.toggleTheme must be defined');
        assert.strictEqual(typeof window.safeGetStorage, 'function', 'window.safeGetStorage must be defined');
        assert.strictEqual(typeof window.safeSetStorage, 'function', 'window.safeSetStorage must be defined');

        storage.setThrowMode(true);
        try {
          window.toggleTheme();
          const isDark = document.body.classList.contains('dark') || (window.appState && window.appState.theme === 'dark');
          assert.ok(isDark, 'Dark theme class or state must be active after toggle under restricted storage');
          const stored = window.safeGetStorage('goethe_a1_theme', 'light');
          assert.strictEqual(stored, 'dark', 'Safe storage in-memory fallback must retain active theme');

          window.toggleTheme();
          const isLight = !document.body.classList.contains('dark') || (window.appState && window.appState.theme === 'light');
          assert.ok(isLight, 'Light theme must be restored on subsequent toggle');
        } finally {
          storage.setThrowMode(false);
        }
      }
    },
    {
      id: 'T3.04',
      name: 'F9 (Hash Routing) + F10 (Today Card): Studio Navigation Preserves Score and Streak',
      fn: (harness) => {
        const { window, document } = harness;
        assert.ok(window.appState, 'window.appState must be defined');
        window.appState.score = 70;
        window.appState.streak = 7;

        const scoreEl = document.getElementById('headerScore');
        const streakEl = document.getElementById('headerStreak');
        assert.ok(scoreEl, 'headerScore DOM node must exist in HTML shell');
        assert.ok(streakEl, 'headerStreak DOM node must exist in HTML shell');

        const studioRoutes = ['#/vocab', '#/exam', '#/review', '#/grammar'];
        studioRoutes.forEach(route => {
          if (typeof window.navigateTo === 'function') {
            window.navigateTo(route);
          } else {
            window.location.hash = route;
            window.dispatchEvent({ type: 'hashchange', oldURL: 'http://localhost/', newURL: 'http://localhost/' + route });
          }
          assert.strictEqual(window.appState.score, 70, `Score must remain 70 after navigating to ${route}`);
          assert.strictEqual(window.appState.streak, 7, `Streak must remain 7 after navigating to ${route}`);
        });
      }
    },
    {
      id: 'T3.05',
      name: 'F13 (Umlaut Dock) + F14 (Schreiben Textarea): Character Injection at Cursor',
      fn: (harness) => {
        const { window, document } = harness;
        const textarea = document.getElementById('schreibenTextarea');
        assert.ok(textarea, 'Schreiben textarea #schreibenTextarea must exist in DOM');

        textarea.value = 'Ich mochte';
        textarea.selectionStart = 5;
        textarea.selectionEnd = 6;

        if (typeof window.insertUmlaut === 'function') {
          window.insertUmlaut('ö', 'schreibenTextarea');
        } else {
          const btnOe = document.querySelector('[data-umlaut="ö"]') || document.getElementById('btnUmlautOe');
          assert.ok(btnOe, 'Umlaut injection helper or button for "ö" must exist in DOM');
          btnOe.click();
        }

        assert.strictEqual(textarea.value, 'Ich möchte', 'Umlaut "ö" must be injected at cursor into textarea');
      }
    },
    {
      id: 'T3.06',
      name: 'F7 (V2 Validation) + F11 (Preposition Matrix): Two-Way Preposition Case Distinction',
      fn: (harness) => {
        const { globals } = harness;
        const topics = globals.GRAMMAR_TOPICS || [];
        assert.ok(Array.isArray(topics) && topics.length > 0, 'GRAMMAR_TOPICS must be loaded');

        const wechselTopic = topics.find(t => t.id === 'wechsel');
        assert.ok(wechselTopic, 'Topic "wechsel" must exist in GRAMMAR_TOPICS');

        const summaryText = wechselTopic.summary || '';
        const canonicalTwoWay = ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'];
        canonicalTwoWay.forEach(prep => {
          assert.ok(
            summaryText.toLowerCase().includes(prep),
            `Wechsel summary must include canonical preposition "${prep}"`
          );
        });

        // Verify stationary vs motion contrast from real grammar question data
        const questions = wechselTopic.questions || [];
        assert.ok(questions.length >= 2, 'Wechsel topic must contain questions testing case selection');

        const staticQuestion = questions.find(q => q.q.includes('liegt') || q.q.includes('steht'));
        const motionQuestion = questions.find(q => q.q.includes('legen') || q.q.includes('stellen'));

        assert.ok(staticQuestion, 'Grammar dataset must contain stationary position (Wo? / liegen) question');
        assert.ok(motionQuestion, 'Grammar dataset must contain directional motion (Wohin? / legen) question');

        const staticAnswer = staticQuestion.options[staticQuestion.answer];
        const motionAnswer = motionQuestion.options[motionQuestion.answer];

        assert.strictEqual(staticAnswer, 'dem', 'Stationary position ("liegen auf ___ Tisch") requires Dative (dem)');
        assert.strictEqual(motionAnswer, 'den', 'Directional action ("legen auf ___ Schreibtisch") requires Accusative (den)');
      }
    },
    {
      id: 'T3.07',
      name: 'F8 (Noun Drill) + F15 (SRS): Noun Gender Error Queued in Leitner Box 0',
      fn: (harness) => {
        const { window, globals } = harness;
        const nouns = globals.ARTICLES_DATA || [];
        assert.ok(Array.isArray(nouns) && nouns.length > 0, 'ARTICLES_DATA must be populated');

        const testNoun = nouns[0];
        const wrongGender = testNoun.gender === 'der' ? 'das' : 'der';

        if (typeof window.checkArticle === 'function') {
          window.checkArticle(wrongGender);
        } else if (window.leitnerEngine && typeof window.leitnerEngine.recordFailure === 'function') {
          window.leitnerEngine.recordFailure(testNoun.id || testNoun.noun, 'noun');
        }

        assert.ok(Array.isArray(window.appState && window.appState.srs), 'window.appState.srs must be an array');
        const targetId = testNoun.id || testNoun.noun;
        const queued = window.appState.srs.find(x => x.id === targetId || (x.metadata && x.metadata.noun === testNoun.noun));
        assert.ok(queued, `Noun error for "${testNoun.noun}" must be scheduled into SRS queue`);
        assert.strictEqual(queued.box, 0, 'Failed noun drill item must start in Leitner Box 0');
      }
    },
    {
      id: 'T3.08',
      name: 'F6 (Option Balancing) + F17 (Keyboard Navigation): Keys 1-4 Trigger Option Selection',
      fn: (harness) => {
        const { window, document } = harness;
        assert.strictEqual(typeof window.switchViewMode, 'function', 'switchViewMode must be defined');
        window.switchViewMode('quiz');

        const canvasQuiz = document.getElementById('canvasQuiz');
        assert.ok(canvasQuiz, 'canvasQuiz element must exist in DOM');
        canvasQuiz.classList.remove('hidden');

        const optBtn1 = document.getElementById('studio_opt_1');
        assert.ok(optBtn1, 'Option button #studio_opt_1 must exist in DOM');

        const initialAnswered = harness.get('quizAnswered');
        assert.strictEqual(initialAnswered, false, 'Quiz question must be unanswered initially');

        // Dispatch real keydown event on window (key '2' selects option index 1)
        window.dispatchEvent({ type: 'keydown', key: '2' });

        const afterAnswered = harness.get('quizAnswered');
        assert.strictEqual(afterAnswered, true, 'Real keydown event on window must trigger option selection');
        const stats = harness.get('stats');
        assert.strictEqual(stats.answered, 1, 'Quiz stats.answered must increment to 1');

        // Verify DOM button updated with feedback styling
        assert.ok(
          optBtn1.className.includes('border-[#') || optBtn1.className.includes('opacity-'),
          'Option button #studio_opt_1 must receive feedback classes from selectQuizOption'
        );

        // Verify feedback container unhidden
        const fBox = document.getElementById('quizFeedbackBox');
        assert.ok(fBox && !fBox.classList.contains('hidden'), 'quizFeedbackBox must be unhidden after answering');
      }
    },
    {
      id: 'T3.09',
      name: 'F13 (JSON Export/Import) + F15/F16 (SRS & Mistakes): Full Serialization Cycle',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.exportProgress,
          'function',
          'window.exportProgress must be implemented by the application'
        );
        assert.strictEqual(
          typeof window.importProgress,
          'function',
          'window.importProgress must be implemented by the application'
        );

        if (!window.appState) window.appState = {};
        window.appState.score = 150;
        window.appState.streak = 5;
        window.appState.srs = [{ id: 'gram_modal_01', box: 1, interval: 1 }];
        window.appState.mistakes = [{ id: 'quiz_012', type: 'exam' }];

        const exportedData = window.exportProgress();
        assert.strictEqual(typeof exportedData, 'string', 'exportProgress must produce a serialized JSON string');
        assert.ok(exportedData.length > 20, 'Exported string must contain substantive payload');

        const parsed = JSON.parse(exportedData);
        assert.ok(parsed.version, 'Exported state must be versioned');
        assert.strictEqual(parsed.score, 150, 'Exported score must match active appState');

        // Reset state and restore from serialization
        window.appState.score = 0;
        window.appState.streak = 0;
        window.appState.srs = [];
        window.appState.mistakes = [];

        window.importProgress(exportedData);
        assert.strictEqual(window.appState.score, 150, 'Restored score must match original exported value');
        assert.strictEqual(window.appState.streak, 5, 'Restored streak must match original exported value');
        assert.strictEqual(window.appState.srs.length, 1, 'Restored SRS queue count must match');
        assert.strictEqual(window.appState.mistakes.length, 1, 'Restored mistakes count must match');
      }
    },
    {
      id: 'T3.10',
      name: 'F4 (Safe Storage / TTS) + F12 (Sayings): Speech Rate Propagated to Flashcard Audio',
      fn: (harness) => {
        const { window, speech } = harness;
        assert.strictEqual(typeof window.speakGerman, 'function', 'window.speakGerman must be defined');
        assert.ok(speech, 'Speech synthesis mock must be present');

        if (!window.appState) window.appState = {};
        window.appState.ttsRate = 1.2;

        if (typeof window.speakCurrentFlashcardPhrase === 'function') {
          window.speakCurrentFlashcardPhrase();
        } else {
          window.speakGerman('Guten Morgen!');
        }

        const utt = speech.lastSpoken ? speech.lastSpoken() : speech.spokenUtterances[speech.spokenUtterances.length - 1];
        assert.ok(utt, 'Speech utterance must be dispatched via window.speechSynthesis');
        assert.strictEqual(utt.rate, 1.2, 'Utterance speech rate must match window.appState.ttsRate');
        assert.strictEqual(utt.lang, 'de-DE', 'Utterance language must be German (de-DE)');
      }
    },
    {
      id: 'T3.11',
      name: 'F9 (Sub-Routing) + F11 (Preposition Matrix): Deep Linking Activates Specific Tab',
      fn: (harness) => {
        const { window, document } = harness;
        assert.strictEqual(
          typeof window.handleRoute === 'function' || typeof window.navigateTo === 'function',
          true,
          'Router navigation mechanism (handleRoute or navigateTo) must be defined'
        );

        const targetRoute = '#/grammar/prepositions';
        if (typeof window.navigateTo === 'function') {
          window.navigateTo(targetRoute);
        } else {
          window.location.hash = targetRoute;
          window.handleRoute();
        }

        const studioGrammar = document.getElementById('studioGrammar');
        assert.ok(studioGrammar, 'Studio 1 container #studioGrammar must exist');
        assert.strictEqual(
          studioGrammar.classList.contains('hidden'),
          false,
          'Studio Grammar must be visible after routing to #/grammar/prepositions'
        );
      }
    },
    {
      id: 'T3.12',
      name: 'F10 (Today Goals) + F14 (Mock Exam): 60% Passing Mark Sets Exam Status Bestanden',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.evaluateExamScore === 'function' || typeof window.calculateExamStatus === 'function',
          true,
          'Application must provide mock exam evaluation function (evaluateExamScore or calculateExamStatus)'
        );
        const evalFn = window.evaluateExamScore || window.calculateExamStatus;

        // 135 / 210 = 64.3% (>= 60% pass threshold)
        const passResult = evalFn(135, 210);
        assert.strictEqual(passResult.passed, true, 'Score >= 60% must evaluate to passed (BESTANDEN)');

        // 100 / 210 = 47.6% (< 60% fail threshold)
        const failResult = evalFn(100, 210);
        assert.strictEqual(failResult.passed, false, 'Score < 60% must evaluate to failed (NICHT BESTANDEN)');
      }
    },
    {
      id: 'T3.13',
      name: 'F8 (Noun Plural) + F16 (Mistake Bank): Plural Errors Categorized as Noun Subdomain',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.logMistake === 'function' || typeof window.recordMistake === 'function',
          true,
          'Application mistake logging function (logMistake or recordMistake) must be defined'
        );
        const logFn = window.logMistake || window.recordMistake;

        const pluralMistake = {
          id: 'noun_005',
          type: 'noun',
          subdomain: 'plural',
          target: 'die Bücher',
          userInput: 'die Buchen'
        };
        logFn(pluralMistake);

        assert.ok(Array.isArray(window.appState && window.appState.mistakes), 'window.appState.mistakes must be an array');
        const item = window.appState.mistakes.find(m => m.id === 'noun_005');
        assert.ok(item, 'Plural mistake must be saved into Mistake Bank');
        assert.strictEqual(item.subdomain, 'plural', 'Must be categorized under plural subdomain');
      }
    },
    {
      id: 'T3.14',
      name: 'F5 (ID Normalization) + F15 (SRS): Heterogeneous Item IDs Coexist without Collision',
      fn: (harness) => {
        const { globals } = harness;
        const quizItems = globals.QUIZ_DATA || [];
        const nounItems = globals.ARTICLES_DATA || [];
        const fcItems = globals.FLASHCARD_DATA || [];

        assert.ok(quizItems.length > 0, 'QUIZ_DATA must not be empty');
        assert.ok(nounItems.length > 0, 'ARTICLES_DATA must not be empty');
        assert.ok(fcItems.length > 0, 'FLASHCARD_DATA must not be empty');

        const allIds = [
          ...quizItems.map(q => q.id),
          ...nounItems.map(n => n.id),
          ...fcItems.map(f => f.id)
        ];

        // Ensure all items define valid string IDs
        allIds.forEach(id => {
          assert.strictEqual(typeof id, 'string', `Item ID "${id}" must be a normalized string`);
          assert.ok(
            id.startsWith('quiz_') || id.startsWith('noun_') || id.startsWith('fc_') || id.startsWith('gram_'),
            `Item ID "${id}" must follow canonical prefix convention`
          );
        });

        // Verify zero cross-dataset ID collisions
        const uniqueIds = new Set(allIds);
        assert.strictEqual(
          uniqueIds.size,
          allIds.length,
          `Expected zero ID collisions across datasets: found ${uniqueIds.size} unique IDs for ${allIds.length} items`
        );
      }
    },
    {
      id: 'T3.15',
      name: 'F7 (Slot Filling) + F17 (ARIA-Live): Feedback Updates Accessible Region',
      fn: (harness) => {
        const { document } = harness;
        const feedbackEl = document.getElementById('grammarFeedback') || document.querySelector('[role="status"]');
        assert.ok(feedbackEl, 'Accessible feedback region #grammarFeedback or [role="status"] must exist in DOM');

        const liveAttr = feedbackEl.getAttribute('aria-live');
        assert.ok(
          liveAttr === 'polite' || liveAttr === 'assertive',
          'Feedback element must possess aria-live="polite" or "assertive"'
        );
      }
    },
    {
      id: 'T3.16',
      name: 'F1 (Single Script) + F9 (Studio Lifecycle): Rapid Cycling Does Not Duplicate Containers',
      fn: (harness) => {
        const { document, htmlContent, window } = harness;
        const scriptMatches = htmlContent.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
        assert.strictEqual(scriptMatches.length, 1, 'Application must contain exactly one <script> block');

        const footerMatches = htmlContent.match(/<footer\b/gi) || [];
        assert.strictEqual(footerMatches.length, 1, 'Application must contain exactly one <footer> element');

        const studios = ['studioGrammar', 'studioVocab', 'studioExam', 'studioReview'];
        for (let i = 0; i < 5; i++) {
          studios.forEach(s => {
            if (typeof window.navigateTo === 'function') {
              window.navigateTo('#/' + s.replace('studio', '').toLowerCase());
            }
          });
        }

        studios.forEach(s => {
          const matches = document.querySelectorAll('#' + s);
          assert.strictEqual(matches.length, 1, `Studio #${s} container must exist exactly once in DOM`);
        });
      }
    },
    {
      id: 'T3.17',
      name: 'F10 (Today Card) + F15 (SRS Intervals): Time Advance Dynamically Increments Due Counter',
      fn: (harness) => {
        const { window } = harness;
        assert.strictEqual(
          typeof window.getDueReviewsCount === 'function' ||
            (window.leitnerEngine && typeof window.leitnerEngine.getDueItems === 'function'),
          true,
          'Application must provide SRS due counter function (getDueReviewsCount or leitnerEngine.getDueItems)'
        );

        const now = Date.now();
        if (!window.appState) window.appState = {};
        window.appState.srs = [
          { id: 'quiz_001', box: 0, nextReview: now - 1000 },
          { id: 'noun_001', box: 1, nextReview: now - 5000 },
          { id: 'gram_001', box: 2, nextReview: now + 86400000 }
        ];

        const dueCount = typeof window.getDueReviewsCount === 'function'
          ? window.getDueReviewsCount()
          : window.leitnerEngine.getDueItems().length;

        assert.strictEqual(dueCount, 2, 'Exactly 2 expired items must be calculated as due for review');
      }
    },
    {
      id: 'T3.18',
      name: 'F13 (Mistake Bank Filtering) + F17 (Accessibility): Filter Updates ARIA-Pressed State',
      fn: (harness) => {
        const { document } = harness;
        const btnGrammar = document.getElementById('filterBtnGrammar') || document.querySelector('[data-filter="grammar"]');
        assert.ok(btnGrammar, 'Mistake Bank filter button #filterBtnGrammar must exist in DOM');

        btnGrammar.click();
        assert.strictEqual(
          btnGrammar.getAttribute('aria-pressed'),
          'true',
          'Active filter button must have aria-pressed="true"'
        );
      }
    },
    {
      id: 'T3.19',
      name: 'F14 (Schreiben Word Counter) + F17 (Live Validation): Live Status Badges for 20-30 Words',
      fn: (harness) => {
        const { document, window } = harness;
        const textarea = document.getElementById('schreibenTextarea');
        const badge = document.getElementById('schreibenWordBadge') || document.getElementById('schreibenWordCount');

        assert.ok(textarea, 'Schreiben textarea #schreibenTextarea must exist in DOM');
        assert.ok(badge, 'Schreiben word count badge #schreibenWordBadge must exist in DOM');

        // Test under limit (<20 words)
        textarea.value = 'Ich heiße Anna und ich lerne Deutsch.';
        textarea.dispatchEvent('input');
        if (typeof window.updateSchreibenWordCount === 'function') {
          window.updateSchreibenWordCount(textarea.value);
        }
        assert.ok(
          badge.innerText.includes('7') || badge.classList.contains('text-amber') || badge.dataset.status === 'warning',
          'Badge must indicate warning status for word count < 20'
        );

        // Test optimal range (25 words)
        textarea.value = new Array(25).fill('Wort').join(' ');
        textarea.dispatchEvent('input');
        if (typeof window.updateSchreibenWordCount === 'function') {
          window.updateSchreibenWordCount(textarea.value);
        }
        assert.ok(
          badge.innerText.includes('25') || badge.classList.contains('text-emerald') || badge.dataset.status === 'optimal',
          'Badge must indicate optimal status for word count in 20-30 range'
        );
      }
    },
    {
      id: 'T3.20',
      name: 'F4 (Storage In-Memory) + F13 (Reset Progress): Clean Reset under Restricted Storage',
      fn: (harness) => {
        const { window, storage } = harness;
        assert.strictEqual(
          typeof window.resetAllProgress === 'function' || typeof window.resetProgress === 'function',
          true,
          'Application must provide progress reset function (resetAllProgress or resetProgress)'
        );
        const resetFn = window.resetAllProgress || window.resetProgress;

        if (!window.appState) window.appState = {};
        window.appState.score = 200;
        window.appState.streak = 10;
        window.appState.srs = [{ id: 'quiz_001' }];
        window.appState.mistakes = [{ id: 'noun_001' }];

        storage.setThrowMode(true);
        try {
          resetFn();
          assert.strictEqual(window.appState.score, 0, 'Score must reset to 0');
          assert.strictEqual(window.appState.streak, 0, 'Streak must reset to 0');
          assert.strictEqual(window.appState.srs.length, 0, 'SRS queue must be cleared to empty');
          assert.strictEqual(window.appState.mistakes.length, 0, 'Mistakes list must be cleared to empty');
        } finally {
          storage.setThrowMode(false);
        }
      }
    }
  ];

  for (const tc of testCases) {
    if (grepFilter && !grepFilter.test(tc.id) && !grepFilter.test(tc.name)) {
      continue;
    }
    const testHarness = createHarness();
    try {
      tc.fn(testHarness);
      console.log(`  ✓ [PASS] ${tc.id}: ${tc.name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${tc.id}: ${tc.name}\n    Error: ${err.message}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log('TIER 3 TEST EXECUTION SUMMARY:');
  console.log(`  Total:   ${passed + failed}`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log('====================================================\n');

  // Strict exit: fail with non-zero exit code if any test failed
  if (failed > 0) {
    process.exit(1);
  }

  return { passed, failed, total: testCases.length };
}

if (require.main === module) {
  runTier3Tests().catch(e => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { runTier3Tests };
