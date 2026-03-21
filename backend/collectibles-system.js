const http = require('http');

const PORT = 9090;

// Comprehensive collectibles system for Team Iran vs USA platform
const collectiblesData = {
  // Weapon Collectibles
  weapons: {
    categories: ['pistol', 'rifle', 'sniper', 'shotgun', 'smg', 'lmg', 'explosive', 'melee', 'special'],
    rarities: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    total_collectibles: 100,
    collection_progress: {
      'player1': { collected: 45, percentage: 45, completion_bonus: 500 },
      'player2': { collected: 67, percentage: 67, completion_bonus: 1200 },
      'player3': { collected: 23, percentage: 23, completion_bonus: 200 }
    },
    special_editions: [
      {
        id: 'weapon_gold_001',
        name: 'Golden M4A1',
        base_weapon: 'M4A1',
        edition: 'gold',
        bonus_stats: { damage: 1.5, accuracy: 1.2 },
        limited_quantity: 100,
        current_owned: 23,
        price: 5000,
        unlock_requirement: { level: 50, achievements: ['master_marksman'] }
      },
      {
        id: 'weapon_diamond_001',
        name: 'Diamond SCAR-H',
        base_weapon: 'SCAR-H',
        edition: 'diamond',
        bonus_stats: { damage: 2.0, accuracy: 1.5, fire_rate: 1.3 },
        limited_quantity: 50,
        current_owned: 8,
        price: 10000,
        unlock_requirement: { level: 75, achievements: ['elite_warrior'] }
      }
    ],
    faction_exclusives: {
      iran: [
        { name: 'Zulfikar Elite', type: 'special', faction_bonus: '+15% damage vs USA' },
        { name: 'Desert Storm', type: 'rifle', faction_bonus: '+10% accuracy in desert maps' },
        { name: 'Persian Blade', type: 'melee', faction_bonus: '+20% critical hit chance' }
      ],
      usa: [
        { name: 'Patriot M4', type: 'rifle', faction_bonus: '+15% damage vs Iran' },
        { name: 'Eagle Eye', type: 'sniper', faction_bonus: '+20% range' },
        { name: 'Freedom Hammer', type: 'melee', faction_bonus: '+25% stun duration' }
      ]
    }
  },

  // Character Skins Collectibles
  character_skins: {
    categories: ['military', 'special_forces', 'elite', 'legendary', 'mythic'],
    total_collectibles: 75,
    collection_progress: {
      'player1': { collected: 12, percentage: 16, completion_bonus: 300 },
      'player2': { collected: 34, percentage: 45, completion_bonus: 800 },
      'player3': { collected: 8, percentage: 11, completion_bonus: 150 }
    },
    skins: [
      {
        id: 'skin_iran_elite_001',
        name: 'Iranian Elite Guard',
        faction: 'iran',
        rarity: 'elite',
        visual_effects: ['golden_trim', 'glowing_eyes', 'special_walk_animation'],
        stats_bonus: { health: 10, speed: 5 },
        price: 2500,
        unlock_requirement: { level: 30, faction_reputation: 500 }
      },
      {
        id: 'skin_usa_legendary_001',
        name: 'American Patriot',
        faction: 'usa',
        rarity: 'legendary',
        visual_effects: ['eagle_aura', 'flag_particles', 'victory_animation'],
        stats_bonus: { health: 20, speed: 10, damage: 5 },
        price: 5000,
        unlock_requirement: { level: 50, faction_reputation: 1000 }
      },
      {
        id: 'skin_mythic_001',
        name: 'Phoenix Warrior',
        faction: 'neutral',
        rarity: 'mythic',
        visual_effects: ['fire_aura', 'phoenix_wings', 'resurrection_effect'],
        stats_bonus: { health: 30, speed: 15, damage: 10, special_ability: 'phoenix_revive' },
        price: 15000,
        unlock_requirement: { level: 100, special_achievement: 'phoenix_rising' }
      }
    ],
    seasonal_skins: [
      {
        name: 'Ramadan Warrior',
        availability: 'ramadan_2026',
        special_effects: ['moon_glow', 'prayer_animation'],
        price: 3000
      },
      {
        name: 'Independence Hero',
        availability: 'july_4th_2026',
        special_effects: ['fireworks', 'flag_waving'],
        price: 4000
      }
    ]
  },

  // Achievement Collectibles
  achievements: {
    categories: ['combat', 'collection', 'social', 'tournament', 'special'],
    total_collectibles: 156,
    collection_progress: {
      'player1': { unlocked: 89, percentage: 57, completion_bonus: 1000 },
      'player2': { unlocked: 123, percentage: 79, completion_bonus: 2000 },
      'player3': { unlocked: 34, percentage: 22, completion_bonus: 400 }
    },
    achievements: [
      {
        id: 'ach_combat_001',
        name: 'First Blood',
        category: 'combat',
        description: 'Win your first battle',
        reward: { stg_tokens: 100, experience: 500, title: 'Rookie' },
        icon: 'blood_drop',
        rarity: 'common',
        unlocked_by: 15420
      },
      {
        id: 'ach_combat_002',
        name: 'Warrior Spirit',
        category: 'combat',
        description: 'Win 100 battles',
        reward: { stg_tokens: 1000, experience: 5000, title: 'Warrior' },
        icon: 'sword',
        rarity: 'uncommon',
        unlocked_by: 8920
      },
      {
        id: 'ach_collection_001',
        name: 'Weapon Collector',
        category: 'collection',
        description: 'Collect 50 different weapons',
        reward: { stg_tokens: 2000, special_weapon: 'collector_blade', title: 'Collector' },
        icon: 'weapon_rack',
        rarity: 'rare',
        unlocked_by: 2340
      },
      {
        id: 'ach_tournament_001',
        name: 'Champion',
        category: 'tournament',
        description: 'Win a major tournament',
        reward: { stg_tokens: 5000, exclusive_skin: 'champion_armor', title: 'Champion' },
        icon: 'trophy',
        rarity: 'epic',
        unlocked_by: 456
      },
      {
        id: 'ach_special_001',
        name: 'Living Legend',
        category: 'special',
        description: 'Reach level 100 and unlock all mythic items',
        reward: { stg_tokens: 10000, legendary_weapon: 'legendary_blade', title: 'Legend', special_ability: 'legendary_aura' },
        icon: 'crown',
        rarity: 'mythic',
        unlocked_by: 23
      }
    ],
    hidden_achievements: [
      {
        id: 'ach_hidden_001',
        name: 'Secret Master',
        description: 'Discover all hidden game mechanics',
        reward: { stg_tokens: 3000, secret_weapon: 'mystery_blade' },
        hint: 'Explore every corner of the battlefield'
      }
    ]
  },

  // Badge Collectibles
  badges: {
    categories: ['skill', 'rank', 'faction', 'event', 'special'],
    total_collectibles: 89,
    collection_progress: {
      'player1': { earned: 34, percentage: 38, completion_bonus: 600 },
      'player2': { earned: 56, percentage: 63, completion_bonus: 1200 },
      'player3': { earned: 12, percentage: 13, completion_bonus: 200 }
    },
    badges: [
      {
        id: 'badge_skill_001',
        name: 'Sharpshooter',
        category: 'skill',
        description: 'Achieve 90% accuracy in 10 battles',
        visual: 'crosshair_badge',
        bonus: '+5% accuracy bonus',
        rarity: 'uncommon'
      },
      {
        id: 'badge_rank_001',
        name: 'Elite Commander',
        category: 'rank',
        description: 'Reach rank 50',
        visual: 'star_badge',
        bonus: '+10% leadership bonus',
        rarity: 'rare'
      },
      {
        id: 'badge_faction_001',
        name: 'Iran Hero',
        category: 'faction',
        description: 'Reach maximum reputation with Iran faction',
        visual: 'iran_flag_badge',
        bonus: '+15% faction bonus',
        rarity: 'epic'
      },
      {
        id: 'badge_event_001',
        name: 'Tournament Champion 2026',
        category: 'event',
        description: 'Win the Spring Championship 2026',
        visual: 'trophy_badge',
        bonus: '+20% tournament bonus',
        rarity: 'legendary'
      }
    ]
  },

  // Emote Collectibles
  emotes: {
    categories: ['victory', 'defeat', 'celebration', 'taunt', 'special'],
    total_collectibles: 120,
    collection_progress: {
      'player1': { collected: 45, percentage: 38, completion_bonus: 400 },
      'player2': { collected: 78, percentage: 65, completion_bonus: 900 },
      'player3': { collected: 23, percentage: 19, completion_bonus: 200 }
    },
    emotes: [
      {
        id: 'emote_victory_001',
        name: 'Victory Dance',
        category: 'victory',
        animation: 'dance_with_gun',
        duration: 3.0,
        price: 500,
        unlock_requirement: { wins: 50 }
      },
      {
        id: 'emote_taunt_001',
        name: 'Respect Bow',
        category: 'taunt',
        animation: 'martial_arts_bow',
        duration: 2.0,
        price: 300,
        unlock_requirement: { level: 20 }
      },
      {
        id: 'emote_special_001',
        name: 'Phoenix Rise',
        category: 'special',
        animation: 'phoenix_resurrection',
        duration: 5.0,
        price: 2000,
        unlock_requirement: { achievement: 'phoenix_rising' }
      }
    ],
    faction_emotes: {
      iran: ['Persian Salute', 'Desert Victory', 'Eagle Cry'],
      usa: ['American Salute', 'Freedom Dance', 'Eagle Power']
    }
  },

  // Banner Collectibles
  banners: {
    categories: ['faction', 'achievement', 'tournament', 'seasonal', 'custom'],
    total_collectibles: 45,
    collection_progress: {
      'player1': { collected: 12, percentage: 27, completion_bonus: 300 },
      'player2': { collected: 28, percentage: 62, completion_bonus: 700 },
      'player3': { collected: 8, percentage: 18, completion_bonus: 150 }
    },
    banners: [
      {
        id: 'banner_faction_001',
        name: 'Iran Pride',
        category: 'faction',
        design: 'iran_flag_with_eagle',
        bonus: '+5% faction reputation gain',
        price: 1000,
        unlock_requirement: { faction_level: 25 }
      },
      {
        id: 'banner_tournament_001',
        name: 'Champion Banner',
        category: 'tournament',
        design: 'golden_trophy_with_stars',
        bonus: '+10% tournament rewards',
        price: 3000,
        unlock_requirement: { tournament_win: true }
      },
      {
        id: 'banner_seasonal_001',
        name: 'Spring Festival',
        category: 'seasonal',
        design: 'cherry_blossoms_with_weapons',
        bonus: '+15% experience during spring',
        price: 1500,
        availability: 'spring_2026'
      }
    ]
  },

  // Title Collectibles
  titles: {
    categories: ['rank', 'skill', 'faction', 'achievement', 'legendary'],
    total_collectibles: 67,
    collection_progress: {
      'player1': { collected: 23, percentage: 34, completion_bonus: 500 },
      'player2': { collected: 45, percentage: 67, completion_bonus: 1200 },
      'player3': { collected: 8, percentage: 12, completion_bonus: 150 }
    },
    titles: [
      {
        id: 'title_rank_001',
        name: 'Rookie',
        category: 'rank',
        display: '[Rookie] {username}',
        color: '#gray',
        unlock_requirement: { level: 1 }
      },
      {
        id: 'title_skill_001',
        name: 'Sharpshooter',
        category: 'skill',
        display: '[Sharpshooter] {username}',
        color: '#blue',
        unlock_requirement: { accuracy_achievement: true }
      },
      {
        id: 'title_faction_001',
        name: 'Iran Hero',
        category: 'faction',
        display: '[Iran Hero] {username}',
        color: '#red',
        unlock_requirement: { faction_reputation: 1000 }
      },
      {
        id: 'title_legendary_001',
        name: 'Living Legend',
        category: 'legendary',
        display: '[Living Legend] {username}',
        color: '#gold',
        unlock_requirement: { level: 100, all_collections_complete: true }
      }
    ]
  },

  // Special Items Collectibles
  special_items: {
    categories: ['consumables', 'boosters', 'special_abilities', 'legendary_artifacts'],
    total_collectibles: 34,
    collection_progress: {
      'player1': { collected: 15, percentage: 44, completion_bonus: 600 },
      'player2': { collected: 28, percentage: 82, completion_bonus: 1500 },
      'player3': { collected: 6, percentage: 18, completion_bonus: 200 }
    },
    items: [
      {
        id: 'item_consumable_001',
        name: 'Battle Energy Drink',
        category: 'consumables',
        effect: 'Instant energy refill +50% bonus',
        duration: 'instant',
        quantity: 5,
        price: 100
      },
      {
        id: 'item_booster_001',
        name: 'Double Experience',
        category: 'boosters',
        effect: '2x experience for 1 hour',
        duration: '1 hour',
        price: 500
      },
      {
        id: 'item_ability_001',
        name: 'Phoenix Feather',
        category: 'special_abilities',
        effect: 'Auto-revive once per battle',
        duration: 'permanent',
        price: 2000,
        limited_quantity: 100
      },
      {
        id: 'item_artifact_001',
        name: 'Ancient Warrior Stone',
        category: 'legendary_artifacts',
        effect: '+10% to all stats permanently',
        duration: 'permanent',
        price: 10000,
        limited_quantity: 10
      }
    ]
  },

  // Trading Card Collectibles
  trading_cards: {
    categories: ['weapon_cards', 'character_cards', 'event_cards', 'legendary_cards'],
    total_collectibles: 200,
    collection_progress: {
      'player1': { collected: 67, percentage: 34, completion_bonus: 800 },
      'player2': { collected: 123, percentage: 62, completion_bonus: 1800 },
      'player3': { collected: 34, percentage: 17, completion_bonus: 300 }
    },
    cards: [
      {
        id: 'card_weapon_001',
        name: 'M4A1 Elite',
        category: 'weapon_cards',
        rarity: 'epic',
        attack: 85,
        defense: 60,
        special_ability: 'rapid_fire',
        price: 800
      },
      {
        id: 'card_character_001',
        name: 'Elite Commander',
        category: 'character_cards',
        rarity: 'legendary',
        attack: 90,
        defense: 85,
        special_ability: 'leadership_aura',
        price: 2000
      },
      {
        id: 'card_event_001',
        name: 'Tournament Champion',
        category: 'event_cards',
        rarity: 'mythic',
        attack: 100,
        defense: 95,
        special_ability: 'victory_march',
        limited_edition: true,
        price: 5000
      }
    ],
    card_packs: [
      {
        name: 'Bronze Pack',
        price: 500,
        cards: 3,
        rarity_guarantee: 'common',
        bonus_chance: 'uncommon'
      },
      {
        name: 'Silver Pack',
        price: 1500,
        cards: 5,
        rarity_guarantee: 'uncommon',
        bonus_chance: 'rare'
      },
      {
        name: 'Gold Pack',
        price: 5000,
        cards: 10,
        rarity_guarantee: 'rare',
        bonus_chance: 'epic'
      },
      {
        name: 'Diamond Pack',
        price: 15000,
        cards: 15,
        rarity_guarantee: 'epic',
        bonus_chance: 'legendary'
      }
    ]
  }
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.url === '/' || req.url === '/collectibles') {
    const html = generateCollectiblesHTML();
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url.startsWith('/api/')) {
    handleCollectiblesAPI(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Page Not Found</h1><p><a href="/">Go to Collectibles Dashboard</a></p>');
  }
});

function generateCollectiblesHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Collectibles System - Team Iran vs USA</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            overflow-x: auto;
        }
        .container { max-width: 1800px; margin: 0 auto; padding: 20px; }
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
            text-align: center;
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
        .badge-common { background: #718096; }
        .badge-uncommon { background: #48bb78; }
        .badge-rare { background: #805ad5; }
        .badge-epic { background: #6366f1; }
        .badge-legendary { background: #f59e0b; }
        .badge-mythic { background: #dc2626; }
        .badge-iran { background: #e53e3e; }
        .badge-usa { background: #3182ce; }
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
        .item-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 20px;
        }
        .item-card { 
            background: rgba(255,255,255,0.95); 
            border-radius: 15px; 
            padding: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
            text-align: center;
        }
        .item-card:hover { transform: translateY(-5px); }
        .item-icon { font-size: 3em; margin-bottom: 10px; }
        .item-name { font-weight: bold; color: #4a5568; margin-bottom: 5px; }
        .item-price { color: #667eea; font-weight: bold; }
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
            .item-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
            .nav-tabs { flex-direction: column; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Collectibles System</h1>
            <p>Team Iran vs USA - Complete Collection Management</p>
            <p style="margin-top: 10px; color: #48bb78;">🟢 System Status: Online | 📅 Last Updated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showTab('overview')">📊 Overview</button>
            <button class="nav-tab" onclick="showTab('weapons')">🔫 Weapons</button>
            <button class="nav-tab" onclick="showTab('skins')">👤 Character Skins</button>
            <button class="nav-tab" onclick="showTab('achievements')">🏆 Achievements</button>
            <button class="nav-tab" onclick="showTab('badges')">🎖️ Badges</button>
            <button class="nav-tab" onclick="showTab('emotes')">😀 Emotes</button>
            <button class="nav-tab" onclick="showTab('banners')">🚩 Banners</button>
            <button class="nav-tab" onclick="showTab('titles')">🏷️ Titles</button>
            <button class="nav-tab" onclick="showTab('special')">⭐ Special Items</button>
            <button class="nav-tab" onclick="showTab('cards')">🃏 Trading Cards</button>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>🔫 Weapons</h3>
                    <div class="stat-value">${collectiblesData.weapons.total_collectibles}</div>
                    <div class="stat-label">Total weapons to collect</div>
                </div>
                <div class="stat-card">
                    <h3>👤 Character Skins</h3>
                    <div class="stat-value">${collectiblesData.character_skins.total_collectibles}</div>
                    <div class="stat-label">Total skins available</div>
                </div>
                <div class="stat-card">
                    <h3>🏆 Achievements</h3>
                    <div class="stat-value">${collectiblesData.achievements.total_collectibles}</div>
                    <div class="stat-label">Total achievements</div>
                </div>
                <div class="stat-card">
                    <h3>🎖️ Badges</h3>
                    <div class="stat-value">${collectiblesData.badges.total_collectibles}</div>
                    <div class="stat-label">Total badges</div>
                </div>
                <div class="stat-card">
                    <h3>😀 Emotes</h3>
                    <div class="stat-value">${collectiblesData.emotes.total_collectibles}</div>
                    <div class="stat-label">Total emotes</div>
                </div>
                <div class="stat-card">
                    <h3>🚩 Banners</h3>
                    <div class="stat-value">${collectiblesData.banners.total_collectibles}</div>
                    <div class="stat-label">Total banners</div>
                </div>
                <div class="stat-card">
                    <h3>🏷️ Titles</h3>
                    <div class="stat-value">${collectiblesData.titles.total_collectibles}</div>
                    <div class="stat-label">Total titles</div>
                </div>
                <div class="stat-card">
                    <h3>⭐ Special Items</h3>
                    <div class="stat-value">${collectiblesData.special_items.total_collectibles}</div>
                    <div class="stat-label">Total special items</div>
                </div>
                <div class="stat-card">
                    <h3>🃏 Trading Cards</h3>
                    <div class="stat-value">${collectiblesData.trading_cards.total_collectibles}</div>
                    <div class="stat-label">Total trading cards</div>
                </div>
                <div class="stat-card">
                    <h3>📊 Total Collectibles</h3>
                    <div class="stat-value">${Object.values(collectiblesData).reduce((sum, category) => sum + (category.total_collectibles || 0), 0)}</div>
                    <div class="stat-label">Across all categories</div>
                </div>
            </div>

            <div class="section">
                <h2>🏆 Collection Progress</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Weapons</th>
                            <th>Skins</th>
                            <th>Achievements</th>
                            <th>Badges</th>
                            <th>Overall Progress</th>
                            <th>Completion Bonus</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(collectiblesData.weapons.collection_progress).map(([player, progress]) => `
                            <tr>
                                <td><strong>${player}</strong></td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress.percentage}%;"></div>
                                    </div>
                                    ${progress.collected}/${collectiblesData.weapons.total_collectibles} (${progress.percentage}%)
                                </td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${collectiblesData.character_skins.collection_progress[player]?.percentage || 0}%;"></div>
                                    </div>
                                    ${collectiblesData.character_skins.collection_progress[player]?.collected || 0}/${collectiblesData.character_skins.total_collectibles} (${collectiblesData.character_skins.collection_progress[player]?.percentage || 0}%)
                                </td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${collectiblesData.achievements.collection_progress[player]?.percentage || 0}%;"></div>
                                    </div>
                                    ${collectiblesData.achievements.collection_progress[player]?.unlocked || 0}/${collectiblesData.achievements.total_collectibles} (${collectiblesData.achievements.collection_progress[player]?.percentage || 0}%)
                                </td>
                                <td>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${collectiblesData.badges.collection_progress[player]?.percentage || 0}%;"></div>
                                    </div>
                                    ${collectiblesData.badges.collection_progress[player]?.earned || 0}/${collectiblesData.badges.total_collectibles} (${collectiblesData.badges.collection_progress[player]?.percentage || 0}%)
                                </td>
                                <td><strong>${Math.round((progress.percentage + (collectiblesData.character_skins.collection_progress[player]?.percentage || 0) + (collectiblesData.achievements.collection_progress[player]?.percentage || 0) + (collectiblesData.badges.collection_progress[player]?.percentage || 0)) / 4)}%</strong></td>
                                <td><strong>${progress.completion_bonus} STG</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Weapons Tab -->
        <div id="weapons" class="tab-content">
            <div class="section">
                <h2>🔫 Weapon Collectibles</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Total Weapons</h3>
                        <div class="stat-value">${collectiblesData.weapons.total_collectibles}</div>
                        <div class="stat-label">Across ${collectiblesData.weapons.categories.length} categories</div>
                    </div>
                    <div class="stat-card">
                        <h3>Rarity Levels</h3>
                        <div class="stat-value">${collectiblesData.weapons.rarities.length}</div>
                        <div class="stat-label">From Common to Mythic</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>⭐ Special Editions</h2>
                <div class="item-grid">
                    ${collectiblesData.weapons.special_editions.map(weapon => `
                        <div class="item-card">
                            <div class="item-icon">🔫</div>
                            <div class="item-name">${weapon.name}</div>
                            <div class="item-price">${weapon.price} STG</div>
                            <div><span class="badge badge-${weapon.edition}">${weapon.edition.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${weapon.current_owned}/${weapon.limited_quantity} owned
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>🇮🇳🇺🇸 Faction Exclusives</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3>🇮🇳 Iran Exclusive</h3>
                        ${collectiblesData.weapons.faction_exclusives.iran.map(weapon => `
                            <div style="padding: 10px; margin: 5px 0; background: #f7fafc; border-radius: 8px;">
                                <strong>${weapon.name}</strong> - ${weapon.faction_bonus}
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <h3>🇺🇸 USA Exclusive</h3>
                        ${collectiblesData.weapons.faction_exclusives.usa.map(weapon => `
                            <div style="padding: 10px; margin: 5px 0; background: #f7fafc; border-radius: 8px;">
                                <strong>${weapon.name}</strong> - ${weapon.faction_bonus}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Character Skins Tab -->
        <div id="skins" class="tab-content">
            <div class="section">
                <h2>👤 Character Skins</h2>
                <div class="item-grid">
                    ${collectiblesData.character_skins.skins.map(skin => `
                        <div class="item-card">
                            <div class="item-icon">👤</div>
                            <div class="item-name">${skin.name}</div>
                            <div class="item-price">${skin.price} STG</div>
                            <div><span class="badge badge-${skin.rarity}">${skin.rarity.toUpperCase()}</span></div>
                            <div><span class="badge badge-${skin.faction}">${skin.faction.toUpperCase()}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>🎊 Seasonal Skins</h2>
                <div class="item-grid">
                    ${collectiblesData.character_skins.seasonal_skins.map(skin => `
                        <div class="item-card">
                            <div class="item-icon">🎊</div>
                            <div class="item-name">${skin.name}</div>
                            <div class="item-price">${skin.price} STG</div>
                            <div style="color: #f59e0b; font-weight: bold;">Limited Time</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Achievements Tab -->
        <div id="achievements" class="tab-content">
            <div class="section">
                <h2>🏆 Achievement Collectibles</h2>
                <div class="item-grid">
                    ${collectiblesData.achievements.achievements.map(achievement => `
                        <div class="item-card">
                            <div class="item-icon">${achievement.icon}</div>
                            <div class="item-name">${achievement.name}</div>
                            <div><span class="badge badge-${achievement.rarity}">${achievement.rarity.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${achievement.description}
                            </div>
                            <div style="margin-top: 5px; font-weight: bold; color: #667eea;">
                                ${achievement.reward.stg_tokens} STG + ${achievement.reward.experience} XP
                            </div>
                            <div style="margin-top: 5px; font-size: 0.8em; color: #48bb78;">
                                Unlocked by ${achievement.unlocked_by.toLocaleString()} players
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Badges Tab -->
        <div id="badges" class="tab-content">
            <div class="section">
                <h2>🎖️ Badge Collectibles</h2>
                <div class="item-grid">
                    ${collectiblesData.badges.badges.map(badge => `
                        <div class="item-card">
                            <div class="item-icon">🎖️</div>
                            <div class="item-name">${badge.name}</div>
                            <div><span class="badge badge-${badge.rarity}">${badge.rarity.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${badge.description}
                            </div>
                            <div style="margin-top: 5px; font-weight: bold; color: #667eea;">
                                ${badge.bonus}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Emotes Tab -->
        <div id="emotes" class="tab-content">
            <div class="section">
                <h2>😀 Emote Collectibles</h2>
                <div class="item-grid">
                    ${collectiblesData.emotes.emotes.map(emote => `
                        <div class="item-card">
                            <div class="item-icon">😀</div>
                            <div class="item-name">${emote.name}</div>
                            <div class="item-price">${emote.price} STG</div>
                            <div><span class="badge badge-${emote.category}">${emote.category.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                Duration: ${emote.duration}s
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Banners Tab -->
        <div id="banners" class="tab-content">
            <div class="section">
                <h2>🚩 Banner Collectibles</h2>
                <div class="item-grid">
                    ${collectiblesData.banners.banners.map(banner => `
                        <div class="item-card">
                            <div class="item-icon">🚩</div>
                            <div class="item-name">${banner.name}</div>
                            <div class="item-price">${banner.price} STG</div>
                            <div><span class="badge badge-${banner.category}">${banner.category.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${banner.bonus}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Titles Tab -->
        <div id="titles" class="tab-content">
            <div class="section">
                <h2>🏷️ Title Collectibles</h2>
                <div class="item-grid">
                    ${collectiblesData.titles.titles.map(title => `
                        <div class="item-card">
                            <div class="item-icon">🏷️</div>
                            <div class="item-name">${title.name}</div>
                            <div><span class="badge badge-${title.category}">${title.category.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                Display: ${title.display.replace('{username}', 'Player')}
                            </div>
                            <div style="margin-top: 5px; font-weight: bold; color: ${title.color};">
                                ${title.name}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Special Items Tab -->
        <div id="special" class="tab-content">
            <div class="section">
                <h2>⭐ Special Items</h2>
                <div class="item-grid">
                    ${collectiblesData.special_items.items.map(item => `
                        <div class="item-card">
                            <div class="item-icon">⭐</div>
                            <div class="item-name">${item.name}</div>
                            <div class="item-price">${item.price} STG</div>
                            <div><span class="badge badge-${item.category}">${item.category.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${item.effect}
                            </div>
                            <div style="margin-top: 5px; font-size: 0.8em; color: #48bb78;">
                                Duration: ${item.duration}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Trading Cards Tab -->
        <div id="cards" class="tab-content">
            <div class="section">
                <h2>🃏 Trading Cards</h2>
                <div class="item-grid">
                    ${collectiblesData.trading_cards.cards.map(card => `
                        <div class="item-card">
                            <div class="item-icon">🃏</div>
                            <div class="item-name">${card.name}</div>
                            <div class="item-price">${card.price} STG</div>
                            <div><span class="badge badge-${card.rarity}">${card.rarity.toUpperCase()}</span></div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ATK: ${card.attack} | DEF: ${card.defense}
                            </div>
                            <div style="margin-top: 5px; font-weight: bold; color: #667eea;">
                                ${card.special_ability}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>📦 Card Packs</h2>
                <div class="item-grid">
                    ${collectiblesData.trading_cards.card_packs.map(pack => `
                        <div class="item-card">
                            <div class="item-icon">📦</div>
                            <div class="item-name">${pack.name}</div>
                            <div class="item-price">${pack.price} STG</div>
                            <div style="margin-top: 10px; font-size: 0.9em; color: #718096;">
                                ${pack.cards} cards per pack
                            </div>
                            <div style="margin-top: 5px; font-size: 0.8em; color: #48bb78;">
                                Guarantee: ${pack.rarity_guarantee}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>

    <button class="refresh-btn" onclick="location.reload()">🔄</button>

    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
            
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        setTimeout(() => location.reload(), 30000);
        
        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(1.05)';
                setTimeout(() => this.style.transform = '', 200);
            });
        });
    </script>
</body>
</html>`;
}

function handleCollectiblesAPI(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url.includes('/api/collectibles/all')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData }));
  } else if (req.url.includes('/api/collectibles/weapons')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.weapons }));
  } else if (req.url.includes('/api/collectibles/skins')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.character_skins }));
  } else if (req.url.includes('/api/collectibles/achievements')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.achievements }));
  } else if (req.url.includes('/api/collectibles/badges')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.badges }));
  } else if (req.url.includes('/api/collectibles/emotes')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.emotes }));
  } else if (req.url.includes('/api/collectibles/banners')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.banners }));
  } else if (req.url.includes('/api/collectibles/titles')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.titles }));
  } else if (req.url.includes('/api/collectibles/special')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.special_items }));
  } else if (req.url.includes('/api/collectibles/cards')) {
    res.end(JSON.stringify({ success: true, data: collectiblesData.trading_cards }));
  } else {
    res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
  }
}

server.listen(PORT, () => {
  console.log(`🎮 Collectibles System running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
  console.log(`📊 Collectibles API: http://localhost:${PORT}/api/collectibles/all`);
  console.log(`🎮 Team Iran vs USA - Complete Collectibles Management`);
});

console.log('Starting collectibles system...');
