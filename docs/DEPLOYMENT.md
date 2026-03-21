# 🚀 Deployment Guide - Team Iran vs Team USA Telegram Game

## 📋 Prerequisites

### Infrastructure Requirements
- **Node.js** 16+ 
- **PostgreSQL** 13+
- **Redis** 6+
- **TON Node** (for blockchain operations)
- **Domain** with SSL certificate

### External Services
- **Telegram Bot Token** from @BotFather
- **TON API Key** from toncenter.com
- **SSL Certificate** for webhook (production)

## 🛠️ Setup Instructions

### 1. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Required Environment Variables:**
```env
# Server
PORT=3000
NODE_ENV=production

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/team_iran_vs_usa

# Redis
REDIS_URL=redis://localhost:6379

# TON Blockchain
TON_API_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TON_API_KEY=your_ton_api_key
TREASURY_CONTRACT_ADDRESS=your_treasury_contract
WIN_TOKEN_CONTRACT_ADDRESS=your_win_token_contract

# Security
JWT_SECRET=your_jwt_secret_key_here
ADMIN_TELEGRAM_ID=your_admin_telegram_id
```

### 2. Database Setup

```bash
# Create database
createdb team_iran_vs_usa

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 3. Smart Contract Deployment

```bash
# Deploy WIN Token (FunC)
ton-cli deploy contracts/WIN.jetton.fc

# Deploy Treasury Contract
ton-cli deploy contracts/Treasury.fc

# Update environment variables with deployed addresses
```

### 4. Frontend Build

```bash
cd frontend
npm install
npm run build
```

### 5. Production Deployment

#### Option A: Docker (Recommended)
```bash
# Build Docker image
docker build -t team-iran-vs-usa .

# Run with Docker Compose
docker-compose up -d
```

#### Option B: Manual Deployment
```bash
# Install dependencies
npm install

# Start production server
npm start

# Setup reverse proxy (nginx example)
# See nginx.conf below
```

## 🔧 Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Telegram Webhook
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Monitoring & Scaling

### Process Management (PM2)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs
```

### Health Checks
- **API Health**: `GET /health`
- **Database**: Connection pool monitoring
- **Redis**: Connection status
- **Telegram**: Webhook delivery status

### Scaling Recommendations
- **Load Balancer**: Nginx/HAProxy
- **Database**: Read replicas for scaling reads
- **Redis**: Cluster mode for high availability
- **App Server**: Horizontal scaling with PM2 cluster

## 🔒 Security Considerations

### API Security
- Rate limiting implemented
- JWT authentication
- Input validation
- SQL injection protection

### Blockchain Security
- Multisig treasury wallet
- Smart contract audits
- Transaction verification
- Admin access controls

### Telegram Security
- Webhook verification
- User data validation
- Anti-bot measures

## 📈 Performance Optimization

### Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX CONCURRENTLY idx_users_telegram_id ON users(telegram_id);
CREATE INDEX CONCURRENTLY idx_battles_status ON battles(status);
CREATE INDEX CONCURRENTLY idx_transactions_user_type ON transactions(user_id, type);
```

### Caching Strategy
- **Redis**: User sessions, rate limits, leaderboards
- **CDN**: Static assets, frontend build
- **Browser**: Static assets caching

### Database Optimization
- Connection pooling (max: 20)
- Query optimization
- Regular maintenance (VACUUM, ANALYZE)

## 🚨 Troubleshooting

### Common Issues

#### 1. Telegram Webhook Not Working
```bash
# Check webhook status
curl -X POST https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Set webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/webhook
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test connection
psql -h localhost -U user -d team_iran_vs_usa
```

#### 3. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
tail -f /var/log/redis/redis-server.log
```

### Log Analysis
```bash
# Application logs
pm2 logs team-iran-vs-usa

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Database logs
tail -f /var/log/postgresql/postgresql.log
```

## 📱 Telegram Bot Setup

### 1. Create Bot
1. Message @BotFather
2. `/newbot` - Create new bot
3. Set name and username
4. Copy the bot token

### 2. Configure Bot
1. `/setdomain` - Set your domain
2. `/setwebhook` - Set webhook URL
3. `/setcommands` - Set bot commands

### Bot Commands
```
/start - Start playing
/help - Show help
/stats - View statistics
/leaderboard - Show leaderboard
/faction - View faction stats
```

## 🎮 Game Configuration

### Initial Setup
1. Deploy smart contracts
2. Configure tokenomics
3. Set up referral rewards
4. Initialize territories
5. Create daily missions

### Ongoing Management
- Monitor game balance
- Adjust rewards as needed
- Run special events
- Handle user support
- Analyze metrics

## 📊 Analytics & Metrics

### Key Metrics to Track
- Daily Active Users (DAU)
- User Retention Rate
- Transaction Volume
- Territory Control Changes
- Referral Conversion Rate
- WIN Token Distribution

### Monitoring Tools
- **Application**: PM2 Monitoring
- **Database**: pgAdmin, Prometheus
- **Redis**: RedisInsight
- **Server**: Grafana, New Relic

## 🔄 Backup Strategy

### Database Backups
```bash
# Daily backup
0 2 * * * pg_dump team_iran_vs_usa | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz

# Retention policy (30 days)
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

### Redis Backups
```bash
# Hourly Redis backup
0 * * * * redis-cli BGSAVE
```

## 🚀 Launch Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database migrated and seeded
- [ ] Smart contracts deployed
- [ ] Frontend built and optimized
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security audit completed

### Post-Launch
- [ ] Monitor system performance
- [ ] Check Telegram webhook delivery
- [ ] Verify blockchain transactions
- [ ] Analyze user behavior
- [ ] Collect feedback
- [ ] Plan improvements

## 🆘 Support & Maintenance

### Regular Tasks
- **Daily**: Check system health, review metrics
- **Weekly**: Update content, run events
- **Monthly**: Security updates, performance review
- **Quarterly**: Major updates, feature releases

### Emergency Procedures
1. **Service Down**: Check PM2 status, restart if needed
2. **Database Issues**: Switch to read-only mode, investigate
3. **Blockchain Issues**: Pause transactions, verify contracts
4. **Telegram Issues**: Check webhook, verify bot status

---

## 🎉 Congratulations!

Your Team Iran vs Team USA Telegram game is now ready to launch! 

Remember to:
- Monitor performance closely
- Engage with the community
- Iterate based on feedback
- Keep the game balanced and fair

Good luck! 🎮🏆
