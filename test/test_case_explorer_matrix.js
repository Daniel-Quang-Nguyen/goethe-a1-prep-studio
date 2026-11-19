const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('window.CASE_TRANSFORMER_DATA =');
const endPos = html.indexOf('}}}};', pos) + 4;
const jsonStr = html.substring(pos + 'window.CASE_TRANSFORMER_DATA = '.length, endPos);
const data = JSON.parse(jsonStr);

console.log('--- Verifying CASE_TRANSFORMER_DATA 48 Combinations ---');

const cases = ['nominativ', 'akkusativ', 'dativ'];
const genders = ['maskulin', 'neutrum', 'feminin', 'plural'];
const determiners = ['bestimmt', 'unbestimmt', 'negativ', 'possessiv'];

const expectedArticles = {
  nominativ: {
    maskulin: { bestimmt: 'der', unbestimmt: 'ein', negativ: 'kein', possessiv: 'mein' },
    neutrum: { bestimmt: 'das', unbestimmt: 'ein', negativ: 'kein', possessiv: 'mein' },
    feminin: { bestimmt: 'die', unbestimmt: 'eine', negativ: 'keine', possessiv: 'meine' },
    plural: { bestimmt: 'die', unbestimmt: '— (viele)', negativ: 'keine', possessiv: 'meine' }
  },
  akkusativ: {
    maskulin: { bestimmt: 'den', unbestimmt: 'einen', negativ: 'keinen', possessiv: 'meinen' },
    neutrum: { bestimmt: 'das', unbestimmt: 'ein', negativ: 'kein', possessiv: 'mein' },
    feminin: { bestimmt: 'die', unbestimmt: 'eine', negativ: 'keine', possessiv: 'meine' },
    plural: { bestimmt: 'die', unbestimmt: '— (viele)', negativ: 'keine', possessiv: 'meine' }
  },
  dativ: {
    maskulin: { bestimmt: 'dem', unbestimmt: 'einem', negativ: 'keinem', possessiv: 'meinem' },
    neutrum: { bestimmt: 'dem', unbestimmt: 'einem', negativ: 'keinem', possessiv: 'meinem' },
    feminin: { bestimmt: 'der', unbestimmt: 'einer', negativ: 'keiner', possessiv: 'meiner' },
    plural: { bestimmt: 'den ...-n', unbestimmt: '— ...-n', negativ: 'keinen ...-n', possessiv: 'meinen ...-n' }
  }
};

let tested = 0;
cases.forEach(c => {
  assert.ok(data.matrix[c], `Missing case ${c} in matrix`);
  genders.forEach(g => {
    assert.ok(data.matrix[c][g], `Missing gender ${g} in case ${c}`);
    const row = data.matrix[c][g];
    assert.ok(row.ending, `Missing ending in ${c}.${g}`);
    assert.ok(row.example, `Missing example in ${c}.${g}`);
    assert.ok(row.rule, `Missing rule in ${c}.${g}`);
    determiners.forEach(d => {
      tested++;
      const val = row[d];
      const exp = expectedArticles[c][g][d];
      assert.strictEqual(val, exp, `Mismatch in ${c}.${g}.${d}: expected "${exp}", got "${val}"`);
    });
  });
});

console.log(`Successfully verified all ${tested} / 48 declension combinations against Goethe A1 standards!`);
