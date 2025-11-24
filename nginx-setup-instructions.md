# Nginx Setup Instructions for VPS

## Problem
Your nginx config was proxying to the public IP `105.114.20.206:3000`, but since nginx and your Node.js server are on the same VPS, it should use `localhost:3000`.

## Solution

### Step 1: Update Nginx Configuration

The nginx config file has been updated. Now you need to:

1. **Copy the config to nginx sites-available:**
   ```bash
   sudo cp /home/galaxy/task-flow/nginx /etc/nginx/sites-available/api.galaxyitt.com.ng
   ```

2. **Create symbolic link to sites-enabled:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.galaxyitt.com.ng /etc/nginx/sites-enabled/
   ```

3. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **If test passes, reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

### Step 2: Ensure Server is Running with PM2

Make sure your server is running on the VPS:

```bash
cd /home/galaxy/task-flow/server

# Check if PM2 processes are running
npx pm2 list

# If not running, start them:
npx pm2 start ecosystem.config.js

# Save the process list
npx pm2 save

# Set up PM2 to start on boot (if not already done)
npx pm2 startup systemd
# Then run the command it outputs with sudo
```

### Step 3: Verify Everything Works

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check nginx is proxying correctly:**
   ```bash
   curl https://api.galaxyitt.com.ng/api/health
   ```

3. **Check nginx status:**
   ```bash
   sudo systemctl status nginx
   ```

## Key Changes Made

- Changed `proxy_pass` from `http://105.114.20.206:3000` to `http://localhost:3000`
- Added `proxy_http_version 1.1` for better HTTP/1.1 support
- Added WebSocket support headers (Upgrade, Connection)
- Added timeout settings for better reliability
- Added `proxy_cache_bypass` for WebSocket connections

## Troubleshooting

### If you still get 404:

1. **Check if server is listening on port 3000:**
   ```bash
   sudo netstat -tlnp | grep 3000
   # or
   sudo ss -tlnp | grep 3000
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Check nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Verify nginx config syntax:**
   ```bash
   sudo nginx -t
   ```

### If nginx config file doesn't exist:

If `/etc/nginx/sites-available/` doesn't exist, your nginx might use a different structure. Check:

```bash
# Check nginx config location
sudo nginx -T | grep "configuration file"

# Common locations:
# /etc/nginx/nginx.conf
# /etc/nginx/conf.d/
```

Then add the server block directly to the main config or create it in `conf.d/`.

### Firewall Issues

Make sure port 80 is open:

```bash
# For UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

