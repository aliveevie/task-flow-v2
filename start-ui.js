import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
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

async function runCommand(command, cwd = __dirname) {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stderr && !stderr.includes('warning')) {
      log(`Warning: ${stderr}`, 'yellow');
    }
    return { success: true, output: stdout.trim(), error: null };
  } catch (error) {
    return { success: false, output: null, error: error.message };
  }
}

async function startUI() {
  log('🚀 Starting UI in production mode...', 'blue');
  
  const distPath = join(__dirname, 'dist');
  const distExists = existsSync(distPath);
  
  if (!distExists) {
    log('📦 dist folder not found, building frontend...', 'yellow');
    const buildResult = await runCommand('npm run build');
    
    if (!buildResult.success) {
      log(`✗ Build failed: ${buildResult.error}`, 'red');
      process.exit(1);
    }
    
    log('✓ Build successful!', 'green');
  } else {
    log('✓ dist folder exists, skipping build', 'green');
  }
  
  // Check if frontend is already running
  log('Checking if frontend is already running...', 'blue');
  const statusResult = await runCommand('pm2 list | grep task-flow-frontend');
  
  if (statusResult.success) {
    log('Frontend is already running, restarting...', 'yellow');
    const restartResult = await runCommand('pm2 restart task-flow-frontend');
    if (restartResult.success) {
      log('✓ Frontend restarted!', 'green');
    } else {
      log(`✗ Restart failed: ${restartResult.error}`, 'red');
    }
  } else {
    log('Starting frontend with PM2...', 'blue');
    const startResult = await runCommand('pm2 start ecosystem.config.js --only task-flow-frontend');
    if (startResult.success) {
      log('✓ Frontend started!', 'green');
    } else {
      log(`✗ Start failed: ${startResult.error}`, 'red');
      process.exit(1);
    }
  }
  
  log('\n✅ UI is now running in production mode!', 'green');
  log('📝 Git monitor will automatically rebuild and restart on git changes', 'cyan');
  log('📋 View logs: pm2 logs task-flow-frontend', 'cyan');
}

startUI().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

