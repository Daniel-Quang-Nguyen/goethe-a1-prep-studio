const { loadApp } = require('./e2e/harness');

const app = loadApp();
const topics = app.globals.GRAMMAR_TOPICS;

console.log('=== Checking A1 Missing Pillars in blueprints ===');
const pillars = [
  { name: 'Das Perfekt', keyword: 'perfekt' },
  { name: 'Der Imperativ', keyword: 'imperativ' },
  { name: 'Possessives', keyword: 'possessiv' },
  { name: 'Dative pronouns', keyword: 'dativpronomen' },
  { name: 'ADUSO', keyword: 'aduso' }
];

pillars.forEach(p => {
  console.log(`\n--- Pillar: ${p.name} ---`);
  let found = false;
  topics.forEach(t => {
    const text = (t.blueprint.a1Pillars || '') + ' ' + (t.blueprint.visualTable || '') + ' ' + (t.blueprint.examTrap || '');
    if (text.toLowerCase().includes(p.keyword)) {
      found = true;
      console.log(`Found in topic [${t.id}] "${t.title}":`);
      // extract snippet
      const pos = text.toLowerCase().indexOf(p.keyword);
      console.log(text.substring(Math.max(0, pos - 50), Math.min(text.length, pos + 250)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
    }
  });
  if (!found) {
    console.error(`Pillar ${p.name} NOT FOUND in blueprints!`);
  }
});

process.exit(0);
