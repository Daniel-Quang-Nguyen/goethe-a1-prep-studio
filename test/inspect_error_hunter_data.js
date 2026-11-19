const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('const ERROR_HUNTER_DATA =');
if (pos !== -1) {
  console.log(html.substring(pos, pos + 2000));
} else {
  console.log('const ERROR_HUNTER_DATA not found');
}
