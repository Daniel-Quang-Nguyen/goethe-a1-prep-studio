const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

const app = loadApp();
const g = app.globals;

console.log('Testing Case Explorer & CASE_TRANSFORMER_DATA...');

assert.ok(g.CASE_TRANSFORMER_DATA, 'CASE_TRANSFORMER_DATA must exist');
const data = g.CASE_TRANSFORMER_DATA;

const cases = ['nominativ', 'akkusativ', 'dativ'];
const genders = ['maskulin', 'neutrum', 'feminin', 'plural'];
const determiners = ['bestimmt', 'unbestimmt', 'negativ', 'possessiv'];

let checked = 0;
cases.forEach(c => {
  genders.forEach(gen => {
    determiners.forEach(det => {
      checked++;
      const row = data.matrix[c][gen];
      assert.ok(row, `Missing row for ${c}.${gen}`);
      assert.ok(row[det], `Missing determiner ${det} in ${c}.${gen}`);
      assert.ok(row.ending, `Missing ending in ${c}.${gen}`);
      assert.ok(row.example, `Missing example in ${c}.${gen}`);
      assert.ok(row.rule, `Missing rule in ${c}.${gen}`);
    });
  });
});

console.log(`Successfully checked all ${checked} combinations in live app context!`);
process.exit(0);
