const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const fnPos = html.indexOf('function switchGrammarView');
if (fnPos !== -1) {
  console.log(html.substring(fnPos, fnPos + 1200));
} else {
  console.log('function switchGrammarView not found');
}
