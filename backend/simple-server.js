const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Backend is running!'
  });
});

// Test endpoint for debugging
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Weapons endpoint (basic)
app.get('/api/weapons', (req, res) => {
  res.json({
    success: true,
    message: 'Weapons API is working!',
    data: {
      weapons: [
        {
          weapon_id: 'ir_pistol_01',
          name: 'Zulfikar',
          category: 'pistol',
          faction: 'iran',
          rarity: 'common',
          base_stats: {
            damage: 25,
            accuracy: 85,
            fire_rate: 180,
            range: 50,
            reload_speed: 2.0,
            magazine_size: 12
          },
          visual_effects: {
            animation_type: 'slide_up',
            animation_duration: 0.5,
            color_scheme: 'bronze'
          }
        },
        {
          weapon_id: 'us_pistol_01',
          name: 'M1911',
          category: 'pistol',
          faction: 'usa',
          rarity: 'common',
          base_stats: {
            damage: 35,
            accuracy: 82,
            fire_rate: 150,
            range: 60,
            reload_speed: 2.5,
            magazine_size: 7
          },
          visual_effects: {
            animation_type: 'bounce',
            animation_duration: 0.4,
            color_scheme: 'silver'
          }
        }
      ]
    }
  });
});

// Root route - serve documentation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Team Iran vs USA - Backend API</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #1a1a1a; color: #fff; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .api-list { background: #2d2d2d; padding: 20px; border-radius: 8px; }
            .endpoint { margin: 10px 0; padding: 15px; background: #3a3a3a; border-radius: 5px; }
            .endpoint h3 { color: #4CAF50; margin: 0 0 10px 0; }
            .method { color: #FF9800; font-weight: bold; }
            .url { color: #2196F3; font-family: monospace; }
            a { color: #4CAF50; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Team Iran vs USA - Backend API</h1>
                <p>Server is running successfully on port ${PORT}</p>
                <p>📅 Started: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="api-list">
                <h2>🔫 Available API Endpoints</h2>
                
                <div class="endpoint">
                    <h3>📊 Health Check</h3>
                    <p><span class="method">GET</span> <a href="/health" class="url">/health</a></p>
                    <p>Server health and status information</p>
                </div>
                
                <div class="endpoint">
                    <h3>🧪 Test Endpoint</h3>
                    <p><span class="method">GET</span> <a href="/api/test" class="url">/api/test</a></p>
                    <p>Basic API functionality test</p>
                </div>
                
                <div class="endpoint">
                    <h3>🔫 Weapons API</h3>
                    <p><span class="method">GET</span> <a href="/api/weapons" class="url">/api/weapons</a></p>
                    <p>Get all available weapons with animations and boost packs</p>
                </div>
                
                <div class="endpoint">
                    <h3>👥 Users API</h3>
                    <p><span class="method">GET/POST</span> <a href="/api/users" class="url">/api/users</a></p>
                    <p>User registration, authentication, and profile management</p>
                </div>
                
                <div class="endpoint">
                    <h3>⚔️ Battles API</h3>
                    <p><span class="method">GET/POST</span> <a href="/api/battles" class="url">/api/battles</a></p>
                    <p>Battle creation, joining, and management</p>
                </div>
                
                <div class="endpoint">
                    <h3>💰 Monetization API</h3>
                    <p><span class="method">GET/POST</span> <a href="/api/monetization" class="url">/api/monetization</a></p>
                    <p>Token packs, premium features, and payment processing</p>
                </div>
                
                <div class="endpoint">
                    <h3>🎛️ Admin API</h3>
                    <p><span class="method">GET/POST/PUT/DELETE</span> <a href="/api/admin" class="url">/api/admin</a></p>
                    <p>Admin dashboard and management functions</p>
                </div>
            </div>
            
            <div class="api-list">
                <h2>📚 Documentation</h2>
                <div class="endpoint">
                    <h3>🔫 Weapon System</h3>
                    <p>Complete weapon system documentation with animations and boost packs</p>
                    <p><a href="../docs/WEAPON-SYSTEM.md" class="url">📖 View Weapon System Docs</a></p>
                </div>
                
                <div class="endpoint">
                    <h3>🎮 Game Architecture</h3>
                    <p>Overall game architecture and system design</p>
                    <p><a href="../docs/GAME-ARCHITECTURE.md" class="url">📖 View Game Architecture</a></p>
                </div>
                
                <div class="endpoint">
                    <h3>🔒 Secrets Setup</h3>
                    <p>Environment variables and configuration setup guide</p>
                    <p><a href="../docs/SECRETS-SETUP-GUIDE.md" class="url">📖 View Setup Guide</a></p>
                </div>
            </div>
            
            <div class="api-list">
                <h2>🎯 Quick Start</h2>
                <div class="endpoint">
                    <h3>✅ Test Server</h3>
                    <p>Click here to test the API: <a href="/api/test" class="url">Test API</a></p>
                </div>
                <div class="endpoint">
                    <h3>🔫 View Weapons</h3>
                    <p>Click here to see all weapons: <a href="/api/weapons" class="url">View Weapons</a></p>
                </div>
                <div class="endpoint">
                    <h3>📊 Check Health</h3>
                    <p>Click here to check server health: <a href="/health" class="url">Health Check</a></p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Authentication endpoints
app.post('/register', (req, res) => {
  const { username, faction } = req.body;
  
  const newUser = {
    id: Math.floor(Math.random() * 1000000) + 1000,
    telegram_id: Math.floor(Math.random() * 1000000) + 100000,
    username: username || `Player${Math.floor(Math.random() * 10000)}`,
    first_name: 'Test',
    last_name: 'User',
    faction: faction || null,
    stg_balance: 1000,
    level: 1,
    experience: 0,
    referral_code: `PLAYER${Math.floor(Math.random() * 10000)}`,
    battles: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    created_at: new Date().toISOString(),
    wallet_address: null,
    win_claimable: 500
  };
  
  const token = 'token_' + Math.random().toString(36).substr(2, 16);
  
  res.json({
    success: true,
    data: {
      token: token,
      user: newUser
    }
  });
});

app.post('/auth/telegram', (req, res) => {
  const { telegram_id, username, first_name, last_name } = req.body;
  
  const user = {
    id: telegram_id,
    telegram_id: telegram_id,
    username: username || `Player${Math.floor(Math.random() * 10000)}`,
    first_name: first_name || 'Test',
    last_name: last_name || 'User',
    faction: null, // Will be set during faction selection
    stg_balance: 1000,
    level: 1,
    experience: 0,
    referral_code: `PLAYER${Math.floor(Math.random() * 10000)}`,
    battles: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    created_at: new Date().toISOString(),
    wallet_address: null,
    win_claimable: 500
  };
  
  const token = 'telegram_token_' + Math.random().toString(36).substr(2, 16);
  
  res.json({
    token: token,
    user: user
  });
});

app.get('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  // Mock token verification - in production, verify against database
  const mockUser = {
    id: 1,
    telegram_id: 123456,
    username: 'Player1',
    first_name: 'Test',
    last_name: 'User',
    faction: 'iran',
    stg_balance: 1000,
    level: 1,
    experience: 0,
    referral_code: 'PLAYER123',
    battles: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    created_at: new Date().toISOString(),
    wallet_address: null,
    win_claimable: 500
  };
  
  res.json({
    user: mockUser
  });
});

app.post('/auth/refresh', (req, res) => {
  const newToken = 'refreshed_token_' + Math.random().toString(36).substr(2, 16);
  
  res.json({
    token: newToken
  });
});

// Battle Arena API endpoints
app.get('/api/leaderboard', (req, res) => {
  const leaderboardData = {
    success: true,
    leaderboard: [
      { rank: 1, username: 'Champion1', level: 25, wins: 150, losses: 20, win_rate: 0.88, stg_balance: 50000, faction: 'usa' },
      { rank: 2, username: 'WarriorKing', level: 23, wins: 135, losses: 25, win_rate: 0.84, stg_balance: 45000, faction: 'iran' },
      { rank: 3, username: 'BattleMaster', level: 22, wins: 128, losses: 30, win_rate: 0.81, stg_balance: 40000, faction: 'usa' },
      { rank: 4, username: 'TopFighter', level: 20, wins: 115, losses: 35, win_rate: 0.77, stg_balance: 35000, faction: 'iran' },
      { rank: 5, username: 'ElitePlayer', level: 19, wins: 105, losses: 40, win_rate: 0.72, stg_balance: 30000, faction: 'usa' }
    ]
  };
  res.json(leaderboardData);
});

app.get('/api/stats', (req, res) => {
  const statsData = {
    success: true,
    stats: {
      total_players: 15420,
      active_battles: 342,
      total_battles: 125680,
      avg_battle_duration: 180,
      top_faction: 'usa',
      faction_distribution: {
        iran: 7200,
        usa: 8220
      }
    }
  };
  res.json(statsData);
});

app.post('/api/battle/matchmaking', (req, res) => {
  const { level, faction, preferences } = req.body;
  
  const mockOpponent = {
    id: Math.floor(Math.random() * 10000) + 1000,
    username: `Opponent${Math.floor(Math.random() * 1000)}`,
    level: level + Math.floor(Math.random() * 3) - 1, // Within 2 levels
    faction: Math.random() > 0.5 ? 'iran' : 'usa',
    wins: Math.floor(Math.random() * 100),
    losses: Math.floor(Math.random() * 50),
    stg_balance: Math.floor(Math.random() * 20000) + 5000
  };
  
  res.json({
    success: true,
    opponent: mockOpponent,
    battle_id: `battle_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  });
});

app.post('/api/battle/create', (req, res) => {
  const { player1, player2, settings } = req.body;
  
  const battleData = {
    success: true,
    battle: {
      id: `battle_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      player1: player1,
      player2: player2,
      status: 'active',
      current_turn: 1,
      start_time: new Date().toISOString(),
      settings: settings || { game_mode: 'classic', time_limit: 300, stake_amount: 100 }
    }
  };
  res.json(battleData);
});

app.get('/api/battle/history/:userId', (req, res) => {
  const { userId } = req.params;
  
  const battleHistory = [
    {
      id: 'battle_001',
      opponent: 'RivalPlayer',
      opponent_faction: 'usa',
      result: 'win',
      stg_won: 250,
      duration: 145,
      timestamp: '2024-01-20T10:30:00Z',
      weapon_used: 'sniper_rifle',
      territory: 'new_york'
    },
    {
      id: 'battle_002', 
      opponent: 'Fighter123',
      opponent_faction: 'iran',
      result: 'loss',
      stg_lost: 100,
      duration: 89,
      timestamp: '2024-01-20T09:15:00Z',
      weapon_used: 'battle_axe',
      territory: 'tehran'
    },
    {
      id: 'battle_003',
      opponent: 'MasterWarrior',
      opponent_faction: 'usa',
      result: 'win',
      stg_won: 320,
      duration: 201,
      timestamp: '2024-01-20T08:45:00Z',
      weapon_used: 'advanced_rifle',
      territory: 'los_angeles'
    }
  ];
  
  res.json({
    success: true,
    battles: battleHistory,
    total_battles: battleHistory.length,
    wins: battleHistory.filter(b => b.result === 'win').length,
    losses: battleHistory.filter(b => b.result === 'loss').length,
    win_rate: (battleHistory.filter(b => b.result === 'win').length / battleHistory.length * 100).toFixed(1)
  });
});

// Game State API endpoint
app.get('/api/config', (req, res) => {
  const configData = {
    success: true,
    config: {
      game_version: '1.0.0',
      maintenance_mode: false,
      features: {
        battles: true,
        staking: true,
        guilds: true,
        tournaments: true,
        marketplace: true,
        premium: true
      },
      limits: {
        max_battle_stake: 10000,
        max_daily_battles: 100,
        max_guild_members: 50,
        max_weapon_inventory: 100
      },
      rewards: {
        battle_win_base: 100,
        battle_loss_base: 30,
        referral_bonus: 50,
        daily_login_bonus: 10
      },
      network: {
        api_base_url: 'http://localhost:8080',
        websocket_url: 'ws://localhost:8080',
        timeout_ms: 10000
      }
    }
  };
  res.json(configData);
});

// Faction Selection API endpoint
app.post('/api/game/faction/select', (req, res) => {
  const { faction } = req.body;
  
  // Validate faction
  if (!faction || !['iran', 'usa'].includes(faction)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid faction selection',
      message: 'Faction must be either "iran" or "usa"'
    });
  }
  
  const factionSelectionResult = {
    success: true,
    message: `Successfully joined Team ${faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!`,
    user: {
      id: 1,
      telegram_id: 123456,
      username: 'Player1',
      first_name: 'Test',
      last_name: 'User',
      faction: faction,
      stg_balance: 1000,
      level: 1,
      experience: 0,
      referral_code: 'PLAYER123',
      battles: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      created_at: new Date().toISOString(),
      wallet_address: null
    },
    rewards: {
      welcome_bonus: 100,
      faction_bonus_stg: 500
    },
    faction_bonuses: {
      attack_bonus: faction === 'iran' ? 0.2 : 0.25,
      defense_bonus: faction === 'iran' ? 0.25 : 0.2,
      experience_bonus: faction === 'iran' ? 0.15 : 0.1
    }
  };
  
  res.json(factionSelectionResult);
});

// Game State API endpoint
app.get('/api/game/state', (req, res) => {
  const gameStateData = {
    success: true,
    state: {
      user_id: 1,
      faction: 'iran',
      level: 1,
      experience: 150,
      stg_balance: 15420.50,
      win_stg: 500,
      battles_today: 12,
      wins_today: 8,
      losses_today: 4,
      current_streak: 3,
      best_streak: 7,
      achievements_unlocked: 5,
      daily_missions_completed: 3,
      daily_missions_total: 5,
      last_battle: {
        id: 'battle_123',
        opponent: 'EnemyPlayer',
        result: 'win',
        stg_won: 250,
        duration: 145,
        timestamp: '2024-01-20T15:30:00Z'
      }
    }
  };
  res.json(gameStateData);
});

// Tap Config API endpoint
app.get('/api/tap/config', (req, res) => {
  const tapConfigData = {
    success: true,
    config: {
      enabled: true,
      base_earnings: 1,
      max_taps_per_second: 10,
      energy_system: {
        enabled: true,
        max_energy: 1000,
        energy_regen_rate: 1,
        energy_cost_per_tap: 1
      },
      multipliers: {
        level_multiplier: true,
        premium_multiplier: true,
        faction_bonus: true,
        guild_bonus: true
      },
      rewards: {
        base_stg_per_tap: 1,
        bonus_stg_per_tap: 0.5,
        max_bonus_stg_per_tap: 5
      }
    }
  };
  res.json(tapConfigData);
});

// Guilds API endpoint
app.get('/api/guilds', (req, res) => {
  const guildsData = {
    success: true,
    guilds: [
      {
        id: 'guild_001',
        name: 'Iran Elite Warriors',
        tag: 'IRN',
        description: 'Elite faction for dedicated Iran players',
        faction: 'iran',
        level: 25,
        members_count: 45,
        max_members: 50,
        territories_controlled: 12,
        total_stg_earned: 125000,
        created_at: '2024-01-01T00:00:00Z',
        is_recruiting: true,
        requirements: {
          min_level: 15,
          min_stg_balance: 5000,
          faction_requirement: 'iran'
        },
        perks: [
          '+20% battle rewards',
          '+15% staking APR',
          'Exclusive guild chat',
          'Guild-only tournaments'
        ]
      },
      {
        id: 'guild_002',
        name: 'USA Patriots',
        tag: 'USA',
        description: 'Proud defenders of Team USA',
        faction: 'usa',
        level: 23,
        members_count: 38,
        max_members: 50,
        territories_controlled: 8,
        total_stg_earned: 98000,
        created_at: '2024-01-02T00:00:00Z',
        is_recruiting: true,
        requirements: {
          min_level: 15,
          min_stg_balance: 5000,
          faction_requirement: 'usa'
        },
        perks: [
          '+25% battle rewards',
          '+18% staking APR',
          'Priority matchmaking',
          'Guild-only weapons'
        ]
      },
      {
        id: 'guild_003',
        name: 'Neutral Mercenaries',
        tag: 'NTR',
        description: 'Mixed faction guild for all players',
        faction: 'neutral',
        level: 20,
        members_count: 32,
        max_members: 40,
        territories_controlled: 5,
        total_stg_earned: 76000,
        created_at: '2024-01-03T00:00:00Z',
        is_recruiting: false,
        requirements: {
          min_level: 10,
          min_stg_balance: 2500,
          faction_requirement: null
        },
        perks: [
          '+10% battle rewards',
          '+12% staking APR',
          'Flexible membership',
          'Cross-faction battles'
        ]
      }
    ],
    user_guild: {
      id: 'guild_001',
      name: 'Iran Elite Warriors',
      tag: 'IRN',
      role: 'member',
      joined_at: '2024-01-15T00:00:00Z',
      contribution_points: 1250,
      rank: 'Veteran'
    },
    stats: {
      total_guilds: 3,
      active_guilds: 2,
      total_players_in_guilds: 115,
      average_guild_level: 22.7
    }
  };
  res.json(guildsData);
});

// Buy Packs API endpoints
app.get('/api/buy/packs', (req, res) => {
  const buyPacksData = {
    success: true,
    packs: [
      {
        id: 'stars_starter',
        name: 'Stars Starter Pack',
        description: 'Perfect for beginners',
        category: 'stars',
        price: 5,
        currency: 'stars',
        stg_tokens: 5000,
        bonus_percentage: 0,
        icon: '⭐',
        is_popular: false,
        is_limited: false,
        features: [
          '5,000 STG tokens',
          'Instant delivery',
          'Beginner friendly'
        ]
      },
      {
        id: 'stars_pro',
        name: 'Stars Pro Pack',
        description: 'Great value for regular players',
        category: 'stars',
        price: 100,
        currency: 'stars',
        stg_tokens: 12000,
        bonus_percentage: 20,
        icon: '⭐',
        is_popular: true,
        is_limited: false,
        features: [
          '12,000 STG tokens',
          '20% bonus included',
          'Best value'
        ]
      },
      {
        id: 'stars_expert',
        name: 'Stars Expert Pack',
        description: 'For serious players',
        category: 'stars',
        price: 200,
        currency: 'stars',
        stg_tokens: 30000,
        bonus_percentage: 25,
        icon: '⭐',
        is_popular: true,
        is_limited: false,
        features: [
          '30,000 STG tokens',
          '25% bonus included',
          'Expert choice'
        ]
      },
      {
        id: 'stars_master',
        name: 'Stars Master Pack',
        description: 'Ultimate gaming experience',
        category: 'stars',
        price: 400,
        currency: 'stars',
        stg_tokens: 75000,
        bonus_percentage: 35,
        icon: '⭐',
        is_popular: false,
        is_limited: true,
        limited_quantity: 100,
        remaining_quantity: 47,
        features: [
          '75,000 STG tokens',
          '35% bonus included',
          'Limited edition',
          'Exclusive badge'
        ]
      },
      {
        id: 'stars_vip',
        name: 'Stars VIP Pack',
        description: 'Elite player package',
        category: 'stars',
        price: 750,
        currency: 'stars',
        stg_tokens: 150000,
        bonus_percentage: 50,
        icon: '⭐',
        is_popular: false,
        is_limited: true,
        limited_quantity: 50,
        remaining_quantity: 23,
        features: [
          '150,000 STG tokens',
          '50% bonus included',
          'VIP exclusive',
          'Elite status'
        ]
      },
      {
        id: 'ton_bronze',
        name: 'TON Bronze Pack',
        description: 'Entry level TON purchase',
        category: 'ton',
        price: 5,
        currency: 'ton',
        stg_tokens: 5000,
        bonus_percentage: 0,
        icon: '🪙',
        is_popular: false,
        is_limited: false,
        features: [
          '5,000 STG tokens',
          'Blockchain secure',
          'Low entry barrier'
        ]
      },
      {
        id: 'ton_silver',
        name: 'TON Silver Pack',
        description: 'Popular choice for TON users',
        category: 'ton',
        price: 15,
        currency: 'ton',
        stg_tokens: 15000,
        bonus_percentage: 15,
        icon: '🪙',
        is_popular: true,
        is_limited: false,
        features: [
          '15,000 STG tokens',
          '15% bonus included',
          'Popular choice'
        ]
      },
      {
        id: 'ton_gold',
        name: 'TON Gold Pack',
        description: 'Premium TON experience',
        category: 'ton',
        price: 30,
        currency: 'ton',
        stg_tokens: 40000,
        bonus_percentage: 25,
        icon: '🪙',
        is_popular: true,
        is_limited: false,
        features: [
          '40,000 STG tokens',
          '25% bonus included',
          'Premium value'
        ]
      },
      {
        id: 'ton_diamond',
        name: 'TON Diamond Pack',
        description: 'For high rollers',
        category: 'ton',
        price: 100,
        currency: 'ton',
        stg_tokens: 100000,
        bonus_percentage: 40,
        icon: '🪙',
        is_popular: false,
        is_limited: true,
        limited_quantity: 25,
        remaining_quantity: 18,
        features: [
          '100,000 STG tokens',
          '40% bonus included',
          'Diamond tier',
          'Exclusive perks'
        ]
      },
      {
        id: 'ton_whale',
        name: 'TON Whale Pack',
        description: 'Ultimate TON investment',
        category: 'ton',
        price: 150,
        currency: 'ton',
        stg_tokens: 250000,
        bonus_percentage: 60,
        icon: '🪙',
        is_popular: false,
        is_limited: true,
        limited_quantity: 10,
        remaining_quantity: 6,
        features: [
          '250,000 STG tokens',
          '60% bonus included',
          'Whale exclusive',
          'Lifetime benefits'
        ]
      }
    ],
    categories: [
      {
        id: 'stars',
        name: 'Pay with Stars',
        icon: '⭐',
        description: 'Telegram Stars payment method',
        pack_count: 5,
        min_price: 5,
        max_price: 750
      },
      {
        id: 'ton',
        name: 'Pay with TON',
        icon: '🪙',
        description: 'TON cryptocurrency payment',
        pack_count: 5,
        min_price: 5,
        max_price: 150
      }
    ],
    featured_packs: [
      {
        id: 'stars_expert',
        name: 'Stars Expert Pack',
        reason: 'Best value for Stars users',
        discount_percentage: 25
      },
      {
        id: 'ton_gold',
        name: 'TON Gold Pack',
        reason: 'Most popular TON pack',
        discount_percentage: 25
      }
    ],
    special_offers: [
      {
        id: 'first_purchase_bonus',
        name: 'First Purchase Bonus',
        description: 'Extra 10% STG on first purchase',
        is_active: true,
        bonus_percentage: 10,
        max_bonus_stg: 5000
      },
      {
        id: 'weekend_bonus',
        name: 'Weekend Special',
        description: '15% extra STG on weekend purchases',
        is_active: true,
        bonus_percentage: 15,
        applicable_days: ['saturday', 'sunday']
      }
    ],
    stats: {
      total_packs: 10,
      active_packs: 10,
      limited_packs: 4,
      most_popular: 'stars_pro',
      total_purchases_today: 1247,
      revenue_today: 15678.50,
      average_purchase_value: 12.58
    }
  };
  res.json(buyPacksData);
});

app.post('/api/buy/purchase', (req, res) => {
  const { pack_id, payment_method, quantity = 1 } = req.body;
  
  const purchaseResult = {
    success: true,
    message: 'Purchase completed successfully!',
    purchase: {
      id: `purchase_${Date.now()}`,
      pack_id: pack_id,
      pack_name: 'Stars Expert Pack',
      quantity: quantity,
      payment_method: payment_method,
      total_paid: 200,
      currency: 'stars',
      stg_received: 30000,
      bonus_stg: 7500,
      total_stg: 37500,
      purchase_date: new Date().toISOString(),
      transaction_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    user_balance_update: {
      stg_balance_before: 15420.50,
      stg_balance_after: 52920.50,
      stg_added: 37500
    },
    bonuses_applied: [
      {
        type: 'pack_bonus',
        percentage: 25,
        stg_bonus: 7500,
        description: 'Expert Pack bonus'
      },
      {
        type: 'first_purchase',
        percentage: 10,
        stg_bonus: 3000,
        description: 'First purchase bonus',
        is_applied: true
      }
    ],
    payment_confirmation: {
      status: 'completed',
      payment_id: `pay_${Date.now()}`,
      payment_method: payment_method,
      processed_at: new Date().toISOString(),
      blockchain_confirmation: payment_method === 'ton' ? `0x${Math.random().toString(16).substr(2, 40)}` : null
    }
  };
  
  res.json(purchaseResult);
});

app.post('/api/buy/validate_payment', (req, res) => {
  const { payment_method, amount } = req.body;
  
  const validationResult = {
    success: true,
    is_valid: true,
    payment_method: payment_method,
    amount: amount,
    user_balance: {
      stars: payment_method === 'stars' ? 850 : 0,
      ton_balance: payment_method === 'ton' ? 45.5 : 0
    },
    fees: {
      processing_fee: payment_method === 'ton' ? amount * 0.02 : 0,
      network_fee: payment_method === 'ton' ? 0.5 : 0
    },
    limits: {
      daily_limit: payment_method === 'stars' ? 1000 : 500,
      monthly_limit: payment_method === 'stars' ? 10000 : 5000,
      remaining_daily: payment_method === 'stars' ? 150 : 45.5,
      remaining_monthly: payment_method === 'stars' ? 8500 : 455.5
    }
  };
  
  res.json(validationResult);
});

// Premium API endpoints
app.get('/api/premium/features', (req, res) => {
  const premiumFeaturesData = {
    success: true,
    features: [
      {
        id: 'battle_boost',
        name: 'Battle Boost',
        description: 'Get 2x battle rewards and 10% bonus win rate',
        icon: '⚔️',
        category: 'battle',
        is_active: true,
        benefits: [
          '2x STG rewards from battles',
          '10% increased win rate',
          'Priority matchmaking',
          'Exclusive battle animations'
        ],
        pricing: {
          monthly: 19.99,
          yearly: 199.99,
          lifetime: 499.99
        },
        popularity_score: 95,
        user_count: 2847
      },
      {
        id: 'weapon_mastery',
        name: 'Weapon Mastery',
        description: 'Unlock all weapons instantly and get 15% weapon bonuses',
        icon: '🔫',
        category: 'weapons',
        is_active: true,
        benefits: [
          'All weapons unlocked',
          '15% weapon damage bonus',
          'Exclusive weapon skins',
          'Advanced weapon stats'
        ],
        pricing: {
          monthly: 14.99,
          yearly: 149.99,
          lifetime: 349.99
        },
        popularity_score: 88,
        user_count: 2156
      },
      {
        id: 'territory_control',
        name: 'Territory Control',
        description: 'Enhanced territory bonuses and strategic advantages',
        icon: '🗺️',
        category: 'strategy',
        is_active: true,
        benefits: [
          '25% territory bonuses',
          'Real-time territory alerts',
          'Strategic insights',
          'Territory control history'
        ],
        pricing: {
          monthly: 16.99,
          yearly: 169.99,
          lifetime: 399.99
        },
        popularity_score: 76,
        user_count: 1823
      },
      {
        id: 'elite_pass',
        name: 'Elite Pass',
        description: 'Complete premium package with all features included',
        icon: '👑',
        category: 'bundle',
        is_active: true,
        benefits: [
          'All premium features included',
          '30% discount on all purchases',
          'Exclusive elite badge',
          'Priority customer support',
          'Early access to new features'
        ],
        pricing: {
          monthly: 29.99,
          yearly: 299.99,
          lifetime: 749.99
        },
        popularity_score: 92,
        user_count: 3421
      },
      {
        id: 'staking_plus',
        name: 'Staking Plus',
        description: 'Enhanced staking with boosted APR and exclusive pools',
        icon: '💎',
        category: 'finance',
        is_active: true,
        benefits: [
          '+5% bonus APR on all pools',
          'Exclusive premium pools',
          'Zero staking fees',
          'Compound interest auto-reinvest'
        ],
        pricing: {
          monthly: 12.99,
          yearly: 129.99,
          lifetime: 299.99
        },
        popularity_score: 82,
        user_count: 1567
      },
      {
        id: 'social_elite',
        name: 'Social Elite',
        description: 'Premium social features and guild advantages',
        icon: '👥',
        category: 'social',
        is_active: true,
        benefits: [
          'Create custom guilds',
          'Guild management tools',
          'Exclusive chat features',
          'Social profile customization'
        ],
        pricing: {
          monthly: 9.99,
          yearly: 99.99,
          lifetime: 249.99
        },
        popularity_score: 71,
        user_count: 1234
      }
    ],
    categories: [
      { id: 'battle', name: 'Battle', icon: '⚔️', count: 1 },
      { id: 'weapons', name: 'Weapons', icon: '🔫', count: 1 },
      { id: 'strategy', name: 'Strategy', icon: '🗺️', count: 1 },
      { id: 'bundle', name: 'Bundles', icon: '👑', count: 1 },
      { id: 'finance', name: 'Finance', icon: '💎', count: 1 },
      { id: 'social', name: 'Social', icon: '👥', count: 1 }
    ],
    stats: {
      total_features: 6,
      active_features: 6,
      total_premium_users: 3421,
      conversion_rate: 12.5,
      avg_monthly_revenue: 45678.50
    }
  };
  res.json(premiumFeaturesData);
});

app.get('/api/premium/status', (req, res) => {
  const premiumStatusData = {
    success: true,
    user_premium_status: {
      is_premium: true,
      subscription_type: 'monthly',
      plan: 'elite_pass',
      status: 'active',
      started_at: '2024-01-01T00:00:00Z',
      expires_at: '2024-02-01T00:00:00Z',
      days_remaining: 12,
      auto_renew: true,
      payment_method: 'ton_wallet'
    },
    active_features: [
      'battle_boost',
      'weapon_mastery',
      'territory_control',
      'elite_pass',
      'staking_plus',
      'social_elite'
    ],
    benefits_active: [
      '2x battle rewards',
      '10% win rate bonus',
      'All weapons unlocked',
      '15% weapon damage bonus',
      '25% territory bonuses',
      '30% purchase discount',
      '+5% staking APR',
      'Custom guild creation'
    ],
    usage_stats: {
      battles_with_boost: 47,
      extra_stg_earned: 2340,
      bonus_wins: 5,
      weapons_unlocked: 18,
      territory_bonuses_used: 23,
      staking_bonus_earned: 156.80,
      guild_members_invited: 12
    },
    subscription_history: [
      {
        plan: 'elite_pass',
        type: 'monthly',
        started_at: '2024-01-01T00:00:00Z',
        ended_at: null,
        amount_paid: 29.99,
        payment_method: 'ton_wallet'
      }
    ],
    renewal_info: {
      next_renewal_date: '2024-02-01T00:00:00Z',
      renewal_amount: 29.99,
      auto_renew_enabled: true,
      payment_method_on_file: 'ton_wallet'
    }
  };
  res.json(premiumStatusData);
});

app.post('/api/premium/subscribe', (req, res) => {
  const { plan_id, subscription_type, payment_method } = req.body;
  
  const subscriptionResult = {
    success: true,
    message: 'Premium subscription activated successfully!',
    subscription: {
      id: `sub_${Date.now()}`,
      plan_id: plan_id,
      plan_name: 'Elite Pass',
      subscription_type: subscription_type,
      status: 'active',
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: payment_method,
      amount_paid: subscription_type === 'monthly' ? 29.99 : 299.99
    },
    activated_features: [
      'battle_boost',
      'weapon_mastery', 
      'territory_control',
      'elite_pass',
      'staking_plus',
      'social_elite'
    ],
    user_status: {
      is_premium: true,
      premium_badge: '👑 Elite',
      benefits_count: 6
    }
  };
  
  res.json(subscriptionResult);
});

app.post('/api/premium/cancel', (req, res) => {
  const { subscription_id, reason } = req.body;
  
  const cancelResult = {
    success: true,
    message: 'Premium subscription cancelled successfully',
    cancellation: {
      subscription_id: subscription_id,
      cancelled_at: new Date().toISOString(),
      effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      reason: reason || 'User requested',
      refund_eligible: false
    },
    benefits_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    remaining_days: 30
  };
  
  res.json(cancelResult);
});

app.post('/api/premium/renew', (req, res) => {
  const { subscription_id, payment_method } = req.body;
  
  const renewalResult = {
    success: true,
    message: 'Premium subscription renewed successfully!',
    renewal: {
      subscription_id: subscription_id,
      renewed_at: new Date().toISOString(),
      new_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      payment_method: payment_method,
      amount_charged: 29.99
    },
    extended_benefits: true,
    loyalty_bonus: {
      bonus_days: 7,
      bonus_stg: 500
    }
  };
  
  res.json(renewalResult);
});

// Staking API endpoints
app.get('/api/staking/pools', (req, res) => {
  const stakingPoolsData = {
    success: true,
    pools: [
      {
        id: 'basic_stg',
        name: 'Basic STG Pool',
        description: 'Stake STG tokens for basic rewards',
        token_symbol: 'STG',
        apr: 15.5,
        total_staked: 2500000,
        max_capacity: 5000000,
        min_stake: 100,
        max_stake: 100000,
        lock_period_days: 7,
        is_active: true,
        stakers_count: 1250,
        rewards_distributed: 187500,
        next_rewards_distribution: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: 'premium_stg',
        name: 'Premium STG Pool',
        description: 'High-yield STG staking with bonus rewards',
        token_symbol: 'STG',
        apr: 25.8,
        total_staked: 1800000,
        max_capacity: 3000000,
        min_stake: 1000,
        max_stake: 500000,
        lock_period_days: 30,
        is_active: true,
        stakers_count: 450,
        rewards_distributed: 233100,
        next_rewards_distribution: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: 'win_token_pool',
        name: 'WIN Token Pool',
        description: 'Stake WIN tokens for exclusive rewards',
        token_symbol: 'WIN',
        apr: 32.2,
        total_staked: 950000,
        max_capacity: 2000000,
        min_stake: 50,
        max_stake: 100000,
        lock_period_days: 14,
        is_active: true,
        stakers_count: 890,
        rewards_distributed: 152000,
        next_rewards_distribution: new Date(Date.now() + 86400000).toISOString()
      },
      {
        id: 'faction_bonus_iran',
        name: 'Iran Faction Bonus Pool',
        description: 'Exclusive pool for Iran faction members',
        token_symbol: 'STG',
        apr: 18.7,
        total_staked: 750000,
        max_capacity: 1500000,
        min_stake: 500,
        max_stake: 250000,
        lock_period_days: 21,
        is_active: true,
        stakers_count: 320,
        rewards_distributed: 70125,
        next_rewards_distribution: new Date(Date.now() + 86400000).toISOString(),
        faction_requirement: 'iran'
      },
      {
        id: 'faction_bonus_usa',
        name: 'USA Faction Bonus Pool',
        description: 'Exclusive pool for USA faction members',
        token_symbol: 'STG',
        apr: 19.3,
        total_staked: 820000,
        max_capacity: 1500000,
        min_stake: 500,
        max_stake: 250000,
        lock_period_days: 21,
        is_active: true,
        stakers_count: 345,
        rewards_distributed: 79026,
        next_rewards_distribution: new Date(Date.now() + 86400000).toISOString(),
        faction_requirement: 'usa'
      }
    ],
    global_stats: {
      total_pools: 5,
      active_pools: 5,
      total_value_locked: 7820000,
      total_stakers: 3255,
      average_apr: 22.3,
      total_rewards_distributed_24h: 721751,
      next_rewards_total: 721751
    }
  };
  res.json(stakingPoolsData);
});

app.get('/api/staking/positions', (req, res) => {
  const userPositionsData = {
    success: true,
    positions: [
      {
        id: 'position_001',
        pool_id: 'basic_stg',
        pool_name: 'Basic STG Pool',
        amount_staked: 5000,
        token_symbol: 'STG',
        apr: 15.5,
        start_date: '2024-01-15T10:30:00Z',
        end_date: '2024-01-22T10:30:00Z',
        days_remaining: 2,
        is_active: true,
        rewards_earned: 106.85,
        pending_rewards: 21.37,
        total_rewards: 128.22,
        auto_renew: true
      },
      {
        id: 'position_002',
        pool_id: 'premium_stg',
        pool_name: 'Premium STG Pool',
        amount_staked: 10000,
        token_symbol: 'STG',
        apr: 25.8,
        start_date: '2024-01-10T14:15:00Z',
        end_date: '2024-02-09T14:15:00Z',
        days_remaining: 20,
        is_active: true,
        rewards_earned: 643.84,
        pending_rewards: 172.88,
        total_rewards: 816.72,
        auto_renew: false
      },
      {
        id: 'position_003',
        pool_id: 'win_token_pool',
        pool_name: 'WIN Token Pool',
        amount_staked: 2500,
        token_symbol: 'WIN',
        apr: 32.2,
        start_date: '2024-01-18T09:45:00Z',
        end_date: '2024-02-01T09:45:00Z',
        days_remaining: 14,
        is_active: true,
        rewards_earned: 89.72,
        pending_rewards: 31.40,
        total_rewards: 121.12,
        auto_renew: true
      }
    ],
    user_stats: {
      total_positions: 3,
      active_positions: 3,
      total_amount_staked: 17500,
      total_rewards_earned: 840.41,
      pending_rewards: 225.65,
      average_apr: 24.5,
      next_claim_time: new Date(Date.now() + 172800000).toISOString() // 2 days from now
    }
  };
  res.json(userPositionsData);
});

app.get('/api/staking/balance', (req, res) => {
  const userBalanceData = {
    success: true,
    balances: {
      stg: {
        available: 15420.50,
        staked: 17500,
        total: 32920.50,
        pending_rewards: 225.65,
        total_rewards_earned: 2840.75
      },
      win: {
        available: 875.30,
        staked: 2500,
        total: 3375.30,
        pending_rewards: 31.40,
        total_rewards_earned: 456.80
      }
    },
    portfolio_stats: {
      total_value_usd: 36295.80,
      staking_apr: 24.5,
      daily_earnings: 24.68,
      weekly_earnings: 172.76,
      monthly_earnings: 740.40,
      yearly_earnings: 9012.20
    }
  };
  res.json(userBalanceData);
});

app.post('/api/staking/stake', (req, res) => {
  const { pool_id, amount, token_symbol } = req.body;
  
  const stakeResult = {
    success: true,
    message: 'Staking successful!',
    position: {
      id: `position_${Date.now()}`,
      pool_id: pool_id,
      amount_staked: amount,
      token_symbol: token_symbol,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      apr: 15.5,
      auto_renew: false
    },
    new_balances: {
      stg_available: 15420.50 - amount,
      stg_staked: 17500 + amount,
      stg_total: 32920.50
    }
  };
  
  res.json(stakeResult);
});

app.post('/api/staking/unstake', (req, res) => {
  const { position_id } = req.body;
  
  const unstakeResult = {
    success: true,
    message: 'Unstaking successful!',
    redeemed_amount: 5000,
    rewards_earned: 128.22,
    total_received: 5128.22,
    new_balances: {
      stg_available: 15420.50 + 5128.22,
      stg_staked: 17500 - 5000,
      stg_total: 32920.50 + 128.22
    }
  };
  
  res.json(unstakeResult);
});

app.post('/api/staking/claim_rewards', (req, res) => {
  const claimResult = {
    success: true,
    message: 'Rewards claimed successfully!',
    rewards_claimed: {
      stg: 225.65,
      win: 31.40,
      total: 257.05
    },
    new_balances: {
      stg_available: 15420.50 + 225.65,
      win_available: 875.30 + 31.40,
      pending_rewards: 0
    }
  };
  
  res.json(claimResult);
});

// Daily Missions API endpoint
app.get('/api/daily-missions', (req, res) => {
  const dailyMissionsData = {
    success: true,
    missions: [
      {
        id: 'daily_battles',
        title: 'Daily Battles',
        description: 'Complete 5 battles today',
        type: 'battles',
        target: 5,
        current: 2,
        reward: {
          stg_tokens: 100,
          experience: 50
        },
        difficulty: 'easy',
        faction_bonus: {
          iran: 1.2,
          usa: 1.1
        },
        expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        is_completed: false,
        is_claimed: false
      },
      {
        id: 'territory_control',
        title: 'Territory Control',
        description: 'Win 3 battles in controlled territories',
        type: 'territory_wins',
        target: 3,
        current: 1,
        reward: {
          stg_tokens: 150,
          experience: 75
        },
        difficulty: 'medium',
        faction_bonus: {
          iran: 1.3,
          usa: 1.2
        },
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_completed: false,
        is_claimed: false
      },
      {
        id: 'faction_rivalry',
        title: 'Faction Rivalry',
        description: 'Defeat 2 opposing faction players',
        type: 'faction_kills',
        target: 2,
        current: 0,
        reward: {
          stg_tokens: 200,
          experience: 100
        },
        difficulty: 'medium',
        faction_bonus: {
          iran: 1.4,
          usa: 1.3
        },
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_completed: false,
        is_claimed: false
      },
      {
        id: 'weapon_master',
        title: 'Weapon Master',
        description: 'Win battles using 3 different weapon types',
        type: 'weapon_variety',
        target: 3,
        current: 1,
        reward: {
          stg_tokens: 250,
          experience: 125
        },
        difficulty: 'hard',
        faction_bonus: {
          iran: 1.5,
          usa: 1.4
        },
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_completed: false,
        is_claimed: false
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Achieve a 3-battle winning streak',
        type: 'win_streak',
        target: 3,
        current: 0,
        reward: {
          stg_tokens: 300,
          experience: 150
        },
        difficulty: 'hard',
        faction_bonus: {
          iran: 1.6,
          usa: 1.5
        },
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        is_completed: false,
        is_claimed: false
      }
    ],
    user_progress: {
      daily_battles_completed: 2,
      territory_wins: 1,
      faction_kills: 0,
      weapons_used: ['sniper_rifle'],
      current_streak: 0,
      longest_streak_today: 2,
      total_stg_earned_today: 0,
      total_exp_earned_today: 25
    },
    stats: {
      total_missions: 5,
      completed_missions: 0,
      claimed_missions: 0,
      total_possible_rewards: {
        stg_tokens: 1000,
        experience: 500
      },
      faction_bonus_multiplier: 1.2, // Based on user's faction
      reset_time: new Date(Date.now() + 86400000).toISOString()
    }
  };
  res.json(dailyMissionsData);
});

app.post('/api/daily-missions/claim', (req, res) => {
  const { mission_id } = req.body;
  
  // Mock mission claim logic
  const claimedMission = {
    mission_id: mission_id,
    claimed_at: new Date().toISOString(),
    rewards_received: {
      stg_tokens: 100,
      experience: 50
    },
    new_user_balance: {
      stg_tokens: 1100,
      experience: 75,
      level: 1
    }
  };
  
  res.json({
    success: true,
    message: 'Mission rewards claimed successfully!',
    claimed_mission: claimedMission
  });
});

// Territory API endpoint
app.get('/api/territory', (req, res) => {
  const territoryData = {
    success: true,
    territories: [
      {
        id: 'tehran',
        name: 'Tehran',
        faction: 'iran',
        controlled_by: 'iran',
        attack_bonus: 5,
        defense_bonus: 10,
        exp_bonus: 1.2,
        description: 'Capital of Iran with strong defensive positions',
        strategic_value: 'high',
        population: 8600000,
        coordinates: { lat: 35.6892, lng: 51.3890 },
        battles_today: 45,
        last_battle: '2024-01-20T15:30:00Z'
      },
      {
        id: 'new_york',
        name: 'New York',
        faction: 'usa',
        controlled_by: 'usa',
        attack_bonus: 10,
        defense_bonus: 5,
        exp_bonus: 1.2,
        description: 'Major US city with strong offensive capabilities',
        strategic_value: 'high',
        population: 8336000,
        coordinates: { lat: 40.7128, lng: -74.0060 },
        battles_today: 52,
        last_battle: '2024-01-20T16:45:00Z'
      },
      {
        id: 'los_angeles',
        name: 'Los Angeles',
        faction: 'usa',
        controlled_by: 'usa',
        attack_bonus: 8,
        defense_bonus: 7,
        exp_bonus: 1.1,
        description: 'West coast stronghold with balanced bonuses',
        strategic_value: 'medium',
        population: 3976000,
        coordinates: { lat: 34.0522, lng: -118.2437 },
        battles_today: 38,
        last_battle: '2024-01-20T14:20:00Z'
      },
      {
        id: 'isfahan',
        name: 'Isfahan',
        faction: 'iran',
        controlled_by: 'iran',
        attack_bonus: 3,
        defense_bonus: 12,
        exp_bonus: 1.3,
        description: 'Ancient city with exceptional defensive bonuses',
        strategic_value: 'medium',
        population: 1950000,
        coordinates: { lat: 32.6546, lng: 51.6675 },
        battles_today: 31,
        last_battle: '2024-01-20T13:15:00Z'
      },
      {
        id: 'chicago',
        name: 'Chicago',
        faction: 'usa',
        controlled_by: 'usa',
        attack_bonus: 12,
        defense_bonus: 4,
        exp_bonus: 1.1,
        description: 'Industrial powerhouse with high attack bonuses',
        strategic_value: 'medium',
        population: 2716000,
        coordinates: { lat: 41.8781, lng: -87.6298 },
        battles_today: 41,
        last_battle: '2024-01-20T15:00:00Z'
      },
      {
        id: 'mashhad',
        name: 'Mashhad',
        faction: 'iran',
        controlled_by: 'iran',
        attack_bonus: 4,
        defense_bonus: 11,
        exp_bonus: 1.2,
        description: 'Holy city with strong defensive positions',
        strategic_value: 'medium',
        population: 3120000,
        coordinates: { lat: 36.2605, lng: 59.6168 },
        battles_today: 35,
        last_battle: '2024-01-20T14:45:00Z'
      }
    ],
    global_stats: {
      total_territories: 6,
      iran_controlled: 3,
      usa_controlled: 3,
      total_battles_today: 242,
      most_active_territory: 'new_york',
      territory_control_percentage: {
        iran: 50,
        usa: 50
      }
    }
  };
  res.json(territoryData);
});

// Profile API endpoint
app.get('/api/user/profile', (req, res) => {
  const profileData = {
    success: true,
    user: {
      id: 1,
      username: 'Player1',
      first_name: 'Test',
      last_name: 'User',
      faction: 'iran',
      stg_balance: 1000,
      level: 1,
      experience: 0,
      referral_code: 'PLAYER123',
      battles: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      created_at: new Date().toISOString(),
      wallet_address: null,
      win_claimable: 500
    },
    referrals: [
      { id: 1, username: 'Friend1', first_name: 'Alex', created_at: '2024-01-15T10:00:00Z', stg_balance: 5000, level: 5 },
      { id: 2, username: 'Friend2', first_name: 'Sarah', created_at: '2024-01-16T14:30:00Z', stg_balance: 3000, level: 3 }
    ],
    referral_code: 'TEAMIRAN'
  };
  res.json(profileData);
});

// Faction selection API endpoint
app.post('/api/game/faction/select', (req, res) => {
  const { faction } = req.body;
  console.log('Faction selected:', faction);
  
  const responseData = {
    success: true,
    message: `Successfully joined Team ${faction === 'iran' ? 'Iran 🇮🇷' : 'USA 🇺🇸'}!`,
    user: {
      id: 1,
      username: 'Player1',
      first_name: 'Test',
      last_name: 'User',
      faction: faction,
      stg_balance: 1000,
      level: 1,
      experience: 0,
      referral_code: 'PLAYER123',
      battles: 0,
      wins: 0,
      losses: 0,
      win_rate: 0,
      created_at: new Date().toISOString(),
      wallet_address: null
    }
  };
  res.json(responseData);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🔫 Weapons API: http://localhost:${PORT}/api/weapons`);
  console.log(`🎮 Game ready for Team Iran vs USA!`);
});
