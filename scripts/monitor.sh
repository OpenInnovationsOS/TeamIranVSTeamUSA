#!/bin/bash

# Monitoring script for Team Iran vs Team USA game
# This script monitors system health and performance

set -e

# Configuration
LOG_FILE="/var/log/monitor.log"
ALERT_EMAIL="admin@your-domain.com"
APP_NAME="TeamIranVSTeamUSA"
HEALTH_URL="http://localhost:3000/health"
DB_NAME="team_iran_vs_usa"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Create log file
mkdir -p $(dirname $LOG_FILE)
exec > $LOG_FILE 2>&1

# Function to log messages
log() {
    echo "[$(date)] $1" | tee -a $LOG_FILE
}

# Function to send alert
send_alert() {
    local subject="🚨 $APP_NAME Alert: $1"
    local message="$2"
    
    echo "$subject: $message"
    
    # Send email (configure mail command or use your preferred method)
    # echo "$message" | mail -s "$subject" $ALERT_EMAIL
    
    # Or send to Slack/Telegram webhook
    # curl -X POST -H 'Content-type: application/json' \
    #     --data "{\"text\":\"$subject\n$message\"}" \
    #     YOUR_WEBHOOK_URL
}

# Check application health
check_app_health() {
    log "🏥 Checking application health..."
    
    if curl -f -s $HEALTH_URL > /dev/null; then
        log "✅ Application is healthy"
        return 0
    else
        log "❌ Application is unhealthy"
        send_alert "Application Down" "The application is not responding to health checks at $HEALTH_URL"
        return 1
    fi
}

# Check PM2 status
check_pm2_status() {
    log "🔄 Checking PM2 status..."
    
    if pm2 list | grep -q "online"; then
        log "✅ PM2 processes are running"
        return 0
    else
        log "❌ PM2 processes are not running"
        send_alert "PM2 Down" "PM2 processes are not running properly"
        return 1
    fi
}

# Check database connection
check_database() {
    log "🗄️ Checking database connection..."
    
    if pg_isready -h localhost -p 5432 -U postgres > /dev/null 2>&1; then
        log "✅ Database is accessible"
        return 0
    else
        log "❌ Database is not accessible"
        send_alert "Database Down" "Cannot connect to PostgreSQL database"
        return 1
    fi
}

# Check Redis connection
check_redis() {
    log "📦 Checking Redis connection..."
    
    if redis-cli -h $REDIS_HOST -p $REDIS_PORT ping > /dev/null 2>&1; then
        log "✅ Redis is accessible"
        return 0
    else
        log "❌ Redis is not accessible"
        send_alert "Redis Down" "Cannot connect to Redis server"
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log "💾 Checking disk space..."
    
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $DISK_USAGE -gt 80 ]; then
        log "⚠️ Disk usage is high: ${DISK_USAGE}%"
        send_alert "Disk Space Warning" "Disk usage is ${DISK_USAGE}% on server"
        return 1
    else
        log "✅ Disk usage is normal: ${DISK_USAGE}%"
        return 0
    fi
}

# Check memory usage
check_memory() {
    log "🧠 Checking memory usage..."
    
    MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ $MEMORY_USAGE -gt 85 ]; then
        log "⚠️ Memory usage is high: ${MEMORY_USAGE}%"
        send_alert "Memory Warning" "Memory usage is ${MEMORY_USAGE}% on server"
        return 1
    else
        log "✅ Memory usage is normal: ${MEMORY_USAGE}%"
        return 0
    fi
}

# Check SSL certificate
check_ssl_certificate() {
    log "🔒 Checking SSL certificate..."
    
    if openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates | grep -q "notAfter"; then
        EXPIRY_DATE=$(openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ $DAYS_LEFT -lt 30 ]; then
            log "⚠️ SSL certificate expires in $DAYS_LEFT days"
            send_alert "SSL Certificate Expiring" "SSL certificate expires in $DAYS_LEFT days on $EXPIRY_DATE"
            return 1
        else
            log "✅ SSL certificate is valid ($DAYS_LEFT days left)"
            return 0
        fi
    else
        log "❌ Could not check SSL certificate"
        return 1
    fi
}

# Main monitoring function
run_monitoring() {
    log "🔍 Starting monitoring checks..."
    
    local issues=0
    
    # Run all checks
    check_app_health || ((issues++))
    check_pm2_status || ((issues++))
    check_database || ((issues++))
    check_redis || ((issues++))
    check_disk_space || ((issues++))
    check_memory || ((issues++))
    check_ssl_certificate || ((issues++))
    
    # Summary
    if [ $issues -eq 0 ]; then
        log "✅ All systems operational"
    else
        log "⚠️ $issues issues detected"
    fi
    
    log "🔍 Monitoring completed at $(date)"
}

# Run monitoring
run_monitoring

# Exit with number of issues
exit $issues
