# Fix 502 Bad Gateway - Connection Refused

## Problem
Nginx can't connect to the frontend on `10.1.1.205:8080`. The error shows "Connection refused".

## Solution Steps

### Step 1: Check if Frontend is Running

```bash
# Check PM2 status
pm2 list

# Check if something is listening on port 8080
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080

# Check frontend logs
pm2 logs task-flow-frontend --lines 50
```

### Step 2: Check What IP the Frontend is Listening On

```bash
# Check what address vite is actually using
pm2 logs task-flow-frontend | grep -i "Local\|Network\|http"

# Or test direct connection
curl http://localhost:8080
curl http://127.0.0.1:8080
curl http://10.1.1.205:8080
```

### Step 3: Update Nginx Config

The nginx config has been updated to use `127.0.0.1:8080` instead of `10.1.1.205:8080`.

Apply it:

```bash
cd ~/task-flow-v2
sudo cp nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: Start/Restart Frontend

```bash
# If frontend is not running, start it:
npm run pm2:start:ui

# Or restart if it's running:
pm2 restart task-flow-frontend

# Check status
pm2 status
```

### Step 5: Verify Frontend is Accessible

```bash
# Test direct connection
curl http://localhost:8080

# Should return HTML, not connection refused
```

## Common Issues

### Issue 1: Frontend Not Running

```bash
# Start frontend
npm run pm2:start:ui

# Or manually:
cd ~/task-flow-v2
pm2 start ecosystem.config.cjs --only task-flow-frontend
```

### Issue 2: Frontend Listening on Wrong Address

If vite is configured to listen on a specific IP, check `vite.config.ts`:

```typescript
server: {
  host: "::",  // This listens on all interfaces
  port: 8080,
}
```

### Issue 3: Firewall Blocking

```bash
# Check if port 8080 is accessible locally
sudo ufw status
# If needed, allow local connections (usually not needed for localhost)
```

## Quick Fix

```bash
# 1. Make sure frontend is running
pm2 list | grep task-flow-frontend || npm run pm2:start:ui

# 2. Test direct connection
curl http://localhost:8080

# 3. Update nginx config (already done in nginx-frontend file)
cd ~/task-flow-v2
sudo cp nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
sudo nginx -t && sudo systemctl reload nginx

# 4. Test the domain
curl https://taskflow.galaxyitt.com.ng
```

