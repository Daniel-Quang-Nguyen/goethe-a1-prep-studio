const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('const ERROR_HUNTER_DATA =');
const endPos = html.indexOf('];', pos) + 1;
const jsonStr = html.substring(pos + 'const ERROR_HUNTER_DATA = '.length, endPos);
const data = JSON.parse(jsonStr);

console.log(`--- Verifying ERROR_HUNTER_DATA (${data.length} items) ---`);
assert.strictEqual(data.length, 16, 'ERROR_HUNTER_DATA must have 16 items');

const requiredCategories = ['V2', 'Perfekt', 'Imperativ', 'Possessiv', 'Dativ', 'ADUSO'];
const categoryHits = {};
requiredCategories.forEach(c => categoryHits[c] = 0);

data.forEach((item, i) => {
  assert.ok(item.id, `Item ${i} missing id`);
  assert.ok(item.category, `Item ${item.id} missing category`);
  assert.ok(Array.isArray(item.tokens) && item.tokens.length >= 3, `Item ${item.id} invalid tokens`);
  assert.ok(typeof item.errorIndex === 'number', `Item ${item.id} invalid errorIndex`);
  assert.ok(item.errorIndex >= 0 && item.errorIndex < item.tokens.length, `Item ${item.id} errorIndex out of bounds`);
  assert.ok(item.correction, `Item ${item.id} missing correction`);
  assert.ok(item.correctSentence, `Item ${item.id} missing correctSentence`);
  assert.ok(item.rule, `Item ${item.id} missing rule`);
  assert.ok(item.tip, `Item ${item.id} missing tip`);

  // Check category coverage
  requiredCategories.forEach(cat => {
    if (item.category.toLowerCase().includes(cat.toLowerCase()) || item.rule.toLowerCase().includes(cat.toLowerCase())) {
      categoryHits[cat]++;
    }
  });

  console.log(`[${item.id}] [${item.category}] Error token "${item.tokens[item.errorIndex]}" -> "${item.correction}"`);
});

console.log('Category coverage across Error Hunter:');
console.log(categoryHits);
Object.keys(categoryHits).forEach(c => {
  assert.ok(categoryHits[c] > 0, `Missing coverage for category ${c}`);
});

console.log('All 16 error hunter exercises verified cleanly!');
