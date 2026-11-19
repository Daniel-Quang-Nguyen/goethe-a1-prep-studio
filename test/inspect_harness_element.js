const fs = require('fs');
const path = require('path');

const harness = fs.readFileSync(path.join(__dirname, 'e2e/harness.js'), 'utf8');
console.log('MockElement prototype methods in harness:');
console.log(harness.substring(harness.indexOf('class MockElement'), harness.indexOf('class MockElement') + 1200));
