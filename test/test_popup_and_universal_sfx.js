/**
 * test/test_popup_and_universal_sfx.js
 * Automated verification for:
 * 1. Redesigned Mastered & Review HUD Popups (Top-center, non-obtrusive, emerald/terracotta styles, icon badges).
 * 2. Universal Sound Effect Coverage (Zero silent buttons, contextual audio triggers, fallback micro-tick).
 */
const { loadApp, assert } = require('./e2e/harness');

async function testPopupAndUniversalSfx() {
  console.log('Testing Goethe A1 Mastered/Review Popups & Universal Audio SFX...');
  const app = loadApp();
  const { window, globals, document } = app;
  const audioCtx = app.audioCtx || window._audioCtxMock;

  // -------------------------------------------------------------
  // Test 1: DOM & CSS Verification of #uxToast HUD
  // -------------------------------------------------------------
  const toastEl = document.getElementById('uxToast');
  assert(toastEl, '#uxToast must exist in DOM');

  const fs = require('fs');
  const html = fs.readFileSync('index.html', 'utf8');

  // Verify non-obstructive top positioning
  assert(html.includes('#uxToast{position:fixed;left:50%;top:76px;'), '#uxToast must be positioned at top:76px (clearing bottom buttons)');
  assert(!html.includes('bottom:84px'), '#uxToast must no longer use obsolete bottom:84px');

  // Verify semantic CSS variants
  assert(html.includes('#uxToast.toast-mastered'), '#uxToast.toast-mastered CSS rule must exist');
  assert(html.includes('#uxToast.toast-review'), '#uxToast.toast-review CSS rule must exist');
  assert(html.includes('#uxToast.toast-default'), '#uxToast.toast-default CSS rule must exist');
  assert(html.includes('toast-badge'), '.toast-badge styling must exist');

  console.log(' ✓ Verified #uxToast top-center positioning & semantic CSS styling');

  // -------------------------------------------------------------
  // Test 2: Mastered & Review Popup Functionality
  // -------------------------------------------------------------
  // Test Mastered Toast
  globals.toast('Mastered: "der Nachname, -n"', null, null, 'mastered');
  assert(toastEl.classList.contains('show'), '#uxToast must have class "show"');
  assert(toastEl.classList.contains('toast-mastered'), '#uxToast must have class "toast-mastered"');
  assert(toastEl.innerHTML.includes('✓'), 'Mastered toast must include checkmark badge');
  assert(toastEl.innerHTML.includes('der Nachname, -n'), 'Mastered toast must contain word text');

  // Test Review Toast with action button
  let reviewActionClicked = false;
  globals.toast('Transported to Review: "das Buch"', 'View in Review', () => { reviewActionClicked = true; }, 'review');
  assert(toastEl.classList.contains('show'), '#uxToast must have class "show"');
  assert(toastEl.classList.contains('toast-review'), '#uxToast must have class "toast-review"');
  assert(toastEl.innerHTML.includes('🎯'), 'Review toast must include target badge');
  assert(toastEl.innerHTML.includes('das Buch'), 'Review toast must contain word text');

  const actionBtn = toastEl.querySelector('button');
  assert(actionBtn, 'Review toast must render action button');
  assert.strictEqual(actionBtn.innerText, 'View in Review');
  actionBtn.onclick();
  assert.strictEqual(reviewActionClicked, true, 'Clicking action button must execute callback');

  console.log(' ✓ Verified Mastered and Review HUD popups render appropriate badges and themes');

  // -------------------------------------------------------------
  // Test 3: Audio SFX Coverage on Flashcard/Vocab Navigation
  // -------------------------------------------------------------
  audioCtx.sfxEvents = [];
  globals.appState.sfxMuted = false;

  // Initialize vocab
  globals.initTopicVocab(globals.SECTIONS_DATA[0]);

  // Next / Prev Topic Vocab
  audioCtx.sfxEvents = [];
  globals.nextTopicVocabCard();
  assert(audioCtx.sfxEvents.length > 0, 'nextTopicVocabCard must trigger audio');

  audioCtx.sfxEvents = [];
  globals.prevTopicVocabCard();
  assert(audioCtx.sfxEvents.length > 0, 'prevTopicVocabCard must trigger audio');

  // Next / Prev Flashcard Studio
  audioCtx.sfxEvents = [];
  globals.nextFlashcardStudio();
  assert(audioCtx.sfxEvents.length > 0, 'nextFlashcardStudio must trigger audio');

  audioCtx.sfxEvents = [];
  globals.prevFlashcardStudio();
  assert(audioCtx.sfxEvents.length > 0, 'prevFlashcardStudio must trigger audio');

  // Mode & View Toggles
  audioCtx.sfxEvents = [];
  globals.toggleTopicVocabView();
  assert(audioCtx.sfxEvents.length > 0, 'toggleTopicVocabView must trigger audio');

  audioCtx.sfxEvents = [];
  globals.switchVocabStudyMode('general');
  assert(audioCtx.sfxEvents.length > 0, 'switchVocabStudyMode must trigger audio');

  console.log(' ✓ Verified Flashcard & Topic Vocab navigation buttons trigger audio SFX');

  // -------------------------------------------------------------
  // Test 4: Audio SFX Coverage on Grammar & Puzzle Controls
  // -------------------------------------------------------------
  audioCtx.sfxEvents = [];
  globals.switchGrammarView('v2');
  assert(audioCtx.sfxEvents.length > 0, 'switchGrammarView must trigger audio');

  audioCtx.sfxEvents = [];
  globals.toggleGrammarBlueprint();
  assert(audioCtx.sfxEvents.length > 0, 'toggleGrammarBlueprint must trigger audio');

  audioCtx.sfxEvents = [];
  globals.nextGrammarQuestion();
  assert(audioCtx.sfxEvents.length > 0, 'nextGrammarQuestion must trigger audio');

  audioCtx.sfxEvents = [];
  globals.nextPuzzle();
  assert(audioCtx.sfxEvents.length > 0, 'nextPuzzle must trigger audio');

  audioCtx.sfxEvents = [];
  globals.nextErrorHunter();
  assert(audioCtx.sfxEvents.length > 0, 'nextErrorHunter must trigger audio');

  audioCtx.sfxEvents = [];
  globals.nextArticle();
  assert(audioCtx.sfxEvents.length > 0, 'nextArticle must trigger audio');

  audioCtx.sfxEvents = [];
  globals.insertUmlaut('ä');
  assert(audioCtx.sfxEvents.length > 0, 'insertUmlaut must trigger chip_snap audio');

  console.log(' ✓ Verified Grammar, Puzzle, and Drill controls trigger audio SFX');

  // -------------------------------------------------------------
  // Test 5: Audio SFX Coverage on Exam Hub Controls
  // -------------------------------------------------------------
  audioCtx.sfxEvents = [];
  globals.startMockExam();
  assert(audioCtx.sfxEvents.length > 0, 'startMockExam must trigger exam_chime audio');

  audioCtx.sfxEvents = [];
  globals.switchExamHoerenTeil(2);
  assert(audioCtx.sfxEvents.length > 0, 'switchExamHoerenTeil must trigger audio');

  audioCtx.sfxEvents = [];
  globals.switchExamLesenTeil(2);
  assert(audioCtx.sfxEvents.length > 0, 'switchExamLesenTeil must trigger audio');

  audioCtx.sfxEvents = [];
  globals.switchExamSchreibenTeil(2);
  assert(audioCtx.sfxEvents.length > 0, 'switchExamSchreibenTeil must trigger audio');

  audioCtx.sfxEvents = [];
  globals.switchExamSprechenTeil(2);
  assert(audioCtx.sfxEvents.length > 0, 'switchExamSprechenTeil must trigger audio');

  audioCtx.sfxEvents = [];
  globals.generateExamNumber();
  assert(audioCtx.sfxEvents.length > 0, 'generateExamNumber must trigger card_shuffle audio');

  audioCtx.sfxEvents = [];
  globals.resetExamHub();
  assert(audioCtx.sfxEvents.length > 0, 'resetExamHub must trigger puzzle_clear audio');
  if (typeof globals.finishMockExam === 'function') globals.finishMockExam(false);

  console.log(' ✓ Verified Exam Hub controls and state switches trigger audio SFX');

  // -------------------------------------------------------------
  // Test 6: Universal Delegated Click Listener Fallback
  // -------------------------------------------------------------
  assert(html.includes('// Universal Tactile SFX Fallback'), 'Universal delegated click listener must be registered in HTML');
  assert(html.includes("playSfx('tab_click')"), 'Fallback must play tab_click');

  console.log(' ✓ Verified Universal Delegated Click SFX Fallback is wired for zero-silent controls');
  console.log('===============================================================');
  console.log('All Mastered/Review Popup and Universal SFX tests PASSED cleanly!');
  console.log('===============================================================');
}

if (require.main === module) {
  testPopupAndUniversalSfx().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { testPopupAndUniversalSfx };
