const { loadApp } = require('./e2e/harness');
const assert = require('assert');

const app = loadApp();
const g = app.globals;

console.log('Testing interactive clicks across Case Explorer...');

const genders = ['maskulin', 'neutrum', 'feminin', 'plural'];
const cases = ['nominativ', 'akkusativ', 'dativ'];
const determiners = ['bestimmt', 'unbestimmt', 'negativ', 'possessiv'];

let totalCombinations = 0;
cases.forEach(c => {
  g.setCaseFilter('case', c);
  genders.forEach(gen => {
    g.setCaseFilter('gender', gen);
    determiners.forEach(det => {
      g.setCaseFilter('determiner', det);
      totalCombinations++;

      const resCard = app.document.getElementById('caseResultCard');
      assert.ok(resCard && resCard.innerHTML.length > 50, `Result card empty for ${c}.${gen}.${det}`);
      const compTable = app.document.getElementById('caseComparativeTable');
      assert.ok(compTable && compTable.innerHTML.includes('<table'), `Comparative table missing for ${c}.${gen}.${det}`);
    });
  });
});

console.log(`Successfully verified all ${totalCombinations} interactive state updates in Case Explorer!`);
process.exit(0);
