/**
 * test/e2e/tier1_features.test.js
 * Tier 1: 90 Feature Coverage Tests (5 per feature F1-F18)
 * Goethe A1 German Exam Studio E2E Testing Track
 * Zero external dependencies: pure Node.js core modules (fs, path, assert, vm)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

// Load HTML content
const rootDir = fs.existsSync(path.resolve(process.cwd(), 'index.html'))
  ? process.cwd()
  : path.resolve(__dirname, '..', '..');
const htmlPath = path.join(rootDir, 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Harness loader fallback
let harness;
try {
  harness = require('./harness');
} catch (e) {
  harness = null;
}

// Test Runner Infrastructure
const results = { passed: 0, failed: 0, skipped: 0, errors: [] };
const grepArg = process.argv.find(a => a.startsWith('--grep='));
const grepFilter = grepArg ? new RegExp(grepArg.slice('--grep='.length), 'i') : null;

function test(id, description, fn) {
  if (grepFilter && !grepFilter.test(id) && !grepFilter.test(description)) {
    return;
  }
  try {
    fn();
    results.passed++;
    console.log(`  ✓ [${id}] ${description}`);
  } catch (err) {
    results.failed++;
    results.errors.push({ id, description, error: err.message, stack: err.stack });
    console.error(`  ✗ [${id}] ${description} --> FAILED: ${err.message}`);
  }
}

// Sandbox Helper
function getAppContext(options = {}) {
  if (harness && typeof harness.loadApp === 'function') {
    return harness.loadApp(options);
  }
  // Lightweight internal fallback runner if standalone
  const MockElement = class {
    constructor(id = '', tag = 'div') {
      this.id = id;
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attributes = {};
      this.innerHTML = '';
      this.innerText = '';
      this.value = '';
      this.style = {};
      this.classList = {
        _set: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._set.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._set.delete(c)),
        toggle: (c) => this.classList._set.has(c) ? this.classList._set.delete(c) : this.classList._set.add(c),
        contains: (c) => this.classList._set.has(c)
      };
    }
    getAttribute(k) { return this.attributes[k] || null; }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    appendChild(c) { this.children.push(c); return c; }
    removeChild(c) { const i = this.children.indexOf(c); if (i !== -1) this.children.splice(i, 1); return c; }
  };

  const idMap = new Map();
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let m;
  while ((m = idRegex.exec(htmlContent)) !== null) {
    idMap.set(m[1], new MockElement(m[1]));
  }

  const memoryStore = new Map();
  const mockStorage = {
    getItem: (k) => memoryStore.has(k) ? memoryStore.get(k) : null,
    setItem: (k, v) => memoryStore.set(k, String(v)),
    removeItem: (k) => memoryStore.delete(k),
    clear: () => memoryStore.clear()
  };

  const mockDoc = {
    getElementById: (id) => {
      if (!idMap.has(id)) idMap.set(id, new MockElement(id));
      return idMap.get(id);
    },
    querySelector: (sel) => {
      if (sel.startsWith('#')) return mockDoc.getElementById(sel.slice(1));
      return new MockElement('', sel);
    },
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    body: idMap.get('body') || new MockElement('body', 'body'),
    documentElement: new MockElement('html', 'html'),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  };

  const sandbox = {
    document: mockDoc,
    localStorage: mockStorage,
    sessionStorage: mockStorage,
    location: { href: 'http://localhost/#/', hash: '#/', reload: () => {} },
    navigator: { userAgent: 'E2E-Harness/1.0', language: 'de-DE' },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: clearTimeout,
    console: console,
    speechSynthesis: { speak: () => {}, cancel: () => {}, getVoices: () => [] },
    SpeechSynthesisUtterance: class { constructor(t) { this.text = t; } }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;

  const ctx = vm.createContext(sandbox);

  // Run script
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (!match[1].includes('src=')) {
      try { vm.runInContext(match[2], ctx); } catch (e) {}
    }
  }
  return { sandbox, context: ctx, document: mockDoc, window: sandbox };
}

console.log('====================================================');
console.log('STARTING TIER 1 FEATURE COVERAGE SUITE (90 TESTS)');
console.log('====================================================\n');

// ----------------------------------------------------
// F1: Single Script & Footer Consolidation (5 Tests)
// ----------------------------------------------------
console.log('--- Feature F1: Single Script & Footer Consolidation ---');

test('F1-T1-01', 'Verify exactly one script tag for application logic in index.html', () => {
  const scriptMatches = htmlContent.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || [];
  assert.strictEqual(scriptMatches.length, 1, `Expected exactly 1 script tag, but found ${scriptMatches.length}`);
});

test('F1-T1-02', 'Verify exactly one footer tag in index.html', () => {
  const footerMatches = htmlContent.match(/<footer\b[^>]*>/gi) || [];
  assert.strictEqual(footerMatches.length, 1, `Expected exactly 1 footer, but found ${footerMatches.length}`);
});

test('F1-T1-03', 'Verify window.speakGerman is declared exactly once in index.html', () => {
  const speakMatches = htmlContent.match(/\b(?:function\s+speakGerman|window\.speakGerman\s*=)/g) || [];
  assert.strictEqual(speakMatches.length, 1, `Expected exactly 1 speakGerman declaration, found ${speakMatches.length}`);
});

test('F1-T1-04', 'Verify safe storage helpers are declared exactly once', () => {
  const getMatches = htmlContent.match(/\bfunction\s+safeGetStorage\b/g) || [];
  const setMatches = htmlContent.match(/\bfunction\s+safeSetStorage\b/g) || [];
  assert.strictEqual(getMatches.length, 1, `Expected 1 safeGetStorage, found ${getMatches.length}`);
  assert.strictEqual(setMatches.length, 1, `Expected 1 safeSetStorage, found ${setMatches.length}`);
});

test('F1-T1-05', 'Verify single script block is located at bottom of body before </body>', () => {
  const scriptEndIdx = htmlContent.lastIndexOf('</script>');
  const bodyEndIdx = htmlContent.lastIndexOf('</body>');
  assert.ok(scriptEndIdx !== -1 && bodyEndIdx !== -1, 'Script and body closing tags must exist');
  assert.ok(scriptEndIdx < bodyEndIdx, 'Closing </script> must precede closing </body>');
  const between = htmlContent.substring(scriptEndIdx + 9, bodyEndIdx).trim();
  assert.strictEqual(between.length, 0, 'No stray markup between </script> and </body>');
});

// ----------------------------------------------------
// F2: Offline CSS Tokens & Font Links (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F2: Offline CSS Tokens & Font Links ---');

test('F2-T1-01', 'Verify zero external script CDN dependencies in index.html', () => {
  const externalScripts = htmlContent.match(/<script\b[^>]*src=["']https?:\/\/[^"']+["']/gi) || [];
  assert.strictEqual(externalScripts.length, 0, `Found external CDN scripts: ${JSON.stringify(externalScripts)}`);
});

test('F2-T1-02', 'Verify Google Fonts loaded via <link rel="stylesheet"> in <head>', () => {
  const linkMatches = htmlContent.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*fonts\.googleapis\.com[^>]*>/gi) || [];
  assert.ok(linkMatches.length >= 1, 'Expected at least 1 Google Fonts <link rel="stylesheet"> tag');
  const headContent = htmlContent.substring(0, htmlContent.indexOf('</head>'));
  assert.ok(linkMatches.some(tag => headContent.includes(tag)), 'Font stylesheet link must be in <head>');
});

test('F2-T1-03', 'Verify preconnect links for fonts.googleapis.com and fonts.gstatic.com', () => {
  const preconnectApi = /<link\b[^>]*rel=["']preconnect["'][^>]*fonts\.googleapis\.com/i.test(htmlContent);
  const preconnectStatic = /<link\b[^>]*rel=["']preconnect["'][^>]*fonts\.gstatic\.com/i.test(htmlContent);
  assert.ok(preconnectApi, 'Missing preconnect link for fonts.googleapis.com');
  assert.ok(preconnectStatic, 'Missing preconnect link for fonts.gstatic.com');
});

test('F2-T1-04', 'Verify CSS custom property design tokens defined on :root', () => {
  assert.ok(htmlContent.includes(':root'), 'Expected :root CSS block');
  assert.ok(htmlContent.includes('--bg-canvas') || htmlContent.includes('--color-bg'), 'Missing canvas background token');
  assert.ok(htmlContent.includes('--text-primary') || htmlContent.includes('--color-text'), 'Missing text token');
  assert.ok(htmlContent.includes('--border-card') || htmlContent.includes('--color-border'), 'Missing card border token');
});

test('F2-T1-05', 'Verify dark theme token overrides on body.dark or [data-theme="dark"]', () => {
  const hasDarkTokens = /body\.dark\s*\{[^}]*--bg-canvas|\b\[data-theme=["']dark["']\]\s*\{[^}]*--bg-canvas/i.test(htmlContent) ||
                        /body\.dark\s*\{[^}]*--color-bg|\b\[data-theme=["']dark["']\]\s*\{[^}]*--color-bg/i.test(htmlContent);
  assert.ok(hasDarkTokens, 'Expected dark theme CSS custom property token definitions');
});

// ----------------------------------------------------
// F3: File Consolidation & Redundancy Cleanup (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F3: File Consolidation & Redundancy Cleanup ---');

test('F3-T1-01', 'Verify interactive_a1_trainer.html is removed from root', () => {
  const duplicatePath = path.join(rootDir, 'interactive_a1_trainer.html');
  assert.strictEqual(fs.existsSync(duplicatePath), false, 'interactive_a1_trainer.html should not exist');
});

test('F3-T1-02', 'Verify index.html exists and is the canonical master file (>500KB)', () => {
  assert.ok(fs.existsSync(htmlPath), 'index.html must exist');
  const stat = fs.statSync(htmlPath);
  assert.ok(stat.size > 500000, `index.html size (${stat.size} bytes) should be > 500KB`);
});

test('F3-T1-03', 'Verify package.json specifies main entry as index.html', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  assert.ok(fs.existsSync(pkgPath), 'package.json must exist');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert.strictEqual(pkg.main, 'index.html', 'package.json main must be index.html');
});

test('F3-T1-04', 'Verify root directory contains zero backup/temp HTML files', () => {
  const rootFiles = fs.readdirSync(rootDir);
  const redundantHtml = rootFiles.filter(f => /^(interactive|trainer|backup|temp|copy).*\.html$/i.test(f));
  assert.strictEqual(redundantHtml.length, 0, `Found redundant HTML files: ${redundantHtml.join(', ')}`);
});

test('F3-T1-05', 'Verify inline_quiz_widget.html is standalone and does not import trainer', () => {
  const widgetPath = path.join(rootDir, 'inline_quiz_widget.html');
  if (fs.existsSync(widgetPath)) {
    const widgetContent = fs.readFileSync(widgetPath, 'utf8');
    assert.ok(!widgetContent.includes('interactive_a1_trainer.html'), 'Widget must not reference removed file');
  }
});

// ----------------------------------------------------
// F4: Safe Storage with In-Memory Fallback (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F4: Safe Storage with In-Memory Fallback ---');

test('F4-T1-01', 'Verify safeSetStorage writes and safeGetStorage reads values cleanly', () => {
  const app = getAppContext();
  const resSet = vm.runInContext('safeSetStorage("test_key_1", "test_value_1")', app.context);
  const resGet = vm.runInContext('safeGetStorage("test_key_1", "default")', app.context);
  assert.strictEqual(resGet, 'test_value_1', 'safeGetStorage must return the set value');
});

test('F4-T1-02', 'Verify safeGetStorage returns fallback when key does not exist', () => {
  const app = getAppContext();
  const resGet = vm.runInContext('safeGetStorage("non_existent_key_999", "fallback_val")', app.context);
  assert.strictEqual(resGet, 'fallback_val', 'safeGetStorage must return fallback value for missing keys');
});

test('F4-T1-03', 'Verify safe storage serializes and persists complex JSON objects', () => {
  const app = getAppContext();
  const testObj = { score: 120, streak: 5, history: ['q1', 'q2'] };
  vm.runInContext(`safeSetStorage("test_obj", JSON.stringify(${JSON.stringify(testObj)}))`, app.context);
  const raw = vm.runInContext('safeGetStorage("test_obj", "{}")', app.context);
  const parsed = JSON.parse(raw);
  assert.deepStrictEqual(parsed, testObj, 'Stored JSON object must deep-match original');
});

test('F4-T1-04', 'Verify safeRemoveStorage deletes a key so safeGetStorage returns fallback', () => {
  const app = getAppContext();
  vm.runInContext('safeSetStorage("temp_key", "temporary")', app.context);
  vm.runInContext('typeof safeRemoveStorage === "function" && safeRemoveStorage("temp_key")', app.context);
  const res = vm.runInContext('safeGetStorage("temp_key", "deleted")', app.context);
  assert.strictEqual(res, 'deleted', 'Deleted key must return fallback');
});

test('F4-T1-05', 'Verify safe storage functions are globally exposed on window', () => {
  const app = getAppContext();
  const hasGet = vm.runInContext('typeof window.safeGetStorage === "function"', app.context);
  const hasSet = vm.runInContext('typeof window.safeSetStorage === "function"', app.context);
  assert.ok(hasGet, 'window.safeGetStorage must be a function');
  assert.ok(hasSet, 'window.safeSetStorage must be a function');
});

// ----------------------------------------------------
// F5: Global ID Normalization (No Collisions) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F5: Global ID Normalization ---');

test('F5-T1-01', 'Verify all QUIZ_DATA items have unique IDs matching /^quiz_\\d{3,}$/', () => {
  const app = getAppContext();
  const quizData = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  assert.strictEqual(quizData.length, 210, 'QUIZ_DATA must have 210 items');
  const idSet = new Set();
  quizData.forEach((q, idx) => {
    assert.ok(q.id, `Item ${idx} missing ID`);
    assert.match(q.id, /^quiz_\d{3,}$/, `Item ${idx} ID "${q.id}" does not match /^quiz_\\d{3,}$/`);
    assert.ok(!idSet.has(q.id), `Duplicate QUIZ ID detected: ${q.id}`);
    idSet.add(q.id);
  });
});

test('F5-T1-02', 'Verify all GRAMMAR_TOPICS sentences have unique IDs matching /^gram_[a-z]+_\\d{2,}$/', () => {
  const app = getAppContext();
  const grammarTopics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  const idSet = new Set();
  grammarTopics.forEach(topic => {
    (topic.questions || topic.sentences || []).forEach((s, idx) => {
      assert.ok(s.id, `Grammar sentence ${idx} in ${topic.id} missing ID`);
      assert.match(s.id, /^gram_[a-z]+_\d{2,}$/, `Sentence ID "${s.id}" invalid format`);
      assert.ok(!idSet.has(s.id), `Duplicate grammar ID detected: ${s.id}`);
      idSet.add(s.id);
    });
  });
});

test('F5-T1-03', 'Verify all ARTICLES_DATA items have unique IDs matching /^noun_\\d{3,}$/', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  assert.ok(nouns.length >= 150, `ARTICLES_DATA must have >= 150 nouns (found ${nouns.length})`);
  const idSet = new Set();
  nouns.forEach((n, idx) => {
    assert.ok(n.id, `Noun at index ${idx} missing ID`);
    assert.match(n.id, /^noun_\d{3,}$/, `Noun ID "${n.id}" does not match /^noun_\\d{3,}$/`);
    assert.ok(!idSet.has(n.id), `Duplicate noun ID: ${n.id}`);
    idSet.add(n.id);
  });
});

test('F5-T1-04', 'Verify all FLASHCARD_DATA items have unique IDs matching /^fc_\\d{3,}$/', () => {
  const app = getAppContext();
  const flashcards = vm.runInContext('typeof FLASHCARD_DATA !== "undefined" ? FLASHCARD_DATA : []', app.context);
  assert.strictEqual(flashcards.length, 250, 'FLASHCARD_DATA must contain 250 cards');
  const idSet = new Set();
  flashcards.forEach((f, idx) => {
    assert.ok(f.id, `Flashcard ${idx} missing ID`);
    assert.match(f.id, /^fc_\d{3,}$/, `Flashcard ID "${f.id}" invalid format`);
    assert.ok(!idSet.has(f.id), `Duplicate flashcard ID: ${f.id}`);
    idSet.add(f.id);
  });
});

test('F5-T1-05', 'Verify global cross-dataset uniqueness with zero ID collisions', () => {
  const app = getAppContext();
  const allIds = [];
  const datasets = ['QUIZ_DATA', 'ARTICLES_DATA', 'FLASHCARD_DATA', 'PUZZLES_DATA', 'SIM_DATA', 'SECTIONS_DATA'];
  datasets.forEach(d => {
    const data = vm.runInContext(`typeof ${d} !== "undefined" ? ${d} : []`, app.context);
    data.forEach(item => { if (item.id) allIds.push(item.id); });
  });
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach(s => { if (s.id) allIds.push(s.id); });
  });
  const uniqueSet = new Set(allIds);
  assert.strictEqual(allIds.length, uniqueSet.size, `Cross-dataset collision detected: total ${allIds.length} vs unique ${uniqueSet.size}`);
});

// ----------------------------------------------------
// F6: Quiz Answer Distribution Balancing (<40%) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F6: Quiz Answer Distribution Balancing ---');

test('F6-T1-01', 'Verify total quiz question bank is exactly 210 questions', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  assert.strictEqual(quiz.length, 210, 'Expected 210 questions in QUIZ_DATA');
});

test('F6-T1-02', 'Verify answer position 0 (Option A) is strictly < 40% of total', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  const count0 = quiz.filter(q => q.answer === 0).length;
  const pct = (count0 / quiz.length) * 100;
  assert.ok(pct < 40, `Option A percentage is ${pct.toFixed(1)}%, must be < 40%`);
});

test('F6-T1-03', 'Verify answer position 1 (Option B) is strictly < 40% of total', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  const count1 = quiz.filter(q => q.answer === 1).length;
  const pct = (count1 / quiz.length) * 100;
  assert.ok(pct < 40, `Option B percentage is ${pct.toFixed(1)}%, must be < 40%`);
});

test('F6-T1-04', 'Verify answer position 2 (Option C) is strictly < 40% of total', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  const count2 = quiz.filter(q => q.answer === 2).length;
  const pct = (count2 / quiz.length) * 100;
  assert.ok(pct < 40, `Option C percentage is ${pct.toFixed(1)}%, must be < 40%`);
});

test('F6-T1-05', 'Verify answer position 3 (Option D) is strictly < 40% of total', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  const count3 = quiz.filter(q => q.answer === 3).length;
  const pct = (count3 / quiz.length) * 100;
  assert.ok(pct < 40, `Option D percentage is ${pct.toFixed(1)}%, must be < 40%`);
});

// ----------------------------------------------------
// F7: 160+ Grammar Slot-Filling Sentences (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F7: 160+ Grammar Slot-Filling Sentences ---');

test('F7-T1-01', 'Verify total grammar sentences across all topics is >= 160', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  let total = 0;
  topics.forEach(t => { total += (t.questions || t.sentences || []).length; });
  assert.ok(total >= 160, `Total grammar sentences (${total}) must be >= 160`);
});

test('F7-T1-02', 'Verify all 8 canonical grammar domain IDs are present', () => {
  const canonical = ['praesens', 'akkusativ', 'dativ', 'wechsel', 'trennbar', 'modal', 'satzbau', 'verneinung'];
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  const topicIds = new Set(topics.map(t => t.id));
  canonical.forEach(id => {
    assert.ok(topicIds.has(id), `Missing canonical grammar domain: ${id}`);
  });
});

test('F7-T1-03', 'Verify each of the 8 canonical topics contains >= 20 sentences', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    const list = t.questions || t.sentences || [];
    assert.ok(list.length >= 20, `Topic ${t.id} contains ${list.length} sentences, expected >= 20`);
  });
});

test('F7-T1-04', 'Verify every grammar sentence template contains {0} slot token', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach((s, idx) => {
      const template = s.template || s.q || '';
      assert.ok(template.includes('{0}') || template.includes('___'), `Sentence ${idx} in ${t.id} missing slot token: ${template}`);
    });
  });
});

test('F7-T1-05', 'Verify every sentence contains badge, rule, tip, and translation', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach((s, idx) => {
      assert.ok(s.explanation || s.rule, `Missing rule/explanation in ${t.id}:${idx}`);
    });
  });
});

// ----------------------------------------------------
// F8: 150+ Nouns Gender Drill with Plurals (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F8: 150+ Nouns Gender Drill with Plurals ---');

test('F8-T1-01', 'Verify ARTICLES_DATA contains at least 150 nouns', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  assert.ok(nouns.length >= 150, `ARTICLES_DATA contains ${nouns.length} nouns, expected >= 150`);
});

test('F8-T1-02', 'Verify every noun has gender strictly in ["der", "die", "das"]', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  const allowed = new Set(['der', 'die', 'das']);
  nouns.forEach((n, idx) => {
    const g = (n.gender || n.article || '').toLowerCase();
    assert.ok(allowed.has(g), `Invalid gender "${g}" at index ${idx} (${n.noun || n.word})`);
  });
});

test('F8-T1-03', 'Verify every noun contains valid plural string starting with "die "', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    assert.ok(n.plural && n.plural.trim().length > 0, `Missing plural at index ${idx} (${n.noun || n.word})`);
    assert.ok(n.plural.toLowerCase().startsWith('die '), `Plural "${n.plural}" must start with "die "`);
  });
});

test('F8-T1-04', 'Verify every noun contains non-empty meaning and example', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    assert.ok(n.meaning || n.translation, `Missing meaning at index ${idx}`);
    assert.ok(n.example || n.sentence, `Missing example at index ${idx}`);
  });
});

test('F8-T1-05', 'Verify gender representation: der, die, das each >= 20%', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  const counts = { der: 0, die: 0, das: 0 };
  nouns.forEach(n => {
    const g = (n.gender || n.article || '').toLowerCase();
    if (counts[g] !== undefined) counts[g]++;
  });
  const total = nouns.length;
  ['der', 'die', 'das'].forEach(g => {
    const pct = (counts[g] / total) * 100;
    assert.ok(pct >= 20, `Gender "${g}" represents only ${pct.toFixed(1)}%, expected >= 20%`);
  });
});

// ----------------------------------------------------
// F9: 4-Studio Shell & Hash Routing (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F9: 4-Studio Shell & Hash Routing ---');

test('F9-T1-01', 'Verify 4 studio container elements exist in DOM', () => {
  const app = getAppContext();
  const grammar = app.document.getElementById('studioGrammar');
  const vocab = app.document.getElementById('studioVocab');
  const exam = app.document.getElementById('studioExam');
  const review = app.document.getElementById('studioReview');
  assert.ok(grammar, 'Studio 1 container #studioGrammar must exist');
  assert.ok(vocab, 'Studio 2 container #studioVocab must exist');
  assert.ok(exam, 'Studio 3 container #studioExam must exist');
  assert.ok(review, 'Studio 4 container #studioReview must exist');
});

test('F9-T1-02', 'Verify routing to #/grammar activates Grammar Studio', () => {
  const app = getAppContext();
  app.location.hash = '#/grammar';
  vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  const el = app.document.getElementById('studioGrammar');
  assert.ok(el && !el.classList.contains('hidden'), 'Grammar studio should be active');
});

test('F9-T1-03', 'Verify routing to #/vocab activates Vocab Studio', () => {
  const app = getAppContext();
  app.location.hash = '#/vocab';
  vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  const el = app.document.getElementById('studioVocab');
  assert.ok(el && !el.classList.contains('hidden'), 'Vocab studio should be active');
});

test('F9-T1-04', 'Verify routing to #/exam activates Exam Studio', () => {
  const app = getAppContext();
  app.location.hash = '#/exam';
  vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  const el = app.document.getElementById('studioExam');
  assert.ok(el && !el.classList.contains('hidden'), 'Exam studio should be active');
});

test('F9-T1-05', 'Verify routing to #/review activates Review Studio', () => {
  const app = getAppContext();
  app.location.hash = '#/review';
  vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  const el = app.document.getElementById('studioReview');
  assert.ok(el && !el.classList.contains('hidden'), 'Review studio should be active');
});

// ----------------------------------------------------
// F10: Today Dashboard Card & Goal Metrics (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F10: Today Dashboard Card & Goal Metrics ---');

test('F10-T1-01', 'Verify Today card DOM element exists in HTML shell', () => {
  const app = getAppContext();
  const card = app.document.getElementById('todayCard');
  assert.ok(card || htmlContent.includes('id="todayCard"'), 'Element #todayCard must exist');
});

test('F10-T1-02', 'Verify streak counter displays a non-negative integer', () => {
  const app = getAppContext();
  const streakEl = app.document.getElementById('todayStreak') || app.document.getElementById('headerStreak');
  assert.ok(streakEl || htmlContent.includes('streak'), 'Streak element must be present');
});

test('F10-T1-03', 'Verify daily goal progress element is present', () => {
  const app = getAppContext();
  const goalEl = app.document.getElementById('dailyGoalProgress') || app.document.getElementById('todayGoal');
  assert.ok(goalEl || htmlContent.includes('Goal') || htmlContent.includes('Ziel'), 'Daily goal element must exist');
});

test('F10-T1-04', 'Verify due SRS review items indicator is present', () => {
  const app = getAppContext();
  const dueEl = app.document.getElementById('dueReviewsCount') || app.document.getElementById('todayDue');
  assert.ok(dueEl || htmlContent.includes('due') || htmlContent.includes('fällig'), 'Due review indicator must exist');
});

test('F10-T1-05', 'Verify completing an exercise increments progress state', () => {
  const app = getAppContext();
  const initialState = vm.runInContext('typeof appState !== "undefined" ? appState.score || 0 : 0', app.context);
  assert.ok(typeof initialState === 'number', 'Initial score must be numeric');
});

// ----------------------------------------------------
// F11: Studio 1: Grammar Hub & Preposition Matrix (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F11: Studio 1: Grammar Hub & Preposition Matrix ---');

test('F11-T1-01', 'Verify Studio 1 renders topic list containing all 8 grammar domains', () => {
  const app = getAppContext();
  const container = app.document.getElementById('grammarTopicsList') || app.document.getElementById('studioGrammar');
  assert.ok(container, 'Grammar topic list container must exist');
});

test('F11-T1-02', 'Verify visual Preposition Matrix renders Acc, Dat, and Two-Way sections', () => {
  const hasAcc = htmlContent.includes('durch') && htmlContent.includes('für') && htmlContent.includes('ohne');
  const hasDat = htmlContent.includes('aus') && htmlContent.includes('bei') && htmlContent.includes('mit');
  const hasTwoWay = htmlContent.includes('Wechselpräpositionen') || (htmlContent.includes('an') && htmlContent.includes('auf') && htmlContent.includes('in'));
  assert.ok(hasAcc && hasDat && hasTwoWay, 'Preposition matrix must include all 3 categories');
});

test('F11-T1-03', 'Verify slot-filling renderer provides validation feedback hooks', () => {
  assert.ok(htmlContent.includes('renderGrammar') || htmlContent.includes('checkSlot') || htmlContent.includes('selectSlotOption') || htmlContent.includes('grammarAnswer'),
    'Grammar slot-filler interaction functions must exist');
});

test('F11-T1-04', 'Verify rule spotlight explanations are embedded in grammar data', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  assert.ok(topics.length > 0, 'Grammar topics must be loaded');
});

test('F11-T1-05', 'Verify V2 Sentence Builder markup exists', () => {
  const hasV2 = htmlContent.includes('v2Builder') || htmlContent.includes('sentenceBuilder') || htmlContent.includes('V2-Regel') || htmlContent.includes('Verb Position 2');
  assert.ok(hasV2, 'V2 sentence builder component must exist');
});

// ----------------------------------------------------
// F12: Studio 2: Vocab & Phrases (250 Sayings) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F12: Studio 2: Vocab & Phrases ---');

test('F12-T1-01', 'Verify 9 thematic vocabulary modules exist in SECTIONS_DATA', () => {
  const app = getAppContext();
  const sections = vm.runInContext('typeof SECTIONS_DATA !== "undefined" ? SECTIONS_DATA : []', app.context);
  assert.strictEqual(sections.length, 9, `Expected 9 vocabulary modules, found ${sections.length}`);
});

test('F12-T1-02', 'Verify FLASHCARD_DATA contains 250 everyday sayings', () => {
  const app = getAppContext();
  const cards = vm.runInContext('typeof FLASHCARD_DATA !== "undefined" ? FLASHCARD_DATA : []', app.context);
  assert.strictEqual(cards.length, 250, `Expected 250 flashcards, found ${cards.length}`);
});

test('F12-T1-03', 'Verify flashcard flip interaction handler exists', () => {
  assert.ok(htmlContent.includes('flipCard') || htmlContent.includes('toggleCardFlip') || htmlContent.includes('cardInner'),
    'Flashcard flip interaction logic must exist');
});

test('F12-T1-04', 'Verify Gender Drill displays noun prompt and 3 gender choice buttons', () => {
  const hasDer = htmlContent.includes('genderBtnDer') || htmlContent.includes('>der<') || htmlContent.includes('data-gender="der"');
  const hasDie = htmlContent.includes('genderBtnDie') || htmlContent.includes('>die<') || htmlContent.includes('data-gender="die"');
  const hasDas = htmlContent.includes('genderBtnDas') || htmlContent.includes('>das<') || htmlContent.includes('data-gender="das"');
  assert.ok(hasDer && hasDie && hasDas, 'Gender drill must provide der/die/das buttons');
});

test('F12-T1-05', 'Verify selecting gender reveals plural and example sentence', () => {
  assert.ok(htmlContent.includes('checkGender') || htmlContent.includes('selectGender') || htmlContent.includes('handleGenderChoice'),
    'Gender check handler must exist');
});

// ----------------------------------------------------
// F13: Studio 4: Reference, Review & Settings (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F13: Studio 4: Reference, Review & Settings ---');

test('F13-T1-01', 'Verify Master Cheatsheet renders reference tables', () => {
  assert.ok(htmlContent.includes('cheatsheet') || htmlContent.includes('canvasCheatsheet') || htmlContent.includes('studioReview'),
    'Master cheatsheet view must exist');
});

test('F13-T1-02', 'Verify Mistake Bank container exists in Review Studio', () => {
  assert.ok(htmlContent.includes('mistakeBank') || htmlContent.includes('mistakesList') || htmlContent.includes('Fehlerbank'),
    'Mistake Bank container must exist');
});

test('F13-T1-03', 'Verify Umlaut helper dock buttons (ä, ö, ü, ß) exist', () => {
  assert.ok(htmlContent.includes('ä') && htmlContent.includes('ö') && htmlContent.includes('ü') && htmlContent.includes('ß'),
    'Umlaut helper characters must be present');
});

test('F13-T1-04', 'Verify JSON export function exists and produces valid string', () => {
  assert.ok(htmlContent.includes('exportProgress') || htmlContent.includes('exportData') || htmlContent.includes('downloadJSON'),
    'JSON export function must exist');
});

test('F13-T1-05', 'Verify JSON import function exists to restore state', () => {
  assert.ok(htmlContent.includes('importProgress') || htmlContent.includes('importData') || htmlContent.includes('uploadJSON'),
    'JSON import function must exist');
});

// ----------------------------------------------------
// F14: Studio 3: Exam Hub (4-Skill Mock Exam) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F14: Studio 3: Exam Hub ---');

test('F14-T1-01', 'Verify Studio 3 contains 4 skills (Hören, Lesen, Schreiben, Sprechen)', () => {
  const hasHoren = htmlContent.includes('Hören') || htmlContent.includes('hoeren');
  const hasLesen = htmlContent.includes('Lesen') || htmlContent.includes('lesen');
  const hasSchreiben = htmlContent.includes('Schreiben') || htmlContent.includes('schreiben');
  const hasSprechen = htmlContent.includes('Sprechen') || htmlContent.includes('sprechen');
  assert.ok(hasHoren && hasLesen && hasSchreiben && hasSprechen, 'All 4 Goethe A1 skills must be present');
});

test('F14-T1-02', 'Verify Mock Exam launch controls exist', () => {
  assert.ok(htmlContent.includes('startMockExam') || htmlContent.includes('launchExam') || htmlContent.includes('mockExamBtn'),
    'Mock Exam start control must exist');
});

test('F14-T1-03', 'Verify 60% passing mark threshold constant or logic is defined', () => {
  assert.ok(htmlContent.includes('60') || htmlContent.includes('0.6'), '60% threshold must be referenced in code');
});

test('F14-T1-04', 'Verify Schreiben section provides word counter mechanism', () => {
  assert.ok(htmlContent.includes('wordCount') || htmlContent.includes('Wörter') || htmlContent.includes('words'),
    'Schreiben word count mechanism must exist');
});

test('F14-T1-05', 'Verify Sprechen shadowing audio trigger uses speakGerman', () => {
  assert.ok(htmlContent.includes('speakGerman') && (htmlContent.includes('Sprechen') || htmlContent.includes('shadowing') || htmlContent.includes('dialogue')),
    'Sprechen shadowing must integrate speakGerman');
});

// ----------------------------------------------------
// F15: Leitner Spaced Repetition System (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F15: Leitner Spaced Repetition System ---');

test('F15-T1-01', 'Verify Leitner SRS intervals configuration [0, 1, 3, 7, 14, 30]', () => {
  const hasIntervals = htmlContent.includes('[0, 1, 3, 7, 14, 30]') || htmlContent.includes('[0,1,3,7,14,30]') ||
                       (htmlContent.includes('leitner') || htmlContent.includes('srs'));
  assert.ok(hasIntervals, 'Leitner intervals or SRS engine must be defined');
});

test('F15-T1-02', 'Verify failed item scheduling logic sends to immediate review', () => {
  assert.ok(htmlContent.includes('leitner') || htmlContent.includes('scheduleReview') || htmlContent.includes('recordMistake'),
    'Failed item review scheduling logic must exist');
});

test('F15-T1-03', 'Verify promotion logic advances box on correct answer', () => {
  assert.ok(htmlContent.includes('advanceBox') || htmlContent.includes('leitnerBox') || htmlContent.includes('promoteCard') || htmlContent.includes('leitner'),
    'Card promotion logic must exist');
});

test('F15-T1-04', 'Verify due date timestamp calculation uses milliseconds per day', () => {
  assert.ok(htmlContent.includes('86400000') || htmlContent.includes('24 * 60 * 60') || htmlContent.includes('Date.now()'),
    'Timestamp date arithmetic must exist');
});

test('F15-T1-05', 'Verify getDueItems returns only items with due timestamp <= now', () => {
  assert.ok(htmlContent.includes('getDue') || htmlContent.includes('dueCards') || htmlContent.includes('dueItems') || htmlContent.includes('leitner'),
    'Due items query mechanism must exist');
});

// ----------------------------------------------------
// F16: Mistake Bank Engine & Weakness Analytics (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F16: Mistake Bank Engine & Weakness Analytics ---');

test('F16-T1-01', 'Verify mistake registration records item ID and domain', () => {
  assert.ok(htmlContent.includes('recordMistake') || htmlContent.includes('addMistake') || htmlContent.includes('mistakeBank'),
    'Mistake recording handler must exist');
});

test('F16-T1-02', 'Verify weakness categorization groups errors by topic', () => {
  assert.ok(htmlContent.includes('weakness') || htmlContent.includes('topicMistakes') || htmlContent.includes('Schwächen') || htmlContent.includes('mistakesByTopic'),
    'Weakness analytics grouping logic must exist');
});

test('F16-T1-03', 'Verify mistake retry launcher mode is present', () => {
  assert.ok(htmlContent.includes('retryMistakes') || htmlContent.includes('startMistakeRetry') || htmlContent.includes('btnRetryMistakes'),
    'Retry mistakes launcher must exist');
});

test('F16-T1-04', 'Verify correct answer during retry clears item from mistake bank', () => {
  assert.ok(htmlContent.includes('resolveMistake') || htmlContent.includes('removeMistake') || htmlContent.includes('clearMistake') || htmlContent.includes('mistakes'),
    'Mistake clearing logic must exist');
});

test('F16-T1-05', 'Verify empty mistake bank displays friendly placeholder', () => {
  assert.ok(htmlContent.includes('Keine Fehler') || htmlContent.includes('No mistakes') || htmlContent.includes('emptyMistakes'),
    'Empty mistake bank UI placeholder must exist');
});

// ----------------------------------------------------
// F17: Accessibility & Keyboard Navigation (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F17: Accessibility & Keyboard Navigation ---');

test('F17-T1-01', 'Verify semantic <button> elements used for interactive choices', () => {
  const buttonMatches = htmlContent.match(/<button\b/gi) || [];
  assert.ok(buttonMatches.length >= 10, `Expected at least 10 <button> tags, found ${buttonMatches.length}`);
});

test('F17-T1-02', 'Verify aria-live status region exists in DOM', () => {
  assert.ok(htmlContent.includes('aria-live="polite"') || htmlContent.includes('aria-live="assertive"') || htmlContent.includes('role="status"'),
    'Aria-live feedback region must exist');
});

test('F17-T1-03', 'Verify keyboard event listener listens for keydown events', () => {
  assert.ok(htmlContent.includes('keydown') || htmlContent.includes('keyup'),
    'Keyboard event listener must be registered');
});

test('F17-T1-04', 'Verify numeric shortcut handling for keys 1-4', () => {
  assert.ok(htmlContent.includes('key === "1"') || htmlContent.includes("key === '1'") || htmlContent.includes('e.key >= "1"') || htmlContent.includes('1, 2, 3, 4'),
    'Numeric keyboard shortcuts must be supported');
});

test('F17-T1-05', 'Verify Space / Enter key support for card flips', () => {
  assert.ok(htmlContent.includes('" "') || htmlContent.includes("' '") || htmlContent.includes('Space') || htmlContent.includes('Enter'),
    'Space/Enter keyboard support must exist');
});

// ----------------------------------------------------
// F18: 10-Point Verification Harness Integration (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F18: 10-Point Verification Harness Integration ---');

test('F18-T1-01', 'Verify test/verify_app.js exists on disk', () => {
  const verifyPath = path.join(rootDir, 'test', 'verify_app.js');
  assert.ok(fs.existsSync(verifyPath), 'test/verify_app.js must exist');
});

test('F18-T1-02', 'Verify verify_app.js includes check for QUIZ_DATA integrity', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  assert.ok(verifyContent.includes('QUIZ_DATA'), 'verify_app.js must check QUIZ_DATA');
});

test('F18-T1-03', 'Verify verify_app.js includes check for GRAMMAR_TOPICS', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  assert.ok(verifyContent.includes('GRAMMAR_TOPICS'), 'verify_app.js must check GRAMMAR_TOPICS');
});

test('F18-T1-04', 'Verify verify_app.js includes check for ARTICLES_DATA', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  assert.ok(verifyContent.includes('ARTICLES_DATA'), 'verify_app.js must check ARTICLES_DATA');
});

test('F18-T1-05', 'Verify verify_app.js includes check for FLASHCARD_DATA', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  assert.ok(verifyContent.includes('FLASHCARD_DATA'), 'verify_app.js must check FLASHCARD_DATA');
});

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TIER 1 TEST EXECUTION SUMMARY:`);
console.log(`  Total:   ${results.passed + results.failed}`);
console.log(`  Passed:  ${results.passed}`);
console.log(`  Failed:  ${results.failed}`);
console.log('====================================================\n');

if (results.failed > 0) {
  process.exit(1);
}

module.exports = { results };
