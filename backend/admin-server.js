const http = require('http');

const PORT = 9000;

// Mock admin data
const adminData = {
  stats: {
    total_users: 1250,
    active_users_today: 342,
    total_battles: 5678,
    battles_today: 234,
    total_weapons_sold: 3456,
    weapons_sold_today: 89,
    revenue_today: 15420,
    revenue_total: 1245780
  },
  users: [
    { username: 'player1', faction: 'iran', level: 15, stg_tokens: 2500, win_rate: 78.9 },
    { username: 'player2', faction: 'usa', level: 22, stg_tokens: 4800, win_rate: 77.2 },
    { username: 'player3', faction: 'iran', level: 8, stg_tokens: 800, win_rate: 60.0 },
    { username: 'player4', faction: 'usa', level: 31, stg_tokens: 12000, win_rate: 82.1 }
  ],
  weapons: [
    { name: 'Zulfikar', category: 'pistol', faction: 'iran', rarity: 'common', revenue: 24500 },
    { name: 'M1911', category: 'pistol', faction: 'usa', rarity: 'common', revenue: 37440 },
    { name: 'KH-2002', category: 'rifle', faction: 'iran', rarity: 'common', revenue: 56700 }
  ]
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'text/html');

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Super Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: #667eea; color: white; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { text-align: center; padding: 30px; background: rgba(255,255,255,0.1); border-radius: 15px; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat { background: rgba(255,255,255,0.9); color: #333; padding: 20px; border-radius: 10px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .section { background: rgba(255,255,255,0.9); color: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background: #f4f4f4; }
        .badge { padding: 4px 8px; border-radius: 12px; color: white; font-size: 0.8em; }
        .iran { background: #e53e3e; }
        .usa { background: #3182ce; }
        .common { background: #718096; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Super Admin Dashboard</h1>
            <p>Team Iran vs USA - Game Management</p>
            <p>🟢 Server Status: Online | 📅 ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="stat">
                <div class="stat-value">${adminData.stats.total_users}</div>
                <div>Total Users</div>
            </div>
            <div class="stat">
                <div class="stat-value">${adminData.stats.total_battles}</div>
                <div>Total Battles</div>
            </div>
            <div class="stat">
                <div class="stat-value">${adminData.stats.total_weapons_sold}</div>
                <div>Weapons Sold</div>
            </div>
            <div class="stat">
                <div class="stat-value">$${adminData.stats.revenue_today.toLocaleString()}</div>
                <div>Today's Revenue</div>
            </div>
        </div>

        <div class="section">
            <h2>👥 Recent Users</h2>
            <table>
                <tr><th>Username</th><th>Faction</th><th>Level</th><th>STG Tokens</th><th>Win Rate</th></tr>
                ${adminData.users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td><span class="badge ${user.faction}">${user.faction.toUpperCase()}</span></td>
                        <td>${user.level}</td>
                        <td>${user.stg_tokens.toLocaleString()}</td>
                        <td>${user.win_rate}%</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🔫 Top Weapons</h2>
            <table>
                <tr><th>Weapon</th><th>Category</th><th>Faction</th><th>Rarity</th><th>Revenue</th></tr>
                ${adminData.weapons.map(weapon => `
                    <tr>
                        <td>${weapon.name}</td>
                        <td>${weapon.category}</td>
                        <td><span class="badge ${weapon.faction}">${weapon.faction.toUpperCase()}</span></td>
                        <td><span class="badge ${weapon.rarity}">${weapon.rarity.toUpperCase()}</span></td>
                        <td>$${weapon.revenue.toLocaleString()}</td>
                    </tr>
                `).join('')}
            </table>
        </div>

        <div class="section">
            <h2>🎛️ Admin Actions</h2>
            <p>Admin management tools available:</p>
            <ul>
                <li>👥 User Management</li>
                <li>🔫 Weapon Configuration</li>
                <li>⚡ Boost Pack Management</li>
                <li>💰 Revenue Analytics</li>
                <li>💾 Database Backup</li>
            </ul>
        </div>
    </div>
</body>
</html>`;

  res.end(html);
});

server.listen(PORT, () => {
  console.log(`🎮 Admin Dashboard running on http://localhost:${PORT}`);
  console.log(`🌐 Open your browser to: http://localhost:${PORT}`);
});
