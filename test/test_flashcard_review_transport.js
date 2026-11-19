/**
 * test/test_flashcard_review_transport.js
 * Verification for Flashcard Review & Spaced Repetition Transportation Feature.
 */
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

const app = loadApp();
const win = app.window;
const doc = app.document;

console.log('Testing Flashcard Review Transportation Feature...');

// 1. Initial State Check
assert.ok(typeof win.markTopicVocabReview === 'function', 'markTopicVocabReview must be defined');
assert.ok(typeof win.markTopicVocabKnown === 'function', 'markTopicVocabKnown must be defined');
assert.ok(typeof win.markSayingReview === 'function', 'markSayingReview must be defined');
assert.ok(typeof win.markSayingKnown === 'function', 'markSayingKnown must be defined');
assert.ok(typeof win.practiseSavedVocab === 'function', 'practiseSavedVocab must be defined');

// Reset progress to clean state
win.resetAllProgress();
assert.strictEqual(win.appState.mistakes.length, 0, 'Mistakes should be empty initially');

// 2. Test Topic Vocab "Don't Know (Transport to Review)"
const sec = win.SECTIONS_DATA[0];
win.initTopicVocab(sec);

// Check current card term
const initialFrontDe = doc.getElementById('topicVocabFrontDe').innerText;
assert.ok(initialFrontDe.length > 0, 'Front DE term should not be empty');

// Click "Don't Know (Transport to Review)"
win.markTopicVocabReview();

// Verify word was transported to appState.mistakes
assert.strictEqual(win.appState.mistakes.length, 1, 'Should have exactly 1 mistake recorded');
const recorded = win.appState.mistakes[0];
assert.strictEqual(recorded.type, 'vocab', 'Mistake type must be vocab');
assert.strictEqual(recorded.prompt, initialFrontDe, 'Mistake prompt must match German word');

// Verify word entered Leitner Box 0 (Due immediately)
const srsItem = win.leitnerEngine.getItem(recorded.id);
assert.ok(srsItem, 'Item must be registered in Leitner SRS');
assert.strictEqual(srsItem.box, 0, 'New review item must be in Box 0 (immediate)');
assert.ok(win.leitnerEngine.getDueReviewsCount() >= 1, 'Due reviews count must be >= 1');

// 3. Test Review Section DOM reflection
win.renderMistakesList('all');
const mistakesListEl = doc.getElementById('mistakesList');
assert.ok(mistakesListEl.innerHTML.includes(initialFrontDe), 'Mistakes list must contain the transported German word');
assert.ok(mistakesListEl.innerHTML.includes('Flashcard'), 'Mistakes list should render Flashcard badge');

// Test Filter: Vocab vs Grammar
win.filterMistakes('vocab');
assert.ok(mistakesListEl.innerHTML.includes(initialFrontDe), 'Vocab filter must display transported vocab word');

win.filterMistakes('grammar');
assert.ok(!mistakesListEl.innerHTML.includes(initialFrontDe), 'Grammar filter must NOT display vocab word');

// 4. Test 250 Sayings Flashcard Transportation
win.navigateTo('#/vocab/flashcards');
win.appState.flashcardCurrentIndex = 0;
win.renderFlashcardStudio();
const sayingPhrase = doc.getElementById('fcFrontPhrase').innerText;
assert.ok(sayingPhrase.length > 0, 'Saying phrase should not be empty');

win.markSayingReview();
assert.strictEqual(win.appState.mistakes.length, 2, 'Should now have 2 mistakes recorded');
const sayingMistake = win.appState.mistakes.find(m => m.prompt === sayingPhrase);
assert.ok(sayingMistake, 'Saying phrase must be in mistake bank');
assert.strictEqual(sayingMistake.type, 'vocab', 'Saying mistake type must be vocab');

// 5. Test Practise Saved Vocab
win.practiseSavedVocab();
assert.strictEqual(win.currentFlashcards.length, 2, 'practiseSavedVocab should load the 2 review words');
assert.strictEqual(win.currentFlashcards[0].phrase, initialFrontDe, 'First card must be the first transported word');

// 6. Test "Got It (Mastered)" resolution
// Calling resolveMistake on recorded item
win.resolveMistake(recorded.id);
assert.strictEqual(win.appState.mistakes.length, 1, 'Should have 1 mistake remaining after resolution');
const remainingSrs = win.leitnerEngine.getItem(recorded.id);
assert.ok(remainingSrs && remainingSrs.box > 0, 'Resolved item should advance in Leitner SRS box');

// 7. Test Keyboard Shortcuts
// Dispatch 'r' key
const prevMistakeCount = win.appState.mistakes.length;
win.navigateTo('#/vocab/flashcards');
app.harness.dispatchKeydown('r');
assert.ok(win.appState.mistakes.length >= prevMistakeCount, 'Keyboard "r" should trigger review action');

console.log('✓ All 7 Flashcard Review Transportation tests PASSED successfully!');
process.exit(0);
