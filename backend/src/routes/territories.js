const express = require('express');
const router = express.Router();
const Territory = require('../models/Territory');
const Battle = require('../models/Battle');
const User = require('../models/User');
const Guild = require('../models/Guild');
const auth = require('../middleware/auth');
const { broadcastToUser, broadcastToAll } = require('../websocket/server');

// Get all territories
router.get('/', async (req, res) => {
  try {
    const { region, controller, faction } = req.query;
    
    let query = { 'status.is_active': true };
    
    if (region) {
      query['location.region'] = region;
    }
    
    if (controller) {
      query['control.current_controller'] = controller;
    }
    
    const territories = await Territory.find(query)
      .sort({ 'characteristics.strategic_value': -1 });
    
    res.json({
      success: true,
      data: territories
    });
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch territories' }
    });
  }
});

// Get world map
router.get('/world-map', async (req, res) => {
  try {
    const worldMap = await Territory.getWorldMap();
    
    res.json({
      success: true,
      data: worldMap
    });
  } catch (error) {
    console.error('Error fetching world map:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch world map' }
    });
  }
});

// Get territory by ID
router.get('/:id', async (req, res) => {
  try {
    const territory = await Territory.findById(req.params.id)
      .populate('control.guild_controller', 'name tag');
    
    if (!territory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Territory not found' }
      });
    }
    
    res.json({
      success: true,
      data: territory
    });
  } catch (error) {
    console.error('Error fetching territory:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch territory' }
    });
  }
});

// Get attackable territories for user's faction
router.get('/attackable/:faction', async (req, res) => {
  try {
    const faction = req.params.faction;
    
    if (!['iran', 'usa'].includes(faction)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid faction' }
      });
    }
    
    const territories = await Territory.getAttackableTerritories(faction);
    
    res.json({
      success: true,
      data: territories
    });
  } catch (error) {
    console.error('Error fetching attackable territories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch attackable territories' }
    });
  }
});

// Attack territory
router.post('/:id/attack', auth, async (req, res) => {
  try {
    const { stake_amount, weapon_selection } = req.body;
    
    const territory = await Territory.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!territory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Territory not found' }
      });
    }
    
    // Check if territory can be attacked
    if (!territory.canBeAttacked) {
      return res.status(400).json({
        success: false,
        error: { message: 'Territory cannot be attacked at this time' }
      });
    }
    
    // Check if user is in same faction as current controller (can't attack own faction)
    if (territory.control.current_controller === user.faction) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot attack territory controlled by your faction' }
      });
    }
    
    // Check stake amount
    if (stake_amount > user.stg_balance) {
      return res.status(400).json({
        success: false,
        error: { message: 'Insufficient STG balance' }
      });
    }
    
    // Start conflict
    await territory.startConflict(user.faction, territory.control.current_controller);
    
    // Create territory battle
    const battle_id = `territory_battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const battle = new Battle({
      battle_id,
      players: [
        {
          user_id: user._id,
          telegram_id: user.telegram_id,
          username: user.username,
          faction: user.faction,
          level: user.level,
          current_health: 100,
          max_health: 100,
          energy: 50,
          max_energy: 50
        }
      ],
      battle_config: {
        stake_amount: stake_amount,
        battle_type: 'territory',
        fee_amount: Math.floor(stake_amount * 0.05),
        territory_id: territory._id
      },
      status: 'pending'
    });
    
    await battle.save();
    
    // Add to matchmaking queue for territory defense
    // This would typically find a defender from the defending faction
    
    // Broadcast territory attack
    broadcastToAll({
      type: 'territory_attacked',
      territory: {
        id: territory._id,
        territory_id: territory.territory_id,
        name: territory.name,
        location: territory.location,
        attacker: {
          id: user._id,
          username: user.username,
          faction: user.faction
        },
        defender: territory.control.current_controller,
        battle_id: battle.battle_id
      },
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Territory attack initiated',
      data: {
        territory: territory,
        battle: battle,
        battle_bonuses: territory.getBattleBonuses(user.faction, territory.control.current_controller)
      }
    });
  } catch (error) {
    console.error('Error attacking territory:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to attack territory' }
    });
  }
});

// Get territory statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Territory.getTerritoryStats();
    
    // Get additional stats
    const totalTerritories = await Territory.countDocuments({ 'status.is_active': true });
    const contestedTerritories = await Territory.countDocuments({ 'status.is_contested': true });
    
    const overview = {
      total_territories: totalTerritories,
      contested_territories: contestedTerritories,
      control_stats: stats.reduce((acc, stat) => {
        acc[stat._id] = stat;
        return acc;
      }, {}),
      strategic_distribution: stats.map(stat => ({
        controller: stat._id,
        strategic_value: stat.total_strategic_value,
        control_strength: stat.average_control_strength
      }))
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error fetching territory stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch territory statistics' }
    });
  }
});

// Get territory history
router.get('/:id/history', async (req, res) => {
  try {
    const territory = await Territory.findById(req.params.id);
    
    if (!territory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Territory not found' }
      });
    }
    
    const { limit = 20, page = 1 } = req.query;
    
    const history = territory.conflict_history
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        history: history,
        total: territory.conflict_history.length,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(territory.conflict_history.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching territory history:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch territory history' }
    });
  }
});

// Upgrade territory (guild leader only)
router.post('/:id/upgrade', auth, async (req, res) => {
  try {
    const { upgrade_type } = req.body;
    
    const territory = await Territory.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!territory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Territory not found' }
      });
    }
    
    // Check if user's guild controls this territory
    if (!territory.control.guild_controller || 
        territory.control.guild_controller.toString() !== user.guild_id?.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your guild does not control this territory' }
      });
    }
    
    // Check if user is guild leader or officer
    const guild = await Guild.findById(user.guild_id);
    const member = guild?.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!member || !['leader', 'officer'].includes(member.rank)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions to upgrade territory' }
      });
    }
    
    // Calculate upgrade cost
    const upgradeCosts = {
      level: 10000 * territory.upgrades.level,
      fortifications: 5000 * (territory.upgrades.fortifications + 1),
      resource_extraction: 7500 * (territory.upgrades.resource_extraction + 1),
      military_base: 50000,
      research_facility: 75000,
      trade_hub: 60000
    };
    
    const cost = upgradeCosts[upgrade_type];
    
    if (!cost) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid upgrade type' }
      });
    }
    
    // Check guild treasury
    if (guild.resources.stg_treasury < cost) {
      return res.status(400).json({
        success: false,
        error: { message: `Insufficient guild treasury. Required: ${cost} STG` }
      });
    }
    
    // Deduct cost and upgrade
    guild.resources.stg_treasury -= cost;
    await guild.save();
    
    await territory.upgrade(upgrade_type);
    
    // Broadcast upgrade
    broadcastToAll({
      type: 'territory_upgraded',
      territory: {
        id: territory._id,
        territory_id: territory.territory_id,
        name: territory.name,
        upgrade_type: upgrade_type,
        new_level: territory.upgrades[upgrade_type] || territory.upgrades.level,
        guild: {
          id: guild._id,
          name: guild.name,
          tag: guild.tag
        }
      },
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Territory upgraded successfully',
      data: {
        upgrade_type: upgrade_type,
        new_level: territory.upgrades[upgrade_type] || territory.upgrades.level,
        cost: cost,
        remaining_treasury: guild.resources.stg_treasury
      }
    });
  } catch (error) {
    console.error('Error upgrading territory:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to upgrade territory' }
    });
  }
});

// Collect territory resources (guild leader only)
router.post('/:id/collect', auth, async (req, res) => {
  try {
    const territory = await Territory.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!territory) {
      return res.status(404).json({
        success: false,
        error: { message: 'Territory not found' }
      });
    }
    
    // Check if user's guild controls this territory
    if (!territory.control.guild_controller || 
        territory.control.guild_controller.toString() !== user.guild_id?.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Your guild does not control this territory' }
      });
    }
    
    // Check if user is guild leader or officer
    const guild = await Guild.findById(user.guild_id);
    const member = guild?.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!member || !['leader', 'officer'].includes(member.rank)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions to collect resources' }
      });
    }
    
    // Collect resources
    const collectedResources = territory.collectResources();
    
    if (collectedResources.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No resources available to collect' }
      });
    }
    
    // Add resources to guild treasury
    const totalSTG = collectedResources.reduce((sum, resource) => {
      if (resource.type === 'stg') {
        return sum + resource.amount;
      }
      return sum;
    }, 0);
    
    if (totalSTG > 0) {
      guild.resources.stg_treasury += totalSTG;
      await guild.save();
    }
    
    await territory.save();
    
    res.json({
      success: true,
      message: 'Resources collected successfully',
      data: {
        collected_resources: collectedResources,
        total_stg: totalSTG,
        new_treasury_balance: guild.resources.stg_treasury
      }
    });
  } catch (error) {
    console.error('Error collecting territory resources:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to collect resources' }
    });
  }
});

// Get territories controlled by guild
router.get('/guild/:guildId', async (req, res) => {
  try {
    const territories = await Territory.find({ 
      'control.guild_controller': req.params.guildId,
      'status.is_active': true 
    }).sort({ 'characteristics.strategic_value': -1 });
    
    res.json({
      success: true,
      data: territories
    });
  } catch (error) {
    console.error('Error fetching guild territories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch guild territories' }
    });
  }
});

// Initialize territories (admin only)
router.post('/initialize', async (req, res) => {
  try {
    await Territory.initializeTerritories();
    
    res.json({
      success: true,
      message: 'Territories initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing territories:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to initialize territories' }
    });
  }
});

module.exports = router;
