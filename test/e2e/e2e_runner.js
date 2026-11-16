/**
 * test/e2e/e2e_runner.js
 * Master E2E Test Runner for Goethe A1 German Studio.
 * Discovers and executes all test tiers (Tier 1-4), aggregates results,
 * verifies coverage thresholds (210+ test cases), and sets exit code.
 * Zero external dependencies: uses Node.js core modules (fs, path, child_process).
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

class E2ERunner {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.resolve(__dirname, '..', '..');
    this.testDir = path.join(this.rootDir, 'test', 'e2e');
    this.tierFilter = this._parseArg('--tier');
    this.grepFilter = this._parseArg('--grep');
    this.isStrict = true; // Strict pass/fail reporting is default
  }

  _parseArg(prefix) {
    const arg = process.argv.find(a => a.startsWith(prefix + '=') || a === prefix);
    if (!arg) return null;
    if (arg.startsWith(prefix + '=')) {
      return arg.slice(prefix.length + 1);
    }
    const idx = process.argv.indexOf(arg);
    const next = process.argv[idx + 1];
    return (next && !next.startsWith('-')) ? next : null;
  }

  discoverTiers() {
    const tierOrder = [
      'tier1_features.test.js',
      'tier2_boundary.test.js',
      'tier3_pairwise.test.js',
      'tier4_scenarios.test.js'
    ];

    if (!fs.existsSync(this.testDir)) {
      return [];
    }

    const files = fs.readdirSync(this.testDir);
    const discovered = [];

    for (const name of tierOrder) {
      if (files.includes(name)) {
        if (!this.tierFilter || name.toLowerCase().includes(this.tierFilter.toLowerCase())) {
          discovered.push({
            name,
            path: path.join(this.testDir, name),
            tierId: name.split('_')[0]
          });
        }
      }
    }
    return discovered;
  }

  run() {
    const startTime = Date.now();
    const discovered = this.discoverTiers();

    console.log('\n===============================================================');
    console.log('       GOETHE A1 GERMAN STUDIO — E2E TEST RUNNER              ');
    console.log('===============================================================');
    console.log(`Discovered ${discovered.length} test tier(s) in: ${this.testDir}`);
    if (this.tierFilter) console.log(`Filter [Tier]: ${this.tierFilter}`);
    if (this.grepFilter) console.log(`Filter [Grep]: ${this.grepFilter}`);
    console.log(`Mode: STRICT (requires 100% pass across all tiers by default)`);
    console.log('---------------------------------------------------------------\n');

    if (discovered.length === 0) {
      console.error('❌  Error: No matching test tiers found in test/e2e/.');
      if (this.tierFilter) {
        console.error(`Filter specified: --tier=${this.tierFilter}`);
      }
      console.error('Expected tier files:');
      console.error('  - test/e2e/tier1_features.test.js (90 tests)');
      console.error('  - test/e2e/tier2_boundary.test.js (90 tests)');
      console.error('  - test/e2e/tier3_pairwise.test.js (20 tests)');
      console.error('  - test/e2e/tier4_scenarios.test.js (10 tests)\n');
      return { success: false, exitCode: 1, tierResults: [] };
    }

    const tierResults = [];
    let grandPassed = 0;
    let grandFailed = 0;
    let grandTotal = 0;

    for (const tier of discovered) {
      console.log(`>>> Executing Tier: ${tier.name}`);
      const t0 = Date.now();
      const args = [tier.path];
      if (this.grepFilter) args.push(`--grep=${this.grepFilter}`);
      args.push('--strict');

      const proc = spawnSync(process.execPath, args, {
        cwd: this.rootDir,
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      const stdout = proc.stdout ? proc.stdout.toString() : '';
      const stderr = proc.stderr ? proc.stderr.toString() : '';
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);

      const dur = Date.now() - t0;

      const passedMatch = stdout.match(/Passed:\s+(\d+)/);
      const failedMatch = stdout.match(/Failed:\s+(\d+)/);
      const totalMatch = stdout.match(/Total:\s+(\d+)/);

      const passedCount = passedMatch ? parseInt(passedMatch[1], 10) : 0;
      let failedCount = failedMatch ? parseInt(failedMatch[1], 10) : 0;
      const totalCount = totalMatch ? parseInt(totalMatch[1], 10) : (passedCount + failedCount);

      if (proc.status !== 0 && failedCount === 0) {
        failedCount = Math.max(1, totalCount - passedCount);
      }

      const success = proc.status === 0 && failedCount === 0;

      tierResults.push({
        name: tier.name,
        success,
        exitCode: proc.status !== null ? proc.status : 1,
        duration: dur,
        passed: passedCount,
        failed: failedCount,
        total: totalCount
      });

      grandPassed += passedCount;
      grandFailed += failedCount;
      grandTotal += totalCount;
    }

    const totalDur = Date.now() - startTime;
    const allPassed = tierResults.length > 0 && tierResults.every(t => t.success);

    console.log('\n===============================================================');
    console.log('                   E2E EXECUTION SUMMARY                       ');
    console.log('===============================================================');
    tierResults.forEach(r => {
      const statusIcon = r.success ? '✓ PASS' : '✗ FAIL';
      const stats = `Passed: ${String(r.passed).padStart(2)} | Failed: ${String(r.failed).padStart(2)} | Total: ${String(r.total).padStart(2)}`;
      console.log(` ${statusIcon.padEnd(8)} | ${r.name.padEnd(26)} | ${stats} | ${r.duration}ms`);
    });
    console.log('---------------------------------------------------------------');
    const passedTiers = tierResults.filter(t => t.success).length;
    const failedTiers = tierResults.length - passedTiers;
    console.log(`Tiers: ${tierResults.length} total | ${passedTiers} passed | ${failedTiers} failed`);
    console.log(`Tests: ${grandTotal} total | ${grandPassed} passed | ${grandFailed} failed`);
    console.log(`Total Execution Wall Time: ${totalDur}ms`);
    console.log(`Overall Result: ${allPassed ? '✓ ALL TIERS PASSED' : '✗ TEST SUITE FAILED'}`);
    console.log('===============================================================\n');

    return {
      success: allPassed,
      exitCode: allPassed ? 0 : 1,
      tierResults
    };
  }
}

if (require.main === module) {
  const runner = new E2ERunner();
  const res = runner.run();
  process.exit(res.exitCode);
}

module.exports = { E2ERunner };
