// test/run_all_bug_checks.js
const { execSync } = require('child_process');
const path = require('path');

const testSuites = [
  { name: '10-Point Master Architectural Verification', file: 'verify_app.js' },
  { name: 'Interactive Chips, Popover & Subtabs CSS Audit', file: 'test_interactive_chips.js' },
  { name: 'Case Explorer 48 Matrix Declensions', file: 'test_case_explorer_matrix.js' },
  { name: 'Case Explorer 48 State Updates & DOM Rendering', file: 'test_case_explorer_clicks.js' },
  { name: 'Error Hunter 16 Items & Prompt Translations', file: 'test_error_hunter_data.js' },
  { name: 'Error Hunter 16 Interactive Clicks & Solves', file: 'test_error_hunter_clicks.js' },
  { name: 'V2 Satzklammer 20 Puzzle Scrambles & Clears', file: 'test_puzzle_clicks.js' },
  { name: 'Grammar Blueprints & Progressive Disclosure (8 Topics)', file: 'test_all_blueprints.js' },
  { name: 'Goethe A1 Missing Pillars (Perfekt, Imperativ, Possessiv, Dativ, ADUSO)', file: 'test_pillars.js' },
  { name: 'WCAG AA Color Contrast Audit (Light & Dark Themes)', file: 'test_wcag_contrast.js' },
  { name: 'CEFR A1 Calibration Audit (Zero A2+ markers)', file: 'test_a1_calibration.js' },
  { name: 'Flashcard Review & Spaced Repetition Transportation', file: 'test_flashcard_review_transport.js' },
  { name: 'Living Interface 60fps Animations & Gamification Motion', file: 'test_vibrant_animations.js' },
  { name: 'Flashcard 3D Flip & Mastered Green Glow-Fade Mechanics', file: 'test_card_flip_and_mastered_glow.js' },
  { name: 'General Purpose Vocabulary System (120 Functional Words)', file: 'test_general_vocab.js' },
  { name: 'Section Content Enrichment (Thematic Blueprints & 54 Survival Phrases)', file: 'test_section_enrichment.js' },
  { name: 'Goethe A1 4-Skill Exam Hub Simulation (Hören, Lesen, Schreiben, Sprechen)', file: 'test_exam_hub_overhaul.js' },
  { name: 'Zero-Dependency Procedural Web Audio Engine (32 Sound Profiles & Mute Toggle)', file: 'test_sound_effects.js' },
  { name: 'Strict Answer Lock-in Mechanics Across All Testing Interfaces', file: 'test_answer_locking.js' },
  { name: 'Mastered & Review HUD Popups & Universal Audio SFX Coverage', file: 'test_popup_and_universal_sfx.js' },
  { name: 'Continuous Flow, 4-Stage SRS Progression & Daily Sprint Engine', file: 'test_continuous_flow_and_sprint.js' },
  { name: 'Scoring Integrity, Spaced Review & Module Interconnection Audit', file: 'test_scoring_and_spaced_review_integration.js' },
  { name: 'Comprehensive Score Counters, Telemetry & Leitner Progression Audit', file: 'test_all_score_counters.js' },
  { name: 'Edition 3.0 Cockpit, XP Ranks, Express, Scenes, Quests, Dictation, Blitz & Print Sheet', file: 'test_v3_features.js' },
  { name: 'Universal Checkpoints, Resume Progression & Reset Engine', file: 'test_checkpoints_system.js' }
];

console.log('===============================================================');
console.log('       GOETHE A1 DEEP BUG CHECK & UI/UX VALIDATION SUITE        ');
console.log('===============================================================\n');

let passed = 0;
testSuites.forEach((s, idx) => {
  const filePath = path.join(__dirname, s.file);
  try {
    execSync(`node "${filePath}"`, { stdio: 'pipe' });
    console.log(`[PASS] (${idx + 1}/${testSuites.length}) ${s.name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] (${idx + 1}/${testSuites.length}) ${s.name}`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
  }
});

console.log('\n===============================================================');
console.log(`Summary: ${passed}/${testSuites.length} test suites PASSED cleanly.`);
console.log('===============================================================');
if (passed === testSuites.length) {
  process.exit(0);
} else {
  process.exit(1);
}
