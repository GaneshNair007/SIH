import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting Clean Build Stress Test...');
for (let i = 1; i <= 3; i++) {
  console.log(`\n================ RUN ${i} ================`);
  try {
    if (fs.existsSync('.next')) {
      fs.rmSync('.next', { recursive: true, force: true });
    }
    const stdout = execSync('npm run build', { stdio: 'inherit' });
    console.log(`Run ${i} SUCCESS`);
  } catch (err) {
    console.error(`Run ${i} FAILED:`, err.message);
    process.exit(1);
  }
}
console.log('\nAll 3 successive clean builds passed!');
