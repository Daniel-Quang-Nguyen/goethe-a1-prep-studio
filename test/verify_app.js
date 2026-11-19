/**
 * test/verify_app.js
 * 10-Point Architectural & Pedagogical Verification Suite for Goethe A1 German Studio.
 * Validates Requirement R5 from ORIGINAL_REQUEST.md.
 * Zero external dependencies: pure Node.js core modules (fs, path, vm, assert) and ./e2e/harness.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

const htmlPath = path.join(__dirname, '..', 'index.html');
const rawHtml = fs.readFileSync(htmlPath, 'utf8');
const html = rawHtml.replace(/<!--[\s\S]*?-->/g, '');

console.log('===============================================================');
console.log('       GOETHE A1 GERMAN STUDIO — 10-POINT VERIFICATION SUITE   ');
console.log('===============================================================');
console.log('Running 10 strict architectural and pedagogical integrity checks...\n');

const app = loadApp();
const g = app.globals;

const checks = [
  // ----------------------------------------------------
  // Check 1: Schema Integrity & Valid Answer Index Bounds
  // ----------------------------------------------------
  {
    num: 1,
    name: 'Schema Integrity & Valid Answer Index Bounds',
    run() {
      // QUIZ_DATA: exactly 210 questions
      assert.ok(Array.isArray(g.QUIZ_DATA), 'QUIZ_DATA must be an array');
      assert.strictEqual(g.QUIZ_DATA.length, 210, `QUIZ_DATA must contain exactly 210 questions, found ${g.QUIZ_DATA.length}`);
      g.QUIZ_DATA.forEach((q, i) => {
        assert.ok(typeof q.id === 'string' && q.id.length > 0, `QUIZ_DATA[${i}] invalid id`);
        assert.ok(typeof q.question === 'string' && q.question.length > 0, `QUIZ_DATA[${i}] invalid question`);
        assert.ok(Array.isArray(q.options) && q.options.length === 4, `QUIZ_DATA[${i}] options must have length 4`);
        assert.ok(typeof q.answer === 'number' && Number.isInteger(q.answer), `QUIZ_DATA[${i}] answer must be integer`);
        assert.ok(q.answer >= 0 && q.answer < q.options.length, `QUIZ_DATA[${i}] answer out of bounds: ${q.answer}`);
        assert.ok(typeof q.explanation === 'string' && q.explanation.length > 0, `QUIZ_DATA[${i}] missing explanation`);
        assert.ok(typeof q.domain === 'string' && q.domain.length > 0, `QUIZ_DATA[${i}] missing domain`);
      });

      // ARTICLES_DATA: exactly 160 nouns
      assert.ok(Array.isArray(g.ARTICLES_DATA), 'ARTICLES_DATA must be an array');
      assert.strictEqual(g.ARTICLES_DATA.length, 160, `ARTICLES_DATA must contain exactly 160 nouns, found ${g.ARTICLES_DATA.length}`);
      g.ARTICLES_DATA.forEach((n, i) => {
        assert.ok(typeof n.id === 'string' && n.id.length > 0, `ARTICLES_DATA[${i}] invalid id`);
        assert.ok(typeof n.noun === 'string' && n.noun.length > 0, `ARTICLES_DATA[${i}] invalid noun`);
        assert.ok(['der', 'die', 'das'].includes(n.gender), `ARTICLES_DATA[${i}] invalid gender: ${n.gender}`);
        assert.ok(typeof n.meaning === 'string' && n.meaning.length > 0, `ARTICLES_DATA[${i}] invalid meaning`);
        assert.ok(typeof n.plural === 'string' && n.plural.startsWith('die '), `ARTICLES_DATA[${i}] plural must start with "die "`);
        assert.ok(typeof n.example === 'string' && n.example.length > 0, `ARTICLES_DATA[${i}] invalid example`);
      });

      // FLASHCARD_DATA: exactly 250 flashcards
      assert.ok(Array.isArray(g.FLASHCARD_DATA), 'FLASHCARD_DATA must be an array');
      assert.strictEqual(g.FLASHCARD_DATA.length, 250, `FLASHCARD_DATA must contain exactly 250 flashcards, found ${g.FLASHCARD_DATA.length}`);
      g.FLASHCARD_DATA.forEach((f, i) => {
        assert.ok(typeof f.id === 'string' && f.id.length > 0, `FLASHCARD_DATA[${i}] invalid id`);
        assert.ok(typeof f.phrase === 'string' && f.phrase.length > 0, `FLASHCARD_DATA[${i}] invalid phrase`);
        assert.ok(typeof f.translation === 'string' && f.translation.length > 0, `FLASHCARD_DATA[${i}] invalid translation`);
        assert.ok(typeof f.category === 'string' && f.category.length > 0, `FLASHCARD_DATA[${i}] invalid category`);
      });

      // GRAMMAR_TOPICS: exactly 8 topics, 168 sentences
      assert.ok(Array.isArray(g.GRAMMAR_TOPICS), 'GRAMMAR_TOPICS must be an array');
      assert.strictEqual(g.GRAMMAR_TOPICS.length, 8, `GRAMMAR_TOPICS must contain exactly 8 topics, found ${g.GRAMMAR_TOPICS.length}`);
      let totalGrammarSentences = 0;
      g.GRAMMAR_TOPICS.forEach((t, ti) => {
        assert.ok(typeof t.id === 'string' && t.id.length > 0, `Topic ${ti} invalid id`);
        const sentences = t.sentences || t.questions;
        assert.ok(Array.isArray(sentences) && sentences.length >= 20, `Topic ${t.id} must have >= 20 sentences`);
        totalGrammarSentences += sentences.length;
        sentences.forEach((s, si) => {
          assert.ok(typeof s.id === 'string' && s.id.length > 0, `Sentence ${si} in ${t.id} invalid id`);
          assert.ok(typeof s.template === 'string' && s.template.length > 0, `Sentence ${s.id} invalid template`);
          assert.ok(Array.isArray(s.options) && s.options.length >= 2, `Sentence ${s.id} options must have >= 2 items`);
          assert.ok(typeof s.answer === 'number' && Number.isInteger(s.answer), `Sentence ${s.id} answer must be integer`);
          assert.ok(s.answer >= 0 && s.answer < s.options.length, `Sentence ${s.id} answer out of bounds: ${s.answer}`);
          assert.ok(s.badge && (s.rule || s.explanation) && s.tip && s.translation, `Sentence ${s.id} missing pedagogical metadata`);
        });
      });
      assert.strictEqual(totalGrammarSentences, 168, `Expected 168 grammar sentences, found ${totalGrammarSentences}`);

      // PUZZLES_DATA: exactly 20 sentence scramble puzzles
      assert.ok(Array.isArray(g.PUZZLES_DATA), 'PUZZLES_DATA must be an array');
      assert.strictEqual(g.PUZZLES_DATA.length, 20, `PUZZLES_DATA must contain exactly 20 puzzles, found ${g.PUZZLES_DATA.length}`);
      g.PUZZLES_DATA.forEach((p, i) => {
        assert.ok(typeof p.id === 'string' && p.id.length > 0, `PUZZLES_DATA[${i}] invalid id`);
        assert.ok(typeof p.english === 'string' && p.english.length > 0, `PUZZLES_DATA[${i}] invalid english`);
        assert.ok(Array.isArray(p.scrambled) && p.scrambled.length >= 2, `PUZZLES_DATA[${i}] scrambled must have >= 2 tokens`);
        assert.ok(Array.isArray(p.correct) && p.correct.length >= 2, `PUZZLES_DATA[${i}] correct must have >= 2 tokens`);
        assert.deepStrictEqual([...p.scrambled].sort(), [...p.correct].sort(), `PUZZLES_DATA[${i}] scrambled cards must match correct sentence tokens exactly`);
        assert.ok(typeof p.rule === 'string' && p.rule.length > 0, `PUZZLES_DATA[${i}] invalid rule`);
      });

      // SIM_DATA: exactly 16 exam simulation scenarios
      assert.ok(Array.isArray(g.SIM_DATA), 'SIM_DATA must be an array');
      assert.strictEqual(g.SIM_DATA.length, 16, `SIM_DATA must contain exactly 16 scenarios, found ${g.SIM_DATA.length}`);
      g.SIM_DATA.forEach((sim, i) => {
        assert.ok(typeof sim.id === 'string' && sim.id.length > 0, `SIM_DATA[${i}] invalid id`);
        assert.ok(typeof sim.type === 'string' && sim.type.length > 0, `SIM_DATA[${i}] invalid type`);
        assert.ok(typeof sim.title === 'string' && sim.title.length > 0, `SIM_DATA[${i}] invalid title`);
        assert.ok(typeof sim.desc === 'string' && sim.desc.length > 0, `SIM_DATA[${i}] invalid desc`);
        assert.ok(typeof sim.solution === 'string' && sim.solution.length > 0, `SIM_DATA[${i}] invalid solution`);
      });

      return `QUIZ_DATA: 210, ARTICLES_DATA: 160, FLASHCARD_DATA: 250, GRAMMAR_TOPICS: 8/168, PUZZLES_DATA: 20, SIM_DATA: 16 verified`;
    }
  },

  // ----------------------------------------------------
  // Check 2: Uniqueness (Zero Duplicate IDs across All 841 Entities)
  // ----------------------------------------------------
  {
    num: 2,
    name: 'Uniqueness (Zero Duplicate IDs across all 841 entities)',
    run() {
      const allIds = new Map();
      const duplicates = [];

      function register(id, dataset) {
        assert.ok(typeof id === 'string' && id.length > 0, `Missing or invalid ID in ${dataset}`);
        assert.strictEqual(id.trim(), id, `Untrimmed whitespace in ID "${id}" in ${dataset}`);
        if (allIds.has(id)) {
          duplicates.push(`Duplicate ID "${id}" in ${dataset} (first registered in ${allIds.get(id)})`);
        } else {
          allIds.set(id, dataset);
        }
      }

      g.QUIZ_DATA.forEach((q, i) => register(q.id, `QUIZ_DATA[${i}]`));
      g.ARTICLES_DATA.forEach((n, i) => register(n.id, `ARTICLES_DATA[${i}]`));
      g.FLASHCARD_DATA.forEach((fc, i) => register(fc.id, `FLASHCARD_DATA[${i}]`));
      g.PUZZLES_DATA.forEach((p, i) => register(p.id, `PUZZLES_DATA[${i}]`));
      g.SIM_DATA.forEach((sim, i) => register(sim.id, `SIM_DATA[${i}]`));
      if (Array.isArray(g.SECTIONS_DATA)) {
        g.SECTIONS_DATA.forEach((sec, i) => register(sec.id, `SECTIONS_DATA[${i}]`));
      }
      g.GRAMMAR_TOPICS.forEach((t, ti) => {
        register(t.id, `GRAMMAR_TOPICS[${ti}]`);
        const sentences = t.sentences || t.questions || [];
        sentences.forEach((s, si) => register(s.id, `GRAMMAR_${t.id}[${si}]`));
      });

      assert.strictEqual(duplicates.length, 0, `Collisions found: ${duplicates.join('; ')}`);
      assert.strictEqual(allIds.size, 841, `Expected exactly 841 globally unique IDs, found ${allIds.size}`);
      return `Exactly 841 unique entity IDs registered with zero collisions`;
    }
  },

  // ----------------------------------------------------
  // Check 3: Quiz Answer Distribution Balance (<40% in Any Option Position 0..3)
  // ----------------------------------------------------
  {
    num: 3,
    name: 'Quiz Answer Distribution Balance (<40% in any option position 0..3)',
    run() {
      const dist = [0, 0, 0, 0];
      const total = g.QUIZ_DATA.length;
      assert.ok(total > 0, 'QUIZ_DATA cannot be empty');

      g.QUIZ_DATA.forEach((q, i) => {
        assert.ok(q.answer >= 0 && q.answer <= 3, `Invalid answer index ${q.answer} in QUIZ_DATA[${i}]`);
        dist[q.answer]++;
      });

      const percentages = dist.map(c => c / total);
      percentages.forEach((pct, pos) => {
        assert.ok(pct < 0.40, `Option position ${pos} exceeds 40% threshold: ${(pct * 100).toFixed(2)}%`);
      });

      const summary = dist.map((c, pos) => `Pos ${pos}: ${c} (${((c / total) * 100).toFixed(1)}%)`).join(', ');
      return summary;
    }
  },

  // ----------------------------------------------------
  // Check 4: Slot Integrity ({0} tokens, distinct options, valid answer index)
  // ----------------------------------------------------
  {
    num: 4,
    name: 'Slot Integrity ({0} tokens, distinct options, valid answer index)',
    run() {
      let sentenceCount = 0;
      g.GRAMMAR_TOPICS.forEach(topic => {
        const sentences = topic.sentences || topic.questions || [];
        sentences.forEach(s => {
          sentenceCount++;
          // Slot token {0} presence
          assert.ok(s.template.includes('{0}'), `Sentence ${s.id} missing {0} slot token`);

          // Distinct options
          assert.ok(Array.isArray(s.options) && s.options.length >= 2, `Sentence ${s.id} options must have >= 2 items`);
          const distinctOptions = new Set(s.options.map(opt => String(opt).trim()));
          assert.strictEqual(distinctOptions.size, s.options.length, `Sentence ${s.id} has duplicate options: ${JSON.stringify(s.options)}`);

          // Valid answer index
          assert.ok(s.answer >= 0 && s.answer < s.options.length, `Sentence ${s.id} answer index ${s.answer} out of bounds`);
          assert.ok(typeof s.options[s.answer] === 'string' && s.options[s.answer].trim().length > 0, `Sentence ${s.id} correct option is empty`);

          // Complete slot replacement leaves no unfilled tokens
          const filled = s.template.replace('{0}', s.options[s.answer]);
          assert.ok(!/\{[0-9]+\}/.test(filled), `Unfilled token remains in sentence ${s.id}: ${filled}`);
        });
      });
      return `${sentenceCount}/${sentenceCount} sentences verified with matching {0} tokens and valid options`;
    }
  },

  // ----------------------------------------------------
  // Check 5: Single Definitions (1 <script>, 1 <footer>, 1 speakGerman, 1 safeGetStorage, 1 safeSetStorage)
  // ----------------------------------------------------
  {
    num: 5,
    name: 'Single Definitions (1 <script>, 1 <footer>, 1 speakGerman, 1 safeGetStorage, 1 safeSetStorage)',
    run() {
      // Exactly 1 <script> block
      const scriptMatches = html.match(/<script\b[^>]*>/gi) || [];
      assert.strictEqual(scriptMatches.length, 1, `Expected exactly 1 <script> tag, found ${scriptMatches.length}`);

      // Exactly 1 <footer> block
      const footerMatches = html.match(/<footer\b[^>]*>/gi) || [];
      assert.strictEqual(footerMatches.length, 1, `Expected exactly 1 <footer> tag, found ${footerMatches.length}`);

      // Helper to count function definitions (declarations or expressions)
      function countFunctionDeclarations(name, code) {
        const regex = new RegExp(
          '(?:function\\s+' + name + '\\b|' +
          '(?:const|let|var|window\\.' + name + ')\\s*=\\s*(?:async\\s+)?(?:function\\b|\\([^)]*\\)\\s*=>|[a-zA-Z0-9_$]+\\s*=>))',
          'g'
        );
        return (code.match(regex) || []).length;
      }

      const speakCount = countFunctionDeclarations('speakGerman', html);
      assert.strictEqual(speakCount, 1, `Expected exactly 1 definition of speakGerman, found ${speakCount}`);

      const safeGetCount = countFunctionDeclarations('safeGetStorage', html);
      assert.strictEqual(safeGetCount, 1, `Expected exactly 1 definition of safeGetStorage, found ${safeGetCount}`);

      const safeSetCount = countFunctionDeclarations('safeSetStorage', html);
      assert.strictEqual(safeSetCount, 1, `Expected exactly 1 definition of safeSetStorage, found ${safeSetCount}`);

      return '1 <script> tag, 1 <footer>, 1 speakGerman, 1 safeGetStorage, 1 safeSetStorage verified';
    }
  },

  // ----------------------------------------------------
  // Check 6: Navigation Integrity (4 studios, hash routing, subroutes, fallbacks)
  // ----------------------------------------------------
  {
    num: 6,
    name: 'Navigation Integrity (4 studios #studioGrammar, #studioVocab, #studioExam, #studioReview, hash routing, subroutes, fallbacks)',
    run() {
      const studioIds = ['studioGrammar', 'studioVocab', 'studioExam', 'studioReview'];
      for (const id of studioIds) {
        const el = app.document.getElementById(id);
        assert.ok(el, `Studio container #${id} must exist in DOM`);
      }

      assert.strictEqual(typeof app.window.handleRoute, 'function', 'window.handleRoute must be a function');
      assert.strictEqual(typeof app.window.navigateTo, 'function', 'window.navigateTo must be a function');

      // Test 4 primary studio routes
      const studioRoutes = [
        { hash: '#/grammar', activeId: 'studioGrammar', navPill: 'topNavGrammar', tab: 'bottomTabGrammar' },
        { hash: '#/vocab', activeId: 'studioVocab', navPill: 'topNavVocab', tab: 'bottomTabVocab' },
        { hash: '#/exam', activeId: 'studioExam', navPill: 'topNavExam', tab: 'bottomTabExam' },
        { hash: '#/review', activeId: 'studioReview', navPill: 'topNavReview', tab: 'bottomTabReview' }
      ];

      for (const r of studioRoutes) {
        app.window.navigateTo(r.hash);
        const activeEl = app.document.getElementById(r.activeId);
        assert.ok(activeEl && !activeEl.classList.contains('hidden'), `Studio #${r.activeId} must not be hidden for ${r.hash}`);

        // Ensure other 3 studios are hidden
        for (const otherId of studioIds.filter(id => id !== r.activeId)) {
          const otherEl = app.document.getElementById(otherId);
          assert.ok(otherEl && otherEl.classList.contains('hidden'), `Studio #${otherId} must be hidden for ${r.hash}`);
        }

        // Check nav pill / tab active state if present
        const pill = app.document.getElementById(r.navPill);
        if (pill) assert.ok(pill.classList.contains('active'), `Nav pill #${r.navPill} must have .active for ${r.hash}`);
        const tab = app.document.getElementById(r.tab);
        if (tab) assert.ok(tab.classList.contains('active'), `Bottom tab #${r.tab} must have .active for ${r.hash}`);
      }

      // Test subroutes
      const subroutes = [
        '#/grammar/praepositionen', '#/grammar/v2', '#/grammar/dativ',
        '#/vocab/flashcards', '#/vocab/gender',
        '#/exam/mock', '#/exam/sprechen', '#/exam/schreiben',
        '#/review/cheatsheet', '#/review/mistakes', '#/review/srs'
      ];
      for (const sr of subroutes) {
        assert.doesNotThrow(() => app.window.navigateTo(sr), `Subroute ${sr} threw script error`);
      }

      // Test fallback routes
      app.window.navigateTo('#/nonexistent_route_test');
      assert.ok(!app.document.getElementById('studioGrammar').classList.contains('hidden'), 'Invalid route must fall back to #studioGrammar');

      app.window.navigateTo('');
      assert.ok(!app.document.getElementById('studioGrammar').classList.contains('hidden'), 'Empty route must fall back to #studioGrammar');

      return `4 studios (#studioGrammar, #studioVocab, #studioExam, #studioReview) & ${subroutes.length} subroutes active`;
    }
  },

  // ----------------------------------------------------
  // Check 7: Network Resilience & Offline Readiness (0 external script CDNs, Google Fonts, CSS tokens)
  // ----------------------------------------------------
  {
    num: 7,
    name: 'Network Resilience & Offline Readiness (0 external script CDNs, Google Fonts link/preconnect in <head>, CSS design tokens)',
    run() {
      // Zero external script tags with src
      const externalScripts = html.match(/<script\b[^>]*\bsrc=[^>]*>/gi) || [];
      assert.strictEqual(externalScripts.length, 0, `Found external script CDN dependencies: ${JSON.stringify(externalScripts)}`);

      // Google Fonts links in <head>
      assert.ok(/<link\b[^>]*rel=["']preconnect["'][^>]*fonts\.googleapis\.com/i.test(html), 'Missing preconnect for fonts.googleapis.com');
      assert.ok(/<link\b[^>]*rel=["']preconnect["'][^>]*fonts\.gstatic\.com/i.test(html), 'Missing preconnect for fonts.gstatic.com');
      assert.ok(/<link\b[^>]*rel=["']stylesheet["'][^>]*fonts\.googleapis\.com\/css2\?[^>]*display=swap/i.test(html), 'Missing Google Fonts stylesheet link with display=swap');

      // Zero external stylesheets other than Google Fonts
      const extStylesheets = html.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']https?:\/\/(?!fonts\.googleapis\.com)[^"']+["']/gi) || [];
      assert.strictEqual(extStylesheets.length, 0, `Found forbidden external stylesheets: ${JSON.stringify(extStylesheets)}`);

      // Zero CSS @import statements
      const cssImports = html.match(/@import\b[^;]+;/gi) || [];
      assert.strictEqual(cssImports.length, 0, `Found forbidden CSS @import statements: ${JSON.stringify(cssImports)}`);

      // CSS custom property design tokens on :root and body.dark
      assert.ok(html.includes(':root'), 'Missing :root CSS block');
      assert.ok(/body\.dark\s*\{/i.test(html), 'Missing body.dark CSS block');
      const tokens = ['--bg-canvas', '--text-primary', '--border-card', '--card', '--primary', '--success'];
      for (const t of tokens) {
        assert.ok(html.includes(t), `Missing required CSS design token ${t}`);
      }

      return '0 external script CDNs, Google Fonts link/preconnect in <head>, offline CSS tokens verified';
    }
  },

  // ----------------------------------------------------
  // Check 8: Accessibility & Keyboard Controls (semantic buttons, #ariaLiveRegion, keydown 1-4/Space/Enter, WCAG AA contrast)
  // ----------------------------------------------------
  {
    num: 8,
    name: 'Accessibility & Keyboard Controls (semantic buttons, #ariaLiveRegion, keydown 1-4/Space/Enter, WCAG AA contrast)',
    run() {
      // Semantic <button> elements
      const buttonMatches = html.match(/<button\b/gi) || [];
      assert.ok(buttonMatches.length >= 20, `Expected >= 20 semantic <button> elements, found ${buttonMatches.length}`);

      // #ariaLiveRegion element in DOM
      const live = app.document.getElementById('ariaLiveRegion');
      assert.ok(live, 'Missing #ariaLiveRegion in DOM');
      const ariaLive = live.getAttribute('aria-live');
      assert.ok(ariaLive === 'polite' || ariaLive === 'assertive', 'aria-live must be polite or assertive');
      assert.strictEqual(live.getAttribute('role'), 'status', 'ariaLiveRegion role must be "status"');

      // Interactive card-flip container a11y attributes
      const flipCardContainer = html.match(/<div\b[^>]*class="[^"]*card-flip[^"]*"[^>]*>/i);
      assert.ok(flipCardContainer, 'Missing .card-flip container in HTML');
      assert.ok(flipCardContainer[0].includes('role="button"'), 'card-flip container missing role="button"');
      assert.ok(flipCardContainer[0].includes('tabindex="0"'), 'card-flip container missing tabindex="0"');
      assert.ok(flipCardContainer[0].includes('aria-label="Flip flashcard"'), 'card-flip container missing aria-label="Flip flashcard"');

      // Keyboard event listeners
      assert.doesNotThrow(() => {
        app.harness.dispatchKeydown('1');
        app.harness.dispatchKeydown('2');
        app.harness.dispatchKeydown('3');
        app.harness.dispatchKeydown('4');
        app.harness.dispatchKeydown(' ');
        app.harness.dispatchKeydown('Enter');
        app.harness.dispatchKeydown('Escape');
      }, 'Keyboard shortcut dispatch threw an error');

      // Input typing suppression
      const inputEl = app.document.createElement('input');
      assert.doesNotThrow(() => {
        app.window.dispatchEvent({ type: 'keydown', key: '1', target: inputEl });
      }, 'Typing in input threw an error');

      // WCAG AA Contrast ratio calculation
      function hexToLum(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = [r, g, b].map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
      }
      function contrast(h1, h2) {
        const l1 = hexToLum(h1), l2 = hexToLum(h2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      const rootMatch = html.match(/:root\s*\{([^}]+)\}/);
      const darkMatch = html.match(/body\.dark\s*\{([^}]+)\}/);
      assert.ok(rootMatch && darkMatch, 'CSS token blocks (:root, body.dark) must exist');

      const lightBg = rootMatch[1].match(/--bg-canvas:\s*([^;]+);/)[1].trim();
      const lightText = rootMatch[1].match(/--text-primary:\s*([^;]+);/)[1].trim();
      const darkBg = darkMatch[1].match(/--bg-canvas:\s*([^;]+);/)[1].trim();
      const darkText = darkMatch[1].match(/--text-primary:\s*([^;]+);/)[1].trim();

      const lightRatio = contrast(lightBg, lightText);
      const darkRatio = contrast(darkBg, darkText);
      assert.ok(lightRatio >= 4.5, `Light contrast (${lightRatio.toFixed(2)}) must be >= 4.5:1`);
      assert.ok(darkRatio >= 4.5, `Dark contrast (${darkRatio.toFixed(2)}) must be >= 4.5:1`);

      return `${buttonMatches.length} buttons, #ariaLiveRegion, keys 1-4/Space/Enter, contrast (light: ${lightRatio.toFixed(1)}:1, dark: ${darkRatio.toFixed(1)}:1)`;
    }
  },

  // ----------------------------------------------------
  // Check 9: State Persistence & Storage Sandboxing (safeSetStorage/safeGetStorage memory cache under throwing localStorage)
  // ----------------------------------------------------
  {
    num: 9,
    name: 'State Persistence & Storage Sandboxing (safeSetStorage/safeGetStorage memory cache under throwing localStorage)',
    run() {
      // 1. Normal storage round-trip
      const appNormal = loadApp();
      assert.strictEqual(typeof appNormal.window.safeGetStorage, 'function', 'safeGetStorage must be a function');
      assert.strictEqual(typeof appNormal.window.safeSetStorage, 'function', 'safeSetStorage must be a function');
      assert.strictEqual(typeof appNormal.window.safeRemoveStorage, 'function', 'safeRemoveStorage must be a function');

      appNormal.window.safeSetStorage('test_key', 'test_val');
      assert.strictEqual(appNormal.window.safeGetStorage('test_key', 'fallback'), 'test_val');
      appNormal.window.safeRemoveStorage('test_key');
      assert.strictEqual(appNormal.window.safeGetStorage('test_key', 'fallback'), 'fallback');

      // 2. Sandboxed throwing storage (QuotaExceededError / SecurityError simulation)
      const appThrowing = loadApp({ storageThrows: true });
      assert.doesNotThrow(() => {
        const ok = appThrowing.window.safeSetStorage('cache_key', 'persisted_in_memory');
        assert.strictEqual(ok, true, 'safeSetStorage must return true even when localStorage throws');
      }, 'safeSetStorage threw unhandled exception under throwing storage');

      const retrieved = appThrowing.window.safeGetStorage('cache_key', 'fallback');
      assert.strictEqual(retrieved, 'persisted_in_memory', 'In-memory fallback failed to recover value');

      const fallbackRetrieved = appThrowing.window.safeGetStorage('non_existent_key', 'my_default');
      assert.strictEqual(fallbackRetrieved, 'my_default', 'safeGetStorage did not return fallback for missing key');

      // Complex JSON object serialization round-trip
      const testObj = { score: 100, streak: 3, mistakes: ['noun_001', 'gram_002'] };
      appThrowing.window.safeSetStorage('json_key', testObj);
      assert.deepStrictEqual(appThrowing.window.safeGetStorage('json_key', null), testObj, 'Object serialization failed under sandboxed storage');

      // Removal from memory cache
      appThrowing.window.safeRemoveStorage('cache_key');
      assert.strictEqual(appThrowing.window.safeGetStorage('cache_key', 'removed'), 'removed', 'safeRemoveStorage failed to evict memory cache');

      return 'safeSetStorage / safeGetStorage memory cache verified under throwing localStorage';
    }
  },

  // ----------------------------------------------------
  // Check 10: Canonical Taxonomy (9 vocabulary themes, 8 grammar domains with >= 20 sentences each, >= 160 total)
  // ----------------------------------------------------
  {
    num: 10,
    name: 'Canonical Taxonomy (9 vocabulary themes, 8 grammar domains with >= 20 sentences each, >= 160 total)',
    run() {
      // 9 vocabulary themes in SECTIONS_DATA
      assert.ok(Array.isArray(g.SECTIONS_DATA), 'SECTIONS_DATA must be an array');
      assert.strictEqual(g.SECTIONS_DATA.length, 9, `SECTIONS_DATA must contain exactly 9 themes, found ${g.SECTIONS_DATA.length}`);

      const expectedSecIds = ['sec_001', 'sec_002', 'sec_003', 'sec_004', 'sec_005', 'sec_006', 'sec_007', 'sec_008', 'sec_009'];
      g.SECTIONS_DATA.forEach((sec, idx) => {
        assert.strictEqual(sec.id, expectedSecIds[idx], `Section ${idx} ID mismatch: ${sec.id}`);
        assert.ok(sec.title && sec.title.trim().length > 0, `Section ${sec.id} missing title`);
        assert.ok(sec.subtitle && sec.subtitle.trim().length > 0, `Section ${sec.id} missing subtitle`);
        assert.ok(sec.desc && sec.desc.trim().length > 0, `Section ${sec.id} missing description`);
        assert.ok(Array.isArray(sec.vocab) && sec.vocab.length >= 10, `Section ${sec.id} must have >= 10 vocab items`);
        sec.vocab.forEach((v, vIdx) => {
          assert.ok(v.de && v.en, `Vocab item ${vIdx} in ${sec.id} missing de/en`);
        });
      });

      // 8 grammar domains in GRAMMAR_TOPICS
      assert.ok(Array.isArray(g.GRAMMAR_TOPICS), 'GRAMMAR_TOPICS must be an array');
      assert.strictEqual(g.GRAMMAR_TOPICS.length, 8, `GRAMMAR_TOPICS must contain exactly 8 topics, found ${g.GRAMMAR_TOPICS.length}`);

      const canonicalDomains = ['praesens', 'akkusativ', 'dativ', 'wechsel', 'trennbar', 'modal', 'satzbau', 'verneinung'];
      const topicIds = g.GRAMMAR_TOPICS.map(t => t.id);
      canonicalDomains.forEach(dom => {
        assert.ok(topicIds.includes(dom), `Missing canonical grammar domain: ${dom}`);
      });

      let totalSentences = 0;
      g.GRAMMAR_TOPICS.forEach(t => {
        const sentences = t.sentences || t.questions || [];
        assert.ok(sentences.length >= 20, `Topic ${t.id} contains fewer than 20 sentences: ${sentences.length}`);
        totalSentences += sentences.length;

        sentences.forEach((s, sIdx) => {
          assert.ok(s.id, `Sentence ${sIdx} in ${t.id} missing id`);
          assert.strictEqual(s.topicId, t.id, `Sentence ${s.id} topicId mismatch`);
          assert.ok(s.template && s.template.includes('{0}'), `Sentence ${s.id} missing {0} slot token`);
          assert.ok(Array.isArray(s.options) && s.options.length >= 2, `Sentence ${s.id} options must have >= 2 items`);
          assert.ok(typeof s.answer === 'number' && s.answer >= 0 && s.answer < s.options.length, `Sentence ${s.id} invalid answer index: ${s.answer}`);
          assert.ok(s.badge, `Sentence ${s.id} missing badge`);
          assert.ok(s.rule || s.explanation, `Sentence ${s.id} missing rule`);
          assert.ok(s.tip, `Sentence ${s.id} missing tip`);
          assert.ok(s.translation, `Sentence ${s.id} missing translation`);
        });
      });

      assert.ok(totalSentences >= 160, `Total grammar sentences (${totalSentences}) must be >= 160`);
      return `9 themes (${g.SECTIONS_DATA.length}), 8 canonical domains, ${totalSentences} sentences (>=160)`;
    }
  }
];

let allPassed = true;
let passedCount = 0;

checks.forEach(check => {
  try {
    const detail = check.run();
    console.log(` ✓ Check ${check.num}: ${check.name} (${detail})`);
    passedCount++;
  } catch (err) {
    console.error(` ✗ Check ${check.num}: ${check.name} FAILED: ${err.message}`);
    allPassed = false;
  }
});

console.log('\n===============================================================');
if (allPassed) {
  console.log(`Verification Summary: ${passedCount}/${checks.length} checks PASSED`);
  console.log('Status: ALL INTEGRITY CHECKS PASSED (Exit Code: 0)');
  console.log('===============================================================');
  process.exit(0);
} else {
  console.error(`Verification Summary: ${passedCount}/${checks.length} checks PASSED, ${checks.length - passedCount} FAILED`);
  console.error('Status: INTEGRITY CHECKS FAILED (Exit Code: 1)');
  console.log('===============================================================');
  process.exit(1);
}
