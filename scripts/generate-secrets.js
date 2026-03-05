const crypto = require('crypto');

console.log('🔐 Generating secure secrets for Team Iran vs Team USA game...\n');

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('📝 JWT_SECRET:');
console.log(jwtSecret);
console.log('\n⚠️  Save this JWT secret securely and add to Render.com environment variables!\n');

// Generate additional secrets
const telegramSecret = crypto.randomBytes(32).toString('hex');
console.log('🤖 Additional Telegram Secret (optional):');
console.log(telegramSecret);
console.log('\n🔑 TON API Key needs to be obtained from: https://toncenter.com');
console.log('📋 JWT Secret can be used immediately');

// Save to .env file for local development
const fs = require('fs');
const envContent = `
# Generated Secrets - DO NOT COMMIT TO GIT
JWT_SECRET=${jwtSecret}
TELEGRAM_WEBHOOK_SECRET=${telegramSecret}

# Add your TON API Key here:
TON_API_KEY=your_ton_api_key_here
`;

fs.writeFileSync('.env.local', envContent.trim());
console.log('\n✅ Secrets saved to .env.local for local development');
console.log('❌ DO NOT commit .env.local to Git repository!');
