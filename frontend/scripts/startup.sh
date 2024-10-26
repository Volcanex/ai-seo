#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Pull latest changes
git pull origin main
check_status "Git pull"

# Clean old builds
rm -rf .next out
check_status "Clean old builds"

# Install dependencies
npm install
check_status "Install dependencies"

# Build
npm run build
check_status "Build frontend"

# Restart Apache
sudo systemctl restart apache2
check_status "Restart Apache"

# Clear browser caches (optional)
echo -e "${GREEN}✓ Deployment complete${NC}"
echo "You may need to clear browser caches"
echo "Check site at: https://gabrielpenman.com"