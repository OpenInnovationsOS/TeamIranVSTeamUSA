# 🚀 Quick Deployment Guide

## 📋 Prerequisites

- **Server** with Ubuntu 20.04+ or CentOS 8+
- **Domain** pointing to server IP
- **SSL Certificate** (Let's Encrypt recommended)
- **Docker & Docker Compose** installed

## ⚡ Quick Start (Docker)

### 1. Clone Repository
```bash
git clone https://github.com/OIPTechCORE/TeamIranVSTeamUSA.git
cd TeamIranVSTeamUSA
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Critical Settings:**
```env
TELEGRAM_BOT_TOKEN=your_bot_token
DATABASE_URL=postgresql://postgres:your_password@postgres:5432/team_iran_vs_usa
REDIS_URL=redis://:your_password@redis:6379
TON_API_KEY=your_ton_api_key
```

### 3. Deploy with Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Check status
docker-compose ps
```

### 4. Setup Telegram Bot
```bash
# Get your webhook URL
WEBHOOK_URL="https://your-domain.com/webhook"

# Set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=$WEBHOOK_URL"
```

## 🔧 Manual Deployment

### 1. Install Dependencies
```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 15
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Redis 7
sudo apt install -y redis-server

# PM2
sudo npm install -g pm2

# Nginx
sudo apt install -y nginx
```

### 2. Setup Database
```bash
# Create database and user
sudo -u postgres createdb team_iran_vs_usa
sudo -u postgres createuser --interactive

# Run migrations
npm run migrate

# Seed data
npm run seed
```

### 3. Build Application
```bash
# Install dependencies
npm install

# Build frontend
cd frontend
npm install
npm run build
cd ..
```

### 4. Deploy with PM2
```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Configure Nginx
```bash
# Copy Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/team-iran-vs-usa

# Enable site
sudo ln -s /etc/nginx/sites-available/team-iran-vs-usa /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## 🔒 SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring Setup

### 1. Setup Monitoring Script
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Add to crontab for monitoring every 5 minutes
sudo crontab -e
# Add: */5 * * * * /path/to/team-iran-vs-usa/scripts/monitor.sh
```

### 2. Setup Backup Script
```bash
# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add: 0 2 * * * /path/to/team-iran-vs-usa/scripts/backup.sh
```

## 🎮 Smart Contract Deployment

### 1. Install TON CLI
```bash
# Install TON CLI
npm install -g @ton/cli
```

### 2. Deploy Contracts
```bash
# Deploy WIN Token
ton-cli deploy contracts/WIN.jetton.fc --signer your_signer

# Deploy Treasury
ton-cli deploy contracts/Treasury.fc --signer your_signer
```

### 3. Update Environment
```bash
# Add contract addresses to .env
echo "WIN_TOKEN_CONTRACT_ADDRESS=<deployed_address>" >> .env
echo "TREASURY_CONTRACT_ADDRESS=<deployed_address>" >> .env
```

## 🔍 Verification

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Database connection
psql -h localhost -U postgres -d team_iran_vs_usa -c "SELECT 1;"

# Redis connection
redis-cli ping
```

### Log Locations
- **Application**: `pm2 logs team-iran-vs-usa`
- **Nginx**: `/var/log/nginx/`
- **Database**: `/var/log/postgresql/`
- **Monitoring**: `/var/log/monitor.log`

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs team-iran-vs-usa

# Restart
pm2 restart team-iran-vs-usa
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d team_iran_vs_usa

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Telegram Webhook Not Working
```bash
# Check webhook info
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Test webhook
curl -X POST -H "Content-Type: application/json" \
     -d '{"test": true}' \
     https://your-domain.com/webhook
```

#### SSL Certificate Issues
```bash
# Check certificate expiry
openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates

# Renew certificate
sudo certbot renew
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Update statistics
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE team_iran_vs_usa;

-- Vacuum database
VACUUM ANALYZE;
```

### Redis Optimization
```bash
# Check Redis memory usage
redis-cli info memory

# Optimize Redis config
sudo nano /etc/redis/redis.conf
```

### Application Optimization
```bash
# Monitor PM2 metrics
pm2 monit

# Check memory usage
pm2 show team-iran-vs-usa
```

## 🎉 Launch Checklist

- [ ] Environment variables configured
- [ ] Database created and migrated
- [ ] Frontend built successfully
- [ ] SSL certificate installed
- [ ] Nginx configured and running
- [ ] Application started with PM2
- [ ] Telegram webhook set
- [ ] Smart contracts deployed
- [ ] Monitoring scripts active
- [ ] Backup scripts scheduled
- [ ] Health checks passing

## 📞 Support

### Get Help
1. Check logs: `pm2 logs team-iran-vs-usa`
2. Run monitoring: `./scripts/monitor.sh`
3. Check health: `curl https://your-domain.com/health`
4. Review documentation: `DEPLOYMENT.md`

### Emergency Rollback
```bash
# Rollback to previous version
git checkout HEAD~1
npm ci
npm run build
pm2 reload ecosystem.config.js --env production
```

---

🎮 **Your Team Iran vs Team USA game is now ready for production!**

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
