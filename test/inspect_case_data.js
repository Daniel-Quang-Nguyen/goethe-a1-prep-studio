const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('const CASE_TRANSFORMER_DATA');
if (pos !== -1) {
  console.log(html.substring(pos, pos + 2500));
} else {
  console.log('const CASE_TRANSFORMER_DATA not found');
}
