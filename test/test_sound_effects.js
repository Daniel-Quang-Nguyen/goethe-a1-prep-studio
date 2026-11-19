/**
 * test/test_sound_effects.js
 * Comprehensive automated verification for the Goethe A1 Procedural Web Audio SFX Engine.
 */
const { loadApp, assert } = require('./e2e/harness');

async function testSoundEffects() {
  console.log('Testing Goethe A1 Procedural Sound Effects Engine...');
  const app = loadApp();
  const { window, globals, document } = app;

  assert(typeof globals.playSfx === 'function', 'globals.playSfx must be a function');
  assert(typeof globals.toggleSfx === 'function', 'globals.toggleSfx must be a function');
  assert(typeof globals.updateSfxButtonUI === 'function', 'globals.updateSfxButtonUI must be a function');

  const audioCtx = app.audioCtx || window._audioCtxMock;
  assert(audioCtx, 'MockAudioContext must be available in harness');

  // Test 1: Verify all 32 sound effect keys synthesize without throwing
  const sfxKeys = [
    'exam_chime', 'exam_lock', 'form_pencil', 'exam_passed', 'exam_encourage',
    'card_flip', 'card_shuffle', 'card_mastered', 'card_review',
    'chip_snap', 'chip_pop', 'puzzle_clear', 'syntax_chord', 'block_thud',
    'der_tone', 'die_tone', 'das_tone', 'gender_ding', 'gender_plink',
    'hunter_click', 'eureka_solve', 'false_alarm',
    'wo_dative', 'wohin_akk', 'grammar_correct', 'grammar_wrong',
    'quiz_correct', 'quiz_wrong', 'streak_sparkle',
    'tab_click', 'theme_switch', 'sfx_toggle'
  ];

  audioCtx.sfxEvents = [];
  globals.appState.sfxMuted = false;

  sfxKeys.forEach(key => {
    audioCtx.sfxEvents = [];
    globals.playSfx(key);
    assert(audioCtx.sfxEvents.length > 0, `playSfx('${key}') must generate audio oscillator events`);
  });
  console.log(` ✓ Verified all ${sfxKeys.length} procedural sound profiles synthesize cleanly`);

  // Test 2: Sound Toggle (#btnToggleSfx) & UI reflection
  const btnToggle = document.getElementById('btnToggleSfx');
  assert(btnToggle, '#btnToggleSfx must exist in the navigation header');
  const sfxIcon = document.getElementById('sfxIcon');
  const sfxLabel = document.getElementById('sfxLabel');
  assert(sfxIcon, '#sfxIcon must exist');
  assert(sfxLabel, '#sfxLabel must exist');

  // Initial state unmuted
  assert.strictEqual(globals.appState.sfxMuted, false, 'Initial state should be unmuted');
  assert.strictEqual(sfxIcon.innerText, '🔊', 'Icon should be 🔊 when unmuted');
  assert.strictEqual(sfxLabel.innerText, 'Sound', 'Label should say Sound when unmuted');

  // Toggle Mute ON
  globals.toggleSfx();
  assert.strictEqual(globals.appState.sfxMuted, true, 'appState.sfxMuted should be true after toggle');
  assert.strictEqual(sfxIcon.innerText, '🔇', 'Icon should be 🔇 when muted');
  assert.strictEqual(sfxLabel.innerText, 'Muted', 'Label should say Muted when muted');
  assert.strictEqual(app.storage.getItem('goethe_a1_sfx_muted'), 'true', 'Storage must persist muted state');

  // Verify muting completely silences playSfx calls
  audioCtx.sfxEvents = [];
  globals.playSfx('quiz_correct');
  globals.playSfx('exam_passed');
  globals.playSfx('card_mastered');
  assert.strictEqual(audioCtx.sfxEvents.length, 0, 'No audio events should be dispatched when sfxMuted is true');
  console.log(' ✓ Verified SFX Mute toggle completely silences engine and persists in storage');

  // Toggle Unmute
  globals.toggleSfx();
  assert.strictEqual(globals.appState.sfxMuted, false, 'appState.sfxMuted should be false after untoggle');
  assert.strictEqual(sfxIcon.innerText, '🔊', 'Icon should be 🔊 when unmuted');
  assert.strictEqual(app.storage.getItem('goethe_a1_sfx_muted'), 'false', 'Storage must persist unmuted state');

  // Test 3: Action Triggers
  audioCtx.sfxEvents = [];
  globals.flipTopicVocabCard();
  const hasFlip = audioCtx.sfxEvents.some(e => e.type === 'osc_start');
  assert(hasFlip, 'flipTopicVocabCard must trigger sound event');

  audioCtx.sfxEvents = [];
  globals.shuffleTopicVocab();
  const hasShuffle = audioCtx.sfxEvents.some(e => e.type === 'osc_start');
  assert(hasShuffle, 'shuffleTopicVocab must trigger sound event');

  console.log(' ✓ Verified real interactive action triggers generate procedural audio');
  console.log('[PASS] Procedural Web Audio Engine verified successfully.');
}

if (require.main === module) {
  testSoundEffects().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}

module.exports = { testSoundEffects };
