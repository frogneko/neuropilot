const { execSync } = require('child_process');
const path = require('path');

// First build the project
console.log('Building project...');
execSync('pnpm build', { stdio: 'inherit' });

// Then run the tests using Mocha with the built files
console.log('Running unit tests...');
execSync('npx mocha --config mocha.config.js', { stdio: 'inherit' });
