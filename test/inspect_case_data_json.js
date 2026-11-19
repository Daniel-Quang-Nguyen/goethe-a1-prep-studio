const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const pos = html.indexOf('window.CASE_TRANSFORMER_DATA =');
const endPos = html.indexOf(';\n', pos);
console.log('CASE_TRANSFORMER_DATA length:', endPos - pos);

const jsonStr = html.substring(pos + 'window.CASE_TRANSFORMER_DATA = '.length, endPos);
const data = JSON.parse(jsonStr);
console.log('Keys of CASE_TRANSFORMER_DATA:', Object.keys(data));
console.log('Cases:', data.cases.map(c => c.id));
console.log('Genders:', data.genders.map(g => g.id));
console.log('Determiners:', data.determiners.map(d => d.id));
console.log('Matrix keys:', Object.keys(data.matrix));
