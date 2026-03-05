# 🔐 Secrets Setup Guide for Team Iran vs Team USA Game

## 📋 Quick Summary
- ✅ **JWT Secret Generated**: `EWwcgoyHbTIM5qV27g73fir48QNLt25wX+5wOg2yPtHfJPyTfliE9j6SU9MXVLsVMun3s0RuEbX4djBMOyGuEA==`
- 🔄 **TON API Key**: Get from https://toncenter.com

---

## 🔑 TON API Key Setup

### Step 1: Get TON Center Account
1. Go to https://toncenter.com
2. Sign up with email: `info.edutechod@gmail.com`
3. Verify email address

### Step 2: Generate API Key
1. Login to TON Center
2. Navigate to Dashboard → API Keys
3. Click "Generate New API Key"
4. Fill in details:
   - **Name**: `TeamIranVSTeamUSA Game`
   - **Description**: `Telegram Mini-Game API Access`
   - **Permissions**:
     - ✅ `get_address_information`
     - ✅ `get_transactions` 
     - ✅ `send_transaction`
     - ✅ `get_masterchain_info`
   - **Rate Limit**: Free tier (1000 requests/hour)
5. Click "Generate API Key"
6. **Copy the key** - It will look like: `toncenter_api_1234567890abcdef...`

---

## 🔐 JWT Secret Setup

### Your Generated JWT Secret:
```
EWwcgoyHbTIM5qV27g73fir48QNLt25wX+5wOg2yPtHfJPyTfliE9j6SU9MXVLsVMun3s0RuEbX4djBMOyGuEA==
```

### Alternative: Generate New Secret
If you want a different secret:
```bash
# Using OpenSSL
openssl rand -base64 64

# Using our script
node scripts/generate-secrets.js
```

---

## 🚀 Add to Render.com

### Step 1: Go to Render Dashboard
1. Visit https://render.com
2. Select your `team-iran-vs-usa-api` service
3. Click **"Environment"** tab

### Step 2: Add Environment Variables

#### Add TON API Key:
- **Key**: `TON_API_KEY`
- **Value**: [Paste your TON Center API key here]
- **Sync**: ❌ Unchecked (keep secret)

#### Add JWT Secret:
- **Key**: `JWT_SECRET`
- **Value**: `EWwcgoyHbTIM5qV27g73fir48QNLt25wX+5wOg2yPtHfJPyTfliE9j6SU9MXVLsVMun3s0RuEbX4djBMOyGuEA==`
- **Sync**: ❌ Unchecked (keep secret)

### Step 3: Deploy
1. Click **"Manual Deploy"**
2. Select latest commit
3. Wait for deployment (2-5 minutes)

---

## 🔒 Security Checklist

### ✅ Before Deployment:
- [ ] TON API key obtained from toncenter.com
- [ ] JWT secret generated and saved
- [ ] Both added to Render.com environment variables
- [ ] Secrets not committed to Git repository
- [ ] Local .env.local created for development

### ✅ After Deployment:
- [ ] Test API endpoints
- [ ] Verify Telegram bot connection
- [ ] Check TON blockchain integration
- [ ] Monitor logs for any errors

---

## 🛠 Development Setup

### Local Development:
1. Copy secrets to `.env.local` (already generated)
2. Add your TON API key to `.env.local`
3. Never commit `.env.local` to Git

### Production:
1. Use Render.com environment variables
2. Keep secrets secure in dashboard
3. Rotate secrets periodically

---

## 📞 Support

### TON Center Support:
- Website: https://toncenter.com/support
- Email: support@toncenter.com

### Render.com Support:
- Dashboard: https://render.com/dashboard
- Docs: https://render.com/docs

---

## ⚠️ Important Notes

1. **Never share secrets publicly**
2. **Use different secrets for production vs development**
3. **Regenerate TON API key if compromised**
4. **Keep backup of secrets in secure location**
5. **Test with small amounts first**

---

## 🎯 Ready to Deploy!

Once you complete these steps:
1. ✅ Your TON API key is configured
2. ✅ Your JWT secret is set
3. ✅ Environment variables are added to Render
4. ✅ Your game is ready for production!

**Your Team Iran vs Team USA game will be fully functional with:**
- Telegram bot integration
- TON blockchain transactions
- Secure user authentication
- Real-time game features

🚀 **Deploy now and start gaming!**
