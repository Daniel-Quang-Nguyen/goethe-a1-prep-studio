const fs = require('fs');
const path = require('path');

const harness = fs.readFileSync(path.join(__dirname, 'e2e/harness.js'), 'utf8');
const lines = harness.split('\n');
console.log(lines.slice(70, 105).join('\n'));
