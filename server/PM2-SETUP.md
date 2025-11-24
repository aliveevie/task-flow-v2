# PM2 Setup Guide - Keep Server Running Forever

This guide will help you configure PM2 to keep your server and git-monitor running continuously, even after reboots.

## Quick Setup (One-Time Configuration)

### Step 1: Run the Setup Script

On your VPS server, navigate to the server directory and run:

```bash
cd /home/galaxy/task-flow/server
./setup-pm2-startup.sh
```

### Step 2: Execute the Generated Startup Command

The script will output a command that looks like:
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u your-username --hp /home/your-username
```

**Copy and run this command** - it configures PM2 to start automatically on system boot.

### Step 3: Verify Everything is Working

```bash
# Check if processes are running
pm2 list

# Check logs
pm2 logs

# Save the current process list (important!)
pm2 save
```

## Manual Setup (Alternative Method)

If the script doesn't work, follow these steps manually:

### 1. Start Your Applications

```bash
cd /home/galaxy/task-flow/server
pm2 start ecosystem.config.js
```

### 2. Save the Process List

```bash
pm2 save
```

This saves your current PM2 process list so it can be restored after reboot.

### 3. Configure PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup systemd

# This will output a command - copy and run it with sudo
# Example output:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u galaxy --hp /home/galaxy
```

### 4. Verify Startup Configuration

```bash
# Check if startup script is installed
systemctl status pm2-galaxy  # Replace 'galaxy' with your username

# Test by rebooting (optional)
sudo reboot
# After reboot, check if processes are running:
pm2 list
```

## Important PM2 Commands

```bash
# View all processes
pm2 list

# View logs (all processes)
pm2 logs

# View logs for specific process
pm2 logs task-flow-server
pm2 logs git-monitor

# Restart all processes
pm2 restart all

# Restart specific process
pm2 restart task-flow-server
pm2 restart git-monitor

# Stop all processes
pm2 stop all

# Stop specific process
pm2 stop task-flow-server

# Delete all processes (removes from PM2)
pm2 delete all

# Save current process list (do this after any changes)
pm2 save

# View process information
pm2 info task-flow-server
pm2 info git-monitor

# Monitor processes in real-time
pm2 monit
```

## Troubleshooting

### Processes Not Starting on Boot

1. **Check if startup script is installed:**
   ```bash
   systemctl status pm2-$(whoami)
   ```

2. **Re-run startup configuration:**
   ```bash
   pm2 unstartup systemd
   pm2 startup systemd
   # Then run the generated command
   pm2 save
   ```

3. **Check PM2 logs:**
   ```bash
   pm2 logs --err
   ```

### Processes Keep Crashing

1. **Check application logs:**
   ```bash
   pm2 logs task-flow-server --err
   pm2 logs git-monitor --err
   ```

2. **Check system resources:**
   ```bash
   pm2 monit
   ```

3. **Verify environment variables are set correctly**

### PM2 Not Found After Reboot

If PM2 commands don't work after reboot, you may need to:

1. **Reinstall PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Reconfigure startup:**
   ```bash
   pm2 startup systemd
   # Run the generated command
   pm2 save
   ```

## Configuration Details

The `ecosystem.config.js` file includes these persistence settings:

- `autorestart: true` - Automatically restart if process crashes
- `min_uptime: '10s'` - Process must run for 10 seconds to be considered stable
- `max_restarts: 10` - Maximum restart attempts
- `restart_delay: 4000` - Wait 4 seconds before restarting
- `kill_timeout: 5000` - Time to wait before force killing

## Verification Checklist

After setup, verify:

- [ ] `pm2 list` shows both `task-flow-server` and `git-monitor` running
- [ ] `pm2 save` completes without errors
- [ ] Startup script is installed (check with `systemctl status pm2-$(whoami)`)
- [ ] Processes survive a reboot (test with `sudo reboot`)

## Notes

- PM2 processes will now start automatically when the VPS boots
- Processes will automatically restart if they crash
- You can safely disconnect from SSH - processes will keep running
- Use `pm2 save` after making any changes to your PM2 configuration

