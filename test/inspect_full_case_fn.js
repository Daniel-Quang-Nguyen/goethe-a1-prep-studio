const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('function renderCaseTransformer');
const nextFn = html.indexOf('\nfunction ', pos + 10);
console.log(html.substring(pos, nextFn !== -1 ? nextFn : pos + 3000));
