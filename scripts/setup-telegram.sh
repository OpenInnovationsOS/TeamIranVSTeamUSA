#!/bin/bash

# Telegram Bot setup script for Team Iran vs Team USA game
# This script configures the Telegram bot and sets up webhooks

set -e

echo "🤖 Setting up Telegram Bot for Team Iran vs Team USA game..."

# Configuration
BOT_TOKEN="DEMO_BOT_TOKEN_123456789"
WEBHOOK_URL="https://team-iran-vs-usa-demo.com/webhook"
DOMAIN="team-iran-vs-usa-demo.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_bot() {
    echo -e "${BLUE}[BOT]${NC} $1"
}

# Check if bot token is provided
if [ "$BOT_TOKEN" = "your_telegram_bot_token_here" ] || [ -z "$BOT_TOKEN" ]; then
    print_error "Please set your Telegram Bot Token in the script or environment variable"
    echo ""
    echo "To get a bot token:"
    echo "1. Message @BotFather on Telegram"
    echo "2. Send /newbot"
    echo "3. Follow the instructions"
    echo "4. Copy the bot token"
    echo ""
    echo "Then update BOT_TOKEN variable in this script"
    exit 1
fi

print_status "Using Bot Token: ${BOT_TOKEN:0:10}..."

# Test bot connection
print_status "Testing bot connection..."
BOT_INFO=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/getMe" | jq .)

if echo "$BOT_INFO" | jq -e '.ok' > /dev/null 2>&1; then
    BOT_USERNAME=$(echo "$BOT_INFO" | jq -r '.result.username')
    BOT_NAME=$(echo "$BOT_INFO" | jq -r '.result.first_name')
    print_status "Bot connection successful!"
    print_bot "Bot Name: $BOT_NAME"
    print_bot "Bot Username: @$BOT_USERNAME"
else
    print_error "Bot connection failed!"
    print_error "Please check your bot token"
    exit 1
fi

# Set webhook
print_status "Setting up webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$WEBHOOK_URL\"}")

if echo "$WEBHOOK_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    print_status "Webhook set successfully!"
    print_bot "Webhook URL: $WEBHOOK_URL"
else
    print_error "Failed to set webhook!"
    echo "$WEBHOOK_RESPONSE"
    exit 1
fi

# Verify webhook
print_status "Verifying webhook..."
WEBHOOK_INFO=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo")

if echo "$WEBHOOK_INFO" | jq -e '.result.url' > /dev/null 2>&1; then
    CURRENT_WEBHOOK=$(echo "$WEBHOOK_INFO" | jq -r '.result.url')
    if [ "$CURRENT_WEBHOOK" = "$WEBHOOK_URL" ]; then
        print_status "Webhook verification successful!"
    else
        print_warning "Webhook URL mismatch!"
        print_warning "Expected: $WEBHOOK_URL"
        print_warning "Actual: $CURRENT_WEBHOOK"
    fi
else
    print_error "Failed to get webhook info!"
fi

# Set bot commands
print_status "Setting bot commands..."
COMMANDS='[
    {"command": "start", "description": "🎮 Start playing the game"},
    {"command": "help", "description": "❓ Show help and commands"},
    {"command": "stats", "description": "📊 View your game statistics"},
    {"command": "leaderboard", "description": "🏆 Show global leaderboard"},
    {"command": "faction", "description": "🇮🇷🇺🇸 View faction statistics"},
    {"command": "referral", "description": "🎁 Get your referral code"},
    {"command": "balance", "description": "💰 Check your STG balance"},
    {"command": "battles", "description": "⚔️ View recent battles"},
    {"command": "territories", "description": "🗺️ Show territory control map"},
    {"command": "missions", "description": "🎯 View daily missions"}
]'

COMMANDS_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyCommands" \
    -H "Content-Type: application/json" \
    -d "{\"commands\": $COMMANDS}")

if echo "$COMMANDS_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    print_status "Bot commands set successfully!"
else
    print_warning "Failed to set bot commands (this is optional)"
fi

# Set bot description
print_status "Setting bot description..."
DESCRIPTION="🎮 Team Iran vs Team USA - Ultimate Telegram Battle Game!

Choose your faction and compete in epic battles!
• 🎯 Tap-to-earn mechanics
• ⚔️ PvP battles with STG wagering
• 🗺️ Territory control system
• 🎁 Referral rewards
• 💎 WIN token rewards

Start with /start and join the battle!"

DESC_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyDescription" \
    -H "Content-Type: application/json" \
    -d "{\"description\": \"$DESCRIPTION\"}")

if echo "$DESC_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    print_status "Bot description set successfully!"
else
    print_warning "Failed to set bot description (this is optional)"
fi

# Set bot short description
print_status "Setting bot short description..."
SHORT_DESC="🎮 Iran vs USA Battle Game - Choose your faction and compete!"

SHORT_DESC_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyShortDescription" \
    -H "Content-Type: application/json" \
    -d "{\"short_description\": \"$SHORT_DESC\"}")

if echo "$SHORT_DESC_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    print_status "Bot short description set successfully!"
else
    print_warning "Failed to set bot short description (this is optional)"
fi

# Test webhook endpoint
print_status "Testing webhook endpoint..."
if command -v curl > /dev/null 2>&1; then
    # This is a basic test - in production, the webhook should be accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "405" ]; then
        print_status "Webhook endpoint is accessible (HTTP $HTTP_STATUS)"
    else
        print_warning "Webhook endpoint may not be accessible (HTTP $HTTP_STATUS)"
        print_warning "Make sure your server is running and the domain is pointing correctly"
    fi
else
    print_warning "curl not available for webhook testing"
fi

# Create bot info file
print_status "Creating bot configuration file..."
cat > telegram-bot-config.json << EOF
{
    "bot_token": "$BOT_TOKEN",
    "webhook_url": "$WEBHOOK_URL",
    "domain": "$DOMAIN",
    "bot_username": "$BOT_USERNAME",
    "bot_name": "$BOT_NAME",
    "setup_date": "$(date -Iseconds)",
    "commands": [
        "start", "help", "stats", "leaderboard", "faction", 
        "referral", "balance", "battles", "territories", "missions"
    ]
}
EOF

print_status "Bot configuration saved to telegram-bot-config.json"

echo ""
echo "🎉 Telegram Bot setup completed successfully!"
echo ""
echo "🤖 Bot Information:"
echo "  Name: $BOT_NAME"
echo "  Username: @$BOT_USERNAME"
echo "  Webhook: $WEBHOOK_URL"
echo ""
echo "📱 Available Commands:"
echo "  /start - Start playing"
echo "  /help - Show help"
echo "  /stats - View statistics"
echo "  /leaderboard - Show leaderboard"
echo "  /faction - View faction stats"
echo "  /referral - Get referral code"
echo "  /balance - Check balance"
echo "  /battles - View battles"
echo "  /territories - View territories"
echo "  /missions - View missions"
echo ""
echo "🔗 Next Steps:"
echo "  1. Make sure your server is running"
echo "  2. Ensure the domain is pointing to your server"
echo "  3. Configure SSL certificate"
echo "  4. Test the bot by sending /start on Telegram"
echo ""
echo "✅ Bot is ready for production!"
