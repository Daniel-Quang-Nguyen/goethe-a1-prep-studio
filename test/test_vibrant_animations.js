// test/test_vibrant_animations.js
// Verification suite for Vibrant Animations & Living Interface in Goethe A1 Studio

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

console.log('===============================================================');
console.log('       VIBRANT ANIMATIONS & LIVING INTERFACE TEST SUITE        ');
console.log('===============================================================');

let passCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(` ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(` ✗ ${name}: ${err.message}`);
    process.exit(1);
  }
}

// 1. CSS Keyframes
test('Keyframe animations defined in <style>', () => {
  const requiredKeyframes = [
    '@keyframes cardGlideIn',
    '@keyframes scoreFloatUp',
    '@keyframes streakFlameBounce',
    '@keyframes scoreBump',
    '@keyframes soundwaveRipple',
    '@keyframes chipSpringIn',
    '@keyframes caseMorph',
    '@keyframes subtabSlideIn',
    '@keyframes cardMasteredGlowFade',
    '@keyframes cardSmoothFadeIn'
  ];
  for (const kf of requiredKeyframes) {
    assert(html.includes(kf), `Missing keyframe: ${kf}`);
  }
});

// 2. CSS Utility Classes
test('Animation utility classes defined in <style>', () => {
  const requiredClasses = [
    '.animate-glide-in',
    '.stagger-1',
    '.stagger-2',
    '.stagger-3',
    '.stagger-4',
    '.score-bump',
    '.streak-flame-pop',
    '.audio-speaking-active',
    '.chip-spring-in',
    '.quiz-opt-interactive',
    '.case-card-morph',
    '.subtab-pane-in',
    '.card-mastered-glow',
    '.card-smooth-fade-in'
  ];
  for (const cls of requiredClasses) {
    assert(html.includes(cls), `Missing animation class: ${cls}`);
  }
});

// 3. Reduced Motion Accessibility
test('Strict accessibility guard for prefers-reduced-motion', () => {
  assert(html.includes('@media (prefers-reduced-motion: reduce)'), 'Missing prefers-reduced-motion query');
  assert(html.includes('animation: none !important'), 'Missing reduced motion animation: none !important override');
});

// 4. Floating Badge Function
test('window.triggerFloatingBadge function defined and implemented', () => {
  assert(html.includes('function triggerFloatingBadge'), 'Missing triggerFloatingBadge definition');
  assert(html.includes("matchMedia('(prefers-reduced-motion: reduce)')"), 'triggerFloatingBadge must respect reduced-motion');
});

// 5. Gamification Score & Streak Animations
test('addScore triggers floating badge, score bump, and streak flame pop', () => {
  assert(html.includes("triggerFloatingBadge('+' + pts + ' pts ⭐'") || html.includes("pts ⭐"), 'addScore must trigger floating pts badge');
  assert(html.includes("headerScore.classList.add('score-bump')") || html.includes("scoreEl.classList.add('score-bump')"), 'addScore must bump header score');
  assert(html.includes("streakEl.classList.add('streak-flame-pop')"), 'addScore must pop streak flame');
});

// 6. Review & Known Floating Particles
test('markTopicVocabReview / markSayingReview trigger Review badge', () => {
  assert(html.includes("triggerFloatingBadge('🎯 +1 to Review'"), 'Missing review floating particle');
  assert(html.includes("triggerFloatingBadge('✓ Mastered! 🔥'"), 'Missing mastered floating particle');
});

// 7. Quiz Option Stagger & Card Glide
test('renderQuestion implements cardGlideIn and staggered options', () => {
  assert(html.includes("pText.classList.add('animate-glide-in')"), 'renderQuestion must apply glide-in to prompt text');
  assert(html.includes("'stagger-' + (idx + 1)"), 'renderQuestion must apply stagger-1..4 to options');
  assert(html.includes("quiz-opt-interactive"), 'options must include quiz-opt-interactive');
});

// 8. Live Audio Soundwave Pulse
test('Audio synthesis buttons trigger soundwave ripple animation', () => {
  assert(html.includes("btnNode.classList.add('audio-speaking-active')"), 'ttsSpeak must apply audio-speaking-active');
  assert(html.includes("btnNode.classList.remove('audio-speaking-active')"), 'ttsSpeak must remove audio-speaking-active on end/error');
});

// 9. Interactive Sentence Builder Spring & Confetti
test('Puzzle zones use chip-spring-in and fire confetti on completion', () => {
  assert(html.includes("chip-spring-in"), 'renderPuzzleZones must use chip-spring-in');
  assert(html.includes("if (typeof confetti === 'function') confetti()"), 'checkPuzzle must trigger confetti() on solve');
});

// 10. Flashcard Flip & Mastered Glow Animation
test('Flashcard 3D flip and mastered glow-then-fade animation', () => {
  assert(html.includes(".card-inner.flipped { transform: rotateY(180deg) !important; }"), 'card-inner.flipped must rotate 180deg with !important');
  assert(html.includes("cardBox.classList.add('card-mastered-glow')"), 'markTopicVocabKnown / markSayingKnown must apply card-mastered-glow');
  assert(html.includes("flipTopicVocabCard"), 'flipTopicVocabCard function must be defined');
  assert(html.includes("flipStudioCard"), 'flipStudioCard function must be defined');
});

console.log('===============================================================');
console.log(`Summary: All ${passCount}/${passCount} animation test checks PASSED cleanly!`);
console.log('===============================================================');
