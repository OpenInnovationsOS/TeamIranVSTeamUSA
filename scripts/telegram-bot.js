#!/usr/bin/env node

// Telegram Bot API Integration
// Complete Telegram bot functionality with webhooks, commands, and mini-app integration

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration
const BOT_CONFIG = {
  token: process.env.TELEGRAM_BOT_TOKEN,
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  port: process.env.TELEGRAM_PORT || 8443,
  host: process.env.TELEGRAM_HOST || '0.0.0.0',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  miniAppUrl: process.env.MINI_APP_URL || 'https://team-iran-vs-usa.com',
  adminUsers: (process.env.ADMIN_USERS || '').split(',').filter(Boolean)
};

// Telegram Bot Class
class TelegramBotService {
  constructor() {
    this.bot = null;
    this.app = null;
    this.userSessions = new Map();
    this.gameData = new Map();
    this.isWebhookSet = false;
  }

  // Initialize bot
  async initialize() {
    try {
      console.log('🤖 Initializing Telegram Bot...');
      
      // Create bot instance
      this.bot = new TelegramBot(BOT_CONFIG.token, {
        polling: false, // Use webhooks instead of polling
        webHook: {
          port: BOT_CONFIG.port,
          host: BOT_CONFIG.host
        }
      });

      // Create Express app for webhooks
      this.app = express();
      
      // Setup webhook middleware
      this.setupWebhookMiddleware();
      
      // Setup bot commands
      this.setupCommands();
      
      // Setup message handlers
      this.setupMessageHandlers();
      
      // Setup callback query handlers
      this.setupCallbackHandlers();
      
      // Setup inline query handlers
      this.setupInlineHandlers();
      
      // Start Express server
      await this.startWebhookServer();
      
      // Set webhook
      await this.setWebhook();
      
      console.log('✅ Telegram Bot initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Telegram Bot:', error);
      throw error;
    }
  }

  // Setup webhook middleware
  setupWebhookMiddleware() {
    // Body parser middleware
    this.app.use(express.json({ limit: '10mb' }));
    
    // Webhook verification middleware
    this.app.use('/webhook', (req, res, next) => {
      if (BOT_CONFIG.webhookSecret) {
        const signature = req.headers['x-telegram-bot-api-secret-token'];
        const expectedSignature = crypto
          .createHmac('sha256', BOT_CONFIG.webhookSecret)
          .update(JSON.stringify(req.body))
          .digest('hex');
        
        if (signature !== expectedSignature) {
          console.warn('⚠️ Invalid webhook signature');
          return res.status(403).json({ error: 'Invalid signature' });
        }
      }
      next();
    });
    
    // Webhook endpoint
    this.app.post('/webhook', (req, res) => {
      try {
        this.bot.processUpdate(req.body);
        res.status(200).json({ status: 'ok' });
      } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        webhookSet: this.isWebhookSet,
        userSessions: this.userSessions.size
      });
    });
  }

  // Setup bot commands
  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      // Store user session
      this.userSessions.set(userId, {
        chatId,
        userId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        joinedAt: new Date().toISOString()
      });
      
      // Create welcome message
      const welcomeMessage = `
🎮 Welcome to Team Iran vs USA!

Choose your faction and join the ultimate battle:

🇮🇷 **Iran** - Join the Persian Empire
🇺🇸 **USA** - Join the American Forces

Click the button below to start playing!
      `;
      
      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🎮 Play Game',
              web_app: {
                url: `${BOT_CONFIG.miniAppUrl}?userId=${userId}&username=${msg.from.username || ''}`
              }
            }
          ],
          [
            { text: '📊 Leaderboard', callback_data: 'leaderboard' },
            { text: '🏆 Tournaments', callback_data: 'tournaments' }
          ],
          [
            { text: '❓ Help', callback_data: 'help' },
            { text: '⚙️ Settings', callback_data: 'settings' }
          ]
        ]
      };
      
      await this.bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: keyboard,
        parse_mode: 'Markdown'
      });
    });

    // Help command
    this.bot.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `
🎮 **Team Iran vs USA - Help**

**Commands:**
/start - Start playing the game
/help - Show this help message
/leaderboard - View global leaderboard
/profile - View your profile
/stats - View game statistics
/invite - Invite friends to play

**How to Play:**
1. Choose your faction (Iran 🇮🇷 or USA 🇺🇸)
2. Battle against opponents
3. Conquer territories
4. Earn rewards and climb the leaderboard
5. Join tournaments for big prizes

**Features:**
⚔️ Real-time battles
🗺️ Territory conquest
🏆 Tournaments
💰 Rewards system
📊 Leaderboards
👥 Guilds

Need more help? Join our community: @TeamIranVsUSA
      `;
      
      await this.bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'Markdown'
      });
    });

    // Profile command
    this.bot.onText(/\/profile/, async (msg) => {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      
      try {
        // Fetch user profile from API
        const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/profile`, {
          headers: {
            'x-user-id': userId,
            'Authorization': `Bearer ${this.generateUserToken(userId)}`
          }
        });
        
        if (response.ok) {
          const { profile } = await response.json();
          
          const profileMessage = `
👤 **${profile.display_name || profile.username}**

🏆 **Level:** ${profile.level}
⭐ **Experience:** ${profile.experience}
💰 **STG Balance:** ${profile.stg_balance}
🎯 **Faction:** ${profile.faction === 'iran' ? '🇮🇷 Iran' : '🇺🇸 USA'}
⚔️ **Favorite Weapon:** ${profile.favorite_weapon}
🗺️ **Preferred Territory:** ${profile.preferred_territory}

📊 **Statistics:**
🏅 Wins: ${profile.stats?.wins || 0}
💔 Losses: ${profile.stats?.losses || 0}
⚔️ Battles: ${profile.stats?.battles_fought || 0}
🏆 Critical Hits: ${profile.stats?.critical_hits || 0}
          `;
          
          await this.bot.sendMessage(chatId, profileMessage, {
            parse_mode: 'Markdown'
          });
        } else {
          await this.bot.sendMessage(chatId, '❌ Failed to fetch profile. Please try again.');
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
      }
    });

    // Leaderboard command
    this.bot.onText(/\/leaderboard/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/leaderboard`);
        
        if (response.ok) {
          const { leaderboard } = await response.json();
          
          let leaderboardMessage = '🏆 **Global Leaderboard**\n\n';
          
          leaderboard.slice(0, 10).forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            const faction = player.faction === 'iran' ? '🇮🇷' : '🇺🇸';
            leaderboardMessage += `${medal} ${faction} ${player.display_name || player.username} - Level ${player.level}\n`;
          });
          
          await this.bot.sendMessage(chatId, leaderboardMessage, {
            parse_mode: 'Markdown'
          });
        } else {
          await this.bot.sendMessage(chatId, '❌ Failed to fetch leaderboard. Please try again.');
        }
      } catch (error) {
        console.error('Leaderboard fetch error:', error);
        await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
      }
    });

    // Invite command
    this.bot.onText(/\/invite/, async (msg) => {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      
      const inviteLink = `https://t.me/${(await this.bot.getMe()).username}?start=ref_${userId}`;
      
      const inviteMessage = `
👥 **Invite Friends**

Share this link with your friends to invite them to play:

${inviteLink}

🎁 **Rewards:**
• 100 STG for each friend who joins
• 50 STG for each friend who reaches Level 5
• Special bonuses for top referrers

📊 Your referral stats: /referrals
      `;
      
      await this.bot.sendMessage(chatId, inviteMessage, {
        parse_mode: 'Markdown'
      });
    });
  }

  // Setup message handlers
  setupMessageHandlers() {
    // Handle text messages
    this.bot.on('message', async (msg) => {
      const userId = msg.from.id;
      const chatId = msg.chat.id;
      
      // Ignore commands (handled separately)
      if (msg.text && msg.text.startsWith('/')) {
        return;
      }
      
      // Handle game-related messages
      if (msg.text) {
        await this.handleGameMessage(msg);
      }
    });

    // Handle photo messages
    this.bot.on('photo', async (msg) => {
      const chatId = msg.chat.id;
      
      // Process photo if needed
      await this.bot.sendMessage(chatId, '📸 Nice photo! Keep playing the game! 🎮');
    });

    // Handle location messages
    this.bot.on('location', async (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      // Store user location for territory-based features
      const session = this.userSessions.get(userId);
      if (session) {
        session.location = msg.location;
        this.userSessions.set(userId, session);
      }
      
      await this.bot.sendMessage(chatId, '📍 Location received! This might help you conquer nearby territories! 🗺️');
    });
  }

  // Setup callback query handlers
  setupCallbackHandlers() {
    this.bot.on('callback_query', async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const userId = callbackQuery.from.id;
      const data = callbackQuery.data;
      
      // Answer callback query
      await this.bot.answerCallbackQuery(callbackQuery.id);
      
      // Handle different callback actions
      switch (data) {
        case 'leaderboard':
          await this.showLeaderboard(chatId);
          break;
          
        case 'tournaments':
          await this.showTournaments(chatId);
          break;
          
        case 'help':
          await this.showHelp(chatId);
          break;
          
        case 'settings':
          await this.showSettings(chatId, userId);
          break;
          
        case 'battle_history':
          await this.showBattleHistory(chatId, userId);
          break;
          
        case 'inventory':
          await this.showInventory(chatId, userId);
          break;
          
        default:
          if (data.startsWith('faction_')) {
            const faction = data.split('_')[1];
            await this.handleFactionSelection(chatId, userId, faction);
          } else if (data.startsWith('tournament_')) {
            const tournamentId = data.split('_')[1];
            await this.handleTournamentAction(chatId, userId, tournamentId);
          }
          break;
      }
    });
  }

  // Setup inline query handlers
  setupInlineHandlers() {
    this.bot.on('inline_query', async (query) => {
      const userId = query.from.id;
      const queryText = query.query.toLowerCase();
      
      let results = [];
      
      // Search users for battle
      if (queryText.length > 0) {
        try {
          const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/users/search?q=${encodeURIComponent(queryText)}`);
          
          if (response.ok) {
            const { users } = await response.json();
            
            results = users.map(user => ({
              type: 'article',
              id: user.id,
              title: `${user.display_name || user.username}`,
              description: `Level ${user.level} • ${user.faction === 'iran' ? '🇮🇷 Iran' : '🇺🇸 USA'}`,
              input_message_content: {
                message_text: `Challenge ${user.display_name || user.username} to a battle!`,
                reply_markup: {
                  inline_keyboard: [
                    [{
                      text: '⚔️ Challenge',
                      web_app: {
                        url: `${BOT_CONFIG.miniAppUrl}?battle=${user.id}&userId=${userId}`
                      }
                    }]
                  ]
                }
              },
              thumb_url: user.avatar_url,
              thumb_width: 64,
              thumb_height: 64
            }));
          }
        } catch (error) {
          console.error('Inline search error:', error);
        }
      }
      
      // Default results
      if (results.length === 0) {
        results = [{
          type: 'article',
          id: 'play_game',
          title: '🎮 Play Team Iran vs USA',
          description: 'Join the ultimate battle between Iran and USA!',
          input_message_content: {
            message_text: '🎮 Play Team Iran vs USA',
            reply_markup: {
              inline_keyboard: [
                [{
                  text: '🎮 Play Now',
                  web_app: {
                    url: `${BOT_CONFIG.miniAppUrl}?userId=${userId}`
                  }
                }]
              ]
            }
          }
        }];
      }
      
      await this.bot.answerInlineQuery(query.id, results);
    });
  }

  // Handle game messages
  async handleGameMessage(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text.toLowerCase();
    
    // Simple game commands
    if (text.includes('battle') || text.includes('fight')) {
      await this.bot.sendMessage(chatId, '⚔️ Ready to battle? Open the game to challenge opponents! 🎮');
    } else if (text.includes('territory') || text.includes('conquer')) {
      await this.bot.sendMessage(chatId, '🗺️ Want to conquer territories? Open the game to see the map! 🎮');
    } else if (text.includes('tournament') || text.includes('compete')) {
      await this.showTournaments(chatId);
    } else if (text.includes('stake') || text.includes('earn')) {
      await this.bot.sendMessage(chatId, '💰 Want to earn STG? Open the game to see staking options! 🎮');
    }
  }

  // Show leaderboard
  async showLeaderboard(chatId) {
    try {
      const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/leaderboard`);
      
      if (response.ok) {
        const { leaderboard } = await response.json();
        
        let leaderboardMessage = '🏆 **Global Leaderboard**\n\n';
        
        leaderboard.slice(0, 10).forEach((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          const faction = player.faction === 'iran' ? '🇮🇷' : '🇺🇸';
          leaderboardMessage += `${medal} ${faction} ${player.display_name || player.username} - Level ${player.level}\n`;
        });
        
        await this.bot.sendMessage(chatId, leaderboardMessage, {
          parse_mode: 'Markdown'
        });
      } else {
        await this.bot.sendMessage(chatId, '❌ Failed to fetch leaderboard. Please try again.');
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
  }

  // Show tournaments
  async showTournaments(chatId) {
    try {
      const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/tournaments`);
      
      if (response.ok) {
        const { tournaments } = await response.json();
        
        let tournamentMessage = '🏆 **Active Tournaments**\n\n';
        
        tournaments.forEach((tournament, index) => {
          const status = tournament.status === 'registration' ? '📝 Registration' : 
                        tournament.status === 'active' ? '⚔️ Active' : '🏁 Completed';
          const entryFee = tournament.entry_fee > 0 ? `Entry: ${tournament.entry_fee} STG` : 'Free';
          
          tournamentMessage += `${index + 1}. ${tournament.name}\n`;
          tournamentMessage += `   ${status} • ${entryFee}\n`;
          tournamentMessage += `   Prize Pool: ${tournament.prize_pool} STG\n\n`;
        });
        
        const keyboard = {
          inline_keyboard: tournaments.map(tournament => [{
            text: `🎮 Join ${tournament.name}`,
            callback_data: `tournament_${tournament.id}`
          }])
        };
        
        await this.bot.sendMessage(chatId, tournamentMessage, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
      } else {
        await this.bot.sendMessage(chatId, '❌ Failed to fetch tournaments. Please try again.');
      }
    } catch (error) {
      console.error('Tournaments fetch error:', error);
      await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
  }

  // Show help
  async showHelp(chatId) {
    const helpMessage = `
🎮 **Team Iran vs USA - Help**

**Quick Actions:**
🎮 Play Game - Click the button below
📊 View Leaderboard - /leaderboard
👤 View Profile - /profile
🏆 Tournaments - /tournaments
👥 Invite Friends - /invite

**Need Help?**
• Join our community: @TeamIranVsUSA
• Support: @TeamIranVsUSASupport
• Website: ${BOT_CONFIG.miniAppUrl}

**Mini-App Features:**
⚔️ Real-time battles
🗺️ Territory conquest
💰 Economy system
🏆 Tournaments
👥 Guilds
📊 Statistics
    `;
    
    const keyboard = {
      inline_keyboard: [
        [{
          text: '🎮 Play Game',
          web_app: {
            url: BOT_CONFIG.miniAppUrl
          }
        }]
      ]
    };
    
    await this.bot.sendMessage(chatId, helpMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Show settings
  async showSettings(chatId, userId) {
    const session = this.userSessions.get(userId);
    
    const settingsMessage = `
⚙️ **Settings**

🔔 **Notifications:** ${session?.notifications ? 'ON' : 'OFF'}
🌐 **Language:** ${session?.language || 'English'}
🎮 **Auto-battle:** ${session?.autoBattle ? 'ON' : 'OFF'}

Choose an option to change settings:
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔔 Toggle Notifications', callback_data: 'toggle_notifications' },
          { text: '🌐 Change Language', callback_data: 'change_language' }
        ],
        [
          { text: '🎮 Auto-battle Settings', callback_data: 'auto_battle_settings' },
          { text: '🔙 Back', callback_data: 'help' }
        ]
      ]
    };
    
    await this.bot.sendMessage(chatId, settingsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  // Handle faction selection
  async handleFactionSelection(chatId, userId, faction) {
    try {
      const response = await fetch(`${BOT_CONFIG.apiBaseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'Authorization': `Bearer ${this.generateUserToken(userId)}`
        },
        body: JSON.stringify({ faction })
      });
      
      if (response.ok) {
        const factionEmoji = faction === 'iran' ? '🇮🇷' : '🇺🇸';
        await this.bot.sendMessage(chatId, `${factionEmoji} You have joined the ${faction.toUpperCase()} faction!`);
        
        // Update user session
        const session = this.userSessions.get(userId);
        if (session) {
          session.faction = faction;
          this.userSessions.set(userId, session);
        }
      } else {
        await this.bot.sendMessage(chatId, '❌ Failed to select faction. Please try again.');
      }
    } catch (error) {
      console.error('Faction selection error:', error);
      await this.bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
    }
  }

  // Generate user token
  generateUserToken(userId) {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${BOT_CONFIG.token}`)
      .digest('hex');
  }

  // Start webhook server
  async startWebhookServer() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(BOT_CONFIG.port, BOT_CONFIG.host, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🌐 Webhook server listening on ${BOT_CONFIG.host}:${BOT_CONFIG.port}`);
          resolve();
        }
      });
    });
  }

  // Set webhook
  async setWebhook() {
    try {
      const webhookInfo = await this.bot.getWebHookInfo();
      
      if (webhookInfo.url !== BOT_CONFIG.webhookUrl) {
        await this.bot.setWebHook(BOT_CONFIG.webhookUrl, {
          secret_token: BOT_CONFIG.webhookSecret
        });
        console.log('✅ Webhook set successfully');
      } else {
        console.log('✅ Webhook already configured');
      }
      
      this.isWebhookSet = true;
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
      throw error;
    }
  }

  // Send notification to user
  async sendNotification(userId, message, options = {}) {
    try {
      const session = this.userSessions.get(userId);
      if (session && session.chatId) {
        await this.bot.sendMessage(session.chatId, message, options);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Broadcast message to all users
  async broadcast(message, options = {}) {
    const promises = [];
    
    for (const [userId, session] of this.userSessions) {
      promises.push(
        this.bot.sendMessage(session.chatId, message, options).catch(error => {
          console.error(`Failed to send broadcast to ${userId}:`, error);
        })
      );
    }
    
    await Promise.all(promises);
  }

  // Get bot info
  async getBotInfo() {
    try {
      const botInfo = await this.bot.getMe();
      return {
        id: botInfo.id,
        username: botInfo.username,
        firstName: botInfo.first_name,
        canJoinGroups: botInfo.can_join_groups,
        canReadAllGroupMessages: botInfo.can_read_all_group_messages,
        supportsInlineQueries: botInfo.supports_inline_queries
      };
    } catch (error) {
      console.error('Failed to get bot info:', error);
      return null;
    }
  }

  // Stop bot
  async stop() {
    if (this.server) {
      this.server.close();
    }
    
    if (this.bot) {
      await this.bot.closeWebHook();
    }
    
    console.log('🛑 Telegram Bot stopped');
  }
}

// Main execution
async function main() {
  const [command] = process.argv.slice(2);
  
  const bot = new TelegramBotService();
  
  try {
    switch (command) {
      case 'start':
        await bot.initialize();
        break;
        
      case 'info':
        const info = await bot.getBotInfo();
        console.log('🤖 Bot Info:', info);
        break;
        
      case 'webhook':
        await bot.setWebhook();
        break;
        
      case 'stop':
        await bot.stop();
        break;
        
      default:
        console.log(`
🤖 Telegram Bot CLI

Usage: node telegram-bot.js <command>

Commands:
  start    Start the bot with webhooks
  info     Get bot information
  webhook  Set webhook
  stop     Stop the bot

Environment Variables:
  TELEGRAM_BOT_TOKEN        Bot token (required)
  TELEGRAM_WEBHOOK_URL       Webhook URL
  TELEGRAM_WEBHOOK_SECRET    Webhook secret
  TELEGRAM_PORT             Webhook port (default: 8443)
  TELEGRAM_HOST             Webhook host (default: 0.0.0.0)
  API_BASE_URL              API base URL
  MINI_APP_URL             Mini-app URL
  ADMIN_USERS               Admin user IDs (comma-separated)

Examples:
  node telegram-bot.js start
  node telegram-bot.js info
  node telegram-bot.js webhook
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Telegram Bot error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TelegramBotService;
