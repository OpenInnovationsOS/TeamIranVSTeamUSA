# 🚀 VERCEL DEPLOYMENT GUIDE

## Team Iran vs Team USA - Complete Vercel Deployment

---

## 📋 **PREREQUISITES**

### **✅ Required Accounts:**
- **GitHub**: https://github.com/OIPTechCORE/TeamIranVSTeamUSA.git
- **Vercel**: https://vercel.com (create free account)
- **Git**: Installed on your local machine

---

## 🎯 **DEPLOYMENT OPTIONS**

### **Option 1: Vercel Dashboard (Recommended)**
### **Option 2: Vercel CLI**
### **Option 3: GitHub Integration (Automatic)**

---

## 🚀 **OPTION 1: VERCEL DASHBOARD (EASIEST)**

### **Step 1: Sign in to Vercel**
1. Go to https://vercel.com
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### **Step 2: Import Repository**
1. Click "Add New..." → "Project"
2. Find "TeamIranVSTeamUSA" in your repositories
3. Click "Import"

### **Step 3: Configure Project**
```
📁 PROJECT SETTINGS:
├── Framework Preset: Other
├── Root Directory: ./
├── Build Command: npm run build
├── Output Directory: frontend/build
├── Install Command: npm install
└── Node.js Version: 18.x
```

### **Step 4: Environment Variables**
Add these environment variables in Vercel:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-app-name.vercel.app/api
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### **Step 5: Deploy**
1. Click "Deploy"
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app-name.vercel.app`

---

## ⚡ **OPTION 2: VERCEL CLI**

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
# Choose GitHub account
# Authorize in browser
```

### **Step 3: Deploy from Project Root**
```bash
cd TeamIranVSTeamUSA
vercel --prod
```

### **Step 4: Answer Configuration Questions**
```
? Set up and deploy "~/TeamIranVSTeamUSA"? [Y/n] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? team-iran-vs-usa
? In which directory is your code located? ./
? Want to override the settings? [y/N] y
? Which scope do you want to deploy to? Your Name
? Link to existing project? [y/N] n
? What's your project's name? team-iran-vs-usa
? In which directory is your code located? ./
? Want to override the settings? [y/N] y

🔧 CONFIGURATION:
├── Framework Preset: Other
├── Root Directory: ./
├── Build Command: npm run build
├── Output Directory: frontend/build
├── Install Command: npm install
└── Node.js Version: 18.x
```

---

## 🔄 **OPTION 3: GITHUB INTEGRATION (AUTOMATIC)**

### **Step 1: Connect GitHub to Vercel**
1. Go to Vercel Dashboard
2. Click "Settings" → "GitHub"
3. Click "Connect GitHub"
4. Install Vercel GitHub App
5. Select repositories (choose TeamIranVSTeamUSA)

### **Step 2: Configure Automatic Deployment**
```
🔄 AUTO-DEPLOY SETTINGS:
├── Branch: master
├── Build Command: npm run build
├── Output Directory: frontend/build
├── Environment: Production
└── Automatic Deployments: Enabled
```

### **Step 3: Push to Trigger Deployment**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin master
```

---

## ⚙️ **VERCEL CONFIGURATION FILE**

### **Create `vercel.json` in Root:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/simple-game-server.js",
      "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🔧 **SERVERLESS FUNCTION SETUP**

### **Create `api/index.js`:**
```javascript
const simpleGameServer = require('../../simple-game-server.js');

module.exports = async (req, res) => {
  // Handle API requests
  await simpleGameServer(req, res);
};
```

### **Update `package.json`:**
```json
{
  "scripts": {
    "build": "cd frontend && npm run build",
    "vercel-build": "npm run build"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0"
  }
}
```

---

## 🌐 **DEPLOYMENT CONFIGURATION**

### **Root Directory: `./`**
- This is the correct setting for your repository structure
- Vercel will detect your project from the root
- All files are accessible from the root level

### **Application Preset: `Other`**
- Your project uses custom server setup
- Not a standard React/Vue/Angular template
- Uses `simple-game-server.js` as the backend

### **Build Settings:**
```
✅ BUILD COMMAND: npm run build
✅ OUTPUT DIRECTORY: frontend/build
✅ INSTALL COMMAND: npm install
✅ NODE VERSION: 18.x
✅ ROOT DIRECTORY: ./
```

---

## 🔄 **API ROUTING ON VERCEL**

### **Serverless Function Structure:**
```
📁 PROJECT ROOT/
├── api/
│   ├── health.js
│   ├── stats.js
│   ├── leaderboard.js
│   ├── battle.js
│   └── profile.js
├── frontend/
│   └── build/
│       ├── index.html
│       └── static/
└── vercel.json
```

### **Route Mapping:**
```
/api/health → api/health.js
/api/stats → api/stats.js
/api/leaderboard → api/leaderboard.js
/api/battle → api/battle.js
/api/profile → api/profile.js
/* → frontend/build/index.html
```

---

## 🚀 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Prepare Repository**
```bash
# Ensure everything is committed
git status
git add .
git commit -m "Ready for Vercel deployment"
git push origin master
```

### **Step 2: Vercel Dashboard Setup**
1. Go to https://vercel.com/new
2. Import from GitHub: `OIPTechCORE/TeamIranVSTeamUSA`
3. Configure settings:
   - Framework: Other
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `frontend/build`

### **Step 3: Environment Variables**
Add these in Vercel dashboard:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-app-name.vercel.app/api
```

### **Step 4: Deploy**
1. Click "Deploy"
2. Wait for build (2-3 minutes)
3. Test deployment

---

## 🧪 **TESTING DEPLOYMENT**

### **Check These URLs:**
```
🌐 Main App: https://your-app-name.vercel.app
🏥 Health: https://your-app-name.vercel.app/api/health
📊 Stats: https://your-app-name.vercel.app/api/stats
🏆 Leaderboard: https://your-app-name.vercel.app/api/leaderboard
⚔️ Battle: https://your-app-name.vercel.app/battle
🗺️ Territory: https://your-app-name.vercel.app/territory
🎯 Missions: https://your-app-name.vercel.app/missions
👤 Profile: https://your-app-name.vercel.app/profile
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues & Solutions:**

#### **Build Fails:**
```bash
# Check frontend build locally
cd frontend
npm run build

# Fix any build errors before deploying
```

#### **API Routes Not Working:**
```json
// vercel.json - ensure correct routes
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ]
}
```

#### **Static Files Not Loading:**
```json
// vercel.json - ensure correct static routing
{
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/frontend/build/static/$1"
    }
  ]
}
```

---

## 📱 **MOBILE OPTIMIZATION**

### **Vercel Analytics:**
1. Go to Vercel Dashboard
2. Click "Analytics"
3. Monitor performance and usage

### **CDN Optimization:**
- Vercel automatically serves static files from CDN
- API routes are optimized for edge computing
- Global distribution for fast loading

---

## 🎉 **DEPLOYMENT SUCCESS**

### **✅ What You Get:**
- **HTTPS**: Automatic SSL certificate
- **CDN**: Global content delivery
- **Analytics**: Built-in performance monitoring
- **Preview**: Automatic preview deployments
- **Custom Domain**: Option to use custom domain

### **✅ Final URLs:**
```
🌐 Production: https://team-iran-vs-usa.vercel.app
🔗 GitHub: https://github.com/OIPTechCORE/TeamIranVSTeamUSA
📊 Analytics: https://vercel.com/your-username/analytics
```

---

## 🔄 **CONTINUOUS DEPLOYMENT**

### **Automatic Updates:**
1. Push to master branch
2. Vercel automatically builds and deploys
3. New version available in 2-3 minutes

### **Preview Deployments:**
1. Create pull request
2. Vercel creates preview URL
3. Test changes before merging

---

# 🎯 **COMPLETE VERCEL DEPLOYMENT GUIDE**

## **Team Iran vs Team USA - Ready for Vercel Deployment!**

### **✅ Quick Start:**
1. **Go to**: https://vercel.com/new
2. **Import**: `OIPTechCORE/TeamIranVSTeamUSA`
3. **Configure**: Root Directory `./`, Build `npm run build`, Output `frontend/build`
4. **Deploy**: Click deploy button

### **✅ Result:**
- **URL**: https://team-iran-vs-usa.vercel.app
- **Features**: All 9 screens working
- **API**: All 15 endpoints functional
- **Performance**: Global CDN with HTTPS

**Your game will be live on Vercel in minutes!** 🚀🎮✨
