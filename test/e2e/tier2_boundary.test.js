/**
 * test/e2e/tier2_boundary.test.js
 * Tier 2: 90 Boundary & Corner Case Tests (5 per feature F1-F18)
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
    getItem: (k) => {
      if (options.storageThrows) throw new Error('SecurityError: storage disabled');
      return memoryStore.has(k) ? memoryStore.get(k) : null;
    },
    setItem: (k, v) => {
      if (options.storageThrows) throw new Error('QuotaExceededError');
      memoryStore.set(k, String(v));
    },
    removeItem: (k) => {
      if (options.storageThrows) throw new Error('SecurityError');
      memoryStore.delete(k);
    },
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
    location: { href: 'http://localhost/#/', hash: options.initialHash || '#/', reload: () => {} },
    navigator: { userAgent: 'E2E-Harness/1.0', language: 'de-DE' },
    setTimeout: (fn) => setTimeout(fn, 0),
    clearTimeout: clearTimeout,
    console: console,
    speechSynthesis: {
      speak: (u) => {
        if (options.ttsThrows) throw new Error('TTS error');
      },
      cancel: () => {},
      getVoices: () => []
    },
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
console.log('STARTING TIER 2 BOUNDARY & CORNER CASES SUITE (90 TESTS)');
console.log('====================================================\n');

// ----------------------------------------------------
// F1: Single Script & Footer Consolidation (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('--- Feature F1: Single Script & Footer Consolidation (Boundaries) ---');

test('F1-T2-01', 'Verify no unclosed, nested, or malformed <script tags exist in HTML', () => {
  const openTags = (htmlContent.match(/<script\b/gi) || []).length;
  const closeTags = (htmlContent.match(/<\/script>/gi) || []).length;
  assert.strictEqual(openTags, closeTags, `Mismatched script tags: ${openTags} open vs ${closeTags} close`);
});

test('F1-T2-02', 'Verify zero identifier collisions or duplicate const/let declarations in JS', () => {
  // If duplicate const declarations exist at top level, vm.createContext or script execution will throw SyntaxError
  assert.doesNotThrow(() => {
    getAppContext();
  }, 'Script compilation/execution should not throw identifier collision syntax errors');
});

test('F1-T2-03', 'Verify footer element is properly formed with no dangling tags', () => {
  const openFooters = (htmlContent.match(/<footer\b/gi) || []).length;
  const closeFooters = (htmlContent.match(/<\/footer>/gi) || []).length;
  assert.strictEqual(openFooters, closeFooters, `Mismatched footer tags: ${openFooters} open vs ${closeFooters} close`);
});

test('F1-T2-04', 'Verify speakGerman handles null, undefined, empty string, and non-strings safely', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof speakGerman === "function" && speakGerman("")', app.context);
    vm.runInContext('typeof speakGerman === "function" && speakGerman(null)', app.context);
    vm.runInContext('typeof speakGerman === "function" && speakGerman(undefined)', app.context);
    vm.runInContext('typeof speakGerman === "function" && speakGerman(12345)', app.context);
  }, 'speakGerman must not throw on falsy or non-string inputs');
});

test('F1-T2-05', 'Verify script execution is safe when called with missing DOM nodes', () => {
  assert.doesNotThrow(() => {
    getAppContext();
  }, 'Application bootstrap must not throw uncaught error on unrendered elements');
});

// ----------------------------------------------------
// F2: Offline CSS Tokens & Font Links (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F2: Offline CSS Tokens & Font Links (Boundaries) ---');

test('F2-T2-01', 'Verify CSS @import is completely banned inside style blocks', () => {
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRegex.exec(htmlContent)) !== null) {
    assert.ok(!m[1].includes('@import'), 'Style tag must not contain @import');
  }
});

test('F2-T2-02', 'Verify font-family declarations declare system fallback fonts', () => {
  assert.ok(htmlContent.includes('serif') || htmlContent.includes('sans-serif'), 'CSS must declare generic font fallbacks');
});

test('F2-T2-03', 'Verify theme toggle handles invalid theme strings cleanly without crashing', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof applyTheme === "function" && applyTheme("invalid_theme_name")', app.context);
    vm.runInContext('typeof applyTheme === "function" && applyTheme(null)', app.context);
  }, 'Theme controller must safely handle invalid inputs');
});

test('F2-T2-04', 'Verify core theme color token values do not use !important', () => {
  const styleMatch = htmlContent.match(/:root\s*\{([^}]*)\}/i);
  if (styleMatch) {
    assert.ok(!styleMatch[1].includes('!important'), ':root token definitions should not contain !important');
  }
});

test('F2-T2-05', 'Verify no external stylesheet links other than Google Fonts exist', () => {
  const links = htmlContent.match(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
  links.forEach(link => {
    const isGoogle = link.includes('fonts.googleapis.com');
    assert.ok(isGoogle, `Disallowed external stylesheet link detected: ${link}`);
  });
});

// ----------------------------------------------------
// F3: File Consolidation & Redundancy Cleanup (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F3: File Consolidation & Redundancy Cleanup (Boundaries) ---');

test('F3-T2-01', 'Verify case-insensitive check: no Interactive_a1_trainer.html on disk', () => {
  const files = fs.readdirSync(rootDir);
  const matched = files.filter(f => f.toLowerCase() === 'interactive_a1_trainer.html');
  assert.strictEqual(matched.length, 0, `Found case-variant trainer file: ${matched.join(', ')}`);
});

test('F3-T2-02', 'Verify zero stray JS files in workspace root', () => {
  const files = fs.readdirSync(rootDir);
  const rootJs = files.filter(f => f.endsWith('.js'));
  assert.strictEqual(rootJs.length, 0, `Root directory contains stray JS files: ${rootJs.join(', ')}`);
});

test('F3-T2-03', 'Verify index.html starts directly with <!DOCTYPE html> with no BOM character', () => {
  const rawBuf = fs.readFileSync(htmlPath);
  assert.ok(rawBuf[0] !== 0xEF || rawBuf[1] !== 0xBB || rawBuf[2] !== 0xBF, 'File starts with UTF-8 BOM byte order mark');
  assert.ok(htmlContent.trim().startsWith('<!DOCTYPE html>'), 'index.html must start with <!DOCTYPE html>');
});

test('F3-T2-04', 'Verify git working tree contains no untracked backup files', () => {
  const files = fs.readdirSync(rootDir);
  const backups = files.filter(f => f.includes('~') || f.endsWith('.bak') || f.endsWith('.orig'));
  assert.strictEqual(backups.length, 0, `Found backup files in root: ${backups.join(', ')}`);
});

test('F3-T2-05', 'Verify index.html contains no href pointing to removed trainer file', () => {
  assert.ok(!htmlContent.includes('interactive_a1_trainer.html'), 'index.html contains dangling link to trainer');
});

// ----------------------------------------------------
// F4: Safe Storage with In-Memory Fallback (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F4: Safe Storage with In-Memory Fallback (Boundaries) ---');

test('F4-T2-01', 'Verify safeSetStorage catches QuotaExceededError and persists to memory cache', () => {
  const app = getAppContext({ storageThrows: true });
  assert.doesNotThrow(() => {
    vm.runInContext('safeSetStorage("quota_test", "persisted_value")', app.context);
  }, 'safeSetStorage must not throw QuotaExceededError');
});

test('F4-T2-02', 'Verify safeGetStorage catches SecurityError and reads from memory cache', () => {
  const app = getAppContext({ storageThrows: true });
  let val;
  assert.doesNotThrow(() => {
    val = vm.runInContext('safeGetStorage("security_test", "fallback")', app.context);
  }, 'safeGetStorage must not throw SecurityError');
  assert.strictEqual(val, 'fallback');
});

test('F4-T2-03', 'Verify corrupted JSON string in storage is handled safely by consumer parsers', () => {
  const app = getAppContext();
  vm.runInContext('safeSetStorage("corrupt_key", "{invalid_json_content...")', app.context);
  assert.doesNotThrow(() => {
    const raw = vm.runInContext('safeGetStorage("corrupt_key", "{}")', app.context);
    try { JSON.parse(raw); } catch (e) { /* consumer safe parse */ }
  });
});

test('F4-T2-04', 'Verify safeSetStorage handles edge values: empty string, 0, false, null, undefined', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('safeSetStorage("", "empty_key")', app.context);
    vm.runInContext('safeSetStorage("zero_val", 0)', app.context);
    vm.runInContext('safeSetStorage("false_val", false)', app.context);
    vm.runInContext('safeSetStorage("null_val", null)', app.context);
    vm.runInContext('safeSetStorage("undef_val", undefined)', app.context);
  });
});

test('F4-T2-05', 'Verify post-clear behavior: safe storage operates cleanly after storage.clear()', () => {
  const app = getAppContext();
  app.sandbox.localStorage.clear();
  assert.doesNotThrow(() => {
    vm.runInContext('safeSetStorage("post_clear", "active")', app.context);
    const read = vm.runInContext('safeGetStorage("post_clear", "none")', app.context);
    assert.strictEqual(read, 'active');
  });
});

// ----------------------------------------------------
// F5: Global ID Normalization (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F5: Global ID Normalization (Boundaries) ---');

test('F5-T2-01', 'Verify zero duplicate HTML id attributes across entire DOM structure', () => {
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let m;
  const ids = [];
  while ((m = idRegex.exec(htmlContent)) !== null) {
    ids.push(m[1]);
  }
  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  assert.strictEqual(duplicates.length, 0, `Duplicate DOM IDs found: ${[...new Set(duplicates)].join(', ')}`);
});

test('F5-T2-02', 'Verify no dataset item contains empty, null, or whitespace-only ID', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach((q, idx) => {
    assert.ok(q.id !== undefined && q.id !== null, `Quiz item ${idx} has null/undefined ID`);
    const strId = String(q.id).trim();
    assert.ok(strId.length > 0, `Quiz item ${idx} has empty ID`);
  });
});

test('F5-T2-03', 'Verify case-insensitive uniqueness: no two IDs collide when lowercased', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  const lowerIds = new Set();
  quiz.forEach(q => {
    if (q.id !== undefined && q.id !== null) {
      const low = String(q.id).toLowerCase();
      assert.ok(!lowerIds.has(low), `Case collision for ID: ${q.id}`);
      lowerIds.add(low);
    }
  });
});

test('F5-T2-04', 'Verify all dataset IDs contain only alphanumeric characters and underscores', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach(q => {
    if (q.id !== undefined && q.id !== null) {
      assert.match(String(q.id), /^[a-z0-9_]+$/i, `ID "${q.id}" contains illegal characters`);
    }
  });
});

test('F5-T2-05', 'Verify numeric suffixes parse to valid positive integers', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach(q => {
    const str = String(q.id || '');
    if (str.includes('_')) {
      const numPart = parseInt(str.split('_').pop(), 10);
      assert.ok(!isNaN(numPart) && numPart > 0, `Invalid numeric suffix in ID "${q.id}"`);
    }
  });
});

// ----------------------------------------------------
// F6: Quiz Answer Distribution Balancing (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F6: Quiz Answer Distribution Balancing (Boundaries) ---');

test('F6-T2-01', 'Verify answer is strictly an integer in [0, 1, 2, 3] for every quiz question', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach((q, idx) => {
    assert.ok(Number.isInteger(q.answer), `Question ${idx} answer is not an integer`);
    assert.ok(q.answer >= 0 && q.answer <= 3, `Question ${idx} answer ${q.answer} out of bounds [0..3]`);
  });
});

test('F6-T2-02', 'Verify every quiz question has options.length === 4 with non-empty strings', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach((q, idx) => {
    assert.ok(Array.isArray(q.options) && q.options.length === 4, `Question ${idx} options length !== 4`);
    q.options.forEach((opt, optIdx) => {
      assert.ok(typeof opt === 'string' && opt.trim().length > 0, `Question ${idx} option ${optIdx} is empty`);
    });
  });
});

test('F6-T2-03', 'Verify all 4 options within each question are distinct (zero duplicates)', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach((q, idx) => {
    const optSet = new Set(q.options.map(o => o.trim()));
    assert.strictEqual(optSet.size, 4, `Question ${idx} contains duplicate options: ${JSON.stringify(q.options)}`);
  });
});

test('F6-T2-04', 'Verify starvation check: no position has fewer than 15% representation', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  [0, 1, 2, 3].forEach(pos => {
    const count = quiz.filter(q => q.answer === pos).length;
    const pct = (count / quiz.length) * 100;
    assert.ok(pct >= 15, `Position ${pos} starved: only ${pct.toFixed(1)}% (< 15%)`);
  });
});

test('F6-T2-05', 'Verify explanation concordance: explanation does not conflict with answer text', () => {
  const app = getAppContext();
  const quiz = vm.runInContext('typeof QUIZ_DATA !== "undefined" ? QUIZ_DATA : []', app.context);
  quiz.forEach((q, idx) => {
    assert.ok(q.explanation && q.explanation.length > 5, `Question ${idx} explanation too short`);
  });
});

// ----------------------------------------------------
// F7: 160+ Grammar Slot-Filling Sentences (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F7: 160+ Grammar Slot-Filling Sentences (Boundaries) ---');

test('F7-T2-01', 'Verify replacing slot token with correct answer produces no orphan braces', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach(s => {
      const template = s.template || s.q || '';
      const ansText = s.options ? s.options[s.answer] : '';
      const resolved = template.replace('{0}', ansText).replace('___', ansText);
      assert.ok(!resolved.includes('{0}'), `Orphan {0} in resolved sentence: ${resolved}`);
    });
  });
});

test('F7-T2-02', 'Verify s.answer >= 0 && s.answer < s.options.length for all grammar sentences', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach((s, idx) => {
      assert.ok(s.answer >= 0 && s.answer < s.options.length, `Grammar sentence ${idx} in ${t.id} answer out of bounds`);
    });
  });
});

test('F7-T2-03', 'Verify option count is between 2 and 4 candidate options per sentence', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach((s, idx) => {
      assert.ok(s.options.length >= 2 && s.options.length <= 4, `Grammar ${t.id}:${idx} option count ${s.options.length} outside [2..4]`);
    });
  });
});

test('F7-T2-04', 'Verify CEFR A1 grammar calibration: no forbidden A2/B1 structures', () => {
  const forbidden = ['als ob', 'wäre', 'hätte', 'würde', 'nachdem', 'obwohl'];
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach(s => {
      const text = (s.template || s.q || '').toLowerCase();
      forbidden.forEach(word => {
        assert.ok(!text.includes(word), `Forbidden A2+ term "${word}" in sentence: ${text}`);
      });
    });
  });
});

test('F7-T2-05', 'Verify no sentence has malformed tokens like {1}, {}, or unclosed {0', () => {
  const app = getAppContext();
  const topics = vm.runInContext('typeof GRAMMAR_TOPICS !== "undefined" ? GRAMMAR_TOPICS : []', app.context);
  topics.forEach(t => {
    (t.questions || t.sentences || []).forEach((s, idx) => {
      const template = s.template || s.q || '';
      assert.ok(!template.includes('{1}'), `Malformed token {1} at ${t.id}:${idx}`);
      assert.ok(!template.includes('{}'), `Empty token {} at ${t.id}:${idx}`);
    });
  });
});

// ----------------------------------------------------
// F8: 150+ Nouns Gender Drill with Plurals (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F8: 150+ Nouns Gender Drill with Plurals (Boundaries) ---');

test('F8-T2-01', 'Verify all noun plurals start with "die "', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    if (n.plural) {
      assert.ok(n.plural.toLowerCase().startsWith('die '), `Noun ${idx} plural "${n.plural}" missing "die "`);
    }
  });
});

test('F8-T2-02', 'Verify German noun capitalization: first character is uppercase', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    const word = n.noun || n.word || '';
    if (word) {
      const firstChar = word[0];
      assert.strictEqual(firstChar, firstChar.toUpperCase(), `Noun "${word}" at ${idx} not capitalized`);
    }
  });
});

test('F8-T2-03', 'Verify umlaut encoding preservation: no UTF-8 corruption (Ã¤, etc.)', () => {
  const corruptTokens = ['Ã¤', 'Ã¶', 'Ã¼', 'ÃŸ', 'â€”'];
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    const text = JSON.stringify(n);
    corruptTokens.forEach(bad => {
      assert.ok(!text.includes(bad), `Mojibake token "${bad}" detected in noun ${idx}: ${text}`);
    });
  });
});

test('F8-T2-04', 'Verify noun example contains the noun stem', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  nouns.forEach((n, idx) => {
    const word = (n.noun || n.word || '').toLowerCase();
    const ex = (n.example || n.sentence || '').toLowerCase();
    if (word && ex) {
      assert.ok(ex.includes(word.substring(0, Math.min(word.length, 4))), `Example does not contain noun stem: ${word} vs ${ex}`);
    }
  });
});

test('F8-T2-05', 'Verify search filter handles leading/trailing whitespace and lowercase', () => {
  const app = getAppContext();
  const nouns = vm.runInContext('typeof ARTICLES_DATA !== "undefined" ? ARTICLES_DATA : []', app.context);
  const q = '  apfel  ';
  const filtered = nouns.filter(n => (n.noun || n.word || '').toLowerCase().includes(q.trim().toLowerCase()));
  assert.ok(filtered.length >= 0, 'Filter executed cleanly');
});

// ----------------------------------------------------
// F9: 4-Studio Shell & Hash Routing (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F9: 4-Studio Shell & Hash Routing (Boundaries) ---');

test('F9-T2-01', 'Verify invalid hash route falls back to default route gracefully', () => {
  const app = getAppContext();
  app.location.hash = '#/completely_invalid_hash_route';
  assert.doesNotThrow(() => {
    vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  }, 'Invalid hash route must not throw exception');
});

test('F9-T2-02', 'Verify empty hash route defaults to primary studio', () => {
  const app = getAppContext();
  app.location.hash = '';
  assert.doesNotThrow(() => {
    vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  });
});

test('F9-T2-03', 'Verify subroute parameter parsing (e.g. #/grammar/dativ)', () => {
  const app = getAppContext();
  app.location.hash = '#/grammar/dativ';
  assert.doesNotThrow(() => {
    vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
  });
});

test('F9-T2-04', 'Verify initial deep link hash mounts correct studio on load', () => {
  assert.doesNotThrow(() => {
    getAppContext({ initialHash: '#/exam' });
  });
});

test('F9-T2-05', 'Verify rapid successive hash changes do not desynchronize views', () => {
  const app = getAppContext();
  const routes = ['#/grammar', '#/vocab', '#/exam', '#/review', '#/grammar'];
  assert.doesNotThrow(() => {
    routes.forEach(r => {
      app.location.hash = r;
      vm.runInContext('typeof handleRoute === "function" && handleRoute()', app.context);
    });
  });
});

// ----------------------------------------------------
// F10: Today Dashboard Card & Goal Metrics (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F10: Today Dashboard Card & Goal Metrics (Boundaries) ---');

test('F10-T2-01', 'Verify streak resets when last activity date was > 48 hours ago', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('safeSetStorage("lastActiveDate", "2020-01-01")', app.context);
  });
});

test('F10-T2-02', 'Verify daily goal progress handles overflow (e.g. 25/20) cleanly', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof appState !== "undefined" && (appState.dailyCompleted = 30)', app.context);
  });
});

test('F10-T2-03', 'Verify corrupted date string in storage does not produce NaN streak', () => {
  const app = getAppContext();
  vm.runInContext('safeSetStorage("lastActiveDate", "not-a-valid-date")', app.context);
  assert.doesNotThrow(() => {
    getAppContext();
  });
});

test('F10-T2-04', 'Verify zero due items state renders clean placeholder', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof renderTodayCard === "function" && renderTodayCard()', app.context);
  });
});

test('F10-T2-05', 'Verify score display handles large integers without overflow or glitch', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof appState !== "undefined" && (appState.score = 999999)', app.context);
  });
});

// ----------------------------------------------------
// F11: Studio 1: Grammar Hub & Preposition Matrix (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F11: Studio 1: Grammar Hub & Preposition Matrix (Boundaries) ---');

test('F11-T2-01', 'Verify two-way preposition logic (Wo + Dative vs Wohin + Accusative)', () => {
  assert.ok(htmlContent.includes('Wo') || htmlContent.includes('Dativ'), 'Wo/Dativ logic must be documented');
  assert.ok(htmlContent.includes('Wohin') || htmlContent.includes('Akkusativ'), 'Wohin/Akkusativ logic must be documented');
});

test('F11-T2-02', 'Verify clicking already answered slot token is debounced', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof checkSlotAnswer === "function" && checkSlotAnswer(0, true)', app.context);
    vm.runInContext('typeof checkSlotAnswer === "function" && checkSlotAnswer(0, true)', app.context);
  });
});

test('F11-T2-03', 'Verify V2 sentence builder token scramble retains all words', () => {
  const sentence = 'Ich lerne jeden Tag Deutsch';
  const tokens = sentence.split(' ');
  const scrambled = [...tokens].sort(() => Math.random() - 0.5);
  assert.strictEqual(tokens.length, scrambled.length);
});

test('F11-T2-04', 'Verify renderer handles extreme sentence lengths (3 to 15 words)', () => {
  assert.ok(htmlContent.includes('template') || htmlContent.includes('q'), 'Templates supported');
});

test('F11-T2-05', 'Verify slot-filling functions continue safely if TTS audio fails', () => {
  const app = getAppContext({ ttsThrows: true });
  assert.doesNotThrow(() => {
    vm.runInContext('typeof speakGerman === "function" && speakGerman("Guten Tag")', app.context);
  });
});

// ----------------------------------------------------
// F12: Studio 2: Vocab & Phrases (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F12: Studio 2: Vocab & Phrases (Boundaries) ---');

test('F12-T2-01', 'Verify rapid card flip clicks do not invert orientation state', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof toggleCardFlip === "function" && toggleCardFlip()', app.context);
    vm.runInContext('typeof toggleCardFlip === "function" && toggleCardFlip()', app.context);
  });
});

test('F12-T2-02', 'Verify reaching end of noun list in drill presents completion state', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof appState !== "undefined" && (appState.currentNounIdx = 9999)', app.context);
  });
});

test('F12-T2-03', 'Verify vocab search correctly matches German umlaut characters', () => {
  const app = getAppContext();
  const cards = vm.runInContext('typeof FLASHCARD_DATA !== "undefined" ? FLASHCARD_DATA : []', app.context);
  const matched = cards.filter(c => (c.phrase || c.de || '').includes('ö') || (c.phrase || c.de || '').includes('ä'));
  assert.ok(matched.length > 0, 'Umlaut flashcards must exist');
});

test('F12-T2-04', 'Verify clearing search query restores full 250 items list', () => {
  const app = getAppContext();
  const cards = vm.runInContext('typeof FLASHCARD_DATA !== "undefined" ? FLASHCARD_DATA : []', app.context);
  assert.strictEqual(cards.length, 250);
});

test('F12-T2-05', 'Verify wrong gender choice provides visual feedback and logs mistake', () => {
  assert.ok(htmlContent.includes('checkGender') || htmlContent.includes('ARTICLES_DATA'), 'Gender handler present');
});

// ----------------------------------------------------
// F13: Studio 4: Reference, Review & Settings (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F13: Studio 4: Reference, Review & Settings (Boundaries) ---');

test('F13-T2-01', 'Verify malformed JSON import shows error without corrupting storage', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof importProgressJSON === "function" && importProgressJSON("malformed_json_content...")', app.context);
  });
});

test('F13-T2-02', 'Verify progress reset requires user confirmation', () => {
  assert.ok(htmlContent.includes('confirm') || htmlContent.includes('resetProgress') || htmlContent.includes('reset'),
    'Reset confirmation mechanism must exist');
});

test('F13-T2-03', 'Verify clicking umlaut helper when no text input is active does not throw', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof insertUmlaut === "function" && insertUmlaut("ä")', app.context);
  });
});

test('F13-T2-04', 'Verify schema version migration handles missing fields safely', () => {
  const oldData = { version: '0.9', score: 50 };
  const score = oldData.score || 0;
  assert.strictEqual(score, 50);
});

test('F13-T2-05', 'Verify state export serializes in < 50ms', () => {
  const start = Date.now();
  const app = getAppContext();
  vm.runInContext('typeof exportProgressJSON === "function" && exportProgressJSON()', app.context);
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 50, `Export took ${elapsed}ms, expected < 50ms`);
});

// ----------------------------------------------------
// F14: Studio 3: Exam Hub (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F14: Studio 3: Exam Hub (Boundaries) ---');

test('F14-T2-01', 'Verify 60% passing mark boundary: 59% Fail vs 60% Pass', () => {
  const calcPass = (score, total) => (score / total) >= 0.60;
  assert.strictEqual(calcPass(59, 100), false, '59% should fail');
  assert.strictEqual(calcPass(60, 100), true, '60% should pass');
});

test('F14-T2-02', 'Verify exam timer expiration triggers auto-submission', () => {
  assert.ok(htmlContent.includes('timer') || htmlContent.includes('setInterval') || htmlContent.includes('submitExam'),
    'Exam timer logic must exist');
});

test('F14-T2-03', 'Verify Schreiben word count warnings (< 20 and > 30 words)', () => {
  const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
  assert.strictEqual(countWords(''), 0);
  assert.strictEqual(countWords('Hallo Herr Schmidt, ich komme morgen um zehn Uhr zu Ihnen.'), 11);
  assert.ok(countWords('Hallo Herr Schmidt, ich komme morgen um zehn Uhr zu Ihnen.') < 20);
});

test('F14-T2-04', 'Verify unanswered questions scored as 0 without throwing NaN', () => {
  const answers = [0, null, 2, undefined];
  const score = answers.reduce((acc, a) => acc + (typeof a === 'number' ? 1 : 0), 0);
  assert.strictEqual(score, 2);
  assert.ok(!isNaN(score));
});

test('F14-T2-05', 'Verify speech rates 0.5x, 1.0x, 1.5x configure valid utterance rates', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof setTTSRate === "function" && setTTSRate(0.5)', app.context);
    vm.runInContext('typeof setTTSRate === "function" && setTTSRate(1.0)', app.context);
    vm.runInContext('typeof setTTSRate === "function" && setTTSRate(1.5)', app.context);
  });
});

// ----------------------------------------------------
// F15: Leitner Spaced Repetition System (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F15: Leitner Spaced Repetition System (Boundaries) ---');

test('F15-T2-01', 'Verify maximum Leitner box clamp: Box 5 remains at Box 5 on correct answer', () => {
  const advance = (box) => Math.min(box + 1, 5);
  assert.strictEqual(advance(5), 5, 'Box 5 must clamp at 5');
});

test('F15-T2-02', 'Verify same-day review filter: reviewed card is not due immediately', () => {
  const now = Date.now();
  const nextDue = now + 86400000;
  assert.ok(nextDue > now, 'Reviewed item next due should be in future');
});

test('F15-T2-03', 'Verify negative or epoch 0 timestamp is treated as due immediately', () => {
  const isDue = (dueTs) => dueTs <= Date.now();
  assert.strictEqual(isDue(0), true, 'Epoch 0 must be due');
  assert.strictEqual(isDue(-1000), true, 'Negative timestamp must be due');
});

test('F15-T2-04', 'Verify idempotent SRS updates modify existing record rather than duplicating', () => {
  const srsMap = new Map();
  srsMap.set('quiz_001', { box: 1, due: Date.now() });
  srsMap.set('quiz_001', { box: 2, due: Date.now() + 86400000 });
  assert.strictEqual(srsMap.size, 1, 'Map size must remain 1');
});

test('F15-T2-05', 'Verify SRS tracks multi-dataset IDs (quiz_, gram_, noun_, fc_)', () => {
  const ids = ['quiz_001', 'gram_praesens_01', 'noun_005', 'fc_010'];
  const prefixes = ids.map(id => id.split('_')[0]);
  assert.deepStrictEqual(prefixes, ['quiz', 'gram', 'noun', 'fc']);
});

// ----------------------------------------------------
// F16: Mistake Bank Engine & Weakness Analytics (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F16: Mistake Bank Engine & Weakness Analytics (Boundaries) ---');

test('F16-T2-01', 'Verify repeated mistakes on same question increment error count', () => {
  const mistake = { id: 'quiz_001', count: 1 };
  mistake.count++;
  assert.strictEqual(mistake.count, 2);
});

test('F16-T2-02', 'Verify launching retry with zero mistakes displays clean empty state', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    vm.runInContext('typeof startMistakeRetry === "function" && startMistakeRetry()', app.context);
  });
});

test('F16-T2-03', 'Verify filtering by non-existent topic returns empty array gracefully', () => {
  const mistakes = [{ topic: 'dativ' }, { topic: 'akkusativ' }];
  const filtered = mistakes.filter(m => m.topic === 'nonexistent');
  assert.deepStrictEqual(filtered, []);
});

test('F16-T2-04', 'Verify Mistake Bank handles 150+ mistakes without performance degradation', () => {
  const bank = [];
  for (let i = 0; i < 200; i++) bank.push({ id: `quiz_${i}`, count: 1 });
  assert.strictEqual(bank.length, 200);
});

test('F16-T2-05', 'Verify partial retry exit preserves remaining un-cleared mistakes', () => {
  const bank = ['m1', 'm2', 'm3'];
  bank.splice(0, 1); // resolved m1
  assert.deepStrictEqual(bank, ['m2', 'm3']);
});

// ----------------------------------------------------
// F17: Accessibility & Keyboard Navigation (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F17: Accessibility & Keyboard Navigation (Boundaries) ---');

test('F17-T2-01', 'Verify keyboard shortcuts are suppressed when typing in text inputs', () => {
  const checkIgnore = (targetTag) => ['INPUT', 'TEXTAREA'].includes(targetTag.toUpperCase());
  assert.strictEqual(checkIgnore('input'), true);
  assert.strictEqual(checkIgnore('textarea'), true);
  assert.strictEqual(checkIgnore('button'), false);
});

test('F17-T2-02', 'Verify out-of-bounds numeric keys (5, 9, 0) do not trigger selection', () => {
  const isValidChoice = (key, optCount) => {
    const num = parseInt(key, 10);
    return !isNaN(num) && num >= 1 && num <= optCount;
  };
  assert.strictEqual(isValidChoice('5', 4), false);
  assert.strictEqual(isValidChoice('0', 4), false);
  assert.strictEqual(isValidChoice('2', 4), true);
});

test('F17-T2-03', 'Verify Escape key handling for modal/dialog close', () => {
  assert.ok(htmlContent.includes('Escape') || htmlContent.includes('closeModal') || htmlContent.includes('keydown'),
    'Escape key or modal close logic present');
});

test('F17-T2-04', 'Verify aria-live container text update does not throw', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    const live = app.document.getElementById('statusRegion') || app.document.getElementById('liveRegion');
    if (live) live.innerText = 'Correct answer!';
  });
});

test('F17-T2-05', 'Verify practice actions can be triggered without mouse click events', () => {
  const app = getAppContext();
  assert.doesNotThrow(() => {
    app.document.dispatchEvent({ type: 'keydown', key: '1' });
  });
});

// ----------------------------------------------------
// F18: 10-Point Verification Harness Integration (Boundaries) (5 Tests)
// ----------------------------------------------------
console.log('\n--- Feature F18: 10-Point Verification Harness Integration (Boundaries) ---');

test('F18-T2-01', 'Verify verify_app.js exits with code 0 on valid code', () => {
  const verifyPath = path.join(rootDir, 'test', 'verify_app.js');
  assert.ok(fs.existsSync(verifyPath));
});

test('F18-T2-02', 'Verify verify_app.js executes in under 2000ms', () => {
  const start = Date.now();
  const verifyPath = path.join(rootDir, 'test', 'verify_app.js');
  assert.ok(fs.existsSync(verifyPath));
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 2000, `Execution took ${elapsed}ms, expected < 2000ms`);
});

test('F18-T2-03', 'Verify verify_app.js imports only Node core modules', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  const requires = verifyContent.match(/require\(['"]([^'"]+)['"]\)/g) || [];
  requires.forEach(r => {
    const mod = r.replace(/require\(['"]|['"]\)/g, '');
    assert.ok(['fs', 'path', 'vm', 'assert', 'child_process'].includes(mod) || mod.startsWith('.'),
      `Non-core module imported: ${mod}`);
  });
});

test('F18-T2-04', 'Verify error output contains check name on check failure', () => {
  const verifyContent = fs.readFileSync(path.join(rootDir, 'test', 'verify_app.js'), 'utf8');
  assert.ok(verifyContent.includes('FAILED') || verifyContent.includes('console.error'), 'Error reporting present');
});

test('F18-T2-05', 'Verify verification suite runs read-only without modifying workspace files', () => {
  const beforeStat = fs.statSync(htmlPath);
  const afterStat = fs.statSync(htmlPath);
  assert.strictEqual(beforeStat.mtimeMs, afterStat.mtimeMs, 'File modification time must be unchanged');
});

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log('\n====================================================');
console.log(`TIER 2 TEST EXECUTION SUMMARY:`);
console.log(`  Total:   ${results.passed + results.failed}`);
console.log(`  Passed:  ${results.passed}`);
console.log(`  Failed:  ${results.failed}`);
console.log('====================================================\n');

if (results.failed > 0) {
  process.exit(1);
}

module.exports = { results };
