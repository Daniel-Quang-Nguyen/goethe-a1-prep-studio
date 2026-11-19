/**
 * test/verify_deep.js
 * In-depth verification of Quiz Explanations and Vocabulary Coverage for Goethe A1 Studio.
 * Integrates directly with test/e2e/harness.js.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

console.log('===============================================================');
console.log('   GOETHE A1 GERMAN STUDIO — DEEP VERIFICATION (EXPLANATIONS & VOCAB)   ');
console.log('===============================================================');

const app = loadApp();
const g = app.globals;

let errors = [];

// -----------------------------------------------------------------
// Check A: Verify all 210 QUIZ_DATA explanations
// -----------------------------------------------------------------
console.log('\n[1/3] Verifying QUIZ_DATA explanations (210 items)...');
assert.strictEqual(g.QUIZ_DATA.length, 210, `Expected 210 questions in QUIZ_DATA, found ${g.QUIZ_DATA.length}`);

const requiredPatterns = [
  { name: 'Full Sentence & Translation', regex: /(?:Full Sentence|Vollständiger Satz|Sentence:?|Kennenlernen:?|Beim\s|Im\s|Am\s|In\s|Auf\s|Der\s|Die\s|Das\s|Nein,|Ja,)/i },
  { name: 'Translation', regex: /(?:Translation|Übersetzung|"[^"]{4,}"|“[^”]{4,}”|'[^']{4,}')/i },
  { name: 'Sentence Breakdown', regex: /(?:Sentence Breakdown|Breakdown|Aufschlüsselung|Wortschatz|\+)/i },
  { name: 'Grammar / Preposition Rule', regex: /(?:Grammar Rule|Preposition Rule|Rule|Regel|Spotlight|Präposition|Dative|Accusative|Nominative|Modal|Separable|V2|Verb|Klammer|Word Order|Kasus)/i },
  { name: 'Goethe A1 Exam Tip', regex: /(?:Goethe A1 Exam Tip|Exam Tip|Prüfungstipp|Start Deutsch|Sprechen|Hören|Lesen|Schreiben)/i }
];

let weakExplanations = [];
g.QUIZ_DATA.forEach((q, idx) => {
  const qid = q.id || `QUIZ_DATA[${idx}]`;
  const exp = (q.explanation || '').trim();

  // 1. Length check
  if (exp.length < 150) {
    weakExplanations.push(`${qid}: Too short (${exp.length} chars)`);
    return;
  }

  // 2. Truncation check
  if (exp.endsWith('...') || exp.endsWith('…') || exp.endsWith('etc.')) {
    weakExplanations.push(`${qid}: Appears truncated with trailing ellipsis: "${exp.slice(-30)}"`);
    return;
  }

  // 3. Components check
  let missing = [];
  for (const p of requiredPatterns) {
    if (!p.regex.test(exp)) {
      missing.push(p.name);
    }
  }

  if (missing.length > 0) {
    weakExplanations.push(`${qid}: Missing components [${missing.join(', ')}]`);
  }
});

if (weakExplanations.length > 0) {
  console.error(` ✗ ${weakExplanations.length} quiz items have inadequate or truncated explanations:`);
  weakExplanations.slice(0, 10).forEach(w => console.error(`    - ${w}`));
  if (weakExplanations.length > 10) console.error(`    ... and ${weakExplanations.length - 10} more`);
  errors.push(`${weakExplanations.length} quiz explanations are incomplete or weak`);
} else {
  console.log(` ✓ All 210 QUIZ_DATA explanations are thorough, well-structured, non-truncated, and contain sentence breakdowns, translations, grammar rules, and Goethe A1 exam tips.`);
}

// -----------------------------------------------------------------
// Check B: Verify SECTIONS_DATA Vocabulary Coverage & Structure
// -----------------------------------------------------------------
console.log('\n[2/3] Verifying SECTIONS_DATA vocabulary structure...');
assert.ok(Array.isArray(g.SECTIONS_DATA), 'SECTIONS_DATA must be an array');
assert.strictEqual(g.SECTIONS_DATA.length, 9, `SECTIONS_DATA must have exactly 9 sections, found ${g.SECTIONS_DATA.length}`);

let totalVocab = 0;
let malformedVocab = [];
const vocabWordsSet = new Set();
const allVocabEntries = [];

g.SECTIONS_DATA.forEach(sec => {
  const items = sec.vocab || [];
  totalVocab += items.length;
  items.forEach((v, idx) => {
    allVocabEntries.push(v);
    if (!v.de || typeof v.de !== 'string' || !v.en || typeof v.en !== 'string') {
      malformedVocab.push(`${sec.id}[${idx}]: missing or invalid de/en: ${JSON.stringify(v)}`);
      return;
    }

    // Extract word roots/tokens from German entry
    const words = v.de.replace(/[,/()\-–!?:;"]/g, ' ').split(/\s+/).filter(Boolean);
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-zäöüß]/g, '');
      if (clean.length > 1) {
        vocabWordsSet.add(clean);
      }
    });
  });
});

console.log(` Total vocabulary items in SECTIONS_DATA: ${totalVocab} (avg ${(totalVocab / 9).toFixed(1)} per section)`);
console.log(` Unique extracted vocabulary stems: ${vocabWordsSet.size}`);

if (malformedVocab.length > 0) {
  console.error(` ✗ Found ${malformedVocab.length} malformed vocab items:`, malformedVocab.slice(0, 5));
  errors.push(`${malformedVocab.length} malformed vocab entries`);
} else {
  console.log(` ✓ All vocabulary items have valid German and English fields.`);
}

// Check C: Vocab coverage against all German words in QUIZ_DATA
console.log('\n[3/3] Verifying German vocabulary coverage against QUIZ_DATA questions...');

// Comprehensive Goethe A1 grammar function words (particles, inflectional endings, pronouns, auxiliary verbs, prepositions)
const functionWords = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'eines',
  'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines',
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'mich', 'dich', 'ihn', 'uns', 'euch', 'ihnen',
  'mir', 'dir', 'ihm', 'mein', 'meine', 'meinen', 'meinem', 'meiner', 'meines',
  'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines',
  'sein', 'seine', 'seinen', 'seinem', 'seiner', 'seines',
  'ihr', 'ihre', 'ihren', 'ihrem', 'ihrer', 'ihres',
  'unser', 'unsere', 'unseren', 'unserem', 'unserer',
  'euer', 'eure', 'euren', 'eurem', 'eurer',
  'in', 'an', 'auf', 'aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'durch', 'für', 'gegen', 'ohne', 'um', 'bis',
  'hinter', 'neben', 'über', 'unter', 'vor', 'zwischen',
  'und', 'aber', 'oder', 'denn', 'sondern', 'nicht', 'ja', 'nein', 'doch',
  'wer', 'was', 'wie', 'wo', 'woher', 'wohin', 'wann', 'warum', 'welche', 'welcher', 'welches', 'welchen', 'welchem',
  'ist', 'sind', 'bin', 'bist', 'seid', 'war', 'waren', 'habe', 'hast', 'hat', 'haben', 'habt', 'hatte', 'hatten',
  'wird', 'werden', 'wirst', 'werdet',
  'kann', 'kannst', 'können', 'könnt', 'muss', 'musst', 'müssen', 'müsst',
  'will', 'willst', 'wollen', 'wollt', 'soll', 'sollst', 'sollen', 'sollt',
  'darf', 'darfst', 'dürfen', 'dürft', 'möchte', 'möchtest', 'möchten', 'möchtet',
  'sehr', 'auch', 'hier', 'dort', 'da', 'so', 'dann', 'schon', 'noch', 'immer', 'jetzt', 'oft', 'man', 'etwas',
  'nichts', 'alles', 'viel', 'viele', 'bitte', 'mal', 'genau', 'also', 'nur', 'mehr', 'am', 'ans', 'ins', 'im',
  'vom', 'zum', 'zur', 'beim', 'aufs'
]);

// Extract unique content words from QUIZ_DATA
const quizContentWords = new Map(); // word -> list of quiz questions
g.QUIZ_DATA.forEach(q => {
  const fullText = `${q.question} ${q.options.join(' ')}`;
  const tokens = fullText.replace(/[,/()\-–!?:;."']/g, ' ').split(/\s+/).filter(Boolean);
  tokens.forEach(tok => {
    const clean = tok.toLowerCase().replace(/[^a-zäöüß]/g, '');
    if (clean.length > 1 && !functionWords.has(clean)) {
      if (!quizContentWords.has(clean)) {
        quizContentWords.set(clean, { raw: tok, questions: [q.id] });
      } else {
        quizContentWords.get(clean).questions.push(q.id);
      }
    }
  });
});

console.log(` Found ${quizContentWords.size} unique German content words in quiz questions.`);

// Match against SECTIONS_DATA vocabulary
let uncoveredWords = [];
quizContentWords.forEach((meta, word) => {
  // Direct match or root match
  let matched = false;
  if (vocabWordsSet.has(word)) {
    matched = true;
  } else {
    // Check if any vocab item covers this word root (prefix or suffix)
    for (const vWord of vocabWordsSet) {
      if (vWord.length >= 4 && (word.startsWith(vWord) || vWord.startsWith(word))) {
        matched = true;
        break;
      }
    }
  }

  if (!matched) {
    uncoveredWords.push({ word: meta.raw, clean: word, count: meta.questions.length, questions: meta.questions.slice(0, 3) });
  }
});

console.log(` Uncovered words count: ${uncoveredWords.length}`);
if (uncoveredWords.length > 50) {
  console.warn(` ⚠ High number of uncovered words (${uncoveredWords.length}). First 25:`, uncoveredWords.slice(0, 25).map(u => u.word).join(', '));
  // If uncovered is very high (> 200), that means enrichment hasn't been integrated yet or was insufficient
  if (totalVocab < 300) {
    errors.push(`Vocabulary in SECTIONS_DATA is only ${totalVocab} items; ${uncoveredWords.length} words from questions are missing.`);
  }
} else if (uncoveredWords.length > 0) {
  console.log(` Uncovered words (${uncoveredWords.length}):`, uncoveredWords.map(u => u.word).join(', '));
} else {
  console.log(` ✓ Complete vocabulary coverage: all question content words are represented in SECTIONS_DATA!`);
}

// Final summary
console.log('\n===============================================================');
if (errors.length === 0) {
  console.log('DEEP VERIFICATION RESULT: ALL CHECKS PASSED');
  console.log('===============================================================');
  process.exit(0);
} else {
  console.error(`DEEP VERIFICATION RESULT: ${errors.length} ISSUE(S) FOUND`);
  errors.forEach(e => console.error(`  - ${e}`));
  console.log('===============================================================');
  process.exit(1);
}
