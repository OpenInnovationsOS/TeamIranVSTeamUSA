// Complete API Routes for Inventory System
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/team_iran_vs_usa'
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// === WEAPONS API ===

// GET /api/inventory/weapons - Get user's weapon inventory
router.get('/weapons', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, rarity, equipped } = req.query;
    
    let query = `
      SELECT 
        uw.*,
        w.name,
        w.description,
        w.category,
        w.rarity,
        w.faction,
        w.base_damage,
        w.base_accuracy,
        w.base_fire_rate,
        w.base_range,
        w.max_level,
        w.upgrade_slots,
        w.icon,
        w.gradient,
        w.base_price
      FROM user_weapons uw
      JOIN weapons w ON uw.weapon_id = w.weapon_id
      WHERE uw.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (category) {
      query += ` AND w.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (rarity) {
      query += ` AND w.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }
    
    if (equipped !== undefined) {
      query += ` AND uw.is_equipped = $${paramIndex}`;
      params.push(equipped === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY uw.acquired_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      weapons: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get weapons error:', error);
    res.status(500).json({ success: false, error: 'Failed to get weapons' });
  }
});

// POST /api/inventory/weapons/equip - Equip a weapon
router.post('/weapons/equip', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weaponId } = req.body;
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Unequip all weapons in the same category
    await pool.query(`
      UPDATE user_weapons 
      SET is_equipped = false 
      WHERE user_id = $1 
      AND weapon_id IN (
        SELECT weapon_id FROM weapons WHERE category = (
          SELECT category FROM weapons WHERE weapon_id = $2
        )
      )
    `, [userId, weaponId]);
    
    // Equip the selected weapon
    await pool.query(`
      UPDATE user_weapons 
      SET is_equipped = true, last_used_at = NOW() 
      WHERE user_id = $1 AND weapon_id = $2
    `, [userId, weaponId]);
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Weapon equipped successfully'
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Equip weapon error:', error);
    res.status(500).json({ success: false, error: 'Failed to equip weapon' });
  }
});

// POST /api/inventory/weapons/upgrade - Upgrade a weapon
router.post('/weapons/upgrade', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weaponId, upgradeType } = req.body;
    
    // Get weapon and upgrade cost
    const weaponResult = await pool.query(`
      SELECT uw.*, w.base_price, w.upgrade_cost_multiplier
      FROM user_weapons uw
      JOIN weapons w ON uw.weapon_id = w.weapon_id
      WHERE uw.user_id = $1 AND uw.weapon_id = $2
    `, [userId, weaponId]);
    
    if (weaponResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Weapon not found' });
    }
    
    const weapon = weaponResult.rows[0];
    const upgradeCost = Math.round(weapon.base_price * weapon.upgrade_cost_multiplier * weapon.current_level);
    
    // Check user balance
    const userResult = await pool.query(
      'SELECT stg_balance FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows[0].stg_balance < upgradeCost) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Deduct cost
    await pool.query(`
      UPDATE users 
      SET stg_balance = stg_balance - $1 
      WHERE id = $2
    `, [upgradeCost, userId]);
    
    // Upgrade weapon
    const newLevel = weapon.current_level + 1;
    const newMaxExperience = newLevel * 200;
    
    await pool.query(`
      UPDATE user_weapons 
      SET current_level = $1, experience = 0, max_experience = $2, updated_at = NOW()
      WHERE user_id = $3 AND weapon_id = $4
    `, [newLevel, newMaxExperience, userId, weaponId]);
    
    // Apply upgrade effects
    let updateQuery = '';
    let updateParams = [userId, weaponId];
    
    switch (upgradeType) {
      case 'damage':
        updateQuery = 'UPDATE user_weapons SET custom_damage = COALESCE(custom_damage, base_damage) + 5 WHERE user_id = $1 AND weapon_id = $2';
        break;
      case 'accuracy':
        updateQuery = 'UPDATE user_weapons SET custom_accuracy = COALESCE(custom_accuracy, base_accuracy) + 3 WHERE user_id = $1 AND weapon_id = $2';
        break;
      case 'fire_rate':
        updateQuery = 'UPDATE user_weapons SET custom_fire_rate = COALESCE(custom_fire_rate, base_fire_rate) + 4 WHERE user_id = $1 AND weapon_id = $2';
        break;
      case 'durability':
        updateQuery = 'UPDATE user_weapons SET durability = 100 WHERE user_id = $1 AND weapon_id = $2';
        break;
    }
    
    if (updateQuery) {
      await pool.query(updateQuery, updateParams);
    }
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Weapon upgraded successfully',
      newLevel,
      upgradeCost
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Upgrade weapon error:', error);
    res.status(500).json({ success: false, error: 'Failed to upgrade weapon' });
  }
});

// === SKINS API ===

// GET /api/inventory/skins - Get user's skin inventory
router.get('/skins', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, rarity, equipped } = req.query;
    
    let query = `
      SELECT 
        us.*,
        s.name,
        s.description,
        s.category,
        s.rarity,
        s.faction,
        s.health_bonus,
        s.speed_bonus,
        s.damage_bonus,
        s.defense_bonus,
        s.icon,
        s.gradient,
        s.base_price
      FROM user_skins us
      JOIN character_skins s ON us.skin_id = s.skin_id
      WHERE us.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (category) {
      query += ` AND s.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (rarity) {
      query += ` AND s.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }
    
    if (equipped !== undefined) {
      query += ` AND us.is_equipped = $${paramIndex}`;
      params.push(equipped === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY us.acquired_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      skins: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get skins error:', error);
    res.status(500).json({ success: false, error: 'Failed to get skins' });
  }
});

// POST /api/inventory/skins/equip - Equip a skin
router.post('/skins/equip', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { skinId } = req.body;
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Unequip all skins
    await pool.query(`
      UPDATE user_skins 
      SET is_equipped = false 
      WHERE user_id = $1
    `, [userId]);
    
    // Equip the selected skin
    await pool.query(`
      UPDATE user_skins 
      SET is_equipped = true, last_equipped_at = NOW(), times_equipped = times_equipped + 1
      WHERE user_id = $1 AND skin_id = $2
    `, [userId, skinId]);
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Skin equipped successfully'
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Equip skin error:', error);
    res.status(500).json({ success: false, error: 'Failed to equip skin' });
  }
});

// === COLLECTIBLES API ===

// GET /api/inventory/collectibles - Get user's collectibles
router.get('/collectibles', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, rarity, collection_set } = req.query;
    
    let query = `
      SELECT 
        uc.*,
        c.name,
        c.description,
        c.category,
        c.rarity,
        c.collection_set,
        c.prestige_bonus,
        c.luck_bonus,
        c.experience_bonus,
        c.icon,
        c.gradient,
        c.base_price
      FROM user_collectibles uc
      JOIN collectibles c ON uc.collectible_id = c.collectible_id
      WHERE uc.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (category) {
      query += ` AND c.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (rarity) {
      query += ` AND c.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }
    
    if (collection_set) {
      query += ` AND c.collection_set = $${paramIndex}`;
      params.push(collection_set);
      paramIndex++;
    }
    
    query += ` ORDER BY uc.acquired_at DESC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      collectibles: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get collectibles error:', error);
    res.status(500).json({ success: false, error: 'Failed to get collectibles' });
  }
});

// === ACHIEVEMENTS API ===

// GET /api/inventory/achievements - Get user's achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, rarity, completed } = req.query;
    
    let query = `
      SELECT 
        ua.*,
        a.name,
        a.description,
        a.category,
        a.rarity,
        a.requirement_type,
        a.requirement_target,
        a.stg_reward,
        a.experience_reward,
        a.icon,
        a.gradient
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.achievement_id
      WHERE ua.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (category) {
      query += ` AND a.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (rarity) {
      query += ` AND a.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }
    
    if (completed !== undefined) {
      query += ` AND ua.is_completed = $${paramIndex}`;
      params.push(completed === 'true');
      paramIndex++;
    }
    
    query += ` ORDER BY ua.completed_at DESC NULLS LAST, ua.started_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Calculate completion stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_completed THEN 1 END) as completed,
        SUM(stg_reward) FILTER (WHERE is_completed AND NOT stg_reward_claimed) as unclaimed_stg,
        SUM(experience_reward) FILTER (WHERE is_completed AND NOT item_rewards_claimed) as unclaimed_exp
      FROM user_achievements 
      WHERE user_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];
    
    res.json({
      success: true,
      achievements: result.rows,
      stats: {
        total: stats.total,
        completed: stats.completed,
        completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        unclaimed_stg: stats.unclaimed_stg || 0,
        unclaimed_exp: stats.unclaimed_exp || 0
      }
    });
    
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ success: false, error: 'Failed to get achievements' });
  }
});

// POST /api/inventory/achievements/claim - Claim achievement rewards
router.post('/achievements/claim', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.body;
    
    // Get achievement and user progress
    const result = await pool.query(`
      SELECT ua.*, a.stg_reward, a.experience_reward
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.achievement_id
      WHERE ua.user_id = $1 AND ua.achievement_id = $2 AND ua.is_completed = true
    `, [userId, achievementId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Achievement not found or not completed' });
    }
    
    const userAchievement = result.rows[0];
    
    if (userAchievement.stg_reward_claimed && userAchievement.item_rewards_claimed) {
      return res.status(400).json({ success: false, error: 'Rewards already claimed' });
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Award STG if not claimed
    let stgAwarded = 0;
    if (!userAchievement.stg_reward_claimed && userAchievement.stg_reward > 0) {
      await pool.query(`
        UPDATE users 
        SET stg_balance = stg_balance + $1 
        WHERE id = $2
      `, [userAchievement.stg_reward, userId]);
      
      await pool.query(`
        UPDATE user_achievements 
        SET stg_reward_claimed = true 
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievementId]);
      
      stgAwarded = userAchievement.stg_reward;
    }
    
    // Award experience if not claimed
    let expAwarded = 0;
    if (!userAchievement.item_rewards_claimed && userAchievement.experience_reward > 0) {
      await pool.query(`
        UPDATE users 
        SET experience = experience + $1 
        WHERE id = $2
      `, [userAchievement.experience_reward, userId]);
      
      await pool.query(`
        UPDATE user_achievements 
        SET item_rewards_claimed = true 
        WHERE user_id = $1 AND achievement_id = $2
      `, [userId, achievementId]);
      
      expAwarded = userAchievement.experience_reward;
    }
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      stgAwarded,
      expAwarded
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Claim achievement error:', error);
    res.status(500).json({ success: false, error: 'Failed to claim rewards' });
  }
});

// === SHOP API ===

// GET /api/inventory/shop - Get shop items
router.get('/shop', async (req, res) => {
  try {
    const { category, rarity, featured, min_price, max_price } = req.query;
    
    let query = `
      SELECT 
        si.*,
        CASE 
          WHEN si.stock_quantity = -1 THEN 'Unlimited'
          ELSE si.stock_quantity::text
        END as stock_display
      FROM shop_items si
      WHERE si.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND si.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (rarity) {
      query += ` AND si.rarity = $${paramIndex}`;
      params.push(rarity);
      paramIndex++;
    }
    
    if (featured !== undefined) {
      query += ` AND si.is_featured = $${paramIndex}`;
      params.push(featured === 'true');
      paramIndex++;
    }
    
    if (min_price) {
      query += ` AND si.current_price >= $${paramIndex}`;
      params.push(min_price);
      paramIndex++;
    }
    
    if (max_price) {
      query += ` AND si.current_price <= $${paramIndex}`;
      params.push(max_price);
      paramIndex++;
    }
    
    // Check time-based availability
    query += ` AND (si.available_from IS NULL OR si.available_from <= NOW())`;
    query += ` AND (si.available_until IS NULL OR si.available_until >= NOW())`;
    
    query += ` ORDER BY si.is_featured DESC, si.is_new DESC, si.current_price ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      items: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({ success: false, error: 'Failed to get shop items' });
  }
});

// POST /api/inventory/shop/purchase - Purchase item
router.post('/shop/purchase', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId, quantity = 1 } = req.body;
    
    // Get item and user
    const itemResult = await pool.query(`
      SELECT si.*, u.stg_balance
      FROM shop_items si
      JOIN users u ON u.id = $1
      WHERE si.item_id = $2 AND si.is_active = true
    `, [userId, itemId]);
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    const item = itemResult.rows[0];
    const totalPrice = item.current_price * quantity;
    
    // Check stock
    if (item.stock_quantity !== -1 && item.stock_quantity < quantity) {
      return res.status(400).json({ success: false, error: 'Insufficient stock' });
    }
    
    // Check user balance
    if (item.stg_balance < totalPrice) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    // Check purchase limits
    if (item.max_purchase_per_user !== -1) {
      const purchaseCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM user_purchases
        WHERE user_id = $1 AND item_id = $2
      `, [userId, itemId]);
      
      if (purchaseCount.rows[0].count >= item.max_purchase_per_user) {
        return res.status(400).json({ success: false, error: 'Purchase limit reached' });
      }
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Deduct balance
    await pool.query(`
      UPDATE users 
      SET stg_balance = stg_balance - $1 
      WHERE id = $2
    `, [totalPrice, userId]);
    
    // Update stock
    if (item.stock_quantity !== -1) {
      await pool.query(`
        UPDATE shop_items 
        SET stock_quantity = stock_quantity - $1, sold_quantity = sold_quantity + $1
        WHERE item_id = $2
      `, [quantity, itemId]);
    } else {
      await pool.query(`
        UPDATE shop_items 
        SET sold_quantity = sold_quantity + $1
        WHERE item_id = $2
      `, [quantity, itemId]);
    }
    
    // Create purchase record
    await pool.query(`
      INSERT INTO user_purchases (user_id, item_id, quantity, price_paid, status)
      VALUES ($1, $2, $3, $4, 'completed')
    `, [userId, itemId, quantity, totalPrice]);
    
    // Add item to user inventory based on type
    switch (item.item_type) {
      case 'weapon':
        await pool.query(`
          INSERT INTO user_weapons (user_id, weapon_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, weapon_id) DO UPDATE SET
            quantity = user_weapons.quantity + EXCLUDED.quantity
        `, [userId, item.reference_id, quantity]);
        break;
        
      case 'skin':
        await pool.query(`
          INSERT INTO user_skins (user_id, skin_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, skin_id) DO NOTHING
        `, [userId, item.reference_id]);
        break;
        
      case 'collectible':
        await pool.query(`
          INSERT INTO user_collectibles (user_id, collectible_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id, collectible_id) DO UPDATE SET
            quantity = user_collectibles.quantity + EXCLUDED.quantity
        `, [userId, item.reference_id, quantity]);
        break;
    }
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Purchase successful',
      item: {
        name: item.name,
        quantity,
        totalPrice
      }
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to purchase item' });
  }
});

// === CRAFTING API ===

// GET /api/inventory/crafting/recipes - Get crafting recipes
router.get('/crafting/recipes', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;
    
    let query = `
      SELECT cr.*, 
             CASE WHEN um.quantity IS NOT NULL THEN true ELSE false END as has_materials
      FROM crafting_recipes cr
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as quantity
        FROM user_materials um
        WHERE um.user_id = $1 AND um.material_id = ANY(cr.materials::text[])
        AND um.quantity >= ALL(SELECT value FROM jsonb_each_text(cr.materials))
      ) um ON true
      WHERE cr.is_active = true
    `;
    
    const params = [userId];
    
    if (category) {
      query += ` AND cr.category = $2`;
      params.push(category);
    }
    
    query += ` ORDER BY cr.crafting_cost ASC`;
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      recipes: result.rows,
      total: result.rows.length
    });
    
  } catch (error) {
    console.error('Get crafting recipes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get crafting recipes' });
  }
});

// POST /api/inventory/crafting/craft - Craft item
router.post('/crafting/craft', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipeId, quantity = 1 } = req.body;
    
    // Get recipe and user
    const recipeResult = await pool.query(`
      SELECT cr.*, u.stg_balance
      FROM crafting_recipes cr
      JOIN users u ON u.id = $1
      WHERE cr.recipe_id = $2 AND cr.is_active = true
    `, [userId, recipeId]);
    
    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }
    
    const recipe = recipeResult.rows[0];
    const totalCost = recipe.crafting_cost * quantity;
    
    // Check user balance
    if (recipe.stg_balance < totalCost) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    // Check materials
    const materials = recipe.materials;
    for (const [materialId, requiredQty] of Object.entries(materials)) {
      const materialResult = await pool.query(`
        SELECT quantity FROM user_materials 
        WHERE user_id = $1 AND material_id = $2
      `, [userId, materialId]);
      
      if (materialResult.rows.length === 0 || materialResult.rows[0].quantity < (requiredQty * quantity)) {
        return res.status(400).json({ 
          success: false, 
          error: `Insufficient materials: ${materialId}` 
        });
      }
    }
    
    // Check crafting limits
    if (recipe.max_crafts !== -1) {
      const craftCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM user_crafting
        WHERE user_id = $1 AND recipe_id = $2
      `, [userId, recipeId]);
      
      if (craftCount.rows[0].count >= recipe.max_crafts) {
        return res.status(400).json({ success: false, error: 'Crafting limit reached' });
      }
    }
    
    // Start transaction
    await pool.query('BEGIN');
    
    // Deduct balance
    await pool.query(`
      UPDATE users 
      SET stg_balance = stg_balance - $1 
      WHERE id = $2
    `, [totalCost, userId]);
    
    // Deduct materials
    for (const [materialId, requiredQty] of Object.entries(materials)) {
      await pool.query(`
        UPDATE user_materials 
        SET quantity = quantity - $1 
        WHERE user_id = $2 AND material_id = $3
      `, [requiredQty * quantity, userId, materialId]);
    }
    
    // Create crafting record
    const wasSuccessful = Math.random() < recipe.success_rate;
    
    await pool.query(`
      INSERT INTO user_crafting (user_id, recipe_id, quantity, cost_paid, materials_used, was_successful)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, recipeId, quantity, totalCost, materials, wasSuccessful]);
    
    // Add crafted items if successful
    if (wasSuccessful && recipe.result_item_id) {
      switch (recipe.category) {
        case 'weapon':
          await pool.query(`
            INSERT INTO user_weapons (user_id, weapon_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, weapon_id) DO UPDATE SET
              quantity = user_weapons.quantity + EXCLUDED.quantity
          `, [userId, recipe.result_item_id, recipe.result_quantity * quantity]);
          break;
          
        case 'mod':
          // Add mods to user inventory
          break;
          
        case 'ammo':
          // Add ammo to user inventory
          break;
      }
    }
    
    await pool.query('COMMIT');
    
    res.json({
      success: true,
      message: wasSuccessful ? 'Crafting successful!' : 'Crafting failed, try again!',
      wasSuccessful,
      itemsProduced: wasSuccessful ? recipe.result_quantity * quantity : 0,
      totalCost
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Craft error:', error);
    res.status(500).json({ success: false, error: 'Failed to craft item' });
  }
});

// === STATISTICS API ===

// GET /api/inventory/stats - Get user inventory statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get comprehensive stats
    const statsResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM user_weapons WHERE user_id = $1) as total_weapons,
        (SELECT COUNT(*) FROM user_skins WHERE user_id = $1) as total_skins,
        (SELECT COUNT(*) FROM user_collectibles WHERE user_id = $1) as total_collectibles,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1 AND is_completed = true) as completed_achievements,
        (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1) as total_achievements,
        (SELECT COALESCE(SUM(price_paid), 0) FROM user_purchases WHERE user_id = $1) as total_spent,
        (SELECT COALESCE(SUM(w.base_price), 0) FROM user_weapons uw JOIN weapons w ON uw.weapon_id = w.weapon_id WHERE uw.user_id = $1) as weapons_value,
        (SELECT COALESCE(SUM(s.base_price), 0) FROM user_skins us JOIN character_skins s ON us.skin_id = s.skin_id WHERE us.user_id = $1) as skins_value,
        (SELECT COALESCE(SUM(c.base_price), 0) FROM user_collectibles uc JOIN collectibles c ON uc.collectible_id = c.collectible_id WHERE uc.user_id = $1) as collectibles_value
    `, [userId]);
    
    const stats = statsResult.rows[0];
    
    // Get rarity breakdown
    const rarityResult = await pool.query(`
      SELECT 'weapons' as item_type, rarity, COUNT(*) as count
      FROM user_weapons uw
      JOIN weapons w ON uw.weapon_id = w.weapon_id
      WHERE uw.user_id = $1
      GROUP BY rarity
      
      UNION ALL
      
      SELECT 'skins' as item_type, rarity, COUNT(*) as count
      FROM user_skins us
      JOIN character_skins s ON us.skin_id = s.skin_id
      WHERE us.user_id = $1
      GROUP BY rarity
      
      UNION ALL
      
      SELECT 'collectibles' as item_type, rarity, COUNT(*) as count
      FROM user_collectibles uc
      JOIN collectibles c ON uc.collectible_id = c.collectible_id
      WHERE uc.user_id = $1
      GROUP BY rarity
    `, [userId]);
    
    res.json({
      success: true,
      stats: {
        totalItems: stats.total_weapons + stats.total_skins + stats.total_collectibles,
        totalWeapons: stats.total_weapons,
        totalSkins: stats.total_skins,
        totalCollectibles: stats.total_collectibles,
        completedAchievements: stats.completed_achievements,
        totalAchievements: stats.total_achievements,
        achievementCompletionRate: stats.total_achievements > 0 ? Math.round((stats.completed_achievements / stats.total_achievements) * 100) : 0,
        totalSpent: stats.total_spent,
        totalValue: stats.weapons_value + stats.skins_value + stats.collectibles_value,
        weaponsValue: stats.weapons_value,
        skinsValue: stats.skins_value,
        collectiblesValue: stats.collectibles_value
      },
      rarityBreakdown: rarityResult.rows
    });
    
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

module.exports = router;
