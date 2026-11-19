const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

function findFunction(name) {
  const start = html.indexOf(`function ${name}`);
  if (start === -1) return `Function ${name} not found`;
  // find matching or next function
  const nextFn = html.indexOf('\nfunction ', start + 10);
  return html.substring(start, nextFn !== -1 ? nextFn : start + 3000);
}

console.log('=== renderCaseTransformer ===');
console.log(findFunction('renderCaseTransformer').substring(0, 1500));

console.log('=== renderErrorHunter ===');
console.log(findFunction('renderErrorHunter').substring(0, 1500));
