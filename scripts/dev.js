const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '..', 'dist', 'main');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Compile Electron main process
console.log('Compiling Electron main process...');
execSync('npx tsc -p tsconfig.main.json', {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

// Start Vite dev server
console.log('Starting Vite dev server...');
const vite = spawn('npx', ['vite', '--host'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '..'),
  env: { ...process.env },
});

let viteUrl = '';

vite.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  // Detect when Vite is ready
  const match = output.match(/Local:\s+(http:\/\/[^\s]+)/);
  if (match && !viteUrl) {
    viteUrl = match[1];
    console.log(`\nVite ready at ${viteUrl}, launching Electron...`);

    // Launch Electron
    const electron = spawn('npx', ['electron', './dist/main/src/main/main.js'], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        VITE_DEV_SERVER_URL: viteUrl,
      },
    });

    electron.on('close', () => {
      vite.kill();
      process.exit(0);
    });
  }
});

vite.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

vite.on('close', (code) => {
  process.exit(code || 0);
});
