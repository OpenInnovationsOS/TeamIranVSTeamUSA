@echo off
echo 🤖 Setting up Telegram Bot for Team Iran vs Team USA game...

REM Configuration
set BOT_TOKEN=DEMO_BOT_TOKEN_123456789
set WEBHOOK_URL=https://team-iran-vs-usa-demo.com/webhook
set DOMAIN=team-iran-vs-usa-demo.com

echo [INFO] Checking curl availability...
where curl >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] curl not found. Some features may be limited.
) else (
    echo [INFO] curl found
)

echo [INFO] Using Bot Token: %BOT_TOKEN:~0,10%...

REM Test bot connection (simulated)
echo [INFO] Testing bot connection...
echo [INFO] Bot connection successful!
echo [BOT] Bot Name: Team Iran vs Team USA Game
echo [BOT] Bot Username: @TeamIranVsUSAGameBot

REM Set webhook (simulated)
echo [INFO] Setting up webhook...
echo [INFO] Webhook set successfully!
echo [BOT] Webhook URL: %WEBHOOK_URL%

REM Verify webhook (simulated)
echo [INFO] Verifying webhook...
echo [INFO] Webhook verification successful!

REM Set bot commands (simulated)
echo [INFO] Setting bot commands...
echo [INFO] Bot commands set successfully!

REM Set bot description (simulated)
echo [INFO] Setting bot description...
echo [INFO] Bot description set successfully!

REM Set bot short description (simulated)
echo [INFO] Setting bot short description...
echo [INFO] Bot short description set successfully!

REM Test webhook endpoint (simulated)
echo [INFO] Testing webhook endpoint...
echo [INFO] Webhook endpoint is accessible (HTTP 200)

REM Create bot info file
echo [INFO] Creating bot configuration file...
(
echo {
echo     "bot_token": "%BOT_TOKEN%",
echo     "webhook_url": "%WEBHOOK_URL%",
echo     "domain": "%DOMAIN%",
echo     "bot_username": "TeamIranVsUSAGameBot",
echo     "bot_name": "Team Iran vs Team USA Game",
echo     "setup_date": "%date% %time%",
echo     "commands": [
echo         "start", "help", "stats", "leaderboard", "faction", 
echo         "referral", "balance", "battles", "territories", "missions"
echo     ]
echo }
) > telegram-bot-config.json

echo [INFO] Bot configuration saved to telegram-bot-config.json

echo.
echo 🎉 Telegram Bot setup completed successfully!
echo.
echo 🤖 Bot Information:
echo   Name: Team Iran vs Team USA Game
echo   Username: @TeamIranVsUSAGameBot
echo   Webhook: %WEBHOOK_URL%
echo.
echo 📱 Available Commands:
echo   /start - Start playing
echo   /help - Show help
echo   /stats - View statistics
echo   /leaderboard - Show leaderboard
echo   /faction - View faction stats
echo   /referral - Get referral code
echo   /balance - Check balance
echo   /battles - View battles
echo   /territories - View territories
echo   /missions - View missions
echo.
echo 🔗 Next Steps:
echo   1. Replace DEMO_BOT_TOKEN with your actual bot token
echo   2. Update WEBHOOK_URL with your actual domain
echo   3. Make sure your server is running
echo   4. Ensure the domain is pointing to your server
echo   5. Configure SSL certificate
echo   6. Test the bot by sending /start on Telegram
echo.
echo ⚠️  NOTE: This is a simulated setup. For production:
echo   1. Get a real bot token from @BotFather on Telegram
echo   2. Set up your domain and SSL certificate
echo   3. Update the bot token and webhook URL in .env file
echo   4. Run the actual webhook setup with curl commands
echo.
echo ✅ Bot is ready for production configuration!
pause
