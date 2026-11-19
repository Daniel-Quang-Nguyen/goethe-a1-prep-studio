const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('function getWordGloss');
if (pos !== -1) {
  console.log(html.substring(pos, pos + 1000));
} else {
  console.log('function getWordGloss not found');
}
