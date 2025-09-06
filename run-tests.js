import { execSync } from 'child_process';

try {
  console.log('Running tests...');
  execSync('npx jest --coverage --passWithNoTests --ci', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, CI: 'true' },
  });
  console.log('Tests completed successfully');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
