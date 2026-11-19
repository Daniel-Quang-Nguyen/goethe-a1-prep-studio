const fs = require('fs');
const path = require('path');

const harness = fs.readFileSync(path.join(__dirname, 'e2e/harness.js'), 'utf8');
const pos = harness.indexOf('set innerHTML');
console.log(harness.substring(pos, pos + 400));
