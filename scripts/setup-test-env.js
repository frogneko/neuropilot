const fs = require('fs');
const path = require('path');

const packageJsonContent = {
  name: "neuropilot",
  displayName: "NeuroPilot",
  version: "2.0.3",
  publisher: "Pasu4",
  engines: {
    vscode: "^1.95.0"
  },
  main: "./extension.js",
  activationEvents: ["*"]
};

const outputDirs = ['out/desktop', 'out/web', 'out/test'];

console.log('Setting up test environment...');

outputDirs.forEach(dir => {
  const packageJsonPath = path.join(dir, 'package.json');
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));
    console.log(`✅ Created ${packageJsonPath}`);
  } catch (error) {
    console.error(`❌ Failed to create ${packageJsonPath}:`, error.message);
  }
});

console.log('Test environment setup complete!');
