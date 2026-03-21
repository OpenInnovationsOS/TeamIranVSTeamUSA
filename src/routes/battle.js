// Enhanced Battle API Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const BattleEngine = require('../engine/BattleEngine');
const BattleWebSocketServer = require('../websocket/battle-server');

// Initialize battle WebSocket server
let battleWS = null;

const initializeBattleServer = (server) => {
  if (!battleWS) {
    battleWS = new BattleWebSocketServer(server);
  }
};

// Queue for matchmaking
const battleQueue = new Map();

// POST /api/battle/initiate - Start new battle
router.post('/initiate', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const { opponentId, wager, weaponId, territoryId } = req.body;
    
    // Validate input
    if (!opponentId || !wager || !weaponId || !territoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required battle parameters'
      });
    }
    
    if (wager < 100) {
      return res.status(400).json({
        success: false,
        error: 'Minimum wager is 100 STG'
      });
    }
    
    // Check user balance
    const user = await getUserById(userId);
    if (user.stg_balance < wager) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient STG balance'
      });
    }
    
    // Get opponent data
    const opponent = await getUserById(opponentId);
    if (!opponent) {
      return res.status(404).json({
        success: false,
        error: 'Opponent not found'
      });
    }
    
    // Get weapon and territory data
    const weapon = await getWeaponById(weaponId);
    const territory = await getTerritoryById(territoryId);
    
    // Create battle instance
    const battle = new BattleEngine(user, opponent, weapon, territory);
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store battle in database
    await saveBattle(battleId, {
      player1_id: userId,
      player2_id: opponentId,
      wager,
      weapon_id: weaponId,
      territory_id: territoryId,
      status: 'active',
      created_at: new Date()
    });
    
    // Deduct wager from both players
    await updateUserBalance(userId, -wager);
    await updateUserBalance(opponentId, -wager);
    
    res.json({
      success: true,
      battleId,
      message: 'Battle initiated successfully',
      websocketUrl: `ws://localhost:3000/battle?token=${token}&battleId=${battleId}`
    });
    
  } catch (error) {
    console.error('Battle initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate battle'
    });
  }
});

// POST /api/battle/queue - Join matchmaking queue
router.post('/queue', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const { gameMode, wager, weaponId, territoryId } = req.body;
    
    // Remove from existing queue
    battleQueue.delete(userId);
    
    // Add to queue
    battleQueue.set(userId, {
      userId,
      gameMode: gameMode || 'standard',
      wager: wager || 100,
      weaponId: weaponId || 'basic_sword',
      territoryId: territoryId || 'tehran',
      joinedAt: Date.now()
    });
    
    // Try to find match
    const match = findMatch(userId);
    
    if (match) {
      // Create battle
      const battleId = await createBattleFromMatch(match);
      
      // Remove both players from queue
      battleQueue.delete(userId);
      battleQueue.delete(match.opponentId);
      
      res.json({
        success: true,
        battleId,
        opponent: match.opponent,
        message: 'Match found!',
        websocketUrl: `ws://localhost:3000/battle?token=${token}&battleId=${battleId}`
      });
    } else {
      res.json({
        success: true,
        message: 'Added to queue',
        queuePosition: getQueuePosition(userId),
        estimatedWaitTime: getEstimatedWaitTime(userId)
      });
    }
    
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join queue'
    });
  }
});

// DELETE /api/battle/queue - Leave matchmaking queue
router.delete('/queue', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    battleQueue.delete(userId);
    
    res.json({
      success: true,
      message: 'Removed from queue'
    });
    
  } catch (error) {
    console.error('Leave queue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave queue'
    });
  }
});

// GET /api/battle/queue - Get queue status
router.get('/queue', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const queueEntry = battleQueue.get(userId);
    
    if (queueEntry) {
      res.json({
        success: true,
        inQueue: true,
        queuePosition: getQueuePosition(userId),
        estimatedWaitTime: getEstimatedWaitTime(userId),
        gameMode: queueEntry.gameMode,
        wager: queueEntry.wager
      });
    } else {
      res.json({
        success: true,
        inQueue: false
      });
    }
    
  } catch (error) {
    console.error('Queue status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status'
    });
  }
});

// GET /api/battle/:battleId - Get battle state
router.get('/:battleId', async (req, res) => {
  try {
    const { battleId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    // Get battle from database
    const battle = await getBattleById(battleId);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }
    
    // Check if user is participant
    if (battle.player1_id !== userId && battle.player2_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this battle'
      });
    }
    
    res.json({
      success: true,
      battle: {
        id: battle.id,
        player1_id: battle.player1_id,
        player2_id: battle.player2_id,
        status: battle.status,
        current_turn: battle.current_turn,
        turn_count: battle.turn_count,
        winner_id: battle.winner_id,
        created_at: battle.created_at,
        completed_at: battle.completed_at
      }
    });
    
  } catch (error) {
    console.error('Get battle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get battle'
    });
  }
});

// POST /api/battle/:battleId/action - Execute battle action
router.post('/:battleId/action', async (req, res) => {
  try {
    const { battleId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const { action, target, data } = req.body;
    
    // Get battle
    const battle = await getBattleById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }
    
    // Check if it's user's turn
    if (battle.current_turn !== userId) {
      return res.status(400).json({
        success: false,
        error: 'Not your turn'
      });
    }
    
    // Execute action through battle engine
    const battleEngine = new BattleEngine(battle);
    const result = battleEngine.executeAction(userId, action, target, data);
    
    // Update battle in database
    await updateBattle(battleId, {
      current_turn: result.nextTurn,
      turn_count: battle.turn_count + 1,
      battle_data: result.battleState
    });
    
    // Check for battle end
    if (result.isOver) {
      await completeBattle(battleId, result.winner, result.rewards);
    }
    
    res.json({
      success: true,
      result,
      nextTurn: result.nextTurn
    });
    
  } catch (error) {
    console.error('Battle action error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute action'
    });
  }
});

// POST /api/battle/:battleId/surrender - Surrender battle
router.post('/:battleId/surrender', async (req, res) => {
  try {
    const { battleId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    // Get battle
    const battle = await getBattleById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }
    
    // Check if user is participant
    if (battle.player1_id !== userId && battle.player2_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to surrender this battle'
      });
    }
    
    // Determine winner (other player)
    const winnerId = battle.player1_id === userId ? battle.player2_id : battle.player1_id;
    
    // Complete battle with surrender
    await completeBattle(battleId, winnerId, {
      surrendered: true,
      surrendererId: userId
    });
    
    res.json({
      success: true,
      message: 'Battle surrendered',
      winner: winnerId
    });
    
  } catch (error) {
    console.error('Surrender error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to surrender'
    });
  }
});

// GET /api/battle/:battleId/spectate - Spectate battle
router.get('/:battleId/spectate', async (req, res) => {
  try {
    const { battleId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    // Get battle
    const battle = await getBattleById(battleId);
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }
    
    // Add to spectators
    await addSpectator(battleId, userId);
    
    res.json({
      success: true,
      battleId,
      websocketUrl: `ws://localhost:3000/battle?token=${token}&battleId=${battleId}&spectate=true`,
      message: 'Spectating battle'
    });
    
  } catch (error) {
    console.error('Spectate error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to spectate'
    });
  }
});

// GET /api/battle/history - Get battle history
router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const { limit = 10, offset = 0 } = req.query;
    
    const battles = await getUserBattleHistory(userId, limit, offset);
    
    res.json({
      success: true,
      battles,
      total: battles.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Battle history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get battle history'
    });
  }
});

// GET /api/battle/stats - Get battle statistics
router.get('/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    
    const stats = await getUserBattleStats(userId);
    
    res.json({
      success: true,
      stats: {
        totalBattles: stats.total_battles || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        winRate: stats.total_battles > 0 ? ((stats.wins / stats.total_battles) * 100).toFixed(2) : 0,
        averageWager: stats.average_wager || 0,
        totalEarnings: stats.total_earnings || 0,
        favoriteWeapon: stats.favorite_weapon,
        battleQuality: {
          domination: stats.domination_count || 0,
          victory: stats.victory_count || 0,
          win: stats.win_count || 0,
          struggle: stats.struggle_count || 0
        }
      }
    });
    
  } catch (error) {
    console.error('Battle stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get battle stats'
    });
  }
});

// Helper functions
function findMatch(userId) {
  const player = battleQueue.get(userId);
  if (!player) return null;
  
  // Find matching opponent
  for (const [opponentId, opponent] of battleQueue.entries()) {
    if (opponentId === userId) continue;
    
    // Check matching criteria
    if (player.gameMode === opponent.gameMode &&
        Math.abs(player.wager - opponent.wager) <= player.wager * 0.2) {
      return {
        opponentId,
        opponent: {
          id: opponentId,
          gameMode: opponent.gameMode,
          wager: opponent.wager
        }
      };
    }
  }
  
  return null;
}

function getQueuePosition(userId) {
  const queue = Array.from(battleQueue.entries());
  const position = queue.findIndex(([id]) => id === userId);
  return position >= 0 ? position + 1 : 0;
}

function getEstimatedWaitTime(userId) {
  const position = getQueuePosition(userId);
  const avgWaitTime = 30000; // 30 seconds average
  return position * avgWaitTime;
}

async function createBattleFromMatch(match) {
  const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create battle record
  await saveBattle(battleId, {
    player1_id: match.opponentId,
    player2_id: match.userId,
    status: 'active',
    created_at: new Date()
  });
  
  return battleId;
}

// Database helper functions (integrate with your existing database)
async function getUserById(userId) {
  // Get user from database
  return {
    id: userId,
    username: `Player${userId}`,
    faction: 'iran',
    level: 1,
    stg_balance: 1000,
    health: 100,
    mana: 50,
    attack: 10,
    defense: 5,
    speed: 10,
    critical: 0.05
  };
}

async function getWeaponById(weaponId) {
  // Get weapon from database
  return {
    id: weaponId,
    name: 'Basic Sword',
    power: 10,
    defense: 5,
    critical: 0.05
  };
}

async function getTerritoryById(territoryId) {
  // Get territory from database
  return {
    id: territoryId,
    name: 'Tehran',
    attack_bonus: 5,
    defense_bonus: 10,
    exp_bonus: 1.2
  };
}

async function saveBattle(battleId, battleData) {
  // Save battle to database
  console.log(`💾 Saving battle ${battleId}:`, battleData);
}

async function getBattleById(battleId) {
  // Get battle from database
  return {
    id: battleId,
    player1_id: 1,
    player2_id: 2,
    status: 'active',
    current_turn: 1,
    turn_count: 0,
    created_at: new Date()
  };
}

async function updateBattle(battleId, updates) {
  // Update battle in database
  console.log(`🔄 Updating battle ${battleId}:`, updates);
}

async function completeBattle(battleId, winnerId, results) {
  // Complete battle and award rewards
  console.log(`🏆 Completing battle ${battleId}, winner: ${winnerId}:`, results);
}

async function addSpectator(battleId, userId) {
  // Add spectator to battle
  console.log(`👁️ Adding spectator ${userId} to battle ${battleId}`);
}

async function getUserBattleHistory(userId, limit, offset) {
  // Get user's battle history
  return [];
}

async function getUserBattleStats(userId) {
  // Get user's battle statistics
  return {
    total_battles: 0,
    wins: 0,
    losses: 0,
    average_wager: 0,
    total_earnings: 0
  };
}

async function updateUserBalance(userId, amount) {
  // Update user's STG balance
  console.log(`💰 Updating balance for user ${userId}: ${amount}`);
}

module.exports = {
  router,
  initializeBattleServer
};
