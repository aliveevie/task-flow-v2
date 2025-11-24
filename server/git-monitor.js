import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const GIT_REPO_URL = 'https://github.com/aliveevie/task-flow-v2.git';
const BRANCH = 'main';
const POLL_INTERVAL = 30000; // 30 seconds
const PM2_PROCESS_NAMES = {
  server: 'task-flow-server',
  frontend: 'task-flow-frontend',
  frontendDev: 'task-flow-frontend-dev',
  monitor: 'git-monitor'
};
const ROOT_DIR = join(__dirname, '..'); // Go up one level from server/ to project root

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function logSection(message) {
  console.log('\n' + colors.bright + colors.magenta + '='.repeat(60) + colors.reset);
  log(message, 'bright');
  console.log(colors.bright + colors.magenta + '='.repeat(60) + colors.reset + '\n');
}

async function runCommand(command, cwd = ROOT_DIR) {
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

async function checkGitRepo() {
  log('Checking if repository is initialized...', 'blue');
  const { success } = await runCommand('git rev-parse --git-dir');
  return success;
}

async function checkRemote() {
  log('Checking remote repository configuration...', 'blue');
  const { success, output } = await runCommand('git remote get-url origin');
  if (success && output.includes('task-flow-v2')) {
    log(`Remote configured: ${output}`, 'green');
    return true;
  }
  return false;
}

async function setupRemote() {
  log('Setting up remote repository...', 'yellow');
  const { success: hasRemote } = await runCommand('git remote get-url origin');
  
  if (!hasRemote) {
    log('Adding remote origin...', 'yellow');
    await runCommand(`git remote add origin ${GIT_REPO_URL}`);
  } else {
    log('Updating remote URL...', 'yellow');
    await runCommand(`git remote set-url origin ${GIT_REPO_URL}`);
  }
  
  log('Fetching from remote...', 'yellow');
  await runCommand('git fetch origin');
  log('Remote setup complete!', 'green');
}

async function getLocalCommit() {
  const { success, output } = await runCommand(`git rev-parse HEAD`);
  if (success) {
    return output;
  }
  return null;
}

async function getRemoteCommit() {
  log('Fetching latest commits from remote...', 'blue');
  const fetchResult = await runCommand('git fetch origin');
  if (!fetchResult.success) {
    log(`Failed to fetch: ${fetchResult.error}`, 'red');
    return null;
  }
  
  const { success, output } = await runCommand(`git rev-parse origin/${BRANCH}`);
  if (success) {
    return output;
  }
  return null;
}

async function hasChanges() {
  const localCommit = await getLocalCommit();
  const remoteCommit = await getRemoteCommit();
  
  if (!localCommit || !remoteCommit) {
    log('Could not determine commit hashes', 'yellow');
    return false;
  }
  
  log(`Local commit:  ${localCommit.substring(0, 7)}`, 'cyan');
  log(`Remote commit: ${remoteCommit.substring(0, 7)}`, 'cyan');
  
  if (localCommit !== remoteCommit) {
    log('⚠️  Changes detected!', 'yellow');
    return true;
  }
  
  log('✓ No changes detected', 'green');
  return false;
}

async function pullChanges() {
  logSection('PULLING CHANGES FROM REMOTE');
  
  log('Stashing local changes (if any)...', 'blue');
  await runCommand('git stash');
  
  log(`Pulling from origin/${BRANCH}...`, 'blue');
  const pullResult = await runCommand(`git pull origin ${BRANCH}`);
  
  if (!pullResult.success) {
    log(`Pull failed: ${pullResult.error}`, 'red');
    return false;
  }
  
  log('✓ Successfully pulled changes!', 'green');
  log(`Pull output: ${pullResult.output}`, 'cyan');
  
  // Check if there are new dependencies to install
  log('Checking for package.json changes...', 'blue');
  const { success: hasPackageChanges } = await runCommand('git diff HEAD@{1} HEAD --name-only | grep package.json');
  
  if (hasPackageChanges) {
    log('⚠️  package.json changed, installing dependencies...', 'yellow');
    log('Installing root dependencies...', 'blue');
    const rootInstall = await runCommand('npm install', ROOT_DIR);
    if (rootInstall.success) {
      log('✓ Root dependencies installed!', 'green');
    } else {
      log(`✗ Root dependencies install failed: ${rootInstall.error}`, 'red');
    }
    
    log('Installing server dependencies...', 'blue');
    const serverInstall = await runCommand('npm install', __dirname);
    if (serverInstall.success) {
      log('✓ Server dependencies installed!', 'green');
    } else {
      log(`✗ Server dependencies install failed: ${serverInstall.error}`, 'red');
    }
  }
  
  // Check for frontend changes (src, public, vite.config, etc.)
  log('Checking for frontend changes...', 'blue');
  const { success: hasFrontendChanges } = await runCommand('git diff HEAD@{1} HEAD --name-only | grep -E "(^src/|^public/|vite.config|package.json|tsconfig)"');
  
  if (hasFrontendChanges) {
    log('⚠️  Frontend files changed, building frontend...', 'yellow');
    logSection('BUILDING FRONTEND');
    
    const buildResult = await runCommand('npm run build', ROOT_DIR);
    if (buildResult.success) {
      log('✓ Frontend build successful!', 'green');
      log(`Build output: ${buildResult.output}`, 'cyan');
    } else {
      log(`✗ Frontend build failed: ${buildResult.error}`, 'red');
      log('Continuing with restart...', 'yellow');
    }
  }
  
  log('🔄 Ready to restart services with new changes...', 'yellow');
  return true;
}

async function getFrontendProcessName() {
  const distPath = join(ROOT_DIR, 'dist');
  const distExists = existsSync(distPath);
  return distExists ? PM2_PROCESS_NAMES.frontend : PM2_PROCESS_NAMES.frontendDev;
}

async function restartPM2() {
  logSection('RESTARTING PM2 PROCESSES');
  
  // Check which frontend process to use
  const frontendProcessName = await getFrontendProcessName();
  log(`Frontend process: ${frontendProcessName}`, 'cyan');
  log(`Server process: ${PM2_PROCESS_NAMES.server}`, 'cyan');
  
  // Restart server
  log(`Checking if ${PM2_PROCESS_NAMES.server} is running...`, 'blue');
  const serverStatus = await runCommand(`pm2 list | grep ${PM2_PROCESS_NAMES.server}`);
  
  if (serverStatus.success) {
    log(`Restarting ${PM2_PROCESS_NAMES.server}...`, 'blue');
    const serverRestart = await runCommand(`pm2 restart ${PM2_PROCESS_NAMES.server}`);
    
    if (serverRestart.success) {
      log(`✓ ${PM2_PROCESS_NAMES.server} restarted successfully!`, 'green');
      log(`Restart output: ${serverRestart.output}`, 'cyan');
    } else {
      log(`✗ ${PM2_PROCESS_NAMES.server} restart failed: ${serverRestart.error}`, 'red');
      log('Attempting to start the server...', 'yellow');
      const startResult = await runCommand(`cd ${__dirname} && pm2 start index.js --name ${PM2_PROCESS_NAMES.server}`);
      if (startResult.success) {
        log(`✓ ${PM2_PROCESS_NAMES.server} started!`, 'green');
      } else {
        log(`✗ ${PM2_PROCESS_NAMES.server} start failed: ${startResult.error}`, 'red');
      }
    }
  } else {
    log(`Process ${PM2_PROCESS_NAMES.server} not found. Starting server...`, 'yellow');
    const startResult = await runCommand(`cd ${__dirname} && pm2 start index.js --name ${PM2_PROCESS_NAMES.server}`);
    if (startResult.success) {
      log(`✓ ${PM2_PROCESS_NAMES.server} started!`, 'green');
    } else {
      log(`✗ ${PM2_PROCESS_NAMES.server} start failed: ${startResult.error}`, 'red');
    }
  }
  
  // Restart frontend
  log(`Checking if ${frontendProcessName} is running...`, 'blue');
  const frontendStatus = await runCommand(`pm2 list | grep ${frontendProcessName}`);
  
  if (frontendStatus.success) {
    log(`Restarting ${frontendProcessName}...`, 'blue');
    const frontendRestart = await runCommand(`pm2 restart ${frontendProcessName}`);
    
    if (frontendRestart.success) {
      log(`✓ ${frontendProcessName} restarted successfully!`, 'green');
      log(`Restart output: ${frontendRestart.output}`, 'cyan');
    } else {
      log(`✗ ${frontendProcessName} restart failed: ${frontendRestart.error}`, 'red');
      log('Attempting to start the frontend...', 'yellow');
      // Use ecosystem config to start frontend
      const startResult = await runCommand(`cd ${ROOT_DIR} && pm2 start ecosystem.config.js --only ${frontendProcessName}`);
      if (startResult.success) {
        log(`✓ ${frontendProcessName} started!`, 'green');
      } else {
        log(`✗ ${frontendProcessName} start failed: ${startResult.error}`, 'red');
      }
    }
  } else {
    log(`Process ${frontendProcessName} not found. Starting frontend...`, 'yellow');
    const startResult = await runCommand(`cd ${ROOT_DIR} && pm2 start ecosystem.config.js --only ${frontendProcessName}`);
    if (startResult.success) {
      log(`✓ ${frontendProcessName} started!`, 'green');
    } else {
      log(`✗ ${frontendProcessName} start failed: ${startResult.error}`, 'red');
      log('Note: Frontend may need to be built first. Run: npm run build', 'yellow');
    }
  }
  
  // Show PM2 status
  logSection('PM2 STATUS');
  log('Current PM2 process status:', 'blue');
  await runCommand('pm2 status');
  
  // Show logs info
  log('\n📋 To view logs:', 'cyan');
  log(`  pm2 logs ${PM2_PROCESS_NAMES.server}`, 'cyan');
  log(`  pm2 logs ${frontendProcessName}`, 'cyan');
  log(`  pm2 logs`, 'cyan');
}

async function monitor() {
  logSection('GIT MONITOR STARTED');
  log(`Repository: ${GIT_REPO_URL}`, 'cyan');
  log(`Branch: ${BRANCH}`, 'cyan');
  log(`Poll interval: ${POLL_INTERVAL / 1000} seconds`, 'cyan');
  log(`PM2 processes: ${PM2_PROCESS_NAMES.server}, ${PM2_PROCESS_NAMES.frontend}/${PM2_PROCESS_NAMES.frontendDev}`, 'cyan');
  log(`Root directory: ${ROOT_DIR}`, 'cyan');
  
  // Check if git repo exists
  const isGitRepo = await checkGitRepo();
  if (!isGitRepo) {
    log('⚠️  Not a git repository. Initializing...', 'yellow');
    await runCommand('git init');
    await setupRemote();
  } else {
    const hasRemote = await checkRemote();
    if (!hasRemote) {
      await setupRemote();
    }
  }
  
  // Main monitoring loop
  let iteration = 0;
  
  while (true) {
    iteration++;
    logSection(`MONITORING ITERATION #${iteration}`);
    
    try {
      const changesDetected = await hasChanges();
      
      if (changesDetected) {
        logSection('🔄 CHANGES DETECTED - PROCESSING UPDATE');
        log('🔄 Changes detected! Pulling latest changes...', 'yellow');
        
        const pullSuccess = await pullChanges();
        
        if (pullSuccess) {
          logSection('RESTARTING SERVICES');
          await restartPM2();
          logSection('✓ UPDATE COMPLETE');
          log('✓ All services successfully updated and restarted with new changes!', 'green');
          log('✓ Frontend and backend are now running with latest code!', 'green');
        } else {
          log('✗ Update failed! Could not pull changes.', 'red');
        }
      } else {
        log('✓ Repository is up to date', 'green');
      }
    } catch (error) {
      log(`Error during monitoring: ${error.message}`, 'red');
      log('Stack trace:', 'red');
      console.error(error);
    }
    
    log(`Waiting ${POLL_INTERVAL / 1000} seconds before next check...`, 'blue');
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logSection('SHUTTING DOWN MONITOR');
  log('Received SIGINT, exiting gracefully...', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logSection('SHUTTING DOWN MONITOR');
  log('Received SIGTERM, exiting gracefully...', 'yellow');
  process.exit(0);
});

// Start monitoring
monitor().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

