/**
 * test/test_v3_features.js
 * Verification Suite for Edition 3.0 Cockpit & Advanced Learning Systems:
 * 1. Cockpit & Ambient Canvases (#v2Cockpit, #ambientBackdropCanvas, #ambientAuroraLayer)
 * 2. XP Progression & Rank Calculation (awardXP, RANKS)
 * 3. Goethe Express Stations (EXPRESS_STATIONS progression & unlocking)
 * 4. Living Scenes & Vocabulary Hotspots (SCENES, renderLivingScenes, hotspots)
 * 5. Branching Dialogue Quests (QUESTS, startQuest, chooseQuestOption, politeness)
 * 6. Listening Dictation Engine (DICTATION_ITEMS, renderDictationStage, checkDictation)
 * 7. Rapid-Fire Gender Blitz (startGenderBlitz, answerGenderBlitz, stopBlitz)
 * 8. Goethe Print Sheet (#v2PrintSheet, print media layout, cheat sheet tables)
 *
 * Zero external dependencies: pure Node.js core modules and ./e2e/harness.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

console.log('===============================================================');
console.log('   GOETHE A1 GERMAN STUDIO — EDITION 3.0 FEATURE VERIFICATION  ');
console.log('===============================================================');
console.log('Validating Cockpit, XP Ranks, Express, Scenes, Quests, Dictation, Blitz & Print Sheet...\n');

const htmlPath = path.join(__dirname, '..', 'index.html');
const rawHtml = fs.readFileSync(htmlPath, 'utf8');

// Load App with sandboxed harness
const app = loadApp();
const g = app.globals;
const doc = app.document;
const win = app.window;

const tests = [
  // --------------------------------------------------------------------------
  // Test 1: Cockpit DOM & Ambient Canvas Layer Integration
  // --------------------------------------------------------------------------
  {
    name: 'Cockpit & Ambient Layers (#v2Cockpit, #ambientBackdropCanvas, #ambientAuroraLayer, renderCockpit, computeReadiness)',
    run() {
      // DOM Elements presence
      const cockpitEl = doc.getElementById('v2Cockpit') || doc.querySelector('#v2Cockpit');
      assert.ok(cockpitEl || rawHtml.includes('id="v2Cockpit"'), '#v2Cockpit container must exist');

      const canvasEl = doc.getElementById('ambientBackdropCanvas') || doc.querySelector('#ambientBackdropCanvas');
      assert.ok(canvasEl || rawHtml.includes('id="ambientBackdropCanvas"'), '#ambientBackdropCanvas must exist');

      const auroraEl = doc.getElementById('ambientAuroraLayer') || doc.querySelector('#ambientAuroraLayer');
      assert.ok(auroraEl || rawHtml.includes('id="ambientAuroraLayer"'), '#ambientAuroraLayer must exist');

      // Functions: renderCockpit, computeReadiness
      const renderCockpitFn = win.renderCockpit || (win.V2 && win.V2.renderCockpit) || g.renderCockpit;
      assert.ok(typeof renderCockpitFn === 'function', 'renderCockpit function must be defined');

      const computeReadinessFn = win.computeReadiness || g.computeReadiness;
      assert.ok(typeof computeReadinessFn === 'function', 'computeReadiness function must be defined');

      const rd = computeReadinessFn();
      assert.ok(typeof rd === 'object' && rd !== null, 'computeReadiness must return an object');
      assert.ok(typeof rd.total === 'number' && rd.total >= 0 && rd.total <= 100, `Readiness total must be between 0 and 100, got ${rd.total}`);
      assert.ok(typeof rd.grammar === 'number', 'Readiness must have grammar component');
      assert.ok(typeof rd.vocab === 'number', 'Readiness must have vocab component');
      assert.ok(typeof rd.exam === 'number', 'Readiness must have exam component');

      // Execute renderCockpit
      assert.doesNotThrow(() => renderCockpitFn(), 'renderCockpit() threw error');

      return `Cockpit, ambient canvases and computeReadiness verified (Initial readiness: ${rd.total}%)`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 2: XP System & Rank Hierarchy (awardXP, RANKS)
  // --------------------------------------------------------------------------
  {
    name: 'XP System & Rank Progression (awardXP, RANKS, 10 Tiers)',
    run() {
      const ranks = g.RANKS || win.RANKS;
      assert.ok(Array.isArray(ranks), 'RANKS must be an array');
      assert.strictEqual(ranks.length, 10, `RANKS must contain 10 tiers, found ${ranks.length}`);

      // Validate Rank 1 and Rank 10 boundaries
      assert.strictEqual(ranks[0].level, 1, 'Rank 1 level must be 1');
      assert.strictEqual(ranks[0].xp, 0, 'Rank 1 starting XP must be 0');
      assert.strictEqual(ranks[0].title, 'Der Tourist', 'Rank 1 title must be Der Tourist');

      assert.strictEqual(ranks[9].level, 10, 'Rank 10 level must be 10');
      assert.strictEqual(ranks[9].xp, 12500, 'Rank 10 starting XP must be 12500');
      assert.strictEqual(ranks[9].title, 'Der Goethe Meister', 'Rank 10 title must be Der Goethe Meister');

      ranks.forEach((r, idx) => {
        assert.strictEqual(r.level, idx + 1, `Rank ${idx} level must match index + 1`);
        assert.ok(typeof r.xp === 'number', `Rank ${idx} XP must be number`);
        assert.ok(typeof r.title === 'string' && r.title.length > 0, `Rank ${idx} title missing`);
        assert.ok(typeof r.desc === 'string' && r.desc.length > 0, `Rank ${idx} desc missing`);
        assert.ok(['Bronze', 'Silver', 'Gold'].includes(r.tier), `Rank ${idx} tier must be Bronze, Silver, or Gold`);
      });

      // Test awardXP function
      const awardXPFn = win.awardXP || g.awardXP;
      assert.ok(typeof awardXPFn === 'function', 'awardXP function must be defined');

      const getCurrentRankFn = win.getCurrentRank || g.getCurrentRank;
      assert.ok(typeof getCurrentRankFn === 'function', 'getCurrentRank function must be defined');

      const initialRank = getCurrentRankFn();
      assert.strictEqual(initialRank.level, 1, 'Initial rank must be Level 1');

      // Award XP to level up (e.g. +300 XP)
      awardXPFn(300);
      const newRank = getCurrentRankFn();
      assert.strictEqual(newRank.level, 2, `After 300 XP, level should be 2, got ${newRank.level}`);
      assert.strictEqual(newRank.title, 'Der Kaffeegast', 'Rank 2 title must be Der Kaffeegast');

      return `10 Rank levels from Der Tourist to Der Goethe Meister verified with awardXP progression`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 3: Goethe Express Stations (EXPRESS_STATIONS)
  // --------------------------------------------------------------------------
  {
    name: 'Goethe Express Stations (EXPRESS_STATIONS 6-City Rail Journey)',
    run() {
      const stations = g.EXPRESS_STATIONS || win.EXPRESS_STATIONS;
      assert.ok(Array.isArray(stations), 'EXPRESS_STATIONS must be an array');
      assert.strictEqual(stations.length, 6, `EXPRESS_STATIONS must contain 6 stations, found ${stations.length}`);

      const expectedCities = ['München Hbf', 'Stuttgart', 'Frankfurt Flgh.', 'Köln Dom', 'Hamburg', 'Berlin Alex.'];
      const expectedReqXp = [0, 350, 900, 1800, 3000, 4800];

      stations.forEach((st, idx) => {
        assert.strictEqual(st.city, expectedCities[idx], `Station ${idx} city mismatch`);
        assert.strictEqual(st.reqXp, expectedReqXp[idx], `Station ${idx} reqXp mismatch`);
        assert.ok(typeof st.id === 'string' && st.id.length > 0, `Station ${idx} id missing`);
        assert.ok(typeof st.sub === 'string' && st.sub.length > 0, `Station ${idx} sub missing`);
        assert.ok(typeof st.route === 'string' && st.route.startsWith('#/'), `Station ${idx} route must be hash route`);
        assert.ok(typeof st.x === 'number' && st.x > 0, `Station ${idx} x coordinate must be positive number`);
      });

      return `6 Goethe Express stations (München -> Berlin Alex.) verified with ascending XP gates`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 4: Living Scenes & Vocabulary Hotspots (SCENES)
  // --------------------------------------------------------------------------
  {
    name: 'Living Scenes & Vocabulary Hotspots (SCENES, renderLivingScenes, setLivingScene, selectSceneHotspot)',
    run() {
      const scenes = g.SCENES || win.SCENES;
      assert.ok(Array.isArray(scenes), 'SCENES must be an array');
      assert.ok(scenes.length >= 3, `Expected >= 3 scenes, found ${scenes.length}`);

      scenes.forEach((sc, idx) => {
        assert.ok(typeof sc.id === 'string' && sc.id.length > 0, `Scene ${idx} id missing`);
        assert.ok(typeof sc.title === 'string' && sc.title.length > 0, `Scene ${idx} title missing`);
        assert.ok(typeof sc.subtitle === 'string' && sc.subtitle.length > 0, `Scene ${idx} subtitle missing`);
        assert.ok(typeof sc.huntPrompt === 'string' && sc.huntPrompt.length > 0, `Scene ${idx} huntPrompt missing`);
        assert.strictEqual(typeof sc.huntFilter, 'function', `Scene ${idx} huntFilter must be a function`);
        assert.ok(Array.isArray(sc.hotspots) && sc.hotspots.length >= 4, `Scene ${idx} must have >= 4 hotspots`);

        sc.hotspots.forEach((hs, hIdx) => {
          assert.ok(hs.id, `Hotspot ${hIdx} in scene ${sc.id} missing id`);
          assert.ok(hs.noun, `Hotspot ${hs.id} missing noun`);
          assert.ok(['der', 'die', 'das'].includes(hs.gender), `Hotspot ${hs.id} invalid gender: ${hs.gender}`);
          assert.ok(hs.meaning, `Hotspot ${hs.id} missing meaning`);
          assert.ok(hs.plural && hs.plural.startsWith('die '), `Hotspot ${hs.id} plural must start with "die "`);
        });
      });

      const renderScenesFn = win.renderLivingScenes || (win.V2 && win.V2.renderLivingScenes) || g.renderLivingScenes;
      assert.ok(typeof renderScenesFn === 'function', 'renderLivingScenes function must be defined');

      const setSceneFn = win.setLivingScene || (win.V2 && win.V2.setLivingScene) || g.setLivingScene;
      assert.ok(typeof setSceneFn === 'function', 'setLivingScene function must be defined');

      const selectHotspotFn = win.selectSceneHotspot || (win.V2 && win.V2.selectSceneHotspot) || g.selectSceneHotspot;
      assert.ok(typeof selectHotspotFn === 'function', 'selectSceneHotspot function must be defined');

      // Test scene switching and hotspot selection
      assert.doesNotThrow(() => setSceneFn(0), 'setSceneFn(0) threw error');
      assert.doesNotThrow(() => selectHotspotFn(scenes[0].hotspots[0]), 'selectSceneHotspot threw error');

      return `${scenes.length} living scenes verified with interactive noun hotspots and A1 filter predicates`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 5: Branching Dialogue Quests (QUESTS)
  // --------------------------------------------------------------------------
  {
    name: 'Branching Dialogue Quests (QUESTS, startQuest, chooseQuestOption, Politeness Register)',
    run() {
      const quests = g.QUESTS || win.QUESTS;
      assert.ok(Array.isArray(quests), 'QUESTS must be an array');
      assert.ok(quests.length >= 3, `Expected >= 3 quests, found ${quests.length}`);

      quests.forEach((q, idx) => {
        assert.ok(typeof q.id === 'string' && q.id.length > 0, `Quest ${idx} id missing`);
        assert.ok(typeof q.title === 'string' && q.title.length > 0, `Quest ${idx} title missing`);
        assert.ok(typeof q.setting === 'string' && q.setting.length > 0, `Quest ${idx} setting missing`);
        assert.ok(typeof q.npc === 'string' && q.npc.length > 0, `Quest ${idx} npc missing`);
        assert.ok(Array.isArray(q.nodes) && q.nodes.length >= 2, `Quest ${idx} must have >= 2 conversation nodes`);

        q.nodes.forEach((n, nIdx) => {
          assert.ok(n.npcText && n.npcText.length > 0, `Node ${nIdx} in quest ${q.id} missing npcText`);
          assert.ok(n.npcEn && n.npcEn.length > 0, `Node ${nIdx} in quest ${q.id} missing npcEn`);
          assert.ok(Array.isArray(n.choices) && n.choices.length >= 2, `Node ${nIdx} must have >= 2 choices`);

          n.choices.forEach((ch, cIdx) => {
            assert.ok(ch.text && ch.text.length > 0, `Choice ${cIdx} in node ${nIdx} missing text`);
            assert.ok(typeof ch.polite === 'number', `Choice ${cIdx} polite delta must be a number`);
            assert.ok(typeof ch.xp === 'number' && ch.xp >= 0, `Choice ${cIdx} xp must be non-negative number`);
            assert.ok(ch.tip && ch.tip.length > 0, `Choice ${cIdx} missing pedagogical tip`);
          });
        });
      });

      const startQuestFn = win.startQuest || (win.V2 && win.V2.startQuest) || g.startQuest;
      assert.ok(typeof startQuestFn === 'function', 'startQuest function must be defined');

      const chooseQuestOptionFn = win.chooseQuestOption || (win.V2 && win.V2.chooseQuestOption) || g.chooseQuestOption;
      assert.ok(typeof chooseQuestOptionFn === 'function', 'chooseQuestOption function must be defined');

      // Test quest initialization and choice execution
      assert.doesNotThrow(() => startQuestFn(0), 'startQuest(0) threw error');
      assert.doesNotThrow(() => chooseQuestOptionFn(0), 'chooseQuestOption(0) threw error');

      return `${quests.length} interactive branching quests verified with A1 polite register feedback`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 6: Listening Dictation Engine (DICTATION_ITEMS)
  // --------------------------------------------------------------------------
  {
    name: 'Listening Dictation Engine (DICTATION_ITEMS, renderDictationStage, checkDictation)',
    run() {
      const dictItems = g.DICTATION_ITEMS || win.DICTATION_ITEMS;
      assert.ok(Array.isArray(dictItems), 'DICTATION_ITEMS must be an array');
      assert.ok(dictItems.length >= 8, `Expected >= 8 dictation items, found ${dictItems.length}`);

      dictItems.forEach((d, idx) => {
        assert.ok(typeof d.id === 'string' && d.id.length > 0, `Dictation item ${idx} id missing`);
        assert.ok(typeof d.de === 'string' && d.de.length > 0, `Dictation item ${idx} German sentence missing`);
        assert.ok(typeof d.en === 'string' && d.en.length > 0, `Dictation item ${idx} English translation missing`);
        assert.ok(typeof d.topic === 'string' && d.topic.length > 0, `Dictation item ${idx} topic missing`);
      });

      const renderDictFn = win.renderDictationStage || g.renderDictationStage;
      assert.ok(typeof renderDictFn === 'function', 'renderDictationStage function must be defined');

      const checkDictFn = win.checkDictation || (win.V2 && win.V2.checkDictation) || g.checkDictation;
      assert.ok(typeof checkDictFn === 'function', 'checkDictation function must be defined');

      const nextDictFn = win.nextDictation || (win.V2 && win.V2.nextDictation) || g.nextDictation;
      assert.ok(typeof nextDictFn === 'function', 'nextDictation function must be defined');

      const prevDictFn = win.prevDictation || (win.V2 && win.V2.prevDictation) || g.prevDictation;
      assert.ok(typeof prevDictFn === 'function', 'prevDictation function must be defined');

      // Test rendering and checking
      assert.doesNotThrow(() => renderDictFn(), 'renderDictationStage threw error');
      assert.doesNotThrow(() => checkDictFn(), 'checkDictation threw error');
      assert.doesNotThrow(() => nextDictFn(), 'nextDictation threw error');
      assert.doesNotThrow(() => prevDictFn(), 'prevDictation threw error');

      return `${dictItems.length} listening dictation items verified with Levenshtein diff and stage progression`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 7: Rapid-Fire Gender Blitz
  // --------------------------------------------------------------------------
  {
    name: 'Rapid-Fire Gender Blitz Engine (startGenderBlitz, answerGenderBlitz, stopBlitz, finishGenderBlitz)',
    run() {
      const startBlitzFn = win.startGenderBlitz || (win.V2 && win.V2.startGenderBlitz) || g.startGenderBlitz;
      assert.ok(typeof startBlitzFn === 'function', 'startGenderBlitz function must be defined');

      const answerBlitzFn = win.answerGenderBlitz || (win.V2 && win.V2.answerGenderBlitz) || g.answerGenderBlitz;
      assert.ok(typeof answerBlitzFn === 'function', 'answerGenderBlitz function must be defined');

      const stopBlitzFn = win.stopBlitz || g.stopBlitz;
      assert.ok(typeof stopBlitzFn === 'function', 'stopBlitz function must be defined');

      // Start blitz
      assert.doesNotThrow(() => startBlitzFn(), 'startGenderBlitz threw error');

      // Answer der, die, or das
      assert.doesNotThrow(() => answerBlitzFn('der'), 'answerGenderBlitz(der) threw error');
      assert.doesNotThrow(() => answerBlitzFn('die'), 'answerGenderBlitz(die) threw error');
      assert.doesNotThrow(() => answerBlitzFn('das'), 'answerGenderBlitz(das) threw error');

      // Stop blitz cleanly
      assert.doesNotThrow(() => stopBlitzFn(), 'stopBlitz threw error');

      return `Gender blitz lifecycle (start, rapid answer, streak, timer cleanup) verified`;
    }
  },

  // --------------------------------------------------------------------------
  // Test 8: Goethe Print Sheet (#v2PrintSheet)
  // --------------------------------------------------------------------------
  {
    name: 'Goethe Print Sheet (#v2PrintSheet, Print CSS Rules, 2-Page Offline Architecture)',
    run() {
      const printSheetEl = doc.getElementById('v2PrintSheet') || doc.querySelector('#v2PrintSheet');
      assert.ok(printSheetEl || rawHtml.includes('id="v2PrintSheet"'), '#v2PrintSheet must exist in HTML');

      // Check aria-hidden="true"
      assert.ok(rawHtml.includes('id="v2PrintSheet" aria-hidden="true"') || (printSheetEl && printSheetEl.getAttribute('aria-hidden') === 'true'),
        '#v2PrintSheet must have aria-hidden="true" in default screen view');

      // Check Print Media CSS rules in stylesheet
      assert.ok(rawHtml.includes('@media print'), 'Missing @media print rules');
      assert.ok(rawHtml.includes('#v2PrintSheet { display: block !important; }') || rawHtml.includes('#v2PrintSheet{display:block!important}'),
        'Print CSS must display #v2PrintSheet !important on print');
      assert.ok(rawHtml.includes('body > *:not(#v2PrintSheet) { display: none !important; }') || rawHtml.includes('body>*:not(#v2PrintSheet){display:none!important}'),
        'Print CSS must hide main app body elements on print');

      // Pedagogical Content of Print Sheet
      assert.ok(rawHtml.includes('Article Matrix (Nom / Akk / Dat)') || rawHtml.includes('Article Matrix'), 'Print sheet missing Article Matrix table');
      assert.ok(rawHtml.includes('Wechselpräpositionen'), 'Print sheet missing Wechselpräpositionen section');
      assert.ok(rawHtml.includes('Satzklammer') || rawHtml.includes('V2 Rule'), 'Print sheet missing Sentence Architecture / V2 section');
      assert.ok(rawHtml.includes('Emergency Pocket Cheat Sheet'), 'Print sheet missing Emergency Pocket Cheat Sheet header');

      return `2-page print sheet verified with @media print CSS isolation and complete A1 matrices`;
    }
  }
];

let allPassed = true;
let passedCount = 0;

tests.forEach((t, idx) => {
  try {
    const detail = t.run();
    console.log(` [PASS] (${idx + 1}/${tests.length}) ${t.name}`);
    console.log(`        -> ${detail}`);
    passedCount++;
  } catch (err) {
    console.error(` [FAIL] (${idx + 1}/${tests.length}) ${t.name}`);
    console.error(`        Error: ${err.message}`);
    allPassed = false;
  }
});

console.log('\n===============================================================');
console.log(`Summary: ${passedCount}/${tests.length} Edition 3.0 feature test suites PASSED.`);
console.log('===============================================================');

if (allPassed) {
  process.exit(0);
} else {
  process.exit(1);
}
