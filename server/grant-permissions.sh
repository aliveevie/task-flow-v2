#!/bin/bash

# Script to grant CREATE permissions to galaxy user
# Run this script as postgres superuser or with sudo

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Granting PostgreSQL Permissions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This script will grant CREATE permissions to the 'galaxy' user"
echo "on the 'connectiondb' database."
echo ""
echo "You need to run this as the postgres superuser."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Option 1: Using psql directly
echo "Option 1: Run these commands manually:"
echo ""
echo "  psql -U postgres -d connectiondb"
echo ""
echo "Then run these SQL commands:"
echo ""
echo "  GRANT CREATE ON SCHEMA public TO galaxy;"
echo "  GRANT ALL PRIVILEGES ON SCHEMA public TO galaxy;"
echo "  GRANT ALL PRIVILEGES ON DATABASE connectiondb TO galaxy;"
echo "  \\q"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Option 2: Using sudo
echo "Option 2: Run this single command (if you have sudo access):"
echo ""
echo "  sudo -u postgres psql -d connectiondb -c \"GRANT CREATE ON SCHEMA public TO galaxy;\""
echo "  sudo -u postgres psql -d connectiondb -c \"GRANT ALL PRIVILEGES ON SCHEMA public TO galaxy;\""
echo "  sudo -u postgres psql -d connectiondb -c \"GRANT ALL PRIVILEGES ON DATABASE connectiondb TO galaxy;\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Option 3: Interactive
read -p "Do you want to run these commands now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Attempting to grant permissions..."
    
    # Try with sudo
    if sudo -u postgres psql -d connectiondb -c "GRANT CREATE ON SCHEMA public TO galaxy;" 2>/dev/null; then
        echo "✅ Granted CREATE permission on schema public"
    else
        echo "❌ Could not grant permissions with sudo. Please run manually."
        exit 1
    fi
    
    if sudo -u postgres psql -d connectiondb -c "GRANT ALL PRIVILEGES ON SCHEMA public TO galaxy;" 2>/dev/null; then
        echo "✅ Granted ALL PRIVILEGES on schema public"
    else
        echo "⚠️  Could not grant ALL PRIVILEGES. CREATE permission should be enough."
    fi
    
    if sudo -u postgres psql -d connectiondb -c "GRANT ALL PRIVILEGES ON DATABASE connectiondb TO galaxy;" 2>/dev/null; then
        echo "✅ Granted ALL PRIVILEGES on database"
    else
        echo "⚠️  Could not grant database privileges. Schema permissions should be enough."
    fi
    
    echo ""
    echo "✅ Permissions granted! You can now restart your server."
else
    echo "Please run the commands manually using one of the options above."
fi

