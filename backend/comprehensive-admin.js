const http = require('http');
const fs = require('fs');

const PORT = 8080;

// Comprehensive admin data with full game management
const gameData = {
  // User management data
  users: {
    total: 15420,
    active_today: 3420,
    new_today: 156,
    premium_users: 2340,
    by_faction: { iran: 7210, usa: 8210 },
    by_level: { 
      '1-10': 5420, '11-20': 6100, '21-30': 2890, '31+': 1010 
    },
    top_players: [
      { username: 'DragonSlayer', faction: 'usa', level: 87, stg_tokens: 45200, wins: 892, losses: 45, win_rate: 95.2, total_revenue: 12500 },
      { username: 'IranWarrior', faction: 'iran', level: 82, stg_tokens: 38900, wins: 756, losses: 67, win_rate: 91.9, total_revenue: 10200 },
      { username: 'Patriot', faction: 'usa', level: 79, stg_tokens: 34100, wins: 623, losses: 89, win_rate: 87.5, total_revenue: 8900 },
      { username: 'DesertEagle', faction: 'iran', level: 76, stg_tokens: 31200, wins: 567, losses: 78, win_rate: 87.9, total_revenue: 7800 },
      { username: 'FreedomFighter', faction: 'usa', level: 74, stg_tokens: 29800, wins: 534, losses: 92, win_rate: 85.3, total_revenue: 7200 }
    ],
    recent_registrations: [
      { username: 'NewPlayer1', faction: 'iran', level: 1, join_time: '2026-03-07 12:30:00', stg_purchased: 0 },
      { username: 'NewPlayer2', faction: 'usa', level: 1, join_time: '2026-03-07 12:28:00', stg_purchased: 50 },
      { username: 'NewPlayer3', faction: 'iran', level: 1, join_time: '2026-03-07 12:25:00', stg_purchased: 100 }
    ]
  },

  // Weapon management data
  weapons: {
    total_types: 100,
    total_purchases: 45680,
    purchases_today: 234,
    by_category: {
      pistol: { total: 12, purchases: 15234, revenue: 228510 },
      rifle: { total: 18, purchases: 18945, revenue: 567350 },
      sniper: { total: 8, purchases: 5678, revenue: 283900 },
      shotgun: { total: 6, purchases: 3456, revenue: 103680 },
      smg: { total: 10, purchases: 8901, revenue: 178020 },
      lmg: { total: 8, purchases: 3456, revenue: 172800 },
      explosive: { total: 8, purchases: 6789, revenue: 135780 },
      melee: { total: 12, purchases: 1234, revenue: 24680 },
      special: { total: 18, purchases: 1987, revenue: 597210 }
    },
    by_faction: {
      iran: { purchases: 22340, revenue: 892450 },
      usa: { purchases: 23340, revenue: 1568480 }
    },
    by_rarity: {
      common: { purchases: 28900, revenue: 578000 },
      uncommon: { purchases: 12340, revenue: 370200 },
      rare: { purchases: 3456, revenue: 172800 },
      epic: { purchases: 789, revenue: 78900 },
      legendary: { purchases: 195, revenue: 117000 }
    },
    top_weapons: [
      { name: 'M4A1', faction: 'usa', category: 'rifle', rarity: 'common', purchases: 5678, revenue: 181696 },
      { name: 'SCAR-H', faction: 'usa', category: 'rifle', rarity: 'epic', purchases: 2345, revenue: 3517500 },
      { name: 'KH-2002', faction: 'iran', category: 'rifle', rarity: 'common', purchases: 4567, revenue: 137010 },
      { name: 'Barrett M82', faction: 'usa', category: 'sniper', rarity: 'legendary', purchases: 1234, revenue: 3702000 },
      { name: 'Zulfiqar', faction: 'iran', category: 'special', rarity: 'legendary', purchases: 890, revenue: 2670000 }
    ],
    custom_weapons: [
      { id: 'custom_001', name: 'Dragon Flame', creator: 'Admin1', uses: 4567, rating: 4.8, status: 'active' },
      { id: 'custom_002', name: 'Eagle Strike', creator: 'Admin2', uses: 3234, rating: 4.6, status: 'active' },
      { id: 'custom_003', name: 'Thunder Bolt', creator: 'Admin3', uses: 2890, rating: 4.9, status: 'pending_approval' }
    ]
  },

  // Battle management data
  battles: {
    total: 156780,
    today: 2340,
    active_now: 156,
    average_duration: '4:23',
    by_faction_wins: { iran: 78234, usa: 78546 },
    by_game_mode: {
      quick_battle: { total: 123456, avg_duration: '2:15' },
      tournament: { total: 23456, avg_duration: '8:45' },
      clan_war: { total: 9868, avg_duration: '12:30' }
    },
    recent_battles: [
      { id: 'battle_001', player1: 'DragonSlayer', player2: 'IranWarrior', winner: 'DragonSlayer', duration: '3:45', mode: 'tournament', stg_reward: 500, time: '2026-03-07 12:35:00' },
      { id: 'battle_002', player1: 'Patriot', player2: 'DesertEagle', winner: 'Patriot', duration: '5:12', mode: 'quick_battle', stg_reward: 100, time: '2026-03-07 12:32:00' },
      { id: 'battle_003', player1: 'FreedomFighter', player2: 'NewPlayer1', winner: 'FreedomFighter', duration: '1:23', mode: 'quick_battle', stg_reward: 100, time: '2026-03-07 12:30:00' }
    ],
    tournaments: [
      { id: 'tournament_001', name: 'Spring Championship', participants: 456, status: 'active', prize_pool: 50000, start_time: '2026-03-07 14:00:00' },
      { id: 'tournament_002', name: 'Weekend Warrior', participants: 234, status: 'upcoming', prize_pool: 25000, start_time: '2026-03-08 18:00:00' },
      { id: 'tournament_003', name: 'Elite Masters', participants: 89, status: 'completed', prize_pool: 100000, winner: 'DragonSlayer', end_time: '2026-03-06 20:00:00' }
    ]
  },

  // Monetization data
  monetization: {
    total_revenue: 2460780,
    today_revenue: 45670,
    this_week: 312450,
    this_month: 1245780,
    by_category: {
      stg_tokens: { revenue: 892340, purchases: 15678, growth: '+12.5%' },
      weapon_purchases: { revenue: 1568480, purchases: 45680, growth: '+8.3%' },
      weapon_boosts: { revenue: 234500, purchases: 12340, growth: '+15.7%' },
      premium_features: { revenue: 345670, purchases: 2340, growth: '+22.1%' },
      custom_weapons: { revenue: 67890, purchases: 456, growth: '+45.2%' }
    },
    conversion_rates: {
      visitors_to_registrations: '23.4%',
      registrations_to_first_purchase: '67.8%',
      free_to_premium_conversion: '18.9%',
      average_revenue_per_user: 159.67
    },
    top_spenders: [
      { username: 'WhaleKing', total_spent: 12500, last_purchase: '2026-03-07 11:45:00', favorite_category: 'weapon_boosts' },
      { username: 'RichPlayer', total_spent: 8900, last_purchase: '2026-03-07 10:30:00', favorite_category: 'premium_features' },
      { username: 'TokenCollector', total_spent: 6700, last_purchase: '2026-03-07 09:15:00', favorite_category: 'stg_tokens' }
    ]
  },

  // System performance data
  system: {
    server_uptime: '99.8%',
    api_response_time: '45ms',
    database_size: '2.3GB',
    active_connections: 1567,
    error_rate: '0.02%',
    last_backup: '2026-03-07 06:00:00',
    storage_usage: { used: '1.8TB', total: '5TB', percentage: '36%' },
    bandwidth_usage: { used: '3.2TB', total: '10TB', percentage: '32%' }
  },

  // Content management data
  content: {
    total_achievements: 156,
    unlocked_achievements_today: 2340,
    total_maps: 12,
    active_maps: 8,
    total_events: 45,
    active_events: 3,
    news_articles: [
      { id: 1, title: 'New Weapon Pack Released', category: 'weapons', date: '2026-03-07 10:00:00', views: 4567, status: 'published' },
      { id: 2, title: 'Tournament Announcement', category: 'events', date: '2026-03-07 09:00:00', views: 3234, status: 'published' },
      { id: 3, title: 'System Maintenance', category: 'system', date: '2026-03-07 08:00:00', views: 5678, status: 'published' }
    ]
  }
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' || req.url === '/admin') {
    const html = generateAdminHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url.startsWith('/api/')) {
    handleAPIRequest(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Page Not Found</h1><p><a href="/">Go to Admin Dashboard</a></p>');
  }
});

function generateAdminHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Super Admin Dashboard - Team Iran vs USA</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            overflow-x: auto;
        }
        .container { max-width: 1600px; margin: 0 auto; padding: 20px; }
        .header { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 30px; 
            margin-bottom: 30px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
        }
        .header h1 { color: #4a5568; font-size: 2.5em; margin-bottom: 10px; }
        .header p { color: #718096; font-size: 1.1em; }
        .nav-tabs { 
            display: flex; 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 10px; 
            margin-bottom: 30px; 
            gap: 10px;
            flex-wrap: wrap;
        }
        .nav-tab { 
            padding: 12px 20px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600;
            transition: all 0.3s ease;
            background: #e2e8f0;
            color: #4a5568;
        }
        .nav-tab.active { background: #667eea; color: white; }
        .nav-tab:hover { background: #4a5568; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .stat-card { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card h3 { color: #4a5568; margin-bottom: 15px; font-size: 1.2em; }
        .stat-value { font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 5px; }
        .stat-label { color: #718096; font-size: 0.9em; }
        .section { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .section h2 { color: #4a5568; margin-bottom: 20px; font-size: 1.5em; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { background: #f7fafc; color: #4a5568; font-weight: 600; }
        .table tr:hover { background: #f7fafc; }
        .badge { 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 0.8em; 
            font-weight: 600;
            color: white;
        }
        .badge-iran { background: #e53e3e; }
        .badge-usa { background: #3182ce; }
        .badge-common { background: #718096; }
        .badge-uncommon { background: #48bb78; }
        .badge-rare { background: #805ad5; }
        .badge-epic { background: #6366f1; }
        .badge-legendary { background: #f59e0b; }
        .badge-active { background: #48bb78; }
        .badge-pending { background: #f59e0b; }
        .actions { 
            display: flex; 
            gap: 10px; 
            margin-top: 20px; 
            flex-wrap: wrap;
        }
        .btn { 
            padding: 10px 20px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #48bb78; color: white; }
        .btn-warning { background: #f59e0b; color: white; }
        .btn-danger { background: #f56565; color: white; }
        .btn-info { background: #3182ce; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .refresh-btn { 
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background: #667eea; 
            color: white; 
            border: none; 
            border-radius: 50%; 
            width: 60px; 
            height: 60px; 
            font-size: 1.5em; 
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        }
        .refresh-btn:hover { transform: rotate(180deg); }
        .chart-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .chart { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .progress-bar { 
            width: 100%; 
            height: 20px; 
            background: #e2e8f0; 
            border-radius: 10px; 
            overflow: hidden;
        }
        .progress-fill { 
            height: 100%; 
            background: linear-gradient(90deg, #667eea, #764ba2); 
            border-radius: 10px;
            transition: width 0.3s ease;
        }
        @media (max-width: 768px) {
            .chart-container { grid-template-columns: 1fr; }
            .nav-tabs { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Super Admin Dashboard</h1>
            <p>Team Iran vs USA - Complete Game Management System</p>
            <p style="margin-top: 10px; color: #48bb78;">🟢 Server Status: Online | 📅 Last Updated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('overview')">📊 Overview</button>
            <button class="nav-tab" onclick="showTab('users')">👥 Users</button>
            <button class="nav-tab" onclick="showTab('weapons')">🔫 Weapons</button>
            <button class="nav-tab" onclick="showTab('battles')">⚔️ Battles</button>
            <button class="nav-tab" onclick="showTab('monetization')">💰 Monetization</button>
            <button class="nav-tab" onclick="showTab('system')">🛠️ System</button>
            <button class="nav-tab" onclick="showTab('content')">📝 Content</button>
            <button class="nav-tab" onclick="showTab('tools')">🎛️ Tools</button>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>👥 Total Users</h3>
                    <div class="stat-value">${gameData.users.total.toLocaleString()}</div>
                    <div class="stat-label">Active today: ${gameData.users.active_today.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>⚔️ Total Battles</h3>
                    <div class="stat-value">${gameData.battles.total.toLocaleString()}</div>
                    <div class="stat-label">Today: ${gameData.battles.today.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>🔫 Weapons Sold</h3>
                    <div class="stat-value">${gameData.weapons.total_purchases.toLocaleString()}</div>
                    <div class="stat-label">Today: ${gameData.weapons.purchases_today.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>💰 Today's Revenue</h3>
                    <div class="stat-value">$${gameData.monetization.today_revenue.toLocaleString()}</div>
                    <div class="stat-label">This month: $${gameData.monetization.this_month.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>🏆 Total Revenue</h3>
                    <div class="stat-value">$${gameData.monetization.total_revenue.toLocaleString()}</div>
                    <div class="stat-label">This week: $${gameData.monetization.this_week.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>🟢 Server Uptime</h3>
                    <div class="stat-value">${gameData.system.server_uptime}</div>
                    <div class="stat-label">API Response: ${gameData.system.api_response_time}</div>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart">
                    <h3>💰 Revenue by Category</h3>
                    <div style="margin-top: 20px;">
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>STG Tokens</span>
                                <span>$${gameData.monetization.by_category.stg_tokens.revenue.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(gameData.monetization.by_category.stg_tokens.revenue / gameData.monetization.total_revenue * 100)}%;"></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Weapons</span>
                                <span>$${gameData.monetization.by_category.weapon_purchases.revenue.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(gameData.monetization.by_category.weapon_purchases.revenue / gameData.monetization.total_revenue * 100)}%;"></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Boosts</span>
                                <span>$${gameData.monetization.by_category.weapon_boosts.revenue.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(gameData.monetization.by_category.weapon_boosts.revenue / gameData.monetization.total_revenue * 100)}%;"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chart">
                    <h3>👥 User Distribution</h3>
                    <div style="margin-top: 20px;">
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>🇮🇳 Iran</span>
                                <span>${gameData.users.by_faction.iran.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(gameData.users.by_faction.iran / gameData.users.total * 100)}%; background: #e53e3e;"></div>
                            </div>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>🇺🇸 USA</span>
                                <span>${gameData.users.by_faction.usa.toLocaleString()}</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(gameData.users.by_faction.usa / gameData.users.total * 100)}%; background: #3182ce;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users Tab -->
        <div id="users" class="tab-content">
            <div class="section">
                <h2>👥 Top Players</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Faction</th>
                            <th>Level</th>
                            <th>STG Tokens</th>
                            <th>Wins</th>
                            <th>Losses</th>
                            <th>Win Rate</th>
                            <th>Total Revenue</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.users.top_players.map(player => `
                            <tr>
                                <td><strong>${player.username}</strong></td>
                                <td><span class="badge badge-${player.faction}">${player.faction.toUpperCase()}</span></td>
                                <td>${player.level}</td>
                                <td>${player.stg_tokens.toLocaleString()}</td>
                                <td>${player.wins}</td>
                                <td>${player.losses}</td>
                                <td>${player.win_rate}%</td>
                                <td>$${player.total_revenue.toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('View details for ${player.username}')">View</button>
                                    <button class="btn btn-warning" onclick="alert('Ban user ${player.username}')">Ban</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>🆕 Recent Registrations</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Faction</th>
                            <th>Join Time</th>
                            <th>STG Purchased</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.users.recent_registrations.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td><span class="badge badge-${user.faction}">${user.faction.toUpperCase()}</span></td>
                                <td>${user.join_time}</td>
                                <td>${user.stg_purchased}</td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('Welcome ${user.username}')">Welcome</button>
                                    <button class="btn btn-danger" onclick="alert('Suspend ${user.username}')">Suspend</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Weapons Tab -->
        <div id="weapons" class="tab-content">
            <div class="section">
                <h2>🔫 Top Weapons</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Weapon</th>
                            <th>Faction</th>
                            <th>Category</th>
                            <th>Rarity</th>
                            <th>Purchases</th>
                            <th>Revenue</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.weapons.top_weapons.map(weapon => `
                            <tr>
                                <td><strong>${weapon.name}</strong></td>
                                <td><span class="badge badge-${weapon.faction}">${weapon.faction.toUpperCase()}</span></td>
                                <td>${weapon.category}</td>
                                <td><span class="badge badge-${weapon.rarity}">${weapon.rarity.toUpperCase()}</span></td>
                                <td>${weapon.purchases.toLocaleString()}</td>
                                <td>$${weapon.revenue.toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('Edit ${weapon.name}')">Edit</button>
                                    <button class="btn btn-warning" onclick="alert('Disable ${weapon.name}')">Disable</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>🎨 Custom Weapons</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Creator</th>
                            <th>Uses</th>
                            <th>Rating</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.weapons.custom_weapons.map(weapon => `
                            <tr>
                                <td>${weapon.name}</td>
                                <td>${weapon.creator}</td>
                                <td>${weapon.uses.toLocaleString()}</td>
                                <td>⭐ ${weapon.rating}</td>
                                <td><span class="badge badge-${weapon.status}">${weapon.status.replace('_', ' ').toUpperCase()}</span></td>
                                <td>
                                    <button class="btn btn-success" onclick="alert('Approve ${weapon.name}')">Approve</button>
                                    <button class="btn btn-danger" onclick="alert('Reject ${weapon.name}')">Reject</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Battles Tab -->
        <div id="battles" class="tab-content">
            <div class="section">
                <h2>⚔️ Battle Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Battles</h3>
                        <div class="stat-value">${gameData.battles.total.toLocaleString()}</div>
                        <div class="stat-label">Today: ${gameData.battles.today.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Active Now</h3>
                        <div class="stat-value">${gameData.battles.active_now.toLocaleString()}</div>
                        <div class="stat-label">Average Duration: ${gameData.battles.average_duration}</div>
                    </div>
                    <div class="stat-card">
                        <h3>🇮🇳 Iran Wins</h3>
                        <div class="stat-value">${gameData.battles.by_faction_wins.iran.toLocaleString()}</div>
                        <div class="stat-label">Win Rate: ${(gameData.battles.by_faction_wins.iran / gameData.battles.total * 100).toFixed(1)}%</div>
                    </div>
                    <div class="stat-card">
                        <h3>🇺🇸 USA Wins</h3>
                        <div class="stat-value">${gameData.battles.by_faction_wins.usa.toLocaleString()}</div>
                        <div class="stat-label">Win Rate: ${(gameData.battles.by_faction_wins.usa / gameData.battles.total * 100).toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🏆 Tournaments</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Participants</th>
                            <th>Prize Pool</th>
                            <th>Status</th>
                            <th>Start Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.battles.tournaments.map(tournament => `
                            <tr>
                                <td><strong>${tournament.name}</strong></td>
                                <td>${tournament.participants}</td>
                                <td>${tournament.prize_pool.toLocaleString()} STG</td>
                                <td><span class="badge badge-${tournament.status}">${tournament.status.toUpperCase()}</span></td>
                                <td>${tournament.start_time}</td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('Manage ${tournament.name}')">Manage</button>
                                    <button class="btn btn-warning" onclick="alert('Cancel ${tournament.name}')">Cancel</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Monetization Tab -->
        <div id="monetization" class="tab-content">
            <div class="section">
                <h2>💰 Revenue Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Revenue</h3>
                        <div class="stat-value">$${gameData.monetization.total_revenue.toLocaleString()}</div>
                        <div class="stat-label">This month: $${gameData.monetization.this_month.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Today's Revenue</h3>
                        <div class="stat-value">$${gameData.monetization.today_revenue.toLocaleString()}</div>
                        <div class="stat-label">This week: $${gameData.monetization.this_week.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Avg Revenue/User</h3>
                        <div class="stat-value">$${gameData.monetization.conversion_rates.average_revenue_per_user}</div>
                        <div class="stat-label">Conversion: ${gameData.monetization.conversion_rates.free_to_premium_conversion}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>💎 Top Spenders</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Total Spent</th>
                            <th>Last Purchase</th>
                            <th>Favorite Category</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.monetization.top_spenders.map(spender => `
                            <tr>
                                <td><strong>${spender.username}</strong></td>
                                <td>$${spender.total_spent.toLocaleString()}</td>
                                <td>${spender.last_purchase}</td>
                                <td>${spender.favorite_category.replace('_', ' ').toUpperCase()}</td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('View ${spender.username} spending')">View</button>
                                    <button class="btn btn-warning" onclick="alert('Limit ${spender.username}')">Limit</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- System Tab -->
        <div id="system" class="tab-content">
            <div class="section">
                <h2>🛠️ System Performance</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Server Uptime</h3>
                        <div class="stat-value">${gameData.system.server_uptime}</div>
                        <div class="stat-label">Error Rate: ${gameData.system.error_rate}</div>
                    </div>
                    <div class="stat-card">
                        <h3>API Response</h3>
                        <div class="stat-value">${gameData.system.api_response_time}</div>
                        <div class="stat-label">Active Connections: ${gameData.system.active_connections.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Database Size</h3>
                        <div class="stat-value">${gameData.system.database_size}</div>
                        <div class="stat-label">Last Backup: ${gameData.system.last_backup}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Storage Usage</h3>
                        <div class="stat-value">${gameData.system.storage_usage.percentage}%</div>
                        <div class="stat-label">${gameData.system.storage_usage.used} / ${gameData.system.storage_usage.total}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>🗂️ Resource Usage</h2>
                <div style="margin-top: 20px;">
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Storage</span>
                            <span>${gameData.system.storage_usage.percentage}% (${gameData.system.storage_usage.used} / ${gameData.system.storage_usage.total})</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${gameData.system.storage_usage.percentage}%;"></div>
                        </div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Bandwidth</span>
                            <span>${gameData.system.bandwidth_usage.percentage}% (${gameData.system.bandwidth_usage.used} / ${gameData.system.bandwidth_usage.total})</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${gameData.system.bandwidth_usage.percentage}%; background: #3182ce;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Content Tab -->
        <div id="content" class="tab-content">
            <div class="section">
                <h2>📝 Content Management</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Achievements</h3>
                        <div class="stat-value">${gameData.content.total_achievements}</div>
                        <div class="stat-label">Unlocked today: ${gameData.content.unlocked_achievements_today.toLocaleString()}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Total Maps</h3>
                        <div class="stat-value">${gameData.content.total_maps}</div>
                        <div class="stat-label">Active: ${gameData.content.active_maps}</div>
                    </div>
                    <div class="stat-card">
                        <h3>Active Events</h3>
                        <div class="stat-value">${gameData.content.active_events}</div>
                        <div class="stat-label">Total: ${gameData.content.total_events}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📰 News & Announcements</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Views</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${gameData.content.news_articles.map(article => `
                            <tr>
                                <td><strong>${article.title}</strong></td>
                                <td><span class="badge badge-${article.category}">${article.category.toUpperCase()}</span></td>
                                <td>${article.date}</td>
                                <td>${article.views.toLocaleString()}</td>
                                <td><span class="badge badge-${article.status}">${article.status.toUpperCase()}</span></td>
                                <td>
                                    <button class="btn btn-info" onclick="alert('Edit ${article.title}')">Edit</button>
                                    <button class="btn btn-warning" onclick="alert('Unpublish ${article.title}')">Unpublish</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Tools Tab -->
        <div id="tools" class="tab-content">
            <div class="section">
                <h2>🎛️ Admin Tools</h2>
                <div class="actions">
                    <button class="btn btn-primary" onclick="alert('User Management')">👥 User Management</button>
                    <button class="btn btn-primary" onclick="alert('Weapon Configuration')">🔫 Weapon Configuration</button>
                    <button class="btn btn-primary" onclick="alert('Boost Pack Management')">⚡ Boost Pack Management</button>
                    <button class="btn btn-primary" onclick="alert('Tournament Manager')">🏆 Tournament Manager</button>
                    <button class="btn btn-primary" onclick="alert('Revenue Analytics')">💰 Revenue Analytics</button>
                    <button class="btn btn-success" onclick="alert('Backup Database')">💾 Backup Database</button>
                    <button class="btn btn-success" onclick="alert('Export Reports')">📊 Export Reports</button>
                    <button class="btn btn-info" onclick="alert('System Logs')">📋 System Logs</button>
                    <button class="btn btn-warning" onclick="alert('Maintenance Mode')">🔧 Maintenance Mode</button>
                    <button class="btn btn-danger" onclick="alert('Emergency Shutdown')">🚨 Emergency Shutdown</button>
                    <button class="btn btn-danger" onclick="alert('Clear Cache')">🗑️ Clear Cache</button>
                    <button class="btn btn-primary" onclick="alert('Send Mass Notification')">📢 Send Notification</button>
                    <button class="btn btn-info" onclick="alert('Import/Export Data')">🔄 Import/Export Data</button>
                </div>
            </div>

            <div class="section">
                <h2>⚙️ System Configuration</h2>
                <div class="actions">
                    <button class="btn btn-primary" onclick="alert('Game Settings')">🎮 Game Settings</button>
                    <button class="btn btn-primary" onclick="alert('Payment Settings')">💳 Payment Settings</button>
                    <button class="btn btn-primary" onclick="alert('Security Settings')">🔒 Security Settings</button>
                    <button class="btn btn-primary" onclick="alert('API Configuration')">🌐 API Configuration</button>
                    <button class="btn btn-primary" onclick="alert('Email Settings')">📧 Email Settings</button>
                    <button class="btn btn-primary" onclick="alert('Backup Settings')">💾 Backup Settings</button>
                </div>
            </div>
        </div>
    </div>

    <button class="refresh-btn" onclick="location.reload()">🔄</button>

    <script>
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
        
        // Add some interactivity
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(1.05)';
                setTimeout(() => this.style.transform = '', 200);
            });
        });
    </script>
</body>
</html>`;
}

function handleAPIRequest(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url.includes('/api/admin/stats')) {
    res.end(JSON.stringify({ success: true, data: gameData }));
  } else if (req.url.includes('/api/admin/users')) {
    res.end(JSON.stringify({ success: true, data: gameData.users }));
  } else if (req.url.includes('/api/admin/weapons')) {
    res.end(JSON.stringify({ success: true, data: gameData.weapons }));
  } else if (req.url.includes('/api/admin/battles')) {
    res.end(JSON.stringify({ success: true, data: gameData.battles }));
  } else if (req.url.includes('/api/admin/monetization')) {
    res.end(JSON.stringify({ success: true, data: gameData.monetization }));
  } else if (req.url.includes('/api/admin/system')) {
    res.end(JSON.stringify({ success: true, data: gameData.system }));
  } else if (req.url.includes('/api/admin/content')) {
    res.end(JSON.stringify({ success: true, data: gameData.content }));
  } else {
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }
}

server.listen(PORT, () => {
  console.log(`🎮 Comprehensive Super Admin Dashboard running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin/stats`);
  console.log(`🎮 Team Iran vs USA - Complete Game Management System`);
});

console.log('Starting comprehensive admin dashboard...');
