#!/bin/bash

# Complete production setup script for Team Iran vs Team USA game
# This script orchestrates the entire production deployment

set -e

echo "🚀 Complete Production Setup for Team Iran vs Team USA Game"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}[SETUP]${NC} $1"
}

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# Check if running as root (for system operations)
if [ "$EUID" -ne 0 ]; then
    print_warning "Some operations may require sudo privileges"
fi

# Check system requirements
print_header "Checking System Requirements..."

# Check Node.js
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
    
    if [ "$(node --version | cut -d'.' -f1)" -lt "16" ]; then
        print_error "Node.js version 16+ required. Current: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 16+"
    exit 1
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    print_status "npm: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check PostgreSQL
if command -v psql > /dev/null 2>&1; then
    POSTGRES_VERSION=$(psql --version | awk '{print $3}')
    print_status "PostgreSQL: $POSTGRES_VERSION"
else
    print_warning "PostgreSQL not found. Please install PostgreSQL 13+"
fi

# Check Redis
if command -v redis-cli > /dev/null 2>&1; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    print_status "Redis: $REDIS_VERSION"
else
    print_warning "Redis not found. Please install Redis 6+"
fi

# Check PM2
if command -v pm2 > /dev/null 2>&1; then
    PM2_VERSION=$(pm2 --version)
    print_status "PM2: $PM2_VERSION"
else
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Check Docker (optional)
if command -v docker > /dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_status "Docker: $DOCKER_VERSION"
else
    print_warning "Docker not found (optional for containerized deployment)"
fi

echo ""
print_step "Step 1: Environment Configuration"

# Set up environment
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_status "Please edit .env file with your actual configuration"
    print_warning "Critical settings to update:"
    echo "  - TELEGRAM_BOT_TOKEN"
    echo "  - DATABASE_URL"
    echo "  - REDIS_URL"
    echo "  - JWT_SECRET"
    echo "  - TON_API_KEY"
    echo "  - WIN_TOKEN_CONTRACT_ADDRESS"
    echo "  - TREASURY_CONTRACT_ADDRESS"
else
    print_status ".env file already exists"
fi

echo ""
print_step "Step 2: Database Setup"

# Run database setup
if [ -f "scripts/setup-database.sh" ]; then
    print_status "Running database setup..."
    chmod +x scripts/setup-database.sh
    ./scripts/setup-database.sh
else
    print_error "Database setup script not found"
    exit 1
fi

echo ""
print_step "Step 3: Application Build"

# Build frontend
print_status "Building frontend application..."
npm run build:frontend

if [ $? -eq 0 ]; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

echo ""
print_step "Step 4: Telegram Bot Setup"

# Setup Telegram bot
if [ -f "scripts/setup-telegram.sh" ]; then
    print_status "Setting up Telegram bot..."
    chmod +x scripts/setup-telegram.sh
    ./scripts/setup-telegram.sh
else
    print_error "Telegram setup script not found"
    exit 1
fi

echo ""
print_step "Step 5: TON Smart Contracts"

# Deploy TON contracts
if [ -f "scripts/deploy-ton-contracts.sh" ]; then
    print_status "Deploying TON smart contracts..."
    chmod +x scripts/deploy-ton-contracts.sh
    ./scripts/deploy-ton-contracts.sh
else
    print_error "TON contracts deployment script not found"
    exit 1
fi

echo ""
print_step "Step 6: Application Deployment"

# Start application with PM2
print_status "Starting application with PM2..."

# Check if PM2 ecosystem file exists
if [ ! -f "ecosystem.config.js" ]; then
    print_error "PM2 ecosystem configuration not found"
    exit 1
fi

# Start application
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    print_success "Application started successfully"
else
    print_error "Failed to start application"
    exit 1
fi

# Save PM2 configuration
pm2 save
pm2 startup

echo ""
print_step "Step 7: Health Checks"

# Perform health checks
print_status "Performing health checks..."

# Check application health
sleep 5
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_success "Application health check passed"
else
    print_warning "Application health check failed - this might be normal during initial setup"
fi

# Check database connection
if PGPASSWORD=demo_password psql -h localhost -U postgres -d team_iran_vs_usa -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection check passed"
else
    print_warning "Database connection check failed"
fi

# Check Redis connection
if redis-cli ping > /dev/null 2>&1; then
    print_success "Redis connection check passed"
else
    print_warning "Redis connection check failed"
fi

echo ""
print_step "Step 8: Monitoring Setup"

# Setup monitoring
if [ -f "scripts/monitor.sh" ]; then
    print_status "Setting up monitoring..."
    chmod +x scripts/monitor.sh
    
    # Add to crontab for monitoring every 5 minutes
    (crontab -l 2>/dev/null; echo "*/5 * * * * $(pwd)/scripts/monitor.sh") | crontab -
    print_success "Monitoring setup completed"
else
    print_warning "Monitoring script not found"
fi

# Setup backup
if [ -f "scripts/backup.sh" ]; then
    print_status "Setting up backup..."
    chmod +x scripts/backup.sh
    
    # Add to crontab for daily backups at 2 AM
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/scripts/backup.sh") | crontab -
    print_success "Backup setup completed"
else
    print_warning "Backup script not found"
fi

echo ""
print_step "Step 9: SSL and Domain Setup"

print_status "SSL and Domain Setup Instructions:"
echo ""
echo "1. Point your domain to this server's IP address"
echo "2. Install SSL certificate:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d your-domain.com"
echo "3. Update .env file with your domain:"
echo "   TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook"
echo "   TELEGRAM_WEBAPP_URL=https://your-domain.com"
echo ""

echo ""
print_step "Step 10: Final Verification"

# Show PM2 status
print_status "Application Status:"
pm2 status

echo ""
print_status "Application Logs (last 10 lines):"
pm2 logs team-iran-vs-usa --lines 10 --nostream

echo ""
print_success "Production Setup Completed Successfully!"
echo ""
echo "🎮 Your Team Iran vs Team USA game is now running!"
echo ""
echo "📊 Service Information:"
echo "  Application: http://localhost:3000"
echo "  Health Check: http://localhost:3000/health"
echo "  API: http://localhost:3000/api"
echo ""
echo "🤖 Telegram Bot:"
echo "  Commands: /start, /help, /stats, /leaderboard, /faction"
echo "  Webhook: Will be configured once you set up your domain"
echo ""
echo "⛓️ TON Blockchain:"
echo "  WIN Token: Deployed (see ton-deployment-summary.json)"
echo "  Treasury: Deployed (see ton-deployment-summary.json)"
echo ""
echo "📁 Important Files:"
echo "  - .env (environment configuration)"
echo "  - ton-deployment-summary.json (contract addresses)"
echo "  - telegram-bot-config.json (bot configuration)"
echo "  - logs/ (application logs)"
echo ""
echo "🔧 Management Commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs team-iran-vs-usa - View logs"
echo "  pm2 restart team-iran-vs-usa - Restart application"
echo "  pm2 reload team-iran-vs-usa - Reload without downtime"
echo "  ./scripts/monitor.sh - Run health monitoring"
echo "  ./scripts/backup.sh - Create backup"
echo ""
echo "🌐 Next Steps:"
echo "  1. Configure your domain and SSL certificate"
echo "  2. Update .env with your actual domain"
echo "  3. Test the Telegram bot with /start command"
echo "  4. Monitor application performance"
echo "  5. Set up analytics and monitoring alerts"
echo ""
echo "🎉 Congratulations! Your game is ready for players!"
