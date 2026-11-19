const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const fnPos = html.indexOf('function renderGrammarLab');
const nextFn = html.indexOf('\nfunction ', fnPos + 10);
console.log(html.substring(fnPos, nextFn !== -1 ? nextFn : fnPos + 4000));
