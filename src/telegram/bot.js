const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const { checkTapLimit } = require('../utils/redis');
const jwt = require('jsonwebtoken');

class TelegramGameBot {
  constructor() {
    this.bot = null;
    this.webAppUrl = process.env.TELEGRAM_WEBAPP_URL || 'https://your-domain.com';
  }

  start() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      webHook: process.env.NODE_ENV === 'production'
    });

    if (process.env.NODE_ENV === 'production') {
      this.bot.setWebHook(`${process.env.TELEGRAM_WEBHOOK_URL}/webhook`);
    } else {
      this.bot.startPolling();
    }

    this.setupHandlers();
    console.log('Telegram bot started successfully');
  }

  setupHandlers() {
    // Handle /start command
    this.bot.onText(/\/start(.*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const referralCode = match[1] ? match[1].trim().replace(' ', '') : null;

      try {
        let user = await User.findByTelegramId(msg.from.id);

        if (!user) {
          // Create new user
          const telegramUser = {
            id: msg.from.id,
            username: msg.from.username,
            first_name: msg.from.first_name,
            last_name: msg.from.last_name,
            faction: null // Will be set in the web app
          };

          user = await User.create(telegramUser);

          // Handle referral
          if (referralCode) {
            const referrer = await User.findByReferralCode(referralCode);
            if (referrer) {
              await User.updateBalance(referrer.id, parseInt(process.env.REFERRAL_BONUS) || 50, 'stg');
              
              // Notify referrer
              await this.bot.sendMessage(
                referrer.telegram_id,
                `🎉 Someone joined using your referral code! You earned ${process.env.REFERRAL_BONUS || 50} STG!`
              );
            }
          }

          await this.sendWelcomeMessage(chatId, user);
        } else {
          await this.sendWelcomeBackMessage(chatId, user);
        }
      } catch (error) {
        console.error('Error handling /start:', error);
        await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
      }
    });

    // Handle /help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
🎮 *Team Iran vs Team USA - Game Help*

📱 *How to Play:*
1. Click the "🎮 Play Game" button below
2. Choose your faction (Iran or USA)
3. Start tapping to earn STG tokens
4. Battle other players for rewards
5. Complete daily missions
6. Help your faction control territories

💰 *Currencies:*
• STG - In-game currency for battles and upgrades
• WIN - Cryptocurrency token (claimable with TON wallet)
• TON - Premium currency for special features

🎯 *Commands:*
/start - Start playing or check your status
/help - Show this help message
/stats - View your game statistics
/leaderboard - See top players
/faction - View faction statistics

🔗 *Play Now:* Click the button below to launch the game!
      `;

      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${msg.from.id}` } }
          ]]
        }
      });
    });

    // Handle /stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const user = await User.findByTelegramId(msg.from.id);
        if (!user) {
          await this.bot.sendMessage(chatId, '❌ Please start the game first using /start');
          return;
        }

        const stats = await User.getStats(user.id);
        const statsMessage = `
📊 *Your Statistics*

👤 *Profile:*
• Level: ${stats.level}
• Experience: ${stats.experience}
• Faction: ${stats.faction || 'Not chosen'}

💰 *Balances:*
• STG: ${stats.stg_balance.toLocaleString()}
• WIN Claimable: ${stats.win_claimable.toLocaleString()}

⚔️ *Battles:*
• Total Battles: ${stats.battles_total || 0}
• Battles Won: ${stats.battles_won || 0}
• Win Rate: ${stats.battles_total > 0 ? Math.round((stats.battles_won / stats.battles_total) * 100) : 0}%

🎯 *Missions:*
• Completed: ${stats.missions_completed || 0}
• Referrals: ${stats.referrals_count || 0}

🎮 *Keep playing to improve your stats!*
        `;

        await this.bot.sendMessage(chatId, statsMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${msg.from.id}` } }
            ]]
          }
        });
      } catch (error) {
        console.error('Error handling /stats:', error);
        await this.bot.sendMessage(chatId, '❌ Error loading statistics');
      }
    });

    // Handle /leaderboard command
    this.bot.onText(/\/leaderboard/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const globalLeaderboard = await User.getLeaderboard(10);
        const iranLeaderboard = await User.getLeaderboard(5, 'iran');
        const usaLeaderboard = await User.getLeaderboard(5, 'usa');

        let leaderboardMessage = '🏆 *Global Leaderboard (Top 10)*\n\n';
        
        globalLeaderboard.forEach((user, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          leaderboardMessage += `${medal} ${user.first_name || user.username} - ${user.stg_balance.toLocaleString()} STG\n`;
        });

        leaderboardMessage += '\n🇮🇷 *Team Iran Top 5*\n';
        iranLeaderboard.forEach((user, index) => {
          leaderboardMessage += `${index + 1}. ${user.first_name || user.username} - ${user.stg_balance.toLocaleString()} STG\n`;
        });

        leaderboardMessage += '\n🇺🇸 *Team USA Top 5*\n';
        usaLeaderboard.forEach((user, index) => {
          leaderboardMessage += `${index + 1}. ${user.first_name || user.username} - ${user.stg_balance.toLocaleString()} STG\n`;
        });

        await this.bot.sendMessage(chatId, leaderboardMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${msg.from.id}` } }
            ]]
          }
        });
      } catch (error) {
        console.error('Error handling /leaderboard:', error);
        await this.bot.sendMessage(chatId, '❌ Error loading leaderboard');
      }
    });

    // Handle callback queries (inline buttons)
    this.bot.on('callback_query', async (callbackQuery) => {
      const action = callbackQuery.data;
      const msg = callbackQuery.message;
      const chatId = msg.chat.id;

      try {
        switch (action) {
          case 'play_game':
            await this.bot.answerCallbackQuery(callbackQuery.id);
            await this.bot.sendMessage(chatId, '🎮 Launching game...', {
              reply_markup: {
                inline_keyboard: [[
                  { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${callbackQuery.from.id}` } }
                ]]
              }
            });
            break;
          
          default:
            await this.bot.answerCallbackQuery(callbackQuery.id);
            break;
        }
      } catch (error) {
        console.error('Error handling callback query:', error);
        await this.bot.answerCallbackQuery(callbackQuery.id, { text: '❌ An error occurred' });
      }
    });

    // Handle errors
    this.bot.on('polling_error', (error) => {
      console.error('Telegram bot polling error:', error);
    });
  }

  async sendWelcomeMessage(chatId, user) {
    const welcomeMessage = `
🎉 *Welcome to Team Iran vs Team USA!*

🎮 *Get Started:*
1. Click the "🎮 Play Game" button below
2. Choose your faction (Iran 🇮🇷 or USA 🇺🇸)
3. Start earning STG tokens immediately!

🎁 *Welcome Bonus:* 100 STG tokens have been added to your account!

💡 *Pro Tips:*
• Complete daily missions for extra rewards
• Battle other players to win their STG
• Invite friends for bonus STG
• Help your faction control territories

🚀 *Ready to play?* Click the button below!
    `;

    await this.bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${user.telegram_id}` } }
        ]]
      }
    });
  }

  async sendWelcomeBackMessage(chatId, user) {
    const welcomeBackMessage = `
👋 *Welcome back, ${user.first_name || 'Player'}!*

📊 *Your Status:*
• Level: ${user.level}
• STG Balance: ${user.stg_balance.toLocaleString()}
• Faction: ${user.faction || 'Not chosen yet'}

🎮 *Continue Playing:*
    `;

    await this.bot.sendMessage(chatId, welcomeBackMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '🎮 Play Game', web_app: { url: `${this.webAppUrl}?user=${user.telegram_id}` } }
        ]]
      }
    });
  }

  async notifyUser(telegramId, message, options = {}) {
    try {
      await this.bot.sendMessage(telegramId, message, {
        parse_mode: 'Markdown',
        ...options
      });
    } catch (error) {
      console.error('Error sending notification to user:', telegramId, error);
    }
  }

  async broadcastToFaction(faction, message) {
    try {
      const users = await User.getLeaderboard(1000, faction);
      for (const user of users) {
        await this.notifyUser(user.telegram_id, message);
      }
    } catch (error) {
      console.error('Error broadcasting to faction:', faction, error);
    }
  }

  processUpdate(update) {
    this.bot.processUpdate(update);
  }

  generateAuthToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        telegramId: user.telegram_id,
        faction: user.faction 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }
}

const bot = new TelegramGameBot();
module.exports = bot;
