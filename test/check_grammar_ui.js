const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

console.log('Searching for studioGrammar and related markup...');

const grammarStart = html.indexOf('id="studioGrammar"');
if (grammarStart !== -1) {
  console.log('Found id="studioGrammar" at pos', grammarStart);
  console.log('--- studioGrammar snippet (first 1500 chars) ---');
  console.log(html.substring(grammarStart - 50, grammarStart + 1500));
} else {
  console.error('studioGrammar not found!');
}
