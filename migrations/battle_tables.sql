-- Battle System Database Schema
-- Created for Team Iran vs USA Battle System

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id INTEGER NOT NULL REFERENCES users(id),
  player2_id INTEGER NOT NULL REFERENCES users(id),
  wager INTEGER NOT NULL CHECK (wager >= 100),
  weapon1_id VARCHAR(50),
  weapon2_id VARCHAR(50),
  territory_id VARCHAR(50) REFERENCES territories(id),
  game_mode VARCHAR(20) DEFAULT 'standard' CHECK (game_mode IN ('standard', 'tournament', 'practice', 'ranked')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'surrendered', 'timeout')),
  current_turn INTEGER DEFAULT 1 CHECK (current_turn IN (1, 2)),
  turn_count INTEGER DEFAULT 0,
  battle_data JSONB,
  winner_id INTEGER REFERENCES users(id),
  loser_id INTEGER REFERENCES users(id),
  battle_quality VARCHAR(20) CHECK (battle_quality IN ('domination', 'victory', 'win', 'struggle')),
  duration INTEGER, -- in seconds
  final_stats JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Battle actions log
CREATE TABLE IF NOT EXISTS battle_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id),
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('attack', 'skill', 'defend', 'item', 'surrender')),
  action_data JSONB NOT NULL,
  turn_number INTEGER NOT NULL,
  damage_dealt INTEGER DEFAULT 0,
  healing_done INTEGER DEFAULT 0,
  critical_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle rewards
CREATE TABLE IF NOT EXISTS battle_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('stg', 'experience', 'item')),
  amount INTEGER DEFAULT 0,
  experience INTEGER DEFAULT 0,
  battle_quality VARCHAR(20) CHECK (battle_quality IN ('domination', 'victory', 'win', 'struggle')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle queue for matchmaking
CREATE TABLE IF NOT EXISTS battle_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
  game_mode VARCHAR(20) DEFAULT 'standard' CHECK (game_mode IN ('standard', 'tournament', 'practice', 'ranked')),
  wager INTEGER NOT NULL CHECK (wager >= 100),
  weapon_id VARCHAR(50),
  territory_id VARCHAR(50),
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'cancelled')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  matched_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- Battle spectators
CREATE TABLE IF NOT EXISTS battle_spectators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(battle_id, user_id)
);

-- Battle statistics aggregation
CREATE TABLE IF NOT EXISTS battle_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id),
  stat_date DATE NOT NULL,
  total_battles INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_wager INTEGER DEFAULT 0,
  total_earnings INTEGER DEFAULT 0,
  average_wager DECIMAL(10,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  favorite_weapon VARCHAR(50),
  favorite_territory VARCHAR(50),
  domination_count INTEGER DEFAULT 0,
  victory_count INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  struggle_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

-- Battle seasons (for tournaments)
CREATE TABLE IF NOT EXISTS battle_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  prize_pool INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 1000,
  current_participants INTEGER DEFAULT 0,
  rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament brackets
CREATE TABLE IF NOT EXISTS tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES battle_seasons(id),
  bracket_type VARCHAR(20) DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  max_participants INTEGER DEFAULT 64,
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 6,
  bracket_data JSONB,
  status VARCHAR(20) DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES battle_seasons(id),
  bracket_id UUID REFERENCES tournament_brackets(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  seed_number INTEGER,
  current_position INTEGER,
  eliminated BOOLEAN DEFAULT FALSE,
  eliminated_at TIMESTAMP WITH TIME ZONE,
  final_rank INTEGER,
  prize_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

-- Battle replays
CREATE TABLE IF NOT EXISTS battle_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id),
  replay_data JSONB NOT NULL,
  file_path VARCHAR(500),
  file_size INTEGER,
  duration INTEGER, -- in seconds
  views INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Battle ratings
CREATE TABLE IF NOT EXISTS battle_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id),
  rater_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(battle_id, rater_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_players ON battles(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON battles(created_at);
CREATE INDEX IF NOT EXISTS idx_battles_winner ON battles(winner_id);
CREATE INDEX IF NOT EXISTS idx_battles_quality ON battles(battle_quality);

CREATE INDEX IF NOT EXISTS idx_battle_actions_battle ON battle_actions(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_actions_player ON battle_actions(player_id);
CREATE INDEX IF NOT EXISTS idx_battle_actions_turn ON battle_actions(turn_number);

CREATE INDEX IF NOT EXISTS idx_battle_rewards_battle ON battle_rewards(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_rewards_user ON battle_rewards(user_id);

CREATE INDEX IF NOT EXISTS idx_battle_queue_status ON battle_queue(status);
CREATE INDEX IF NOT EXISTS idx_battle_queue_game_mode ON battle_queue(game_mode);
CREATE INDEX IF NOT EXISTS idx_battle_queue_wager ON battle_queue(wager);
CREATE INDEX IF NOT EXISTS idx_battle_queue_joined_at ON battle_queue(joined_at);

CREATE INDEX IF NOT EXISTS idx_battle_spectators_battle ON battle_spectators(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_spectators_user ON battle_spectators(user_id);

CREATE INDEX IF NOT EXISTS idx_battle_statistics_user ON battle_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_statistics_date ON battle_statistics(stat_date);

CREATE INDEX IF NOT EXISTS idx_tournament_participants_season ON tournament_participants(season_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_rank ON tournament_participants(final_rank);

CREATE INDEX IF NOT EXISTS idx_battle_replays_battle ON battle_replays(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_replays_public ON battle_replays(is_public);

CREATE INDEX IF NOT EXISTS idx_battle_ratings_battle ON battle_ratings(battle_id);

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_battle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_updated_at_trigger
    BEFORE UPDATE ON battles
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_updated_at();

CREATE OR REPLACE FUNCTION update_battle_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER battle_statistics_updated_at_trigger
    BEFORE UPDATE ON battle_statistics
    FOR EACH ROW
    EXECUTE FUNCTION update_battle_statistics_updated_at();

-- Create function to calculate win rate
CREATE OR REPLACE FUNCTION calculate_win_rate(
    p_wins INTEGER,
    p_total_battles INTEGER
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF p_total_battles = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((p_wins::DECIMAL / p_total_battles::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Create function to aggregate daily statistics
CREATE OR REPLACE FUNCTION aggregate_daily_battle_stats()
RETURNS VOID AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
BEGIN
    INSERT INTO battle_statistics (
        user_id, stat_date, total_battles, wins, losses,
        total_wager, total_earnings, favorite_weapon, favorite_territory,
        domination_count, victory_count, win_count, struggle_count
    )
    SELECT 
        user_id,
        today_date,
        COUNT(*) as total_battles,
        COUNT(CASE WHEN winner_id = user_id THEN 1 END) as wins,
        COUNT(CASE WHEN winner_id != user_id AND winner_id IS NOT NULL THEN 1 END) as losses,
        COALESCE(SUM(wager), 0) as total_wager,
        COALESCE(SUM(CASE WHEN winner_id = user_id THEN wager * 2 ELSE 0 END), 0) as total_earnings,
        mode() WITHIN GROUP (ORDER BY CASE WHEN player1_id = user_id THEN weapon1_id ELSE weapon2_id END) as favorite_weapon,
        mode() WITHIN GROUP (ORDER BY territory_id) as favorite_territory,
        COUNT(CASE WHEN battle_quality = 'domination' THEN 1 END) as domination_count,
        COUNT(CASE WHEN battle_quality = 'victory' THEN 1 END) as victory_count,
        COUNT(CASE WHEN battle_quality = 'win' THEN 1 END) as win_count,
        COUNT(CASE WHEN battle_quality = 'struggle' THEN 1 END) as struggle_count
    FROM battles
    WHERE DATE(created_at) = today_date - INTERVAL '1 day'
      AND status = 'completed'
    GROUP BY user_id
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        total_battles = EXCLUDED.total_battles,
        wins = EXCLUDED.wins,
        losses = EXCLUDED.losses,
        total_wager = EXCLUDED.total_wager,
        total_earnings = EXCLUDED.total_earnings,
        favorite_weapon = EXCLUDED.favorite_weapon,
        favorite_territory = EXCLUDED.favorite_territory,
        domination_count = EXCLUDED.domination_count,
        victory_count = EXCLUDED.victory_count,
        win_count = EXCLUDED.win_count,
        struggle_count = EXCLUDED.struggle_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for daily aggregation (requires pg_cron extension)
-- SELECT cron.schedule('0 2 * * *', 'SELECT aggregate_daily_battle_stats();');

-- Create view for active battles with user info
CREATE OR REPLACE VIEW active_battles_view AS
SELECT 
    b.id,
    b.player1_id,
    b.player2_id,
    b.wager,
    b.territory_id,
    b.current_turn,
    b.turn_count,
    b.created_at,
    p1.username as player1_username,
    p1.faction as player1_faction,
    p1.level as player1_level,
    p2.username as player2_username,
    p2.faction as player2_faction,
    p2.level as player2_level,
    t.name as territory_name,
    t.controller as territory_controller
FROM battles b
LEFT JOIN users p1 ON b.player1_id = p1.id
LEFT JOIN users p2 ON b.player2_id = p2.id
LEFT JOIN territories t ON b.territory_id = t.id
WHERE b.status = 'active'
ORDER BY b.created_at DESC;

-- Create view for user battle summary
CREATE OR REPLACE VIEW user_battle_summary_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.faction,
    u.level,
    COALESCE(stats.total_battles, 0) as total_battles,
    COALESCE(stats.wins, 0) as wins,
    COALESCE(stats.losses, 0) as losses,
    COALESCE(stats.win_rate, 0) as win_rate,
    COALESCE(stats.average_wager, 0) as average_wager,
    COALESCE(stats.total_earnings, 0) as total_earnings,
    COALESCE(stats.favorite_weapon, 'basic_sword') as favorite_weapon,
    COALESCE(stats.favorite_territory, 'tehran') as favorite_territory
FROM users u
LEFT JOIN (
    SELECT 
        user_id,
        SUM(total_battles) as total_battles,
        SUM(wins) as wins,
        SUM(losses) as losses,
        AVG(win_rate) as win_rate,
        AVG(average_wager) as average_wager,
        SUM(total_earnings) as total_earnings,
        mode() WITHIN GROUP (ORDER BY favorite_weapon) as favorite_weapon,
        mode() WITHIN GROUP (ORDER BY favorite_territory) as favorite_territory
    FROM battle_statistics
    WHERE stat_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
) stats ON u.id = stats.user_id
ORDER BY stats.total_earnings DESC;
