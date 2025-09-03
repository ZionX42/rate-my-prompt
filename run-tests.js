const { execSync } = require('child_process');

try {
  console.log('Running tests...');
  const result = execSync('npx jest --coverage --passWithNoTests --ci', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, CI: 'true' },
  });
  console.log('Tests completed successfully');
} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
