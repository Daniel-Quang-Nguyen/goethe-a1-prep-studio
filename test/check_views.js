const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const views = ['gramViewLab', 'gramViewV2', 'gramViewTransformer', 'gramViewHunter', 'gramViewMatrix'];

views.forEach(v => {
  const pos = html.indexOf(`id="${v}"`);
  console.log(`View ${v}: ${pos !== -1 ? 'FOUND at ' + pos : 'NOT FOUND'}`);
  if (pos !== -1) {
    console.log(`--- ${v} preview (600 chars) ---`);
    console.log(html.substring(pos, pos + 600));
  }
});
