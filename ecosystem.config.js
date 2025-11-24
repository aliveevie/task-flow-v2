const fs = require('fs');
const path = require('path');

// Check if dist folder exists
const distExists = fs.existsSync(path.join(__dirname, 'dist'));

module.exports = {
  apps: [
    // Frontend - Production (if dist exists)
    ...(distExists ? [{
      name: 'task-flow-frontend',
      script: 'vite',
      args: 'preview --host 0.0.0.0 --port 8080',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'dist', 'logs', '.git'],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      exec_mode: 'fork'
    }] : []),
    // Frontend - Development (if dist doesn't exist)
    ...(!distExists ? [{
      name: 'task-flow-frontend-dev',
      script: 'vite',
      args: '--host 0.0.0.0',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: true,
      watch_delay: 1000,
      ignore_watch: ['node_modules', 'dist', 'logs', '.git'],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development'
      },
      error_file: './logs/frontend-dev-error.log',
      out_file: './logs/frontend-dev-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      exec_mode: 'fork'
    }] : []),
    // Backend Server
    {
      name: 'task-flow-server',
      script: './server/index.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './server/logs/server-error.log',
      out_file: './server/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    // Git Monitor
    {
      name: 'git-monitor',
      script: './server/git-monitor.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production'
      },
      error_file: './server/logs/monitor-error.log',
      out_file: './server/logs/monitor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
