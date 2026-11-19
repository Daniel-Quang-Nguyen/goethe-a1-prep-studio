const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function findFunction(name) {
  const start = html.indexOf(`function ${name}`);
  if (start === -1) return `Function ${name} not found`;
  const nextFn = html.indexOf('\nfunction ', start + 10);
  return html.substring(start, nextFn !== -1 ? nextFn : start + 1500);
}

console.log('=== checkPuzzle ===');
console.log(findFunction('checkPuzzle'));

console.log('=== clearPuzzle ===');
console.log(findFunction('clearPuzzle'));
