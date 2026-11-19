const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('gramBlueprintDrawer');
if (pos !== -1) {
  console.log('--- HTML around gramBlueprintDrawer (1500 chars) ---');
  console.log(html.substring(pos - 400, pos + 1000));
} else {
  console.log('gramBlueprintDrawer not found in html');
}
