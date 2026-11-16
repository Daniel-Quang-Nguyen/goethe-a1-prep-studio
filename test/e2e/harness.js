/**
 * test/e2e/harness.js
 * Zero-Dependency Node.js Browser Simulation Sandbox for Goethe A1 German Studio.
 * Uses only Node.js core modules: fs, path, vm, assert.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// --- Mock DOM Token List (classList) ---
class MockDOMTokenList {
  constructor(element) {
    this._element = element;
    this._set = new Set();
  }
  add(...tokens) {
    tokens.forEach(t => { if (t) this._set.add(t); });
    this._sync();
  }
  remove(...tokens) {
    tokens.forEach(t => this._set.delete(t));
    this._sync();
  }
  toggle(token, force) {
    if (force !== undefined) {
      if (force) this.add(token);
      else this.remove(token);
      return force;
    }
    const has = this._set.has(token);
    if (has) this.remove(token);
    else this.add(token);
    return !has;
  }
  contains(token) {
    return this._set.has(token);
  }
  _sync() {
    this._element._attributes['class'] = Array.from(this._set).join(' ');
  }
  _fromClassString(str) {
    this._set = new Set((str || '').split(/\s+/).filter(Boolean));
  }
  toString() {
    return Array.from(this._set).join(' ');
  }
  get length() {
    return this._set.size;
  }
}

// --- Mock Element ---
class MockElement {
  constructor(tagName = 'div', ownerDocument = null) {
    this.tagName = (tagName || 'DIV').toUpperCase();
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.parentNode = null;
    this._attributes = {};
    this._classList = new MockDOMTokenList(this);
    this._innerText = '';
    this._innerHTML = '';
    this.value = '';
    this.style = {};
    this.dataset = {};
    this.eventListeners = {};
    this.tabIndex = 0;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.offsetWidth = 100;
    this.offsetHeight = 40;
  }

  get id() { return this.getAttribute('id') || ''; }
  set id(val) { this.setAttribute('id', val); }

  get className() { return this.getAttribute('class') || ''; }
  set className(val) {
    this.setAttribute('class', val);
    this._classList._fromClassString(val);
  }

  get classList() { return this._classList; }
  set classList(val) {
    if (val && typeof val.forEach === 'function') {
      this._classList._set = new Set(val);
    } else if (typeof val === 'string') {
      this._classList._fromClassString(val);
    }
  }

  get innerText() { return this._innerText; }
  set innerText(val) {
    this._innerText = String(val);
    this._innerHTML = String(val);
  }

  get textContent() { return this.innerText; }
  set textContent(val) { this.innerText = val; }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    this._innerText = String(val).replace(/<[^>]*>/g, '');
    this._parseChildIds(val);
  }

  _parseChildIds(htmlStr) {
    if (!this.ownerDocument || !this.ownerDocument._registerElement) return;
    const idRegex = /\bid=["']([^"']+)["']/gi;
    let m;
    while ((m = idRegex.exec(htmlStr)) !== null) {
      const childId = m[1];
      if (!this.ownerDocument.getElementById(childId)) {
        const childEl = new MockElement('div', this.ownerDocument);
        childEl.id = childId;
        this.ownerDocument._registerElement(childId, childEl);
      }
    }
  }

  getAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this._attributes, name) ? this._attributes[name] : null;
  }
  setAttribute(name, val) {
    const sVal = String(val);
    this._attributes[name] = sVal;
    if (name.toLowerCase() === 'id' && this.ownerDocument && this.ownerDocument._registerElement) {
      this.ownerDocument._registerElement(sVal, this);
    }
    if (name.toLowerCase() === 'class') {
      this._classList._fromClassString(sVal);
    }
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[key] = sVal;
    }
  }
  removeAttribute(name) {
    delete this._attributes[name];
    if (name.toLowerCase() === 'class') {
      this._classList._fromClassString('');
    }
    if (name.startsWith('data-')) {
      const key = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[key];
    }
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this._attributes, name);
  }

  appendChild(child) {
    if (!child) return child;
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  replaceChild(newChild, oldChild) {
    const idx = this.children.indexOf(oldChild);
    if (idx !== -1) {
      oldChild.parentNode = null;
      if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
      newChild.parentNode = this;
      newChild.ownerDocument = this.ownerDocument;
      this.children[idx] = newChild;
    }
    return oldChild;
  }

  insertBefore(newChild, refChild) {
    if (!refChild) return this.appendChild(newChild);
    const idx = this.children.indexOf(refChild);
    if (idx !== -1) {
      if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
      newChild.parentNode = this;
      newChild.ownerDocument = this.ownerDocument;
      this.children.splice(idx, 0, newChild);
    } else {
      this.appendChild(newChild);
    }
    return newChild;
  }

  addEventListener(event, fn) {
    if (!this.eventListeners[event]) this.eventListeners[event] = [];
    this.eventListeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event] = this.eventListeners[event].filter(f => f !== fn);
  }

  dispatchEvent(event) {
    const ev = typeof event === 'string'
      ? { type: event, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }
      : event;
    if (!ev.target) ev.target = this;
    const list = this.eventListeners[ev.type] || [];
    for (const fn of list) fn.call(this, ev);
    return !ev.defaultPrevented;
  }

  click() { return this.dispatchEvent('click'); }
  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
    this.dispatchEvent('focus');
  }
  blur() {
    if (this.ownerDocument && this.ownerDocument.activeElement === this) {
      this.ownerDocument.activeElement = null;
    }
    this.dispatchEvent('blur');
  }

  matches(selector) { return matchSelector(this, selector); }
  querySelector(sel) { return querySelector(this, sel); }
  querySelectorAll(sel) { return querySelectorAll(this, sel); }
}

// --- Selector Engine ---
function matchSelector(el, selector) {
  if (!el || !selector) return false;
  let sel = selector.trim();

  // Attribute selector [attr] or [attr="val"]
  const attrRegex = /\[([a-zA-Z0-9_:-]+)(?:=([^\],]+))?\]/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(sel)) !== null) {
    const attrName = attrMatch[1];
    const rawVal = attrMatch[2];
    if (rawVal !== undefined) {
      const expectedVal = rawVal.replace(/^["']|["']$/g, '');
      if (el.getAttribute(attrName) !== expectedVal) return false;
    } else {
      if (!el.hasAttribute(attrName)) return false;
    }
  }
  sel = sel.replace(attrRegex, '');
  if (!sel) return true;

  // ID selector #foo
  const idMatch = sel.match(/#([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    if (el.id !== idMatch[1]) return false;
    sel = sel.replace(idMatch[0], '');
  }

  // Class selector .bar.baz
  const classRegex = /\.([a-zA-Z0-9_-]+)/g;
  let cMatch;
  while ((cMatch = classRegex.exec(sel)) !== null) {
    if (!el.classList.contains(cMatch[1])) return false;
  }
  sel = sel.replace(classRegex, '');

  // Tag name selector
  if (sel) {
    if (el.tagName.toLowerCase() !== sel.toLowerCase()) return false;
  }

  return true;
}

function splitSelector(selector) {
  const parts = [];
  let current = '';
  let inQuote = null;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if ((ch === '"' || ch === "'") && (i === 0 || selector[i - 1] !== '\\')) {
      if (inQuote === ch) inQuote = null;
      else if (!inQuote) inQuote = ch;
    }
    if (!inQuote && /\s/.test(ch)) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function collectDescendants(parent) {
  const result = [];
  function walk(node) {
    for (const child of node.children) {
      result.push(child);
      walk(child);
    }
  }
  walk(parent);
  return result;
}

function querySelector(root, selector) {
  const all = querySelectorAll(root, selector);
  return all.length > 0 ? all[0] : null;
}

function querySelectorAll(root, selector) {
  const parts = splitSelector(selector);
  if (parts.length === 1) {
    const descendants = collectDescendants(root);
    return descendants.filter(node => matchSelector(node, parts[0]));
  }
  let currentList = collectDescendants(root).filter(node => matchSelector(node, parts[0]));
  for (let i = 1; i < parts.length; i++) {
    const nextPart = parts[i];
    const nextList = [];
    for (const parent of currentList) {
      const subs = collectDescendants(parent).filter(node => matchSelector(node, nextPart));
      nextList.push(...subs);
    }
    currentList = nextList;
  }
  return currentList;
}

// --- Storage Mock with Toggleable Errors ---
class MockStorage {
  constructor() {
    this._store = new Map();
    this._shouldThrow = false;
  }
  get shouldThrow() { return this._shouldThrow; }
  set shouldThrow(bool) { this._shouldThrow = !!bool; }
  setThrowMode(bool) { this._shouldThrow = !!bool; }
  getItem(key) {
    if (this._shouldThrow) throw new Error('SecurityError: localStorage is disabled');
    return this._store.has(key) ? this._store.get(key) : null;
  }
  setItem(key, val) {
    if (this._shouldThrow) throw new Error('QuotaExceededError or SecurityError');
    this._store.set(key, String(val));
  }
  removeItem(key) {
    if (this._shouldThrow) throw new Error('SecurityError');
    this._store.delete(key);
  }
  clear() {
    if (this._shouldThrow) throw new Error('SecurityError');
    this._store.clear();
  }
  get length() { return this._store.size; }
  key(i) { return Array.from(this._store.keys())[i] || null; }
  dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) obj[k] = v;
    return obj;
  }
}

// --- SpeechSynthesis Mock ---
class MockSpeechSynthesis {
  constructor() {
    this.speaking = false;
    this.paused = false;
    this.pending = false;
    this.spokenUtterances = [];
  }
  speak(utterance) {
    this.spokenUtterances.push(utterance);
    this.speaking = true;
    if (typeof utterance.onstart === 'function') utterance.onstart();
    setTimeout(() => {
      this.speaking = false;
      if (typeof utterance.onend === 'function') utterance.onend();
    }, 0);
  }
  cancel() {
    this.speaking = false;
    this.spokenUtterances = [];
  }
  pause() { this.paused = true; }
  resume() { this.paused = false; }
  getVoices() {
    return [
      { name: 'Deutsch Female', lang: 'de-DE', default: true },
      { name: 'Deutsch Male', lang: 'de-DE', default: false }
    ];
  }
  lastSpoken() {
    return this.spokenUtterances.length > 0 ? this.spokenUtterances[this.spokenUtterances.length - 1] : null;
  }
  clear() {
    this.spokenUtterances = [];
    this.speaking = false;
  }
}

class MockSpeechSynthesisUtterance {
  constructor(text = '') {
    this.text = text;
    this.lang = 'de-DE';
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

// --- HTML Parser for DOM Tree Reconstruction ---
function parseHTMLTree(html) {
  const clean = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  const root = new MockElement('ROOT');
  const stack = [root];
  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)([^>]*?)(\/)?>/g;
  
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  const idMap = new Map();
  let match;
  while ((match = tagRegex.exec(clean)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2].toLowerCase();
    const rawAttrs = match[3];
    const isSelfClosing = match[4] === '/' || voidTags.has(tagName);

    if (isClosing) {
      if (stack.length > 1 && stack[stack.length - 1].tagName.toLowerCase() === tagName) {
        stack.pop();
      }
    } else {
      const node = new MockElement(tagName);
      const attrRegex = /([a-zA-Z0-9_:-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
      let am;
      while ((am = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = am[1];
        const val = am[2] !== undefined ? am[2] : (am[3] !== undefined ? am[3] : (am[4] !== undefined ? am[4] : ''));
        node.setAttribute(attrName, val);
      }

      if (node.id) {
        idMap.set(node.id, node);
      }

      stack[stack.length - 1].appendChild(node);

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }

  return { root, idMap };
}

// --- Master Harness Creator ---
function createHarness(options = {}) {
  const defaultPath = fs.existsSync(path.resolve(__dirname, '..', '..', 'index.html'))
    ? path.resolve(__dirname, '..', '..', 'index.html')
    : path.resolve(process.cwd(), 'index.html');
  const htmlPath = options.htmlPath || defaultPath;
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  const { root, idMap } = parseHTMLTree(htmlContent);

  const docListeners = {};
  const winListeners = {};

  const documentMock = {
    _idMap: idMap,
    _registerElement: (id, el) => {
      idMap.set(id, el);
    },
    getElementById: (id) => {
      return idMap.get(id) || null;
    },
    querySelector: (sel) => {
      if (sel.startsWith('#') && !sel.includes(' ') && !sel.includes('.') && !sel.includes('[')) {
        return documentMock.getElementById(sel.slice(1));
      }
      return querySelector(root, sel);
    },
    querySelectorAll: (sel) => {
      if (sel.startsWith('#') && !sel.includes(' ') && !sel.includes('.') && !sel.includes('[')) {
        const el = documentMock.getElementById(sel.slice(1));
        return el ? [el] : [];
      }
      return querySelectorAll(root, sel);
    },
    createElement: (tag) => new MockElement(tag, documentMock),
    createTextNode: (text) => ({ text: String(text) }),
    body: idMap.get('body') || querySelector(root, 'body') || new MockElement('body', documentMock),
    head: querySelector(root, 'head') || new MockElement('head', documentMock),
    documentElement: querySelector(root, 'html') || new MockElement('html', documentMock),
    activeElement: null,
    addEventListener: (event, fn) => {
      if (!docListeners[event]) docListeners[event] = [];
      docListeners[event].push(fn);
    },
    removeEventListener: (event, fn) => {
      if (!docListeners[event]) return;
      docListeners[event] = docListeners[event].filter(f => f !== fn);
    },
    dispatchEvent: (event) => {
      const ev = typeof event === 'string' ? { type: event, target: documentMock } : event;
      const list = docListeners[ev.type] || [];
      for (const fn of list) fn.call(documentMock, ev);
      return true;
    }
  };

  for (const el of idMap.values()) {
    el.ownerDocument = documentMock;
  }

  const localStorageMock = new MockStorage();
  const sessionStorageMock = new MockStorage();
  if (options.storageThrowMode || options.storageThrows) {
    localStorageMock.setThrowMode(true);
    sessionStorageMock.setThrowMode(true);
  }

  const speechSynthesisMock = new MockSpeechSynthesis();

  const locationMock = {
    _hash: options.initialRoute || '#/',
    get hash() { return this._hash; },
    set hash(val) {
      const oldHash = this._hash;
      this._hash = val.startsWith('#') ? val : '#' + val;
      this.href = 'http://localhost/' + this._hash;
      if (oldHash !== this._hash && windowMock.dispatchEvent) {
        windowMock.dispatchEvent({ type: 'hashchange', oldURL: 'http://localhost/' + oldHash, newURL: this.href });
      }
    },
    href: 'http://localhost/' + (options.initialRoute || '#/'),
    pathname: '/',
    search: '',
    reload: () => {},
    assign: function(url) {
      if (url.includes('#')) this.hash = url.split('#')[1];
      else this.href = url;
    }
  };

  const windowMock = {
    document: documentMock,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    speechSynthesis: speechSynthesisMock,
    SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
    location: locationMock,
    navigator: {
      userAgent: 'Mozilla/5.0 (NodeVM GoetheA1TestHarness/1.0)',
      language: 'de-DE'
    },
    addEventListener: (event, fn) => {
      if (!winListeners[event]) winListeners[event] = [];
      winListeners[event].push(fn);
    },
    removeEventListener: (event, fn) => {
      if (!winListeners[event]) return;
      winListeners[event] = winListeners[event].filter(f => f !== fn);
    },
    dispatchEvent: (event) => {
      const ev = typeof event === 'string' ? { type: event, target: windowMock } : event;
      const list = winListeners[ev.type] || [];
      for (const fn of list) fn.call(windowMock, ev);
      return true;
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    console: options.captureConsole ? {
      logs: [],
      errors: [],
      warns: [],
      log(...args) { this.logs.push(args); },
      error(...args) { this.errors.push(args); },
      warn(...args) { this.warns.push(args); }
    } : console
  };

  windowMock.window = windowMock;
  windowMock.self = windowMock;
  windowMock.globalThis = windowMock;

  const context = vm.createContext(windowMock);

  // Extract inline scripts
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  const scriptCodes = [];
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const attrs = match[1];
    const code = match[2];
    if (!attrs.includes('src=')) {
      scriptCodes.push(code);
    }
  }

  for (const code of scriptCodes) {
    try {
      vm.runInContext(code, context);
    } catch (e) {
      if (options.verbose) {
        console.warn('Script evaluation note:', e.message);
      }
    }
  }

  // Auto-sync top-level declarations to windowMock and globals proxy
  const knownGlobals = [
    'QUIZ_DATA', 'PUZZLES_DATA', 'ARTICLES_DATA', 'FLASHCARD_DATA', 'FLASHCARDS_DATA',
    'SECTIONS_DATA', 'GRAMMAR_TOPICS', 'SIM_DATA',
    'speakGerman', 'safeGetStorage', 'safeSetStorage', 'safeRemoveStorage',
    'toggleTheme', 'applyTheme', 'handleRoute', 'navigateTo', 'switchViewMode',
    'appState', 'renderStudio', 'renderQuiz', 'renderGrammar', 'renderVocab',
    'renderExam', 'renderReview', 'leitnerEngine', 'mistakeBank',
    'recordMockExamMistake', 'logMistake', 'resolveMistake', 'resetAllProgress'
  ];

  for (const k of knownGlobals) {
    try {
      const val = vm.runInContext(`typeof ${k} !== 'undefined' ? ${k} : (typeof window.${k} !== 'undefined' ? window.${k} : undefined)`, context);
      if (val !== undefined) {
        windowMock[k] = val;
      }
    } catch (e) {}
  }

  if (options.autoTriggerDomReady !== false) {
    documentMock.dispatchEvent({ type: 'DOMContentLoaded' });
  }

  const globalsProxy = new Proxy({}, {
    get(_, prop) {
      if (prop === 'FLASHCARDS_DATA' && windowMock.FLASHCARD_DATA) return windowMock.FLASHCARD_DATA;
      if (windowMock[prop] !== undefined) return windowMock[prop];
      try {
        return vm.runInContext(`typeof ${String(prop)} !== 'undefined' ? ${String(prop)} : undefined`, context);
      } catch (e) {
        return undefined;
      }
    }
  });

  return {
    window: windowMock,
    document: documentMock,
    storage: localStorageMock,
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    speech: speechSynthesisMock,
    speechSynthesis: speechSynthesisMock,
    location: locationMock,
    globals: globalsProxy,
    context: context,
    sandbox: windowMock,
    htmlContent: htmlContent,

    navigate(hash) {
      locationMock.hash = hash;
      if (typeof windowMock.handleRoute === 'function') {
        windowMock.handleRoute();
      }
    },

    dispatchKeydown(key, opts = {}) {
      const event = {
        type: 'keydown',
        key: key,
        code: opts.code || `Key${key.toUpperCase()}`,
        bubbles: true,
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; },
        ...opts
      };
      if (documentMock.activeElement && documentMock.activeElement.dispatchEvent) {
        documentMock.activeElement.dispatchEvent(event);
      }
      windowMock.dispatchEvent(event);
      return event;
    },

    click(target) {
      const el = typeof target === 'string' ? documentMock.querySelector(target) : target;
      if (el && typeof el.click === 'function') {
        el.click();
        return true;
      }
      return false;
    },

    get(identifier) {
      return vm.runInContext(`typeof ${identifier} !== 'undefined' ? ${identifier} : undefined`, context);
    },

    eval(code) {
      return vm.runInContext(code, context);
    }
  };
}

// --- loadApp Helper for high-level app testing ---
function loadApp(options = {}) {
  const opts = { ...options };
  if (opts.storageThrows) opts.storageThrowMode = true;
  const h = createHarness(opts);
  return {
    sandbox: h.window,
    context: h.context,
    document: h.document,
    window: h.window,
    storage: h.storage,
    localStorage: h.storage,
    sessionStorage: h.sessionStorage,
    speech: h.speech,
    location: h.location,
    globals: h.globals,
    htmlContent: h.htmlContent,
    harness: h
  };
}

module.exports = {
  createHarness,
  loadApp,
  MockDOMTokenList,
  MockElement,
  MockStorage,
  MockSpeechSynthesis,
  MockSpeechSynthesisUtterance,
  matchSelector,
  splitSelector,
  collectDescendants,
  querySelector,
  querySelectorAll,
  parseHTMLTree,
  assert
};
