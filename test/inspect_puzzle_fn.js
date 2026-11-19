const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function findFunction(name) {
  const start = html.indexOf(`function ${name}`);
  if (start === -1) return `Function ${name} not found`;
  const nextFn = html.indexOf('\nfunction ', start + 10);
  return html.substring(start, nextFn !== -1 ? nextFn : start + 3000);
}

console.log('=== renderPuzzle ===');
console.log(findFunction('renderPuzzle').substring(0, 1500));
