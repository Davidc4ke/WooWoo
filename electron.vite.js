// Simple script to compile and launch Electron main process
const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'dist', 'main');
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// Compile main process TypeScript
execSync('npx tsc -p tsconfig.main.json', { stdio: 'inherit' });
