const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('===============================================================');
console.log('    GOETHE A1 CHECKPOINT & RESUME PROGRESSION SUITE            ');
console.log('===============================================================');

const indexPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const scriptMatch = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('FATAL: Could not locate single <script> tag.');
  process.exit(1);
}

// Storage simulator
const storage = {};
const mockWindow = {
  setTimeout: (fn, ms) => {},
  clearTimeout: (id) => {},
  setInterval: (fn, ms) => {},
  clearInterval: (id) => {},
  localStorage: {
    getItem: k => (k in storage ? storage[k] : null),
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: k => { delete storage[k]; }
  },
  location: { hash: '#/grammar' },
  matchMedia: () => ({ matches: false }),
  speechSynthesis: { speak: () => {}, cancel: () => {} },
  addEventListener: () => {},
  document: {
    getElementById: (id) => ({
      id,
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      setAttribute: () => {},
      removeAttribute: () => {},
      style: {},
      innerHTML: '',
      innerText: '',
      textContent: '',
      value: '',
      addEventListener: () => {},
      appendChild: () => {},
      children: [],
      querySelectorAll: () => []
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: (tag) => ({
      tagName: tag,
      id: '',
      className: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      style: {},
      innerHTML: '',
      innerText: ''
    })
  }
};
mockWindow.window = mockWindow;
mockWindow.document.defaultView = mockWindow;

const context = vm.createContext(mockWindow);
vm.runInContext(scriptMatch[1], context);

console.log('--- Domain 1: Grammar Lab Per-Topic Checkpoint & Resume ---');

// 1.1 Test Praesens checkpoint progression
context.setGrammarTopic('praesens');
context.nextGrammarQuestion();
assert.strictEqual(context.gramIndex, 1, 'Grammar index must advance to 1');
context.nextGrammarQuestion();
assert.strictEqual(context.gramIndex, 2, 'Grammar index must advance to 2');
assert.strictEqual(context.appState.checkpoints.grammar.praesens, 2, 'Praesens checkpoint must be 2');
console.log(' [PASS] 1.1 Praesens checkpoint advances and saves to appState.checkpoints');

// 1.2 Test Topic Switch to Akkusativ maintains independent checkpoint
context.setGrammarTopic('akkusativ');
assert.strictEqual(context.gramIndex, 0, 'Akkusativ starts at 0 initially');
context.nextGrammarQuestion();
context.nextGrammarQuestion();
context.nextGrammarQuestion();
assert.strictEqual(context.gramIndex, 3, 'Akkusativ advances to 3');
assert.strictEqual(context.appState.checkpoints.grammar.akkusativ, 3, 'Akkusativ checkpoint must be 3');
assert.strictEqual(context.appState.checkpoints.grammar.praesens, 2, 'Praesens checkpoint remains 2');
console.log(' [PASS] 1.2 Switching to Akkusativ updates independent checkpoint (3) while preserving Praesens (2)');

// 1.3 Test Switch back to Praesens restores checkpoint 2
context.setGrammarTopic('praesens');
assert.strictEqual(context.gramIndex, 2, 'Switching back to Praesens must resume at question index 2 (Question 3)');
console.log(' [PASS] 1.3 Switching back to Praesens resumes at checkpoint index 2');

// 1.4 Test Reset Current Grammar Checkpoint
context.resetCurrentGrammarCheckpoint();
assert.strictEqual(context.gramIndex, 0, 'Praesens index reset to 0');
assert.strictEqual(context.appState.checkpoints.grammar.praesens, 0, 'Praesens checkpoint saved as 0');
assert.strictEqual(context.appState.checkpoints.grammar.akkusativ, 3, 'Akkusativ checkpoint unchanged after Praesens reset');
console.log(' [PASS] 1.4 Resetting Praesens resets to Question 1 without resetting Akkusativ');

console.log('--- Domain 2: Master Quiz Checkpoint & Resume ---');

// 2.1 Quiz advancement
context.quizIndex = 0;
context.nextQuestion();
context.nextQuestion();
context.nextQuestion();
assert.strictEqual(context.quizIndex, 3, 'Quiz index must be 3');
assert.strictEqual(context.getCheckpoint('quiz'), 3, 'Quiz checkpoint must be 3');
console.log(' [PASS] 2.1 Quiz advances to Question 4 (index 3) and saves checkpoint');

// 2.2 Quiz reset
context.resetQuizCheckpoint();
assert.strictEqual(context.quizIndex, 0, 'Quiz index must reset to 0');
assert.strictEqual(context.getCheckpoint('quiz'), 0, 'Quiz checkpoint must reset to 0');
console.log(' [PASS] 2.2 resetQuizCheckpoint() resets quiz to Question 1 (index 0)');

console.log('--- Domain 3: Noun Gender Drill Checkpoint & Resume ---');

// 3.1 Article advancement
context.appState.articleCurrentIndex = 0;
context.nextArticle();
context.nextArticle();
assert.strictEqual(context.appState.articleCurrentIndex, 2, 'Article index must advance to 2');
assert.strictEqual(context.getCheckpoint('article'), 2, 'Article checkpoint must be 2');
console.log(' [PASS] 3.1 Noun Gender Drill advances to Noun 3 (index 2) and saves checkpoint');

// 3.2 Article reset
context.resetArticleCheckpoint();
assert.strictEqual(context.appState.articleCurrentIndex, 0, 'Article index resets to 0');
assert.strictEqual(context.getCheckpoint('article'), 0, 'Article checkpoint resets to 0');
console.log(' [PASS] 3.2 resetArticleCheckpoint() resets drill to Noun 1 (index 0)');

console.log('--- Domain 4: Flashcards Studio Checkpoint & Resume ---');

// 4.1 Flashcard advancement
context.appState.flashcardCurrentIndex = 0;
context.nextFlashcardStudio();
context.nextFlashcardStudio();
context.nextFlashcardStudio();
context.nextFlashcardStudio();
assert.strictEqual(context.appState.flashcardCurrentIndex, 4, 'Flashcard index must advance to 4');
assert.strictEqual(context.getCheckpoint('flashcard'), 4, 'Flashcard checkpoint must be 4');
console.log(' [PASS] 4.1 Flashcard Studio advances to Card 5 (index 4) and saves checkpoint');

// 4.2 Flashcard reset
context.resetFlashcardCheckpoint();
assert.strictEqual(context.appState.flashcardCurrentIndex, 0, 'Flashcard index resets to 0');
assert.strictEqual(context.getCheckpoint('flashcard'), 0, 'Flashcard checkpoint resets to 0');
console.log(' [PASS] 4.2 resetFlashcardCheckpoint() resets deck to Card 1');

console.log('--- Domain 5: Sentence Builder Puzzles Checkpoint & Resume ---');

// 5.1 Puzzle advancement
context.puzzleIndex = 0;
context.nextPuzzle();
assert.strictEqual(context.puzzleIndex, 1, 'Puzzle index must be 1');
assert.strictEqual(context.getCheckpoint('puzzle'), 1, 'Puzzle checkpoint must be 1');
console.log(' [PASS] 5.1 Sentence Builder advances to Exercise 2 (index 1) and saves checkpoint');

// 5.2 Puzzle reset
context.resetPuzzleCheckpoint();
assert.strictEqual(context.puzzleIndex, 0, 'Puzzle index resets to 0');
assert.strictEqual(context.getCheckpoint('puzzle'), 0, 'Puzzle checkpoint resets to 0');
console.log(' [PASS] 5.2 resetPuzzleCheckpoint() resets to Exercise 1');

console.log('--- Domain 6: A1 Exam Simulator Checkpoint & Resume ---');

// 6.1 Sim advancement
context.simIdx = 0;
context.nextSimulatorScenario();
context.nextSimulatorScenario();
assert.strictEqual(context.simIdx, 2, 'Sim index must be 2');
assert.strictEqual(context.getCheckpoint('sim'), 2, 'Sim checkpoint must be 2');
console.log(' [PASS] 6.1 Exam Simulator advances to Scenario 3 (index 2) and saves checkpoint');

// 6.2 Sim reset
context.resetSimCheckpoint();
assert.strictEqual(context.simIdx, 0, 'Sim index resets to 0');
assert.strictEqual(context.getCheckpoint('sim'), 0, 'Sim checkpoint resets to 0');
console.log(' [PASS] 6.2 resetSimCheckpoint() resets to Scenario 1');

console.log('--- Domain 7: Topic Vocab & General Vocab Checkpoint & Resume ---');

// 7.1 Topic vocab section 1 vs section 2
context.vocabStudyMode = 'topic';
context.appState.activeSection = 'sec_001';
context.topicVocabIndex = 5;
context.saveCheckpoint('sectionVocab', 'sec_001', 5);

context.appState.activeSection = 'sec_002';
context.topicVocabIndex = 8;
context.saveCheckpoint('sectionVocab', 'sec_002', 8);

assert.strictEqual(context.getCheckpoint('sectionVocab', 'sec_001'), 5, 'Sec 1 vocab checkpoint must be 5');
assert.strictEqual(context.getCheckpoint('sectionVocab', 'sec_002'), 8, 'Sec 2 vocab checkpoint must be 8');
console.log(' [PASS] 7.1 Module Thematic Vocab tracks separate checkpoints for sec_001 (5) and sec_002 (8)');

// 7.2 General vocab 120 words deck
context.switchVocabStudyMode('general');
context.topicVocabIndex = 14;
context.saveCheckpoint('generalVocab', 14);
assert.strictEqual(context.getCheckpoint('generalVocab'), 14, 'General vocab checkpoint must be 14');
console.log(' [PASS] 7.2 General Vocab (120 words) tracks independent checkpoint (14)');

// 7.3 Reset topic vocab
context.resetTopicVocabCheckpoint();
assert.strictEqual(context.getCheckpoint('generalVocab'), 0, 'General vocab reset to 0');
assert.strictEqual(context.getCheckpoint('sectionVocab', 'sec_001'), 5, 'Sec 1 vocab checkpoint unaffected by general vocab reset');
console.log(' [PASS] 7.3 resetTopicVocabCheckpoint() resets current active mode without corrupting other decks');

console.log('--- Domain 8: Error Hunter & Dictation Checkpoint & Resume ---');

// 8.1 Error Hunter
context.errHunterIndex = 0;
context.nextErrorHunter();
assert.strictEqual(context.errHunterIndex, 1, 'Error hunter advances to 1');
assert.strictEqual(context.getCheckpoint('errorHunter'), 1, 'Error hunter checkpoint is 1');
context.resetErrorHunterCheckpoint();
assert.strictEqual(context.errHunterIndex, 0, 'Error hunter reset to 0');
console.log(' [PASS] 8.1 Error Hunter advances to Exercise 2 and resets to Exercise 1');

// 8.2 Dictation Sprint
context.dictIdx = 0;
context.nextDictation();
context.nextDictation();
assert.strictEqual(context.dictIdx, 2, 'Dictation advances to 2');
assert.strictEqual(context.getCheckpoint('dictation'), 2, 'Dictation checkpoint is 2');
context.resetDictationCheckpoint();
assert.strictEqual(context.dictIdx, 0, 'Dictation reset to 0');
console.log(' [PASS] 8.2 Dictation Sprint advances to Sentence 3 and resets to Sentence 1');

console.log('--- Domain 9: Cross-Session Persistence Under LocalStorage Serialization ---');

// Set realistic checkpoints across all modules
context.saveCheckpoint('grammar', 'praesens', 10);
context.saveCheckpoint('grammar', 'dativ', 4);
context.saveCheckpoint('quiz', 25);
context.saveCheckpoint('article', 12);
context.saveCheckpoint('flashcard', 42);
context.saveCheckpoint('puzzle', 7);
context.saveCheckpoint('sim', 3);
context.saveCheckpoint('sectionVocab', 'sec_003', 11);
context.saveCheckpoint('generalVocab', 30);
context.saveCheckpoint('dictation', 8);
context.saveState();

// Verify raw JSON storage
const rawStorage = storage['goethe_checkpoints'];
assert.ok(rawStorage, 'goethe_checkpoints must be persisted in storage');
const parsed = JSON.parse(rawStorage);
assert.strictEqual(parsed.grammar.praesens, 10, 'Persisted Praesens must be 10');
assert.strictEqual(parsed.grammar.dativ, 4, 'Persisted Dativ must be 4');
assert.strictEqual(parsed.quiz, 25, 'Persisted Quiz must be 25');
assert.strictEqual(parsed.article, 12, 'Persisted Article must be 12');
assert.strictEqual(parsed.flashcard, 42, 'Persisted Flashcard must be 42');
assert.strictEqual(parsed.puzzle, 7, 'Persisted Puzzle must be 7');
assert.strictEqual(parsed.sim, 3, 'Persisted Sim must be 3');
assert.strictEqual(parsed.sectionVocab.sec_003, 11, 'Persisted Sec 3 Vocab must be 11');
assert.strictEqual(parsed.generalVocab, 30, 'Persisted General Vocab must be 30');
assert.strictEqual(parsed.dictation, 8, 'Persisted Dictation must be 8');
console.log(' [PASS] 9.1 All checkpoints cleanly serialized and persisted to storage engine');

console.log('===============================================================');
console.log(' SUMMARY: All 9 Checkpoint & Resume domains PASSED with 0 errors!');
console.log('===============================================================');
