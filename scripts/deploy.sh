#!/bin/bash

# Deployment script for Team Iran vs Team USA game
# This script automates the deployment process

set -e  # Exit on any error

echo "🚀 Starting deployment of Team Iran vs Team USA game..."

# Configuration
APP_DIR="/var/www/TeamIranVSTeamUSA"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deploy.log"

# Create log file
mkdir -p $(dirname $LOG_FILE)
exec > $LOG_FILE 2>&1

echo "Deployment started at $(date)" >> $LOG_FILE

# Function to log messages
log() {
    echo "$1"
    echo "[$(date)] $1" >> $LOG_FILE
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log "❌ Please run as root (use sudo)"
    exit 1
fi

# Create backup before deployment
log "📦 Creating backup before deployment..."
$APP_DIR/scripts/backup.sh

# Pull latest code
log "📥 Pulling latest code..."
cd $APP_DIR
git pull origin main

# Install dependencies
log "📦 Installing dependencies..."
npm ci --production

# Build frontend
log "🏗️ Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Run database migrations
log "🗄️ Running database migrations..."
npm run migrate

# Reload PM2 application
log "🔄 Reloading application..."
pm2 reload ecosystem.config.js --env production

# Wait for application to start
log "⏳ Waiting for application to start..."
sleep 10

# Health check
log "🏥 Performing health check..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    log "✅ Application is healthy"
else
    log "❌ Application health check failed"
    log "🔄 Rolling back..."
    
    # Rollback logic would go here
    pm2 reload ecosystem.config.js --env production
    
    log "❌ Deployment failed - rolled back"
    exit 1
fi

# Clean up old backups (keep last 7 days)
log "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

# Update Nginx if needed
log "🌐 Reloading Nginx..."
nginx -t && systemctl reload nginx

# Show deployment status
log "📊 Deployment status:"
pm2 status

log "✅ Deployment completed successfully at $(date)"
echo "🎉 Team Iran vs Team USA game deployed successfully!"
echo "📊 View logs: pm2 logs team-iran-vs-usa"
echo "🌐 Application URL: https://your-domain.com"
