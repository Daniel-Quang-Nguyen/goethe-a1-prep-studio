const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('.gram-word-chip');
if (pos !== -1) {
  console.log('--- CSS around .gram-word-chip ---');
  console.log(html.substring(pos - 100, pos + 1000));
} else {
  console.log('.gram-word-chip not found');
}
