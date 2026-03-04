#!/bin/bash

# Backup script for Team Iran vs Team USA game
# This script creates backups of database and Redis data

# Configuration
BACKUP_DIR="/backups"
DB_NAME="team_iran_vs_usa"
DB_USER="postgres"
REDIS_HOST="localhost"
REDIS_PORT="6379"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting backup process at $(date)"

# Database backup
echo "Creating database backup..."
pg_dump -h localhost -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully"
else
    echo "Database backup failed"
    exit 1
fi

# Redis backup
echo "Creating Redis backup..."
redis-cli -h $REDIS_HOST -p $REDIS_PORT BGSAVE

# Wait for Redis to finish saving
sleep 5

# Copy Redis dump file
if [ -f "/var/lib/redis/dump.rdb" ]; then
    cp "/var/lib/redis/dump.rdb" "$BACKUP_DIR/redis_backup_$DATE.rdb"
    echo "Redis backup completed successfully"
else
    echo "Redis backup failed - dump file not found"
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +$RETENTION_DAYS -delete

# Create backup manifest
echo "Creating backup manifest..."
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
Backup created: $(date)
Database backup: db_backup_$DATE.sql.gz
Redis backup: redis_backup_$DATE.rdb
Total size: $(du -sh $BACKUP_DIR/*_$DATE* | cut -f1)
EOF

echo "Backup process completed at $(date)"
echo "Backup location: $BACKUP_DIR"
echo "Files created:"
ls -la $BACKUP_DIR/*_$DATE*
