const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('const A1_GLOSS_DICT');
if (pos !== -1) {
  console.log(html.substring(pos, pos + 800));
} else {
  console.log('A1_GLOSS_DICT not found');
}
