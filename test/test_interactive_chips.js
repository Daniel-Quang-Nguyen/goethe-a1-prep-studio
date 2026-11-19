const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

console.log('=== CSS Rules Audit for Grammar Studio ===');

const selectors = [
  '.studio-subtab',
  '.gram-word-chip',
  '#gramGlossPopover',
  '.gram-slot-token',
  'body.dark .studio-subtab',
  'body.dark .gram-word-chip',
  'body.dark #gramGlossPopover'
];

selectors.forEach(sel => {
  const has = html.includes(sel);
  console.log(`${sel}: ${has ? 'FOUND in style' : 'MISSING'}`);
});
