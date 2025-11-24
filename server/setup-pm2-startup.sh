#!/bin/bash

# PM2 Startup Configuration Script
# This script configures PM2 to start automatically on system boot
# Run this script ONCE on your VPS server after installing PM2

echo "=========================================="
echo "PM2 Startup Configuration"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "   npm install -g pm2"
    exit 1
fi

echo "✅ PM2 is installed"
echo ""

# Navigate to server directory
cd "$(dirname "$0")"
SERVER_DIR=$(pwd)
echo "📁 Server directory: $SERVER_DIR"
echo ""

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true
echo ""

# Start applications using ecosystem config
echo "🚀 Starting applications with PM2..."
pm2 start ecosystem.config.js
echo ""

# Save the current PM2 process list
echo "💾 Saving PM2 process list..."
pm2 save
echo ""

# Generate and display startup script
echo "🔧 Setting up PM2 startup script..."
echo ""
echo "Run the following command that PM2 will generate:"
echo "   (Copy and paste the entire command that appears below)"
echo ""
echo "----------------------------------------"
STARTUP_CMD=$(pm2 startup systemd -u $USER --hp $HOME 2>&1 | grep -A 1 "sudo" | tail -1)
if [ -n "$STARTUP_CMD" ]; then
    echo "$STARTUP_CMD"
else
    # Fallback: try to get the startup command
    pm2 startup systemd -u $USER --hp $HOME
fi
echo "----------------------------------------"
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy the command shown above"
echo "2. Run it with sudo on your VPS"
echo "3. Verify with: pm2 list"
echo "4. Test reboot persistence: pm2 save (already done)"
echo ""
echo "Your applications will now:"
echo "  ✅ Start automatically on system boot"
echo "  ✅ Restart automatically if they crash"
echo "  ✅ Persist across reboots"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 list          - View running processes"
echo "  pm2 logs          - View logs"
echo "  pm2 restart all   - Restart all processes"
echo "  pm2 stop all      - Stop all processes"
echo "  pm2 delete all    - Remove all processes"
echo "  pm2 save          - Save current process list"
echo ""

