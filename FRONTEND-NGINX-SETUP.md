# Nginx Setup for taskflow.galaxyitt.com.ng

## Step 1: Get SSL Certificate

On your VPS, run:

```bash
# Get SSL certificate for the frontend domain
sudo certbot --nginx -d taskflow.galaxyitt.com.ng

# Or if you want to configure manually:
sudo certbot certonly --nginx -d taskflow.galaxyitt.com.ng
```

## Step 2: Copy Nginx Configuration

```bash
# Copy the nginx config to sites-available
sudo cp /home/galaxy/task-flow/nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng

# Create symbolic link to enable it
sudo ln -sf /etc/nginx/sites-available/taskflow.galaxyitt.com.ng /etc/nginx/sites-enabled/
```

## Step 3: Update Certificate Paths (if needed)

If certbot didn't auto-configure, check where your certificates are:

```bash
sudo certbot certificates
```

Then update the certificate paths in the config file if they're different:

```bash
sudo nano /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
```

Update these lines if needed:
- `ssl_certificate /etc/letsencrypt/live/taskflow.galaxyitt.com.ng/fullchain.pem;`
- `ssl_certificate_key /etc/letsencrypt/live/taskflow.galaxyitt.com.ng/privkey.pem;`

## Step 4: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 5: Verify

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://taskflow.galaxyitt.com.ng

# Test HTTPS
curl https://taskflow.galaxyitt.com.ng

# Check SSL certificate
openssl s_client -connect taskflow.galaxyitt.com.ng:443 -servername taskflow.galaxyitt.com.ng
```

## Configuration Details

- **Frontend**: Proxies to `http://10.1.1.205:8080` (your Vite frontend)
- **API**: Proxies `/api` requests to `http://10.1.1.205:3000` (your backend)
- **SSL**: Full HTTPS with Let's Encrypt certificates
- **Security Headers**: HSTS, X-Frame-Options, etc.

## Troubleshooting

### Certificate Not Found

```bash
# Check if certificates exist
sudo ls -la /etc/letsencrypt/live/taskflow.galaxyitt.com.ng/

# If not, get them:
sudo certbot certonly --nginx -d taskflow.galaxyitt.com.ng
```

### Port 8080 Not Accessible

```bash
# Check if frontend is running on port 8080
sudo netstat -tlnp | grep 8080
# or
sudo ss -tlnp | grep 8080

# Check PM2 status
pm2 list
```

### Nginx Errors

```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

## Quick Setup Command Sequence

```bash
# 1. Get certificate
sudo certbot --nginx -d taskflow.galaxyitt.com.ng

# 2. Copy config (if certbot didn't auto-configure)
cd ~/task-flow-v2
sudo cp nginx-frontend /etc/nginx/sites-available/taskflow.galaxyitt.com.ng
sudo ln -sf /etc/nginx/sites-available/taskflow.galaxyitt.com.ng /etc/nginx/sites-enabled/

# 3. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 4. Test
curl https://taskflow.galaxyitt.com.ng
```

