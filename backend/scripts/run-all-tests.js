const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  'test-phase1.js',
  'test-phase2.js',
  'test-phase3.js',
  'test-phase6-7.js',
];

console.log('========================================================');
console.log('RUNNING ALL THREE-WAY MATCH ENGINE AUTOMATED TEST SUITES');
console.log('========================================================\n');

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  console.log(`\n>>> Running: ${script}...`);
  try {
    const output = execSync(`node "${scriptPath}"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
    console.log(output.toString());
  } catch (err) {
    console.error(`❌ Test failed in ${script}:`);
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(1);
  }
}

console.log('\n========================================================');
console.log('✅ ALL TEST SUITES PASSED WITH 100% SUCCESS!');
console.log('========================================================\n');
process.exit(0);
