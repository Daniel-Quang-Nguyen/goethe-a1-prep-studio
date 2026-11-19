const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('gramBlueprintToggleIcon');
if (pos !== -1) {
  console.log(html.substring(pos - 350, pos + 400));
}
