# 🚀 Vercel Deployment Guide - Team Iran vs Team USA

## 📋 Migration Summary

Successfully migrated from **PostgreSQL/Redis/Docker** to **MongoDB/Vercel** stack:

### ✅ Completed Changes
- **Database**: PostgreSQL → MongoDB with Mongoose ODM
- **Caching**: Redis → In-memory cache (Vercel compatible)
- **Deployment**: Docker → Vercel Serverless Functions
- **CI/CD**: Manual → GitHub Actions auto-deployment

## 🛠️ Setup Instructions

### 1. MongoDB Setup
```bash
# Create MongoDB Atlas cluster
# 1. Go to https://cloud.mongodb.com
# 2. Create new cluster (M0 free tier)
# 3. Get connection string
# 4. Add to Vercel environment variables
```

### 2. Vercel Environment Variables
Copy from `.env.vercel` to your Vercel project:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/team-iran-vs-usa?retryWrites=true&w=majority
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_URL=https://your-app.vercel.app/webhook
JWT_SECRET=your_jwt_secret
TON_API_KEY=your_ton_api_key
```

### 3. GitHub Repository Setup
```bash
# Push to GitHub
git add .
git commit -m "Migrate to Vercel/MongoDB stack"
git push origin main

# Add GitHub Secrets in repository settings:
# - VERCEL_TOKEN
# - VERCEL_ORG_ID  
# - VERCEL_PROJECT_ID
# - TELEGRAM_BOT_TOKEN
# - VERCEL_URL
```

## 🏗️ Architecture Changes

### Database Models
- **User-mongo.js** - Mongoose schema with all original fields
- **Battle-mongo.js** - Battle system with references
- **Transaction-mongo.js** - Financial transaction tracking

### Caching System
- **cache-memory.js** - In-memory replacement for Redis
- Rate limiting, leaderboards, game state
- Automatic cleanup every 60 seconds

### Deployment Config
- **vercel.json** - Serverless function routing
- **.github/workflows/deploy.yml** - Auto-deployment pipeline
- Removed Docker files (Dockerfile, docker-compose.yml)

## 🚀 Deployment Steps

### Automatic (GitHub Actions)
1. Push to `main` branch
2. GitHub Actions builds and deploys to Vercel
3. Telegram webhook automatically configured

### Manual (Vercel CLI)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set webhook (after deployment)
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.vercel.app/webhook"}'
```

## 🔧 Configuration Files

### vercel.json
- Routes API calls to serverless functions
- Serves static frontend build
- 30-second function timeout

### package.json Updates
- Added `vercel-build` script
- Updated `migrate` to use MongoDB
- Added Mongoose dependency

### Environment Variables
- Production-ready `.env.vercel` template
- All required variables documented

## 📱 Testing

### Local Development
```bash
# Install MongoDB locally or use Atlas
npm install
npm run build
npm start

# Run migration
npm run migrate
```

### Vercel Testing
1. Deploy to Vercel
2. Test webhook endpoint: `https://your-app.vercel.app/health`
3. Verify Telegram bot commands
4. Test game functionality

## 🔄 Migration Notes

### Database Differences
- **PostgreSQL** → **MongoDB**: SQL → NoSQL
- **Indexes**: Automatically created by Mongoose
- **Relationships**: References instead of foreign keys
- **Transactions**: MongoDB atomic operations

### Performance Considerations
- **Caching**: In-memory (single instance) vs Redis (distributed)
- **Database**: MongoDB Atlas (global) vs local PostgreSQL
- **Serverless**: Cold starts vs always-on server

### Scaling Benefits
- **Auto-scaling**: Vercel handles traffic spikes
- **Global CDN**: Frontend served worldwide
- **Zero downtime**: Rolling deployments
- **Pay-per-use**: Only pay for actual usage

## 🎯 Next Steps

1. **Setup MongoDB Atlas** cluster
2. **Configure Vercel** environment variables
3. **Deploy to Vercel** (automatic or manual)
4. **Test Telegram bot** integration
5. **Monitor performance** with Vercel Analytics

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.mongodb.com/atlas
- **GitHub Actions**: https://docs.github.com/actions

The application is now fully compatible with modern serverless deployment! 🎉
