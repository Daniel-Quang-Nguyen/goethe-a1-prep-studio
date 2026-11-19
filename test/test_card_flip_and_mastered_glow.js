/**
 * test/test_card_flip_and_mastered_glow.js
 * Verification for Flashcard 3D Flip functionality and Mastered Green Glow-then-Fade animation.
 */
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

const app = loadApp();
const win = app.window;
const doc = app.document;

console.log('Testing Flashcard Flip & Mastered Glow-then-Fade Feature...');

// 1. Check Topic Vocab Flip Button & State
const sec = win.SECTIONS_DATA[0];
win.initTopicVocab(sec);

const topicCardInner = doc.getElementById('topicVocabCardInner');
assert.ok(topicCardInner, 'topicVocabCardInner must exist in DOM');
assert.ok(!topicCardInner.classList.contains('flipped'), 'Card must start un-flipped');
assert.ok(!topicCardInner.classList.contains('animate-glide-in'), 'animate-glide-in must NOT be on card-inner');

// Test Flip function
win.flipTopicVocabCard();
assert.ok(topicCardInner.classList.contains('flipped'), 'flipTopicVocabCard() must add flipped class');

// Test Flip back
win.flipTopicVocabCard();
assert.ok(!topicCardInner.classList.contains('flipped'), 'flipTopicVocabCard() must remove flipped class on second call');

// 2. Check Everyday Sayings Flashcard Flip
win.navigateTo('#/vocab/flashcards');
win.renderFlashcardStudio();

const studioCardInner = doc.getElementById('studioCardInner');
assert.ok(studioCardInner, 'studioCardInner must exist in DOM');
assert.ok(!studioCardInner.classList.contains('flipped'), 'studioCardInner must start un-flipped');
assert.ok(!studioCardInner.classList.contains('animate-glide-in'), 'animate-glide-in must NOT be on studioCardInner');

win.flipStudioCard();
assert.ok(studioCardInner.classList.contains('flipped'), 'flipStudioCard() must add flipped class');

win.flipStudioCard();
assert.ok(!studioCardInner.classList.contains('flipped'), 'flipStudioCard() must flip back');

// 3. Test Mastered Glow & Fade Trigger
const topicCardBox = doc.getElementById('topicVocabCardBox');
assert.ok(topicCardBox, 'topicVocabCardBox must exist in DOM');

// Reset progress & test markTopicVocabKnown glow
win.navigateTo('#/vocab');
win.initTopicVocab(sec);

const initialWord = doc.getElementById('topicVocabFrontDe').innerText;
win.markTopicVocabKnown();

// In standard environment with animations enabled, cardBox receives card-mastered-glow
assert.ok(topicCardBox.classList.contains('card-mastered-glow'), 'cardBox must have card-mastered-glow class applied');

// 4. Test Everyday Sayings Mastered Glow
win.navigateTo('#/vocab/flashcards');
win.renderFlashcardStudio();
const studioCardBox = doc.getElementById('studioCardBox');
assert.ok(studioCardBox, 'studioCardBox must exist in DOM');

win.markSayingKnown();
assert.ok(studioCardBox.classList.contains('card-mastered-glow'), 'studioCardBox must have card-mastered-glow class applied');

console.log('✓ All Flashcard Flip and Mastered Glow-then-Fade checks PASSED cleanly!');
