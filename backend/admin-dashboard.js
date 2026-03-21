const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000; // Admin dashboard on different port

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock data for demonstration
const mockData = {
  users: [
    { id: 1, username: 'player1', faction: 'iran', level: 15, stg_tokens: 2500, wins: 45, losses: 12, join_date: '2026-01-15' },
    { id: 2, username: 'player2', faction: 'usa', level: 22, stg_tokens: 4800, wins: 78, losses: 23, join_date: '2026-01-20' },
    { id: 3, username: 'player3', faction: 'iran', level: 8, stg_tokens: 800, wins: 12, losses: 8, join_date: '2026-02-01' },
    { id: 4, username: 'player4', faction: 'usa', level: 31, stg_tokens: 12000, wins: 156, losses: 34, join_date: '2026-01-10' },
    { id: 5, username: 'player5', faction: 'iran', level: 18, stg_tokens: 3200, wins: 67, losses: 28, join_date: '2026-01-25' }
  ],
  weapons: [
    { weapon_id: 'ir_pistol_01', name: 'Zulfikar', category: 'pistol', faction: 'iran', rarity: 'common', total_purchases: 245, revenue: 24500 },
    { weapon_id: 'us_pistol_01', name: 'M1911', category: 'pistol', faction: 'usa', rarity: 'common', total_purchases: 312, revenue: 37440 },
    { weapon_id: 'ir_rifle_01', name: 'KH-2002', category: 'rifle', faction: 'iran', rarity: 'common', total_purchases: 189, revenue: 56700 },
    { weapon_id: 'us_rifle_01', name: 'M4A1', category: 'rifle', faction: 'usa', rarity: 'common', total_purchases: 267, revenue: 85440 },
    { weapon_id: 'ir_sniper_01', name: 'Taj', category: 'sniper', faction: 'iran', rarity: 'rare', total_purchases: 89, revenue: 106800 }
  ],
  battles: [
    { id: 1, player1: 'player1', player2: 'player2', winner: 'player2', duration: '5:23', date: '2026-03-05 12:30:00', stg_reward: 100 },
    { id: 2, player1: 'player3', player2: 'player4', winner: 'player4', duration: '3:45', date: '2026-03-05 12:25:00', stg_reward: 100 },
    { id: 3, player1: 'player5', player2: 'player1', winner: 'player1', duration: '7:12', date: '2026-03-05 12:20:00', stg_reward: 100 },
    { id: 4, player1: 'player2', player2: 'player3', winner: 'player2', duration: '4:56', date: '2026-03-05 12:15:00', stg_reward: 100 },
    { id: 5, player1: 'player4', player2: 'player5', winner: 'player4', duration: '6:34', date: '2026-03-05 12:10:00', stg_reward: 100 }
  ],
  revenue: {
    today: 15420,
    this_week: 89250,
    this_month: 342600,
    total: 1245780,
    by_category: {
      'WEAPON_PURCHASES': 456780,
      'WEAPON_BOOSTS': 234500,
      'STG_TOKENS': 321200,
      'PREMIUM_FEATURES': 233300
    }
  },
  analytics: {
    total_users: 1250,
    active_users_today: 342,
    total_battles: 5678,
    battles_today: 234,
    total_weapons_sold: 3456,
    weapons_sold_today: 89,
    total_boosts_sold: 1234,
    boosts_sold_today: 45
  }
};

// Admin dashboard HTML
const adminDashboardHTML = `
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
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
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
        .main-content { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .section { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .section h2 { color: #4a5568; margin-bottom: 20px; font-size: 1.5em; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { background: #f7fafc; color: #4a5568; font-weight: 600; }
        .table tr:hover { background: #f7fafc; }
        .badge { 
            padding: 4px 8px; 
            border-radius: 12px; 
            font-size: 0.8em; 
            font-weight: 600;
        }
        .badge-iran { background: #e53e3e; color: white; }
        .badge-usa { background: #3182ce; color: white; }
        .badge-common { background: #718096; color: white; }
        .badge-rare { background: #805ad5; color: white; }
        .revenue-chart { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 25px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .revenue-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 200px; margin-top: 20px; }
        .bar { 
            width: 60px; 
            background: linear-gradient(to top, #667eea, #764ba2); 
            border-radius: 8px 8px 0 0;
            position: relative;
            transition: all 0.3s ease;
        }
        .bar:hover { transform: scaleY(1.05); }
        .bar-label { position: absolute; bottom: -25px; left: 50%; transform: translateX(-50%); font-size: 0.8em; color: #718096; }
        .bar-value { position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-weight: bold; color: #4a5568; }
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
        .btn-danger { background: #f56565; color: white; }
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
        @media (max-width: 768px) {
            .main-content { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Super Admin Dashboard</h1>
            <p>Team Iran vs USA - Game Management System</p>
            <p style="margin-top: 10px; color: #48bb78;">🟢 Server Status: Online | 📅 Last Updated: <span id="lastUpdate"></span></p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>👥 Total Users</h3>
                <div class="stat-value">${mockData.analytics.total_users}</div>
                <div class="stat-label">Active today: ${mockData.analytics.active_users_today}</div>
            </div>
            <div class="stat-card">
                <h3>⚔️ Total Battles</h3>
                <div class="stat-value">${mockData.analytics.total_battles}</div>
                <div class="stat-label">Today: ${mockData.analytics.battles_today}</div>
            </div>
            <div class="stat-card">
                <h3>🔫 Weapons Sold</h3>
                <div class="stat-value">${mockData.analytics.total_weapons_sold}</div>
                <div class="stat-label">Today: ${mockData.analytics.weapons_sold_today}</div>
            </div>
            <div class="stat-card">
                <h3>⚡ Boosts Sold</h3>
                <div class="stat-value">${mockData.analytics.total_boosts_sold}</div>
                <div class="stat-label">Today: ${mockData.analytics.boosts_sold_today}</div>
            </div>
            <div class="stat-card">
                <h3>💰 Today's Revenue</h3>
                <div class="stat-value">$${mockData.revenue.today}</div>
                <div class="stat-label">This month: $${mockData.revenue.this_month}</div>
            </div>
            <div class="stat-card">
                <h3>🏆 Total Revenue</h3>
                <div class="stat-value">$${mockData.revenue.total}</div>
                <div class="stat-label">This week: $${mockData.revenue.this_week}</div>
            </div>
        </div>

        <div class="revenue-chart">
            <h2>💰 Revenue by Category</h2>
            <div class="revenue-bars">
                <div class="bar" style="height: ${Math.max(mockData.revenue.by_category.WEAPON_PURCHASES / 5000, 20)}px;">
                    <div class="bar-value">$${mockData.revenue.by_category.WEAPON_PURCHASES}</div>
                    <div class="bar-label">Weapons</div>
                </div>
                <div class="bar" style="height: ${Math.max(mockData.revenue.by_category.WEAPON_BOOSTS / 5000, 20)}px;">
                    <div class="bar-value">$${mockData.revenue.by_category.WEAPON_BOOSTS}</div>
                    <div class="bar-label">Boosts</div>
                </div>
                <div class="bar" style="height: ${Math.max(mockData.revenue.by_category.STG_TOKENS / 5000, 20)}px;">
                    <div class="bar-value">$${mockData.revenue.by_category.STG_TOKENS}</div>
                    <div class="bar-label">STG Tokens</div>
                </div>
                <div class="bar" style="height: ${Math.max(mockData.revenue.by_category.PREMIUM_FEATURES / 5000, 20)}px;">
                    <div class="bar-value">$${mockData.revenue.by_category.PREMIUM_FEATURES}</div>
                    <div class="bar-label">Premium</div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="section">
                <h2>👥 Recent Users</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Faction</th>
                            <th>Level</th>
                            <th>STG Tokens</th>
                            <th>Win Rate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockData.users.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td><span class="badge badge-${user.faction}">${user.faction.toUpperCase()}</span></td>
                                <td>${user.level}</td>
                                <td>${user.stg_tokens.toLocaleString()}</td>
                                <td>${((user.wins / (user.wins + user.losses)) * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>🔫 Top Weapons</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Weapon</th>
                            <th>Category</th>
                            <th>Faction</th>
                            <th>Rarity</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockData.weapons.map(weapon => `
                            <tr>
                                <td>${weapon.name}</td>
                                <td>${weapon.category}</td>
                                <td><span class="badge badge-${weapon.faction}">${weapon.faction.toUpperCase()}</span></td>
                                <td><span class="badge badge-${weapon.rarity}">${weapon.rarity.toUpperCase()}</span></td>
                                <td>$${weapon.revenue.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <h2>⚔️ Recent Battles</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Player 1</th>
                        <th>Player 2</th>
                        <th>Winner</th>
                        <th>Duration</th>
                        <th>Time</th>
                        <th>STG Reward</th>
                    </tr>
                </thead>
                <tbody>
                    ${mockData.battles.map(battle => `
                        <tr>
                            <td>${battle.player1}</td>
                            <td>${battle.player2}</td>
                            <td><strong>${battle.winner}</strong></td>
                            <td>${battle.duration}</td>
                            <td>${battle.date}</td>
                            <td>${battle.stg_reward} STG</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>🎛️ Admin Actions</h2>
            <div class="actions">
                <button class="btn btn-primary" onclick="alert('User Management')">👥 User Management</button>
                <button class="btn btn-primary" onclick="alert('Weapon Configuration')">🔫 Weapon Configuration</button>
                <button class="btn btn-primary" onclick="alert('Boost Pack Management')">⚡ Boost Pack Management</button>
                <button class="btn btn-primary" onclick="alert('Revenue Analytics')">💰 Revenue Analytics</button>
                <button class="btn btn-success" onclick="alert('Backup Database')">💾 Backup Database</button>
                <button class="btn btn-success" onclick="alert('Export Reports')">📊 Export Reports</button>
                <button class="btn btn-danger" onclick="alert('Maintenance Mode')">🔧 Maintenance Mode</button>
                <button class="btn btn-danger" onclick="alert('Emergency Shutdown')">🚨 Emergency Shutdown</button>
            </div>
        </div>
    </div>

    <button class="refresh-btn" onclick="location.reload()">🔄</button>

    <script>
        // Update last update time
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
        
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
</html>
`;

// Serve admin dashboard
app.get('/', (req, res) => {
  res.send(adminDashboardHTML);
});

// API endpoints for admin data
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: mockData
  });
});

app.get('/api/admin/users', (req, res) => {
  res.json({
    success: true,
    data: mockData.users
  });
});

app.get('/api/admin/weapons', (req, res) => {
  res.json({
    success: true,
    data: mockData.weapons
  });
});

app.get('/api/admin/battles', (req, res) => {
  res.json({
    success: true,
    data: mockData.battles
  });
});

app.get('/api/admin/revenue', (req, res) => {
  res.json({
    success: true,
    data: mockData.revenue
  });
});

// Start admin dashboard server
app.listen(PORT, () => {
  console.log(`🎮 Super Admin Dashboard running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📊 Admin API: http://localhost:${PORT}/api/admin/stats`);
  console.log(`🎮 Team Iran vs USA - Admin Management System`);
});

module.exports = app;
