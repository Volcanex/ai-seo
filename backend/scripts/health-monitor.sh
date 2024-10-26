#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Log file
LOG_FILE="/var/log/health-monitor.log"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo -e "$1"
}

# Check if Docker is running
check_docker() {
    if systemctl is-active --quiet docker; then
        log_message "${GREEN}✓ Docker service is running${NC}"
    else
        log_message "${RED}✗ Docker service is not running${NC}"
        sudo systemctl start docker
        log_message "${YELLOW}Started Docker service${NC}"
    fi
}

# Check if our container is running
check_container() {
    if docker ps | grep -q backend-backend; then
        log_message "${GREEN}✓ Backend container is running${NC}"
    else
        log_message "${RED}✗ Backend container is not running${NC}"
        cd /var/www/gabrielpenman.com/backend
        docker-compose up -d
        log_message "${YELLOW}Started backend container${NC}"
    fi
}

# Check Apache
check_apache() {
    if systemctl is-active --quiet apache2; then
        log_message "${GREEN}✓ Apache service is running${NC}"
    else
        log_message "${RED}✗ Apache service is not running${NC}"
        sudo systemctl start apache2
        log_message "${YELLOW}Started Apache service${NC}"
    fi
}

# Check proxy connectivity
check_proxy() {
    if curl -s http://localhost:8000/api/health > /dev/null; then
        log_message "${GREEN}✓ Backend API is responding${NC}"
    else
        log_message "${RED}✗ Backend API is not responding${NC}"
        # Restart container if API is down
        docker-compose restart backend
        log_message "${YELLOW}Restarted backend container${NC}"
    fi
}

# Main health check
main_check() {
    log_message "\n=== Starting health check ==="
    check_docker
    check_apache
    check_container
    check_proxy
    log_message "=== Health check complete ===\n"
}

# Run main check
main_check

# Set up cron job to run every 5 minutes if not already set
if ! crontab -l | grep -q "health-monitor.sh"; then
    (crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/gabrielpenman.com/backend/scripts/health-monitor.sh") | crontab -
    log_message "Added health check to crontab"
fi