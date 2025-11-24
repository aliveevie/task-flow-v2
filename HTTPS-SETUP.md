# HTTPS Setup Guide for api.galaxyitt.com.ng

## Overview
This guide will help you set up HTTPS (SSL/TLS) for your API domain using Let's Encrypt free SSL certificates.

## Prerequisites
- Domain `api.galaxyitt.com.ng` pointing to your VPS IP
- Nginx installed and running
- Port 80 and 443 open in firewall

## Step 1: Install Certbot

```bash
# Update package list
sudo apt update

# Install Certbot and Nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

## Step 2: Obtain SSL Certificate

```bash
# Get certificate and automatically configure nginx
sudo certbot --nginx -d api.galaxyitt.com.ng

# Or if you want to configure manually:
sudo certbot certonly --nginx -d api.galaxyitt.com.ng
```

**During the setup, Certbot will:**
1. Ask for your email (for renewal notifications)
2. Ask to agree to terms of service
3. Ask if you want to share email with EFF (optional)
4. Automatically configure nginx if you used `--nginx` flag

## Step 3: Update Nginx Configuration

If you used `certbot certonly` (manual mode), you need to update the nginx config:

```bash
# Copy the updated nginx config
sudo cp /home/galaxy/task-flow/nginx /etc/nginx/sites-available/api.galaxyitt.com.ng

# Test the configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 4: Verify HTTPS is Working

```bash
# Test HTTPS endpoint
curl https://api.galaxyitt.com.ng/api/health

# Check SSL certificate
openssl s_client -connect api.galaxyitt.com.ng:443 -servername api.galaxyitt.com.ng
```

Or visit in browser: `https://api.galaxyitt.com.ng/api/health`

## Step 5: Set Up Auto-Renewal

Let's Encrypt certificates expire every 90 days. Certbot sets up auto-renewal automatically, but verify it:

```bash
# Test renewal process
sudo certbot renew --dry-run

# Check if renewal timer is active
sudo systemctl status certbot.timer

# Enable auto-renewal (if not already enabled)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Alternative: If Certbot Auto-Configuration Doesn't Work

If Certbot's automatic nginx configuration doesn't work, you can manually configure:

1. **Get certificate only:**
   ```bash
   sudo certbot certonly --standalone -d api.galaxyitt.com.ng
   ```

2. **Then manually update nginx config** (already done in the nginx file)

3. **Test and reload:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Troubleshooting

### Certificate Not Found Error

If you see errors about certificate files not found:

```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/api.galaxyitt.com.ng/

# If they don't exist, obtain them:
sudo certbot certonly --nginx -d api.galaxyitt.com.ng
```

### Port 443 Not Open

```bash
# Check if port 443 is listening
sudo netstat -tlnp | grep 443
# or
sudo ss -tlnp | grep 443

# Open port 443 in firewall
sudo ufw allow 443/tcp
sudo ufw reload
```

### Nginx Configuration Test Fails

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration syntax
sudo nginx -t

# Check for duplicate server_name
sudo nginx -T | grep -A 5 "server_name api.galaxyitt.com.ng"
```

### Certificate Renewal Issues

```bash
# Manually renew certificate
sudo certbot renew

# Check renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Manual Certificate Paths (If Different)

If your certificates are in a different location, update the nginx config:

```bash
# Common locations:
# /etc/letsencrypt/live/api.galaxyitt.com.ng/fullchain.pem
# /etc/letsencrypt/live/api.galaxyitt.com.ng/privkey.pem
# /etc/ssl/certs/api.galaxyitt.com.ng.crt
# /etc/ssl/private/api.galaxyitt.com.ng.key
```

## Verify Everything Works

1. **HTTP redirects to HTTPS:**
   ```bash
   curl -I https://api.galaxyitt.com.ng/api/health
   # Should show: HTTP/1.1 301 Moved Permanently
   ```

2. **HTTPS works:**
   ```bash
   curl https://api.galaxyitt.com.ng/api/health
   # Should return JSON response
   ```

3. **SSL is valid:**
   - Visit `https://api.galaxyitt.com.ng/api/health` in browser
   - Check for green padlock icon
   - No SSL warnings

## Notes

- Let's Encrypt certificates are free and valid for 90 days
- Auto-renewal runs twice daily and renews certificates 30 days before expiry
- The nginx config includes security headers for better HTTPS security
- HTTP traffic is automatically redirected to HTTPS

