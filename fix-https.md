# Fix HTTPS for api.galaxyitt.com.ng

## Problem
- ✅ HTTP works: `https://api.galaxyitt.com.ng/api/health`
- ❌ HTTPS shows 404: `https://api.galaxyitt.com.ng/api/health`

## Solution Steps (Run on VPS)

### Step 1: Check Current Nginx Config

```bash
# Check what nginx config is currently active
sudo cat /etc/nginx/sites-available/api.galaxyitt.com.ng
# or
sudo cat /etc/nginx/sites-enabled/api.galaxyitt.com.ng
```

### Step 2: Check if SSL Certificates Exist

```bash
# Check all certificates
sudo certbot certificates

# Check if api.galaxyitt.com.ng certificate exists
sudo ls -la /etc/letsencrypt/live/api.galaxyitt.com.ng/ 2>/dev/null
```

### Step 3: Get SSL Certificate (if missing)

If certificates don't exist, get them:

```bash
# Option 1: Let certbot configure nginx automatically
sudo certbot --nginx -d api.galaxyitt.com.ng

# Option 2: Get certificate only (manual config)
sudo certbot certonly --nginx -d api.galaxyitt.com.ng
```

### Step 4: Update Nginx Config

Copy the updated nginx config from your project:

```bash
cd ~/task-flow-v2
sudo cp nginx /etc/nginx/sites-available/api.galaxyitt.com.ng

# Make sure it's enabled
sudo ln -sf /etc/nginx/sites-available/api.galaxyitt.com.ng /etc/nginx/sites-enabled/
```

### Step 5: Verify Certificate Paths

If your certificates are in a different location, update the paths in the nginx config:

```bash
# Check where certificates actually are
sudo certbot certificates

# Edit nginx config if needed
sudo nano /etc/nginx/sites-available/api.galaxyitt.com.ng
# Update these lines if certificate path is different:
# ssl_certificate /etc/letsencrypt/live/api.galaxyitt.com.ng/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/api.galaxyitt.com.ng/privkey.pem;
```

### Step 6: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx status
sudo systemctl status nginx
```

### Step 7: Verify HTTPS Works

```bash
# Test HTTPS endpoint
curl https://api.galaxyitt.com.ng/api/health

# Check SSL certificate
curl -vI https://api.galaxyitt.com.ng/api/health
```

## Common Issues

### Issue 1: Certificate Path Wrong

If you see errors about certificate files not found, check the actual path:

```bash
# Find certificate files
sudo find /etc/letsencrypt -name "fullchain.pem" | grep galaxyitt
sudo find /etc/letsencrypt -name "privkey.pem" | grep galaxyitt
```

Then update the nginx config with the correct paths.

### Issue 2: Port 443 Not Open

```bash
# Check if port 443 is listening
sudo netstat -tlnp | grep 443
# or
sudo ss -tlnp | grep 443

# Open port 443 if needed
sudo ufw allow 443/tcp
sudo ufw reload
```

### Issue 3: Nginx Config Not Applied

```bash
# Check if config is linked
ls -la /etc/nginx/sites-enabled/ | grep api.galaxyitt

# Remove default nginx config if it's interfering
sudo rm /etc/nginx/sites-enabled/default

# Reload nginx
sudo systemctl reload nginx
```

### Issue 4: Check Nginx Error Logs

```bash
# Check for errors
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

## Quick Fix Command Sequence

If you want to do everything at once:

```bash
# 1. Get certificate
sudo certbot --nginx -d api.galaxyitt.com.ng

# 2. Copy updated config (if certbot didn't auto-configure)
cd ~/task-flow-v2
sudo cp nginx /etc/nginx/sites-available/api.galaxyitt.com.ng
sudo ln -sf /etc/nginx/sites-available/api.galaxyitt.com.ng /etc/nginx/sites-enabled/

# 3. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 4. Test HTTPS
curl https://api.galaxyitt.com.ng/api/health
```

