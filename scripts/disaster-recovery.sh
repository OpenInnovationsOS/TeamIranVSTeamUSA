#!/bin/bash

# Disaster Recovery Script
# Automated disaster recovery procedures

set -e

# Configuration
BACKUP_DIR="/var/backups/team-iran-vs-usa"
LOG_FILE="/var/log/team-iran-vs-usa/disaster-recovery.log"
APP_DIR="/var/www/team-iran-vs-usa"
DB_NAME="team_iran_vs_usa"
DB_USER="team_iran_vs_usa_user"
DB_HOST="localhost"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "INFO")
            echo -e "${BLUE}[INFO]${NC} $message"
            ;;
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
        "WARNING")
            echo -e "${YELLOW}[WARNING]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_status "ERROR" "This script must be run as root"
        exit 1
    fi
}

# Check system requirements
check_requirements() {
    print_status "INFO" "Checking system requirements..."
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "psql" "tar" "gzip")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            print_status "ERROR" "Required command not found: $cmd"
            exit 1
        fi
    done
    
    # Check disk space
    local available_space=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
    local required_space=5242880  # 5GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        print_status "ERROR" "Insufficient disk space. Required: 5GB, Available: $((available_space/1024/1024))GB"
        exit 1
    fi
    
    print_status "SUCCESS" "System requirements check passed"
}

# Stop application services
stop_services() {
    print_status "INFO" "Stopping application services..."
    
    # Stop Docker containers
    cd "$APP_DIR"
    docker-compose -f docker-compose.prod.yml down || true
    
    # Stop Nginx
    systemctl stop nginx || true
    
    # Stop PostgreSQL
    systemctl stop postgresql || true
    
    print_status "SUCCESS" "Services stopped"
}

# Start application services
start_services() {
    print_status "INFO" "Starting application services..."
    
    # Start PostgreSQL
    systemctl start postgresql
    
    # Wait for PostgreSQL to be ready
    sleep 10
    
    # Start Docker containers
    cd "$APP_DIR"
    docker-compose -f docker-compose.prod.yml up -d
    
    # Start Nginx
    systemctl start nginx
    
    print_status "SUCCESS" "Services started"
}

# Backup current state
backup_current_state() {
    print_status "INFO" "Creating emergency backup of current state..."
    
    local emergency_backup_dir="$BACKUP_DIR/emergency-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$emergency_backup_dir"
    
    # Backup database
    pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" > "$emergency_backup_dir/emergency_database.sql"
    
    # Backup application files
    tar -czf "$emergency_backup_dir/emergency_files.tar.gz" -C "$APP_DIR" src public package*.json
    
    # Backup configuration
    tar -czf "$emergency_backup_dir/emergency_config.tar.gz" -C "$APP_DIR" .env* docker-compose*.yml nginx.conf
    
    print_status "SUCCESS" "Emergency backup created: $emergency_backup_dir"
}

# Restore database
restore_database() {
    local backup_file=$1
    
    print_status "INFO" "Restoring database from: $backup_file"
    
    # Check if backup file exists
    if [[ ! -f "$backup_file" ]]; then
        print_status "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Drop existing database
    sudo -u postgres dropdb "$DB_NAME" || true
    
    # Create new database
    sudo -u postgres createdb "$DB_NAME"
    
    # Restore database
    if [[ $backup_file == *.gz ]]; then
        gunzip -c "$backup_file" | sudo -u postgres psql "$DB_NAME"
    else
        sudo -u postgres psql "$DB_NAME" < "$backup_file"
    fi
    
    print_status "SUCCESS" "Database restored"
}

# Restore application files
restore_files() {
    local backup_file=$1
    
    print_status "INFO" "Restoring application files from: $backup_file"
    
    # Check if backup file exists
    if [[ ! -f "$backup_file" ]]; then
        print_status "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Extract files
    tar -xzf "$backup_file" -C "$APP_DIR"
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    print_status "SUCCESS" "Application files restored"
}

# Restore configuration
restore_config() {
    local backup_file=$1
    
    print_status "INFO" "Restoring configuration from: $backup_file"
    
    # Check if backup file exists
    if [[ ! -f "$backup_file" ]]; then
        print_status "ERROR" "Backup file not found: $backup_file"
        return 1
    fi
    
    # Extract configuration
    tar -xzf "$backup_file" -C "$APP_DIR"
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    print_status "SUCCESS" "Configuration restored"
}

# Full disaster recovery
full_recovery() {
    local backup_date=$1
    
    print_status "INFO" "Starting full disaster recovery for backup: $backup_date"
    
    # Define backup paths
    local db_backup="$BACKUP_DIR/database/database_backup_$backup_date.sql.gz"
    local files_backup="$BACKUP_DIR/files/files_backup_$backup_date.tar.gz"
    local config_backup="$BACKUP_DIR/config/config_backup_$backup_date.tar.gz"
    
    # Check if all backup files exist
    if [[ ! -f "$db_backup" ]] || [[ ! -f "$files_backup" ]] || [[ ! -f "$config_backup" ]]; then
        print_status "ERROR" "One or more backup files not found for date: $backup_date"
        return 1
    fi
    
    # Stop services
    stop_services
    
    # Backup current state
    backup_current_state
    
    # Restore configuration
    restore_config "$config_backup"
    
    # Restore application files
    restore_files "$files_backup"
    
    # Restore database
    restore_database "$db_backup"
    
    # Start services
    start_services
    
    # Verify recovery
    verify_recovery
    
    print_status "SUCCESS" "Full disaster recovery completed"
}

# Verify recovery
verify_recovery() {
    print_status "INFO" "Verifying recovery..."
    
    # Wait for services to start
    sleep 30
    
    # Check application health
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
    
    if [[ "$health_check" == "200" ]]; then
        print_status "SUCCESS" "Application health check passed"
    else
        print_status "WARNING" "Application health check failed (HTTP $health_check)"
    fi
    
    # Check database connectivity
    if sudo -u postgres psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        print_status "SUCCESS" "Database connectivity check passed"
    else
        print_status "WARNING" "Database connectivity check failed"
    fi
    
    # Check Nginx
    if systemctl is-active --quiet nginx; then
        print_status "SUCCESS" "Nginx is running"
    else
        print_status "WARNING" "Nginx is not running"
    fi
}

# List available backups
list_backups() {
    local backup_type=$1
    
    print_status "INFO" "Listing available backups (type: $backup_type)..."
    
    case $backup_type in
        "database")
            ls -la "$BACKUP_DIR/database/" | grep "database_backup_" | tail -10
            ;;
        "files")
            ls -la "$BACKUP_DIR/files/" | grep "files_backup_" | tail -10
            ;;
        "config")
            ls -la "$BACKUP_DIR/config/" | grep "config_backup_" | tail -10
            ;;
        "all")
            echo "Database backups:"
            ls -la "$BACKUP_DIR/database/" | grep "database_backup_" | tail -5
            echo ""
            echo "Files backups:"
            ls -la "$BACKUP_DIR/files/" | grep "files_backup_" | tail -5
            echo ""
            echo "Config backups:"
            ls -la "$BACKUP_DIR/config/" | grep "config_backup_" | tail -5
            ;;
        *)
            print_status "ERROR" "Invalid backup type. Use: database, files, config, all"
            return 1
            ;;
    esac
}

# System health check
system_health() {
    print_status "INFO" "Performing system health check..."
    
    # Check disk space
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 80 ]]; then
        print_status "WARNING" "High disk usage: ${disk_usage}%"
    else
        print_status "SUCCESS" "Disk usage: ${disk_usage}%"
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [[ $memory_usage -gt 80 ]]; then
        print_status "WARNING" "High memory usage: ${memory_usage}%"
    else
        print_status "SUCCESS" "Memory usage: ${memory_usage}%"
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$cpu_load > 2.0" | bc -l) )); then
        print_status "WARNING" "High CPU load: $cpu_load"
    else
        print_status "SUCCESS" "CPU load: $cpu_load"
    fi
    
    # Check service status
    local services=("postgresql" "nginx" "docker")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet $service; then
            print_status "SUCCESS" "$service is running"
        else
            print_status "WARNING" "$service is not running"
        fi
    done
    
    # Check application health
    local health_check=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
    if [[ "$health_check" == "200" ]]; then
        print_status "SUCCESS" "Application is healthy"
    else
        print_status "WARNING" "Application health check failed (HTTP $health_check)"
    fi
}

# Create recovery plan
create_recovery_plan() {
    print_status "INFO" "Creating recovery plan..."
    
    local plan_file="$BACKUP_DIR/recovery-plan-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$plan_file" << EOF
# Disaster Recovery Plan

**Generated:** $(date)
**System:** $(hostname)

## Recovery Steps

### 1. Assessment
- [ ] Identify the scope of the disaster
- [ ] Determine affected systems
- [ ] Assess data integrity

### 2. Communication
- [ ] Notify stakeholders
- [ ] Update status page
- [ ] Establish communication channels

### 3. Recovery
- [ ] Stop affected services
- [ ] Backup current state
- [ ] Restore from backups
- [ ] Verify systems

### 4. Validation
- [ ] Test critical functionality
- [ ] Verify data integrity
- [ ] Check performance

### 5. Post-Recovery
- [ ] Document incident
- [ ] Analyze root cause
- [ ] Implement prevention measures

## Contact Information

- **On-call DevOps:** [Phone number]
- **Management:** [Phone number]
- **Stakeholders:** [Email list]

## Backup Locations

- **Database:** $BACKUP_DIR/database/
- **Files:** $BACKUP_DIR/files/
- **Configuration:** $BACKUP_DIR/config/

## Recovery Commands

\`\`\`bash
# Full recovery
./disaster-recovery.sh full <backup-date>

# Database recovery
./disaster-recovery.sh database <backup-file>

# Files recovery
./disaster-recovery.sh files <backup-file>

# Configuration recovery
./disaster-recovery.sh config <backup-file>
\`\`\`

## Checklist

- [ ] Emergency backup created
- [ ] Stakeholders notified
- [ ] Recovery initiated
- [ ] Systems verified
- [ ] Documentation updated
- [ ] Post-mortem scheduled
EOF

    print_status "SUCCESS" "Recovery plan created: $plan_file"
}

# Main function
main() {
    local command=$1
    local param1=$2
    local param2=$3
    
    case $command in
        "full")
            check_root
            check_requirements
            full_recovery "$param1"
            ;;
        "database")
            check_root
            restore_database "$param1"
            ;;
        "files")
            check_root
            restore_files "$param1"
            ;;
        "config")
            check_root
            restore_config "$param1"
            ;;
        "list")
            list_backups "$param1"
            ;;
        "health")
            system_health
            ;;
        "plan")
            create_recovery_plan
            ;;
        "stop")
            check_root
            stop_services
            ;;
        "start")
            check_root
            start_services
            ;;
        "verify")
            verify_recovery
            ;;
        *)
            echo "Disaster Recovery Script"
            echo "Usage: $0 <command> [parameters]"
            echo ""
            echo "Commands:"
            echo "  full <date>           Full disaster recovery"
            echo "  database <file>        Restore database"
            echo "  files <file>          Restore application files"
            echo "  config <file>          Restore configuration"
            echo "  list [type]           List backups (database, files, config, all)"
            echo "  health                 System health check"
            echo "  plan                   Create recovery plan"
            echo "  stop                   Stop all services"
            echo "  start                  Start all services"
            echo "  verify                 Verify recovery"
            echo ""
            echo "Examples:"
            echo "  $0 full 2024-01-01"
            echo "  $0 database /path/to/backup.sql.gz"
            echo "  $0 list database"
            echo "  $0 health"
            exit 1
            ;;
    esac
}

# Initialize log
mkdir -p "$(dirname "$LOG_FILE")"
log "Disaster recovery script started with command: $1"

# Execute main function
main "$@"

log "Disaster recovery script completed"
