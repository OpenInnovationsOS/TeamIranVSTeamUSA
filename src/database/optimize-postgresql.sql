-- 🚀 PostgreSQL Optimization for Gaming Workloads
-- Team Iran vs Team USA - Performance Enhancement Script

-- Enable critical extensions for gaming performance
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- ADVANCED INDEXING STRATEGY
-- ============================================================================

-- Users table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_telegram_id_unique ON users(telegram_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_faction_balance_desc ON users(faction, stg_balance DESC, level DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code_active ON users(referral_code) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_active ON users(created_at DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address ON users(ton_wallet_address) WHERE ton_wallet_address IS NOT NULL;

-- Battles table optimization (high-frequency writes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_status_created ON battles(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_attacker_created ON battles(attacker_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_defender_created ON battles(defender_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_winner_created ON battles(winner_id, created_at DESC) WHERE winner_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_type_wager ON battles(battle_type, stg_wager DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_active_recent ON battles(created_at DESC) WHERE status = 'active';

-- GIN index for JSONB battle data (critical for game performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_battle_data_gin ON battles USING GIN (battle_data);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_battle_data_type ON battles USING GIN ((battle_data->'type'));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_battle_data_difficulty ON battles USING GIN ((battle_data->'difficulty'));

-- Transactions table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_type_created ON transactions(user_id, type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_created ON transactions(status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash) WHERE transaction_hash IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_amount_created ON transactions(amount DESC, created_at DESC);

-- Territories table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_faction_active ON territories(controlling_faction, is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_updated_at ON territories(updated_at DESC) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_territories_scores ON territories(iran_score DESC, usa_score DESC);

-- Missions table optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_missions_active_valid ON daily_missions(is_active, valid_until) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_user_completed ON user_missions(user_id, is_completed, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_missions_mission_progress ON user_missions(mission_id, current_progress DESC);

-- Game events optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_active_type ON game_events(is_active, event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_events_time_range ON game_events(start_time, end_time) WHERE is_active = true;

-- Audit logs optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip_created ON audit_logs(ip_address, created_at DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Only index active users for most queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_telegram ON users(telegram_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_faction ON users(faction) WHERE is_active = true;

-- Only index recent battles for leaderboards
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_recent_completed ON battles(completed_at DESC, stg_wager DESC) 
WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '30 days';

-- Only index pending transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_pending ON transactions(user_id, created_at) 
WHERE status = 'pending';

-- ============================================================================
-- EXPRESSION INDEXES FOR ADVANCED QUERIES
-- ============================================================================

-- Case-insensitive username search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));

-- Full-text search for usernames
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_fts ON users USING GIN(to_tsvector('english', username));

-- Battle data specific queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_pvp_type ON battles((battle_data->>'type')) WHERE battle_data->>'type' = 'pvp';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battles_high_wager ON battles(stg_wager DESC, created_at DESC) WHERE stg_wager > 1000;

-- ============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Leaderboard queries (avoid table lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaderboard_covering ON users(faction, stg_balance DESC, level DESC) 
INCLUDE (username, first_name, experience, created_at);

-- User profile queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profile_covering ON users(telegram_id) 
INCLUDE (username, first_name, last_name, faction, stg_balance, win_claimable, level, experience, referral_code, ton_wallet_address, is_active, created_at, updated_at);

-- Battle history queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_battle_history_covering ON battles(attacker_id, created_at DESC) 
INCLUDE (defender_id, winner_id, stg_wager, battle_type, battle_data, status, completed_at);

-- ============================================================================
-- TABLE PARTITIONING FOR TIME-SERIES DATA
-- ============================================================================

-- Partition battles table by month for better performance
CREATE TABLE IF NOT EXISTS battles_partitioned (
    LIKE battles INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for the current year
DO $$
DECLARE
    month_date DATE;
    start_date DATE;
    end_date DATE;
BEGIN
    FOR month_date IN 
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
        )::date
    LOOP
        start_date := month_date;
        end_date := month_date + INTERVAL '1 month';
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS battles_%s PARTITION OF battles_partitioned FOR VALUES FROM (%L) TO (%L)',
                     TO_CHAR(month_date, 'YYYY_MM'), start_date, end_date);
    END LOOP;
END $$;

-- Partition transactions table by month
CREATE TABLE IF NOT EXISTS transactions_partitioned (
    LIKE transactions INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for transactions
DO $$
DECLARE
    month_date DATE;
    start_date DATE;
    end_date DATE;
BEGIN
    FOR month_date IN 
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
        )::date
    LOOP
        start_date := month_date;
        end_date := month_date + INTERVAL '1 month';
        
        EXECUTE format('CREATE TABLE IF NOT EXISTS transactions_%s PARTITION OF transactions_partitioned FOR VALUES FROM (%L) TO (%L)',
                     TO_CHAR(month_date, 'YYYY_MM'), start_date, end_date);
    END LOOP;
END $$;

-- ============================================================================
-- PERFORMANCE MONITORING SETUP
-- ============================================================================

-- Reset statistics for fresh monitoring
SELECT pg_stat_statements_reset();

-- Create performance monitoring view
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY mean_exec_time DESC;

-- Create slow queries view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM pg_stat_statements 
WHERE mean_exec_time > 100 -- queries slower than 100ms
ORDER BY mean_exec_time DESC;

-- ============================================================================
-- CUSTOM AGGREGATE FUNCTIONS FOR GAMING
-- ============================================================================

-- Create custom aggregate for win rate calculation
CREATE OR REPLACE FUNCTION win_rate_final_fn(float8[])
RETURNS float8 AS $$
SELECT CASE 
    WHEN $1[1] > 0 THEN ($1[2] / $1[1]) * 100 
    ELSE 0 
END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION win_rate_transfn(state float8[], wins float8, total float8)
RETURNS float8[] AS $$
SELECT ARRAY[
    COALESCE($1[1], 0) + total,
    COALESCE($1[2], 0) + wins
];
$$ LANGUAGE sql IMMUTABLE;

CREATE AGGREGATE win_rate(float8, float8) (
    SFUNC = win_rate_transfn,
    STYPE = float8[],
    FINALFUNC = win_rate_final_fn,
    INITCOND = '{}'
);

-- ============================================================================
-- OPTIMIZED GAME FUNCTIONS
-- ============================================================================

-- Optimized user statistics calculation
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    user_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'user_id', p_user_id,
        'total_battles', COUNT(b.id),
        'won_battles', COUNT(CASE WHEN b.winner_id = p_user_id THEN 1 END),
        'win_rate', win_rate(COUNT(CASE WHEN b.winner_id = p_user_id THEN 1 END), COUNT(b.id)),
        'total_wagered', COALESCE(SUM(b.stg_wager), 0),
        'average_wager', COALESCE(AVG(b.stg_wager), 0),
        'last_battle', MAX(b.created_at),
        'faction', u.faction,
        'current_level', u.level,
        'experience', u.experience
    ) INTO user_stats
    FROM users u
    LEFT JOIN battles b ON (u.id = b.attacker_id OR u.id = b.defender_id)
    WHERE u.id = p_user_id;
    
    RETURN user_stats;
END;
$$ LANGUAGE plpgsql;

-- Optimized leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(p_faction TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    rank INTEGER,
    user_id INTEGER,
    username TEXT,
    faction TEXT,
    stg_balance BIGINT,
    level INTEGER,
    experience BIGINT,
    total_battles BIGINT,
    win_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC) as rank,
        u.id as user_id,
        u.username,
        u.faction,
        u.stg_balance,
        u.level,
        u.experience,
        COALESCE(battle_stats.total_battles, 0) as total_battles,
        COALESCE(battle_stats.win_rate, 0) as win_rate
    FROM users u
    LEFT JOIN (
        SELECT 
            user_id,
            COUNT(*) as total_battles,
            win_rate(COUNT(CASE WHEN winner_id = user_id THEN 1 END), COUNT(*)) as win_rate
        FROM (
            SELECT attacker_id as user_id, winner_id FROM battles
            UNION ALL
            SELECT defender_id as user_id, winner_id FROM battles
        ) all_battles
        GROUP BY user_id
    ) battle_stats ON u.id = battle_stats.user_id
    WHERE u.is_active = true
    AND (p_faction IS NULL OR u.faction = p_faction)
    ORDER BY u.stg_balance DESC, u.level DESC, u.experience DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MAINTENANCE AND AUTO-CLEANUP
-- ============================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete battles older than 1 year
    DELETE FROM battles 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND status IN ('completed', 'cancelled');
    
    -- Delete audit logs older than 6 months
    DELETE FROM audit_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Delete old user missions (completed > 30 days)
    DELETE FROM user_missions 
    WHERE is_completed = true 
    AND claimed_at < NOW() - INTERVAL '30 days';
    
    -- Update table statistics
    ANALYZE users;
    ANALYZE battles;
    ANALYZE transactions;
    ANALYZE territories;
    
    RAISE NOTICE 'Old data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run weekly (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT cleanup_old_data();');

-- ============================================================================
-- PERFORMANCE TUNING SETTINGS
-- ============================================================================

-- Recommended PostgreSQL configuration for gaming workloads
-- Add these to postgresql.conf:

-- shared_buffers = 256MB (25% of RAM on 1GB system)
-- effective_cache_size = 1GB (75% of RAM)
-- work_mem = 4MB (for complex joins and sorts)
-- maintenance_work_mem = 64MB (for index creation)
-- checkpoint_completion_target = 0.9 (smoother writes)
-- wal_buffers = 16MB
-- default_statistics_target = 100 (better query planning)
-- random_page_cost = 1.1 (SSD optimization)
-- effective_io_concurrency = 200 (SSD optimization)

-- ============================================================================
-- INDEX MAINTENANCE
-- ============================================================================

-- Function to rebuild fragmented indexes
CREATE OR REPLACE FUNCTION rebuild_fragmented_indexes()
RETURNS TABLE(index_name TEXT, fragmentation_pct NUMERIC) AS $$
DECLARE
    idx_record RECORD;
BEGIN
    FOR idx_record IN 
        SELECT 
            schemaname || '.' || indexname as index_name,
            pg_stat_get_index_pages(idx_record.indexrelid) * 8192 as index_size,
            pg_stat_get_index_tuples(idx_record.indexrelid) as tuple_count
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        AND idx_scan > 0
    LOOP
        -- Rebuild index if fragmentation is high
        IF idx_record.tuple_count > 1000 THEN
            EXECUTE 'REINDEX INDEX CONCURRENTLY ' || idx_record.index_name;
            RETURN NEXT idx_record.index_name, 0; -- Reset fragmentation after rebuild
        ELSE
            RETURN NEXT idx_record.index_name, 0;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'PostgreSQL Optimization Complete!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Advanced indexes created';
    RAISE NOTICE '✅ Partial indexes optimized';
    RAISE NOTICE '✅ Expression indexes added';
    RAISE NOTICE '✅ Covering indexes implemented';
    RAISE NOTICE '✅ Table partitioning setup';
    RAISE NOTICE '✅ Performance monitoring enabled';
    RAISE NOTICE '✅ Custom functions created';
    RAISE NOTICE '✅ Maintenance procedures ready';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Run ANALYZE after data changes';
    RAISE NOTICE 'Monitor performance_stats view';
    RAISE NOTICE 'Schedule cleanup_old_data() regularly';
    RAISE NOTICE '===========================================';
END $$;
