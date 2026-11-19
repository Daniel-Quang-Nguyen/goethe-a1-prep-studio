const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { loadApp } = require('./e2e/harness');

const app = loadApp();
const topics = app.globals.GRAMMAR_TOPICS;

console.log('=== Checking all 8 GRAMMAR_TOPICS blueprints ===');
assert.strictEqual(topics.length, 8, 'Must have 8 topics');

topics.forEach((t, i) => {
  console.log(`\nTopic ${i + 1}: ${t.id} ("${t.title}")`);
  assert.ok(t.blueprint, `Topic ${t.id} missing blueprint`);
  assert.ok(t.blueprint.coreRule, `Topic ${t.id} missing blueprint.coreRule`);
  assert.ok(Array.isArray(t.blueprint.anchorBadges) && t.blueprint.anchorBadges.length > 0, `Topic ${t.id} missing anchorBadges`);
  assert.ok(t.blueprint.satzklammer, `Topic ${t.id} missing blueprint.satzklammer`);
  assert.ok(t.blueprint.visualTable, `Topic ${t.id} missing blueprint.visualTable`);
  assert.ok(t.blueprint.examTrap, `Topic ${t.id} missing blueprint.examTrap`);
  assert.ok(t.blueprint.a1Pillars, `Topic ${t.id} missing blueprint.a1Pillars`);
  console.log(` - anchorBadges: ${t.blueprint.anchorBadges.length}`);
  console.log(` - coreRule length: ${t.blueprint.coreRule.length}`);
  console.log(` - satzklammer: ${t.blueprint.satzklammer}`);
  console.log(` - visualTable: ${t.blueprint.visualTable.substring(0, 40)}...`);
  console.log(` - examTrap length: ${t.blueprint.examTrap.length}`);
  console.log(` - a1Pillars length: ${t.blueprint.a1Pillars.length}`);
});

console.log('\nAll 8 topic blueprints are complete and fully structured!');
process.exit(0);
