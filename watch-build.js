import { exec } from 'child_process';
import { promisify } from 'util';
import { watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

let buildTimeout;
let isBuilding = false;

async function build() {
  if (isBuilding) {
    log('Build already in progress, skipping...', 'yellow');
    return;
  }

  isBuilding = true;
  log('🔄 File changes detected, building frontend...', 'yellow');
  
  try {
    const { stdout, stderr } = await execAsync('npm run build', { cwd: __dirname });
    log('✓ Build successful!', 'green');
    
    // Restart PM2 frontend process
    log('🔄 Restarting frontend...', 'blue');
    try {
      await execAsync('pm2 restart task-flow-frontend || pm2 start ecosystem.config.js --only task-flow-frontend', { cwd: __dirname });
      log('✓ Frontend restarted!', 'green');
    } catch (error) {
      log(`⚠️  PM2 restart failed: ${error.message}`, 'yellow');
    }
  } catch (error) {
    log(`✗ Build failed: ${error.message}`, 'red');
  } finally {
    isBuilding = false;
  }
}

function debouncedBuild() {
  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(build, 2000); // Wait 2 seconds after last change
}

log('👀 Watching for file changes...', 'cyan');
log('Watching: src/, public/, vite.config.*, package.json', 'blue');

// Watch src directory
watch(join(__dirname, 'src'), { recursive: true }, (eventType, filename) => {
  if (filename && !filename.includes('node_modules')) {
    log(`File changed: ${filename}`, 'cyan');
    debouncedBuild();
  }
});

// Watch public directory
watch(join(__dirname, 'public'), { recursive: true }, (eventType, filename) => {
  if (filename) {
    log(`File changed: public/${filename}`, 'cyan');
    debouncedBuild();
  }
});

// Watch config files
['vite.config.ts', 'vite.config.js', 'package.json', 'tsconfig.json'].forEach(file => {
  const filePath = join(__dirname, file);
  try {
    watch(filePath, (eventType) => {
      log(`Config changed: ${file}`, 'cyan');
      debouncedBuild();
    });
  } catch (error) {
    // File might not exist, ignore
  }
});

log('✓ File watcher started!', 'green');
log('Press Ctrl+C to stop', 'cyan');

