# Fix Nginx Frontend - Showing Default Page

## Problem
You're seeing the default "Welcome to nginx!" page instead of your frontend application.

## Solution Steps

### Step 1: Check Current Nginx Config

```bash
# Check what config is currently active
sudo cat /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
sudo cat /etc/nginx/sites-enabled/taskflow.galaxyitt.com.ng
```

### Step 2: Remove Default Nginx Config (if interfering)

```bash
# Remove default nginx site if it exists
sudo rm /etc/nginx/sites-enabled/default

# Or disable it
sudo unlink /etc/nginx/sites-enabled/default
```

### Step 3: Copy and Apply Your Config

```bash
cd ~/task-flow-v2

# Copy the config
sudo cp nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng

# Make sure it's enabled
sudo ln -sf /etc/nginx/sites-available/taskflow.galaxyitt.com.ng /etc/nginx/sites-enabled/

# Verify it's linked
ls -la /etc/nginx/sites-enabled/ | grep taskflow
```

### Step 4: Check if Frontend is Running

```bash
# Check if frontend is running on port 8080
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080

# Check PM2 status
pm2 list

# If frontend is not running, start it:
npm run pm2:start:ui
```

### Step 5: Test Nginx Config and Reload

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### Step 6: Check Nginx Logs

```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### Step 7: Test Direct Connection

```bash
# Test if frontend is accessible directly
curl http://10.1.1.205:8080
# or
curl https://taskflow.galaxyitt.com.ng
```

## Common Issues

### Issue 1: Default Nginx Config Taking Precedence

The default nginx config might be catching all requests. Make sure it's disabled:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Issue 2: Frontend Not Running

If the frontend isn't running on port 8080:

```bash
# Start frontend
npm run pm2:start:ui

# Or check if it's running
pm2 list
pm2 logs task-flow-frontend
```

### Issue 3: Wrong Proxy Address

If your frontend is on a different IP or port, update the nginx config:

```bash
sudo nano /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
```

Change this line:
```nginx
proxy_pass http://10.1.1.205:8080;
```

To match your actual frontend address (could be `localhost:8080` or `127.0.0.1:8080`).

### Issue 4: Port 8080 Not Listening

Check if something is actually listening on port 8080:

```bash
# Check what's on port 8080
sudo lsof -i :8080
# or
sudo netstat -tlnp | grep 8080
```

## Quick Fix Command Sequence

```bash
# 1. Remove default config
sudo rm -f /etc/nginx/sites-enabled/default

# 2. Copy your config
cd ~/task-flow-v2
sudo cp nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
sudo ln -sf /etc/nginx/sites-available/taskflow.galaxyitt.com.ng /etc/nginx/sites-enabled/

# 3. Make sure frontend is running
pm2 list | grep task-flow-frontend || npm run pm2:start:ui

# 4. Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

# 5. Test the site
curl http://taskflow.galaxyitt.com.ng
```

