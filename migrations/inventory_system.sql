// Complete Database Schema for Inventory System
-- Comprehensive database schema for weapons, collectibles, achievements, and shop

-- Weapons System Tables
CREATE TABLE IF NOT EXISTS weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('pistol', 'rifle', 'sniper', 'shotgun', 'smg', 'lmg', 'explosive', 'melee', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  faction VARCHAR(10) CHECK (faction IN ('iran', 'usa', 'neutral')),
  
  -- Base stats
  base_damage INTEGER DEFAULT 10,
  base_accuracy INTEGER DEFAULT 50,
  base_fire_rate INTEGER DEFAULT 50,
  base_range INTEGER DEFAULT 50,
  base_durability INTEGER DEFAULT 100,
  
  -- Upgrade system
  max_level INTEGER DEFAULT 10,
  upgrade_slots INTEGER DEFAULT 3,
  upgrade_cost_multiplier DECIMAL(2,2) DEFAULT 1.5,
  
  -- Visual and audio
  icon VARCHAR(50),
  gradient VARCHAR(100),
  sound_file VARCHAR(100),
  
  -- Economic data
  base_price INTEGER DEFAULT 100,
  sell_price INTEGER DEFAULT 50,
  
  -- Availability
  is_limited BOOLEAN DEFAULT FALSE,
  limited_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Unlock requirements
  unlock_level INTEGER DEFAULT 1,
  unlock_achievements TEXT[], -- Array of achievement IDs
  unlock_faction_reputation INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Weapon Inventory
CREATE TABLE IF NOT EXISTS user_weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  weapon_id VARCHAR(50) NOT NULL REFERENCES weapons(weapon_id),
  
  -- Instance data
  current_level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  durability INTEGER DEFAULT 100,
  quantity INTEGER DEFAULT 1,
  
  -- Custom stats (upgrades, mods)
  custom_damage INTEGER,
  custom_accuracy INTEGER,
  custom_fire_rate INTEGER,
  custom_range INTEGER,
  
  -- Status
  is_equipped BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Upgrade slots data
  upgrade_slots_used INTEGER DEFAULT 0,
  installed_mods TEXT[], -- Array of mod IDs
  
  -- Timestamps
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, weapon_id)
);

-- Weapon Upgrades and Mods
CREATE TABLE IF NOT EXISTS weapon_mods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mod_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('barrel', 'scope', 'stock', 'magazine', 'grip', 'muzzle', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- Stats modifications
  damage_modifier DECIMAL(3,2) DEFAULT 1.0,
  accuracy_modifier DECIMAL(3,2) DEFAULT 1.0,
  fire_rate_modifier DECIMAL(3,2) DEFAULT 1.0,
  range_modifier DECIMAL(3,2) DEFAULT 1.0,
  durability_modifier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  required_weapon_level INTEGER DEFAULT 1,
  compatible_categories TEXT[], -- Array of weapon categories
  
  -- Economic data
  cost INTEGER DEFAULT 100,
  materials JSONB,
  
  -- Visual
  icon VARCHAR(50),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character Skins System
CREATE TABLE IF NOT EXISTS character_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('military', 'special_forces', 'elite', 'legendary', 'mythic', 'seasonal')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  faction VARCHAR(10) CHECK (faction IN ('iran', 'usa', 'neutral')),
  
  -- Stats bonuses
  health_bonus INTEGER DEFAULT 0,
  speed_bonus INTEGER DEFAULT 0,
  damage_bonus INTEGER DEFAULT 0,
  defense_bonus INTEGER DEFAULT 0,
  
  -- Visual effects
  visual_effects TEXT[],
  particle_effects TEXT[],
  animation_overrides TEXT[],
  
  -- Special abilities
  special_ability VARCHAR(50),
  ability_cooldown INTEGER DEFAULT 0,
  
  -- Economic data
  price INTEGER DEFAULT 100,
  sell_price INTEGER DEFAULT 50,
  
  -- Availability
  is_limited BOOLEAN DEFAULT FALSE,
  limited_quantity INTEGER DEFAULT 0,
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_name VARCHAR(50),
  
  -- Unlock requirements
  unlock_level INTEGER DEFAULT 1,
  unlock_achievements TEXT[],
  special_achievement VARCHAR(50),
  
  -- Visual data
  icon VARCHAR(50),
  gradient VARCHAR(100),
  preview_image VARCHAR(200),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Skins Inventory
CREATE TABLE IF NOT EXISTS user_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  skin_id VARCHAR(50) NOT NULL REFERENCES character_skins(skin_id),
  
  -- Status
  is_equipped BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Usage stats
  times_equipped INTEGER DEFAULT 0,
  total_wear_time INTEGER DEFAULT 0, -- in seconds
  
  -- Timestamps
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_equipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, skin_id)
);

-- Collectibles System
CREATE TABLE IF NOT EXISTS collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collectible_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('medal', 'trophy', 'statue', 'artifact', 'badge', 'emblem', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  collection_set VARCHAR(50),
  
  -- Stats bonuses
  prestige_bonus INTEGER DEFAULT 0,
  luck_bonus INTEGER DEFAULT 0,
  experience_bonus INTEGER DEFAULT 0,
  
  -- Economic data
  base_price INTEGER DEFAULT 100,
  trade_value INTEGER DEFAULT 50,
  
  -- Availability
  is_tradeable BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  limited_quantity INTEGER DEFAULT 0,
  
  -- Unlock requirements
  unlock_level INTEGER DEFAULT 1,
  unlock_achievements TEXT[],
  
  -- Visual
  icon VARCHAR(50),
  gradient VARCHAR(100),
  three_d_model VARCHAR(200),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Collectibles Inventory
CREATE TABLE IF NOT EXISTS user_collectibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  collectible_id VARCHAR(50) NOT NULL REFERENCES collectibles(collectible_id),
  
  -- Quantity and status
  quantity INTEGER DEFAULT 1,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_displayed BOOLEAN DEFAULT FALSE,
  
  -- Trading
  is_for_trade BOOLEAN DEFAULT FALSE,
  trade_price INTEGER DEFAULT 0,
  
  -- Timestamps
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, collectible_id)
);

-- Achievements System
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('combat', 'collection', 'social', 'tournament', 'special', 'seasonal')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  
  -- Requirements
  requirement_type VARCHAR(20) NOT NULL CHECK (requirement_type IN ('count', 'stat', 'collection', 'special')),
  requirement_target INTEGER NOT NULL,
  requirement_data JSONB,
  
  -- Rewards
  stg_reward INTEGER DEFAULT 0,
  experience_reward INTEGER DEFAULT 0,
  item_rewards TEXT[], -- Array of item IDs
  
  -- Progress tracking
  is_repeatable BOOLEAN DEFAULT FALSE,
  repeat_cooldown INTEGER DEFAULT 0, -- in hours
  
  -- Visual
  icon VARCHAR(50),
  gradient VARCHAR(100),
  badge_image VARCHAR(200),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_seasonal BOOLEAN DEFAULT FALSE,
  season_name VARCHAR(50),
  
  -- Prerequisites
  prerequisite_achievements TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievement Progress
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(achievement_id),
  
  -- Progress
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completion_count INTEGER DEFAULT 0, -- For repeatable achievements
  
  -- Rewards claimed
  stg_reward_claimed BOOLEAN DEFAULT FALSE,
  item_rewards_claimed BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_progress_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Shop System
CREATE TABLE IF NOT EXISTS shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('weapons', 'skins', 'collectibles', 'boosts', 'crates', 'bundles', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  
  -- Economic data
  base_price INTEGER NOT NULL,
  current_price INTEGER NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  
  -- Inventory
  stock_quantity INTEGER DEFAULT -1, -- -1 for unlimited
  sold_quantity INTEGER DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  
  -- Time-based availability
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  
  -- Purchase limits
  max_purchase_per_user INTEGER DEFAULT -1, -- -1 for unlimited
  
  -- Item data (references to other tables)
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('weapon', 'skin', 'collectible', 'boost', 'crate', 'bundle')),
  reference_id VARCHAR(50), -- ID of the actual item
  
  -- Visual
  icon VARCHAR(50),
  gradient VARCHAR(100),
  preview_image VARCHAR(200),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Purchase History
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id VARCHAR(50) NOT NULL REFERENCES shop_items(item_id),
  
  -- Purchase data
  quantity INTEGER DEFAULT 1,
  price_paid INTEGER NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  
  -- Payment method
  payment_method VARCHAR(20) DEFAULT 'stg' CHECK (payment_method IN ('stg', 'premium', 'external')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Timestamps
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  purchase_data JSONB
);

-- Boosts and Power-ups
CREATE TABLE IF NOT EXISTS boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('experience', 'stg', 'combat', 'social', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- Effect data
  effect_type VARCHAR(20) NOT NULL CHECK (effect_type IN ('multiplier', 'bonus', 'special')),
  effect_value DECIMAL(5,2) NOT NULL,
  effect_duration INTEGER NOT NULL, -- in minutes
  
  -- Economic data
  price INTEGER DEFAULT 100,
  
  -- Usage limits
  max_stack INTEGER DEFAULT 1,
  cooldown_minutes INTEGER DEFAULT 0,
  
  -- Visual
  icon VARCHAR(50),
  gradient VARCHAR(100),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_consumable BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Active Boosts
CREATE TABLE IF NOT EXISTS user_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  boost_id VARCHAR(50) NOT NULL REFERENCES boosts(boost_id),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  activation_count INTEGER DEFAULT 0,
  
  -- Timestamps
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Effect data
  current_effect_value DECIMAL(5,2),
  remaining_duration INTEGER, -- in minutes
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loot Crates System
CREATE TABLE IF NOT EXISTS loot_crates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crate_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('basic', 'premium', 'legendary', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  
  -- Economic data
  price INTEGER NOT NULL,
  
  -- Contents
  guarantee_rarity VARCHAR(20), -- Minimum rarity guaranteed
  legendary_chance DECIMAL(3,2) DEFAULT 0.0, -- Chance for legendary items
  mythic_chance DECIMAL(3,2) DEFAULT 0.0, -- Chance for mythic items
  
  -- Possible items
  possible_items TEXT[], -- Array of possible item IDs
  item_weights JSONB, -- Weight for each item
  
  -- Limits
  max_purchases INTEGER DEFAULT -1, -- -1 for unlimited
  daily_purchases INTEGER DEFAULT -1,
  
  -- Visual
  icon VARCHAR(50),
  gradient VARCHAR(100),
  opening_animation VARCHAR(200),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  limited_quantity INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Loot Crate History
CREATE TABLE IF NOT EXISTS user_loot_crates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  crate_id VARCHAR(50) NOT NULL REFERENCES loot_crates(crate_id),
  
  -- Purchase data
  price_paid INTEGER NOT NULL,
  
  -- Opening data
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items_received TEXT[], -- Array of received item IDs
  item_rarities TEXT[], -- Array of received item rarities
  
  -- Special results
  was_legendary BOOLEAN DEFAULT FALSE,
  was_mythic BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crafting System
CREATE TABLE IF NOT EXISTS crafting_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('weapon', 'mod', 'ammo', 'consumable', 'special')),
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  crafting_cost INTEGER DEFAULT 0,
  
  -- Materials needed
  materials JSONB NOT NULL, -- { material_name: quantity }
  
  -- Results
  result_item_id VARCHAR(50),
  result_quantity INTEGER DEFAULT 1,
  result_rarity VARCHAR(20),
  
  -- Crafting data
  crafting_time INTEGER DEFAULT 0, -- in minutes
  success_rate DECIMAL(3,2) DEFAULT 1.0,
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  is_limited BOOLEAN DEFAULT FALSE,
  max_crafts INTEGER DEFAULT -1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Crafting History
CREATE TABLE IF NOT EXISTS user_crafting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  recipe_id VARCHAR(50) NOT NULL REFERENCES crafting_recipes(recipe_id),
  
  -- Crafting data
  quantity INTEGER DEFAULT 1,
  cost_paid INTEGER DEFAULT 0,
  materials_used JSONB,
  
  -- Results
  was_successful BOOLEAN DEFAULT TRUE,
  items_produced TEXT[],
  items_quantity INTEGER DEFAULT 0,
  
  -- Timestamps
  crafted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials System
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('metal', 'crystal', 'organic', 'synthetic', 'rare', 'special')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),
  
  -- Economic data
  base_price INTEGER DEFAULT 10,
  sell_price INTEGER DEFAULT 5,
  
  -- Usage
  craftable BOOLEAN DEFAULT TRUE,
  tradable BOOLEAN DEFAULT TRUE,
  
  -- Visual
  icon VARCHAR(50),
  color VARCHAR(7),
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Materials Inventory
CREATE TABLE IF NOT EXISTS user_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  material_id VARCHAR(50) NOT NULL REFERENCES materials(material_id),
  
  -- Quantity
  quantity INTEGER DEFAULT 0,
  
  -- Timestamps
  last_acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, material_id)
);

-- Trading System
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Participants
  initiator_id INTEGER NOT NULL REFERENCES users(id),
  responder_id INTEGER REFERENCES users(id),
  
  -- Trade data
  initiator_items JSONB, -- Array of item IDs and quantities
  responder_items JSONB,
  initiator_stg INTEGER DEFAULT 0,
  responder_stg INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Messages
  initiator_message TEXT,
  responder_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Notification data
  type VARCHAR(20) NOT NULL CHECK (type IN ('achievement', 'purchase', 'trade', 'craft', 'level_up', 'special')),
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  
  -- Visual
  icon VARCHAR(50),
  color VARCHAR(7),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  
  -- Action data
  action_url VARCHAR(200),
  action_text VARCHAR(50),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional data
  metadata JSONB
);

-- User Statistics
CREATE TABLE IF NOT EXISTS user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Combat stats
  total_battles INTEGER DEFAULT 0,
  battles_won INTEGER DEFAULT 0,
  battles_lost INTEGER DEFAULT 0,
  total_damage_dealt INTEGER DEFAULT 0,
  total_damage_taken INTEGER DEFAULT 0,
  
  -- Collection stats
  weapons_collected INTEGER DEFAULT 0,
  skins_collected INTEGER DEFAULT 0,
  collectibles_collected INTEGER DEFAULT 0,
  achievements_completed INTEGER DEFAULT 0,
  
  -- Economic stats
  total_spent INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  current_balance INTEGER DEFAULT 0,
  
  -- Social stats
  trades_completed INTEGER DEFAULT 0,
  items_gifted INTEGER DEFAULT 0,
  achievements_shared INTEGER DEFAULT 0,
  
  -- Time stats
  total_playtime INTEGER DEFAULT 0, -- in minutes
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weapons_category ON weapons(category);
CREATE INDEX IF NOT EXISTS idx_weapons_rarity ON weapons(rarity);
CREATE INDEX IF NOT EXISTS idx_weapons_faction ON weapons(faction);
CREATE INDEX IF NOT EXISTS idx_weapons_active ON weapons(is_active);

CREATE INDEX IF NOT EXISTS idx_user_weapons_user_id ON user_weapons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_weapons_weapon_id ON user_weapons(weapon_id);
CREATE INDEX IF NOT EXISTS idx_user_weapons_equipped ON user_weapons(is_equipped);

CREATE INDEX IF NOT EXISTS idx_character_skins_category ON character_skins(category);
CREATE INDEX IF NOT EXISTS idx_character_skins_rarity ON character_skins(rarity);
CREATE INDEX IF NOT EXISTS idx_character_skins_faction ON character_skins(faction);

CREATE INDEX IF NOT EXISTS idx_user_skins_user_id ON user_skins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skins_equipped ON user_skins(is_equipped);

CREATE INDEX IF NOT EXISTS idx_collectibles_category ON collectibles(category);
CREATE INDEX IF NOT EXISTS idx_collectibles_rarity ON collectibles(rarity);
CREATE INDEX IF NOT EXISTS idx_collectibles_set ON collectibles(collection_set);

CREATE INDEX IF NOT EXISTS idx_user_collectibles_user_id ON user_collectibles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_collectibles_tradeable ON user_collectibles(is_for_trade);

CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
CREATE INDEX IF NOT EXISTS idx_achievements_active ON achievements(is_active);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);
CREATE INDEX IF NOT EXISTS idx_shop_items_rarity ON shop_items(rarity);
CREATE INDEX IF NOT EXISTS idx_shop_items_active ON shop_items(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_items_featured ON shop_items(is_featured);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_item_id ON user_purchases(item_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_status ON user_purchases(status);

CREATE INDEX IF NOT EXISTS idx_boosts_category ON boosts(category);
CREATE INDEX IF NOT EXISTS idx_boosts_active ON boosts(is_active);

CREATE INDEX IF NOT EXISTS idx_user_boosts_user_id ON user_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_boosts_active ON user_boosts(is_active);
CREATE INDEX IF NOT EXISTS idx_user_boosts_expires ON user_boosts(expires_at);

CREATE INDEX IF NOT EXISTS idx_loot_crates_category ON loot_crates(category);
CREATE INDEX IF NOT EXISTS idx_loot_crates_active ON loot_crates(is_active);

CREATE INDEX IF NOT EXISTS idx_user_loot_crates_user_id ON user_loot_crates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_loot_crates_crate_id ON user_loot_crates(crate_id);

CREATE INDEX IF NOT EXISTS idx_crafting_recipes_category ON crafting_recipes(category);
CREATE INDEX IF NOT EXISTS idx_crafting_recipes_active ON crafting_recipes(is_active);

CREATE INDEX IF NOT EXISTS idx_user_crafting_user_id ON user_crafting(user_id);
CREATE INDEX IF NOT EXISTS idx_user_crafting_recipe_id ON user_crafting(recipe_id);

CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_rarity ON materials(rarity);

CREATE INDEX IF NOT EXISTS idx_user_materials_user_id ON user_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_materials_material_id ON user_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_trades_initiator ON trades(initiator_id);
CREATE INDEX IF NOT EXISTS idx_trades_responder ON trades(responder_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON user_statistics(user_id);

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_weapons_updated_at BEFORE UPDATE ON weapons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_weapons_updated_at BEFORE UPDATE ON user_weapons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_character_skins_updated_at BEFORE UPDATE ON character_skins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_skins_updated_at BEFORE UPDATE ON user_skins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collectibles_updated_at BEFORE UPDATE ON collectibles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_collectibles_updated_at BEFORE UPDATE ON user_collectibles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON user_achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_items_updated_at BEFORE UPDATE ON shop_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boosts_updated_at BEFORE UPDATE ON boosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_boosts_updated_at BEFORE UPDATE ON user_boosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loot_crates_updated_at BEFORE UPDATE ON loot_crates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_materials_updated_at BEFORE UPDATE ON user_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON user_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for complex queries
CREATE OR REPLACE VIEW user_inventory_summary AS
SELECT 
    u.id as user_id,
    u.username,
    COUNT(DISTINCT uw.weapon_id) as weapon_count,
    COUNT(DISTINCT us.skin_id) as skin_count,
    COUNT(DISTINCT uc.collectible_id) as collectible_count,
    COUNT(DISTINCT ua.achievement_id) as achievement_count,
    COALESCE(uw_stats.total_value, 0) as weapons_value,
    COALESCE(us_stats.total_value, 0) as skins_value,
    COALESCE(uc_stats.total_value, 0) as collectibles_value,
    COALESCE(up_stats.total_spent, 0) as total_spent
FROM users u
LEFT JOIN user_weapons uw ON u.id = uw.user_id
LEFT JOIN user_skins us ON u.id = us.user_id
LEFT JOIN user_collectibles uc ON u.id = uc.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
LEFT JOIN (
    SELECT user_id, SUM(w.base_price) as total_value
    FROM user_weapons uw2
    JOIN weapons w ON uw2.weapon_id = w.weapon_id
    GROUP BY user_id
) uw_stats ON u.id = uw_stats.user_id
LEFT JOIN (
    SELECT user_id, SUM(s.base_price) as total_value
    FROM user_skins us2
    JOIN character_skins s ON us2.skin_id = s.skin_id
    GROUP BY user_id
) us_stats ON u.id = us_stats.user_id
LEFT JOIN (
    SELECT user_id, SUM(c.base_price) as total_value
    FROM user_collectibles uc2
    JOIN collectibles c ON uc2.collectible_id = c.collectible_id
    GROUP BY user_id
) uc_stats ON u.id = uc_stats.user_id
LEFT JOIN (
    SELECT user_id, SUM(price_paid) as total_spent
    FROM user_purchases up
    GROUP BY user_id
) up_stats ON u.id = up_stats.user_id
GROUP BY u.id, u.username;

CREATE OR REPLACE VIEW shop_analytics AS
SELECT 
    si.category,
    si.rarity,
    COUNT(*) as item_count,
    SUM(si.current_price) as total_value,
    SUM(si.sold_quantity) as total_sold,
    SUM(si.current_price * si.sold_quantity) as total_revenue,
    AVG(si.current_price) as avg_price
FROM shop_items si
WHERE si.is_active = true
GROUP BY si.category, si.rarity
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW achievement_progress_summary AS
SELECT 
    a.category,
    a.rarity,
    COUNT(*) as total_achievements,
    COUNT(CASE WHEN ua.is_completed THEN 1 END) as completed_count,
    ROUND(COUNT(CASE WHEN ua.is_completed THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate,
    SUM(a.stg_reward) as total_stg_rewards,
    SUM(a.experience_reward) as total_exp_rewards
FROM achievements a
LEFT JOIN user_achievements ua ON a.achievement_id = ua.achievement_id
WHERE a.is_active = true
GROUP BY a.category, a.rarity
ORDER BY completion_rate DESC;
