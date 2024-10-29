#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "${RED}Error: $1${NC}"
    exit 1
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start timestamp for log files
timestamp=$(date +%Y%m%d_%H%M%S)
frontend_log="logs/frontend_${timestamp}.log"
backend_log="logs/backend_${timestamp}.log"

print_header "Starting all services"

# Start backend in the background and redirect output
print_header "Starting Backend"
bash backend/scripts/startup.sh > >(tee "${backend_log}") 2>&1 &
backend_pid=$!

# Start frontend in the background and redirect output
print_header "Starting Frontend"
bash frontend/scripts/startup.sh > >(tee "${frontend_log}") 2>&1 &
frontend_pid=$!

# Function to check if a process is still running
is_running() {
    kill -0 $1 2>/dev/null
}

# Monitor both processes
echo -e "\n${GREEN}Monitoring startup processes...${NC}"
echo "Backend log: ${backend_log}"
echo "Frontend log: ${frontend_log}"

# Wait for both processes to complete
while is_running $backend_pid || is_running $frontend_pid; do
    sleep 1
    
    if is_running $backend_pid; then
        echo -ne "\rBackend: Running..."
    fi
    
    if is_running $frontend_pid; then
        echo -ne " Frontend: Running..."
    fi
done

# Check exit status of both processes
wait $backend_pid
backend_status=$?
wait $frontend_pid
frontend_status=$?

echo -e "\n"

# Final status report
if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
    print_header "Startup Complete"
    echo -e "${GREEN}✓ All services started successfully${NC}"
    echo -e "\nView detailed logs at:"
    echo "Backend:  ${backend_log}"
    echo "Frontend: ${frontend_log}"
    echo -e "\nMonitor Docker logs with: docker-compose logs -f"
else
    if [ $backend_status -ne 0 ]; then
        handle_error "Backend startup failed. Check ${backend_log} for details"
    fi
    if [ $frontend_status -ne 0 ]; then
        handle_error "Frontend startup failed. Check ${frontend_log} for details"
    fi
fi