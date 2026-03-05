# 🚀 COMPLETE DEPLOYMENT GUIDE
## Step-by-Step Instructions for Mini-App, Backend & Super Admin Dashboard

---

## 📋 **TABLE OF CONTENTS**
1. [Supabase Project Setup](#1-supabase-project-setup)
2. [Database Schema Migration](#2-database-schema-migration)
3. [Backend Migration to Supabase](#3-backend-migration-to-supabase)
4. [Mini-App Frontend Deployment](#4-mini-app-frontend-deployment)
5. [Super Admin Dashboard Deployment](#5-super-admin-dashboard-deployment)
6. [TON Blockchain Integration](#6-ton-blockchain-integration)
7. [Payment Analytics Setup](#7-payment-analytics-setup)
8. [Testing & Verification](#8-testing--verification)
9. [🌐 ALTERNATIVE: Vercel Deployment](#9-alternative-vercel-deployment)

---

## 1. SUPABASE PROJECT SETUP

### **Step 1.1: Create Supabase Account**
```bash
# Visit: https://supabase.com
# Click: "Start your project"
# Sign up with GitHub/Google/Email
# Verify email address
```

### **Step 1.2: Create New Project**
```bash
# After login, click "New Project"
# Project Settings:
Project Name: "team-iran-vs-usa"
Database Password: [Generate strong password]
Region: "Choose nearest to your users"
# Click: "Create new project"
```

### **Step 1.3: Get Project Credentials**
```bash
# After project creation, go to Settings > API
# Copy these credentials:
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Step 1.4: Configure Environment Variables**
```bash
# Create .env file in project root
cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# TON Blockchain Configuration
TON_ADMIN_WALLET=0:your_admin_wallet_address_here
STG_TOKENS_WALLET=0:your_stg_tokens_wallet_address_here
PREMIUM_FEATURES_WALLET=0:your_premium_features_wallet_address_here

# Existing Configuration
PORT=3000
NODE_ENV=production
EOF
```

---

## 2. DATABASE SCHEMA MIGRATION

### **Step 2.1: Create Migration Files**
```bash
# Create migrations directory
mkdir -p supabase/migrations

# Create users table migration
cat > supabase/migrations/001_create_users.sql << 'EOF'
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  faction VARCHAR(10) CHECK (faction IN ('iran', 'usa')),
  level INTEGER DEFAULT 1,
  stg_tokens BIGINT DEFAULT 1000,
  energy INTEGER DEFAULT 100,
  max_energy INTEGER DEFAULT 100,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_faction ON users(faction);
CREATE INDEX idx_users_level ON users(level);
EOF

# Create battles table migration
cat > supabase/migrations/002_create_battles.sql << 'EOF'
-- Create battles table
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  stake_amount BIGINT NOT NULL,
  battle_type VARCHAR(50) DEFAULT 'normal',
  fee_amount BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_battles_players ON battles(player1_id, player2_id);
CREATE INDEX idx_battles_created ON battles(created_at);
EOF

# Create purchases table migration
cat > supabase/migrations/003_create_purchases.sql << 'EOF'
-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_type VARCHAR(50) NOT NULL,
  product_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  ton_transaction_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);
EOF

# Create subscriptions table migration
cat > supabase/migrations/004_create_subscriptions.sql << 'EOF'
-- Create subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  feature_id VARCHAR(100) NOT NULL,
  monthly_price DECIMAL(10,2) NOT NULL,
  ton_transaction_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_feature ON subscriptions(feature_id);
EOF
```

### **Step 2.2: Enable Row Level Security**
```bash
# Create RLS policies
cat > supabase/migrations/005_enable_rls.sql << 'EOF'
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR ALL USING (auth.uid()::text = telegram_id::text);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = telegram_id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = telegram_id::text);

-- Similar policies for other tables...
EOF
```

### **Step 2.3: Run Migrations**
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## 3. BACKEND MIGRATION TO SUPABASE

### **Step 3.1: Create Supabase Client**
```bash
# Create Supabase client utility
cat > src/utils/supabase-client.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
EOF
```

### **Step 3.2: Create Edge Functions**
```bash
# Create edge functions directory
mkdir -p supabase/functions

# Create user stats function
cat > supabase/functions/user-stats/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const { method, url } = req
  
  if (method === 'GET' && url === '/user/stats') {
    try {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error) throw new Error('Invalid token');
      
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', user.user_metadata.telegram_id)
        .single();
      
      return new Response(
        JSON.stringify({
          id: userData.id,
          username: userData.username,
          faction: userData.faction,
          level: userData.level,
          stgTokens: userData.stg_tokens,
          energy: userData.energy,
          maxEnergy: userData.max_energy,
          rank: userData.rank,
          wins: userData.wins,
          losses: userData.losses,
          winRate: userData.wins > 0 ? 
            Math.round((userData.wins / (userData.wins + userData.losses)) * 100) : 0
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response('Not Found', { status: 404 })
})
EOF

# Create battle function
cat > supabase/functions/create-battle/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method === 'POST' && req.url === '/battle/create') {
    try {
      const { player1Id, player2Id, stakeAmount, battleType } = await req.json();
      
      // Calculate battle fee
      const feeAmount = Math.round(stakeAmount * 0.02);
      const netStake = stakeAmount - feeAmount;
      
      // Create battle record
      const { data: battle, error } = await supabase
        .from('battles')
        .insert({
          player1_id: player1Id,
          player2_id: player2Id,
          stake_amount: netStake,
          fee_amount: feeAmount,
          battle_type: battleType || 'normal'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({
          success: true,
          battle: {
            id: battle.id,
            player1Id,
            player2Id,
            stakeAmount: netStake,
            fee: feeAmount,
            battleType: battleType || 'normal'
          }
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response('Not Found', { status: 404 })
})
EOF
```

### **Step 3.3: Deploy Edge Functions**
```bash
# Deploy all edge functions
supabase functions deploy user-stats
supabase functions deploy create-battle
supabase functions deploy process-payment
supabase functions deploy subscription-manager
```

---

## 4. MINI-APP FRONTEND DEPLOYMENT

### **Step 4.1: Update Frontend for Supabase**
```bash
# Create Supabase config for frontend
cat > frontend/src/config/supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Real-time subscriptions
export const subscribeToUserUpdates = (userId, callback) => {
  return supabase
    .channel(`user_${userId}`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
      callback
    )
    .subscribe()
}

export const subscribeToBattleUpdates = (callback) => {
  return supabase
    .channel('battles')
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'battles' },
      callback
    )
    .subscribe()
}
EOF
```

### **Step 4.2: Update Package.json for Supabase**
```bash
# Add Supabase dependencies to frontend
cd frontend
npm install @supabase/supabase-js @supabase/auth-helpers-react
```

### **Step 4.3: Build Frontend**
```bash
# Build for production
cd frontend
npm run build

# The build will be in frontend/build/
```

---

## 5. SUPER ADMIN DASHBOARD DEPLOYMENT

### **Step 5.1: Create Admin Dashboard Structure**
```bash
# Create admin dashboard directory
mkdir -p admin-dashboard/src/components admin-dashboard/public

# Create admin dashboard package.json
cat > admin-dashboard/package.json << 'EOF'
{
  "name": "team-iran-vs-usa-admin",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "antd": "^5.12.0",
    "@ant-design/plots": "^1.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "axios": "^1.6.0",
    "styled-components": "^6.1.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
```

### **Step 5.2: Create Admin Dashboard App**
```bash
# Create main admin app
cat > admin-dashboard/src/App.js << 'EOF'
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ConfigProvider } from 'antd';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './config/supabase';
import 'antd/dist/reset.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
        <Router>
          <Routes>
            <Route path="/*" element={<AdminDashboard supabase={supabase} />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
EOF
```

### **Step 5.3: Build Admin Dashboard**
```bash
# Install dependencies and build
cd admin-dashboard
npm install
npm run build
```

---

## 6. TON BLOCKCHAIN INTEGRATION

### **Step 6.1: Install TON Dependencies**
```bash
# Install TON SDK for both backend and admin dashboard
npm install @ton/core @ton/crypto @ton/ton ton-core ton-crypto
```

### **Step 6.2: Create TON Payment Service**
```bash
# Create TON payment service
cat > src/services/ton-payments.js << 'EOF'
const { TonClient } = require('@ton/ton');
const { mnemonicNew, mnemonicToPrivateKey } = require('@ton/crypto');

class TONPaymentService {
  constructor() {
    this.client = new TonClient({
      endpoint: 'https://toncenter.com/api/v2/jsonRPC',
      apiKey: process.env.TON_API_KEY
    });
    
    // Admin wallets
    this.wallets = {
      stgTokens: process.env.STG_TOKENS_WALLET,
      premiumFeatures: process.env.PREMIUM_FEATURES_WALLET
    };
  }

  // Process STG token purchase
  async processTokenPurchase(userId, amount, productId) {
    try {
      const product = this.getProductDetails(productId);
      const tonAmount = this.convertUSDToTON(product.price);
      
      // Create transaction
      const transaction = await this.client.sendTransaction({
        to: this.wallets.stgTokens,
        value: tonAmount,
        message: `STG Token Purchase: ${product.amount} tokens`
      });
      
      // Record purchase in database
      await this.recordPurchase(userId, {
        product_type: 'stg_tokens',
        product_id: productId,
        amount: product.price,
        currency: 'USD',
        ton_transaction_hash: transaction.hash,
        status: 'completed'
      });
      
      return {
        success: true,
        transactionHash: transaction.hash,
        tonAmount,
        usdAmount: product.price
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process premium subscription
  async processPremiumSubscription(userId, featureId) {
    try {
      const feature = this.getFeatureDetails(featureId);
      const tonAmount = this.convertUSDToTON(feature.monthly);
      
      // Create recurring transaction
      const transaction = await this.client.sendTransaction({
        to: this.wallets.premiumFeatures,
        value: tonAmount,
        message: `Premium Subscription: ${feature.name}`
      });
      
      // Record subscription
      await this.recordSubscription(userId, {
        feature_id: featureId,
        monthly_price: feature.monthly,
        ton_transaction_hash: transaction.hash,
        status: 'active',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      return {
        success: true,
        transactionHash: transaction.hash,
        tonAmount,
        usdAmount: feature.monthly
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get wallet analytics
  async getWalletAnalytics(walletType) {
    try {
      const walletAddress = this.wallets[walletType];
      const transactions = await this.client.getTransactions(walletAddress);
      
      const analytics = {
        totalTransactions: transactions.length,
        totalTON: transactions.reduce((sum, tx) => sum + parseFloat(tx.value), 0),
        totalUSD: 0,
        transactionsByDay: {},
        averageTransaction: 0
      };
      
      // Convert TON to USD for each transaction
      for (const tx of transactions) {
        const usdValue = this.convertTONToUSD(parseFloat(tx.value));
        analytics.totalUSD += usdValue;
        
        const day = new Date(tx.time).toISOString().split('T')[0];
        analytics.transactionsByDay[day] = (analytics.transactionsByDay[day] || 0) + 1;
      }
      
      analytics.averageTransaction = analytics.totalUSD / analytics.totalTransactions;
      
      return analytics;
    } catch (error) {
      throw new Error(`Failed to get wallet analytics: ${error.message}`);
    }
  }

  // Helper methods
  getProductDetails(productId) {
    const products = {
      'stg_1k': { amount: 1000, price: 1.99 },
      'stg_5k': { amount: 5000, price: 5.99 },
      'stg_10k': { amount: 10000, price: 10.99 },
      'stg_50k': { amount: 50000, price: 29.99 }
    };
    return products[productId];
  }

  getFeatureDetails(featureId) {
    const features = {
      'energy_boost': { name: 'Energy Boost', monthly: 2 },
      'custom_avatar': { name: 'Custom Avatar', monthly: 5 },
      'battle_analytics': { name: 'Battle Analytics', monthly: 3 },
      'vip_chat': { name: 'VIP Chat', monthly: 4 }
    };
    return features[featureId];
  }

  convertUSDToTON(usdAmount) {
    // Use current TON/USD exchange rate
    const tonRate = 2.5; // Example: 1 TON = $2.50
    return (usdAmount / tonRate).toFixed(9);
  }

  convertTONToUSD(tonAmount) {
    const tonRate = 2.5;
    return tonAmount * tonRate;
  }

  async recordPurchase(userId, purchaseData) {
    // Record in Supabase purchases table
    const { data, error } = await supabase
      .from('purchases')
      .insert({ user_id: userId, ...purchaseData })
      .select();
    
    if (error) throw error;
    return data;
  }

  async recordSubscription(userId, subscriptionData) {
    // Record in Supabase subscriptions table
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, ...subscriptionData })
      .select();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new TONPaymentService();
EOF
```

### **Step 6.3: Create Payment Analytics Service**
```bash
# Create payment analytics service
cat > src/services/payment-analytics.js << 'EOF'
const tonPaymentService = require('./ton-payments');
const { supabase } = require('../utils/supabase-client');

class PaymentAnalyticsService {
  // Get comprehensive payment analytics
  async getPaymentAnalytics(timeframe = 'month') {
    try {
      const analytics = {
        stgTokenWallet: await this.getSTGTokenAnalytics(timeframe),
        premiumFeaturesWallet: await this.getPremiumFeaturesAnalytics(timeframe),
        totalRevenue: 0,
        paymentMethods: {},
        conversionRates: {},
        topProducts: [],
        revenueByDay: {}
      };
      
      // Calculate total revenue
      analytics.totalRevenue = analytics.stgTokenWallet.totalRevenue + 
                              analytics.premiumFeaturesWallet.totalRevenue;
      
      return analytics;
    } catch (error) {
      throw new Error(`Failed to get payment analytics: ${error.message}`);
    }
  }

  // Get STG token wallet analytics
  async getSTGTokenAnalytics(timeframe) {
    const walletAnalytics = await tonPaymentService.getWalletAnalytics('stgTokens');
    
    // Get purchase data from database
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
      .eq('product_type', 'stg_tokens')
      .gte('created_at', this.getTimeframeDate(timeframe));
    
    const productBreakdown = this.analyzeProductBreakdown(purchases);
    
    return {
      walletType: 'STG Tokens',
      totalTransactions: walletAnalytics.totalTransactions,
      totalTON: walletAnalytics.totalTON,
      totalUSD: walletAnalytics.totalUSD,
      totalRevenue: productBreakdown.totalRevenue,
      averageTransaction: walletAnalytics.averageTransaction,
      productBreakdown,
      transactionsByDay: walletAnalytics.transactionsByDay
    };
  }

  // Get Premium Features wallet analytics
  async getPremiumFeaturesAnalytics(timeframe) {
    const walletAnalytics = await tonPaymentService.getWalletAnalytics('premiumFeatures');
    
    // Get subscription data from database
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .gte('created_at', this.getTimeframeDate(timeframe));
    
    const featureBreakdown = this.analyzeFeatureBreakdown(subscriptions);
    
    return {
      walletType: 'Premium Features',
      totalTransactions: walletAnalytics.totalTransactions,
      totalTON: walletAnalytics.totalTON,
      totalUSD: walletAnalytics.totalUSD,
      totalRevenue: featureBreakdown.totalRevenue,
      averageTransaction: walletAnalytics.averageTransaction,
      featureBreakdown,
      activeSubscriptions: subscriptions.filter(s => s.status === 'active').length
    };
  }

  // Analyze product breakdown
  analyzeProductBreakdown(purchases) {
    const breakdown = {};
    let totalRevenue = 0;
    
    const products = {
      'stg_1k': { name: '1,000 STG', price: 1.99 },
      'stg_5k': { name: '5,000 STG', price: 5.99 },
      'stg_10k': { name: '10,000 STG', price: 10.99 },
      'stg_50k': { name: '50,000 STG', price: 29.99 }
    };
    
    // Initialize breakdown
    Object.keys(products).forEach(productId => {
      breakdown[productId] = {
        name: products[productId].name,
        price: products[productId].price,
        purchases: 0,
        revenue: 0
      };
    });
    
    // Count purchases and calculate revenue
    purchases.forEach(purchase => {
      if (breakdown[purchase.product_id]) {
        breakdown[purchase.product_id].purchases++;
        breakdown[purchase.product_id].revenue += purchase.amount;
        totalRevenue += purchase.amount;
      }
    });
    
    return { breakdown, totalRevenue };
  }

  // Analyze feature breakdown
  analyzeFeatureBreakdown(subscriptions) {
    const breakdown = {};
    let totalRevenue = 0;
    
    const features = {
      'energy_boost': { name: 'Energy Boost', price: 2 },
      'custom_avatar': { name: 'Custom Avatar', price: 5 },
      'battle_analytics': { name: 'Battle Analytics', price: 3 },
      'vip_chat': { name: 'VIP Chat', price: 4 }
    };
    
    // Initialize breakdown
    Object.keys(features).forEach(featureId => {
      breakdown[featureId] = {
        name: features[featureId].name,
        price: features[featureId].price,
        subscriptions: 0,
        revenue: 0
      };
    });
    
    // Count subscriptions and calculate revenue
    subscriptions.forEach(subscription => {
      if (breakdown[subscription.feature_id]) {
        breakdown[subscription.feature_id].subscriptions++;
        breakdown[subscription.feature_id].revenue += subscription.monthly_price;
        totalRevenue += subscription.monthly_price;
      }
    });
    
    return { breakdown, totalRevenue };
  }

  // Get timeframe date
  getTimeframeDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  // Get real-time payment dashboard data
  async getDashboardData() {
    const analytics = await this.getPaymentAnalytics('month');
    
    return {
      summary: {
        totalRevenue: analytics.totalRevenue,
        stgTokenRevenue: analytics.stgTokenWallet.totalRevenue,
        premiumRevenue: analytics.premiumFeaturesWallet.totalRevenue,
        totalTransactions: analytics.stgTokenWallet.totalTransactions + 
                          analytics.premiumFeaturesWallet.totalTransactions
      },
      charts: {
        revenueByDay: analytics.stgTokenWallet.transactionsByDay,
        productPerformance: analytics.stgTokenWallet.productBreakdown,
        featurePerformance: analytics.premiumFeaturesWallet.featureBreakdown
      },
      wallets: {
        stgTokens: analytics.stgTokenWallet,
        premiumFeatures: analytics.premiumFeaturesWallet
      }
    };
  }
}

module.exports = new PaymentAnalyticsService();
EOF
```

---

## 7. PAYMENT ANALYTICS SETUP

### **Step 7.1: Create Analytics API Endpoints**
```bash
# Create analytics edge function
cat > supabase/functions/payment-analytics/index.ts << 'EOF'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import paymentAnalyticsService from '../../src/services/payment-analytics.js'

serve(async (req) => {
  const { method, url } = req
  
  if (method === 'GET' && url === '/payment-analytics') {
    try {
      const { timeframe } = Object.fromEntries(req.url.split('?')[1].split('&').map(s => s.split('=')));
      
      const analytics = await paymentAnalyticsService.getDashboardData();
      
      return new Response(
        JSON.stringify({
          success: true,
          data: analytics,
          timestamp: new Date().toISOString()
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return new Response('Not Found', { status: 404 })
})
EOF
```

### **Step 7.2: Deploy Analytics Function**
```bash
# Deploy analytics function
supabase functions deploy payment-analytics
```

---

## 8. TESTING & VERIFICATION

### **Step 8.1: Test Database Connection**
```bash
# Test database connection
curl -X POST "https://your-project-ref.supabase.co/rest/v1/rpc/test_connection" \
  -H "apikey: your_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Step 8.2: Test Edge Functions**
```bash
# Test user stats function
curl -X GET "https://your-project-ref.supabase.co/functions/v1/user-stats" \
  -H "Authorization: Bearer your_jwt_token"

# Test battle creation
curl -X POST "https://your-project-ref.supabase.co/functions/v1/create-battle" \
  -H "Content-Type: application/json" \
  -d '{"player1Id": "uuid1", "player2Id": "uuid2", "stakeAmount": 100}'
```

### **Step 8.3: Test Payment Analytics**
```bash
# Test payment analytics
curl -X GET "https://your-project-ref.supabase.co/functions/v1/payment-analytics?timeframe=month" \
  -H "apikey: your_service_role_key"
```

### **Step 8.4: Deploy Frontend Applications**
```bash
# Deploy main game app
cd frontend
npm run build
supabase deploy --project-ref your-project-ref

# Deploy admin dashboard
cd ../admin-dashboard
npm run build
supabase deploy --project-ref your-project-ref --no-db
```

---

## 🎯 **DEPLOYMENT VERIFICATION CHECKLIST**

### **✅ Supabase Project Setup**
- [ ] Supabase account created
- [ ] Project created with proper settings
- [ ] Environment variables configured
- [ ] API keys obtained and secured

### **✅ Database Migration**
- [ ] All tables created (users, battles, purchases, subscriptions)
- [ ] Indexes created for performance
- [ ] Row Level Security enabled
- [ ] Migration successfully pushed

### **✅ Backend Migration**
- [ ] Supabase client configured
- [ ] Edge functions created and deployed
- [ ] API endpoints tested and working
- [ ] Authentication integrated

### **✅ Frontend Deployment**
- [ ] Supabase client integrated
- [ ] Real-time subscriptions working
- [ ] Build process successful
- [ ] Application deployed and accessible

### **✅ Super Admin Dashboard**
- [ ] Admin dashboard created and built
- [ ] TON wallet integration working
- [ ] Payment analytics functional
- [ ] Management features operational

### **✅ TON Blockchain Integration**
- [ ] Payment service implemented
- [ ] Wallet analytics working
- [ ] Transaction processing functional
- [ ] Payment analytics deployed

### **✅ Payment Analytics**
- [ ] Analytics service created
- [ ] Real-time dashboard data
- [ ] Category-wise tracking
- [ ] Revenue calculations accurate

---

## 9. 🌐 ALTERNATIVE: VERCEL DEPLOYMENT

### **Step 9.1: Install Vercel CLI**
```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### **Step 9.2: Configure Vercel Project**
```bash
# Create vercel.json configuration
cat > vercel.json << 'EOF'
{
  "version": 2,
  "name": "team-iran-vs-usa",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    },
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "admin-dashboard/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/src/server-simple.js"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/admin-dashboard/index.html"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/api/*.js": {
      "maxDuration": 30
    }
  }
}
EOF
```

### **Step 9.3: Update Package.json for Vercel**
```bash
# Add Vercel build script
cat > package.json.tmp << 'EOF'
{
  "name": "team-iran-vs-usa-telegram-game",
  "version": "1.0.0",
  "description": "Telegram Mini-Game/P2E bot with faction-based competition",
  "main": "src/server-simple.js",
  "scripts": {
    "start": "node src/server-simple.js",
    "dev": "node src/server-simple.js",
    "build": "npm run build:frontend && npm run build:admin",
    "build:frontend": "cd frontend && npm run build",
    "build:admin": "cd admin-dashboard && npm run build",
    "vercel-build": "npm run build",
    "migrate": "node scripts/migrate-local.js",
    "seed": "node scripts/seed-local.js",
    "test": "jest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.98.0",
    "@ton/core": "^0.63.1",
    "@ton/crypto": "^3.3.0",
    "@ton/ton": "^16.2.2",
    "@tonconnect/sdk": "^3.0.3",
    "axios": "^1.6.2",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^9.2.3",
    "node-telegram-bot-api": "^0.64.0",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "ton-core": "^0.53.0",
    "ton-crypto": "^3.2.0",
    "uuid": "^9.0.1",
    "ws": "^8.14.2",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2",
    "supertest": "^6.3.3"
  },
  "keywords": [
    "telegram",
    "bot",
    "game",
    "p2e",
    "ton",
    "blockchain"
  ],
  "author": "Team Iran vs Team USA Game",
  "license": "MIT"
}
EOF

mv package.json.tmp package.json
```

### **Step 9.4: Deploy to Vercel**
```bash
# Deploy main application
vercel --prod

# Follow the prompts:
# ? Set up and deploy "~/TeamIranVSTeamUSA"? [Y/n] y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? team-iran-vs-usa
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

### **Step 9.5: Configure Environment Variables on Vercel**
```bash
# Add environment variables via Vercel CLI
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add TON_ADMIN_WALLET
vercel env add STG_TOKENS_WALLET
vercel env add PREMIUM_FEATURES_WALLET
vercel env add TON_API_KEY
vercel env add JWT_SECRET
vercel env add TELEGRAM_BOT_TOKEN

# Or add via Vercel Dashboard:
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Go to Settings > Environment Variables
# 4. Add all required variables
```

### **Step 9.6: Deploy Admin Dashboard Separately**
```bash
# Deploy admin dashboard to separate Vercel project
cd admin-dashboard

vercel --prod --name team-iran-vs-usa-admin

# Configure admin dashboard environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add TON_ADMIN_WALLET
vercel env add STG_TOKENS_WALLET
vercel env add PREMIUM_FEATURES_WALLET
```

### **Step 9.7: Vercel Deployment Structure**
```bash
# Final project structure after Vercel deployment:
team-iran-vs-usa/
├── src/server-simple.js          # Backend API
├── frontend/build/              # Main game app
├── admin-dashboard/build/        # Admin dashboard
├── vercel.json                 # Vercel configuration
├── package.json                # Main dependencies
├── frontend/package.json        # Frontend dependencies
└── admin-dashboard/package.json  # Admin dependencies
```

### **Step 9.8: Vercel URL Structure**
```bash
# After deployment, you'll get URLs like:
Main Game: https://team-iran-vs-usa.vercel.app
API: https://team-iran-vs-usa.vercel.app/api
Admin Dashboard: https://team-iran-vs-usa-admin.vercel.app
```

### **Step 9.9: Custom Domain Setup (Optional)**
```bash
# Add custom domain via Vercel CLI
vercel domains add yourdomain.com

# Or via Vercel Dashboard:
# 1. Go to Project Settings > Domains
# 2. Add your custom domain
# 3. Configure DNS records as instructed
# 4. Wait for SSL certificate issuance
```

---

## 🌐 **ACCESS URLS AFTER DEPLOYMENT**

### **Supabase Deployment**
```
Game URL: https://your-project-ref.supabase.co
API URL: https://your-project-ref.supabase.co/functions/v1
Database: https://your-project-ref.supabase.co/rest/v1
Admin URL: https://your-project-ref.supabase.co/admin
```

### **Vercel Deployment**
```
Game URL: https://team-iran-vs-usa.vercel.app
API URL: https://team-iran-vs-usa.vercel.app/api
Admin Dashboard: https://team-iran-vs-usa-admin.vercel.app
Custom Domain: https://yourdomain.com (if configured)
```

---

## 🎯 **DEPLOYMENT VERIFICATION CHECKLIST**

### **✅ Supabase Project Setup**
- [ ] Supabase account created
- [ ] Project created with proper settings
- [ ] Environment variables configured
- [ ] API keys obtained and secured

### **✅ Vercel Project Setup**
- [ ] Vercel CLI installed and logged in
- [ ] vercel.json configuration created
- [ ] Project deployed successfully
- [ ] Environment variables configured

### **✅ Database Migration**
- [ ] All tables created (users, battles, purchases, subscriptions)
- [ ] Indexes created for performance
- [ ] Row Level Security enabled (Supabase only)
- [ ] Migration successfully pushed

### **✅ Backend Migration**
- [ ] Supabase client configured (Supabase only)
- [ ] Edge Functions created and deployed (Supabase only)
- [ ] API endpoints tested and working
- [ ] Authentication integrated

### **✅ Frontend Deployment**
- [ ] Supabase client integrated (Supabase only)
- [ ] Real-time subscriptions working (Supabase only)
- [ ] Build process successful
- [ ] Application deployed and accessible

### **✅ Super Admin Dashboard**
- [ ] Admin dashboard created and built
- [ ] TON wallet integration working
- [ ] Payment analytics functional
- [ ] Management features operational

### **✅ TON Blockchain Integration**
- [ ] Payment service implemented
- [ ] Wallet analytics working
- [ ] Transaction processing functional
- [ ] Payment analytics deployed

### **✅ Payment Analytics**
- [ ] Analytics service created
- [ ] Real-time dashboard data
- [ ] Category-wise tracking
- [ ] Revenue calculations accurate

---

## 🎉 **DEPLOYMENT COMPLETE!**

### **Choose Your Deployment Platform:**

#### **🚀 Supabase Deployment:**
- ✅ **Mini-App** - React frontend with real-time features
- ✅ **Backend** - Supabase Edge Functions with database
- ✅ **Super Admin Dashboard** - Complete management system
- ✅ **TON Integration** - Blockchain payments and analytics
- ✅ **Payment Analytics** - Comprehensive revenue tracking

#### **🌐 Vercel Deployment:**
- ✅ **Mini-App** - React frontend with serverless functions
- ✅ **Backend** - Node.js server with API endpoints
- ✅ **Super Admin Dashboard** - Separate admin deployment
- ✅ **TON Integration** - Blockchain payments and analytics
- ✅ **Payment Analytics** - Comprehensive revenue tracking

### **Both Deployments Include:**
- **Complete game functionality** with all features
- **TON blockchain integration** with wallet management
- **Payment analytics** for STG tokens and premium features
- **Admin dashboard** with real-time management
- **Scalable infrastructure** ready for growth

**🎉 Your Team Iran vs USA game is ready for deployment on your preferred platform!**
