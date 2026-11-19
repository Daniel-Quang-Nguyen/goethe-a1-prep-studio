const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('function setCaseFilter');
if (pos !== -1) {
  console.log(html.substring(pos, pos + 500));
} else {
  console.log('function setCaseFilter not found');
}
