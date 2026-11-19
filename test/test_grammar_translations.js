const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('const GRAMMAR_TOPICS =');
const endPos = html.indexOf(';\n    window.GRAMMAR_TOPICS', pos);
const jsonStr = html.substring(pos + 'const GRAMMAR_TOPICS = '.length, endPos !== -1 ? endPos : pos + 100000);
const topics = JSON.parse(jsonStr);

console.log(`Checking GRAMMAR_TOPICS: ${topics.length} topics`);
let totalSentences = 0;
let missingTranslation = [];
let complexVocab = [];

topics.forEach(t => {
  const list = t.questions || t.sentences || [];
  totalSentences += list.length;
  list.forEach(s => {
    if (!s.translation || typeof s.translation !== 'string' || s.translation.trim().length === 0) {
      missingTranslation.push({ topic: t.id, id: s.id });
    }
  });
});

console.log(`Total grammar sentences checked: ${totalSentences}`);
console.log(`Sentences missing translation: ${missingTranslation.length}`);
if (missingTranslation.length > 0) {
  console.log('Examples missing translation:', missingTranslation.slice(0, 5));
}
