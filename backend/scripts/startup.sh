#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Starting backend services..."

# Enable Apache modules if not enabled
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod rewrite

# Restart Apache
sudo systemctl restart apache2
echo -e "${GREEN}✓ Apache configured${NC}"

# Navigate to backend directory
cd /var/www/gabrielpenman.com/backend

# Pull latest changes
git pull origin main

# Build and start Docker containers
docker compose down
docker compose up --build -d

# Initial health check
./scripts/health-monitor.sh

echo -e "${GREEN}Setup complete!${NC}"
echo "Monitor logs with: docker compose logs -f"