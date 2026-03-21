# Team Iran vs USA - Runbooks

## 📋 Table of Contents

1. [Incident Response](#incident-response)
2. [Deployment Runbook](#deployment-runbook)
3. [Database Maintenance](#database-maintenance)
4. [Security Incidents](#security-incidents)
5. [Performance Issues](#performance-issues)
6. [Backup and Recovery](#backup-and-recovery)
7. [Scaling Operations](#scaling-operations)

## 🚨 Incident Response

### Severity Levels

| Severity | Response Time | Impact | Examples |
|----------|----------------|---------|-----------|
| P0 - Critical | 15 minutes | Complete outage | Application down, database unavailable |
| P1 - High | 1 hour | Major functionality broken | Battles not working, payments failing |
| P2 - Medium | 4 hours | Partial functionality | Some features degraded, slow performance |
| P3 - Low | 24 hours | Minor issues | UI bugs, non-critical features |

### Incident Response Process

#### 1. Detection (T+0)

```bash
# Check monitoring alerts
curl -s https://yourdomain.com/health
docker-compose -f docker-compose.prod.yml ps
grep -i error /var/www/team-iran-vs-usa/logs/app.log

# Check external monitoring
# Grafana: https://yourdomain.com:3001
# Prometheus: https://yourdomain.com:9090
```

#### 2. Assessment (T+15 minutes)

```bash
# Identify affected services
docker-compose -f docker-compose.prod.yml ps

# Check system resources
free -h
df -h
htop

# Check network connectivity
ping 8.8.8.8
curl -I https://yourdomain.com

# Check database connectivity
psql -h localhost -U team_iran_vs_usa_user -d team_iran_vs_usa -c "SELECT 1;"
```

#### 3. Communication (T+30 minutes)

```bash
# Send notification to team
# Slack: #incidents channel
# Email: oncall@team-iran-vs-usa.com
# Status page: Update status.team-iran-vs-usa.com

# Incident template:
# 🚨 INCIDENT: [Service] - [Brief Description]
# Severity: [P0/P1/P2/P3]
# Impact: [What's affected]
# ETA: [Estimated resolution time]
# Updates: [Channel for updates]
```

#### 4. Resolution (T+1 hour)

```bash
# Apply fixes based on incident type
# See specific runbooks below
```

#### 5. Post-Incident (T+24 hours)

```bash
# Write post-mortem
# Root cause analysis
# Prevention measures
# Timeline of events
# Lessons learned
```

## 🚀 Deployment Runbook

### Pre-Deployment Checklist

```bash
# 1. Health check
curl -f https://yourdomain.com/health

# 2. Backup current version
node scripts/backup.js full

# 3. Check dependencies
npm audit --audit-level high

# 4. Run tests
npm run test:ci

# 5. Check disk space
df -h /var/www/team-iran-vs-usa

# 6. Verify database connection
psql -h localhost -U team_iran_vs_usa_user -d team_iran_vs_usa -c "SELECT version();"
```

### Deployment Steps

#### 1. Staging Deployment

```bash
# Deploy to staging
node scripts/deploy.js deploy staging

# Verify staging
curl -f https://staging.team-iran-vs-usa.com/health

# Run smoke tests
npm run test:smoke -- --baseUrl=https://staging.team-iran-vs-usa.com
```

#### 2. Production Deployment

```bash
# Deploy to production
node scripts/deploy.js deploy production

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f app

# Health check
sleep 30
curl -f https://yourdomain.com/health

# Run post-deployment tests
npm run test:smoke -- --baseUrl=https://yourdomain.com
```

### Rollback Procedure

```bash
# Quick rollback (if deployment fails)
node scripts/deploy.js rollback production

# Verify rollback
curl -f https://yourdomain.com/health

# Test critical functionality
curl -X POST https://yourdomain.com/api/health
```

### Deployment Verification

```bash
# 1. Application health
curl -s https://yourdomain.com/health | jq '.status'

# 2. Database connectivity
curl -s https://yourdomain.com/api/health | jq '.database'

# 3. Redis connectivity
curl -s https://yourdomain.com/api/health | jq '.redis'

# 4. WebSocket functionality
wscat -c wss://yourdomain.com:3001

# 5. Bot functionality
curl -X POST https://yourdomain.com/api/telegram/webhook \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "test"}}'
```

## 🗄️ Database Maintenance

### Daily Maintenance

```bash
# 1. Check database size
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT 
    pg_size_pretty(pg_database_size('team_iran_vs_usa')) as database_size,
    pg_size_pretty(pg_total_relation_size('team_iran_vs_usa')) as total_size;
"

# 2. Check active connections
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE state = 'active';
"

# 3. Check slow queries
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# 4. Check table sizes
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Weekly Maintenance

```bash
# 1. Update statistics
sudo -u postgres psql -d team_iran_vs_usa -c "ANALYZE;"

# 2. Reindex fragmented tables
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT 'REINDEX INDEX ' || indexrelname || ';' 
  FROM pg_stat_user_indexes 
  WHERE idx_scan = 0 OR idx_tup_read > 0;
"

# 3. Clean up old data
sudo -u postgres psql -d team_iran_vs_usa -c "
  DELETE FROM battle_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
"

# 4. Vacuum database
sudo -u postgres psql -d team_iran_vs_usa -c "VACUUM ANALYZE;"
```

### Database Backup

```bash
# Daily backup
node scripts/backup.js database

# Manual backup
sudo -u postgres pg_dump team_iran_vs_usa > /var/backups/team-iran-vs-usa/manual_backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip /var/backups/team-iran-vs-usa/manual_backup_*.sql
```

### Database Recovery

```bash
# 1. Stop application
docker-compose -f docker-compose.prod.yml stop app

# 2. Backup current database
sudo -u postgres pg_dump team_iran_vs_usa > /tmp/emergency_backup.sql

# 3. Restore from backup
sudo -u postgres psql team_iran_vs_usa < /var/backups/team-iran-vs-usa/backup_to_restore.sql

# 4. Run migrations
npm run migrate:prod

# 5. Start application
docker-compose -f docker-compose.prod.yml start app

# 6. Verify recovery
curl -f https://yourdomain.com/health
```

## 🛡️ Security Incidents

### Types of Security Incidents

#### 1. DDoS Attack

**Symptoms:**
- High CPU/memory usage
- Slow response times
- Many requests from same IP

**Response:**
```bash
# 1. Identify attacking IPs
sudo tail -f /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr

# 2. Block malicious IPs
sudo ufw deny from MALICIOUS_IP

# 3. Enable rate limiting
sudo nano /etc/nginx/nginx.conf
# Add rate limiting configuration

# 4. Use fail2ban
sudo apt install fail2ban
sudo nano /etc/fail2ban/jail.local
# Configure nginx and ssh jails

# 5. Enable CloudFlare or similar DDoS protection
```

#### 2. SQL Injection Attempt

**Symptoms:**
- Suspicious SQL patterns in logs
- Database errors
- Data exfiltration attempts

**Response:**
```bash
# 1. Check logs for SQL injection patterns
grep -i "union\|select\|insert\|update\|delete" /var/log/nginx/access.log

# 2. Block attacking IPs
sudo ufw deny from ATTACKING_IP

# 3. Review database for unauthorized changes
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT * FROM pg_stat_activity WHERE query LIKE '%UNION%';
"

# 4. Rotate database credentials
sudo -u postgres psql -c "ALTER USER team_iran_vs_usa_user PASSWORD 'new_secure_password';"

# 5. Update application security
node scripts/security-audit.js harden
```

#### 3. Data Breach

**Symptoms:**
- Unauthorized data access
- Sensitive data in logs
- Reports of data exposure

**Response:**
```bash
# 1. Immediately contain the breach
sudo ufw deny from SUSPICIOUS_IP
docker-compose -f docker-compose.prod.yml stop app

# 2. Assess damage
grep -i "password\|token\|secret" /var/log/nginx/access.log
grep -i "error\|exception" /var/www/team-iran-vs-usa/logs/app.log

# 3. Change all credentials
# Database password
# JWT secrets
# API keys
# SSL certificates

# 4. Notify affected users
# Send email notifications
# Post on social media
# Update status page

# 5. Forensic investigation
# Preserve logs
# Analyze attack vectors
# Document timeline
```

### Security Monitoring

```bash
# Real-time monitoring
tail -f /var/log/nginx/access.log | grep -i "union\|select\|script\|alert"

# Failed login attempts
grep "401\|403" /var/log/nginx/access.log | awk '{print $1}' | sort | uniq -c | sort -nr

# Suspicious user agents
grep -i "bot\|crawler\|scanner" /var/log/nginx/access.log | awk '{print $12}' | sort | uniq -c

# File integrity monitoring
find /var/www/team-iran-vs-usa -type f -exec sha256sum {} \; > /tmp/file_hashes.txt
# Compare with previous hashes
```

## ⚡ Performance Issues

### Symptoms

- Slow response times
- High CPU/memory usage
- Database timeouts
- WebSocket disconnections

### Diagnosis

```bash
# 1. Check system resources
htop
iotop
df -h
free -h

# 2. Check application performance
docker stats
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# 3. Check database performance
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  ORDER BY mean_time DESC 
  LIMIT 10;
"

# 4. Check network performance
ping -c 10 yourdomain.com
traceroute yourdomain.com
```

### Common Solutions

#### High CPU Usage

```bash
# 1. Identify process
top
ps aux --sort=-%cpu

# 2. Restart application
docker-compose -f docker-compose.prod.yml restart app

# 3. Scale up resources
# Increase CPU allocation
# Add more workers

# 4. Optimize database
sudo -u postgres psql -d team_iran_vs_usa -c "ANALYZE;"
```

#### High Memory Usage

```bash
# 1. Check memory usage
free -h
ps aux --sort=-%mem

# 2. Clear Redis cache
redis-cli FLUSHALL

# 3. Restart application
docker-compose -f docker-compose.prod.yml restart app

# 4. Optimize Node.js memory
# Increase --max-old-space-size
# Check for memory leaks
```

#### Database Performance

```bash
# 1. Check slow queries
sudo -u postgres psql -d team_iran_vs_usa -c "
  SELECT query, mean_time, calls 
  FROM pg_stat_statements 
  WHERE mean_time > 1000 
  ORDER BY mean_time DESC;
"

# 2. Add indexes
sudo -u postgres psql -d team_iran_vs_usa -c "
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_created_at 
  ON battles(created_at);
"

# 3. Optimize configuration
sudo nano /etc/postgresql/15/main/postgresql.conf
# Adjust shared_buffers, work_mem, etc.
```

## 💾 Backup and Recovery

### Automated Backups

```bash
# Database backup (daily)
0 2 * * * /var/www/team-iran-vs-usa/scripts/backup.sh database

# Files backup (weekly)
0 3 * * 0 /var/www/team-iran-vs-usa/scripts/backup.sh files

# Configuration backup (monthly)
0 4 1 * * /var/www/team-iran-vs-usa/scripts/backup.sh config
```

### Manual Backup

```bash
# Full system backup
node scripts/backup.js full

# Database only
node scripts/backup.js database

# Application files
node scripts/backup.js files

# Configuration
node scripts/backup.js config
```

### Recovery Procedures

#### Database Recovery

```bash
# 1. Stop application
docker-compose -f docker-compose.prod.yml stop app

# 2. Backup current state
sudo -u postgres pg_dump team_iran_vs_usa > /tmp/emergency_backup.sql

# 3. Restore database
sudo -u postgres psql team_iran_vs_usa < /var/backups/team-iran-vs-usa/database_backup.sql

# 4. Run migrations
npm run migrate:prod

# 5. Start application
docker-compose -f docker-compose.prod.yml start app

# 6. Verify recovery
curl -f https://yourdomain.com/health
```

#### File Recovery

```bash
# 1. Restore application files
tar -xzf /var/backups/team-iran-vs-usa/files_backup.tar.gz -C /var/www/team-iran-vs-usa/

# 2. Set permissions
sudo chown -R www-data:www-data /var/www/team-iran-vs-usa
sudo chmod -R 755 /var/www/team-iran-vs-usa

# 3. Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Complete System Recovery

```bash
# 1. Provision new server
# Follow deployment guide

# 2. Restore backups
node scripts/backup.js restore database
node scripts/backup.js restore files
node scripts/backup.js restore config

# 3. Update DNS
# Point domain to new server

# 4. Test functionality
curl -f https://yourdomain.com/health
```

## 📈 Scaling Operations

### Horizontal Scaling

```bash
# 1. Add application servers
# Deploy to new servers
# Update load balancer configuration

# 2. Scale database
# Set up read replicas
# Implement connection pooling

# 3. Scale cache
# Add Redis cluster
# Implement cache sharding

# 4. Update monitoring
# Add new servers to monitoring
# Update dashboards
```

### Vertical Scaling

```bash
# 1. Increase server resources
# Add CPU cores
# Add RAM
# Add storage

# 2. Update configuration
# Increase worker processes
# Adjust memory limits
# Optimize database settings

# 3. Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Auto-scaling Setup

```bash
# 1. Configure monitoring
# Set up metrics collection
# Define scaling thresholds

# 2. Set up auto-scaling
# Cloud provider auto-scaling
# Kubernetes HPA

# 3. Test auto-scaling
# Simulate load
# Verify scaling behavior
```

## 📞 Emergency Contacts

### On-Call Team

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | John Doe | +1-555-0123 |
| Backend Lead | Jane Smith | +1-555-0124 |
| Frontend Lead | Bob Johnson | +1-555-0125 |
| Database Admin | Alice Brown | +1-555-0126 |

### External Services

| Service | Contact |
|---------|---------|
| Hosting Provider | support@hosting.com |
| Domain Registrar | support@registrar.com |
| SSL Provider | support@ssl.com |
| CDN Provider | support@cdn.com |

### Communication Channels

- **Slack**: #incidents, #devops
- **Email**: oncall@team-iran-vs-usa.com
- **Phone**: +1-555-0000 (emergency hotline)
- **Status Page**: https://status.team-iran-vs-usa.com

---

**Last Updated**: 2024-01-01  
**Version**: 1.0.0  
**Maintainer**: Team Iran vs USA DevOps Team
