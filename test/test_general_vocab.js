// test/test_general_vocab.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

console.log('Testing General Purpose Vocabulary System (120 Words)...');

const app = loadApp();
const g = app.globals;
const doc = app.document;

// 1. Data Integrity
assert.ok(Array.isArray(g.GENERAL_VOCAB_DATA), 'GENERAL_VOCAB_DATA must be an array');
assert.strictEqual(g.GENERAL_VOCAB_DATA.length, 120, `GENERAL_VOCAB_DATA must contain exactly 120 words, found ${g.GENERAL_VOCAB_DATA.length}`);

const expectedCategories = [
  'W-Questions',
  'Connectors & Conjunctions',
  'Adverbs of Time & Place',
  'Adverbs of Degree & Opinion',
  'Universal Verbs',
  'Core Adjectives & Opposites',
  'Pronouns & Indefinites'
];

const foundCategories = new Set();
g.GENERAL_VOCAB_DATA.forEach((item, idx) => {
  assert.ok(typeof item.id === 'string' && item.id.startsWith('gen_'), `Item ${idx} invalid id`);
  assert.ok(typeof item.de === 'string' && item.de.length > 0, `Item ${idx} missing German term`);
  assert.ok(typeof item.en === 'string' && item.en.length > 0, `Item ${idx} missing English translation`);
  assert.ok(typeof item.category === 'string' && item.category.length > 0, `Item ${idx} missing category`);
  assert.ok(typeof item.example === 'string' && item.example.length > 0, `Item ${idx} missing example`);
  foundCategories.add(item.category);
});

console.log(`✓ 120 items validated across ${foundCategories.size} functional categories`);

// 2. Interactive Mode Switcher
assert.strictEqual(typeof g.switchVocabStudyMode, 'function', 'switchVocabStudyMode must be a function');

// Switch to General
g.switchVocabStudyMode('general');
const bBadge = doc.getElementById('topicVocabProgressBadge');
assert.ok(bBadge && bBadge.innerText.includes('120'), 'Badge should show 120 cards in general mode');
const titleEl = doc.getElementById('topicVocabHeaderTitle');
assert.ok(titleEl && titleEl.innerText.includes('General Purpose'), 'Title should show General Purpose');

// Check card rendering
const frontDe = doc.getElementById('topicVocabFrontDe');
assert.ok(frontDe && frontDe.innerText.length > 0, 'Front of card should show German word');

// Check Flip
g.flipTopicVocabCard();
const inner = doc.getElementById('topicVocabCardInner');
assert.ok(inner && inner.classList.contains('flipped'), 'Card inner should have .flipped class');

// Check Shuffle
g.shuffleTopicVocab();
g.shuffleTopicVocab();

// Check Navigation
g.nextTopicVocabCard();
g.prevTopicVocabCard();

// Check Transportation to Review
const initialMistakesCount = (g.appState.mistakes || []).length;
g.markTopicVocabReview();
assert.ok((g.appState.mistakes || []).length > initialMistakesCount, 'Review mark should add mistake to appState');

// Switch back to Topic Vocab
g.switchVocabStudyMode('topic');
assert.ok(bBadge && (bBadge.innerText.includes('145') || bBadge.innerText.includes('CARD')), 'Badge should revert to topic cards');
assert.ok(titleEl && titleEl.innerText.includes('Core Topic'), 'Title should revert to Core Topic Vocabulary');

console.log('✓ All General Purpose Vocabulary tests PASSED successfully!');
