const { query, getClient } = require('../database/connection');
const { checkTapLimit, updateLeaderboard, getGameState, setGameState } = require('../utils/redis');
const User = require('../models/User');

class GameService {
  static async tapToEarn(userId) {
    try {
      // Check rate limit
      const tapCheck = await checkTapLimit(userId);
      if (!tapCheck.allowed) {
        throw new Error(`Rate limit exceeded. Max ${tapCheck.maxTaps} taps per minute.`);
      }

      const tapReward = parseInt(process.env.TAP_REWARD) || 5;
      
      // Update user balance
      const newBalance = await User.updateBalance(userId, tapReward, 'stg');
      
      // Add experience (1 XP per tap)
      const updatedUser = await User.addExperience(userId, 1);
      
      // Update leaderboard
      await updateLeaderboard('global', userId, newBalance);
      await updateLeaderboard(updatedUser.faction, userId, newBalance);
      
      // Get current game state
      const gameState = await getGameState(userId) || {};
      gameState.taps = (gameState.taps || 0) + 1;
      gameState.lastTap = new Date().toISOString();
      await setGameState(userId, gameState);

      return {
        success: true,
        reward: tapReward,
        newBalance,
        tapsRemaining: tapCheck.maxTaps - tapCheck.currentTaps,
        experience: updatedUser.experience,
        level: updatedUser.level
      };
    } catch (error) {
      throw new Error(`Tap to earn failed: ${error.message}`);
    }
  }

  static async initiateBattle(attackerId, defenderId, wager) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get users
      const attackerResult = await client.query(
        'SELECT * FROM users WHERE id = $1 FOR UPDATE',
        [attackerId]
      );
      const defenderResult = await client.query(
        'SELECT * FROM users WHERE id = $2 FOR UPDATE',
        [defenderId]
      );

      const attacker = attackerResult.rows[0];
      const defender = defenderResult.rows[0];

      if (!attacker || !defender) {
        throw new Error('User not found');
      }

      // Validate wager
      const minWager = parseInt(process.env.PVP_MIN_WAGER) || 100;
      if (wager < minWager) {
        throw new Error(`Minimum wager is ${minWager} STG`);
      }

      if (attacker.stg_balance < wager) {
        throw new Error('Insufficient STG balance');
      }

      if (defender.stg_balance < wager) {
        throw new Error('Defender has insufficient STG balance');
      }

      // Deduct wager from attacker
      await client.query(
        'UPDATE users SET stg_balance = stg_balance - $1 WHERE id = $2',
        [wager, attackerId]
      );

      // Create battle record
      const battleResult = await client.query(`
        INSERT INTO battles (attacker_id, defender_id, stg_wager, battle_type, status)
        VALUES ($1, $2, $3, 'pvp', 'active')
        RETURNING *
      `, [attackerId, defenderId, wager]);

      await client.query('COMMIT');

      // Notify defender via Telegram
      const telegramBot = require('../telegram/bot');
      await telegramBot.notifyUser(defender.telegram_id, 
        `⚔️ Battle Challenge!\n${attacker.first_name || attacker.username} has challenged you to a battle for ${wager} STG!\n\nClick here to accept: [Play Game](${process.env.TELEGRAM_WEBAPP_URL})`,
        { parse_mode: 'Markdown' }
      );

      return {
        success: true,
        battle: battleResult.rows[0],
        message: 'Battle initiated! Waiting for defender to accept.'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async acceptBattle(battleId, defenderId) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get battle
      const battleResult = await client.query(
        'SELECT * FROM battles WHERE id = $1 AND defender_id = $2 AND status = $3 FOR UPDATE',
        [battleId, defenderId, 'active']
      );

      const battle = battleResult.rows[0];
      if (!battle) {
        throw new Error('Battle not found or already processed');
      }

      // Get defender
      const defenderResult = await client.query(
        'SELECT * FROM users WHERE id = $1 FOR UPDATE',
        [defenderId]
      );

      const defender = defenderResult.rows[0];

      if (defender.stg_balance < battle.stg_wager) {
        throw new Error('Insufficient STG balance to accept battle');
      }

      // Deduct wager from defender
      await client.query(
        'UPDATE users SET stg_balance = stg_balance - $1 WHERE id = $2',
        [battle.stg_wager, defenderId]
      );

      // Calculate winner (simple random with faction bonus)
      const attackerResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [battle.attacker_id]
      );
      const attacker = attackerResult.rows[0];

      let winChance = 0.5; // Base 50% chance
      
      // Add faction bonus if same faction
      if (attacker.faction === defender.faction) {
        winChance = 0.5; // No bonus for same faction
      } else {
        // Slight bonus based on level difference
        const levelDiff = attacker.level - defender.level;
        winChance = 0.5 + (levelDiff * 0.02); // 2% per level difference
        winChance = Math.max(0.1, Math.min(0.9, winChance)); // Clamp between 10% and 90%
      }

      const attackerWins = Math.random() < winChance;
      const winnerId = attackerWins ? battle.attacker_id : defenderId;
      const totalPot = battle.stg_wager * 2;

      // Award winnings to winner
      await client.query(
        'UPDATE users SET stg_balance = stg_balance + $1 WHERE id = $2',
        [totalPot, winnerId]
      );

      // Update battle record
      await client.query(`
        UPDATE battles 
        SET winner_id = $1, status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [winnerId, battleId]);

      // Add experience to both players
      await User.addExperience(battle.attacker_id, 10);
      await User.addExperience(defenderId, 10);

      // Add bonus experience to winner
      await User.addExperience(winnerId, 20);

      await client.query('COMMIT');

      // Get winner details for notification
      const winnerResult = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [winnerId]
      );
      const winner = winnerResult.rows[0];

      // Notify both players
      const telegramBot = require('../telegram/bot');
      const battleResultMessage = `⚔️ Battle Result!\nWinner: ${winner.first_name || winner.username}\nPrize: ${totalPot} STG\n\nThanks for playing!`;

      await telegramBot.notifyUser(attacker.telegram_id, battleResultMessage);
      await telegramBot.notifyUser(defender.telegram_id, battleResultMessage);

      return {
        success: true,
        winnerId,
        winner: winner.first_name || winner.username,
        prize: totalPot,
        attackerWins
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getBattleHistory(userId, limit = 10) {
    const result = await query(`
      SELECT 
        b.*,
        attacker.first_name as attacker_name,
        attacker.username as attacker_username,
        defender.first_name as defender_name,
        defender.username as defender_username,
        winner.first_name as winner_name,
        winner.username as winner_username
      FROM battles b
      LEFT JOIN users attacker ON b.attacker_id = attacker.id
      LEFT JOIN users defender ON b.defender_id = defender.id
      LEFT JOIN users winner ON b.winner_id = winner.id
      WHERE b.attacker_id = $1 OR b.defender_id = $1
      ORDER BY b.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  static async getUserStats(userId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = $1 THEN 1 END) as battles_won,
        SUM(CASE WHEN winner_id = $1 THEN stg_wager * 2 ELSE -stg_wager END) as net_winnings,
        AVG(stg_wager) as average_wager
      FROM battles
      WHERE (attacker_id = $1 OR defender_id = $1) AND status = 'completed'
    `, [userId]);

    return result.rows[0];
  }

  static async getAvailableOpponents(userId, faction = null, limit = 10) {
    let queryText = `
      SELECT id, username, first_name, faction, stg_balance, level
      FROM users
      WHERE id != $1 AND is_active = true AND stg_balance >= $2
    `;
    let params = [userId, parseInt(process.env.PVP_MIN_WAGER) || 100];

    if (faction) {
      queryText += ' AND faction = $' + (params.length + 1);
      params.push(faction);
    }

    queryText += ' ORDER BY stg_balance DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await query(queryText, params);
    return result.rows;
  }
}

module.exports = GameService;
