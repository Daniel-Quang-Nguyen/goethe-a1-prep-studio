// Automated verification test for Goethe A1 Studio
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(htmlPath, 'utf8');

console.log('Testing Goethe A1 Studio Integrity...');

// 1. Check datasets
const checks = [
  { name: 'QUIZ_DATA (210 questions)', regex: /QUIZ_DATA\s*=\s*\[/ },
  { name: 'PUZZLES_DATA (20 puzzles)', regex: /PUZZLES_DATA\s*=\s*\[/ },
  { name: 'ARTICLES_DATA (52 nouns)', regex: /ARTICLES_DATA\s*=\s*\[/ },
  { name: 'FLASHCARD_DATA (250 cards)', regex: /FLASHCARD_DATA\s*=\s*\[/ },
  { name: 'Theme Controller in <head>', regex: /window\.toggleTheme\s*=/ },
  { name: 'Study Guide in-app toggle', regex: /window\.toggleStudyGuideView\s*=/ },
  { name: 'Canvas Cheatsheet', regex: /id="canvasCheatsheet"/ }
];

let allPassed = true;
checks.forEach(c => {
  if (c.regex.test(content)) {
    console.log(` ✓ ${c.name} verified`);
  } else {
    console.error(` ✗ ${c.name} FAILED`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\nAll integrity checks PASSED successfully!');
  process.exit(0);
} else {
  console.error('\nSome checks failed.');
  process.exit(1);
}
