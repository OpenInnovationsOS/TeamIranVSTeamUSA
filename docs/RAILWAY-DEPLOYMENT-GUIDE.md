# 🚂 RAILWAY DEPLOYMENT GUIDE

## 🎯 **OVERVIEW**
Complete guide for deploying the Team Iran vs USA game on Railway with MongoDB backend, including configuration, deployment steps, and optimization.

---

## 🚂 **WHY RAILWAY?**

### **Advantages for Your Project:**
- **🎮 Complete Stack Support** - Frontend, backend, admin dashboard
- **💰 Pay-per-use Pricing** - Only pay for what you use
- **🚀 Git-based Deployment** - Push to deploy automatically
- **🌐 Global CDN** - Fast content delivery worldwide
- **📊 Built-in Monitoring** - Performance tracking and logs
- **🔄 Auto-scaling** - Handles traffic spikes automatically
- **🐳 Container-based** - Docker-native platform
- **⚡ Fast Deployments** - Instant updates

---

## 📋 **DEPLOYMENT STRUCTURE**

### **Railway Project Structure**
```
team-iran-vs-usa/
├── frontend/                 # React frontend
│   ├── package.json
│   ├── railway.toml         # Frontend config
│   └── src/
├── backend/                  # Node.js + MongoDB backend
│   ├── package.json
│   ├── railway.toml         # Backend config
│   ├── src/
│   ├── models/
│   ├── routes/
│   └── scripts/
├── admin-dashboard/          # React admin dashboard
│   ├── package.json
│   ├── railway.toml         # Admin config
│   └── src/
└── railway.toml            # Root configuration
```

---

## 🔧 **RAILWAY SETUP**

### **1. Install Railway CLI**
```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Login to Railway
railway login

# Follow the authentication process in your browser
```

### **2. Initialize Railway Project**
```bash
# Navigate to project root
cd team-iran-vs-usa

# Initialize Railway project
railway init

# Follow the prompts:
# ? Set up and deploy "~/TeamIranVSTeamUSA"? [Y/n] Y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? team-iran-vs-usa
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

---

## 🗄️ **MONGODB ATLAS SETUP**

### **1. Create MongoDB Atlas Account**
```bash
# Visit: https://www.mongodb.com/cloud/atlas
# Click: "Try Free" or "Start Free"
# Sign up with GitHub/Google/Email
```

### **2. Create Cluster**
```bash
# 1. Choose Cloud Provider: AWS/Azure/GCP
# 2. Choose Region: Select nearest region
# 3. Cluster Tier: M0 (Free) or M2 ($25/month)
# 4. Cluster Name: team-iran-vs-usa
# 5. Click: "Create Cluster"
```

### **3. Configure Database Access**
```bash
# 1. Go to "Database Access" → "Add New Database User"
# 2. Username: team-iran-vs-usa
# 3. Password: Generate strong password
# 4. Permissions: Read and write to any database
# 5. Click: "Add User"
```

### **4. Configure Network Access**
```bash
# 1. Go to "Network Access" → "Add IP Address"
# 2. Choose: "Allow Access from Anywhere" (0.0.0.0/0)
# 3. Click: "Confirm"
# 4. Add Railway IP ranges for security
```

### **5. Get Connection String**
```bash
# 1. Go to "Database" → "Connect"
# 2. Choose: "Drivers"
# 3. Copy the connection string
# 4. Replace <password> with your database password
# 5. Example: mongodb+srv://team-iran-vs-usa:<password>@cluster.mongodb.net/your_db?retryWrites=true&w=majority
```

---

## 🚀 **BACKEND DEPLOYMENT**

### **1. Backend Configuration**
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your MongoDB URI
MONGODB_URI=mongodb+srv://team-iran-vs-usa:YOUR_PASSWORD@cluster.mongodb.net/team-iran-vs-usa?retryWrites=true&w=majority
```

### **2. Create Backend Service**
```bash
# Add backend as separate service
railway add backend

# Configure backend service
railway variables set MONGODB_URI="your_mongodb_connection_string"
railway variables set NODE_ENV="production"
railway variables set JWT_SECRET="your_jwt_secret_here"
railway variables set TON_ADMIN_WALLET="your_ton_wallet_address"
railway variables set STG_TOKENS_WALLET="your_stg_tokens_wallet_address"
railway variables set PREMIUM_FEATURES_WALLET="your_premium_features_wallet_address"
railway variables set TON_API_KEY="your_ton_api_key"
```

### **3. Deploy Backend**
```bash
# Deploy backend service
railway up

# Monitor deployment
railway logs backend

# Check health endpoint
curl https://your-backend-url.railway.app/health
```

---

## 📱 **FRONTEND DEPLOYMENT**

### **1. Frontend Configuration**
```bash
# Navigate to frontend directory
cd ../frontend

# Update railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
REACT_APP_API_URL = "${{RAILWAY_PUBLIC_DOMAIN}}/api"
REACT_APP_SUPABASE_URL = "${{SUPABASE_URL}}"
REACT_APP_SUPABASE_ANON_KEY = "${{SUPABASE_ANON_KEY}}"
EOF
```

### **2. Create Frontend Service**
```bash
# Add frontend as separate service
railway add frontend

# Configure frontend service
railway variables set REACT_APP_API_URL="https://your-backend-url.railway.app/api"

# Deploy frontend
railway up

# Monitor deployment
railway logs frontend
```

---

## 🎛️ **ADMIN DASHBOARD DEPLOYMENT**

### **1. Admin Dashboard Configuration**
```bash
# Navigate to admin-dashboard directory
cd ../admin-dashboard

# Update railway.toml
cat > railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[env]
NODE_ENV = "production"
REACT_APP_API_URL = "${{RAILWAY_PUBLIC_DOMAIN}}/api"
REACT_APP_SUPABASE_URL = "${{SUPABASE_URL}}"
REACT_APP_SUPABASE_ANON_KEY = "${{SUPABASE_ANON_KEY}}"
EOF
```

### **2. Create Admin Dashboard Service**
```bash
# Add admin dashboard as separate service
railway add admin-dashboard

# Configure admin dashboard service
railway variables set REACT_APP_API_URL="https://your-backend-url.railway.app/api"

# Deploy admin dashboard
railway up

# Monitor deployment
railway logs admin-dashboard
```

---

## 🗄️ **DATABASE MIGRATION**

### **1. Run Migration Script**
```bash
# Navigate to backend directory
cd backend

# Run migration script
railway run backend "npm run migrate"

# Monitor migration logs
railway logs backend

# Verify migration success
railway run backend "node -e 'console.log(\"Migration completed successfully\")'"
```

### **2. Seed Database (Optional)**
```bash
# Seed with sample data
railway run backend "npm run seed"

# Monitor seeding logs
railway logs backend
```

---

## 🔗 **SERVICE INTEGRATION**

### **1. Update Frontend API URLs**
```javascript
// frontend/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.railway.app/api';

export const api = {
  users: `${API_BASE_URL}/users`,
  battles: `${API_BASE_URL}/battles`,
  monetization: `${API_BASE_URL}/monetization`,
  admin: `${API_BASE_URL}/admin`
};
```

### **2. Update Admin Dashboard API URLs**
```javascript
// admin-dashboard/src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-url.railway.app/api';

export const api = {
  users: `${API_BASE_URL}/admin/users`,
  analytics: `${API_BASE_URL}/admin/analytics`,
  monetization: `${API_BASE_URL}/admin/monetization`,
  battles: `${API_BASE_URL}/admin/battles`
};
```

---

## 📊 **MONITORING & LOGS**

### **1. View Service Logs**
```bash
# View all service logs
railway logs

# View specific service logs
railway logs backend
railway logs frontend
railway logs admin-dashboard

# View real-time logs
railway logs --follow
```

### **2. Monitor Service Health**
```bash
# Check service status
railway status

# View service metrics
railway metrics

# View service details
railway status backend
```

### **3. Environment Variables**
```bash
# List all environment variables
railway variables

# Add new variable
railway variables set NEW_VAR="value"

# Remove variable
railway variables remove NEW_VAR
```

---

## 🔧 **OPTIMIZATION**

### **1. Performance Optimization**
```javascript
// backend/src/middleware/performance.js
const compression = require('compression');
const helmet = require('helmet');

app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// Enable caching for static assets
app.use(express.static('public', {
  maxAge: '1d',
  etag: true
}));
```

### **2. Database Optimization**
```javascript
// backend/src/config/database.js
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};
```

### **3. Caching Strategy**
```javascript
// backend/src/middleware/cache.js
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

const cacheMiddleware = (duration = 600) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};
```

---

## 🔄 **CI/CD AUTOMATION**

### **1. GitHub Actions Workflow**
```yaml
# .github/workflows/railway-deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd backend && npm install
        cd ../frontend && npm install
        cd ../admin-dashboard && npm install
    
    - name: Deploy to Railway
      uses: railway-app/railway-action@v1
      with:
        api-token: ${{ secrets.RAILWAY_TOKEN }}
        service: backend
```

### **2. Environment Setup**
```bash
# Add Railway API token to GitHub Secrets
# 1. Go to GitHub repository → Settings → Secrets
# 2. Add new secret: RAILWAY_TOKEN
# 3. Get token from Railway: railway token
# 4. Paste token as secret value
```

---

## 🚨 **TROUBLESHOOTING**

### **1. Common Issues**

#### **MongoDB Connection Error**
```bash
# Check MongoDB URI format
# Correct: mongodb+srv://user:pass@cluster.mongodb.net/db
# Wrong: mongodb://user:pass@cluster.mongodb.net/db

# Verify network access
# Go to MongoDB Atlas → Network Access
# Ensure 0.0.0.0/0 is allowed
```

#### **Build Failures**
```bash
# Check package.json scripts
"scripts": {
  "start": "node src/server.js",
  "build": "echo 'Build complete'"
}

# Verify railway.toml configuration
[build]
builder = "NIXPACKS"
```

#### **Runtime Errors**
```bash
# Check environment variables
railway variables

# View detailed logs
railway logs --follow

# Restart service
railway restart backend
```

### **2. Performance Issues**
```bash
# Check resource usage
railway status

# Scale up if needed
railway scale backend --instances=2

# Add custom domain
railway domains add yourdomain.com
```

---

## 💰 **COST OPTIMIZATION**

### **1. Railway Pricing**
```
🆓 FREE TIER:
- $5 credit per month
- 100 hours compute
- 100GB bandwidth
- 1GB storage

🚀 PAID TIER:
- $0.00025 per hour per instance
- $0.10 per GB bandwidth
- $0.25 per GB storage
- Pay-per-use pricing
```

### **2. MongoDB Atlas Pricing**
```
🆓 M0 (FREE):
- 512MB storage
- Shared cluster
- 100 connections

🚀 M2 ($25/month):
- 10GB storage
- 2 vCPUs, 2GB RAM
- 1500 connections

🚀 M10 ($60/month):
- 80GB storage
- 2 vCPUs, 4GB RAM
- 3000 connections
```

### **3. Cost Optimization Tips**
```bash
# 1. Use free tier for development
# 2. Scale down during low traffic
# 3. Optimize database queries
# 4. Enable caching
# 5. Monitor resource usage
# 6. Set up alerts for cost spikes
```

---

## 🎯 **DEPLOYMENT CHECKLIST**

### **✅ Pre-deployment:**
- [ ] MongoDB Atlas cluster created
- [ ] Database user configured
- [ ] Network access allowed
- [ ] Railway CLI installed
- [ ] Environment variables set
- [ ] Railway project initialized

### **✅ Backend Deployment:**
- [ ] Dependencies installed
- [ ] Migration script run
- [ ] Database seeded (optional)
- [ ] Health endpoint working
- [ ] API endpoints tested
- [ ] Logs monitored

### **✅ Frontend Deployment:**
- [ ] Build process successful
- [ ] API URLs configured
- [ ] Static assets optimized
- [ ] Routes working
- [ ] Responsive design tested

### **✅ Admin Dashboard Deployment:**
- [ ] Build process successful
- [ ] Admin API endpoints working
- [ ] Authentication tested
- [ ] Analytics displaying
- [ ] Management features working

### **✅ Post-deployment:**
- [ ] All services healthy
- [ ] Database connected
- [ ] APIs communicating
- [ ] Monitoring active
- [ ] Logs error-free
- [ ] Performance optimized

---

## 🌐 **ACCESS URLS AFTER DEPLOYMENT**

### **Railway URLs:**
```
Backend API: https://your-backend-name.railway.app
Frontend App: https://your-frontend-name.railway.app
Admin Dashboard: https://your-admin-name.railway.app
MongoDB Atlas: https://cloud.mongodb.com
```

### **Custom Domain (Optional):**
```bash
# Add custom domain
railway domains add yourdomain.com

# Configure DNS records
# A record: @ → Railway IP
# CNAME record: www → your-app.railway.app
```

---

## 🎉 **DEPLOYMENT COMPLETE!**

### **✅ What You Now Have:**
- **🗄️ MongoDB Database** - Scalable NoSQL database
- **🚀 Railway Backend** - Node.js API with MongoDB
- **📱 Frontend App** - React game interface
- **🎛️ Admin Dashboard** - Complete management system
- **🌐 Global CDN** - Fast content delivery
- **📊 Monitoring** - Performance tracking
- **🔄 Auto-scaling** - Handles traffic spikes
- **💰 Cost Optimization** - Pay-per-use pricing

### **🚀 Next Steps:**
1. **Monitor performance** - Use Railway logs and metrics
2. **Optimize costs** - Scale based on usage
3. **Set up alerts** - Monitor for issues
4. **Add custom domain** - Professional branding
5. **Configure CI/CD** - Automated deployments

**🎉 Your Team Iran vs USA game is now live on Railway with MongoDB!**
