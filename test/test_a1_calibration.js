const { loadApp } = require('./e2e/harness');
const assert = require('assert');

const app = loadApp();
const g = app.globals;

console.log('Auditing CEFR A1 compliance in grammar sentences...');

const a2Markers = [
  { name: 'Konjunktiv II', regex: /\b(hätte|hätten|wäre|wären|könnte|könnten|würde|würden|müsste|müssten)\b/i },
  { name: 'Passiv', regex: /\b(wurde|wurden|worden)\b/i },
  { name: 'Plusquamperfekt', regex: /\b(war|waren|hatte|hatten)\b.*\bge[a-z]+(t|en)\b/i }
];

let violations = [];

// Check GRAMMAR_TOPICS
g.GRAMMAR_TOPICS.forEach(t => {
  (t.questions || t.sentences || []).forEach(s => {
    const text = s.template || s.question || '';
    a2Markers.forEach(m => {
      if (m.regex.test(text)) {
        violations.push({ source: `GRAMMAR_TOPICS[${t.id}][${s.id}]`, marker: m.name, text });
      }
    });
  });
});

// Check ERROR_HUNTER_DATA
g.ERROR_HUNTER_DATA.forEach(ex => {
  const text = ex.correctSentence;
  a2Markers.forEach(m => {
    if (m.regex.test(text)) {
      // Note: "möchte" is allowed at A1 (polite request taught as fixed phrase). We check if it flagged something else.
      violations.push({ source: `ERROR_HUNTER_DATA[${ex.id}]`, marker: m.name, text });
    }
  });
});

console.log(`Violations found: ${violations.length}`);
violations.forEach(v => console.log(` - [${v.source}] [${v.marker}]: "${v.text}"`));

assert.strictEqual(violations.length, 0, 'No A2+ grammatical markers allowed');
console.log('Strict Goethe A1 calibration confirmed across all grammar sentences!');
process.exit(0);
